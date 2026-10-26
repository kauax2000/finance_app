import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'
import { internalError } from '../_shared/http.ts'
import { FAN_OUT_CONCURRENCY, forEachLimit } from '../_shared/for-each-limit.ts'
import { secretMatches } from '../_shared/timing-safe-equal.ts'
import { deliverNotification } from '../_shared/deliver-notification.ts'
import type { SupabaseAdminClient } from '../_shared/supabase-admin.ts'
import { todasAsPaginas } from '../_shared/todas-as-paginas.ts'
import { appTodayYmd, formatYmd } from '../_shared/credit-card-cycle.ts'
import {
  avisoDoTeste,
  PRECO_FAMILIA_CENTAVOS,
  PRECO_FUNDADOR_CENTAVOS,
  type RelatorioDoTeste,
} from '../_shared/plano.ts'
import {
  acaoDoDia,
  aguardandoConfirmacao,
  type Assinatura,
  AVISOS,
  efeitoDoEvento,
  falhaNaRenovacao,
  type Mudanca,
  type Pagamento,
  type Parcelamento,
  triagemDasAbertas,
} from '../_shared/billing.ts'
import {
  agendarNota,
  asaas,
  type AsaasConfig,
  buscarCobranca,
  configDoAsaas,
  criarCobranca,
  estornarNoAsaas,
  listarCobrancasAbertas,
  removerCobranca,
} from '../_shared/asaas.ts'

// O cron diário dos planos (9h em Brasília), em quatro passos independentes:
// 1. o aviso do dia 12 do teste, só com a cobrança ligada (`enforced_since`);
// 2. os estornos que ficaram 'pendente' no webhook e no reembolso (Ruling 10 e 13);
// 3. as assinaturas do Asaas pela `acaoDoDia`: aviso de renovação, renovação
//    pelo token do cartão e fim do plano — sempre, inclusive no Sandbox antes
//    do lançamento;
// 4. a NFS-e de cada período pago.
// Um passo que falha não para os outros, e uma linha que falha não para as
// outras. Só o cron chama: sem CORS nem OPTIONS.

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
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

/** O cliente de serviço, com o pedaço do `auth` que o aviso usa (o e-mail da pessoa). */
type Admin = SupabaseAdminClient & {
  auth: { admin: { getUserById(id: string): Promise<{ data: { user: { email?: string | null } | null } }> } }
}
type Linha = Assinatura & {
  asaas_customer_id: string | null
  ultimo_ip: string | null
  checkout_ref: string | null
  card_last4: string | null
  nfse_para: string | null
  updated_at: string
}
type Aviso = { titulo: string; corpo: string }
type Destino = { email: string | null; workspaceId: string }
type Contas = {
  avisos: number
  failures: number
  renovadas: number
  aguardando: number
  falhas: number
  expiradas: number
  notas: number
  estornos: number
}
type Ctx = { admin: Admin; cfg: AsaasConfig | null; agora: Date; iso: string; hoje: string; n: Contas }

const UMA_HORA_MS = 60 * 60 * 1000

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

const mensagem = (e: unknown) => (e instanceof Error ? e.message : String(e))

function erro(ctx: Ctx, onde: string, id: string, e: unknown): void {
  console.error(`billing-daily: ${onde}`, id, mensagem(e))
  ctx.n.failures += 1
}

/** Todo aviso do cron: essencial, do tipo system, com o link para os planos. */
async function enviar(ctx: Ctx, userId: string, destino: Destino, aviso: Aviso) {
  return await deliverNotification({
    supabaseAdmin: ctx.admin,
    userId,
    userEmail: destino.email,
    workspaceId: destino.workspaceId,
    type: 'system',
    title: aviso.titulo,
    body: aviso.corpo,
    metadata: { href: '/plans' },
    essencial: true,
  })
}

