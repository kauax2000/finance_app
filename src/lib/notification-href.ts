/**
 * Mirrors supabase/functions/_shared/notification-types.ts `resolveNotificationHref`
 * for client tests and push deep-link parity.
 */
export function resolveNotificationHref(metadata: Record<string, unknown>): string {
    const raw = metadata.href
    if (typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//")) {
        return raw.trim()
    }
    const kind = metadata.kind
    if (kind === "category_created") return "/categories"
    if (kind === "invite_accepted") return "/members"
    if (
        typeof kind === "string" &&
        kind.startsWith("cc_") &&
        typeof metadata.credit_card_id === "string"
    ) {
        return `/credit-cards/${metadata.credit_card_id.trim()}`
    }
    if (kind === "budget_threshold" && typeof metadata.category_id === "string") {
        return `/categories/${metadata.category_id.trim()}`
    }
    if (kind === "bill_reminder") return "/bills"
    if (
        kind === "member_expense_created" &&
        typeof metadata.transaction_id === "string" &&
        metadata.transaction_id.trim()
    ) {
        return `/transactions?txn=${metadata.transaction_id.trim()}`
    }
    return "/dashboard"
}

export type NotificationEventType =
    | "transaction"
    | "budget"
    | "system"
    | "promotion"
    | "credit_card"
    | "bill"

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

export function isTypeAllowedForPrefs(
    type: NotificationEventType,
    prefs: WorkspaceNotificationPrefs
): boolean {
    if (type === "transaction") return !!prefs.notify_transactions
    if (type === "budget") return !!prefs.notify_budget
    if (type === "promotion") return !!prefs.notify_promotions
    if (type === "credit_card") return !!prefs.notify_credit_cards
    if (type === "bill") return prefs.notify_bills !== false
    return true
}

export function buildPushPayloadPreview(args: {
    title: string
    body: string
    workspaceId: string
    type: string
    metadata?: Record<string, unknown>
    notificationId?: string
}) {
    const metadata = args.metadata ?? {}
    return {
        title: args.title,
        body: args.body,
        notification_id: args.notificationId,
        workspace_id: args.workspaceId,
        type: args.type,
        href: resolveNotificationHref(metadata),
        kind: typeof metadata.kind === "string" ? metadata.kind : undefined,
    }
}
