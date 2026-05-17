import { creditCardDetailPath, ROUTES } from "@/config/navigation"
import type { AppNotification } from "@/lib/notifications"

export type NotificationAction = {
    label: string
    href: string
}

function isSafeInternalPath(href: string): boolean {
    if (!href.startsWith("/") || href.startsWith("//")) return false
    return true
}

/**
 * Resolves an in-app link for a notification: optional `metadata.href`, then known `metadata.kind`, then invite-related system rows.
 */
export function getNotificationAction(n: AppNotification): NotificationAction | null {
    const meta = n.metadata
    const rawHref = meta?.href
    if (typeof rawHref === "string" && rawHref.trim()) {
        const href = rawHref.trim()
        if (isSafeInternalPath(href)) {
            return { label: "Abrir", href }
        }
    }

    const kind = meta?.kind
    if (kind === "category_created") {
        return { label: "Ver categorias", href: ROUTES.DASHBOARD_CATEGORIES }
    }

    if (kind === "invite_accepted" || (n.type === "system" && meta?.invite_id != null)) {
        return { label: "Ver membros", href: ROUTES.MEMBERS }
    }

    if (
        typeof kind === "string" &&
        kind.startsWith("cc_") &&
        typeof meta?.credit_card_id === "string" &&
        meta.credit_card_id.trim()
    ) {
        return {
            label: "Ver cartão",
            href: creditCardDetailPath(meta.credit_card_id.trim()),
        }
    }

    if (n.type === "bill") {
        return { label: "Contas a pagar", href: ROUTES.BILLS }
    }

    return null
}
