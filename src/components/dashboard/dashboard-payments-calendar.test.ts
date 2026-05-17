import { describe, expect, it } from "vitest"
import { limitMobileCalendarDayGroups } from "./dashboard-payments-calendar"

function days(ymds: string[]) {
    return ymds.map((ymd) => ({ ymd, list: [] as unknown[] }))
}

describe("limitMobileCalendarDayGroups", () => {
    it("keeps only the last maxPastDays on or before today, then all future days", () => {
        const grouped = days([
            "2026-05-01",
            "2026-05-02",
            "2026-05-03",
            "2026-05-04",
            "2026-05-05",
            "2026-05-10",
            "2026-05-28",
        ])
        const out = limitMobileCalendarDayGroups(grouped, "2026-05-10", 5)
        expect(out.map((g) => g.ymd)).toEqual([
            "2026-05-02",
            "2026-05-03",
            "2026-05-04",
            "2026-05-05",
            "2026-05-10",
            "2026-05-28",
        ])
    })

    it("when all days are future, returns the full list", () => {
        const grouped = days(["2026-06-01", "2026-06-15"])
        const out = limitMobileCalendarDayGroups(grouped, "2026-05-10", 5)
        expect(out.map((g) => g.ymd)).toEqual(["2026-06-01", "2026-06-15"])
    })

    it("when month is entirely in the past, keeps last 5 days with events", () => {
        const grouped = days([
            "2026-04-01",
            "2026-04-05",
            "2026-04-10",
            "2026-04-15",
            "2026-04-20",
            "2026-04-25",
            "2026-04-28",
        ])
        const out = limitMobileCalendarDayGroups(grouped, "2026-05-10", 5)
        expect(out.map((g) => g.ymd)).toEqual([
            "2026-04-10",
            "2026-04-15",
            "2026-04-20",
            "2026-04-25",
            "2026-04-28",
        ])
    })

    it("includes today in the past bucket", () => {
        const grouped = days(["2026-05-09", "2026-05-10", "2026-05-11"])
        const out = limitMobileCalendarDayGroups(grouped, "2026-05-10", 5)
        expect(out.map((g) => g.ymd)).toEqual([
            "2026-05-09",
            "2026-05-10",
            "2026-05-11",
        ])
    })

    it("respects fewer than 5 past days", () => {
        const grouped = days(["2026-05-08", "2026-05-09", "2026-05-30"])
        const out = limitMobileCalendarDayGroups(grouped, "2026-05-10", 5)
        expect(out.map((g) => g.ymd)).toEqual([
            "2026-05-08",
            "2026-05-09",
            "2026-05-30",
        ])
    })
})
