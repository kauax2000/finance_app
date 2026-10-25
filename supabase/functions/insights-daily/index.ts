import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'
import { internalError } from '../_shared/http.ts'
import { FAN_OUT_CONCURRENCY, forEachLimit } from '../_shared/for-each-limit.ts'
import { secretMatches } from '../_shared/timing-safe-equal.ts'
import { todasAsPaginas } from '../_shared/todas-as-paginas.ts'
import { deliverNotification, loadWorkspacePrefsMap } from '../_shared/deliver-notification.ts'
import type { SupabaseAdminClient } from '../_shared/supabase-admin.ts'
import { cardLabel } from '../_shared/notification-copy.ts'
import {
  addCalendarDays,
  appTodayYmd,
  cardInvoiceNetInWindow,
  daysInMonth,
  diffCalendarDays,
  escolherTotal,
  estimatedDueYmdForClose,
  filterRangeEndIso,
  filterRangeStartIso,
  formatYmd,
  invoiceWindowEndingAt,
  isoPrefixYmd,
  previousStatementCloseBefore,
  statementCloseOnOrBefore,
  statementTotalKey,
  sumCardRefundsInWindow,
  type CardTxRow,
  type OpenWindow,
  type Ymd,
} from '../_shared/credit-card-cycle.ts'
import {
  detectarAtipicos,
  detectarDuplicidades,
  detectarParcelasAcabando,
  detectarPrecoDeAssinatura,
  detectarRecorrencias,
  detectarSazonais,
  resumoDaFatura,
  type Lanc,
} from '../_shared/insights/detectores.ts'
import { textoDoInsight } from '../_shared/insights/textos.ts'
import { segundaDaSemana } from '../_shared/insights/semana.ts'

// Os insights das 10h (cron `insights-daily`, Bloco 6B): por carteira com
// movimento, os detectores, o resumo da fatura que fechou ontem ou anteontem,
// o relatório do mês (no dia 1) e o "a conferir". Cada achado novo vira um
// aviso para os membros; o push tem teto de 3 por pessoa e semana, e o resto
// fica só no app. Só o servidor chama: sem CORS.
// Sobe só com o front 2.0: os links (`/previsao`, a caixa do Painel) não
// existem no front antigo.
const corsHeaders = {} as Record<string, string>

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/** Mais de 5 itens a conferir vira insight (spec §11). */
const A_CONFERIR_MINIMO = 5

const TX_COLUMNS =
  'id,type,amount,date,description,category_id,payment_method,payment_credit_card_id,subscription_id,installment_plan_id,installment_sequence,needs_review,source'

type TxRow = CardTxRow & {
  id: string
  description: string | null
  subscription_id: string | null
  installment_plan_id: string | null
  installment_sequence: number | null
  needs_review: boolean
  source: string | null
}

type CardRow = { id: string; name: string; last_four: string | null; closing_day: number; due_day: number; is_active: boolean }

type PlanRow = {
  id: string
  description: string
  installment_amount: number
  total_installments: number
  generated_count: number
  next_billing_date: string
  is_active: boolean
}

type Linha = { workspace_id: string; user_id: null; kind: string; dedupe_key: string; payload: Record<string, unknown> }

type InsightRow = { id: string; kind: string; payload: Record<string, unknown> }

/** O cliente de serviço com as RPCs (o `SupabaseAdminClient` as deixa opcionais). */
type Admin = SupabaseAdminClient & Required<Pick<SupabaseAdminClient, 'rpc'>>

type Contagem = { novos: number; push: number; inApp: number; falhas: number }

/** O dia 1 do mês `n` meses antes de `x`. */
function inicioDoMes(x: Ymd, n: number): Ymd {
  const t = x.y * 12 + (x.m - 1) - n
  return { y: Math.floor(t / 12), m: (t % 12) + 1, d: 1 }
}

const fimDoMes = (x: Ymd): Ymd => ({ ...x, d: daysInMonth(x.y, x.m) })
const dia = (iso: string) => iso.slice(0, 10)
const centavos = (v: number | string) => Math.round(Number(v || 0) * 100)
const dentro = (iso: string, w: OpenWindow) => dia(iso) >= formatYmd(w.start) && dia(iso) <= formatYmd(w.end)

function lancDe(t: TxRow, ligadas: Set<string>): Lanc {
  return {
    id: t.id,
    type: t.type as Lanc['type'],
    amount: Number(t.amount),
    dateYmd: dia(t.date),
    description: t.description,
    category_id: t.category_id,
    payment_method: t.payment_method,
    payment_credit_card_id: t.payment_credit_card_id,
    subscription_id: t.subscription_id,
    installment_plan_id: t.installment_plan_id,
    ligadoAConta: ligadas.has(t.id),
    needs_review: t.needs_review,
  }
}

