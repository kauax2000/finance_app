/**
 * O webhook do Asaas (Bloco 8): os eventos de pagamento mudam a linha da
 * pessoa em `billing_subscriptions`. Só o Asaas chama, com o `authToken` no
 * cabeçalho `asaas-access-token`: sem JWT nem CORS.
 *
 * Ordem: método → token → corpo → evento gravado (o repetido para aqui) →
 * linha → cliente → registro do parcelamento (Ruling 9; o desconhecido da
 * própria linha e do próprio cliente entra nele, Ruling 15) → efeitoDoEvento →
 * gravação condicional, ou o estorno do pagamento em dobro (Ruling 8 e 10).
 *
 * Só o token errado volta 401. Todo caminho tratado volta exatamente 200, até a
 * referência estranha e o estorno que falhou (fica 'pendente' para o
 * `billing-daily`): a fila do Asaas pausa depois de 15 respostas que não são
 * 200. O 500 é só o erro de banco, e ele apaga o evento gravado para a nova
 * tentativa não parar no "repetido".
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'
import { configDoAsaas, estornarNoAsaas } from '../_shared/asaas.ts'
import {
  type Assinatura,
  AVISOS,
  efeitoDoEvento,
  eventoDaLinha,
  type Pagamento,
  pagamentoEmDobro,
  type Parcelamento,
} from '../_shared/billing.ts'
import { deliverNotification } from '../_shared/deliver-notification.ts'
import { internalError, lerCorpo } from '../_shared/http.ts'
import type { SupabaseAdminClient } from '../_shared/supabase-admin.ts'
import { secretMatches } from '../_shared/timing-safe-equal.ts'

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } })
}

const ignorado = (motivo: string) => json(200, { ok: true, ignorado: motivo })
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** O cliente de serviço, com o pedaço do `auth` que o aviso usa (o e-mail da pessoa). */
type Admin = SupabaseAdminClient & {
  auth: { admin: { getUserById(id: string): Promise<{ data: { user: { email?: string | null } | null } }> } }
}
type Linha = Assinatura & { asaas_customer_id: string | null; updated_at: string }

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  if (!secretMatches(Deno.env.get('ASAAS_WEBHOOK_TOKEN'), req.headers.get('asaas-access-token'))) {
    return json(401, { error: 'Unauthorized' })
  }

  // Um corpo que não se lê não melhora numa nova tentativa: 200.
  const bruto = await lerCorpo(req, 65536)
  if (bruto == null) return ignorado('corpo')
  let id: unknown
  let event: unknown
  let payment: unknown
  try {
    ;({ id, event, payment } = JSON.parse(new TextDecoder().decode(bruto)) ?? {})
  } catch {
    return ignorado('corpo')
  }
  if (typeof id !== 'string' || !id || typeof event !== 'string') return ignorado('evento')

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // O Asaas entrega ao menos uma vez: o `id` do evento é o dedupe.
  const { error: insErr } = await admin.from('billing_events').insert({ id, tipo: event })
  if (insErr?.code === '23505') return json(200, { ok: true, repetido: true })
  if (insErr) return json(500, { error: internalError('asaas-webhook: evento', insErr) })

  /** Apaga o evento gravado em `billing_events`, para o Asaas tentar de novo. */
  const esquecer = async (evento: string) => {
    try {
      const { error } = await admin.from('billing_events').delete().eq('id', evento)
      if (error) console.error('asaas-webhook: esquecer', error.message)
    } catch (e) {
      console.error('asaas-webhook: esquecer', e)
    }
  }

  try {
    return await tratar(admin, event, payment as Pagamento | null | undefined)
  } catch (e) {
    await esquecer(id)
    return json(500, { error: internalError('asaas-webhook', e) })
  }
})

async function tratar(
  admin: Admin,
  event: string,
  payment: Pagamento | null | undefined,
): Promise<Response> {
  // Uma referência que não é uuid derrubaria a consulta e travaria a fila.
  if (!payment?.externalReference || !UUID.test(payment.externalReference)) return ignorado('referencia')
  const confirmado = event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED'
  const parcelamento = payment.installment

  // A gravação é condicional ao que foi lido: se o cron ou o checkout mudou a linha no meio, relê uma vez.
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    const { data, error } = await admin
      .from('billing_subscriptions')
      .select('*')
      .eq('id', payment.externalReference)
      .maybeSingle()
    if (error) throw new Error(`linha: ${error.message}`)
    const linha = data as Linha | null
    // N1: antes do registro da Ruling 15 e de qualquer estorno.
    if (!linha || !eventoDaLinha(linha, payment)) return ignorado('linha')

    // Ruling 9: o pagamento de outro parcelamento é decidido pelo registro.
    let registro: Parcelamento | null = null
    if (confirmado && parcelamento) {
      if (parcelamento === linha.provider_ref) {
        // As parcelas mensais do plano: nada a mudar, e o ativado_em que faltou se conserta aqui.
        await marcarAtivado(admin, parcelamento)
      } else {
        const lerRegistro = async () => {
          const { data: r, error: rErr } = await admin
            .from('billing_parcelamentos')
            .select('*')
            .eq('installment', parcelamento)
            .maybeSingle()
          if (rErr) throw new Error(`parcelamento: ${rErr.message}`)
          return r as Parcelamento | null
        }
        registro = await lerRegistro()
        // Ruling 15: a referência é a linha e o cliente é o dela (conferidos acima), e só nós criamos essa
        // cobrança. O registro que o cron faz depois da resposta pode chegar atrás deste evento.
        if (!registro) {
          const { error: iErr } = await admin
            .from('billing_parcelamentos')
            .insert({ installment: parcelamento, subscription_id: linha.id })
          if (iErr && iErr.code !== '23505') throw new Error(`parcelamento novo: ${iErr.message}`)
          registro = await lerRegistro()
        }
        if (!registro || registro.subscription_id !== linha.id) {
          console.error('asaas-webhook: parcelamento desconhecido', linha.id, parcelamento)
          return ignorado('parcelamento')
        }
        // Já ativado: a parcela mensal de um período que passou (a de X depois da renovação Y).
        if (registro.ativado_em) return json(200, { ok: true })
      }
    }

    const agora = new Date()
    const mudanca = efeitoDoEvento(event, payment, linha, agora)
    if (!mudanca) {
      // A trava do provider_ref se repete aqui de propósito: o estorno não depende só da função pura.
      if (
        registro && pagamentoEmDobro(event, payment, linha, registro, agora) &&
        payment.installment !== linha.provider_ref
      ) {
        return await estornar(admin, linha, registro)
      }
      return json(200, { ok: true })
    }

    const mudar = {
      ...mudanca,
      updated_at: agora.toISOString(),
      ...(mudanca.status === 'active' ? { checkout_url: null } : {}),
    }
    let q = admin.from('billing_subscriptions').update(mudar)
      .eq('id', linha.id)
      .eq('updated_at', linha.updated_at)
      .eq('status', linha.status)
    for (const col of ['provider_ref', 'current_period_end'] as const) {
      q = linha[col] === null ? q.is(col, null) : q.eq(col, linha[col])
    }
    const { data: gravou, error: uErr } = await q.select('id')
    if (uErr) throw new Error(`gravar: ${uErr.message}`)
    if (gravou?.length) {
      if (mudanca.provider_ref) await marcarAtivado(admin, mudanca.provider_ref)
      return json(200, { ok: true, mudou: true })
    }
  }
  throw new Error('a linha mudou duas vezes durante o evento')
}