/** Um aviso por `(pessoa, tipo, referência)`: a entrega que falha libera o dedupe. */
async function entregar(ctx: Ctx, dedupe: DedupeRow, destino: Destino, aviso: Aviso): Promise<void> {
  const { admin } = ctx
  try {
    if (!(await claimDedupe(admin, dedupe))) return
    const delivered = await enviar(ctx, dedupe.user_id, destino, aviso)
    if (!delivered.ok) {
      await releaseDedupe(admin, dedupe)
      erro(ctx, `entrega ${dedupe.tipo}`, dedupe.user_id, delivered.error)
      return
    }
    ctx.n.avisos += 1
  } catch (e) {
    await releaseDedupe(admin, dedupe)
    erro(ctx, `entrega ${dedupe.tipo}`, dedupe.user_id, e)
  }
}

/** A carteira pessoal e o e-mail da pessoa. */
async function destinoDe(ctx: Ctx, userId: string): Promise<Destino | null> {
  const { data: carteira, error } = await ctx.admin
    .from('workspaces')
    .select('id')
    .eq('created_by', userId)
    .eq('type', 'personal')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (error || !carteira) {
    erro(ctx, 'aviso sem carteira pessoal', userId, error?.message ?? 'sem carteira')
    return null
  }
  const { data: pessoa } = await ctx.admin.auth.admin.getUserById(userId)
  return { email: pessoa?.user?.email ?? null, workspaceId: carteira.id }
}

/** Os avisos da assinatura, um por período: `renovacao`, `cartao` e `fim` pela data do `current_period_end`. */
async function avisar(ctx: Ctx, linha: Linha, tipo: 'renovacao' | 'cartao' | 'fim', aviso: Aviso): Promise<void> {
  const destino = await destinoDe(ctx, linha.user_id)
  if (!destino) return
  const referencia = (linha.current_period_end ?? ctx.iso).slice(0, 10)
  await entregar(ctx, { user_id: linha.user_id, tipo, referencia }, destino, aviso)
}

async function avisarDoTeste(ctx: Ctx): Promise<void> {
  const { data, error } = await ctx.admin.rpc!('avisos_de_teste_pendentes')
  if (error) throw new Error(`avisos_de_teste_pendentes: ${error.message}`)
  const pendentes = (data ?? []) as AvisoPendente[]

  await forEachLimit(pendentes, FAN_OUT_CONCURRENCY, async (p) => {
    try {
      const dedupe: DedupeRow = { user_id: p.user_id, tipo: 'teste', referencia: p.fim_do_teste.slice(0, 10) }
      await entregar(ctx, dedupe, { email: p.email, workspaceId: p.workspace_id }, avisoDoTeste(p.relatorio))
    } catch (e) {
      erro(ctx, 'teste', p.user_id, e)
    }
  })
}

/** O parcelamento ativou a linha: daqui em diante, os eventos dele são mensais (Ruling 9). */
async function marcarAtivado(ctx: Ctx, parcelamento: string): Promise<void> {
  const { error } = await ctx.admin
    .from('billing_parcelamentos')
    .update({ ativado_em: ctx.iso })
    .eq('installment', parcelamento)
    .is('ativado_em', null)
  if (error) console.error('billing-daily: ativado_em', parcelamento, error.message)
}

/**
 * Ruling 5: o prazo da cobrança estourou e ela pode existir. Os parcelamentos
 * criados hoje para a linha entram no registro, para o webhook reconhecer a
 * confirmação (um desconhecido ele ignora).
 */
async function criadosHoje(ctx: Ctx, cfg: AsaasConfig, linha: Linha): Promise<string[]> {
  const r = await asaas<{ data?: Pagamento[] }>(
    cfg,
    'GET',
    `/payments?externalReference=${encodeURIComponent(linha.id)}&dateCreated%5Bge%5D=${ctx.hoje}&limit=100`,
  )
  if (!r.ok) {
    console.error('billing-daily: cobrança incerta sem leitura; conferir no Asaas', linha.id, r.status, r.erros)
    return []
  }
  const ids = (r.dados.data ?? []).map((p) => p.installment).filter((i): i is string => !!i && i !== linha.provider_ref)
  return [...new Set(ids)]
}

