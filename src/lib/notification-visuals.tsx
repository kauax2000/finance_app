"use client"

import type { ReactNode } from "react"
import {
    BellIcon,
    CalendarIcon,
    ExclamationCircleIcon,
    ClockIcon,
    CreditCardIcon,
    FolderPlusIcon,
    EnvelopeIcon,
    ReceiptPercentIcon,
    ShieldCheckIcon,
    SparklesIcon,
    TrashIcon,
    ArrowTrendingDownIcon,
    ArrowTrendingUpIcon,
    UserMinusIcon,
    UserPlusIcon,
} from "@heroicons/react/24/outline"
import { MailX, UserCheck } from "lucide-react"
import type { AppNotification, AppNotificationType } from "@/lib/notifications"

/** Semantic notification key from `metadata.kind` (snake_case); reserved for future producers. */
export type AppNotificationKind =
    | "budget_threshold"
    | "cc_category_limit_crossed"
    | "cc_invoice_closed"
    | "cc_invoice_closing_soon"
    | "cc_limit_exceeded"
    | "cc_limit_reached"
    | "cc_limit_warning"
    | "cc_payment_due_soon"
    | "cc_payment_due_today"
    | "category_created"
    | "invite_accepted"
    | "invite_created"
    | "invite_sent"
    | "invite_declined"
    | "invite_expired"
    | "member_joined"
    | "member_removed"
    | "removed_from_workspace"
    | "workspace_role_changed"
    | "workspace_deleted"
    | "transaction_digest"
    | "member_expense_created"
    | "promo_feature"
    | "bill_reminder"
    | "unknown"

const ALL_KINDS = new Set<string>([
    "budget_threshold",
    "cc_category_limit_crossed",
    "cc_invoice_closed",
    "cc_invoice_closing_soon",
    "cc_limit_exceeded",
    "cc_limit_reached",
    "cc_limit_warning",
    "cc_payment_due_soon",
    "cc_payment_due_today",
    "category_created",
    "invite_accepted",
    "invite_created",
    "invite_sent",
    "invite_declined",
    "invite_expired",
    "member_joined",
    "member_removed",
    "removed_from_workspace",
    "workspace_role_changed",
    "workspace_deleted",
    "transaction_digest",
    "member_expense_created",
    "promo_feature",
    "bill_reminder",
])

const BUDGET_THRESHOLD_KEYS = new Set([
    "threshold_80_sent_at",
    "threshold_100_sent_at",
    "threshold_over_sent_at",
])

export function resolveAppNotificationKind(n: AppNotification): {
    kind: AppNotificationKind
    budgetThreshold?: string
} {
    const meta = n.metadata
    const raw = meta?.kind
    if (typeof raw === "string" && raw.length > 0 && ALL_KINDS.has(raw)) {
        if (raw === "budget_threshold") {
            const th =
                typeof meta?.threshold === "string" && BUDGET_THRESHOLD_KEYS.has(meta.threshold)
                    ? meta.threshold
                    : undefined
            return { kind: "budget_threshold", budgetThreshold: th }
        }
        return { kind: raw as AppNotificationKind }
    }
    if (n.type === "system" && meta?.invite_id != null) {
        return { kind: "invite_accepted" }
    }
    return { kind: "unknown" }
}

function iconClass(): string {
    return "h-4 w-4 shrink-0 text-muted-foreground"
}

function fallbackIconByType(type: AppNotificationType): ReactNode {
    switch (type) {
        case "transaction":
            return <BellIcon className={iconClass()} />
        case "budget":
            return <BellIcon className={iconClass()} />
        case "credit_card":
            return <CreditCardIcon className={iconClass()} />
        case "bill":
            return <ReceiptPercentIcon className={iconClass()} />
        case "promotion":
            return <BellIcon className={iconClass()} />
        case "system":
        default:
            return <BellIcon className={iconClass()} />
    }
}

/**
 * Icon and tint tied to semantic `metadata.kind` (and budget threshold), not the coarse DB `type`.
 */
export function getNotificationIcon(n: AppNotification): ReactNode {
    const { kind, budgetThreshold } = resolveAppNotificationKind(n)

    if (kind === "budget_threshold") {
        switch (budgetThreshold) {
            case "threshold_80_sent_at":
                return <ArrowTrendingUpIcon className={iconClass()} />
            case "threshold_100_sent_at":
                return <ExclamationCircleIcon className={iconClass()} />
            case "threshold_over_sent_at":
                return <ArrowTrendingDownIcon className={iconClass()} />
            default:
                return fallbackIconByType(n.type)
        }
    }

    switch (kind) {
        case "cc_limit_warning":
            return <ArrowTrendingUpIcon className={iconClass()} />
        case "cc_limit_reached":
            return <ExclamationCircleIcon className={iconClass()} />
        case "cc_limit_exceeded":
            return <ArrowTrendingDownIcon className={iconClass()} />
        case "cc_category_limit_crossed":
            return <ReceiptPercentIcon className={iconClass()} />
        case "cc_invoice_closed":
        case "cc_invoice_closing_soon":
            return <CalendarIcon className={iconClass()} />
        case "cc_payment_due_soon":
        case "cc_payment_due_today":
            return <ClockIcon className={iconClass()} />
        case "category_created":
            return <FolderPlusIcon className={iconClass()} />
        case "invite_accepted":
            return <UserCheck className={iconClass()} />
        case "invite_created":
        case "invite_sent":
            return <EnvelopeIcon className={iconClass()} />
        case "invite_declined":
            return <MailX className={iconClass()} />
        case "invite_expired":
            return <ClockIcon className={iconClass()} />
        case "member_joined":
            return <UserPlusIcon className={iconClass()} />
        case "member_removed":
        case "removed_from_workspace":
            return <UserMinusIcon className={iconClass()} />
        case "workspace_role_changed":
            return <ShieldCheckIcon className={iconClass()} />
        case "workspace_deleted":
            return <TrashIcon className={iconClass()} />
        case "transaction_digest":
        case "member_expense_created":
            return <ReceiptPercentIcon className={iconClass()} />
        case "promo_feature":
            return <SparklesIcon className={iconClass()} />
        case "bill_reminder":
            return <CalendarIcon className={iconClass()} />
        case "unknown":
        default:
            return fallbackIconByType(n.type)
    }
}
