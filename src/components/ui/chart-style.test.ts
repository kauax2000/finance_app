import { describe, expect, it } from "vitest"
import { chartStyleCss } from "@/components/ui/chart"

describe("chartStyleCss", () => {
    it("escreve as cores válidas", () => {
        const css = chartStyleCss("c1", {
            receita: { label: "Receita", color: "var(--chart-income)" },
            despesa: { label: "Despesa", color: "oklch(0.6 0.2 25)" },
        })
        expect(css).toContain("--color-receita: var(--chart-income);")
        expect(css).toContain("--color-despesa: oklch(0.6 0.2 25);")
    })

    it("não deixa cor nem chave fecharem a regra", () => {
        const css = chartStyleCss("c1", {
            ok: { label: "Ok", color: "#10B981" },
            ruim: { label: "Ruim", color: "red;} body{display:none" },
            "x}{y": { label: "Chave", color: "#fff" },
        }) ?? ""
        expect(css).toContain("--color-ok: #10B981;")
        expect(css).not.toContain("display:none")
        expect(css).not.toContain("x}{y")
    })
})
