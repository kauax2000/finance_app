import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'
import { internalError } from '../_shared/http.ts'
import { FAN_OUT_CONCURRENCY, forEachLimit } from '../_shared/for-each-limit.ts'
import { secretMatches } from '../_shared/timing-safe-equal.ts'
import { deliverNotification } from '../_shared/deliver-notification.ts'
import type { SupabaseAdminClient } from '../_shared/supabase-admin.ts'
import { avisoDoTeste, type RelatorioDoTeste } from '../_shared/plano.ts'

// O cron diário dos planos (9h em Brasília): hoje só o aviso do dia 12 do
// teste, com o relatório do que o app fez. O Bloco 8 acrescenta a renovação.
// Só o servidor chama: sem CORS.
const corsHeaders = {} as Record<string, string>

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

type AvisoPendente = {
  user_id: string
  email: string | null
  workspace_id: string
  fim_do_teste: string
  relatorio: RelatorioDoTeste
}

type DedupeRow = { user_id: string; tipo: string; referencia: string }

async function claimDedupe(admin: SupabaseAdminClient, row: DedupeRow): Promise<boolean> {
  const { error } = await admin.from('billing_avisos').insert(row)
  if (error?.code === '23505') return false
  if (error) throw new Error(error.message)
  return true
}

/** Desfaz o dedupe quando a entrega falhou, para o próximo disparo tentar de novo. */
async function releaseDedupe(admin: SupabaseAdminClient, row: DedupeRow): Promise<void> {
  try {
    const { error } = await admin
      .from('billing_avisos')
      .delete()
      .eq('user_id', row.user_id)
      .eq('tipo', row.tipo)
      .eq('referencia', row.referencia)
    if (error) console.error('billing-daily: releaseDedupe failed:', error.message)
  } catch (e) {
    console.error('billing-daily: releaseDedupe failed:', e)
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  if (!secretMatches(Deno.env.get('CRON_SECRET'), req.headers.get('x-cron-secret'))) {
    return json(401, { error: 'Unauthorized' })
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // Cobrança desligada: nada a avisar.
  const { data: config, error: cErr } = await admin
    .from('billing_settings')
    .select('enforced_since')
    .maybeSingle()
  if (cErr) return json(500, { error: internalError('billing-daily', cErr) })
  if (!config?.enforced_since) return json(200, { ok: true, pulado: 'desligado' })

  const { data, error } = await admin.rpc('avisos_de_teste_pendentes')
  if (error) return json(500, { error: internalError('billing-daily', error) })
  const pendentes = (data ?? []) as AvisoPendente[]

  let avisos = 0
  let failures = 0

  await forEachLimit(pendentes, FAN_OUT_CONCURRENCY, async (p) => {
    const dedupe: DedupeRow = {
      user_id: p.user_id,
      tipo: 'teste',
      referencia: p.fim_do_teste.slice(0, 10),
    }
    try {
      if (!(await claimDedupe(admin, dedupe))) return

      const { titulo, corpo } = avisoDoTeste(p.relatorio)
      const delivered = await deliverNotification({
        supabaseAdmin: admin,
        userId: p.user_id,
        userEmail: p.email,
        workspaceId: p.workspace_id,
        type: 'system',
        title: titulo,
        body: corpo,
        metadata: { href: '/plans' },
        essencial: true,
      })

      if (!delivered.ok) {
        await releaseDedupe(admin, dedupe)
        console.error('billing-daily: delivery', p.user_id, delivered.error)
        failures += 1
        return
      }
      avisos += 1
    } catch (e) {
      await releaseDedupe(admin, dedupe)
      console.error('billing-daily: delivery', p.user_id, e instanceof Error ? e.message : 'delivery_failed')
      failures += 1
    }
  })

  return json(200, { ok: true, avisos, failures })
})
