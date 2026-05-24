import { describe, expect, it } from "vitest"
import {
    buildPushPayloadPreview,
    isTypeAllowedForPrefs,
    resolveNotificationHref,
    type WorkspaceNotificationPrefs,
} from "@/lib/notification-href"

const basePrefs: WorkspaceNotificationPrefs = {
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

describe("resolveNotificationHref", () => {
    it("uses metadata.href when safe internal path", () => {
        expect(resolveNotificationHref({ href: "/bills?due=soon" })).toBe("/bills?due=soon")
    })

    it("rejects protocol-relative href", () => {
        expect(resolveNotificationHref({ href: "//evil.com" })).toBe("/dashboard")
    })

    it("maps budget_threshold to category", () => {
        expect(
            resolveNotificationHref({
                kind: "budget_threshold",
                category_id: "abc-123",
            })
        ).toBe("/categories/abc-123")
    })

    it("maps cc kinds to credit card detail", () => {
        expect(
            resolveNotificationHref({
                kind: "cc_limit",
                credit_card_id: "card-1",
            })
        ).toBe("/credit-cards/card-1")
    })

    it("maps member_expense_created to transaction detail", () => {
        expect(
            resolveNotificationHref({
                kind: "member_expense_created",
                transaction_id: "tx-abc",
            })
        ).toBe("/transactions?txn=tx-abc")
    })
})

describe("isTypeAllowedForPrefs", () => {
    it("blocks budget when notify_budget is false", () => {
        expect(
            isTypeAllowedForPrefs("budget", { ...basePrefs, notify_budget: false })
        ).toBe(false)
    })

    it("allows system regardless of type toggles", () => {
        expect(
            isTypeAllowedForPrefs("system", {
                ...basePrefs,
                notify_budget: false,
                notify_bills: false,
            })
        ).toBe(true)
    })
})

describe("buildPushPayloadPreview", () => {
    it("includes href for bill reminders", () => {
        const payload = buildPushPayloadPreview({
            title: "Conta vence amanhã",
            body: "Energia",
            workspaceId: "ws-1",
            type: "bill",
            metadata: { kind: "bill_reminder" },
            notificationId: "n-1",
        })
        expect(payload.href).toBe("/bills")
        expect(payload.notification_id).toBe("n-1")
    })
})
