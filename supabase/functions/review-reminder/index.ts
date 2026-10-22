import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'
import { internalError } from '../_shared/http.ts'
import { FAN_OUT_CONCURRENCY, forEachLimit } from '../_shared/for-each-limit.ts'
import { secretMatches } from '../_shared/timing-safe-equal.ts'
import {
  deliverNotification,
  loadWorkspacePrefsMap,
} from '../_shared/deliver-notification.ts'
import type { SupabaseAdminClient } from '../_shared/supabase-admin.ts'
import { appTodayYmd, formatYmd } from '../_shared/credit-card-cycle.ts'
import {
  corpoDoLembrete,
  pessoasParaLembrar,
  TITULO_DO_LEMBRETE,
  type PessoaParaLembrar,
} from '../_shared/review-reminder.ts'

// O lembrete das 20h (cron `review-reminder-daily`): cada pessoa que lançou
// itens `needs_review`, por carteira, recebe um aviso por dia. Só o servidor
// chama: sem CORS.
const corsHeaders = {} as Record<string, string>

const PAGE_SIZE = 500

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

type DedupeRow = { user_id: string; workspace_id: string; sent_on: string }

async function claimDedupe(admin: SupabaseAdminClient, row: DedupeRow): Promise<boolean> {
  const { error } = await admin.from('review_reminder_dedupe').insert(row)
  if (error?.code === '23505') return false
  if (error) throw new Error(error.message)
  return true
}

/** Desfaz o dedupe quando a entrega falhou, para o próximo disparo tentar de novo. */
async function releaseDedupe(admin: SupabaseAdminClient, row: DedupeRow): Promise<void> {
  try {
    const { error } = await admin
      .from('review_reminder_dedupe')
      .delete()
      .eq('user_id', row.user_id)
      .eq('workspace_id', row.workspace_id)
      .eq('sent_on', row.sent_on)
    if (error) console.error('review-reminder: releaseDedupe failed:', error.message)
  } catch (e) {
    console.error('review-reminder: releaseDedupe failed:', e)
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  if (!secretMatches(Deno.env.get('CRON_SECRET'), req.headers.get('x-cron-secret'))) {
    return json(401, { error: 'Unauthorized' })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, serviceKey)

  const sentOn = formatYmd(appTodayYmd())

  // 1. Os itens a conferir, paginados por chave (`id > último`): um item
  //    confirmado durante a varredura não desloca as páginas seguintes.
  const linhas: Array<{ user_id: string; workspace_id: string }> = []
  let lastId: string | null = null
  for (;;) {
    let q = admin
      .from('transactions')
      .select('id, user_id, workspace_id')
      .eq('needs_review', true)
    if (lastId) q = q.gt('id', lastId)
    const { data, error } = await q.order('id', { ascending: true }).limit(PAGE_SIZE)

    if (error) return json(500, { error: internalError('review-reminder', error) })

    const batch = (data ?? []) as Array<{ id: string; user_id: string | null; workspace_id: string | null }>
    for (const l of batch) {
      if (l.user_id && l.workspace_id) linhas.push({ user_id: l.user_id, workspace_id: l.workspace_id })
    }
    if (batch.length < PAGE_SIZE) break
    lastId = batch[batch.length - 1].id
  }

  const porCarteira = new Map<string, PessoaParaLembrar[]>()
  for (const p of pessoasParaLembrar(linhas)) {
    const lista = porCarteira.get(p.workspaceId) ?? []
    lista.push(p)
    porCarteira.set(p.workspaceId, lista)
  }

  // 2. Por carteira: membros, preferências e e-mails uma vez; a falha de um
  //    aviso não derruba os outros.
  // A resposta só conta as falhas; o detalhe vai para o log do servidor.
  let notified = 0
  let failures = 0

  await forEachLimit(porCarteira, FAN_OUT_CONCURRENCY, async ([workspaceId, pessoas]) => {
    try {
      const ids = pessoas.map((p) => p.userId)
      // Quem saiu da carteira não é lembrado dos itens que deixou lá.
      const { data: memberRows, error: mErr } = await admin
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', workspaceId)
        .in('user_id', ids)
      if (mErr) throw new Error(mErr.message)
      const membros = new Set((memberRows ?? []).map((m: { user_id: string }) => m.user_id))
      const ativos = pessoas.filter((p) => membros.has(p.userId))
      if (ativos.length === 0) return

      const ativosIds = ativos.map((p) => p.userId)
      const prefsMap = await loadWorkspacePrefsMap(admin, workspaceId, ativosIds)

      const emails = new Map<string, string | null>()
      const { data: profRows, error: pErr } = await admin
        .from('profiles')
        .select('id,email')
        .in('id', ativosIds)
      if (pErr) throw new Error(pErr.message)
      for (const p of profRows ?? []) {
        emails.set(p.id as string, ((p.email as string | null) ?? '').trim() || null)
      }

      for (const pessoa of ativos) {
        const prefs = prefsMap.get(pessoa.userId)
        if (!prefs || prefs.notify_review === false) continue
        if (!prefs.notify_in_app && !prefs.notify_email && !prefs.notify_push) continue

        const dedupeRow: DedupeRow = { user_id: pessoa.userId, workspace_id: workspaceId, sent_on: sentOn }

        try {
          const claimed = await claimDedupe(admin, dedupeRow)
          if (!claimed) continue

          const delivered = await deliverNotification({
            supabaseAdmin: admin,
            userId: pessoa.userId,
            userEmail: emails.get(pessoa.userId) ?? null,
            workspaceId,
            type: 'review',
            title: TITULO_DO_LEMBRETE,
            body: corpoDoLembrete(pessoa.total),
            metadata: { href: '/transactions?conferir=1' },
            prefs,
          })

          if (!delivered.ok) {
            await releaseDedupe(admin, dedupeRow)
            console.error('review-reminder: delivery', workspaceId, pessoa.userId, delivered.error)
            failures += 1
            continue
          }
          notified += 1
        } catch (e) {
          await releaseDedupe(admin, dedupeRow)
          const msg = e instanceof Error ? e.message : 'delivery_failed'
          console.error('review-reminder: delivery', workspaceId, pessoa.userId, msg)
          failures += 1
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'workspace_failed'
      console.error('review-reminder: workspace', workspaceId, msg)
      failures += 1
    }
  })

  return json(200, {
    ok: true,
    notified,
    items_scanned: linhas.length,
    workspaces: porCarteira.size,
    failures,
    today: sentOn,
  })
})
