import { describe, expect, it } from "vitest"
import { addDaysYmd, compareYmd, daysBetweenYmd } from "@/lib/transaction-date"
import { billDuePill, billInstancePill } from "@/components/bills/bill-status"

describe("contas de YYYY-MM-DD", () => {
    it("soma dias atravessando mês e ano", () => {
        expect(addDaysYmd("2026-01-31", 1)).toBe("2026-02-01")
        expect(addDaysYmd("2026-12-31", 1)).toBe("2027-01-01")
        expect(addDaysYmd("2026-03-01", -1)).toBe("2026-02-28")
    })

    it("conta dias com sinal, inclusive no dia da virada do horário de verão", () => {
        expect(daysBetweenYmd("2026-09-15", "2026-09-20")).toBe(5)
        expect(daysBetweenYmd("2026-09-20", "2026-09-15")).toBe(-5)
        expect(daysBetweenYmd("bad", "2026-09-15")).toBeNull()
    })

    it("ordena pela data", () => {
        expect(compareYmd("2026-09-15", "2026-10-01")).toBeLessThan(0)
    })
})

describe("status da parcela de conta", () => {
    it("atrasada, hoje e pendente pela data", () => {
        expect(billDuePill("2026-09-14", "2026-09-15").label).toBe("Atrasada")
        expect(billDuePill("2026-09-15", "2026-09-15").label).toBe("Hoje")
        expect(billDuePill("2026-09-16", "2026-09-15").label).toBe("Pendente")
    })

    it("paga e ignorada ganham da data", () => {
        expect(billInstancePill({ status: "paid", due_date: "2026-01-01" }, "2026-09-15").label).toBe("Paga")
        expect(billInstancePill({ status: "skipped", due_date: "2026-01-01" }, "2026-09-15").label).toBe("Ignorada")
    })
})
