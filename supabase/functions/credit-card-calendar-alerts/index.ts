import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'
import { internalError } from '../_shared/http.ts'
import { FAN_OUT_CONCURRENCY, forEachLimit } from '../_shared/for-each-limit.ts'
import { secretMatches } from '../_shared/timing-safe-equal.ts'
import {
  deliverNotification,
  loadWorkspacePrefsMap,
} from '../_shared/deliver-notification.ts'
import type { SupabaseAdminClient } from '../_shared/supabase-admin.ts'
import { cardLabel, type Copy, ddmm, invoiceCopy, trendingHighCopy } from '../_shared/notification-copy.ts'
import { withinReminderWindow } from '../_shared/notification-schedule.ts'
import {
  addCalendarDays,
  compareYmd,
  diffCalendarDays,
  estimatedDueYmdForClose,
  filterRangeEndIso,
  filterRangeStartIso,
  formatYmd,
  nextCloseAfter,
  nextPaymentDueCycleOnOrAfter,
  previousStatementCloseBefore,
  statementCloseOnOrBefore,
  cardInvoiceNetInWindow,
  escolherTotal,
  statementTotalKey,
  appTodayYmd,
  type CardTxRow,
  type OpenWindow,
  type Ymd,
} from '../_shared/credit-card-cycle.ts'
import {
  avaliarTendencia,
  parcelasProjetadasNaJanela,
  type ParcelaTxRow,
  type PlanoNoCartao,
} from '../_shared/fatura-tendencia.ts'

// Server-to-server only (cron/scheduler): no CORS — browsers have no business
// probing this endpoint with the shared secret.
const corsHeaders = {} as Record<string, string>

const CARD_PAGE_SIZE = 500

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function tryClaimDedupe(
  admin: SupabaseAdminClient,
  workspaceId: string,
  cardId: string,
  dedupeKey: string
): Promise<boolean> {
  const { error } = await admin.from('credit_card_notification_dedupe').insert({
    workspace_id: workspaceId,
    credit_card_id: cardId,
    dedupe_key: dedupeKey,
  })
  if (error?.code === '23505') return false
  if (error) throw new Error(error.message)
  return true
}

async function releaseDedupe(
  admin: SupabaseAdminClient,
  workspaceId: string,
  cardId: string,
  dedupeKey: string
): Promise<void> {
  try {
    await admin
      .from('credit_card_notification_dedupe')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('credit_card_id', cardId)
      .eq('dedupe_key', dedupeKey)
  } catch (e) {
    console.error('credit-card-calendar-alerts: releaseDedupe failed:', e)
  }
}

type CardRow = {
  id: string
  workspace_id: string
  name: string
  last_four: string
  closing_day: number
  due_day: number
  is_active: boolean
}

type InvoiceEvent = 'closed' | 'closing_soon' | 'due_soon' | 'due_today'

type CalEvent = {
  cardId: string
  href: string
  dedupeKey: string
  kind: string
  evento: InvoiceEvent
  /** A fatura de que o aviso fala: o valor é a soma dela. */
  win: OpenWindow
  /** Data mostrada no corpo, em dd/mm. */
  data: string
  dias?: number
  /** Só nos de vencimento: a fatura paga não avisa. */
  checkPaid: boolean
}

/** A fatura alta: `win` é a aberta; `fechadas`, as 3 últimas, da mais recente para a mais antiga. */
type TrendingEvent = Omit<CalEvent, 'evento'> & { evento: 'trending_high'; fechadas: OpenWindow[] }

type ReadyEvent = (CalEvent | TrendingEvent) & { title: string; body: string }

/**
 * O aviso fala de uma fatura fechada (fechou, vence em breve, vence hoje): o
 * total do banco, se gravado, vale sobre o calculado. A que ainda fecha não tem.
 */
function isClosedCycle(ev: CalEvent): boolean {
  return ev.evento !== 'closing_soon'
}

/** A fatura que fecha em `close`: do dia seguinte ao fechamento anterior até ele. */
function invoiceWindowEndingAt(close: Ymd, closingDay: number): OpenWindow {
  return { start: addCalendarDays(previousStatementCloseBefore(close, closingDay), 1), end: close }
}