function linha(workspaceId: string, kind: string, achado: { chave: string; [k: string]: unknown }): Linha {
  const { chave, ...payload } = achado
  return { workspace_id: workspaceId, user_id: null, kind, dedupe_key: chave, payload }
}

/**
 * O cartão que fechou ontem ou anteontem (a janela do "fechou" do
 * `credit-card-calendar-alerts`, que tolera um dia perdido): o fechamento e os
 * 3 antes dele, do mais recente ao mais antigo. `null`: não fechou agora.
 */
function fechamentosRecentes(card: CardRow, hoje: Ymd): Ymd[] | null {
  const closingDay = Number(card.closing_day)
  if (!(closingDay >= 1 && closingDay <= 31)) return null
  const close = statementCloseOnOrBefore(hoje, closingDay)
  const dias = diffCalendarDays(close, hoje)
  if (dias !== 1 && dias !== 2) return null
  const closes = [close]
  for (let i = 0; i < 3; i++) closes.push(previousStatementCloseBefore(closes[i], closingDay))
  return closes
}

/**
 * O `fatura_fechou` de um cartão que fechou ontem ou anteontem (a janela do
 * `credit-card-calendar-alerts`). O total é o do banco, se gravado; a
 * diferença para o banco é a do calculado.
 */
function resumoDoCartao(
  card: CardRow,
  hoje: Ymd,
  tx: TxRow[],
  banco: Map<string, number>,
  nomes: Record<string, string>,
  planos: Map<string, PlanRow>,
): Linha['payload'] & { chave: string } | null {
  const closes = fechamentosRecentes(card, hoje)
  if (!closes) return null
  const close = closes[0]
  const [win, ...anteriores] = closes.map((c) => invoiceWindowEndingAt(c, Number(card.closing_day)))
  const bancoDe = (w: OpenWindow) => banco.get(statementTotalKey(card.id, formatYmd(w.end)))

  const calculado = cardInvoiceNetInWindow(tx, card.id, win)
  const bancoTotal = bancoDe(win)
  const total = escolherTotal(calculado, bancoTotal)
  if (total <= 0) return null

  const compras = tx.filter(
    (t) =>
      t.type === 'expense' &&
      t.payment_method === 'credit_card' &&
      t.payment_credit_card_id === card.id &&
      dentro(t.date, win),
  )
  const porCategoria = new Map<string, number>()
  for (const t of compras) {
    const nome = (t.category_id && nomes[t.category_id]) || 'Sem categoria'
    porCategoria.set(nome, (porCategoria.get(nome) ?? 0) + centavos(t.amount))
  }
  const parcela = (t: TxRow) => (t.installment_plan_id ? planos.get(t.installment_plan_id) : undefined)
  const nomeDaParcela = (t: TxRow) => parcela(t)?.description || t.description?.trim() || 'Parcela'

  const resumo = resumoDaFatura({
    cardId: card.id,
    cardNome: cardLabel(card.name, card.last_four),
    closeYmd: formatYmd(close),
    total,
    // A fechada sem movimento (o cartão novo) não entra na média, como na fatura alta.
    fechadasAnteriores: anteriores
      .map((w) => escolherTotal(cardInvoiceNetInWindow(tx, card.id, w), bancoDe(w)))
      .filter((v) => v > 0),
    porCategoria: [...porCategoria].map(([nome, c]) => ({ nome, total: c / 100 })),
    maiores: compras.map((t) => ({ descricao: t.description?.trim() || 'Sem descrição', valor: Number(t.amount) })),
    parcelasNovas: compras.filter((t) => parcela(t) && t.installment_sequence === 1).map(nomeDaParcela),
    parcelasAcabaram: compras
      .filter((t) => {
        const p = parcela(t)
        return p && p.total_installments > 1 && t.installment_sequence === p.total_installments
      })
      .map(nomeDaParcela),
    estornos: sumCardRefundsInWindow(tx, card.id, win),
    bancoTotal: bancoTotal ?? null,
  })
  return {
    ...resumo,
    diferencaBanco: bancoTotal == null ? null : (centavos(calculado) - centavos(bancoTotal)) / 100,
    chave: `fat:${card.id}:${formatYmd(close)}`,
  }
}

/**
 * O `relatorio_mes` do mês anterior: o que o app lançou sozinho (`source` ≠
 * 'app'), as faturas cujo total do banco não bate com o calculado e os
 * pagamentos feitos até o vencimento (contas e faturas).
 */
