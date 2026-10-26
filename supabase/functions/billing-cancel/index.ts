/**
 * Cancelar, desfazer e reembolsar o Plano Família (Bloco 8), com o JWT e
 * `{ acao }`:
 * - `cancelar` liga `cancel_at_period_end` no `active` e no `past_due`
 *   (Ruling 11). Um `active` com `grace_until` está com a renovação cobrada e
 *   esperando a confirmação, e é recusado (Ruling 12); uma cobrança que
 *   começou há menos de 5 minutos também (o cron pode estar cobrando o token).
 * - `desfazer` desliga, enquanto o plano não acabou.
 * - `reembolsar` é o arrependimento de 7 dias (`podeReembolsar`): estorna o
 *   parcelamento inteiro do `provider_ref` pela regra da Ruling 10 e, só depois
 *   do estorno confirmado, expira a linha. Toda falha depois da reivindicação
 *   fica 'pendente' e volta 202 (o pedido foi feito dentro do prazo); o `billing-daily` o conclui e expira a
 *   linha (Ruling 13).
 *
 * Toda gravação é condicional ao estado lido: se o webhook ou o cron mudou a
 * linha no meio, a resposta é 409 e a pessoa abre Planos de novo.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'
import { configDoAsaas, estornarNoAsaas } from '../_shared/asaas.ts'
import { bearerJwt, getAuthUserFromJwt } from '../_shared/auth-user.ts'
import {
  type Assinatura,
  AVISOS,
  type Parcelamento,
  podeCancelar,
  podeDesfazer,
  podeReembolsar,
} from '../_shared/billing.ts'
import { deliverNotification } from '../_shared/deliver-notification.ts'
import { internalError, lerCorpo } from '../_shared/http.ts'
import type { SupabaseAdminClient } from '../_shared/supabase-admin.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-session-id',
}

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const MAX_CORPO = 1024
const MUDOU = () => json(409, { error: 'Seu plano mudou agora. Abra Planos de novo.' })
const REEMBOLSO_PEDIDO = () =>
  json(202, { ok: true, pendente: true, mensagem: 'Pedimos o reembolso ao Asaas. Avisamos quando ele for confirmado.' })

type Linha = Assinatura & { asaas_customer_id: string | null }

// Um erro solto viraria 500 sem CORS, que o navegador mostra como "Sem conexão".
Deno.serve(async (req: Request) => {
  try {
    return await atender(req)
  } catch (e) {
    return json(500, { error: internalError('billing-cancel', e) })
  }
})

async function atender(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const jwt = bearerJwt(req.headers.get('Authorization'))
  if (!jwt) return json(401, { error: 'Entre de novo para mudar o plano.' })
  const auth = await getAuthUserFromJwt(supabaseUrl, anonKey, jwt)
  if (!auth.user) return json(401, { error: 'Entre de novo para mudar o plano.' })

  const bruto = await lerCorpo(req, MAX_CORPO)
  if (bruto == null) return json(413, { error: 'Corpo grande demais.' })
  let acao: unknown
  try {
    ;({ acao } = JSON.parse(new TextDecoder().decode(bruto)) ?? {})
  } catch {
    return json(400, { error: 'Corpo inválido.' })
  }
  if (acao !== 'cancelar' && acao !== 'desfazer' && acao !== 'reembolsar') {
    return json(400, { error: 'Ação desconhecida.' })
  }

  const admin = createClient(supabaseUrl, serviceKey)
  const { data, error } = await admin
    .from('billing_subscriptions')
    .select('*')
    .eq('user_id', auth.user.id)
    .maybeSingle()
  if (error) throw new Error(`linha: ${error.message}`)
  const linha = data as Linha | null
  const agora = new Date()

  if (acao === 'cancelar') return await cancelar(admin, linha, agora)
  if (acao === 'desfazer') return await desfazer(admin, linha, agora)
  return await reembolsar(admin, linha, agora, auth.user.email ?? null)
}

async function cancelar(admin: SupabaseAdminClient, linha: Linha | null, agora: Date): Promise<Response> {
  const pode = linha ? podeCancelar(linha, agora) : 'nao'
  if (pode === 'cobrando') {
    return json(409, { error: 'Estamos renovando seu plano agora. Tente cancelar daqui a alguns minutos.' })
  }
  if (pode === 'renovando') {
    return json(409, {
      error:
        'A renovação deste ano já foi cobrada e está sendo confirmada. Depois de confirmada, você pode cancelar a próxima.',
    })
  }
  if (!linha || pode === 'nao') return json(409, { error: 'Não há assinatura para cancelar.' })
  if (linha.cancel_at_period_end) return json(200, { ok: true })

  // A renovação aceita pelo cron no meio grava `grace_until` ou muda o status: aí o cancelamento não vale.
  let q = admin
    .from('billing_subscriptions')
    .update({ cancel_at_period_end: true, updated_at: agora.toISOString() })
    .eq('id', linha.id)
    .eq('status', linha.status)
    .eq('cancel_at_period_end', false)
  // A cobrança do cron que começou depois da leitura grava `checkout_criado_em`: também não vale.
  for (const col of ['grace_until', 'checkout_criado_em'] as const) {
    q = linha[col] === null ? q.is(col, null) : q.eq(col, linha[col])
  }
  const { data, error } = await q.select('id')
  if (error) throw new Error(`cancelar: ${error.message}`)
  return data?.length ? json(200, { ok: true }) : MUDOU()
}

async function desfazer(admin: SupabaseAdminClient, linha: Linha | null, agora: Date): Promise<Response> {
  if (!linha || !podeDesfazer(linha, agora)) return json(409, { error: 'Não há cancelamento para desfazer.' })
  const { data, error } = await admin
    .from('billing_subscriptions')
    .update({ cancel_at_period_end: false, updated_at: agora.toISOString() })
    .eq('id', linha.id)
    .eq('status', linha.status)
    .eq('cancel_at_period_end', true)
    .eq('current_period_end', linha.current_period_end!)
    .select('id')
  if (error) throw new Error(`desfazer: ${error.message}`)
  return data?.length ? json(200, { ok: true }) : MUDOU()
}

async function reembolsar(
  admin: SupabaseAdminClient,
  linha: Linha | null,
  agora: Date,
  email: string | null,
): Promise<Response> {
  const ref = linha?.provider_ref ?? null
  const lerRegistro = async () => {
    const { data, error } = await admin.from('billing_parcelamentos').select('*').eq('installment', ref!).maybeSingle()
    if (error) throw new Error(`parcelamento: ${error.message}`)
    return data as Parcelamento | null
  }
  let registro = ref ? await lerRegistro() : null
  /** Este toque concluiu o estorno: ele avisa (Ruling 16). */
  let concluiu = false

  // O reembolso já pedido não é pedido de novo: o billing-daily o conclui (Ruling 13).
  if (registro?.estorno_status === 'pendente' && registro.subscription_id === linha!.id) return REEMBOLSO_PEDIDO()

  // Ruling 13: só o parcelamento da linha, e só dentro dos 7 dias, antes de qualquer chamada ao Asaas.
  if (!linha || !ref || linha.provider !== 'asaas' || !podeReembolsar(linha, agora)) {
    return json(409, { error: 'O prazo de 7 dias para reembolso terminou.' })
  }
  const cfg = configDoAsaas()
  if (!cfg) return json(503, { error: 'O reembolso ainda não está disponível.' })

  if (registro?.estorno_status !== 'feito') {
    // Todo parcelamento nosso já está no registro (Ruling 9); este insert só cobre o que faltou.
    if (!registro) {
      const { error } = await admin.from('billing_parcelamentos').insert({ installment: ref, subscription_id: linha.id })
      if (error && error.code !== '23505') throw new Error(`parcelamento novo: ${error.message}`)
    }

    // A reivindicação: dois toques seguidos pedem o estorno uma vez só.
    const { data: meu, error: cErr } = await admin
      .from('billing_parcelamentos')
      .update({ estorno_status: 'pendente', estorno_tentado_em: agora.toISOString() })
      .eq('installment', ref)
      .eq('subscription_id', linha.id)
      .is('estorno_status', null)
      .select('installment')
    if (cErr) throw new Error(`reivindicar: ${cErr.message}`)

    if (!meu?.length) {
      registro = await lerRegistro()
      if (registro?.subscription_id !== linha.id) throw new Error('o parcelamento é de outra linha')
      // Só o estorno confirmado expira a linha: o toque que ainda está pedindo volta 202.
      if (registro?.estorno_status !== 'feito') return REEMBOLSO_PEDIDO()
    } else {
      const r = await estornarNoAsaas(cfg, ref, linha.asaas_customer_id)
      if (!r.ok) {
        // O pedido foi feito dentro do prazo: fica pendente em toda falha, e o billing-daily lê antes de pedir.
        console.error('billing-cancel: reembolso', r.etapa, linha.id, ref, r.status, r.erros)
        return REEMBOLSO_PEDIDO()
      }
      // Falhou a marca, o billing-daily lê o parcelamento, acha o estorno e marca.
      const { error: fErr } = await admin
        .from('billing_parcelamentos')
        .update({ estorno_status: 'feito' })
        .eq('installment', ref)
      if (fErr) console.error('billing-cancel: marcar o estorno', linha.id, ref, fErr.message)
      concluiu = true
    }
  }

  // O estorno está confirmado. Zero linhas: o PAYMENT_REFUNDED do webhook já expirou.
  const { error: eErr } = await admin
    .from('billing_subscriptions')
    .update({
      status: 'expired',
      current_period_end: agora.toISOString(),
      cancel_at_period_end: true,
      reembolsavel_ate: null,
      grace_until: null,
      checkout_url: null,
      updated_at: agora.toISOString(),
    })
    .eq('id', linha.id)
    .eq('status', 'active')
    .eq('provider_ref', ref)
  if (eErr) throw new Error(`expirar: ${eErr.message}`)
  if (concluiu) await avisarDoReembolso(admin, linha.user_id, email, ref)
  return json(200, { ok: true })
}

