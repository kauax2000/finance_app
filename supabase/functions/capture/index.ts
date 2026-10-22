/**
 * Captura sem abrir o app: o Atalho do iPhone manda a frase (ou os dados do
 * Apple Pay) com o token pessoal `fac_…`, e a função grava o lançamento como a
 * pessoa. A regra mora em `_shared/captura.ts`; aqui é só I/O.
 *
 * Usa a service role, então repete o que a RLS garantiria (Decisão 8): o autor é
 * o dono do token, e a carteira de destino é uma das dele. O aviso aos membros
 * sai do trigger `transactions_notify_created`, não daqui.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'
import { clientIdDoPedido, montarLancamento, validarPedido } from '../_shared/captura.ts'
import { appTodayYmd, formatYmd } from '../_shared/credit-card-cycle.ts'
import type { CartaoParaCasar, LinhaHistorico } from '../_shared/frase.ts'
import { internalError } from '../_shared/http.ts'
import { sha256Hex } from '../_shared/token-hash.ts'

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const MAX_CORPO = 16 * 1024
const HISTORICO_POR_CARTEIRA = 300
const TOKEN_INVALIDO = () => json(401, { error: 'Token inválido.' })

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  if (Number(req.headers.get('content-length') ?? 0) > MAX_CORPO) {
    return json(413, { error: 'Corpo acima de 16 KB.' })
  }
  const bruto = await req.text()
  if (new TextEncoder().encode(bruto).length > MAX_CORPO) return json(413, { error: 'Corpo acima de 16 KB.' })

  // Revogado, desconhecido ou mal formado: a mesma resposta (Foco 2).
  const token = req.headers.get('Authorization')?.match(/^Bearer\s+(fac_[0-9a-f]{64})$/)?.[1]
  if (!token) return TOKEN_INVALIDO()
  const tokenHash = await sha256Hex(token)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: tok, error: tokErr } = await admin
    .from('capture_tokens')
    .select('id, user_id, workspace_id')
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)
    .maybeSingle()
  if (tokErr) return json(500, { error: internalError('capture: token', tokErr) })
  if (!tok) return TOKEN_INVALIDO()
  const { id: tokenId, user_id: userId, workspace_id: carteiraPadrao } = tok as {
    id: string
    user_id: string
    workspace_id: string
  }

  // O plano é o da carteira padrão do token (spec §9), antes de tudo.
  const { data: plano, error: planoErr } = await admin.rpc('workspace_plan', { p_workspace_id: carteiraPadrao })
  if (planoErr) return json(500, { error: internalError('capture: plano', planoErr) })
  if (!plano) return json(402, { error: 'Sem plano ativo nesta carteira.' })

  const { data: membros, error: memErr } = await admin
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
  if (memErr) return json(500, { error: internalError('capture: membro', memErr) })
  const carteirasDaPessoa = (membros ?? []).map((m: { workspace_id: string }) => m.workspace_id)
  // Saiu da carteira padrão: o token não vale mais.
  if (!carteirasDaPessoa.includes(carteiraPadrao)) return TOKEN_INVALIDO()

  let corpo: unknown
  try {
    corpo = JSON.parse(bruto)
  } catch {
    return json(422, { error: 'Corpo inválido.' })
  }
  const validado = validarPedido(corpo)
  if (!validado.ok) return json(422, { error: validado.erro })
  const pedido = validado.pedido

  const { data: cartoes, error: cErr } = await admin
    .from('credit_cards')
    .select('id, name, wallet_alias, last_four, workspace_id, is_active')
    .in('workspace_id', carteirasDaPessoa)
    .eq('is_active', true)
  if (cErr) return json(500, { error: internalError('capture: cartões', cErr) })

  // ponytail: o histórico de todas as carteiras da pessoa (o destino só se sabe
  // depois de casar o cartão); uma família tem poucas. Se crescer, casar antes.
  const historicos = await Promise.all(
    carteirasDaPessoa.map((w: string) =>
      admin
        .from('transactions')
        .select('description, category_id, payment_method, payment_credit_card_id, date, type')
        .eq('workspace_id', w)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(HISTORICO_POR_CARTEIRA),
    ),
  )
  const historicoPorCarteira: Record<string, LinhaHistorico[]> = {}
  for (const [i, r] of historicos.entries()) {
    if (r.error) return json(500, { error: internalError('capture: histórico', r.error) })
    historicoPorCarteira[carteirasDaPessoa[i]] = (r.data ?? []) as LinhaHistorico[]
  }

  const montado = montarLancamento(pedido, {
    userId,
    carteiraPadrao,
    carteirasDaPessoa,
    cartoes: (cartoes ?? []) as CartaoParaCasar[],
    historicoPorCarteira,
    hoje: formatYmd(appTodayYmd()),
  })
  if (!montado.ok) return json(montado.status, { error: montado.erro })
  const { linha, resumo } = montado

  // Com `id`, o retry do Atalho cai no mesmo `client_id` e não duplica (Foco 1);
  // sem `id`, `client_id` nulo nunca conflita, e cada pedido é um lançamento.
  const clientId = pedido.id ? await clientIdDoPedido(tokenId, pedido.id) : null
  const { data: inseridos, error: insErr } = await admin
    .from('transactions')
    .upsert({ ...linha, client_id: clientId }, { onConflict: 'workspace_id,client_id', ignoreDuplicates: true })
    .select('id, needs_review')
  if (insErr) return json(500, { error: internalError('capture: insert', insErr) })

  let gravado = (inseridos ?? [])[0] as { id: string; needs_review: boolean } | undefined
  const novo = gravado != null
  if (!gravado) {
    const { data: existente, error: lerErr } = await admin
      .from('transactions')
      .select('id, needs_review')
      .eq('workspace_id', linha.workspace_id)
      .eq('client_id', clientId)
      .maybeSingle()
    if (lerErr || !existente) return json(500, { error: internalError('capture: retry', lerErr ?? 'sem linha') })
    gravado = existente as { id: string; needs_review: boolean }
  }

  const { error: usoErr } = await admin
    .from('capture_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', tokenId)
  if (usoErr) console.error('capture: last_used_at', usoErr)

  // Os alertas de orçamento e de limite, como o front faz depois de salvar uma
  // despesa. Falha só vira log.
  if (novo && linha.type === 'expense') {
    const avaliar = (fn: string, body: Record<string, unknown>) =>
      fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/${fn}`, {
        method: 'POST',
        signal: AbortSignal.timeout(10_000),
        headers: { 'Content-Type': 'application/json', 'x-cron-secret': Deno.env.get('CRON_SECRET') ?? '' },
        body: JSON.stringify(body),
      })
        .then((r) => {
          if (!r.ok) console.error(`capture: ${fn}`, r.status)
        })
        .catch((e) => console.error(`capture: ${fn}`, e))
    const chamadas: Promise<void>[] = []
    if (linha.category_id) {
      chamadas.push(avaliar('evaluate-budgets', { category_id: linha.category_id, occurred_at: linha.date }))
    }
    if (linha.payment_credit_card_id) {
      chamadas.push(
        avaliar('evaluate-credit-card-alerts', {
          workspace_id: linha.workspace_id,
          payment_credit_card_id: linha.payment_credit_card_id,
          category_id: linha.category_id,
          occurred_at: linha.date,
        }),
      )
    }
    const todas = Promise.all(chamadas)
    if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(todas)
    else await todas
  }

  return json(200, { ok: true, id: gravado.id, needs_review: gravado.needs_review, resumo })
})
