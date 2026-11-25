import { describe, expect, it } from "vitest"
import type { FilterField, FilterValue } from "@/components/ui/filter-bar"
import { camposDaCategoria, comDescricao, estadoDoMes, hrefDeTransacoes } from "./lancamentos-da-categoria-regras"

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

describe("camposDaCategoria", () => {
    it("tira categoria e período", () => {
        const campos = [{ id: "categoria" }, { id: "periodo" }, { id: "valor" }] as FilterField[]
        expect(camposDaCategoria(campos).map((c) => c.id)).toEqual(["valor"])
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
