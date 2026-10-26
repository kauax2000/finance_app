/**
 * O webhook do Asaas (Bloco 8): os eventos de pagamento mudam a linha da
 * pessoa em `billing_subscriptions`. Só o Asaas chama, com o `authToken` no
 * cabeçalho `asaas-access-token`: sem JWT nem CORS.
 *
 * Ordem: método → token → corpo → evento gravado (o repetido para aqui) →
 * linha → cliente → efeitoDoEvento → gravação condicional, ou o estorno do
 * pagamento em dobro (Ruling 8).
 *
 * Só o token errado volta 401. Todo caminho tratado volta exatamente 200, até a
 * referência estranha: a fila do Asaas pausa depois de 15 respostas que não
 * são 200. O 500 é só o erro que vale tentar de novo (banco, estorno), e ele
 * apaga o evento gravado para a nova tentativa não parar no "repetido".
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'
import { configDoAsaas, estornarParcelamento } from '../_shared/asaas.ts'
import { type Assinatura, efeitoDoEvento, type Pagamento, pagamentoEmDobro } from '../_shared/billing.ts'
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

  /** Apaga o que este evento gravou em `billing_events`, para o Asaas tentar de novo. */
  const esquecer = async (...ids: string[]) => {
    try {
      const { error } = await admin.from('billing_events').delete().in('id', ids)
      if (error) console.error('asaas-webhook: esquecer', error.message)
    } catch (e) {
      console.error('asaas-webhook: esquecer', e)
    }
  }

  try {
    return await tratar(admin, id, event, payment as Pagamento | null | undefined, esquecer)
  } catch (e) {
    await esquecer(id)
    return json(500, { error: internalError('asaas-webhook', e) })
  }
})

async function tratar(
  admin: Admin,
  eventoId: string,
  event: string,
  payment: Pagamento | null | undefined,
  esquecer: (...ids: string[]) => Promise<void>,
): Promise<Response> {
  // Uma referência que não é uuid derrubaria a consulta e travaria a fila.
  if (!payment?.externalReference || !UUID.test(payment.externalReference)) return ignorado('referencia')

  // A gravação é condicional ao que foi lido: se o cron ou o checkout mudou a linha no meio, relê uma vez.
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    const { data, error } = await admin
      .from('billing_subscriptions')
      .select('*')
      .eq('id', payment.externalReference)
      .maybeSingle()
    if (error) throw new Error(`linha: ${error.message}`)
    const linha = data as Linha | null
    if (!linha || payment.customer !== linha.asaas_customer_id) return ignorado('linha')

    const agora = new Date()
    const mudanca = efeitoDoEvento(event, payment, linha, agora)
    if (!mudanca) {
      // O parcelamento que paga o plano nunca é estornado aqui.
      if (pagamentoEmDobro(event, payment, linha, agora) && payment.installment && payment.installment !== linha.provider_ref) {
        return await estornar(admin, linha, payment.installment, eventoId, esquecer)
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
    if (gravou?.length) return json(200, { ok: true, mudou: true })
  }
  throw new Error('a linha mudou duas vezes durante o evento')
}

/**
 * Ruling 8: um pagamento confirmado de outro parcelamento numa linha já paga é
 * cobrança em dobro, e volta ao cartão na hora. As 12 parcelas disparam o mesmo
 * evento: o estorno é pedido uma vez por parcelamento (`estorno:<id>`).
 */
async function estornar(
  admin: Admin,
  linha: Linha,
  installment: string,
  eventoId: string,
  esquecer: (...ids: string[]) => Promise<void>,
): Promise<Response> {
  const cfg = configDoAsaas()
  if (!cfg) {
    console.error('asaas-webhook: pagamento em dobro sem ASAAS_API_URL/ASAAS_API_KEY', linha.id, installment)
    await esquecer(eventoId)
    return json(500, { error: 'Erro interno. Tente novamente.' })
  }

  const chave = `estorno:${installment}`
  const { error: insErr } = await admin.from('billing_events').insert({ id: chave, tipo: 'estorno' })
  if (insErr?.code === '23505') return json(200, { ok: true, estorno: 'ja_pedido' })
  if (insErr) throw new Error(`estorno: ${insErr.message}`)

  console.error('asaas-webhook: pagamento em dobro, estornando', linha.id, installment)
  const r = await estornarParcelamento(cfg, installment)
  if (!r.ok) {
    console.error('asaas-webhook: estorno falhou', linha.id, installment, r.status, r.erros)
    await esquecer(eventoId, chave)
    return json(500, { error: 'Erro interno. Tente novamente.' })
  }

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
    const entregue = await deliverNotification({
      supabaseAdmin: admin,
      userId,
      userEmail: pessoa?.user?.email ?? null,
      workspaceId: carteira.id,
      type: 'system',
      title: 'Cobrança em dobro devolvida',
      body:
        'Recebemos um pagamento a mais pelo plano e já pedimos o estorno ao Asaas. O valor volta para o cartão em até 10 dias úteis.',
      metadata: { href: '/plans' },
      essencial: true,
    })
    if (!entregue.ok) console.error('asaas-webhook: aviso', userId, entregue.error)
  } catch (e) {
    console.error('asaas-webhook: aviso', userId, e instanceof Error ? e.message : e)
  }
}
