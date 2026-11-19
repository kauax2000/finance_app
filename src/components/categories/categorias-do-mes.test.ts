import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { TooltipProvider } from "@/components/ui/tooltip"
import { lerFonte, semComentarios } from "@/test/fonte"

vi.mock("next/link", () => ({ default: (p: Record<string, unknown>) => h("a", p) }))
const { OrdemDasCategorias, SemMovimentoNoMes, mesNaFrase } = await import("./categorias-do-mes")

beforeAll(() => {
    vi.useFakeTimers({ now: new Date(2026, 10, 19, 12) })
})
afterAll(() => {
    vi.useRealTimers()
})

describe("mesNaFrase", () => {
    it("o mês do ano corrente sai só pelo nome, em minúscula", () => {
        expect(mesNaFrase("2026-11", 2026)).toBe("novembro")
        expect(mesNaFrase("2026-03", 2026)).toBe("março")
    })

    it("fora do ano corrente leva o ano", () => {
        expect(mesNaFrase("2025-11", 2026)).toBe("novembro de 2025")
        expect(mesNaFrase("2027-01", 2026)).toBe("janeiro de 2027")
    })
})

describe("a contagem do mês", () => {
    it("é o ToolbarCount da barra, rente ao pé e escondido no telefone", () => {
        const t = semComentarios(lerFonte("src/components/categories/categories-toolbar.tsx"))
        expect(t).toContain("<ToolbarCount")
        expect(t).toContain('noun={["categoria", "categorias"]}')
        expect(t).toContain('className="self-end max-md:hidden"')
    })
})

describe("OrdemDasCategorias", () => {
    it("compacta é o botão de ícone do menu", () => {
        const html = renderToStaticMarkup(
            h(OrdemDasCategorias, { tipo: "expense", criterio: "maior", onCriterioChange: () => {}, invertida: false, onInvertidaChange: () => {}, compacta: true }),
        )
        expect(html).toContain('aria-label="Ordenar categorias: gasto, maior primeiro"')
        expect(html).toContain("dropdown-menu-trigger")
    })

    it("no desktop o gatilho é só o ícone, sem fundo (terciário)", () => {
        const html = renderToStaticMarkup(
            h(TooltipProvider, null, h(OrdemDasCategorias, { tipo: "expense", criterio: "nome", onCriterioChange: () => {}, invertida: false, onInvertidaChange: () => {} })),
        )
        expect(html).toContain('aria-label="Ordenar categorias: nome, a → z"')
        expect(html).toContain('data-variant="tertiary"')
        expect(html).not.toContain("select-trigger")
        expect(html).not.toMatch(/>\s*Nome\s*</)
    })

    it("o sentido invertido aparece no nome do gatilho", () => {
        const html = renderToStaticMarkup(
            h(
                TooltipProvider,
                null,
                h(OrdemDasCategorias, { tipo: "expense", criterio: "maior", onCriterioChange: () => {}, invertida: true, onInvertidaChange: () => {} }),
            ),
        )
        expect(html).toContain('aria-label="Ordenar categorias: gasto, menor primeiro"')
    })

    it("a escolhida mostra a seta do sentido e inverte ao tocar de novo, sem fechar", () => {
        const fonte = semComentarios(lerFonte("src/components/categories/categorias-do-mes.tsx"))
        for (const t of ["indicatorIcon=", "ArrowDownIcon", "rotate-180", "preventDefault()", "text-xs text-muted-foreground"]) expect(fonte).toContain(t)
    })

    it("o sentido fica à vista em todas as ordens: a escolhida, o atual; as outras, o inicial", () => {
        const fonte = semComentarios(lerFonte("src/components/categories/categorias-do-mes.tsx"))
        expect(fonte).toContain("{o.value === criterio ? sentido : o.sentidos[0]}")
    })

    it("o menu tem título, tique, ícones e os seis sentidos", () => {
        const fonte = semComentarios(lerFonte("src/components/categories/categorias-do-mes.tsx"))
        expect(fonte).toContain('title="Ordenar por"')
        expect(fonte).toContain('indicator="check"')
        for (const t of ["Gasto", "Receita", "Nome", "Variação"]) expect(fonte).toContain(`"${t}"`)
        for (const t of ["Maior primeiro", "Menor primeiro", "A → Z", "Z → A", "Mais subiu", "Mais caiu"]) expect(fonte).toContain(`"${t}"`)
        for (const i of ["BanknotesIcon", "LanguageIcon", "ArrowTrendingUpIcon"]) expect(fonte).toContain(i)
        expect(fonte).not.toContain("CategoriasDoMesCabecalho")
        expect(fonte).not.toContain("Sentido")
    })
})

describe("SemMovimentoNoMes", () => {
    const duas = [
        { id: "a", name: "Pets", href: "/categories/a" },
        { id: "b", name: "Viagem", href: "/categories/b" },
    ]

    it("lista as sem gasto com o link de cada uma", () => {
        const html = renderToStaticMarkup(h(SemMovimentoNoMes, { categorias: duas, mesYm: "2026-11", tipo: "expense" }))
        expect(html).toContain("Sem gasto em novembro:")
        expect(html).toContain('href="/categories/a"')
        expect(html).toContain('href="/categories/b"')
        expect(html).toContain("Pets")
        expect(html).toContain("Viagem")
    })

    it("vazio não desenha nada", () => {
        expect(renderToStaticMarkup(h(SemMovimentoNoMes, { categorias: [], mesYm: "2026-11", tipo: "expense" }))).toBe("")
    })

    it("na receita, sem receita", () => {
        const html = renderToStaticMarkup(h(SemMovimentoNoMes, { categorias: duas, mesYm: "2026-11", tipo: "income" }))
        expect(html).toContain("Sem receita em novembro:")
    })
})

describe("a grade na page-client", () => {
    const fonte = semComentarios(lerFonte("src/app/(app)/categories/page-client.tsx"))

    it("liga a série, a ordem e o rodapé", () => {
        expect(fonte).toContain("useSerieDasCategorias(")
        expect(fonte).toContain("dividirDoMes(")
        expect(fonte).toContain("roundCents(lancado + previsto)")
        expect(fonte).toContain("<SemMovimentoNoMes")
    })

    it("o vazio do mês é a pilha", () => {
        expect(fonte).toContain("EmptyState")
        expect(fonte).toContain('variant="stack"')
        expect(fonte).toContain("Nenhum gasto em")
    })

    it("sem o spendRank", () => {
        expect(fonte).not.toContain("spendRank")
    })
})

describe("o esqueleto da grade", () => {
    const fonte = semComentarios(lerFonte("src/components/categories/categories-page-grid-skeleton.tsx"))

    it("usa o osso do cartão, dentro de um bloco que anuncia uma vez", () => {
        expect(fonte).toContain("<CategoryCardSkeleton")
        expect(fonte).toContain("<SkeletonGroup")
        expect(fonte).not.toContain("ExpenseCategoryCardSkeleton")
    })
})