async function relatorioDoMes(
  admin: SupabaseAdminClient,
  workspaceId: string,
  hoje: Ymd,
  tx: TxRow[],
  cartoes: Map<string, CardRow>,
): Promise<{ chave: string; mes: string; lancados: number; diferencas: number; avisos: number }> {
  const inicio = inicioDoMes(hoje, 1)
  const fim = fimDoMes(inicio)
  const mes = formatYmd(inicio).slice(0, 7)
  // A fatura que vence no mês fechou no mês antes dele.
  const fechouAntes = inicioDoMes(hoje, 2)

  const [totais, contas, faturas] = await Promise.all([
    todasAsPaginas<{ credit_card_id: string; statement_close_date: string; bank_total: number | string }>((a, b) =>
      admin
        .from('credit_card_statement_totals')
        .select('id,credit_card_id,statement_close_date,bank_total')
        .eq('workspace_id', workspaceId)
        .gte('statement_close_date', formatYmd(inicio))
        .lte('statement_close_date', formatYmd(fim))
        .order('id', { ascending: true })
        .range(a, b)
    ),
    todasAsPaginas<{ due_date: string; paid_at: string | null }>((a, b) =>
      admin
        .from('bill_instances')
        .select('id,due_date,paid_at')
        .eq('workspace_id', workspaceId)
        .eq('status', 'paid')
        .gte('due_date', formatYmd(inicio))
        .lte('due_date', formatYmd(fim))
        .order('id', { ascending: true })
        .range(a, b)
    ),
    todasAsPaginas<{ credit_card_id: string; statement_close_date: string; paid_at: string | null }>((a, b) =>
      admin
        .from('credit_card_invoice_payments')
        .select('id,credit_card_id,statement_close_date,paid_at')
        .eq('workspace_id', workspaceId)
        .gte('statement_close_date', formatYmd(fechouAntes))
        .lte('statement_close_date', formatYmd(fimDoMes(fechouAntes)))
        .order('id', { ascending: true })
        .range(a, b)
    ),
  ])

  let diferencas = 0
  for (const r of totais) {
    const card = cartoes.get(r.credit_card_id)
    const close = isoPrefixYmd(String(r.statement_close_date))
    if (!card || !close) continue
    const calculado = cardInvoiceNetInWindow(tx, card.id, invoiceWindowEndingAt(close, Number(card.closing_day)))
    if (centavos(r.bank_total) !== centavos(calculado)) diferencas += 1
  }

  let avisos = contas.filter((c) => c.paid_at && dia(c.paid_at) <= dia(c.due_date)).length
  for (const p of faturas) {
    const card = cartoes.get(p.credit_card_id)
    const close = isoPrefixYmd(String(p.statement_close_date))
    if (!card || !close || !p.paid_at) continue
    if (dia(p.paid_at) <= formatYmd(estimatedDueYmdForClose(close, Number(card.due_day)))) avisos += 1
  }

  return {
    chave: `rel:${mes}`,
    mes,
    lancados: tx.filter((t) => dia(t.date).startsWith(mes) && t.source !== 'app').length,
    diferencas,
    avisos,
  }
}

