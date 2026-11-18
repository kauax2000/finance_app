import { describe, expect, it } from "vitest"
import { formatDayHeadingPtBr } from "./transaction-date"

describe("formatDayHeadingPtBr com a data do arquivo importado", () => {
    it("meio-dia local mantém o dia, e o ano some no ano corrente", () => {
        expect(formatDayHeadingPtBr("2026-10-01T12:00:00", new Date(2026, 10, 17).getTime())).toBe("1 de outubro")
    })

    it("com `semana`: Hoje, Ontem, o dia da semana sozinho até seis dias atrás, e depois com a data", () => {
        const agora = new Date(2026, 10, 17, 10).getTime()
        expect(formatDayHeadingPtBr("2026-11-14T12:00:00", agora, { semana: true })).toBe("Sábado")
        expect(formatDayHeadingPtBr("2026-11-11T12:00:00", agora, { semana: true })).toBe("Quarta")
        expect(formatDayHeadingPtBr("2026-11-10T12:00:00", agora, { semana: true })).toBe("Terça, 10 de novembro")
        expect(formatDayHeadingPtBr("2026-11-08T12:00:00", agora, { semana: true })).toBe("Domingo, 8 de novembro")
        expect(formatDayHeadingPtBr("2026-11-16T12:00:00", agora, { semana: true })).toBe("Ontem")
        expect(formatDayHeadingPtBr("2025-11-11T12:00:00", agora, { semana: true })).toBe("Terça, 11 de novembro de 2025")
    })
})
