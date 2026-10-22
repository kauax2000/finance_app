import { describe, expect, it } from "vitest"
import {
    casarCartao,
    interpretarFrase,
    preencherPeloHistorico,
    type CartaoParaCasar,
    type FraseInterpretada,
    type LinhaHistorico,
} from "./frase"

const HOJE = "2026-04-10"

describe("interpretarFrase", () => {
    const casos: Array<[string, string, Partial<FraseInterpretada>]> = [
        // Valor
        ["42 mercado", HOJE, { valor: 42, descricao: "Mercado", duvidas: [] }],
        ["42,90 padaria", HOJE, { valor: 42.9, descricao: "Padaria" }],
        ["R$ 42 farmácia", HOJE, { valor: 42, descricao: "Farmácia" }],
        ["R$42 farmácia", HOJE, { valor: 42, descricao: "Farmácia" }],
        ["1.234,56 geladeira", HOJE, { valor: 1234.56, descricao: "Geladeira" }],
        ["12.50 café", HOJE, { valor: 12.5, descricao: "Café" }],
        ["1.234 aluguel", HOJE, { valor: 1234, descricao: "Aluguel" }],
        ["gasolina 200 reais", HOJE, { valor: 200, descricao: "Gasolina" }],
        ["quarenta e dois reais mercado", HOJE, { valor: 42, descricao: "Mercado" }],
        ["cento e vinte farmácia", HOJE, { valor: 120, descricao: "Farmácia" }],
        ["mil e duzentos aluguel", HOJE, { valor: 1200, descricao: "Aluguel" }],
        ["vinte e um padaria", HOJE, { valor: 21, descricao: "Padaria" }],
        ["uma pizza 30", HOJE, { valor: 30, descricao: "Uma pizza", cartaoTexto: null }],
        ["mercado nubank", HOJE, { valor: null, duvidas: ["valor"] }],
        // Data
        ["hoje 20 padaria", HOJE, { data: "2026-04-10", valor: 20 }],
        ["ontem 20 padaria", HOJE, { data: "2026-04-09", valor: 20 }],
        ["anteontem 20 padaria", HOJE, { data: "2026-04-08", valor: 20 }],
        ["dia 31 farmácia 20", HOJE, { data: "2026-03-31", valor: 20, descricao: "Farmácia" }],
        ["dia 25 farmácia 20", HOJE, { data: "2026-03-25", valor: 20 }],
        ["dia 5 farmácia 20", HOJE, { data: "2026-04-05", valor: 20 }],
        ["dia 31 farmácia 20", "2026-05-10", { data: "2026-04-30" }],
        ["05/03 farmácia 20", HOJE, { data: "2026-03-05", valor: 20, descricao: "Farmácia" }],
        ["31/02 farmácia 20", HOJE, { data: HOJE, duvidas: ["data"] }],
        ["ontem 20 padaria", "2026-01-01", { data: "2025-12-31" }],
        ["dia 15 padaria 20", "2026-01-10", { data: "2025-12-15" }],
        // Parcelas
        ["42 mercado nubank em 3x", "2026-10-21", {
            valor: 42, parcelas: 3, cartaoTexto: "nubank", descricao: "Mercado", tipo: "expense", data: "2026-10-21",
        }],
        ["600 tv 10x", HOJE, { valor: 600, parcelas: 10, descricao: "Tv" }],
        ["600 tv em 10 vezes", HOJE, { valor: 600, parcelas: 10, descricao: "Tv" }],
        ["600 tv em 60x", HOJE, { valor: 600, parcelas: null, duvidas: ["parcelas"] }],
        ["600 tv em 1x", HOJE, { parcelas: null, duvidas: ["parcelas"] }],
        // Tipo
        ["recebi 300 freela", HOJE, { tipo: "income", estorno: false, valor: 300, descricao: "Freela" }],
        ["salário 5000", HOJE, { tipo: "income", valor: 5000, descricao: "Salário" }],
        ["salario 5000", HOJE, { tipo: "income" }],
        ["receita 200 aula", HOJE, { tipo: "income", descricao: "Receita aula", cartaoTexto: null }],
        ["estorno netflix 30", HOJE, { tipo: "income", estorno: true, valor: 30, descricao: "Netflix" }],
        ["estornou 30 netflix", HOJE, { tipo: "income", estorno: true }],
        // Forma
        ["42 mercado pix", HOJE, { forma: "pix", descricao: "Mercado", cartaoTexto: null }],
        ["42 mercado no débito", HOJE, { forma: "debit", descricao: "Mercado" }],
        ["42 mercado debito", HOJE, { forma: "debit" }],
        ["42 feira dinheiro", HOJE, { forma: "cash", descricao: "Feira" }],
        ["42 mercado no crédito", HOJE, { forma: "credit_card", descricao: "Mercado", duvidas: ["cartao"] }],
        ["42 mercado credito", HOJE, { forma: "credit_card" }],
        ["42 mercado no cartão inter", HOJE, { forma: "credit_card", cartaoTexto: "inter", descricao: "Mercado" }],
        ["42 mercado no cartão de crédito", HOJE, { forma: "credit_card", descricao: "Mercado" }],
        // Descrição e cartão
        ["42 pão de queijo", HOJE, { descricao: "Pão de queijo", cartaoTexto: null }],
        ["42 mercado no nubank", HOJE, { descricao: "Mercado", cartaoTexto: "nubank" }],
        ["42   mercado    do   bairro", HOJE, { descricao: "Mercado do bairro", cartaoTexto: null }],
        ["42", HOJE, { valor: 42, descricao: "Lançamento rápido", duvidas: ["descricao"] }],
        ["", HOJE, { valor: null, descricao: "Lançamento rápido", duvidas: ["valor", "descricao"] }],
    ]

    it.each(casos)("%s (hoje %s)", (frase, hoje, esperado) => {
        expect(interpretarFrase(frase, hoje)).toMatchObject(esperado)
    })

    it("devolve a forma completa, com padrões", () => {
        expect(interpretarFrase("42 mercado", HOJE)).toEqual({
            valor: 42,
            data: HOJE,
            parcelas: null,
            tipo: "expense",
            estorno: false,
            forma: null,
            cartaoTexto: null,
            descricao: "Mercado",
            duvidas: [],
        })
    })
})

