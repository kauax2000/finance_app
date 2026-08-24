import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { secretMatches } from '../_shared/timing-safe-equal.ts'
import {
  deliverNotification,
  loadWorkspacePrefsMap,
} from '../_shared/deliver-notification.ts'
import type { SupabaseAdminClient } from '../_shared/supabase-admin.ts'
import {
  addCalendarDays,
  compareYmd,
  diffCalendarDays,
  formatYmd,
  isoPrefixYmd,
  appTodayYmd,
} from '../_shared/credit-card-cycle.ts'

// Server-to-server only (cron/scheduler): no CORS — browsers have no business
// probing this endpoint with the shared secret.
const corsHeaders = {} as Record<string, string>

const INSTANCE_PAGE_SIZE = 500

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

type BillRowMini = {
  id: string
  name: string
  reminder_days_before: number[] | null
  is_active: boolean
}

type InstanceRow = {
  id: string
  workspace_id: string
  bill_id: string
  due_date: string
  bills: BillRowMini | BillRowMini[] | null
}

type DedupeRow = {
  workspace_id: string
  bill_instance_id: string
  reminder_offset_days: number
  user_id: string
}

async function claimDedupe(admin: SupabaseAdminClient, row: DedupeRow): Promise<boolean> {
  const { error } = await admin.from('bill_notification_dedupe').insert(row)
  if (error?.code === '23505') return false
  if (error) throw new Error(error.message)
  return true
}

/** Compensation when delivery failed after the dedupe row was claimed. */
async function releaseDedupe(admin: SupabaseAdminClient, row: DedupeRow): Promise<void> {
  try {
    await admin
      .from('bill_notification_dedupe')
      .delete()
      .eq('workspace_id', row.workspace_id)
      .eq('bill_instance_id', row.bill_instance_id)
      .eq('reminder_offset_days', row.reminder_offset_days)
      .eq('user_id', row.user_id)
  } catch (e) {
    console.error('evaluate-bills-reminders: releaseDedupe failed:', e)
  }
}

type ReminderEvent = {
  instanceId: string
  billId: string
  billName: string
  dueStr: string
  offset: number
  title: string
  body: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  if (!secretMatches(Deno.env.get('CRON_SECRET'), req.headers.get('x-cron-secret'))) {
    return json(401, { error: 'Unauthorized' })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, serviceKey)

  const today = appTodayYmd()
  const todayKey = formatYmd(today)
  /** Pending instances far in the future cannot trigger reminders yet; skip full-table scan. */
  const reminderHorizon = formatYmd(addCalendarDays(today, 120))

  // 1. Paginated scan of pending instances; compute reminder events per workspace.
  const eventsByWorkspace = new Map<string, ReminderEvent[]>()
  let instancesScanned = 0

  for (let page = 0; ; page++) {
    const from = page * INSTANCE_PAGE_SIZE
    const { data: instances, error: iErr } = await admin
      .from('bill_instances')
      .select(`
        id,
        workspace_id,
        bill_id,
        due_date,
        status,
        bills(id, name, reminder_days_before, is_active)
      `)
      .eq('status', 'pending')
      .lte('due_date', reminderHorizon)
      .order('id', { ascending: true })
      .range(from, from + INSTANCE_PAGE_SIZE - 1)

    if (iErr) return json(500, { error: iErr.message })

    const batch = (instances ?? []) as InstanceRow[]
    instancesScanned += batch.length

    for (const raw of batch) {
      const dueStr = typeof raw.due_date === 'string' ? raw.due_date.slice(0, 10) : ''
      const dueY = isoPrefixYmd(`${dueStr}T12:00:00.000Z`)
      if (!dueY) continue

      const daysUntil = diffCalendarDays(today, dueY)
      const isPast = compareYmd(dueY, today) < 0
      const bEmbed = raw.bills
      const billMini = Array.isArray(bEmbed) ? (bEmbed[0] ?? null) : bEmbed
      if (!billMini || !billMini.is_active) continue

      const configured = Array.isArray(billMini.reminder_days_before)
        ? billMini.reminder_days_before
        : [3, 0]

      /** Pre-due/day-of offsets; overdue uses fixed -1 dedupe/day */
      const hitOffsets = isPast
        ? [-1]
        : [...new Set(configured)].filter((o) => o === daysUntil)
      if (hitOffsets.length === 0) continue

      const prettyDue = dueStr.split('-').reverse().join('/')
      for (const offset of hitOffsets) {
        let title: string
        let body: string
        if (offset === -1) {
          title = `Conta atrasada · ${billMini.name}`
          body = `“${billMini.name}” estava prevista para ${prettyDue}. Registre o pagamento com o valor real.`
        } else if (offset === 0) {
          title = `Conta vence hoje · ${billMini.name}`
          body = `“${billMini.name}” vence hoje (${prettyDue}).`
        } else {
          title = `Conta a pagar · ${billMini.name}`
          body = `“${billMini.name}” vence em ${prettyDue}. Faltam ${offset} dia(s).`
        }

        const list = eventsByWorkspace.get(raw.workspace_id) ?? []
        list.push({
          instanceId: raw.id,
          billId: billMini.id,
          billName: billMini.name,
          dueStr,
          offset,
          title,
          body,
        })
        eventsByWorkspace.set(raw.workspace_id, list)
      }
    }

    if (batch.length < INSTANCE_PAGE_SIZE) break
  }

  // 2. Per workspace: members + prefs + emails loaded ONCE; per-item failures
  //    accumulate instead of aborting the daily run.
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
          if (!prefs || prefs.notify_bills === false) continue
          if (!prefs.notify_in_app && !prefs.notify_email && !prefs.notify_push) continue

          const dedupeRow: DedupeRow = {
            workspace_id: workspaceId,
            bill_instance_id: ev.instanceId,
            reminder_offset_days: ev.offset,
            user_id: userId,
          }

          try {
            const claimed = await claimDedupe(admin, dedupeRow)
            if (!claimed) continue

            const delivered = await deliverNotification({
              supabaseAdmin: admin,
              userId,
              userEmail: emails.get(userId) ?? null,
              workspaceId,
              type: 'bill',
              title: ev.title,
              body: ev.body,
              metadata: {
                kind: 'bill_reminder',
                bill_id: ev.billId,
                bill_instance_id: ev.instanceId,
                due_date: ev.dueStr,
                offset_days: ev.offset,
                href: '/bills',
              },
              prefs,
            })

            if (!delivered.ok) {
              await releaseDedupe(admin, dedupeRow)
              errors.push({ workspace_id: workspaceId, user_id: userId, error: delivered.error })
              continue
            }
            notified += 1
          } catch (e) {
            await releaseDedupe(admin, dedupeRow)
            const msg = e instanceof Error ? e.message : 'delivery_failed'
            console.error('evaluate-bills-reminders:', msg)
            errors.push({ workspace_id: workspaceId, user_id: userId, error: msg })
          }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'workspace_failed'
      console.error('evaluate-bills-reminders: workspace', workspaceId, msg)
      errors.push({ workspace_id: workspaceId, error: msg })
    }
  }

  return json(200, {
    ok: true,
    notified,
    instances_scanned: instancesScanned,
    workspaces: eventsByWorkspace.size,
    errors: errors.length > 0 ? errors : undefined,
    today: todayKey,
  })
})
