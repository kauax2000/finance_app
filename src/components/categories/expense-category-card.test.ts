import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { currencyBRL } from "@/lib/formatters"
import { lerFonte, semComentarios } from "@/test/fonte"

vi.mock("next/link", () => ({ default: (p: Record<string, unknown>) => h("a", p) }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {} }) }))
const { ExpenseCategoryCard } = await import("./expense-category-card")

const fonte = semComentarios(lerFonte("src/components/categories/expense-category-card.tsx"))

describe("ExpenseCategoryCard pelo fonte", () => {
    it("a faísca é a área com a média", () => {
        expect(fonte).toMatch(/import \{[^}]*ChartSparkline[^}]*\} from "@\/components\/ui\/chart"/)
        expect(fonte).toContain('variant="area"')
        expect(fonte).toContain("reference=")
    })

    it("a barra vem antes da faísca, que é o pé do cartão, de borda a borda", () => {
        expect(fonte.indexOf("<Progress")).toBeLessThan(fonte.indexOf("<ChartSparkline"))
        const faisca = fonte.slice(fonte.indexOf("<ChartSparkline"))
        expect(faisca).toContain("bleed")
        expect(faisca).toContain("-mx-(--card-px)")
        expect(faisca).toContain("-mb-(--card-py)")
        expect(faisca).toContain("h-16")
    })

    it("a barra leva o previsto", () => {
        expect(fonte).toContain("projected=")
    })

    it("a frase, a variação e a cor vêm das contas e da paleta", () => {
        expect(fonte).toContain("situacaoDaDespesa(")
        expect(fonte).toContain("rotuloDaVariacao(")
        expect(fonte).toContain("tileColorFor(")
    })

    it("saem o Ver categoria, o Sem orçamento e o selo antigo", () => {
        expect(fonte).not.toContain("Ver categoria")
        expect(fonte).not.toContain("Sem orçamento")
        expect(fonte).not.toContain("MomComparisonBadge")
    })

    it("o ⋯ só existe para quem escreve e só aparece no cursor", () => {
        expect(fonte).toContain("onEdit && onDelete")
        // O `opacity-0` cru: o `[@media(hover:hover)]:opacity-0` sai depois do `group-hover:` no CSS e o venceria.
        expect(fonte).toMatch(/"opacity-0 group-hover:opacity-100 group-focus-within:opacity-100/)
        expect(fonte).not.toContain("[@media(hover:hover)]:opacity-0")
        // No toque o ⋯ não existe: o toque longo abre o menu de contexto.
        expect(fonte).toContain("pointer-coarse:hidden")
    })

    it("a série carregando vira o esqueleto do gráfico", () => {
        expect(fonte).toMatch(/historico === undefined[\s\S]{0,80}ChartSkeleton/)
    })
})

function cartao(p: Partial<Parameters<typeof ExpenseCategoryCard>[0]> = {}) {
    return renderToStaticMarkup(
        h(ExpenseCategoryCard, {
            category: { id: "mercado", name: "Mercado", icon: null, color: null },
            lancado: 100,
            previsto: 0,
            anterior: 100,
            limite: 500,
            totalDoMes: 400,
            maiorTotal: 400,
            ritmo: 50,
            mesYm: "2026-11",
            historico: [80, 90, 100, 110, 120],
            href: "/categories/mercado",
            ...p,
        }),
    )
}

const limpo = (s: string) => s.replace(/\u00a0/g, " ").replace(/<!-- -->/g, "")

describe("CategoryCardSkeleton pelo fonte", () => {
    it("a barra sobe e o esqueleto da faísca fica no pé, de borda a borda", () => {
        const osso = fonte.slice(fonte.indexOf("export function CategoryCardSkeleton"))
        expect(osso.indexOf("h-1.5")).toBeLessThan(osso.indexOf("<ChartSkeleton"))
        expect(osso).toContain("-mx-(--card-px) -mb-(--card-py)")
        expect(osso).toContain("h-16")
    })
})

describe("ExpenseCategoryCard no render", () => {
    it("lançado negativo com previsto: as partes somam o total", () => {
        const html = limpo(cartao({ lancado: -30, previsto: 100 }))
        expect(html).toContain(limpo(`${currencyBRL(0)} lançado + ${currencyBRL(70)} previsto`))
    })

    it("com a série carregando e o gasto negativo, nada sai NaN nem -R$", () => {
        for (const limite of [500, 0]) {
            const html = cartao({ historico: undefined, lancado: -30, limite })
            expect(html).not.toContain("NaN")
            expect(html).not.toMatch(/[-−]\s?R\$/)
            expect(html).toContain('data-slot="chart-skeleton"')
        }
    })
})
