/**
 * O checkout do Plano Família (Bloco 8): a pessoa manda o nome e o CPF com o
 * JWT, e recebe o link da fatura do Asaas, onde digita o cartão. Nenhum dado de
 * cartão passa por aqui, e o CPF vai só ao cliente do Asaas: não entra em
 * tabela, log nem resposta.
 *
 * Ordem: método → JWT → config → corpo → nome e CPF → convidado → linha →
 * reivindicação da linha → cliente do Asaas → o que já está aberto no Asaas
 * (Ruling 7) → cobrança nova ou reusada → parcelamento registrado (Ruling 9) →
 * linha gravada.
 *
 * Contra cobrança dupla: a linha é reivindicada (compare-and-swap no `status`
 * e no `checkout_criado_em` lidos) antes de qualquer chamada ao Asaas, e toda
 * gravação depois disso só vale enquanto a reivindicação é desta chamada.
 * Perdeu a disputa, ou a linha mudou no meio (webhook, cron), a resposta sai
 * do estado relido.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'
import {
  buscarCobranca,
  configDoAsaas,
  criarCliente,
  criarCobranca,
  listarCobrancasAbertas,
  removerCobranca,
} from '../_shared/asaas.ts'
import { bearerJwt, getAuthUserFromJwt } from '../_shared/auth-user.ts'
import {
  type Assinatura,
  checkoutPendente,
  cpfValido,
  planoDoCheckout,
  type PlanoDoCheckout,
  triagemDasAbertas,
} from '../_shared/billing.ts'
import { appTodayYmd, formatYmd } from '../_shared/credit-card-cycle.ts'
import { internalError, lerCorpo } from '../_shared/http.ts'

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

const MAX_CORPO = 4096
const SEM_RESPOSTA = () => json(502, { error: 'O Asaas não respondeu. Tente de novo em instantes.' })
const MUDOU = () => json(409, { error: 'Seu plano mudou agora. Abra Planos de novo.' })

/** A resposta de quando não há cobrança a criar. */
function respostaDoEstado(plano: Exclude<PlanoDoCheckout, { tipo: 'novo' }>, url: string | null): Response {
  if (plano.tipo === 'reusar' && url) return json(200, { url })
  if (plano.tipo === 'aguardar') {
    return json(409, { error: 'Estamos tentando renovar com seu cartão. Tente de novo em alguns minutos.' })
  }
  if (plano.tipo === 'bloqueado') return json(409, { error: 'Você já tem um plano ativo.' })
  return MUDOU()
}

// Um erro solto viraria 500 sem CORS, que o navegador mostra como "Sem conexão".
Deno.serve(async (req: Request) => {
  try {
    return await atender(req)
  } catch (e) {
    return json(500, { error: internalError('billing-checkout', e) })
  }
})