function buildCardEvents(card: CardRow, today: Ymd): CalEvent[] {
  const closingDay = Number(card.closing_day)
  const dueDay = Number(card.due_day)
  if (!closingDay || closingDay < 1 || closingDay > 31 || !dueDay || dueDay < 1 || dueDay > 31) {
    return []
  }

  const lastClose = statementCloseOnOrBefore(today, closingDay)
  const nextClose = nextCloseAfter(lastClose, closingDay)
  const href = `/credit-cards/${encodeURIComponent(card.id)}`
  const base = { cardId: card.id, href }
  const events: CalEvent[] = []

  // "Fechou" sai no dia seguinte ao fechamento, com o total final: no próprio
  // dia a fatura ainda recebe compras. Tolera um dia perdido, deduplicado pelo ciclo.
  const daysSinceClose = diffCalendarDays(lastClose, today)
  if (daysSinceClose === 1 || daysSinceClose === 2) {
    events.push({
      ...base,
      dedupeKey: `cal:closed:${formatYmd(lastClose)}:c:${card.id}`,
      kind: 'cc_invoice_closed',
      evento: 'closed',
      win: invoiceWindowEndingAt(lastClose, closingDay),
      data: ddmm(formatYmd(estimatedDueYmdForClose(lastClose, dueDay))),
      checkPaid: false,
    })
  }

  const daysToClose = diffCalendarDays(today, nextClose)
  if (withinReminderWindow(daysToClose, 3)) {
    events.push({
      ...base,
      dedupeKey: `cal:closing_soon:${formatYmd(nextClose)}:c:${card.id}`,
      kind: 'cc_invoice_closing_soon',
      evento: 'closing_soon',
      win: { start: addCalendarDays(lastClose, 1), end: nextClose },
      data: ddmm(formatYmd(nextClose)),
      dias: daysToClose,
      checkPaid: false,
    })
  }

  let dueCycle: { close: Ymd; due: Ymd }
  try {
    dueCycle = nextPaymentDueCycleOnOrAfter(today, closingDay, dueDay)
  } catch {
    return events
  }

  const daysToDue = diffCalendarDays(today, dueCycle.due)
  const due = {
    ...base,
    win: invoiceWindowEndingAt(dueCycle.close, closingDay),
    data: ddmm(formatYmd(dueCycle.due)),
    checkPaid: true,
  }
  if (withinReminderWindow(daysToDue, 3)) {
    events.push({
      ...due,
      dedupeKey: `cal:due_soon:${formatYmd(dueCycle.due)}:c:${card.id}`,
      kind: 'cc_payment_due_soon',
      evento: 'due_soon',
      dias: daysToDue,
    })
  }
  if (daysToDue === 0) {
    events.push({
      ...due,
      dedupeKey: `cal:due_today:${formatYmd(dueCycle.due)}:c:${card.id}`,
      kind: 'cc_payment_due_today',
      evento: 'due_today',
    })
  }

  return events
}

/**
 * A fatura alta é avaliada todo dia e avisada uma vez por ciclo: a chave é o
 * fechamento da fatura em aberto. Leva a Previsão, onde está o mês do vencimento.
 * Fica fora do `buildCardEvents` para não mexer na consulta dos avisos do calendário.
 */
function buildTrendingEvent(card: CardRow, today: Ymd): TrendingEvent | null {
  const closingDay = Number(card.closing_day)
  if (!closingDay || closingDay < 1 || closingDay > 31) return null
  const lastClose = statementCloseOnOrBefore(today, closingDay)
  const nextClose = nextCloseAfter(lastClose, closingDay)
  const close1 = previousStatementCloseBefore(lastClose, closingDay)
  return {
    cardId: card.id,
    href: '/previsao',
    dedupeKey: `cal:trending_high:${formatYmd(nextClose)}:c:${card.id}`,
    kind: 'cc_invoice_trending_high',
    evento: 'trending_high',
    win: { start: addCalendarDays(lastClose, 1), end: nextClose },
    fechadas: [lastClose, close1, previousStatementCloseBefore(close1, closingDay)].map((c) =>
      invoiceWindowEndingAt(c, closingDay)
    ),
    data: ddmm(formatYmd(nextClose)),
    checkPaid: false,
  }
}

const PAGE_SIZE = 1000

/** Lê todas as páginas: o PostgREST corta em `max_rows` (1000) sem erro. */
async function todasAsPaginas<T>(
  pagina: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await pagina(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(error.message)
    const batch = data ?? []
    out.push(...batch)
    if (batch.length < PAGE_SIZE) return out
  }
}

