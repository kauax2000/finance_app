import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

vi.mock("next/link", () => ({ default: (p: Record<string, unknown>) => h("a", p) }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {} }) }))
const { IncomeCategoryCard } = await import("./income-category-card")

const fonte = semComentarios(lerFonte("src/components/categories/income-category-card.tsx"))

describe("IncomeCategoryCard pelo fonte", () => {
    it("a faísca é a área com a média", () => {
        expect(fonte).toMatch(/import \{[^}]*ChartSparkline[^}]*\} from "@\/components\/ui\/chart"/)
        expect(fonte).toContain('variant="area"')
        expect(fonte).toContain("reference=")
    })

    it("a barra leva o previsto, sem faixas nem ritmo", () => {
        expect(fonte).toContain("projected=")
        expect(fonte).not.toContain("bands=")
        expect(fonte).not.toContain("marker=")
    })

    it("a frase é a participação nas receitas", () => {
        expect(fonte).toContain("participacao(")
        expect(fonte).toContain('"income"')
        expect(fonte).toContain("rotuloDaVariacao(")
        expect(fonte).toContain("tileColorFor(")
    })

    it("a variação é invertida: subir é receita, cair é despesa", () => {
        expect(fonte).toContain('up: "text-income"')
        expect(fonte).toContain('down: "text-expense"')
    })

    it("sai o Ver categoria", () => {
        expect(fonte).not.toContain("Ver categoria")
    })

    it("o ⋯ só existe para quem escreve e só aparece no cursor", () => {
        expect(fonte).toContain("onEdit && onDelete")
        expect(fonte).toMatch(/"opacity-0 group-hover:opacity-100 group-focus-within:opacity-100/)
        expect(fonte).not.toContain("[@media(hover:hover)]:opacity-0")
        expect(fonte).toContain("pointer-coarse:hidden")
    })

    it("a série carregando vira o esqueleto do gráfico", () => {
        expect(fonte).toMatch(/historico === undefined[\s\S]{0,80}ChartSkeleton/)
    })
})

function cartao(p: Partial<Parameters<typeof IncomeCategoryCard>[0]> = {}) {
    return renderToStaticMarkup(
        h(IncomeCategoryCard, {
            category: { id: "salario", name: "Salário", icon: null, color: null },
            recebido: 1000,
            previsto: 200,
            anterior: 1000,
            totalDoMes: 2400,
            maiorTotal: 1200,
            mesYm: "2026-11",
            historico: [800, 900, 1000, 1100, 1200],
            href: "/categories/salario",
            ...p,
        }),
    )
}

const limpo = (s: string) => s.replace(/\u00a0/g, " ").replace(/<!-- -->/g, "")

describe("IncomeCategoryCard no render", () => {
    it("mostra o total, o recebido + previsto e a participação", () => {
        const html = limpo(cartao())
        expect(html).toContain("R$ 1.200,00")
        expect(html).toContain("R$ 1.000,00 recebido + R$ 200,00 previsto")
        expect(html).toContain("50% das receitas do mês")
    })

    it("sem previsão, não repete a linha do previsto", () => {
        expect(limpo(cartao({ previsto: 0 }))).not.toContain("previsto")
    })

    it("com a série carregando e a receita negativa, nada sai NaN nem -R$", () => {
        const html = cartao({ historico: undefined, recebido: -30, totalDoMes: 0 })
        expect(html).not.toContain("NaN")
        expect(html).not.toMatch(/[-−]\s?R\$/)
        expect(html).toContain('data-slot="chart-skeleton"')
    })
})
