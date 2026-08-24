import type { SupabaseAdminClient } from './supabase-admin.ts'
import { renderEmailHtml, sendEmailResend } from './notification-email.ts'
import {
  DEFAULT_NOTIFICATION_PREFS,
  isTypeAllowedForPrefs,
  type NotificationEventType,
  type WorkspaceNotificationPrefs,
} from './notification-types.ts'
import { buildPushPayload, sendWebPushToUser } from './web-push-send.ts'

export type DeliverNotificationInput = {
  supabaseAdmin: SupabaseAdminClient
  userId: string
  userEmail?: string | null
  workspaceId: string
  type: NotificationEventType
  title: string
  body: string
  metadata?: Record<string, unknown>
  /** When false, skips transaction type entirely (product rule). Default true. */
  allowTransactionType?: boolean
  /** Pre-loaded prefs (batch fan-out) — skips the per-recipient prefs query. */
  prefs?: WorkspaceNotificationPrefs
}

export type DeliverNotificationResult = {
  ok: true
  skipped?: string
  in_app: boolean
  push: { sent: number; failed: number }
  email: boolean
  /** Set when the email leg failed after in-app/push already succeeded. */
  email_error?: string
  notification_id?: string
}

const PREFS_COLUMNS =
  'notify_email, notify_in_app, notify_push, notify_transactions, notify_budget, notify_promotions, notify_credit_cards, notify_credit_card_calendar, notify_bills'

function normalizePrefsRow(prefs: Record<string, unknown>): WorkspaceNotificationPrefs {
  return {
    notify_email: prefs.notify_email !== false,
    notify_in_app: prefs.notify_in_app !== false,
    notify_push: prefs.notify_push === true,
    notify_transactions: prefs.notify_transactions !== false,
    notify_budget: prefs.notify_budget !== false,
    notify_promotions: prefs.notify_promotions === true,
    notify_credit_cards: prefs.notify_credit_cards !== false,
    notify_credit_card_calendar: prefs.notify_credit_card_calendar !== false,
    notify_bills: prefs.notify_bills !== false,
  }
}

export async function loadNotificationPrefs(
  supabaseAdmin: SupabaseAdminClient,
  userId: string,
  workspaceId: string
): Promise<WorkspaceNotificationPrefs> {
  const { data: prefs } = await supabaseAdmin
    .from('workspace_member_notification_prefs')
    .select(PREFS_COLUMNS)
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!prefs) return { ...DEFAULT_NOTIFICATION_PREFS }
  return normalizePrefsRow(prefs)
}

/**
 * Batch loader for cron fan-out: one query per workspace instead of one per
 * recipient per event. Missing rows fall back to defaults.
 */
export async function loadWorkspacePrefsMap(
  supabaseAdmin: SupabaseAdminClient,
  workspaceId: string,
  userIds: string[]
): Promise<Map<string, WorkspaceNotificationPrefs>> {
  const map = new Map<string, WorkspaceNotificationPrefs>()
  if (userIds.length === 0) return map

  const { data: rows, error } = await supabaseAdmin
    .from('workspace_member_notification_prefs')
    .select(`user_id, ${PREFS_COLUMNS}`)
    .eq('workspace_id', workspaceId)
    .in('user_id', userIds)

  if (error) throw new Error(error.message)

  for (const row of rows ?? []) {
    map.set(row.user_id as string, normalizePrefsRow(row))
  }
  for (const id of userIds) {
    if (!map.has(id)) map.set(id, { ...DEFAULT_NOTIFICATION_PREFS })
  }
  return map
}

export async function deliverNotification(
  input: DeliverNotificationInput
): Promise<DeliverNotificationResult | { ok: false; error: string }> {
  const {
    supabaseAdmin,
    userId,
    userEmail,
    workspaceId,
    type,
    title,
    body,
    metadata = {},
    allowTransactionType = true,
  } = input

  if (type === 'transaction' && !allowTransactionType) {
    return { ok: true, skipped: 'transaction_notifications_disabled', in_app: false, push: { sent: 0, failed: 0 }, email: false }
  }

  const prefs =
    input.prefs ?? (await loadNotificationPrefs(supabaseAdmin, userId, workspaceId))

  if (!isTypeAllowedForPrefs(type, prefs)) {
    return { ok: true, skipped: 'type_disabled', in_app: false, push: { sent: 0, failed: 0 }, email: false }
  }

  const result: DeliverNotificationResult = {
    ok: true,
    in_app: false,
    push: { sent: 0, failed: 0 },
    email: false,
  }

  let notificationId: string | undefined

  if (prefs.notify_in_app) {
    const { data: inserted, error: insErr } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        workspace_id: workspaceId,
        type,
        title,
        body,
        metadata,
      })
      .select('id')
      .single()

    if (insErr) {
      return { ok: false, error: insErr.message }
    }
    notificationId = inserted?.id as string | undefined
    result.in_app = true
    result.notification_id = notificationId
  }

  if (prefs.notify_push) {
    const pushPayload = buildPushPayload({
      title,
      body,
      workspaceId,
      type,
      metadata,
      notificationId,
    })
    result.push = await sendWebPushToUser({
      supabaseAdmin,
      userId,
      payload: pushPayload,
    })
  }

  const systemCritical = type === 'system' && metadata.critical === true
  const emailAllowed =
    type === 'budget' ||
    type === 'credit_card' ||
    type === 'bill' ||
    systemCritical

  if (prefs.notify_email && userEmail && emailAllowed) {
    const appBase = Deno.env.get('APP_BASE_URL')?.trim() || ''
    const settingsUrl = appBase ? `${appBase.replace(/\/$/, '')}/settings` : '/settings'
    const html = renderEmailHtml({ title, body, settingsUrl })
    try {
      await sendEmailResend({ to: userEmail, subject: title, html })
      result.email = true
    } catch (e) {
      // Partial success: the in-app row (and push) already went out. Reporting
      // ok:false here made callers 500 operations that actually succeeded and
      // retry into duplicate in-app notifications.
      result.email = false
      result.email_error = e instanceof Error ? e.message : 'Email send failed'
      console.error('deliverNotification: email failed:', result.email_error)
    }
  }

  return result
}
