import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

vi.mock("next/link", () => ({ default: (p: Record<string, unknown>) => h("a", p) }))
const { CategoriasDoMesCabecalho, SemMovimentoNoMes, mesNaFrase } = await import("./categorias-do-mes")

beforeAll(() => {
    vi.useFakeTimers({ now: new Date(2026, 10, 19, 12) })
})
afterAll(() => {
    vi.useRealTimers()
})

const cabecalho = (quantidade: number, tipo: "expense" | "income") =>
    renderToStaticMarkup(
        h(CategoriasDoMesCabecalho, {
            quantidade,
            mesYm: "2026-11",
            tipo,
            criterio: "maior",
            onCriterioChange: () => {},
        }),
    )

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

describe("CategoriasDoMesCabecalho", () => {
    it("conta as categorias com gasto no mês", () => {
        expect(cabecalho(5, "expense")).toContain("5 categorias com gasto em novembro")
    })

    it("na receita, com receita", () => {
        expect(cabecalho(5, "income")).toContain("5 categorias com receita em novembro")
    })

    it("uma só no singular", () => {
        expect(cabecalho(1, "expense")).toContain("1 categoria com gasto em novembro")
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
