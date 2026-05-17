import { describe, expect, it } from "vitest"
import {
    formatSubscriptionChargeDatePtBr,
    formatSubscriptionTxSummary,
} from "./subscription-tx-summary"

describe("formatSubscriptionTxSummary", () => {
    it("returns empty state when no stats", () => {
        expect(formatSubscriptionTxSummary("sub-1", {})).toBe(
            "Nenhuma cobrança vinculada em transações ainda."
        )
    })

    it("includes next charge even when no stats", () => {
        expect(formatSubscriptionTxSummary("sub-1", {}, "2026-04-05")).toContain(
            "próxima"
        )
    })

    it("singular cobrança with last date", () => {
        const s = formatSubscriptionTxSummary("a", {
            a: { count: 1, lastDate: "2026-04-05T12:00:00.000Z" },
        })
        expect(s).toContain("1")
        expect(s).toContain("cobrança em transações")
        expect(s).toContain("última")
    })

    it("includes next charge when present", () => {
        const s = formatSubscriptionTxSummary(
            "a",
            { a: { count: 1, lastDate: "2026-04-05T12:00:00.000Z" } },
            "2026-05-05"
        )
        expect(s).toContain("próxima")
    })

    it("plural cobranças", () => {
        const s = formatSubscriptionTxSummary("b", {
            b: { count: 3, lastDate: "2026-01-15T00:00:00.000Z" },
        })
        expect(s).toContain("3")
        expect(s).toContain("cobranças em transações")
    })
})

describe("formatSubscriptionChargeDatePtBr", () => {
    it("formats Y-M-D to non-empty display", () => {
        const out = formatSubscriptionChargeDatePtBr("2026-04-05")
        expect(out.length).toBeGreaterThan(0)
        expect(out).not.toBe("—")
    })

    it("returns em dash for null", () => {
        expect(formatSubscriptionChargeDatePtBr(null)).toBe("—")
    })
})
