import { describe, expect, it } from "vitest"
import { formatDayHeadingPtBr } from "./transaction-date"

describe("formatDayHeadingPtBr com a data do arquivo importado", () => {
    it("meio-dia local mantém o dia, e o ano some no ano corrente", () => {
        expect(formatDayHeadingPtBr("2026-10-01T12:00:00", new Date(2026, 10, 17).getTime())).toBe("1 de outubro")
    })
})
