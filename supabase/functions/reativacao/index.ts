import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'
import { internalError } from '../_shared/http.ts'
import { FAN_OUT_CONCURRENCY, forEachLimit } from '../_shared/for-each-limit.ts'
import { secretMatches } from '../_shared/timing-safe-equal.ts'
import type { SupabaseAdminClient } from '../_shared/supabase-admin.ts'
import { appTodayYmd, diffCalendarDays, formatYmd } from '../_shared/credit-card-cycle.ts'
import { buildPushPayload, sendWebPushToUser } from '../_shared/web-push-send.ts'
import { marcoDoDia, podeAvisar, textoDoAviso } from '../_shared/reativacao.ts'

// Os avisos de reativação do meio-dia (cron `reativacao-daily`): push para
// quem está há 3 (de 3 a 6) e há 7 (de 7 a 9) dias sem acesso, uma vez por
// ausência. Só o servidor chama: sem CORS.
const corsHeaders = {} as Record<string, string>

const PAGE_SIZE = 500
const MS_DAY = 24 * 60 * 60 * 1000

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

type Candidato = { user_id: string; ultimo_acesso_em: string; current_workspace_id: string | null }
type EnvioRow = { user_id: string; marco: 3 | 7; referente: string }

async function claimEnvio(admin: SupabaseAdminClient, row: EnvioRow): Promise<boolean> {
  const { error } = await admin.from('reativacao_envios').insert(row)
  if (error?.code === '23505') return false
  if (error) throw new Error(error.message)
  return true
}

/** Desfaz o envio quando nenhum push saiu, para o próximo disparo tentar de novo. */
async function releaseEnvio(admin: SupabaseAdminClient, row: EnvioRow): Promise<void> {
  try {
    const { error } = await admin
      .from('reativacao_envios')
      .delete()
      .eq('user_id', row.user_id)
      .eq('marco', row.marco)
      .eq('referente', row.referente)
    if (error) console.error('reativacao: releaseEnvio failed:', error.message)
  } catch (e) {
    console.error('reativacao: releaseEnvio failed:', e)
  }
}

/** A carteira do aviso, ou null quando nenhuma tem `notify_review` e `notify_push` ligados. */
async function carteiraDoAviso(admin: SupabaseAdminClient, c: Candidato): Promise<string | null> {
  const { data: membros, error: mErr } = await admin
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', c.user_id)
    .order('joined_at', { ascending: true })
  if (mErr) throw new Error(mErr.message)
  const carteiras: string[] = (membros ?? []).map((m: { workspace_id: string }) => m.workspace_id)
  if (carteiras.length === 0) return null

  const { data: prefs, error: pErr } = await admin
    .from('workspace_member_notification_prefs')
    .select('workspace_id, notify_review, notify_push')
    .eq('user_id', c.user_id)
  if (pErr) throw new Error(pErr.message)
  type PrefsRow = { workspace_id: string; notify_review: boolean | null; notify_push: boolean | null }
  const prefsPorCarteira = new Map(((prefs ?? []) as PrefsRow[]).map((p) => [p.workspace_id, p]))
  // Só carteira com o aviso e o push ligados; sem linha, o padrão (push desligado).
  const liberadas = carteiras.filter((w) => podeAvisar(prefsPorCarteira.get(w)))
  if (liberadas.length === 0) return null

  return c.current_workspace_id && liberadas.includes(c.current_workspace_id)
    ? c.current_workspace_id
    : liberadas[0]
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

  const now = new Date()
  const today = appTodayYmd(now)

  // 1. Quem está na janela (com folga de um dia em cada ponta: a conta exata
  //    é pela data de Brasília, logo abaixo), paginado por chave.
  const desde = new Date(now.getTime() - 11 * MS_DAY).toISOString()
  const ate = new Date(now.getTime() - 2 * MS_DAY).toISOString()
  const candidatos: Candidato[] = []
  let lastId: string | null = null
  for (;;) {
    let q = admin
      .from('user_settings')
      .select('user_id, ultimo_acesso_em, current_workspace_id')
      .gte('ultimo_acesso_em', desde)
      .lte('ultimo_acesso_em', ate)
    if (lastId) q = q.gt('user_id', lastId)
    const { data, error } = await q.order('user_id', { ascending: true }).limit(PAGE_SIZE)

    if (error) return json(500, { error: internalError('reativacao', error) })

    const batch = (data ?? []) as Candidato[]
    candidatos.push(...batch)
    if (batch.length < PAGE_SIZE) break
    lastId = batch[batch.length - 1].user_id
  }

  // 2. Por pessoa; a falha de uma não derruba as outras. A resposta só conta
  //    as falhas; o detalhe vai para o log do servidor.
  let notified = 0
  let failures = 0

  await forEachLimit(candidatos, FAN_OUT_CONCURRENCY, async (c) => {
    const ultimoAcesso = appTodayYmd(new Date(c.ultimo_acesso_em))
    const referente = formatYmd(ultimoAcesso)
    const marco = marcoDoDia(diffCalendarDays(ultimoAcesso, today))
    if (!marco) return

    const envio: EnvioRow = { user_id: c.user_id, marco, referente }
    let claimed = false
    try {
      const { count, error: sErr } = await admin
        .from('push_subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', c.user_id)
      if (sErr) throw new Error(sErr.message)
      if (!count) return

      const workspaceId = await carteiraDoAviso(admin, c)
      if (!workspaceId) return

      claimed = await claimEnvio(admin, envio)
      if (!claimed) return

      const { titulo, corpo } = textoDoAviso(marco, referente)
      const { sent } = await sendWebPushToUser({
        supabaseAdmin: admin,
        userId: c.user_id,
        payload: buildPushPayload({
          title: titulo,
          body: corpo,
          workspaceId,
          type: 'system',
          metadata: { href: '/dashboard', kind: 'reativacao' },
        }),
      })

      if (sent === 0) {
        await releaseEnvio(admin, envio)
        console.error('reativacao: no push delivered', c.user_id, marco)
        failures += 1
        return
      }
      notified += 1
    } catch (e) {
      if (claimed) await releaseEnvio(admin, envio)
      const msg = e instanceof Error ? e.message : 'delivery_failed'
      console.error('reativacao: user', c.user_id, msg)
      failures += 1
    }
  })

  return json(200, {
    ok: true,
    notified,
    candidates: candidatos.length,
    failures,
    today: formatYmd(today),
  })
})
