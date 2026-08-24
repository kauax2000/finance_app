import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { secretMatches } from '../_shared/timing-safe-equal.ts'
import {
  deliverNotification,
  loadWorkspacePrefsMap,
} from '../_shared/deliver-notification.ts'
import type { SupabaseAdminClient } from '../_shared/supabase-admin.ts'
import {
  compareYmd,
  diffCalendarDays,
  formatYmd,
  nextCloseAfter,
  nextPaymentDueOnOrAfter,
  statementCloseOnOrBefore,
  appTodayYmd,
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

type CalEvent = {
  cardId: string
  href: string
  dedupeKey: string
  kind: string
  title: string
  body: string
}

function ddmm(ymd: string): string {
  return ymd.split('-').reverse().join('/')
}

function buildCardEvents(card: CardRow, today: ReturnType<typeof appTodayYmd>): CalEvent[] {
  const closingDay = Number(card.closing_day)
  const dueDay = Number(card.due_day)
  if (!closingDay || closingDay < 1 || closingDay > 31 || !dueDay || dueDay < 1 || dueDay > 31) {
    return []
  }

  const lastClose = statementCloseOnOrBefore(today, closingDay)
  const nextClose = nextCloseAfter(lastClose, closingDay)
  const cardLabel = `${card.name} · ${card.last_four}`
  const href = `/credit-cards/${encodeURIComponent(card.id)}`
  const events: CalEvent[] = []

  if (compareYmd(today, lastClose) === 0) {
    events.push({
      cardId: card.id,
      href,
      dedupeKey: `cal:closed:${formatYmd(today)}:c:${card.id}`,
      kind: 'cc_invoice_closed',
      title: 'Fatura fechou',
      body: `A fatura do cartão ${cardLabel} fecha hoje (${ddmm(formatYmd(today))}).`,
    })
  }

  const daysToClose = diffCalendarDays(today, nextClose)
  if (daysToClose === 3) {
    events.push({
      cardId: card.id,
      href,
      dedupeKey: `cal:closing_soon:${formatYmd(nextClose)}:c:${card.id}`,
      kind: 'cc_invoice_closing_soon',
      title: 'Fatura fecha em breve',
      body: `Faltam 3 dias para o fechamento da fatura do cartão ${cardLabel} (fechamento em ${ddmm(formatYmd(nextClose))}).`,
    })
  }

  let dueNext: ReturnType<typeof nextPaymentDueOnOrAfter>
  try {
    dueNext = nextPaymentDueOnOrAfter(today, closingDay, dueDay)
  } catch {
    return events
  }

  if (diffCalendarDays(today, dueNext) === 3) {
    events.push({
      cardId: card.id,
      href,
      dedupeKey: `cal:due_soon:${formatYmd(dueNext)}:c:${card.id}`,
      kind: 'cc_payment_due_soon',
      title: 'Vencimento da fatura se aproxima',
      body: `Faltam 3 dias para o vencimento estimado da fatura do cartão ${cardLabel} (${ddmm(formatYmd(dueNext))}).`,
    })
  }

  if (compareYmd(today, dueNext) === 0) {
    events.push({
      cardId: card.id,
      href,
      dedupeKey: `cal:due_today:${formatYmd(dueNext)}:c:${card.id}`,
      kind: 'cc_payment_due_today',
      title: 'Vencimento da fatura hoje',
      body: `Hoje é o vencimento estimado da fatura do cartão ${cardLabel}.`,
    })
  }

  return events
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

  // 1. Paginate the global active-card scan and compute events per workspace.
  const eventsByWorkspace = new Map<string, CalEvent[]>()
  let cardsScanned = 0

  for (let page = 0; ; page++) {
    const from = page * CARD_PAGE_SIZE
    const { data: cards, error: cErr } = await admin
      .from('credit_cards')
      .select('id, workspace_id, name, last_four, closing_day, due_day, is_active')
      .eq('is_active', true)
      .order('id', { ascending: true })
      .range(from, from + CARD_PAGE_SIZE - 1)

    if (cErr) return json(500, { error: cErr.message })

    const batch = (cards ?? []) as CardRow[]
    cardsScanned += batch.length

    for (const card of batch) {
      const events = buildCardEvents(card, today)
      if (events.length === 0) continue
      const list = eventsByWorkspace.get(card.workspace_id) ?? []
      list.push(...events)
      eventsByWorkspace.set(card.workspace_id, list)
    }

    if (batch.length < CARD_PAGE_SIZE) break
  }

  // 2. Per workspace: load members + prefs + emails ONCE, then fan out.
  //    Per-item failures are accumulated — one bad workspace never aborts the
  //    daily run for the rest.
  let notified = 0
  const errors: Array<Record<string, unknown>> = []

  for (const [workspaceId, events] of eventsByWorkspace) {
    try {
      const { data: memberRows, error: mErr } = await admin
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', workspaceId)
      if (mErr) throw new Error(mErr.message)

      const memberIds = (memberRows ?? []).map((m: { user_id: string }) => m.user_id)
      if (memberIds.length === 0) continue

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
  }

  return json(200, {
    ok: true,
    notified,
    cards_scanned: cardsScanned,
    workspaces: eventsByWorkspace.size,
    errors: errors.length > 0 ? errors : undefined,
    today: formatYmd(today),
  })
})
