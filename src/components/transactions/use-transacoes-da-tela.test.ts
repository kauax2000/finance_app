import { describe, expect, it, vi } from "vitest"
import type { Transaction } from "@/lib/supabase"
import { PROJECTED_TRANSACTION_ID_PREFIX } from "@/lib/category-expense-month-rows"
import { lerFonte, semComentarios } from "@/test/fonte"
import { paginaDepoisDeExcluir, primeiraVez, urlSem, vizinhosDe } from "./use-transacoes-da-tela"

vi.mock("@/lib/supabase", () => ({ supabase: {} }))

const t = (id: string) => ({ id }) as Transaction

describe("vizinhosDe", () => {
    const lista = [t("a"), t("b"), t("c")]

    it("devolve o anterior e o seguinte na ordem da lista", () => {
        expect(vizinhosDe(lista, "b")).toEqual({ anterior: lista[0], seguinte: lista[2] })
        expect(vizinhosDe(lista, "a")).toEqual({ seguinte: lista[1] })
        expect(vizinhosDe(lista, "c")).toEqual({ anterior: lista[1] })
    })

    it("ignora as linhas projetadas", () => {
        const p = t(`${PROJECTED_TRANSACTION_ID_PREFIX}x`)
        const comProjetada = [lista[0], p, lista[1], p, lista[2]]
        expect(vizinhosDe(comProjetada, "b")).toEqual({ anterior: lista[0], seguinte: lista[2] })
        expect(vizinhosDe(comProjetada, p.id)).toEqual({})
    })

    it("devolve {} quando o id não está na lista", () => {
        expect(vizinhosDe(lista, "z")).toEqual({})
        expect(vizinhosDe([], "a")).toEqual({})
    })
})

describe("paginaDepoisDeExcluir", () => {
    it("volta uma página quando a página fica vazia", () => {
        expect(paginaDepoisDeExcluir(3, 2, 2)).toBe(2)
        expect(paginaDepoisDeExcluir(3, 5, 2)).toBe(2)
    })
    it("fica na página quando sobra linha ou já é a primeira", () => {
        expect(paginaDepoisDeExcluir(3, 1, 2)).toBe(3)
        expect(paginaDepoisDeExcluir(1, 2, 2)).toBe(1)
    })
})

describe("urlSem", () => {
    it("tira só as chaves pedidas e preserva o resto da URL mais nova", () => {
        const atual = "f=periodo.is.este-mes&new=1&txn=abc&frase=oi&frase_titulo=t"
        expect(urlSem(atual, ["new"]).toString()).toBe("f=periodo.is.este-mes&txn=abc&frase=oi&frase_titulo=t")
        expect(urlSem(atual, ["frase", "frase_titulo", "frase_url"]).toString()).toBe("f=periodo.is.este-mes&new=1&txn=abc")
        expect(urlSem("", ["new"]).toString()).toBe("")
    })
})

describe("primeiraVez", () => {
    it("consome um valor uma vez só, e rearma quando ele sai", () => {
        const ref = { current: null as string | null }
        expect(primeiraVez(ref, "1")).toBe(true)
        expect(primeiraVez(ref, "1")).toBe(false) // o segundo efeito do modo estrito
        expect(primeiraVez(ref, "receita")).toBe(true)
        expect(primeiraVez(ref, null)).toBe(false)
        expect(ref.current).toBeNull()
        expect(primeiraVez(ref, "receita")).toBe(true)
    })
})

describe("use-transacoes-da-tela (fonte)", () => {
    const fonte = semComentarios(lerFonte("src/components/transactions/use-transacoes-da-tela.ts"))

    it("não importa o controlador antigo", () => {
        expect(fonte).not.toContain("use-transactions-list-controller")
    })

    it("lê e escreve a URL pelo módulo de filtros, com replace", () => {
        expect(fonte).toContain("lerFiltrosDaUrl")
        expect(fonte).toContain("escreverFiltrosNaUrl")
        expect(fonte).toContain("router.replace")
    })

    it("os pedidos únicos passam pela guarda e escrevem a partir da URL mais nova", () => {
        expect(fonte.match(/primeiraVez\((newConsumido|fraseConsumida), (newNaUrl|texto)\)/g)?.length).toBe(2)
        expect(fonte).not.toMatch(/substituir\([^)]*URLSearchParams\(qs/)
        expect(fonte).not.toMatch(/escreverFiltrosNaUrl\([^)]*URLSearchParams\(qs/)
    })

    it("mantém o número anterior nas três consultas", () => {
        expect(fonte.match(/placeholderData: keepPreviousData/g)?.length).toBe(3)
    })
})