const PLAN_COLUMNS =
  'id,is_active,payment_method,payment_credit_card_id,next_billing_date,installment_amount,final_installment_amount,total_installments,generated_count,billing_anchor_day'

/**
 * A fatura alta: a aberta com as parcelas que ainda caem nela, contra as 3
 * últimas fechadas (com o total do banco, se gravado). `null`: não avisa.
 */
async function trendingCopy(
  admin: SupabaseAdminClient,
  workspaceId: string,
  label: string,
  ev: TrendingEvent
): Promise<Copy | null> {
  const fechadas = ev.fechadas
  const wins = [ev.win, ...fechadas]
  const from = wins.reduce((m, w) => (compareYmd(w.start, m) < 0 ? w.start : m), ev.win.start)
  const [rows, planos, totais] = await Promise.all([
    todasAsPaginas<ParcelaTxRow>((a, b) =>
      admin
        .from('transactions')
        .select('amount,type,date,payment_method,payment_credit_card_id,category_id,installment_plan_id,installment_sequence')
        .eq('workspace_id', workspaceId)
        .eq('payment_credit_card_id', ev.cardId)
        // Receita no cartão é estorno: abate a fatura.
        .in('type', ['expense', 'income'])
        .eq('payment_method', 'credit_card')
        .gte('date', filterRangeStartIso(from))
        .lte('date', filterRangeEndIso(ev.win.end))
        .order('id', { ascending: true })
        .range(a, b)
    ),
    todasAsPaginas<PlanoNoCartao>((a, b) =>
      admin
        .from('workspace_installment_plans')
        .select(PLAN_COLUMNS)
        .eq('workspace_id', workspaceId)
        .eq('is_active', true)
        .eq('payment_method', 'credit_card')
        // O plano antigo sem cartão entra se a parcela lançada o liga a este.
        .or(`payment_credit_card_id.eq.${ev.cardId},payment_credit_card_id.is.null`)
        .order('id', { ascending: true })
        .range(a, b)
    ),
    // Três linhas no máximo: uma por fechada.
    admin
      .from('credit_card_statement_totals')
      .select('statement_close_date,bank_total')
      .eq('credit_card_id', ev.cardId)
      .in('statement_close_date', fechadas.map((w) => formatYmd(w.end))),
  ])
  if (totais.error) throw new Error(totais.error.message)

  const banco = new Map<string, number>()
  for (const r of totais.data ?? []) banco.set(String(r.statement_close_date).slice(0, 10), Number(r.bank_total))
  const valores = fechadas
    .map((w) => escolherTotal(cardInvoiceNetInWindow(rows, ev.cardId, w), banco.get(formatYmd(w.end))))
    // A fatura sem movimento (o cartão novo) não conta como fechada, nem a que
    // fechou negativa (só estorno): ela baixaria a média e afrouxaria os 120%.
    .filter((v) => v > 0)
  // ponytail: a parcela lançada só é reconhecida pelas linhas do intervalo
  // consultado; uma que teve a data movida para fora dele seria contada de novo.
  const prevista =
    Math.round(
      (cardInvoiceNetInWindow(rows, ev.cardId, ev.win) +
        parcelasProjetadasNaJanela(ev.cardId, ev.win, planos, rows)) *
        100
    ) / 100
  const t = avaliarTendencia(prevista, valores)
  return t.dispara ? trendingHighCopy(label, prevista, t.percentual, t.acima) : null
}

/**
 * Põe valor e texto nos eventos de um cartão: soma as faturas, descarta a
 * zerada (`invoiceCopy` devolve null) e a de vencimento já paga.
 */
