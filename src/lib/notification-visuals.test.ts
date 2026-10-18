// antes de qualquer Date: a hora local do teste é a de São Paulo
process.env.TZ = "America/Sao_Paulo"

import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/supabase", () => ({ supabase: {} }))
import { horaLocal, type AppNotification } from "@/lib/notifications"
import { notificationTone } from "@/lib/notification-visuals"

function notif(metadata: Record<string, unknown>, type: AppNotification["type"] = "system"): AppNotification {
    return {
        id: "n1",
        user_id: "u1",
        workspace_id: "w1",
        type,
        title: "t",
        body: "b",
        metadata,
        read_at: null,
        created_at: "2026-10-17T12:00:00.000Z",
    }
}

describe("notificationTone", () => {
    it.each([
        [{ kind: "budget_threshold", threshold: "threshold_80_sent_at" }, "warning"],
        [{ kind: "budget_threshold", threshold: "threshold_100_sent_at" }, "destructive"],
        [{ kind: "budget_threshold", threshold: "threshold_over_sent_at" }, "destructive"],
        [{ kind: "budget_threshold" }, "warning"],
        [{ kind: "cc_limit_warning" }, "warning"],
        [{ kind: "cc_limit_reached" }, "destructive"],
        [{ kind: "cc_limit_exceeded" }, "destructive"],
        [{ kind: "cc_category_limit_crossed" }, "warning"],
        [{ kind: "cc_invoice_closed" }, "info"],
        [{ kind: "cc_invoice_closing_soon" }, "info"],
        [{ kind: "cc_payment_due_soon" }, "info"],
        [{ kind: "cc_payment_due_today" }, "warning"],
        [{ kind: "bill_reminder", offset_days: -1 }, "destructive"],
        [{ kind: "bill_reminder", offset_days: 0 }, "warning"],
        [{ kind: "bill_reminder", offset_days: 3 }, "info"],
        [{ kind: "bill_reminder" }, "warning"],
        [{ kind: "member_expense_created" }, "neutral"],
        [{ kind: "invite_accepted" }, "neutral"],
        [{ kind: "category_created" }, "neutral"],
        [{ kind: "nao_existe" }, "neutral"],
    ])("%j → %s", (metadata, tom) => {
        expect(notificationTone(notif(metadata))).toBe(tom)
    })
})

describe("horaLocal", () => {
    it("mostra a hora de São Paulo, não a do UTC", () => {
        expect(horaLocal("2026-10-17T01:30:00.000Z")).toBe("22:30")
    })
})