async function atender(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const jwt = bearerJwt(req.headers.get('Authorization'))
  if (!jwt) return json(401, { error: 'Entre de novo para assinar.' })
  const auth = await getAuthUserFromJwt(supabaseUrl, anonKey, jwt)
  if (!auth.user) return json(401, { error: 'Entre de novo para assinar.' })
  const userId = auth.user.id

  const cfg = configDoAsaas()
  const appBase = Deno.env.get('APP_BASE_URL')?.trim().replace(/\/+$/, '')
  if (!appBase) console.error('billing-checkout: APP_BASE_URL ausente')
  if (!cfg || !appBase) return json(503, { error: 'A assinatura ainda não está disponível.' })

  const bruto = await lerCorpo(req, MAX_CORPO)
  if (bruto == null) return json(413, { error: 'Corpo grande demais.' })
  let nome: unknown
  let cpf: unknown
  try {
    ;({ nome, cpf } = JSON.parse(new TextDecoder().decode(bruto)) ?? {})
  } catch {
    return json(400, { error: 'Corpo inválido.' })
  }
  const nomeLimpo = typeof nome === 'string' ? nome.trim().replace(/\s+/g, ' ') : ''
  if (nomeLimpo.length < 3 || nomeLimpo.length > 100) return json(400, { error: 'Informe o nome como no cartão.' })
  if (typeof cpf !== 'string' || !cpfValido(cpf)) return json(400, { error: 'CPF inválido.' })

  const admin = createClient(supabaseUrl, serviceKey)

  // Decisão 10: o plano do convidado vem de quem o convidou, e ele pode ser menor.
  const { data: convidado, error: gErr } = await admin
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .eq('role', 'guest')
    .limit(1)
  if (gErr) return json(500, { error: internalError('billing-checkout: papel', gErr) })
  if (convidado && convidado.length > 0) {
    return json(409, { error: 'Seu acesso vem de quem te convidou. Peça para essa pessoa cuidar do plano.' })
  }

  const lerLinha = async () => {
    const { data, error } = await admin.from('billing_subscriptions').select('*').eq('user_id', userId).maybeSingle()
    if (error) throw new Error(`billing-checkout: linha: ${error.message}`)
    return data
  }
  /** Perdeu a disputa ou a linha mudou: responde pelo estado de agora. */
  const peloEstadoDeAgora = async () => {
    const atual = await lerLinha()
    const p = planoDoCheckout(atual as Assinatura | null, new Date(), !!atual?.checkout_url)
    return p.tipo === 'novo' ? MUDOU() : respostaDoEstado(p, atual?.checkout_url ?? null)
  }

  // Sem linha, ela nasce vazia (sem preço nem link); quem a disputar perde na reivindicação.
  const linha = (await lerLinha()) ?? await (async () => {
    const { error } = await admin
      .from('billing_subscriptions')
      .upsert({ user_id: userId, provider: 'asaas', status: 'pending' }, { onConflict: 'user_id', ignoreDuplicates: true })
    if (error) throw new Error(`billing-checkout: linha nova: ${error.message}`)
    const nova = await lerLinha()
    if (!nova) throw new Error('billing-checkout: linha nova não apareceu')
    return nova
  })()

  const agora = new Date()
  const plano = planoDoCheckout(linha as Assinatura, agora, !!linha.checkout_url)
  if (plano.tipo !== 'novo') return respostaDoEstado(plano, linha.checkout_url)

  // A reivindicação: só uma chamada passa daqui com o mesmo estado lido.
  const reivindicado = agora.toISOString()
  const reivindicacao = admin
    .from('billing_subscriptions')
    .update({ checkout_criado_em: reivindicado, checkout_url: null })
    .eq('id', linha.id)
    .eq('status', linha.status)
  const { data: minha, error: rErr } = await (linha.checkout_criado_em
    ? reivindicacao.eq('checkout_criado_em', linha.checkout_criado_em)
    : reivindicacao.is('checkout_criado_em', null)).select('id')
  if (rErr) throw new Error(`billing-checkout: reivindicar: ${rErr.message}`)
  if (!minha?.length) return await peloEstadoDeAgora()

  /** Devolve a linha como estava, para a próxima tentativa não esperar a reivindicação vencer. */
  const soltar = async () => {
    const { error } = await admin
      .from('billing_subscriptions')
      .update({ checkout_criado_em: linha.checkout_criado_em })
      .eq('id', linha.id)
      .eq('checkout_criado_em', reivindicado)
    if (error) console.error('billing-checkout: soltar', error.message)
  }

  let cliente: string | null = linha.asaas_customer_id
  if (!cliente) {
    const r = await criarCliente(cfg, { nome: nomeLimpo, cpf, email: auth.user.email ?? null, userId })
    // Só o status: a mensagem do Asaas poderia repetir o CPF.
    if (!r.ok) {
      console.error('billing-checkout: criarCliente', r.status)
      await soltar()
      return SEM_RESPOSTA()
    }
    const { data: gravou, error } = await admin
      .from('billing_subscriptions')
      .update({ asaas_customer_id: r.dados.id })
      .eq('id', linha.id)
      .is('asaas_customer_id', null)
      .select('id')
    if (error) throw new Error(`billing-checkout: cliente: ${error.message}`)
    // Outro pedido gravou um cliente antes: vale o dele, e o nosso fica sem cobrança no Asaas.
    cliente = gravou?.length ? r.dados.id : (await lerLinha())?.asaas_customer_id ?? null
    if (!cliente) throw new Error('billing-checkout: cliente não gravado')
  }

  // Ruling 7: a fatura do checkout anterior já paga espera o webhook; cobrar de novo seria em dobro.
  // Ruling 17: um parcelamento já ativado é um período que passou, não um pagamento esperando.
  if (linha.checkout_ref) {
    const r = await buscarCobranca(cfg, linha.checkout_ref)
    if (!r.ok && r.status !== 404) {
      console.error('billing-checkout: buscarCobranca', r.status, r.erros)
      await soltar()
      return SEM_RESPOSTA()
    }
    if (r.ok && r.dados.installment) {
      const { data: registro, error } = await admin
        .from('billing_parcelamentos')
        .select('ativado_em')
        .eq('installment', r.dados.installment)
        .maybeSingle()
      if (error) {
        await soltar()
        throw new Error(`billing-checkout: registro: ${error.message}`)
      }
      if (checkoutPendente(r.dados, linha.provider_ref, registro)) {
        await soltar()
        return json(409, { error: 'Seu pagamento está sendo confirmado.' })
      }
    }
  }

  // Ruling 7: o que está aberto no Asaas é reusado (mesmo total) ou tirado do ar antes de criar outra.
  const abertas = await listarCobrancasAbertas(cfg, linha.id)
  if (!abertas.ok) {
    console.error('billing-checkout: listarCobrancasAbertas', abertas.status, abertas.erros)
    await soltar()
    return SEM_RESPOSTA()
  }
  const { reusar, remover } = triagemDasAbertas(abertas.dados, plano.centavos, cliente, linha.provider_ref)
  for (const c of remover) {
    const r = await removerCobranca(cfg, c)
    if (!r.ok) {
      console.error('billing-checkout: removerCobranca', r.status, r.erros)
      await soltar()
      return SEM_RESPOSTA()
    }
  }

  let ref: string
  let url: string
  let parcelamento: string | null
  if (reusar) {
    ref = reusar.id
    url = reusar.invoiceUrl
    parcelamento = reusar.installment
  } else {
    const cobranca = await criarCobranca(cfg, {
      cliente,
      centavos: plano.centavos,
      referencia: linha.id,
      vencimento: formatYmd(appTodayYmd()),
      retorno: `${appBase}/plans?pago=1`,
    })
    // Incerta (prazo estourado) ou não: a próxima tentativa lista antes de criar e acha a órfã.
    if (!cobranca.ok) {
      console.error('billing-checkout: criarCobranca', cobranca.status, cobranca.erros)
      await soltar()
      return SEM_RESPOSTA()
    }
    ref = cobranca.dados.id
    url = cobranca.dados.invoiceUrl
    parcelamento = cobranca.dados.installment
  }

  // Ruling 9: o webhook só ativa parcelamento registrado. Ele entra antes de a pessoa receber o link.
  if (!parcelamento) {
    console.error('billing-checkout: cobrança sem parcelamento', linha.id, ref)
    await soltar()
    return SEM_RESPOSTA()
  }
  const { error: pErr } = await admin
    .from('billing_parcelamentos').insert({ installment: parcelamento, subscription_id: linha.id })
  if (pErr && pErr.code !== '23505') {
    await soltar()
    throw new Error(`billing-checkout: parcelamento: ${pErr.message}`)
  }

  // Um `past_due` (ou `active` vencido, Ruling 6) segue no status lido: nunca vira `pending`.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim().slice(0, 45) || null
  const { data: gravada, error: wErr } = await admin
    .from('billing_subscriptions')
    .update({
      provider: 'asaas',
      status: plano.renovacao ? linha.status : 'pending',
      price_cents: plano.centavos,
      founder: plano.fundador,
      ...(ip ? { ultimo_ip: ip } : {}),
      checkout_ref: ref,
      checkout_url: url,
    })
    .eq('id', linha.id)
    .eq('status', linha.status)
    .eq('checkout_criado_em', reivindicado)
    .select('id')
  if (wErr) throw new Error(`billing-checkout: gravar: ${wErr.message}`)
  // A linha mudou no meio (o webhook ativou, o cron cobrou): a fatura fica aberta e a próxima tentativa a acha.
  if (!gravada?.length) return await peloEstadoDeAgora()

  return json(200, { url })
}
