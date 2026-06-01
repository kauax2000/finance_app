import { describe, expect, it } from "vitest"
import {
    formatYearMonth,
    labelYearMonthPt,
    parseYearMonth,
    parseYearMonthParam,
    periodBoundsFromYearMonth,
    shiftYearMonth,
} from "./budget-month"

describe("budget-month", () => {
    it("periodBoundsFromYearMonth returns correct April 2026 bounds", () => {
        expect(periodBoundsFromYearMonth("2026-04")).toEqual({
            period_start: "2026-04-01",
            period_end: "2026-04-30",
        })
    })

    it("shiftYearMonth crosses year boundary", () => {
        expect(shiftYearMonth("2026-01", -1)).toBe("2025-12")
        expect(shiftYearMonth("2025-12", 1)).toBe("2026-01")
    })

    it("parseYearMonth and formatYearMonth round-trip", () => {
        const d = new Date(2026, 8, 15)
        const ym = formatYearMonth(d)
        expect(ym).toBe("2026-09")
        expect(parseYearMonth(ym)).toEqual({ y: 2026, m: 9 })
    })

    it("labelYearMonthPt returns non-empty string", () => {
        expect(labelYearMonthPt("2026-04").length).toBeGreaterThan(3)
    })

    it("labelYearMonthPt capitalizes first letter of month", () => {
        const label = labelYearMonthPt("2026-08")
        expect(label.length).toBeGreaterThan(3)
        expect(/^\p{Lu}/u.test(label)).toBe(true)
    })

    it("parseYearMonthParam accepts valid months and rejects invalid values", () => {
        expect(parseYearMonthParam("2026-04")).toBe("2026-04")
        expect(parseYearMonthParam("2026-4")).toBeNull()
        expect(parseYearMonthParam("2026-13")).toBeNull()
        expect(parseYearMonthParam("2026-00")).toBeNull()
        expect(parseYearMonthParam(null)).toBeNull()
    })
})
