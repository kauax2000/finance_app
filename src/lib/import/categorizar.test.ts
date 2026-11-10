import { describe, expect, it } from "vitest"
import { aplicarSugestoes, MAX_NOMES_POR_TIPO, pareceEstorno, pedidoDaIA } from "./categorizar"
import type { ItemImportavel } from "./importar"

const conta = { tipo: "conta", paymentMethod: "pix" } as const
const item = (clientId: string, o: Partial<ItemImportavel> = {}): ItemImportavel => ({
    data: "2026-10-10",
    descricao: `LOJA ${clientId}`,
    valor: 10,
    estorno: false,
    parcela: null,
    clientId,
    categoryId: null,
    origem: null,
    ...o,
})
const cats = [
    { id: "mercado", name: "Mercado", type: "expense" as const },
    { id: "lazer", name: "Lazer", type: "expense" as const },
]
const semCategoria = () => null

describe("pedidoDaIA", () => {
    it("respeita os tetos do servidor: descrição em 200, nome de até 60 e com letra", () => {
        const cs = [...cats, { id: "x", name: "N".repeat(61), type: "expense" as const }, { id: "y", name: "!!!", type: "expense" as const }]
        const p = pedidoDaIA([item("a", { descricao: "D".repeat(250) })], semCategoria, cs, conta)
        expect(p.itens[0].descricao).toHaveLength(200)
        expect(p.categorias.expense).toEqual(["Mercado", "Lazer"])
    })

    it("pula as linhas com categoria e os tipos sem categoria; só vão índice, descrição e tipo", () => {
        const itens = [item("a"), item("b"), item("c", { estorno: true })]
        const p = pedidoDaIA(itens, (id) => (id === "b" ? "lazer" : null), cats, conta)
        expect(p.itens).toEqual([{ i: 0, descricao: "LOJA a", tipo: "expense" }])
        expect(p.clientIds).toEqual(["a"])
        expect(p.categorias).toEqual({ expense: ["Mercado", "Lazer"], income: [] })
        expect(p.ficaram).toBe(0)
    })

    it("no cartão, o crédito só vai à IA quando a descrição diz estorno", () => {
        const cartao = { tipo: "cartao", cardId: "c1" } as const
        const itens = [
            item("pix", { estorno: true, descricao: "Pix recebido" }),
            item("est", { estorno: true, descricao: "ESTORNO IFOOD" }),
            item("compra"),
        ]
        const p = pedidoDaIA(itens, semCategoria, cats, cartao)
        expect(p.clientIds).toEqual(["est", "compra"])
        expect(p.itens[0]).toEqual({ i: 0, descricao: "ESTORNO IFOOD", tipo: "expense" })
    })

    it("pareceEstorno reconhece devolução, sem acento nem caixa", () => {
        for (const d of ["Estorno Uber", "DEVOLUÇÃO loja", "Reembolso", "Cancelamento compra", "chargeback", "Crédito de estorno"])
            expect(pareceEstorno(d)).toBe(true)
        for (const d of ["Pix recebido", "Pagamento fatura", "Salário", "Restorno"]) expect(pareceEstorno(d)).toBe(false)
    })

    it("a linha da planilha com categoria que nasce ao gravar não vai à IA", () => {
        const p = pedidoDaIA([item("a", { categoria: "Feira" }), item("b", { categoria: " " }), item("c")], semCategoria, cats, conta)
        expect(p.clientIds).toEqual(["b", "c"])
    })

    it("manda no máximo 100 nomes por tipo, e as linhas do tipo cortado seguem", () => {
        const muitas = Array.from({ length: 130 }, (_, n) => ({ id: `e${n}`, name: `Cat ${n}`, type: "expense" as const }))
        const p = pedidoDaIA([item("a")], semCategoria, muitas, conta)
        expect(p.categorias.expense).toHaveLength(MAX_NOMES_POR_TIPO)
        expect(MAX_NOMES_POR_TIPO).toBe(100)
        expect(p.clientIds).toEqual(["a"])
    })

    it("corta em 200, e ficaram conta as de fora", () => {
        const itens = Array.from({ length: 203 }, (_, n) => item(`x${n}`))
        const p = pedidoDaIA(itens, semCategoria, cats, conta)
        expect(p.itens).toHaveLength(200)
        expect(p.itens[199].i).toBe(199)
        expect(p.clientIds[199]).toBe("x199")
        expect(p.ficaram).toBe(3)
    })
})

describe("aplicarSugestoes", () => {
    it("mapeia clientId para a categoria do tipo da linha, e ignora índice sem linha e nome que não existe", () => {
        const p = pedidoDaIA([item("a"), item("b")], semCategoria, cats, conta)
        const r = aplicarSugestoes(
            [
                { i: 0, categoria: "Mercado" },
                { i: 1, categoria: "Inexistente" },
                { i: 7, categoria: "Lazer" },
            ],
            p,
            cats,
        )
        expect([...r]).toEqual([["a", "mercado"]])
    })
})