/** Os achados da carteira; `null` quando ela não teve movimento nos últimos 120 dias. */
async function achadosDaCarteira(admin: SupabaseAdminClient, workspaceId: string, hoje: Ymd, semana: string) {
  const hojeYmd = formatYmd(hoje)
  // 4 meses inteiros mais o atual: a média de 3 meses do atípico e as 3
  // fechadas antes da fatura que fechou cabem nela.
  const tx = await todasAsPaginas<TxRow>((a, b) =>
    admin
      .from('transactions')
      .select(TX_COLUMNS)
      .eq('workspace_id', workspaceId)
      .gte('date', filterRangeStartIso(inicioDoMes(hoje, 4)))
      .order('id', { ascending: true })
      .range(a, b)
  )
  const desde = formatYmd(addCalendarDays(hoje, -120))
  if (!tx.some((t) => dia(t.date) >= desde)) return null

  // O sazonal olha janeiro a março do ano anterior, fora da janela de 4 meses.
  const sazonal = hojeYmd.slice(5) <= '02-15'
  const [assinaturas, planos, cartoes, ligadas, categorias, contas, passados, conferir] = await Promise.all([
    todasAsPaginas<{ id: string; name: string; amount: number; is_active: boolean; kind: string }>((a, b) =>
      admin
        .from('workspace_subscriptions')
        .select('id,name,amount,is_active,kind')
        .eq('workspace_id', workspaceId)
        .eq('is_active', true)
        .order('id', { ascending: true })
        .range(a, b)
    ),
    todasAsPaginas<PlanRow>((a, b) =>
      admin
        .from('workspace_installment_plans')
        .select('id,description,installment_amount,total_installments,generated_count,next_billing_date,is_active')
        .eq('workspace_id', workspaceId)
        .order('id', { ascending: true })
        .range(a, b)
    ),
    todasAsPaginas<CardRow>((a, b) =>
      admin
        .from('credit_cards')
        .select('id,name,last_four,closing_day,due_day,is_active')
        .eq('workspace_id', workspaceId)
        .order('id', { ascending: true })
        .range(a, b)
    ),
    todasAsPaginas<{ transaction_id: string }>((a, b) =>
      admin
        .from('bill_instances')
        .select('id,transaction_id')
        .eq('workspace_id', workspaceId)
        .not('transaction_id', 'is', null)
        .order('id', { ascending: true })
        .range(a, b)
    ),
    todasAsPaginas<{ id: string; name: string }>((a, b) =>
      admin
        .from('categories')
        .select('id,name')
        .eq('workspace_id', workspaceId)
        .order('id', { ascending: true })
        .range(a, b)
    ),
    sazonal
      ? todasAsPaginas<{ name: string }>((a, b) =>
          admin
            .from('bills')
            .select('id,name')
            .eq('workspace_id', workspaceId)
            .eq('is_active', true)
            .order('id', { ascending: true })
            .range(a, b)
        )
      : Promise.resolve([]),
    sazonal
      ? todasAsPaginas<TxRow>((a, b) =>
          admin
            .from('transactions')
            .select(TX_COLUMNS)
            .eq('workspace_id', workspaceId)
            .eq('type', 'expense')
            .gte('date', filterRangeStartIso({ y: hoje.y - 1, m: 1, d: 1 }))
            .lte('date', filterRangeEndIso({ y: hoje.y - 1, m: 3, d: 31 }))
            .order('id', { ascending: true })
            .range(a, b)
        )
      : Promise.resolve([]),
    admin
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('needs_review', true),
  ])
  if (conferir.error) throw new Error(conferir.error.message)

  const ligadasSet = new Set(ligadas.map((l) => l.transaction_id))
  const lancs = tx.map((t) => lancDe(t, ligadasSet))
  const nomes = Object.fromEntries(categorias.map((c) => [c.id, c.name]))
  const planosMap = new Map(planos.map((p) => [p.id, p]))
  const cartoesMap = new Map(cartoes.map((c) => [c.id, c]))
  const ativos = cartoes.filter((c) => c.is_active)

  const linhas: Linha[] = [
    ...detectarRecorrencias(lancs, hojeYmd).map((a) => linha(workspaceId, 'recorrencia', a)),
    ...detectarAtipicos(lancs, hojeYmd, nomes).map((a) => linha(workspaceId, 'gasto_atipico', a)),
    ...detectarDuplicidades(lancs).map((a) => linha(workspaceId, 'duplicidade', a)),
    ...detectarPrecoDeAssinatura(lancs, assinaturas, hojeYmd).map((a) => linha(workspaceId, 'preco_assinatura', a)),
    ...detectarParcelasAcabando(planos, hojeYmd).map((a) => linha(workspaceId, 'parcelas_acabando', a)),
    ...detectarSazonais(
      passados.map((t) => lancDe(t, ligadasSet)),
      hojeYmd,
      contas.map((c) => c.name),
    ).map((a) => linha(workspaceId, 'sazonal', a)),
  ]

  // Um por semana enquanto passar de 5.
  const n = conferir.count ?? 0
  if (n > A_CONFERIR_MINIMO) linhas.push(linha(workspaceId, 'a_conferir', { chave: `conf:${semana}`, n }))

  // O total do banco das fechadas em jogo (a que fechou e as 3 antes dela).
  const fechadas = ativos.flatMap((c) =>
    (fechamentosRecentes(c, hoje) ?? []).map((x) => ({ cardId: c.id, close: formatYmd(x) }))
  )
  const banco = new Map<string, number>()
  if (fechadas.length > 0) {
    const { data, error } = await admin
      .from('credit_card_statement_totals')
      .select('credit_card_id,statement_close_date,bank_total')
      .eq('workspace_id', workspaceId)
      .in('credit_card_id', [...new Set(fechadas.map((f) => f.cardId))])
      .in('statement_close_date', [...new Set(fechadas.map((f) => f.close))])
    if (error) throw new Error(error.message)
    for (const r of data ?? []) {
      banco.set(statementTotalKey(String(r.credit_card_id), dia(String(r.statement_close_date))), Number(r.bank_total))
    }
  }
  for (const c of ativos) {
    const r = resumoDoCartao(c, hoje, tx, banco, nomes, planosMap)
    if (r) linhas.push(linha(workspaceId, 'fatura_fechou', r))
  }

  if (hoje.d === 1) {
    linhas.push(linha(workspaceId, 'relatorio_mes', await relatorioDoMes(admin, workspaceId, hoje, tx, cartoesMap)))
  }

  return linhas
}

