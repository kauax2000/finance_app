import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @deno-types="npm:@types/web-push@3"
import webpush from 'npm:web-push@3.6.7'
import { resolveNotificationHref } from './notification-types.ts'

export type PushPayload = {
  title: string
  body: string
  notification_id?: string
  workspace_id: string
  type: string
  href: string
  kind?: string
}

type PushSubscriptionRow = {
  id: string
  endpoint: string
  p256dh: string
  auth: string
}

let vapidConfigured = false

function ensureVapid(): boolean {
  if (vapidConfigured) return true
  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY')?.trim()
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY')?.trim()
  const subject = Deno.env.get('VAPID_SUBJECT')?.trim() || 'mailto:support@finance.app'
  if (!publicKey || !privateKey) return false
  webpush.setVapidDetails(subject, publicKey, privateKey)
  vapidConfigured = true
  return true
}

function isExpiredSubscriptionError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const statusCode = (err as { statusCode?: number }).statusCode
  return statusCode === 404 || statusCode === 410
}

export async function sendWebPushToUser(args: {
  supabaseAdmin: SupabaseClient
  userId: string
  payload: PushPayload
}): Promise<{ sent: number; failed: number }> {
  if (!ensureVapid()) {
    return { sent: 0, failed: 0 }
  }

  const { data: rows, error } = await args.supabaseAdmin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', args.userId)

  if (error || !rows?.length) {
    return { sent: 0, failed: 0 }
  }

  const body = JSON.stringify(args.payload)
  let sent = 0
  let failed = 0

  for (const row of rows as PushSubscriptionRow[]) {
    try {
      await webpush.sendNotification(
        {
          endpoint: row.endpoint,
          keys: { p256dh: row.p256dh, auth: row.auth },
        },
        body,
        { TTL: 60 * 60 * 24 }
      )
      sent += 1
    } catch (err) {
      failed += 1
      if (isExpiredSubscriptionError(err)) {
        await args.supabaseAdmin.from('push_subscriptions').delete().eq('id', row.id)
      }
      console.warn('[web-push] send failed', row.endpoint.slice(0, 60), err)
    }
  }

  return { sent, failed }
}

export function buildPushPayload(args: {
  title: string
  body: string
  workspaceId: string
  type: string
  metadata?: Record<string, unknown>
  notificationId?: string
}): PushPayload {
  const metadata = args.metadata ?? {}
  return {
    title: args.title,
    body: args.body,
    notification_id: args.notificationId,
    workspace_id: args.workspaceId,
    type: args.type,
    href: resolveNotificationHref(metadata),
    kind: typeof metadata.kind === 'string' ? metadata.kind : undefined,
  }
}
