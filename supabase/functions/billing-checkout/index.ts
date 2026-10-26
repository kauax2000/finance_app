/**
 * O checkout do Plano Família (Bloco 8): a pessoa manda o nome e o CPF com o
 * JWT, e recebe o link da fatura do Asaas, onde digita o cartão. Nenhum dado de
 * cartão passa por aqui, e o CPF vai só ao cliente do Asaas: não entra em
 * tabela, log nem resposta.
 *
 * Ordem: método → JWT → config → corpo → nome e CPF → convidado → linha →
 * cliente do Asaas → linha gravada → cobrança → link gravado.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'
import { configDoAsaas, criarCliente, criarCobranca } from '../_shared/asaas.ts'
import { bearerJwt, getAuthUserFromJwt } from '../_shared/auth-user.ts'
import { type Assinatura, cpfValido, planoDoCheckout } from '../_shared/billing.ts'
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

  const { data: linha, error: lErr } = await admin
    .from('billing_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (lErr) return json(500, { error: internalError('billing-checkout: linha', lErr) })

  const agora = new Date()
  const plano = planoDoCheckout(linha as Assinatura | null, agora)
  if (plano.tipo === 'bloqueado') return json(409, { error: 'Você já tem um plano ativo.' })
  if (plano.tipo === 'reusar') {
    if (!linha?.checkout_url) return json(500, { error: internalError('billing-checkout', 'checkout sem url') })
    return json(200, { url: linha.checkout_url })
  }

  let cliente: string | null = linha?.asaas_customer_id ?? null
  if (!cliente) {
    const r = await criarCliente(cfg, { nome: nomeLimpo, cpf, email: auth.user.email ?? null, userId })
    // Só o status: a mensagem do Asaas poderia repetir o CPF.
    if (!r.ok) {
      console.error('billing-checkout: criarCliente', r.status)
      return SEM_RESPOSTA()
    }
    cliente = r.dados.id
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim().slice(0, 45) || null
  const { data: gravada, error: uErr } = await admin
    .from('billing_subscriptions')
    .upsert({
      user_id: userId,
      provider: 'asaas',
      status: plano.renovacao ? 'past_due' : 'pending',
      price_cents: plano.centavos,
      founder: plano.fundador,
      asaas_customer_id: cliente,
      ultimo_ip: ip,
    }, { onConflict: 'user_id' })
    .select('id')
    .single()
  if (uErr || !gravada) return json(500, { error: internalError('billing-checkout: upsert', uErr) })

  const cobranca = await criarCobranca(cfg, {
    cliente,
    centavos: plano.centavos,
    referencia: gravada.id,
    vencimento: formatYmd(appTodayYmd()),
    retorno: `${appBase}/plans?pago=1`,
  })
  if (!cobranca.ok) {
    console.error('billing-checkout: criarCobranca', cobranca.status, cobranca.erros)
    return SEM_RESPOSTA()
  }

  const { error: cErr } = await admin
    .from('billing_subscriptions')
    .update({
      checkout_ref: cobranca.dados.id,
      checkout_url: cobranca.dados.invoiceUrl,
      checkout_criado_em: agora.toISOString(),
    })
    .eq('id', gravada.id)
  if (cErr) return json(500, { error: internalError('billing-checkout: link', cErr) })

  return json(200, { url: cobranca.dados.invoiceUrl })
}