/**
 * Avisa os membros de cada insight novo. O push só vai a quem reivindicou um
 * envio da semana (`reivindicar_push_de_insight`, até 3); os outros recebem só
 * no app. E-mail não: insight não é essencial.
 */
async function avisar(
  admin: Admin,
  workspaceId: string,
  novos: InsightRow[],
  semana: string,
  c: Contagem,
): Promise<void> {
  const { data: memberRows, error: mErr } = await admin
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)
  if (mErr) throw new Error(mErr.message)
  const membros = (memberRows ?? []).map((m: { user_id: string }) => m.user_id)
  if (membros.length === 0) return

  const [prefsMap, silRes] = await Promise.all([
    loadWorkspacePrefsMap(admin, workspaceId, membros),
    admin.from('insights_silenciados').select('user_id,kind').in('user_id', membros),
  ])
  if (silRes.error) throw new Error(silRes.error.message)
  const silenciados = new Set((silRes.data ?? []).map((s: { user_id: string; kind: string }) => `${s.user_id}:${s.kind}`))

  for (const ins of novos) {
    const texto = textoDoInsight(ins.kind, ins.payload ?? {})
    const href = texto.acao?.href ?? '/dashboard'
    for (const userId of membros) {
      if (silenciados.has(`${userId}:${ins.kind}`)) continue
      const prefs = prefsMap.get(userId)
      if (!prefs || prefs.notify_insights === false) continue
      if (!prefs.notify_in_app && !prefs.notify_push) continue
      try {
        // Só quem quer push gasta o teto da semana.
        let comPush = false
        if (prefs.notify_push) {
          const { data, error } = await admin.rpc('reivindicar_push_de_insight', { p_user_id: userId, p_semana: semana })
          if (error) throw new Error(error.message)
          comPush = data === true
        }
        const r = await deliverNotification({
          supabaseAdmin: admin,
          userId,
          workspaceId,
          type: 'insight',
          title: texto.titulo,
          body: texto.corpo,
          metadata: { kind: ins.kind, insight_id: ins.id, href },
          prefs,
          semPush: !comPush,
        })
        if (!r.ok) throw new Error(r.error)
        if (r.push.sent > 0) c.push += 1
        else if (r.in_app) c.inApp += 1
      } catch (e) {
        // O insight já está na caixa: um aviso que falha não derruba os outros.
        console.error('insights-daily: aviso', workspaceId, userId, e instanceof Error ? e.message : e)
        c.falhas += 1
      }
    }
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  if (!secretMatches(Deno.env.get('CRON_SECRET'), req.headers.get('x-cron-secret'))) {
    return json(401, { error: 'Unauthorized' })
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const hoje = appTodayYmd()
  const semana = segundaDaSemana(formatYmd(hoje))

  let ids: string[]
  try {
    ids = (
      await todasAsPaginas<{ id: string }>((a, b) =>
        admin.from('workspaces').select('id').order('id', { ascending: true }).range(a, b)
      )
    ).map((w) => w.id)
  } catch (e) {
    return json(500, { error: internalError('insights-daily', e) })
  }

  let carteiras = 0
  const c: Contagem = { novos: 0, push: 0, inApp: 0, falhas: 0 }

  await forEachLimit(ids, FAN_OUT_CONCURRENCY, async (workspaceId) => {
    try {
      const linhas = await achadosDaCarteira(admin, workspaceId, hoje, semana)
      if (!linhas) return
      carteiras += 1
      if (linhas.length === 0) return

      // `on conflict do nothing` no índice de dedupe: só as linhas novas voltam,
      // e o fato de ontem (ou o descartado) não avisa de novo.
      const { data, error } = await admin.rpc('inserir_insights', { p_linhas: linhas })
      if (error) throw new Error(error.message)
      const novos = (data ?? []) as InsightRow[]
      c.novos += novos.length
      if (novos.length > 0) await avisar(admin, workspaceId, novos, semana, c)
    } catch (e) {
      console.error('insights-daily: carteira', workspaceId, e instanceof Error ? e.message : e)
      c.falhas += 1
    }
  })

  return json(200, {
    ok: true,
    carteiras,
    novos: c.novos,
    push: c.push,
    inApp: c.inApp,
    falhas: c.falhas,
    today: formatYmd(hoje),
  })
})
