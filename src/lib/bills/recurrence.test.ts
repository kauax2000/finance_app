import { describe, expect, it } from "vitest"
import {
    computeFirstDueYmd,
    computeNextBillInstanceDueYmd,
    computeNextDueYmd,
    vencimentosQueFaltam,
} from "./recurrence"

const mensal10 = { frequency: "monthly", due_day_of_month: 10, end_date: null, is_active: true } as const

describe("recurrence (adaptadores do cliente sobre o _shared)", () => {
    it("computeFirstDueYmd: o próprio dia de início conta, e o 31 limita em fev/2028", () => {
        expect(computeFirstDueYmd({ startYmd: "2026-08-10", dueDayOfMonth: 10 })).toBe("2026-08-10")
        expect(computeFirstDueYmd({ startYmd: "2026-08-11", dueDayOfMonth: 10 })).toBe("2026-09-10")
        expect(computeFirstDueYmd({ startYmd: "2028-02-01", dueDayOfMonth: 31 })).toBe("2028-02-29")
    })

    it("computeNextDueYmd: trimestral e anual a partir de 2028-02-29", () => {
        expect(
            computeNextDueYmd({ afterDueYmd: "2028-02-29", frequency: "quarterly", dueDayOfMonth: 29 }),
        ).toBe("2028-05-29")
        expect(
            computeNextDueYmd({ afterDueYmd: "2028-02-29", frequency: "yearly", dueDayOfMonth: 29 }),
        ).toBe("2029-02-28")
        expect(
            computeNextDueYmd({ afterDueYmd: "2028-02-29", frequency: "one_time", dueDayOfMonth: 29 }),
        ).toBeNull()
    })

    it("computeNextBillInstanceDueYmd: one_time dá null, inativa dá null e end_date corta", () => {
        expect(computeNextBillInstanceDueYmd(mensal10, "2026-08-10")).toBe("2026-09-10")
        expect(computeNextBillInstanceDueYmd({ ...mensal10, frequency: "one_time" }, "2026-08-10")).toBeNull()
        expect(computeNextBillInstanceDueYmd({ ...mensal10, is_active: false }, "2026-08-10")).toBeNull()
        expect(computeNextBillInstanceDueYmd({ ...mensal10, end_date: "2026-09-10" }, "2026-08-10")).toBe("2026-09-10")
        expect(computeNextBillInstanceDueYmd({ ...mensal10, end_date: "2026-09-09" }, "2026-08-10")).toBeNull()
    })

    it("reexporta vencimentosQueFaltam do _shared", () => {
        expect(vencimentosQueFaltam(mensal10, "2026-08-10", "2026-11-15")).toEqual([
            "2026-09-10",
            "2026-10-10",
            "2026-11-10",
        ])
        expect(vencimentosQueFaltam(mensal10, "2026-08-10", "2026-11-09")).toEqual(["2026-09-10", "2026-10-10"])
    })
})
