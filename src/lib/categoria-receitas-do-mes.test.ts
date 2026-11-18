import { describe, expect, it } from "vitest"
import { assinatura, tx } from "@/lib/previsao/dados-de-teste"
import { receitasDoMesPorCategoria } from "./categoria-receitas-do-mes"

const base = { yearMonth: "2026-11", hojeYmd: "2026-11-18", transactions: [], subscriptions: [] }
const salario = assinatura({
    id: "s1",
    kind: "income",
    category_id: "sal",
    amount: 3000,
    day_of_month: 28,
    next_billing_date: "2026-11-28",
})

describe("receitasDoMesPorCategoria", () => {
    it("soma o lançado até hoje como recebido", () => {
        const transactions = [tx("income", 1000, "2026-11-05", { category_id: "sal" })]
        expect(receitasDoMesPorCategoria({ ...base, transactions })).toEqual({ sal: { recebido: 1000, previsto: 0 } })
    })

    it("receita com data futura no mês é prevista", () => {
        const transactions = [tx("income", 200, "2026-11-25", { category_id: "sal" })]
        expect(receitasDoMesPorCategoria({ ...base, transactions })).toEqual({ sal: { recebido: 0, previsto: 200 } })
    })

    it("ignora despesa, outro mês, sem categoria e cartão de crédito", () => {
        const transactions = [
            tx("expense", 50, "2026-11-05", { category_id: "sal" }),
            tx("income", 80, "2026-10-30", { category_id: "sal" }),
            tx("income", 90, "2026-11-05", { category_id: null }),
            tx("income", 70, "2026-11-05", { category_id: "sal", payment_method: "credit_card" }),
        ]
        expect(receitasDoMesPorCategoria({ ...base, transactions })).toEqual({})
    })

    it("assinatura de receita ainda não lançada é prevista", () => {
        expect(receitasDoMesPorCategoria({ ...base, subscriptions: [salario] }).sal.previsto).toBe(3000)
    })

    it("assinatura já lançada no dia não conta de novo", () => {
        const transactions = [tx("income", 3000, "2026-11-28", { category_id: "sal", subscription_id: "s1" })]
        expect(receitasDoMesPorCategoria({ ...base, transactions, subscriptions: [salario] }).sal.previsto).toBe(3000)
    })

    it("ignora assinatura de despesa e inativa", () => {
        const subscriptions = [{ ...salario, kind: "expense" as const }, { ...salario, id: "s2", is_active: false }]
        expect(receitasDoMesPorCategoria({ ...base, subscriptions })).toEqual({})
    })

    it("mês passado: nada previsto por assinatura", () => {
        const r = receitasDoMesPorCategoria({ ...base, yearMonth: "2026-10", subscriptions: [salario] })
        expect(r.sal?.previsto ?? 0).toBe(0)
    })
})