/**
 * A renovação de uma linha. Sem token, sem IP (o Asaas exige `remoteIp`) ou
 * sem cliente, nunca cobra às cegas: vira `past_due` e "atualize o cartão".
 * Com eles: reivindica a linha (`checkout_criado_em`), tira do ar a fatura
 * aberta do checkout, cobra o token, registra o parcelamento e grava o
 * resultado — confirmado ativa; aceito ou incerto espera o webhook; recusado
 * vira `past_due`.
 */
async function renovar(ctx: Ctx, linha: Linha): Promise<void> {
  const { admin, agora, iso } = ctx
  /** Toda gravação antes da cobrança é condicional ao estado lido, e o cancelado não é cobrado. */
  const pelaLeitura = (q: ReturnType<Admin['from']>) => {
    q = q.eq('id', linha.id).eq('status', linha.status).eq('cancel_at_period_end', false)
    for (const col of ['checkout_criado_em', 'grace_until', 'current_period_end'] as const) {
      q = linha[col] === null ? q.is(col, null) : q.eq(col, linha[col])
    }
    return q
  }

  const comToken = !!(linha.card_token && linha.ultimo_ip && linha.asaas_customer_id)
  if (!comToken) {
    const falha = falhaNaRenovacao(linha, agora)
    const { data, error } = await pelaLeitura(
      admin.from('billing_subscriptions').update({ ...falha, checkout_criado_em: iso, checkout_url: null, updated_at: iso }),
    ).select('id')
    if (error) throw new Error(`sem token: ${error.message}`)
    if (!data?.length) return
    ctx.n.falhas += 1
    await avisar(ctx, linha, 'cartao', AVISOS.cartao({ ...linha, ...falha }))
    return
  }

  const cfg = ctx.cfg
  if (!cfg) {
    console.error('billing-daily: renovação sem ASAAS_API_URL/ASAAS_API_KEY', linha.id)
    ctx.n.failures += 1
    return
  }

  // A reivindicação: o checkout espera e o cancelar recusa enquanto ela é nova.
  const { data: minha, error: rErr } = await pelaLeitura(
    admin.from('billing_subscriptions').update({ checkout_criado_em: iso, checkout_url: null, updated_at: iso }),
  ).select('id')
  if (rErr) throw new Error(`reivindicar: ${rErr.message}`)
  if (!minha?.length) return

  /** Nada foi cobrado: devolve a data de antes, para o próximo dia tentar. O link já saiu do ar. */
  const soltar = async (onde: string, status: number, erros: string[]) => {
    erro(ctx, onde, linha.id, `${status} ${erros.join('; ')}`)
    const { error } = await admin
      .from('billing_subscriptions')
      .update({ checkout_criado_em: linha.checkout_criado_em })
      .eq('id', linha.id)
      .eq('checkout_criado_em', iso)
    if (error) console.error('billing-daily: soltar', linha.id, error.message)
  }

  // Ruling 7: a fatura do checkout já paga espera o webhook; cobrar o cartão seria em dobro.
  if (linha.checkout_ref) {
    const r = await buscarCobranca(cfg, linha.checkout_ref)
    if (!r.ok && r.status !== 404) return await soltar('buscarCobranca', r.status, r.erros)
    const paga = r.ok && (r.dados.status === 'CONFIRMED' || r.dados.status === 'RECEIVED')
    if (paga && r.dados.installment && r.dados.installment !== linha.provider_ref) return
  }

  // Ruling 7: a fatura aberta do checkout sai do ar antes da cobrança; a do plano pago (provider_ref) nunca.
  const abertas = await listarCobrancasAbertas(cfg, linha.id)
  if (!abertas.ok) return await soltar('listarCobrancasAbertas', abertas.status, abertas.erros)
  const centavos = linha.price_cents ?? (linha.founder ? PRECO_FUNDADOR_CENTAVOS : PRECO_FAMILIA_CENTAVOS)
  const { reusar, remover } = triagemDasAbertas(abertas.dados, centavos, linha.asaas_customer_id!, linha.provider_ref)
  // O cartão não paga fatura: a que serviria ao checkout sai também.
  for (const c of reusar ? [reusar, ...remover] : remover) {
    const r = await removerCobranca(cfg, c)
    if (!r.ok) return await soltar('removerCobranca', r.status, r.erros)
  }

  const cobranca = await criarCobranca(cfg, {
    cliente: linha.asaas_customer_id!,
    centavos,
    referencia: linha.id,
    vencimento: ctx.hoje,
    token: linha.card_token!,
    ip: linha.ultimo_ip,
  })

  // Ruling 9: o parcelamento entra no registro antes de tudo, para o webhook reconhecê-lo.
  // ponytail: o id só existe na resposta; um webhook que chegue antes deste insert é ignorado.
  const parcelamentos = cobranca.ok
    ? [cobranca.dados.installment].filter((i): i is string => !!i)
    : cobranca.incerto
    ? await criadosHoje(ctx, cfg, linha)
    : []
  for (const installment of parcelamentos) {
    const { error } = await admin.from('billing_parcelamentos').insert({ installment, subscription_id: linha.id })
    if (error && error.code !== '23505') console.error('billing-daily: registrar', linha.id, installment, error.message)
  }

  // Depois da cobrança, nada lança: a gravação vale se a reivindicação ainda é desta chamada.
  const gravar = async (m: Mudanca): Promise<boolean> => {
    let q = admin.from('billing_subscriptions').update({ ...m, updated_at: iso })
      .eq('id', linha.id)
      .eq('status', linha.status)
      .eq('checkout_criado_em', iso)
    q = linha.provider_ref === null ? q.is('provider_ref', null) : q.eq('provider_ref', linha.provider_ref)
    const { data, error } = await q.select('id')
    if (error || !data?.length) {
      console.error('billing-daily: a linha mudou durante a cobrança', linha.id, error?.message)
      return false
    }
    return true
  }

  const confirmada = cobranca.ok && (cobranca.dados.status === 'CONFIRMED' || cobranca.dados.status === 'RECEIVED')
  if (cobranca.ok && confirmada) {
    const m = efeitoDoEvento('PAYMENT_CONFIRMED', cobranca.dados, linha, agora)
    if (m) {
      if (await gravar(m)) {
        if (m.provider_ref) await marcarAtivado(ctx, m.provider_ref)
        ctx.n.renovadas += 1
      }
      return
    }
    // Sem parcelamento na resposta: espera o webhook em vez de cobrar de novo em 2 dias.
    console.error('billing-daily: confirmada sem efeito', linha.id, cobranca.dados.id)
  }

  // Aceita e ainda não confirmada, ou incerta (Ruling 5): o plano segue pela grace_until (Ruling 4).
  if (cobranca.ok || cobranca.incerto) {
    if (await gravar(aguardandoConfirmacao(linha))) ctx.n.aguardando += 1
    return
  }

  // A recusa do cartão não cria a cobrança no Asaas (HTTP 400).
  console.error('billing-daily: renovação recusada', linha.id, cobranca.status, cobranca.erros)
  const falha = falhaNaRenovacao(linha, agora)
  if (await gravar(falha)) {
    ctx.n.falhas += 1
    await avisar(ctx, linha, 'cartao', AVISOS.cartao({ ...linha, ...falha }))
  }
}