const cartao = (over: Partial<CartaoParaCasar>): CartaoParaCasar => ({
    id: "c1",
    name: "Nubank Roxinho",
    wallet_alias: null,
    last_four: null,
    workspace_id: "w1",
    is_active: true,
    ...over,
})

describe("casarCartao", () => {
    it("sem texto, nada", () => {
        expect(casarCartao(null, [cartao({})])).toBeNull()
        expect(casarCartao("", [cartao({})])).toBeNull()
    })

    it("o alias da Wallet vence, comparado normalizado", () => {
        const a = cartao({ id: "a", name: "Inter", wallet_alias: "Cartão Família" })
        const b = cartao({ id: "b", name: "Cartão Família Itaú" })
        expect(casarCartao("cartao familia", [b, a])?.id).toBe("a")
    })

    it("depois, uma palavra de 3 letras ou mais do nome", () => {
        const a = cartao({ id: "a", name: "Nubank Roxinho" })
        const b = cartao({ id: "b", name: "Inter Black" })
        expect(casarCartao("nubank", [a, b])?.id).toBe("a")
        expect(casarCartao("Inter", [a, b])?.id).toBe("b")
    })

    it("depois, os 4 dígitos do last_four", () => {
        const a = cartao({ id: "a", name: "Visa", last_four: "1234" })
        const b = cartao({ id: "b", name: "Master", last_four: "9876" })
        expect(casarCartao("•••• 9876", [a, b])?.id).toBe("b")
    })

    it("dois candidatos no mesmo nível dão null", () => {
        const a = cartao({ id: "a", name: "Nubank Kaue" })
        const b = cartao({ id: "b", name: "Nubank Ana" })
        expect(casarCartao("nubank", [a, b])).toBeNull()
    })

    it("empate no nome desempata pelos 4 dígitos", () => {
        const a = cartao({ id: "a", name: "Nubank Kaue", last_four: "1111" })
        const b = cartao({ id: "b", name: "Nubank Ana", last_four: "2222" })
        expect(casarCartao("Nubank 2222", [a, b])?.id).toBe("b")
    })

    it("só cartões ativos", () => {
        const a = cartao({ id: "a", name: "Nubank", is_active: false })
        const b = cartao({ id: "b", name: "Nubank Novo" })
        expect(casarCartao("nubank", [a, b])?.id).toBe("b")
        expect(casarCartao("nubank", [a])).toBeNull()
    })

    it("sem casamento, null", () => {
        expect(casarCartao("bradesco", [cartao({})])).toBeNull()
    })
})

const linha = (over: Partial<LinhaHistorico>): LinhaHistorico => ({
    description: "Mercado",
    category_id: "cat",
    payment_method: "pix",
    payment_credit_card_id: null,
    date: "2026-01-01",
    type: "expense",
    ...over,
})

describe("preencherPeloHistorico", () => {
    it("a linha mais recente de mesmo tipo e mesma descrição normalizada", () => {
        const historico = [
            linha({ category_id: "velha", date: "2026-01-01" }),
            linha({ description: "MERCADO!", category_id: "nova", payment_method: "credit_card", payment_credit_card_id: "c1", date: "2026-03-01" }),
            linha({ category_id: "receita", date: "2026-04-01", type: "income" }),
        ]
        expect(preencherPeloHistorico("mercado", "expense", historico)).toEqual({
            categoryId: "nova", paymentMethod: "credit_card", creditCardId: "c1",
        })
    })

    it("sem descrição igual, a mesma palavra significativa", () => {
        const historico = [
            linha({ description: "Mercado do bairro", category_id: "mercado", date: "2026-02-01" }),
            linha({ description: "Farmácia", category_id: "saude", date: "2026-03-01" }),
        ]
        expect(preencherPeloHistorico("Mercado central", "expense", historico).categoryId).toBe("mercado")
    })

    it("a descrição igual vence a palavra, mesmo mais antiga", () => {
        const historico = [
            linha({ description: "Mercado", category_id: "igual", date: "2026-01-01" }),
            linha({ description: "Mercado do bairro", category_id: "palavra", date: "2026-03-01" }),
        ]
        expect(preencherPeloHistorico("mercado", "expense", historico).categoryId).toBe("igual")
    })

    it("sem casamento, os três null", () => {
        expect(preencherPeloHistorico("Padaria", "expense", [linha({})])).toEqual({
            categoryId: null, paymentMethod: null, creditCardId: null,
        })
        expect(preencherPeloHistorico("Mercado", "income", [linha({})])).toEqual({
            categoryId: null, paymentMethod: null, creditCardId: null,
        })
    })
})
