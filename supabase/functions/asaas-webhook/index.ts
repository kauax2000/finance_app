/**
 * O webhook do Asaas (Bloco 8): os eventos de pagamento mudam a linha da
 * pessoa em `billing_subscriptions`. Só o Asaas chama, com o `authToken` no
 * cabeçalho `asaas-access-token`: sem JWT nem CORS.
 *
 * Ordem: método → token → corpo → evento gravado (o repetido já processado
 * para aqui; Ruling 25) → linha → cliente → registro do parcelamento (Ruling 9;
 * o desconhecido da própria linha e do próprio cliente entra nele só quando
 * este evento o ativa, Ruling 15 com C1) → efeitoDoEvento → gravação
 * condicional, ou o estorno do pagamento em dobro (Ruling 8 e 10) → evento
 * marcado como processado.
 *
 * Só o token errado volta 401. Todo caminho tratado volta exatamente 200, até a
 * referência estranha e o estorno que falhou (fica 'pendente' para o
 * `billing-daily`): a fila do Asaas pausa depois de 15 respostas que não são
 * 200. O 500 é só o erro de banco, e ele apaga o evento gravado para a nova
 * tentativa não esperar a retomada. O 503 é o evento repetido que outro
 * processo ainda trata (menos de 5 min).
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'
import { configDoAsaas, estornarNoAsaas } from '../_shared/asaas.ts'
import { avisarUmaVez } from '../_shared/aviso-de-cobranca.ts'
import {
  type Assinatura,
  efeitoDoEvento,
  eventoDaLinha,
  type Pagamento,
  pagamentoEmDobro,
  type Parcelamento,
} from '../_shared/billing.ts'
import { internalError, lerCorpo } from '../_shared/http.ts'
import type { SupabaseAdminClient } from '../_shared/supabase-admin.ts'
import { secretMatches } from '../_shared/timing-safe-equal.ts'

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } })
}

const ignorado = (motivo: string) => json(200, { ok: true, ignorado: motivo })
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
/** Um evento repetido sem `processado_em` há menos que isso ainda está com outro processo (Ruling 25). */
const EVENTO_EM_ANDAMENTO_MS = 5 * 60 * 1000

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

  // O Asaas entrega ao menos uma vez: o `id` do evento é o dedupe (Ruling 25). O evento entra sem
  // `processado_em` e só é marcado depois do tratamento: um processo morto no meio não o perde.
  const { error: insErr } = await admin.from('billing_events').insert({ id, tipo: event })
  if (insErr && insErr.code !== '23505') return json(500, { error: internalError('asaas-webhook: evento', insErr) })
  if (insErr) {
    const { data: ev, error: lErr } = await admin
      .from('billing_events')
      .select('recebido_em, processado_em')
      .eq('id', id)
      .maybeSingle()
    if (lErr) return json(500, { error: internalError('asaas-webhook: evento repetido', lErr) })
    if (ev?.processado_em) return json(200, { ok: true, repetido: true })
    // Sumiu (o `esquecer` de outro processo) ou ainda está com outro processo: o Asaas tenta de novo depois.
    if (!ev || Date.now() - new Date(ev.recebido_em).getTime() < EVENTO_EM_ANDAMENTO_MS) {
      return json(503, { error: 'evento em andamento' })
    }
    // Parado há mais de 5 min: o processo morreu. Toma o evento (o `recebido_em` é a posse) e reprocessa;
    // toda gravação do tratamento é condicional, e refazer é seguro.
    const { data: tomei, error: tErr } = await admin
      .from('billing_events')
      .update({ recebido_em: new Date().toISOString() })
      .eq('id', id)
      .eq('recebido_em', ev.recebido_em)
      .is('processado_em', null)
      .select('id')
    if (tErr) return json(500, { error: internalError('asaas-webhook: retomar', tErr) })
    if (!tomei?.length) return json(503, { error: 'evento em andamento' })
  }

  /** Apaga o evento gravado em `billing_events`, para o Asaas tentar de novo sem esperar a retomada. */
  const esquecer = async (evento: string) => {
    try {
      const { error } = await admin.from('billing_events').delete().eq('id', evento).is('processado_em', null)
      if (error) console.error('asaas-webhook: esquecer', error.message)
    } catch (e) {
      console.error('asaas-webhook: esquecer', e)
    }
  }

  let resposta: Response
  try {
    resposta = await tratar(admin, event, payment as Pagamento | null | undefined)
  } catch (e) {
    await esquecer(id)
    return json(500, { error: internalError('asaas-webhook', e) })
  }
  // Tratado. Falhou a marca, o evento fica sem `processado_em`: um reenvio refaz o que já está feito.
  const { error: mErr } = await admin
    .from('billing_events')
    .update({ processado_em: new Date().toISOString() })
    .eq('id', id)
  if (mErr) console.error('asaas-webhook: marcar o evento', id, mErr.message)
  return resposta
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
    const agora = new Date()
    const mudanca = efeitoDoEvento(event, payment, linha, agora)
    let registro: Parcelamento | null = null
    if (confirmado && parcelamento) {
      if (parcelamento === linha.provider_ref) {
        // As parcelas mensais do plano: nada a mudar, e o registro que faltou se conserta aqui (C1).
        await marcarAtivado(admin, parcelamento, linha.id)
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
        // cobrança. O registro que o cron faz depois da resposta pode chegar atrás deste evento. C1: só
        // entra quando este evento ativa a linha; o desconhecido que não ativa nada nunca vira "em dobro"
        // (a parcela atrasada de um ano que passou, sem registro, estornaria o ano inteiro).
        if (!registro) {
          if (!mudanca) {
            console.error('asaas-webhook: parcelamento desconhecido', linha.id, parcelamento)
            return ignorado('parcelamento')
          }
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
      if (mudanca.provider_ref) await marcarAtivado(admin, mudanca.provider_ref, linha.id)
      return json(200, { ok: true, mudou: true })
    }
  }
  throw new Error('a linha mudou duas vezes durante o evento')
}

/**
 * O parcelamento ativou a linha: daqui em diante, os eventos dele são mensais.
 * C1: o registro que faltou (o insert do cron falhou) nasce aqui, já ativado —
 * o parcelamento do plano nunca fica sem registro.
 */
async function marcarAtivado(admin: Admin, parcelamento: string, linhaId: string): Promise<void> {
  const agora = new Date().toISOString()
  const { error: uErr } = await admin
    .from('billing_parcelamentos')
    .upsert({ installment: parcelamento, subscription_id: linhaId, ativado_em: agora }, {
      onConflict: 'installment',
      ignoreDuplicates: true,
    })
  if (uErr) throw new Error(`registro: ${uErr.message}`)
  const { error } = await admin
    .from('billing_parcelamentos')
    .update({ ativado_em: agora })
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

  // #87: o aviso fica pendente até a entrega dar certo; o billing-daily reenvia.
  await avisarUmaVez(admin, { user_id: linha.user_id, tipo: 'estorno', referencia: parcelamento })
  return json(200, { ok: true, estornado: true })
}
