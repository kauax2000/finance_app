import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'
import { internalError } from '../_shared/http.ts'
import { FAN_OUT_CONCURRENCY, forEachLimit } from '../_shared/for-each-limit.ts'
import { secretMatches } from '../_shared/timing-safe-equal.ts'
import {
  deliverNotification,
  loadWorkspacePrefsMap,
} from '../_shared/deliver-notification.ts'
import type { SupabaseAdminClient } from '../_shared/supabase-admin.ts'
import { cardLabel, ddmm, invoiceCopy } from '../_shared/notification-copy.ts'
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
  sumCardExpensesInWindow,
  appTodayYmd,
  type CardTxRow,
  type OpenWindow,
  type Ymd,
} from '../_shared/credit-card-cycle.ts'

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

type ReadyEvent = CalEvent & { title: string; body: string }

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
 * Põe valor e texto nos eventos de um cartão: soma as faturas, descarta a
 * zerada (`invoiceCopy` devolve null) e a de vencimento já paga.
 */
async function resolveCardEvents(
  admin: SupabaseAdminClient,
  workspaceId: string,
  label: string,
  events: CalEvent[]
): Promise<ReadyEvent[]> {
  const cardId = events[0].cardId
  const from = events.reduce((m, e) => (compareYmd(e.win.start, m) < 0 ? e.win.start : m), events[0].win.start)
  const to = events.reduce((m, e) => (compareYmd(e.win.end, m) > 0 ? e.win.end : m), events[0].win.end)

  const { data: txRows, error: txErr } = await admin
    .from('transactions')
    .select('amount,type,date,payment_method,payment_credit_card_id,category_id')
    .eq('workspace_id', workspaceId)
    .eq('payment_credit_card_id', cardId)
    .eq('type', 'expense')
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
    const copy = invoiceCopy({
      cartao: label,
      evento: ev.evento,
      valor: sumCardExpensesInWindow(rows, cardId, ev.win),
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
  const eventsByWorkspace = new Map<string, Array<{ label: string; events: CalEvent[] }>>()
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
      if (events.length === 0) continue
      const list = eventsByWorkspace.get(card.workspace_id) ?? []
      list.push({ label: cardLabel(card.name, card.last_four), events })
      eventsByWorkspace.set(card.workspace_id, list)
    }

    if (batch.length < CARD_PAGE_SIZE) break
  }

  // 2. Per workspace: load members + prefs + emails ONCE, then fan out.
  //    Per-item failures are accumulated — one bad workspace never aborts the
  //    daily run for the rest.
  let notified = 0
  const errors: Array<Record<string, unknown>> = []

  await forEachLimit(eventsByWorkspace, FAN_OUT_CONCURRENCY, async ([workspaceId, cards]) => {
    try {
      const events: ReadyEvent[] = []
      for (const c of cards) {
        // A consulta de um cartão que falha não derruba os outros do dia.
        try {
          events.push(...(await resolveCardEvents(admin, workspaceId, c.label, c.events)))
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'card_failed'
          console.error('credit-card-calendar-alerts: card', c.events[0].cardId, msg)
          errors.push({ workspace_id: workspaceId, credit_card_id: c.events[0].cardId, error: msg })
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
          if (!prefs || prefs.notify_credit_card_calendar === false) continue
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
              // Só o `notify_credit_card_calendar` (conferido acima) vale aqui: o
              // interruptor de limite e categorias não desliga o calendário.
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
