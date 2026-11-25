import { describe, expect, it } from "vitest"
import type { FilterValue } from "@/components/ui/filter-bar"
import type { Category, Transaction } from "@/lib/supabase"
import { comACategoria, comDescricao, estadoDoMes, hrefDeTransacoes, paginaValida } from "./lancamentos-da-categoria-regras"

describe("estadoDoMes", () => {
    it("abre limpo, da data mais recente", () => {
        expect(estadoDoMes()).toEqual({ type: "all", q: "", filtros: [], sort: { key: "date", dir: "desc" }, page: 1 })
    })
})

describe("comDescricao", () => {
    it("substitui a descrição anterior e mantém o valor", () => {
        const valor: FilterValue = { field: "valor", operator: "gte", values: ["10"] }
        const antes: FilterValue[] = [{ field: "descricao", operator: "is", values: ["Velha"] }, valor]
        expect(comDescricao(antes, "Mercado")).toEqual([valor, { field: "descricao", operator: "is", values: ["Mercado"] }])
    })
})

describe("hrefDeTransacoes", () => {
    const base = { categoryId: "c1", tipo: "expense" as const, filtros: [] }
    it("fecha o mês pelo último dia", () => {
        expect(decodeURIComponent(hrefDeTransacoes({ ...base, yearMonth: "2026-11" }))).toBe(
            "/transactions?type=expense&f=periodo:is:2026-11-01:2026-11-30,categoria:is:c1",
        )
        expect(decodeURIComponent(hrefDeTransacoes({ ...base, yearMonth: "2026-02" }))).toContain("2026-02-01:2026-02-28")
    })
    it("põe os filtros da lista depois da categoria", () => {
        const href = decodeURIComponent(
            hrefDeTransacoes({ ...base, tipo: "income", yearMonth: "2026-11", filtros: [{ field: "descricao", operator: "is", values: ["X"] }] }),
        )
        expect(href).toMatch(/^\/transactions\?type=income&f=periodo:.*,categoria:is:c1,descricao:is:X$/)
    })
})

describe("paginaValida", () => {
    it("mantém a página que existe e volta à última quando a lista encolhe", () => {
        expect(paginaValida(2, 60, 50)).toBe(2)
        expect(paginaValida(2, 50, 50)).toBe(1)
        expect(paginaValida(3, 0, 50)).toBe(1)
    })
})

describe("comACategoria", () => {
    const cat = { id: "c1", name: "Carro", color: "#f00", icon: "car" } as Category
    it("põe a categoria da tela nas linhas que vêm sem ela e mantém a de outra categoria", () => {
        const outra = { id: "c2", name: "Outra" } as Category
        const [a, b] = comACategoria(
            [{ id: "a", category_id: "c1" } as Transaction, { id: "b", category_id: "c2", category: outra } as Transaction],
            cat,
        )
        expect(a.category).toEqual(cat)
        expect(b.category).toBe(outra)
    })
    it("a linha desta categoria com nome mas sem cor nem ícone ganha os da tela", () => {
        const [a] = comACategoria(
            [{ id: "a", category_id: "c1", category: { id: "c1", name: "Carro" } } as Transaction],
            cat,
        )
        expect(a.category).toMatchObject({ id: "c1", name: "Carro", color: "#f00", icon: "car" })
    })
    it("sem categoria carregada, devolve as linhas como vieram", () => {
        const linhas = [{ id: "a" } as Transaction]
        expect(comACategoria(linhas, null)).toBe(linhas)
    })
})