/**
 * Ruling 16: o reembolso concluído, essencial e uma vez por parcelamento
 * (`billing_avisos` 'reembolso', o mesmo dedupe do cron). O estorno já foi
 * feito: uma falha aqui só vai ao log, e libera o dedupe.
 */
async function avisarDoReembolso(
  admin: SupabaseAdminClient,
  userId: string,
  email: string | null,
  ref: string,
): Promise<void> {
  const dedupe = { user_id: userId, tipo: 'reembolso', referencia: ref }
  const soltar = async () => {
    const { error } = await admin.from('billing_avisos').delete()
      .eq('user_id', userId).eq('tipo', 'reembolso').eq('referencia', ref)
    if (error) console.error('billing-cancel: soltar o aviso', userId, error.message)
  }
  try {
    const { data: carteira, error: wErr } = await admin
      .from('workspaces')
      .select('id')
      .eq('created_by', userId)
      .eq('type', 'personal')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (wErr || !carteira) {
      console.error('billing-cancel: aviso sem carteira pessoal', userId, wErr?.message)
      return
    }
    const { error: dErr } = await admin.from('billing_avisos').insert(dedupe)
    if (dErr?.code === '23505') return
    if (dErr) throw new Error(dErr.message)
    const { titulo, corpo } = AVISOS.reembolso()
    const entregue = await deliverNotification({
      supabaseAdmin: admin,
      userId,
      userEmail: email,
      workspaceId: carteira.id,
      type: 'system',
      title: titulo,
      body: corpo,
      metadata: { href: '/plans' },
      essencial: true,
    })
    if (!entregue.ok) {
      console.error('billing-cancel: aviso do reembolso', userId, entregue.error)
      await soltar()
    }
  } catch (e) {
    console.error('billing-cancel: aviso do reembolso', userId, e instanceof Error ? e.message : e)
    await soltar()
  }
}
