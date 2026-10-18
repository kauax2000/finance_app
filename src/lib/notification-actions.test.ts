import { describe, expect, it } from "vitest"
import { getNotificationAction } from "@/lib/notification-actions"
import type { AppNotification } from "@/lib/notifications"

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

describe("getNotificationAction — href", () => {
    it.each(["/\t/evil.com", "/\n/evil.com", "/\\evil.com", "//evil.com"])(
        "%j não é usado: cai no destino do kind",
        (href) => {
            expect(getNotificationAction(notif({ href, kind: "category_created" }))?.href).toBe("/categories")
        },
    )

    it("sem kind que sirva, o href inseguro dá null", () => {
        expect(getNotificationAction(notif({ href: "//evil.com" }))).toBeNull()
    })

    it("caminho interno seguro é usado", () => {
        expect(getNotificationAction(notif({ href: "/categories/abc" }))?.href).toBe("/categories/abc")
    })
})
