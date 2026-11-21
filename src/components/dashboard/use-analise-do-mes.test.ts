import { describe, expect, it } from "vitest"
import { aggregateIncomeExpenseForMonth, buildCreditCardClosingLookup } from "@/lib/expense-month-attribution"
import type { Transaction } from "@/lib/supabase"
import { analiseDoMes, categoriaDoParametro } from "./use-analise-do-mes"

const lookup = buildCreditCardClosingLookup([{ id: "c1", closing_day: 10 }])

let n = 0
function tx(p: Partial<Transaction>): Transaction {
    n += 1
    return {
        id: `t${n}`,
        description: "x",
        amount: 10,
        type: "expense",
        date: "2026-11-05",
        payment_method: "pix",
        payment_credit_card_id: null,
        category_id: "carro",
        user_id: "u1",
        ...p,
    } as Transaction
}

const base = {
    tipo: "expense" as const,
    yearMonth: "2026-11",
    hojeYmd: "2026-11-21",
    lookup,
    cartoes: [{ id: "c1", name: "Nubank" }],
    previsto: 0,
}

// Novembro: PIX de carro e de mercado, crédito que fecha em 10/nov (out → nov) e um que só fecha em dezembro.
const txs = [
    tx({ amount: 200, date: "2026-11-03" }),
    tx({ amount: 50, date: "2026-11-12", category_id: "mercado" }),
    tx({ amount: 80, date: "2026-11-15", category_id: "mercado", payment_method: "credit_card", payment_credit_card_id: "c1" }),
    tx({ amount: 30, date: "2026-11-15", category_id: "mercado", type: "income" }),
]
const txsAnterior = [
    tx({ amount: 120, date: "2026-10-20", payment_method: "credit_card", payment_credit_card_id: "c1" }),
    tx({ amount: 40, date: "2026-10-02" }),
]

describe("analiseDoMes", () => {
    it("com Todas, o total da concentração é a despesa do mês pelo corte do crédito", () => {
        const a = analiseDoMes({ ...base, txs, txsAnterior, categoriaId: null })
        const esperado = aggregateIncomeExpenseForMonth([...txsAnterior, ...txs], "2026-11", lookup).expense
        expect(a?.concentracao.total).toBe(esperado)
        // 200 + 50 do PIX e os 120 do crédito de outubro, que fecha em novembro; os 80 ficam para dezembro.
        expect(esperado).toBe(370)
    })

    it("junta as duas janelas sem contar duas vezes o mesmo lançamento", () => {
        const a = analiseDoMes({ ...base, txs, txsAnterior: [...txsAnterior, txs[0]], categoriaId: null })
        expect(a?.concentracao.total).toBe(370)
    })

    it("com uma categoria, só as dela entram", () => {
        const a = analiseDoMes({ ...base, txs, txsAnterior, categoriaId: "mercado" })
        expect(a?.concentracao.total).toBe(50)
        expect(a?.concentracao.quantidade).toBe(1)
        expect(a?.porPagamento.map((f) => f.forma)).toEqual(["pix"])
    })

    it("o mês anterior da forma de pagamento é o do mesmo corte", () => {
        const a = analiseDoMes({ ...base, txs, txsAnterior, categoriaId: "carro" })
        expect(a?.porPagamentoAnterior.reduce((s, f) => s + f.valor, 0)).toBe(40)
    })

    it("sem despesa no mês, devolve null", () => {
        expect(analiseDoMes({ ...base, txs, txsAnterior, categoriaId: "lazer" })).toBeNull()
        expect(analiseDoMes({ ...base, txs: [], txsAnterior: [], categoriaId: null })).toBeNull()
    })
})

describe("categoriaDoParametro", () => {
    const categorias = [
        { id: "carro", type: "expense" as const },
        { id: "salario", type: "income" as const },
    ]
    it("aceita uma categoria de despesa da carteira", () => {
        expect(categoriaDoParametro("carro", categorias)).toBe("carro")
    })
    it("sem parâmetro, inexistente ou de receita, cai em Todas", () => {
        expect(categoriaDoParametro(null, categorias)).toBeNull()
        expect(categoriaDoParametro("", categorias)).toBeNull()
        expect(categoriaDoParametro("nao-existe", categorias)).toBeNull()
        expect(categoriaDoParametro("salario", categorias)).toBeNull()
    })
})