/** O parcelamento ativou a linha: daqui em diante, os eventos dele são mensais. */
async function marcarAtivado(admin: Admin, parcelamento: string): Promise<void> {
  const { error } = await admin
    .from('billing_parcelamentos')
    .update({ ativado_em: new Date().toISOString() })
    .eq('installment', parcelamento)
    .is('ativado_em', null)
  if (error) throw new Error(`ativado_em: ${error.message}`)
}

/**
 * Ruling 8 e 10: um parcelamento nosso nunca ativado, pago com a linha já paga
 * no período, é cobrança em dobro e volta ao cartão. O estorno é reivindicado no
 * registro (`estorno_status` nulo → 'pendente'), então as 12 parcelas o pedem
 * uma vez. Lê o parcelamento antes de pedir: um pedido que estourou o prazo pode
 * já ter sido feito. Qualquer problema deixa o estorno 'pendente', que o
 * `billing-daily` tenta de novo, e responde 200: a fila do Asaas nunca pausa
 * por um estorno.
 */
async function estornar(admin: Admin, linha: Linha, registro: Parcelamento): Promise<Response> {
  const parcelamento = registro.installment
  const pendente = (motivo: string) => json(200, { ok: true, estorno: 'pendente', motivo })
  if (registro.estorno_status) return json(200, { ok: true, estorno: registro.estorno_status })

  const { data: meu, error: cErr } = await admin
    .from('billing_parcelamentos')
    .update({ estorno_status: 'pendente', estorno_tentado_em: new Date().toISOString() })
    .eq('installment', parcelamento)
    .is('estorno_status', null)
    .select('installment')
  if (cErr) throw new Error(`estorno: ${cErr.message}`)
  if (!meu?.length) return json(200, { ok: true, estorno: 'ja_pedido' })

  console.error('asaas-webhook: pagamento em dobro, estornando', linha.id, parcelamento)
  const cfg = configDoAsaas()
  if (!cfg) {
    console.error('asaas-webhook: estorno sem ASAAS_API_URL/ASAAS_API_KEY', linha.id, parcelamento)
    return pendente('config')
  }

  const r = await estornarNoAsaas(cfg, parcelamento, linha.asaas_customer_id)
  if (!r.ok) {
    console.error('asaas-webhook: estorno', r.etapa, linha.id, parcelamento, r.status, r.erros)
    return pendente(r.etapa)
  }

  // Falhou a marca, o billing-daily lê o parcelamento, acha o estorno e marca.
  const { error: fErr } = await admin
    .from('billing_parcelamentos')
    .update({ estorno_status: 'feito' })
    .eq('installment', parcelamento)
  if (fErr) console.error('asaas-webhook: marcar o estorno', linha.id, parcelamento, fErr.message)

  await avisarDoEstorno(admin, linha.user_id)
  return json(200, { ok: true, estornado: true })
}

/** O estorno já foi pedido: uma falha no aviso só vai ao log. */
async function avisarDoEstorno(admin: Admin, userId: string): Promise<void> {
  try {
    const { data: carteira, error } = await admin
      .from('workspaces')
      .select('id')
      .eq('created_by', userId)
      .eq('type', 'personal')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (error || !carteira) {
      console.error('asaas-webhook: aviso sem carteira pessoal', userId, error?.message)
      return
    }
    const { data: pessoa } = await admin.auth.admin.getUserById(userId)
    const { titulo, corpo } = AVISOS.estorno()
    const entregue = await deliverNotification({
      supabaseAdmin: admin,
      userId,
      userEmail: pessoa?.user?.email ?? null,
      workspaceId: carteira.id,
      type: 'system',
      title: titulo,
      body: corpo,
      metadata: { href: '/plans' },
      essencial: true,
    })
    if (!entregue.ok) console.error('asaas-webhook: aviso', userId, entregue.error)
  } catch (e) {
    console.error('asaas-webhook: aviso', userId, e instanceof Error ? e.message : e)
  }
}