async function expirar(ctx: Ctx, linha: Linha): Promise<void> {
  const { data, error } = await ctx.admin
    .from('billing_subscriptions')
    .update({ status: 'expired', checkout_url: null, updated_at: ctx.iso })
    .eq('id', linha.id)
    .eq('status', linha.status)
    .eq('updated_at', linha.updated_at)
    .select('id')
  if (error) throw new Error(`expirar: ${error.message}`)
  if (!data?.length) return
  ctx.n.expiradas += 1
  await avisar(ctx, linha, 'fim', AVISOS.fim())
}

async function renovarAssinaturas(ctx: Ctx): Promise<void> {
  const linhas = await todasAsPaginas<Linha>((de, ate) =>
    ctx.admin
      .from('billing_subscriptions')
      .select('*')
      .eq('provider', 'asaas')
      .in('status', ['active', 'past_due'])
      .order('id')
      .range(de, ate)
  )

  await forEachLimit(linhas, FAN_OUT_CONCURRENCY, async (linha) => {
    try {
      const acao = acaoDoDia(linha, ctx.agora)
      if (acao === 'avisar_renovacao') {
        await avisar(ctx, linha, 'renovacao', AVISOS.renovacao(linha, linha.card_last4))
      } else if (acao === 'renovar') await renovar(ctx, linha)
      else if (acao === 'expirar') await expirar(ctx, linha)
    } catch (e) {
      erro(ctx, 'assinatura', linha.id, e)
    }
  })
}

