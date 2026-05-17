export type NotificationEventType =
  | 'transaction'
  | 'budget'
  | 'system'
  | 'promotion'
  | 'credit_card'
  | 'bill'

export type WorkspaceNotificationPrefs = {
  notify_email: boolean
  notify_in_app: boolean
  notify_push: boolean
  notify_transactions: boolean
  notify_budget: boolean
  notify_promotions: boolean
  notify_credit_cards: boolean
  notify_credit_card_calendar: boolean
  notify_bills: boolean
}

export const DEFAULT_NOTIFICATION_PREFS: WorkspaceNotificationPrefs = {
  notify_email: true,
  notify_in_app: true,
  notify_push: false,
  notify_transactions: true,
  notify_budget: true,
  notify_promotions: false,
  notify_credit_cards: true,
  notify_credit_card_calendar: true,
  notify_bills: true,
}

export function isNotificationEventType(x: unknown): x is NotificationEventType {
  return (
    x === 'transaction' ||
    x === 'budget' ||
    x === 'system' ||
    x === 'promotion' ||
    x === 'credit_card' ||
    x === 'bill'
  )
}

export function isTypeAllowedForPrefs(
  type: NotificationEventType,
  prefs: WorkspaceNotificationPrefs
): boolean {
  if (type === 'transaction') return !!prefs.notify_transactions
  if (type === 'budget') return !!prefs.notify_budget
  if (type === 'promotion') return !!prefs.notify_promotions
  if (type === 'credit_card') return !!prefs.notify_credit_cards
  if (type === 'bill') return prefs.notify_bills !== false
  return true
}

export function resolveNotificationHref(metadata: Record<string, unknown>): string {
  const raw = metadata.href
  if (typeof raw === 'string' && raw.startsWith('/') && !raw.startsWith('//')) {
    return raw.trim()
  }
  const kind = metadata.kind
  if (kind === 'category_created') return '/categories'
  if (kind === 'invite_accepted') return '/members'
  if (typeof kind === 'string' && kind.startsWith('cc_') && typeof metadata.credit_card_id === 'string') {
    return `/credit-cards/${metadata.credit_card_id.trim()}`
  }
  if (kind === 'budget_threshold' && typeof metadata.category_id === 'string') {
    return `/categories/${metadata.category_id.trim()}`
  }
  if (kind === 'bill_reminder') return '/bills'
  return '/dashboard'
}
