import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/supabase", () => ({ supabase: {} }))

const { buildBillFormPayload } = await import("./bill-form-shared")

const base = {
    name: "Luz",
    description: "",
    notes: "",
    icon: "receipt",
    categoryId: "__none__",
    frequency: "monthly" as const,
    dueDayOfMonth: 10,
    amountEstimatedStr: "",
    startDateYmd: "2026-11-01",
    endDateYmd: "",
    paymentMethod: null,
    paymentCreditCardId: "",
    reminder3: true,
    reminder0: true,
    isActive: true,
    valorVariavel: false,
}

describe("buildBillFormPayload", () => {
    it("a data de fim não pode ser antes do início", () => {
        expect(buildBillFormPayload({ ...base, endDateYmd: "2026-10-31" })).toEqual({
            ok: false,
            error: "A data de fim não pode ser antes do início.",
        })
        expect(buildBillFormPayload({ ...base, endDateYmd: "2026-11-01" }).ok).toBe(true)
    })

    it("leva o valor variável", () => {
        const r = buildBillFormPayload({ ...base, valorVariavel: true })
        expect(r.ok && r.payload.valor_variavel).toBe(true)
    })
})