async function resolveCardEvents(
  admin: SupabaseAdminClient,
  workspaceId: string,
  label: string,
  events: CalEvent[],
  bankTotals: Map<string, number>
): Promise<ReadyEvent[]> {
  const cardId = events[0].cardId
  const from = events.reduce((m, e) => (compareYmd(e.win.start, m) < 0 ? e.win.start : m), events[0].win.start)
  const to = events.reduce((m, e) => (compareYmd(e.win.end, m) > 0 ? e.win.end : m), events[0].win.end)

  const { data: txRows, error: txErr } = await admin
    .from('transactions')
    .select('amount,type,date,payment_method,payment_credit_card_id,category_id')
    .eq('workspace_id', workspaceId)
    .eq('payment_credit_card_id', cardId)
    // Receita no cartão é estorno: abate a fatura.
    .in('type', ['expense', 'income'])
    .eq('payment_method', 'credit_card')
    .gte('date', filterRangeStartIso(from))
    .lte('date', filterRangeEndIso(to))
  if (txErr) throw new Error(txErr.message)
  const rows = (txRows ?? []) as CardTxRow[]

  const closes = [...new Set(events.filter((e) => e.checkPaid).map((e) => formatYmd(e.win.end)))]
  const paid = new Set<string>()
  if (closes.length > 0) {
    const { data: paidRows, error: pErr } = await admin
      .from('credit_card_invoice_payments')
      .select('statement_close_date')
      .eq('workspace_id', workspaceId)
      .eq('credit_card_id', cardId)
      .in('statement_close_date', closes)
    if (pErr) throw new Error(pErr.message)
    for (const r of paidRows ?? []) paid.add(String(r.statement_close_date).slice(0, 10))
  }

  const ready: ReadyEvent[] = []
  for (const ev of events) {
    if (ev.checkPaid && paid.has(formatYmd(ev.win.end))) continue
    const calculado = cardInvoiceNetInWindow(rows, cardId, ev.win)
    const copy = invoiceCopy({
      cartao: label,
      evento: ev.evento,
      valor: isClosedCycle(ev)
        ? escolherTotal(calculado, bankTotals.get(statementTotalKey(cardId, formatYmd(ev.win.end))))
        : calculado,
      data: ev.data,
      dias: ev.dias,
    })
    if (copy) ready.push({ ...ev, ...copy })
  }
  return ready
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  if (!secretMatches(Deno.env.get('CRON_SECRET'), req.headers.get('x-cron-secret'))) {
    return json(401, { error: 'Unauthorized' })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, supabaseServiceKey)

  const today = appTodayYmd()

  // 1. Paginate the global active-card scan and compute events per workspace
  //    (só as datas; o valor de cada fatura sai no passo 2, por cartão).
  const eventsByWorkspace = new Map<
    string,
    Array<{ label: string; events: CalEvent[]; tendencia: TrendingEvent | null }>
  >()
  let cardsScanned = 0

  for (let page = 0; ; page++) {
    const from = page * CARD_PAGE_SIZE
    const { data: cards, error: cErr } = await admin
      .from('credit_cards')
      .select('id, workspace_id, name, last_four, closing_day, due_day, is_active')
      .eq('is_active', true)
      .order('id', { ascending: true })
      .range(from, from + CARD_PAGE_SIZE - 1)

    if (cErr) return json(500, { error: internalError('credit-card-calendar-alerts', cErr) })

    const batch = (cards ?? []) as CardRow[]
    cardsScanned += batch.length

    for (const card of batch) {
      const events = buildCardEvents(card, today)
      const tendencia = buildTrendingEvent(card, today)
      if (events.length === 0 && !tendencia) continue
      const list = eventsByWorkspace.get(card.workspace_id) ?? []
      list.push({ label: cardLabel(card.name, card.last_four), events, tendencia })
      eventsByWorkspace.set(card.workspace_id, list)
    }

    if (batch.length < CARD_PAGE_SIZE) break
  }

  let notified = 0
  const errors: Array<Record<string, unknown>> = []

  // 1b. O total do banco das faturas fechadas em jogo, numa consulta só (o
  //     cruzamento cartões × fechamentos traz a mais; a chave filtra). Se ela
  //     falhar, os avisos saem com o total calculado, como antes.
  // ponytail: um `.in()` com todos os cartões do dia; em lotes se a URL crescer demais.
  const bankTotals = new Map<string, number>()
  const closedEvents = [...eventsByWorkspace.values()]
    .flatMap((list) => list.flatMap((c) => c.events))
    .filter(isClosedCycle)
  if (closedEvents.length > 0) {
    const { data: totalRows, error: tErr } = await admin
      .from('credit_card_statement_totals')
      .select('credit_card_id,statement_close_date,bank_total')
      .in('credit_card_id', [...new Set(closedEvents.map((e) => e.cardId))])
      .in('statement_close_date', [...new Set(closedEvents.map((e) => formatYmd(e.win.end)))])
    if (tErr) {
      console.error('credit-card-calendar-alerts: statement totals', tErr.message)
      errors.push({ error: `statement_totals: ${tErr.message}` })
    }
    for (const r of totalRows ?? []) {
      bankTotals.set(
        statementTotalKey(String(r.credit_card_id), String(r.statement_close_date).slice(0, 10)),
        Number(r.bank_total)
      )
    }
  }

  // 2. Per workspace: load members + prefs + emails ONCE, then fan out.
  //    Per-item failures are accumulated — one bad workspace never aborts the
  //    daily run for the rest.

  await forEachLimit(eventsByWorkspace, FAN_OUT_CONCURRENCY, async ([workspaceId, cards]) => {
    try {
      const events: ReadyEvent[] = []
      for (const c of cards) {
        // A consulta de um cartão que falha não derruba os outros do dia.
        if (c.events.length > 0) {
          try {
            events.push(...(await resolveCardEvents(admin, workspaceId, c.label, c.events, bankTotals)))
          } catch (e) {
            const msg = e instanceof Error ? e.message : 'card_failed'
            console.error('credit-card-calendar-alerts: card', c.events[0].cardId, msg)
            errors.push({ workspace_id: workspaceId, credit_card_id: c.events[0].cardId, error: msg })
          }
        }
        // A fatura alta tem consulta própria: a falha dela não derruba os outros avisos.
        if (c.tendencia) {
          try {
            const copy = await trendingCopy(admin, workspaceId, c.label, c.tendencia)
            if (copy) events.push({ ...c.tendencia, ...copy })
          } catch (e) {
            const msg = e instanceof Error ? e.message : 'trending_failed'
            console.error('credit-card-calendar-alerts: trending', c.tendencia.cardId, msg)
            errors.push({ workspace_id: workspaceId, credit_card_id: c.tendencia.cardId, error: `trending_high: ${msg}` })
          }
        }
      }
      if (events.length === 0) return

      const { data: memberRows, error: mErr } = await admin
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', workspaceId)
      if (mErr) throw new Error(mErr.message)

      const memberIds = (memberRows ?? []).map((m: { user_id: string }) => m.user_id)
      if (memberIds.length === 0) return

      const prefsMap = await loadWorkspacePrefsMap(admin, workspaceId, memberIds)

      const emails = new Map<string, string | null>()
      const { data: profRows, error: pErr } = await admin
        .from('profiles')
        .select('id,email')
        .in('id', memberIds)
      if (pErr) throw new Error(pErr.message)
      for (const p of profRows ?? []) {
        emails.set(p.id as string, ((p.email as string | null) ?? '').trim() || null)
      }

      for (const ev of events) {
        for (const userId of memberIds) {
          const prefs = prefsMap.get(userId)
          if (!prefs) continue
          // A fatura alta é aviso de cartão; os outros, do calendário.
          const ligado =
            ev.evento === 'trending_high' ? prefs.notify_credit_cards : prefs.notify_credit_card_calendar
          if (ligado === false) continue
          if (!prefs.notify_in_app && !prefs.notify_email && !prefs.notify_push) continue

          const userDedupe = `${ev.dedupeKey}:u:${userId}`
          try {
            const claimed = await tryClaimDedupe(admin, workspaceId, ev.cardId, userDedupe)
            if (!claimed) continue

            const delivered = await deliverNotification({
              supabaseAdmin: admin,
              userId,
              userEmail: emails.get(userId) ?? null,
              workspaceId,
              type: 'credit_card',
              title: ev.title,
              body: ev.body,
              metadata: { kind: ev.kind, credit_card_id: ev.cardId, href: ev.href },
              prefs,
              // Só o interruptor conferido acima vale aqui: o de limite e
              // categorias não desliga o calendário.
              skipTypePref: true,
            })

            if (!delivered.ok) {
              await releaseDedupe(admin, workspaceId, ev.cardId, userDedupe)
              errors.push({ workspace_id: workspaceId, user_id: userId, error: delivered.error })
              continue
            }
            notified += 1
          } catch (e) {
            await releaseDedupe(admin, workspaceId, ev.cardId, userDedupe)
            const msg = e instanceof Error ? e.message : 'delivery_failed'
            console.error('credit-card-calendar-alerts:', msg)
            errors.push({ workspace_id: workspaceId, user_id: userId, error: msg })
          }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'workspace_failed'
      console.error('credit-card-calendar-alerts: workspace', workspaceId, msg)
      errors.push({ workspace_id: workspaceId, error: msg })
    }
  })

  return json(200, {
    ok: true,
    notified,
    cards_scanned: cardsScanned,
    workspaces: eventsByWorkspace.size,
    errors: errors.length > 0 ? errors : undefined,
    today: formatYmd(today),
  })
})