/**
 * Os estornos 'pendente' (Ruling 10 e 13), uma tentativa por hora no máximo:
 * `estornarNoAsaas` lê o parcelamento antes de pedir. Concluído, o do
 * `provider_ref` é o reembolso do arrependimento e expira a linha; o de outro
 * parcelamento é a cobrança em dobro e leva o aviso do webhook.
 */
async function refazerEstornos(ctx: Ctx): Promise<void> {
  const limite = new Date(ctx.agora.getTime() - UMA_HORA_MS).toISOString()
  const pendentes = await todasAsPaginas<Parcelamento>((de, ate) =>
    ctx.admin
      .from('billing_parcelamentos')
      .select('*')
      .eq('estorno_status', 'pendente')
      .lt('estorno_tentado_em', limite)
      .order('installment')
      .range(de, ate)
  )
  if (!pendentes.length) return
  const cfg = ctx.cfg
  if (!cfg) {
    console.error('billing-daily: estornos pendentes sem ASAAS_API_URL/ASAAS_API_KEY', pendentes.length)
    ctx.n.failures += 1
    return
  }

  await forEachLimit(pendentes, FAN_OUT_CONCURRENCY, async (p) => {
    try {
      const { admin, iso } = ctx
      // A tentativa é reivindicada: dois disparos do cron não pedem juntos.
      const { data: minha, error: tErr } = await admin
        .from('billing_parcelamentos')
        .update({ estorno_tentado_em: iso })
        .eq('installment', p.installment)
        .eq('estorno_status', 'pendente')
        .eq('estorno_tentado_em', p.estorno_tentado_em)
        .select('installment')
      if (tErr) throw new Error(`tentativa: ${tErr.message}`)
      if (!minha?.length) return

      const { data, error } = await admin
        .from('billing_subscriptions')
        .select('*')
        .eq('id', p.subscription_id)
        .maybeSingle()
      if (error || !data) throw new Error(`linha: ${error?.message ?? 'sumiu'}`)
      const linha = data as Linha

      const r = await estornarNoAsaas(cfg, p.installment, linha.asaas_customer_id)
      if (!r.ok) return erro(ctx, `estorno ${r.etapa}`, p.installment, `${r.status} ${r.erros.join('; ')}`)

      const { data: marcou, error: fErr } = await admin
        .from('billing_parcelamentos')
        .update({ estorno_status: 'feito' })
        .eq('installment', p.installment)
        .eq('estorno_status', 'pendente')
        .select('installment')
      if (fErr) throw new Error(`marcar o estorno: ${fErr.message}`)
      if (!marcou?.length) return
      ctx.n.estornos += 1

      if (p.installment === linha.provider_ref) {
        // Ruling 13: o reembolso termina aqui. Zero linhas: o PAYMENT_REFUNDED do webhook já expirou.
        const { error: eErr } = await admin
          .from('billing_subscriptions')
          .update({
            status: 'expired',
            current_period_end: iso,
            cancel_at_period_end: true,
            reembolsavel_ate: null,
            grace_until: null,
            checkout_url: null,
            updated_at: iso,
          })
          .eq('id', linha.id)
          .eq('status', 'active')
          .eq('provider_ref', p.installment)
        if (eErr) throw new Error(`expirar: ${eErr.message}`)
        return
      }

      // Ruling 8: a cobrança em dobro voltou ao cartão; o mesmo aviso do webhook, uma vez (a marca acima é a trava).
      const destino = await destinoDe(ctx, linha.user_id)
      if (!destino) return
      const entregue = await enviar(ctx, linha.user_id, destino, AVISOS.estorno())
      if (entregue.ok) ctx.n.avisos += 1
      else erro(ctx, 'aviso do estorno', linha.user_id, entregue.error)
    } catch (e) {
      erro(ctx, 'estorno', p.installment, e)
    }
  })
}

