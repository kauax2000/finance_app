import { describe, expect, it } from "vitest"
import {
    resumoDosCanais,
    resumoDosTemas,
    semCanal,
    temaLigado,
} from "@/lib/notificacoes-resumo"
import type { WorkspaceMemberNotificationPrefs } from "@/lib/workspace-notification-prefs"

const base = {
    notify_email: true,
    notify_in_app: true,
    notify_push: false,
    notify_transactions: true,
    notify_budget: true,
    notify_bills: true,
    notify_credit_cards: true,
    notify_credit_card_calendar: true,
    notify_review: true,
    notify_insights: true,
} as WorkspaceMemberNotificationPrefs

describe("notificacoes-resumo", () => {
    it("resume os canais ligados", () => {
        expect(resumoDosCanais(base)).toBe("Email e app")
        expect(resumoDosCanais({ ...base, notify_push: true })).toBe("Push, email e app")
        expect(resumoDosCanais({ ...base, notify_email: false })).toBe("App")
        expect(resumoDosCanais({ ...base, notify_email: false, notify_in_app: false })).toBe("Nenhum canal")
    })

    it("conta os temas ligados", () => {
        expect(resumoDosTemas(base)).toBe("7 de 7 temas")
        expect(resumoDosTemas({ ...base, notify_review: false })).toBe("6 de 7 temas")
        expect(
            resumoDosTemas(
                Object.fromEntries(Object.entries(base).map(([k]) => [k, false])) as unknown as WorkspaceMemberNotificationPrefs
            )
        ).toBe("Nenhum tema")
    })

    it("lê os temas com o padrão de hoje: dois pedem true, os outros só caem com false", () => {
        expect(temaLigado({ ...base, notify_bills: null as never }, "notify_bills")).toBe(true)
        expect(temaLigado({ ...base, notify_budget: null as never }, "notify_budget")).toBe(false)
    })

    it("sem canal é os três desligados", () => {
        expect(semCanal({ ...base, notify_email: false, notify_in_app: false })).toBe(true)
        expect(semCanal(base)).toBe(false)
    })
})
