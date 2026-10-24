import { describe, expect, it } from "vitest"
import { faturaPrevista } from "./fatura-prevista"
import { assinatura, cartao, dados, noCartao, totalDoBanco } from "./dados-de-teste"

// Cartão "c": fecha dia 10, vence dia 20. A fatura de 2026-11 vai de 11/10 a 10/11.
const c = cartao("c", 10, 20)

describe("faturaPrevista", () => {
    it("o fechamento no dia 31 vira o último dia do mês, e o vencimento 31 também", () => {
        const fim = cartao("fim", 31, 31)
        const d = dados({ hojeYmd: "2026-11-10" })
        expect(faturaPrevista(fim, "2026-11", d)).toMatchObject({
            closeYmd: "2026-11-30",
            dueYmd: "2026-12-31",
        })
        expect(faturaPrevista(fim, "2027-02", d)).toMatchObject({
            closeYmd: "2027-02-28",
            dueYmd: "2027-03-31",
        })
        expect(faturaPrevista(cartao("x", 20, 31), "2027-01", d).dueYmd).toBe("2027-02-28")
    })

    it("o estorno de R$ 50 abate a fatura prevista", () => {
        const d = dados({
            hojeYmd: "2026-11-05",
            cartoes: [c],
            transacoes: [
                noCartao("expense", 300, "2026-11-01", "c"),
                noCartao("income", 50, "2026-11-03", "c"),
            ],
        })
        expect(faturaPrevista(c, "2026-11", d)).toEqual({
            total: 250,
            closeYmd: "2026-11-10",
            dueYmd: "2026-12-20",
            usaTotalDoBanco: false,
            status: "open",
        })
    })

    it("a fatura fechada entra pelo total do banco; a aberta o ignora", () => {
        const d = dados({
            hojeYmd: "2026-11-15",
            cartoes: [c],
            transacoes: [
                noCartao("expense", 300, "2026-10-01", "c"),
                noCartao("expense", 100, "2026-11-12", "c"),
            ],
            totaisDoBanco: [totalDoBanco("c", "2026-10-10", 320), totalDoBanco("c", "2026-12-10", 999)],
        })
        expect(faturaPrevista(c, "2026-10", d)).toMatchObject({
            total: 320,
            usaTotalDoBanco: true,
            status: "closed",
        })
        expect(faturaPrevista(c, "2026-12", d)).toMatchObject({
            total: 100,
            usaTotalDoBanco: false,
            status: "open",
        })
    })

    it("a assinatura no cartão entra projetada na fatura, e não duplica quando já foi lançada", () => {
        const netflix = assinatura({
            id: "netflix",
            amount: 40,
            payment_method: "credit_card",
            payment_credit_card_id: "c",
            next_billing_date: "2026-11-07",
            start_date: "2026-01-07",
        })
        // Uma receita recorrente e uma assinatura de outro cartão não entram.
        const salario = assinatura({ id: "salario", kind: "income", amount: 5000, next_billing_date: "2026-11-05" })
        const outra = assinatura({
            id: "outra",
            amount: 99,
            payment_method: "credit_card",
            payment_credit_card_id: "z",
            next_billing_date: "2026-11-01",
        })
        const compra = noCartao("expense", 100, "2026-11-01", "c")
        const assinaturas = [netflix, salario, outra]

        const antes = dados({ hojeYmd: "2026-11-05", cartoes: [c], assinaturas, transacoes: [compra] })
        expect(faturaPrevista(c, "2026-11", antes).total).toBe(140)

        const lancada = noCartao("expense", 40, "2026-11-07", "c", { subscription_id: "netflix" })
        const depois = dados({ hojeYmd: "2026-11-08", cartoes: [c], assinaturas, transacoes: [compra, lancada] })
        expect(faturaPrevista(c, "2026-11", depois).total).toBe(140)

        // Antes da próxima cobrança o cron já passou: nada é projetado para trás dela.
        expect(faturaPrevista(c, "2026-10", antes).total).toBe(0)
        // E ela segue para a fatura seguinte (11/11 a 10/12: a de 07/12).
        expect(faturaPrevista(c, "2026-12", antes).total).toBe(40)
    })
})
