import { describe, expect, it } from "vitest"
import { formatYmdPtBr } from "@/lib/transaction-date"

describe("formatYmdPtBr", () => {
    it("inverte a data sem andar um dia no fuso", () => {
        expect(formatYmdPtBr("2026-09-01")).toBe("01/09/2026")
        expect(formatYmdPtBr("2026-12-31T12:00:00.000Z")).toBe("31/12/2026")
    })
})
