import { describe, expect, it } from "vitest"
import { creditCardInvoicePath } from "@/config/navigation"
import {
    buildCardCycleSnapshot,
    shiftRefDateByCycles,
} from "@/lib/credit-card-billing"
import {
    cycleOffsetForCloseYmd,
    estadoDaFatura,
    tomDoVencimento,
    verboDoVencimento,
} from "@/lib/credit-card-invoice-preview"
import { localYmdFromDate } from "@/lib/transaction-date"

const today = new Date(2026, 10, 14, 12)
const bounds = { min: -12, max: 2 }

describe("creditCardInvoicePath", () => {
    it("monta o caminho com ?fatura", () => {
        expect(creditCardInvoicePath("abc", "2026-10-26")).toBe(
            "/credit-cards/abc?fatura=2026-10-26"
        )
    })
})

describe("cycleOffsetForCloseYmd", () => {
    const card = { closing_day: 26 }
    it("acha o offset do fechamento", () => {
        expect(cycleOffsetForCloseYmd(card, today, "2026-10-26", bounds)).toBe(-1)
        expect(cycleOffsetForCloseYmd(card, today, "2026-11-26", bounds)).toBe(0)
        expect(cycleOffsetForCloseYmd(card, today, "2026-09-26", bounds)).toBe(-2)
    })
    it("devolve null para data que não fecha, inválida ou fora dos limites", () => {
        expect(cycleOffsetForCloseYmd(card, today, "2026-10-25", bounds)).toBeNull()
        expect(cycleOffsetForCloseYmd(card, today, "abc", bounds)).toBeNull()
        expect(
            cycleOffsetForCloseYmd(card, today, "2025-01-26", { min: -3, max: 2 })
        ).toBeNull()
    })
    it("closing_day 31: fevereiro bate com o nextClose do snapshot", () => {
        const c = { id: "c", closing_day: 31, due_day: 10 }
        for (const k of [-2, 0, 1]) {
            const ref = shiftRefDateByCycles(c, today, k)
            const next = localYmdFromDate(
                buildCardCycleSnapshot(c, [], ref).nextClose
            )
            expect(cycleOffsetForCloseYmd(c, today, next, bounds)).toBe(k)
        }
        expect(cycleOffsetForCloseYmd(c, today, "2026-02-28", bounds)).toBe(-9)
    })
})

describe("estadoDaFatura", () => {
    const base = { paid: false, today }
    it("cobre os quatro estados", () => {
        expect(estadoDaFatura({ ...base, slot: "last_closed", dueYmd: "2026-11-10" })).toBe("Vencida, não paga")
        expect(estadoDaFatura({ ...base, slot: "last_closed", dueYmd: "2026-11-20" })).toBe("Fechada, não paga")
        expect(estadoDaFatura({ ...base, slot: "earlier", dueYmd: "2026-11-20" })).toBe("Anterior, não paga")
        expect(estadoDaFatura({ ...base, paid: true, slot: "earlier", dueYmd: "2026-11-10" })).toBe("Paga")
    })
})

describe("tomDoVencimento / verboDoVencimento", () => {
    it("tom", () => {
        const t = (dueYmd: string, paid = false) => tomDoVencimento({ paid, dueYmd, today })
        expect(t("2026-11-10")).toBe("destructive")
        expect(t("2026-11-14")).toBe("warning")
        expect(t("2026-11-17")).toBe("warning")
        expect(t("2026-11-18")).toBe("neutral")
        expect(t("2026-11-10", true)).toBe("neutral")
    })
    it("data inválida não vence nem quebra", () => {
        expect(tomDoVencimento({ paid: false, dueYmd: "abc", today })).toBe("neutral")
        expect(verboDoVencimento("abc", today)).toBe("Vence")
        expect(estadoDaFatura({ slot: "last_closed", paid: false, dueYmd: "abc", today })).toBe("Fechada, não paga")
    })
    it("verbo", () => {
        expect(verboDoVencimento("2026-11-14", today)).toBe("Vence")
        expect(verboDoVencimento("2026-11-13", today)).toBe("Venceu")
    })
})
