import { describe, expect, it } from "vitest"
import { formatWeekdayDayMonthShortPtBr, formatYmdPtBr } from "@/lib/transaction-date"

describe("formatYmdPtBr", () => {
    it("inverte a data sem andar um dia no fuso", () => {
        expect(formatYmdPtBr("2026-09-01")).toBe("01/09/2026")
        expect(formatYmdPtBr("2026-12-31T12:00:00.000Z")).toBe("31/12/2026")
    })
})

describe("formatWeekdayDayMonthShortPtBr", () => {
    it("o dia da semana curto, o dia e o mês curto, sem andar no fuso", () => {
        expect(formatWeekdayDayMonthShortPtBr("2026-11-10T00:00:00.000Z")).toBe("Ter, 10 de nov")
        expect(formatWeekdayDayMonthShortPtBr("2026-11-09")).toBe("Seg, 9 de nov")
        expect(formatWeekdayDayMonthShortPtBr("2026-03-01")).toBe("Dom, 1 de mar")
    })
})