/** Decisão 5: uma NFS-e por período pago, com o parcelamento e o valor total. Falhou, tenta amanhã. */
async function emitirNotas(ctx: Ctx): Promise<void> {
  const codigo = Deno.env.get('ASAAS_NFSE_SERVICO_CODIGO')?.trim()
  const nome = Deno.env.get('ASAAS_NFSE_SERVICO_NOME')?.trim()
  const cfg = ctx.cfg
  if (!cfg || !codigo || !nome) {
    console.error('billing-daily: NFS-e pulada: falta ASAAS_NFSE_SERVICO_CODIGO, ASAAS_NFSE_SERVICO_NOME ou o Asaas')
    return
  }

  const linhas = await todasAsPaginas<Linha>((de, ate) =>
    ctx.admin
      .from('billing_subscriptions')
      .select('*')
      .eq('provider', 'asaas')
      .eq('status', 'active')
      .not('provider_ref', 'is', null)
      .order('id')
      .range(de, ate)
  )

  await forEachLimit(linhas.filter((l) => l.nfse_para !== l.provider_ref), FAN_OUT_CONCURRENCY, async (linha) => {
    try {
      const ref = linha.provider_ref!
      const centavos = linha.price_cents ?? (linha.founder ? PRECO_FUNDADOR_CENTAVOS : PRECO_FAMILIA_CENTAVOS)
      const r = await agendarNota(cfg, { parcelamento: ref, centavos, data: ctx.hoje, codigo, nome })
      if (!r.ok) return erro(ctx, 'agendarNota', linha.id, `${r.status} ${r.erros.join('; ')}`)
      const { error } = await ctx.admin
        .from('billing_subscriptions')
        .update({ nfse_para: ref })
        .eq('id', linha.id)
        .eq('provider_ref', ref)
      if (error) throw new Error(`nfse_para: ${error.message}`)
      ctx.n.notas += 1
    } catch (e) {
      erro(ctx, 'NFS-e', linha.id, e)
    }
  })
}

async function passo(ctx: Ctx, nome: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn()
  } catch (e) {
    erro(ctx, nome, '-', e)
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  if (!secretMatches(Deno.env.get('CRON_SECRET'), req.headers.get('x-cron-secret'))) {
    return json(401, { error: 'Unauthorized' })
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: config, error: cErr } = await admin
    .from('billing_settings')
    .select('enforced_since')
    .maybeSingle()
  if (cErr) return json(500, { error: internalError('billing-daily', cErr) })

  const agora = new Date()
  const ctx: Ctx = {
    admin,
    cfg: configDoAsaas(),
    agora,
    iso: agora.toISOString(),
    hoje: formatYmd(appTodayYmd(agora)),
    n: { avisos: 0, failures: 0, renovadas: 0, aguardando: 0, falhas: 0, expiradas: 0, notas: 0, estornos: 0 },
  }

  // Cobrança desligada: só o aviso do teste fica de fora; o Asaas segue (o Sandbox antes do lançamento).
  if (config?.enforced_since) await passo(ctx, 'teste', () => avisarDoTeste(ctx))
  await passo(ctx, 'estornos', () => refazerEstornos(ctx))
  await passo(ctx, 'renovação', () => renovarAssinaturas(ctx))
  await passo(ctx, 'NFS-e', () => emitirNotas(ctx))

  return json(200, { ok: true, ...ctx.n })
})
