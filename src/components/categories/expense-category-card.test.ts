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
    it("o chevron aparece no hover e o telefone tem o botão fantasma sobre a faísca", () => {
        expect(fonte).toContain("ChevronRightIcon")
        for (const c of ["opacity-0", "group-hover:opacity-100", "max-md:hidden"]) expect(fonte).toContain(c)
        // 20/11/2026: o "Ver lançamentos" é um link de verdade (o cartão inteiro só clica no desktop).
        expect(fonte).toMatch(/<Button asChild variant="tertiary" size="md" className="w-full">\s*<Link href=\{href\}>\s*Ver lançamentos/)
        expect(fonte).toContain('<CardLink asChild className="max-md:pointer-events-none max-md:after:hidden">')
        expect(fonte).toContain("md:active:bg-muted/40")
        expect(fonte).toContain('<div className="pointer-events-none relative -mx-(--card-px) -mb-(--card-py) mt-auto">')
        expect(fonte).toContain('<div className="pointer-events-auto absolute inset-x-(--card-px) bottom-2.5 md:hidden">')
        expect(fonte).not.toMatch(/(?<![\w:])active:bg-muted\/40/)
    })

    it("a faísca é a área com a média", () => {
        expect(fonte).toMatch(/import \{[^}]*ChartSparkline[^}]*\} from "@\/components\/ui\/chart"/)
        expect(fonte).toContain('variant="area"')
        expect(fonte).toContain("reference=")
    })

    it("a barra vem antes da faísca, que é o pé do cartão, de borda a borda", () => {
        expect(fonte.indexOf("<Progress")).toBeLessThan(fonte.indexOf("<ChartSparkline"))
        const faisca = fonte.slice(fonte.indexOf("relative -mx-(--card-px)"))
        expect(faisca).toContain("bleed")
        expect(faisca).toContain("-mx-(--card-px)")
        expect(faisca).toContain("-mb-(--card-py)")
        expect(faisca).toContain("max-md:h-26")
        expect(faisca).toContain("md:h-16")
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

    it("o ⋯ só existe para quem escreve, aparece no cursor e fica à vista no toque", () => {
        expect(fonte).toContain("onEdit && onDelete")
        // O `opacity-0` cru: o `[@media(hover:hover)]:opacity-0` sai depois do `group-hover:` no CSS e o venceria.
        expect(fonte).toMatch(/"opacity-0 group-hover:opacity-100 group-focus-within:opacity-100/)
        expect(fonte).not.toContain("[@media(hover:hover)]:opacity-0")
        // No toque, sem cursor, o ⋯ fica sempre à vista.
        expect(fonte).toContain("pointer-coarse:opacity-100")
        expect(fonte).not.toContain("pointer-coarse:hidden")
    })

    it("a série carregando vira o esqueleto do gráfico", () => {
        expect(fonte).toMatch(/historico === undefined[\s\S]{0,80}data-osso="faisca"/)
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
        expect(osso.indexOf("h-1.5")).toBeLessThan(osso.indexOf('data-osso="faisca"'))
        expect(osso).toContain("-mx-(--card-px) -mb-(--card-py)")
        expect(osso).toContain("max-md:h-26")
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
            expect(html).toContain('data-osso="faisca"')
        }
    })
})

describe("a média no telefone (20/11/2026)", () => {
  it("a linha tracejada da média some abaixo do md", async () => {
    const { lerFonte } = await import("@/test/fonte")
    const nome = import.meta.url.includes("income") ? "income" : "expense"
    expect(lerFonte(`src/components/categories/${nome}-category-card.tsx`)).toContain("max-md:[&_.recharts-reference-line]:hidden")
  })
})

describe("o menu de contexto do cartão de categoria", () => {
    it("no telefone o toque longo não abre menu", () => {
        const f = lerFonte("src/components/categories/category-card-context-menu.tsx")
        expect(f).toContain("const telefone = useIsMobile()")
        expect(f).toContain("<ContextMenuTrigger asChild disabled={telefone}>")
    })
})

describe("o esqueleto da página Categorias na forma da tela (20/11/2026)", () => {
    const cartao = lerFonte("src/components/categories/expense-category-card.tsx")
    const osso = cartao.slice(cartao.indexOf("export function CategoryCardSkeleton"))
    const pagina = lerFonte("src/components/categories/categories-page-grid-skeleton.tsx")

    it("o cartão guarda o lugar do ⋯ e mede as linhas como o cartão real", () => {
        expect(osso).toContain('<span className="block size-8 pointer-coarse:size-11" />')
        expect(osso).toContain('<div className="flex items-end justify-between gap-2">')
        expect(osso).toContain('className="w-14 shrink-0 text-xs"')
        expect(osso).toContain('className="w-48 max-w-full text-xs"')
        // A faísca que espera é leve como a real: a linha tracejada da média e a área a meia tinta.
        expect(osso).toContain("border-dashed border-muted-foreground/30 max-md:hidden")
        expect(osso).toContain('<Skeleton className="h-1/2 w-full rounded-none opacity-50" />')
    })

    it("a barra: abas, a cápsula de dois ícones no telefone, ordenar e mês no desktop", () => {
        expect(pagina).toContain('<Skeleton shape="control" className="min-w-0 flex-1 md:w-45 md:flex-none" />')
        expect(pagina).toContain('<Skeleton shape="control" className="w-22 md:hidden" />')
        expect(pagina).toContain('<Skeleton shape="control" className="aspect-square max-md:hidden" />')
        expect(pagina).toContain('<Skeleton shape="control" className="w-54 max-md:hidden" />')
        expect(pagina).not.toContain("w-39")
    })
})
