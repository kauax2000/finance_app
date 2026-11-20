import { describe, expect, it } from "vitest"
import {
    comparacaoComMesAnterior,
    descricoesRepetidas,
    divisaoPorMembro,
    divisaoPorPagamento,
    maioresLancamentos,
    mediaDosMeses,
    serieDosMeses,
    totalNoMes,
} from "@/lib/categoria-detalhe"
import { buildCreditCardClosingLookup } from "@/lib/expense-month-attribution"
import type { Transaction } from "@/lib/supabase"

const lookup = buildCreditCardClosingLookup([{ id: "c1", closing_day: 10 }])
const cartoes = [{ id: "c1", name: "Nubank" }]

function tx(p: Partial<Transaction>): Transaction {
    return {
        id: "x",
        description: "x",
        amount: 10,
        type: "expense",
        date: "2026-11-05",
        payment_method: "pix",
        payment_credit_card_id: null,
        user_id: "u1",
        ...p,
    } as Transaction
}

describe("totalNoMes", () => {
    it("compra no cartão em 15/out cai em nov, não em out", () => {
        const rows = [tx({ date: "2026-10-15", amount: 50, payment_method: "credit_card", payment_credit_card_id: "c1" })]
        expect(totalNoMes(rows, "expense", "2026-11", lookup)).toBe(50)
        expect(totalNoMes(rows, "expense", "2026-10", lookup)).toBe(0)
    })
    it("estorno no cartão abate a despesa", () => {
        const rows = [
            tx({ date: "2026-10-15", amount: 50, payment_method: "credit_card", payment_credit_card_id: "c1" }),
            tx({ date: "2026-10-20", amount: 20, type: "income", payment_method: "credit_card", payment_credit_card_id: "c1" }),
        ]
        expect(totalNoMes(rows, "expense", "2026-11", lookup)).toBe(30)
    })
    it("ateDia exclui compra do dia 6", () => {
        const rows = [tx({ date: "2026-11-06", amount: 7 }), tx({ date: "2026-11-05", amount: 3 })]
        expect(totalNoMes(rows, "expense", "2026-11", lookup, 5)).toBe(3)
    })
})

describe("serieDosMeses", () => {
    it("termina no mês, mais antigo primeiro, zeros nos vazios", () => {
        const rows = [tx({ date: "2026-11-05", amount: 4 })]
        expect(serieDosMeses(rows, "expense", "2026-11", lookup, 3)).toEqual([
            { yearMonth: "2026-09", total: 0 },
            { yearMonth: "2026-10", total: 0 },
            { yearMonth: "2026-11", total: 4 },
        ])
    })
})

describe("comparacaoComMesAnterior", () => {
    const rows = [
        tx({ date: "2026-10-10", amount: 100 }),
        tx({ date: "2026-10-20", amount: 900 }),
        tx({ date: "2026-11-05", amount: 150 }),
    ]
    it("mesmo ponto: anterior só até o dia de hoje", () => {
        const c = comparacaoComMesAnterior({ rows, tipo: "expense", yearMonth: "2026-11", hojeYmd: "2026-11-12", lookup })
        expect(c).toMatchObject({ mesmoPonto: true, mesAnterior: "2026-10", anterior: 100, atual: 150, variacao: 0.5 })
    })
    it("mês passado: mês inteiro", () => {
        const c = comparacaoComMesAnterior({ rows, tipo: "expense", yearMonth: "2026-08", hojeYmd: "2026-11-12", lookup })
        expect(c.mesmoPonto).toBe(false)
        expect(c.mesAnterior).toBe("2026-07")
    })
    it("anterior 0 → variacao null", () => {
        const c = comparacaoComMesAnterior({ rows, tipo: "expense", yearMonth: "2026-09", hojeYmd: "2026-11-12", lookup })
        expect(c.variacao).toBeNull()
    })
})

describe("mediaDosMeses", () => {
    it("criada há pouco → null", () => {
        expect(mediaDosMeses({ rows: [], tipo: "expense", yearMonth: "2026-11", lookup, criadaEm: "2026-09-20T10:00:00Z" })).toBeNull()
    })
    it("média dos meses anteriores, mês vazio conta 0", () => {
        const rows = [tx({ date: "2026-08-10", amount: 100 }), tx({ date: "2026-10-10", amount: 200 })]
        expect(mediaDosMeses({ rows, tipo: "expense", yearMonth: "2026-11", lookup, criadaEm: "2025-01-01T00:00:00Z", meses: 3 })).toBe(100)
    })
})

describe("divisaoPorPagamento", () => {
    it("Pix, cartão e cartão desconhecido, maior primeiro", () => {
        const txs = [
            tx({ amount: 30, payment_method: "pix" }),
            tx({ amount: 20, payment_method: "credit_card", payment_credit_card_id: "c1" }),
            tx({ amount: 10, payment_method: "credit_card", payment_credit_card_id: "zz" }),
        ]
        expect(divisaoPorPagamento(txs, "expense", cartoes).map((f) => [f.nome, f.valor])).toEqual([
            ["PIX", 30],
            ["Nubank", 20],
            ["Cartão", 10],
        ])
    })
})

describe("divisaoPorMembro", () => {
    const membros = [{ user_id: "u1", email: "a@x.com", full_name: "Ana" }, { user_id: "u2", email: "b@x.com", full_name: null }]
    it("paid_by vence user_id; ausente vira Outros", () => {
        const txs = [
            tx({ amount: 5, paid_by: "u2", user_id: "u1" }),
            tx({ amount: 9, user_id: "u9" }),
            tx({ amount: 1, user_id: "u1" }),
        ]
        expect(divisaoPorMembro(txs, "expense", membros).map((f) => [f.nome, f.valor])).toEqual([
            ["Outros", 9],
            ["b@x.com", 5],
            ["Ana", 1],
        ])
    })
})

describe("maioresLancamentos e descricoesRepetidas", () => {
    const estorno = tx({ amount: 999, type: "income", payment_method: "credit_card", payment_credit_card_id: "c1" })
    it("maiores não traz estorno", () => {
        const r = maioresLancamentos([tx({ amount: 5 }), estorno, tx({ amount: 8 })], "expense", 5)
        expect(r.map((t) => t.amount)).toEqual([8, 5])
    })
    it("junta grafias e descarta único", () => {
        const r = descricoesRepetidas(
            [tx({ description: "iFood ", amount: 10 }), tx({ description: "ifood", amount: 5 }), tx({ description: "Uber" })],
            "expense",
        )
        expect(r).toEqual([{ descricao: "iFood", vezes: 2, total: 15 }])
    })
})
