import { describe, expect, it } from "vitest"
import { currencyBRL } from "@/lib/formatters"
import { lerFonte, semComentarios } from "@/test/fonte"
import { statementTotalKey } from "@/lib/fatura/total-com-banco"
import { assinatura, cartao, dados, noCartao, plano, totalDoBanco } from "./dados-de-teste"
import { impactoDaParcela, impactoDoPlano, mesCurto, type PlanoProposto } from "./impacto-parcela"

const HOJE = "2026-10-24"
// Fecha dia 5 e vence dia 15: a parcela de 10/11 cai na fatura que fecha em 05/12.
const c1 = cartao("c1", 5, 15)
const dezParcelas: PlanoProposto = {
    valorParcela: 300,
    parcelas: 10,
    primeiraYmd: "2026-11-10",
    cardId: "c1",
    descricao: "Geladeira",
}

describe("impactoDaParcela", () => {
    it("a parcela e o fim: 10x de R$ 300 a partir de nov/2026 vai até ago/2027", () => {
        const i = impactoDaParcela(dezParcelas, dados({ hojeYmd: HOJE, cartoes: [c1] }))
        expect(i.parcelaEFim).toBe(`${currencyBRL(300)} até ago/2027`)
        expect(mesCurto("2027-06")).toBe("jun/2027")
    })

    it("o pico: a maior soma mensal de parcelas, sem e com a compra", () => {
        const d = dados({
            hojeYmd: HOJE,
            cartoes: [c1],
            planos: [
                plano({ id: "tv", total_installments: 5, installment_amount: 200, final_installment_amount: 200, next_billing_date: "2026-11-01" }),
            ],
        })
        expect(impactoDaParcela(dezParcelas, d).pico).toEqual({ semEsta: 200, comEsta: 500, mes: "2026-11" })
    })

    it("as 3 faturas a partir da que recebe a 1ª parcela, antes e depois", () => {
        const d = dados({
            hojeYmd: HOJE,
            cartoes: [c1],
            transacoes: [noCartao("expense", 100, "2026-11-20", "c1")],
        })
        expect(impactoDaParcela(dezParcelas, d).proximasFaturas).toEqual([
            { closeYmd: "2026-12-05", antes: 100, depois: 400 },
            { closeYmd: "2027-01-05", antes: 0, depois: 300 },
            { closeYmd: "2027-02-05", antes: 0, depois: 300 },
        ])
    })

    it("o % da renda: R$ 300 de parcelas sobre um salário de R$ 5.000 é 6", () => {
        const d = dados({
            hojeYmd: HOJE,
            cartoes: [c1],
            assinaturas: [assinatura({ id: "salario", kind: "income", amount: 5000 })],
        })
        expect(impactoDaParcela(dezParcelas, d).percentualDaRenda).toBe(6)
        expect(impactoDaParcela(dezParcelas, dados({ hojeYmd: HOJE, cartoes: [c1] })).percentualDaRenda).toBeNull()
    })

    it("o primeiro mês negativo passa a ser o do vencimento da 1ª fatura com a parcela (fecha 05/12, vence 15/01)", () => {
        const i = impactoDaParcela(dezParcelas, dados({ hojeYmd: HOJE, cartoes: [c1] }))
        expect(i.primeiroMesNegativo).toEqual({ antes: null, depois: "2027-01" })
    })

    it("o limite: R$ 2.000 com R$ 500 usados deixa R$ 1.500, e uma compra de R$ 3.000 não cabe", () => {
        const d = dados({
            hojeYmd: HOJE,
            cartoes: [{ ...c1, credit_limit: 2000 }],
            transacoes: [noCartao("expense", 500, "2026-10-20", "c1")],
        })
        expect(impactoDaParcela(dezParcelas, d).limite).toEqual({ disponivel: 1500, cabe: false, motivo: null })
    })

    it("o limite desconta as parcelas futuras de outro plano no cartão", () => {
        const d = dados({
            hojeYmd: HOJE,
            cartoes: [{ ...c1, credit_limit: 5000 }],
            planos: [
                plano({ id: "tv", payment_method: "credit_card", payment_credit_card_id: "c1", total_installments: 6, installment_amount: 100, final_installment_amount: 100, next_billing_date: "2026-11-01" }),
            ],
        })
        expect(impactoDaParcela(dezParcelas, d).limite).toEqual({ disponivel: 4400, cabe: true, motivo: null })
    })

    describe("o limite como o banco calcula", () => {
        // Fecha dia 15 e vence dia 5: em 24/10 a fatura de 15/10 está fechada e ainda não venceu.
        const c2 = { ...cartao("c2", 15, 5), credit_limit: 2000 }
        const noC2: PlanoProposto = { ...dezParcelas, cardId: "c2" }
        const fechada400 = noCartao("expense", 400, "2026-10-10", "c2")

        it("a fechada não paga de R$ 400, entre o fechamento e o vencimento, é descontada", () => {
            const d = dados({ hojeYmd: HOJE, cartoes: [c2], transacoes: [fechada400] })
            expect(impactoDaParcela(noC2, d).limite.disponivel).toBe(1600)
        })

        it("a mesma fatura paga não é descontada", () => {
            const d = dados({
                hojeYmd: HOJE,
                cartoes: [c2],
                transacoes: [fechada400],
                faturasPagas: new Set([statementTotalKey("c2", "2026-10-15")]),
            })
            expect(impactoDaParcela(noC2, d).limite.disponivel).toBe(2000)
        })

        it("a fechada com o total do banco vale o do banco", () => {
            const d = dados({
                hojeYmd: HOJE,
                cartoes: [c2],
                transacoes: [fechada400],
                totaisDoBanco: [totalDoBanco("c2", "2026-10-15", 450)],
            })
            expect(impactoDaParcela(noC2, d).limite.disponivel).toBe(1550)
        })

        it("a assinatura de R$ 50 projetada na aberta não ocupa limite", () => {
            const d = dados({
                hojeYmd: HOJE,
                cartoes: [c2],
                assinaturas: [
                    assinatura({ id: "streaming", amount: 50, payment_method: "credit_card", payment_credit_card_id: "c2", next_billing_date: "2026-11-01" }),
                ],
            })
            expect(impactoDaParcela(noC2, d).limite.disponivel).toBe(2000)
        })

        it("um 10x com 7 parcelas por lançar desconta as 7", () => {
            const d = dados({
                hojeYmd: HOJE,
                cartoes: [c2],
                planos: [
                    plano({ id: "sofa", payment_method: "credit_card", payment_credit_card_id: "c2", total_installments: 10, generated_count: 3, installment_amount: 100, final_installment_amount: 100, next_billing_date: "2026-11-01" }),
                ],
            })
            expect(impactoDaParcela(noC2, d).limite.disponivel).toBe(1300)
        })
    })

    it("sem cartão (Pix): nem faturas nem limite", () => {
        const i = impactoDaParcela({ ...dezParcelas, cardId: null }, dados({ hojeYmd: HOJE, cartoes: [c1] }))
        expect(i.proximasFaturas).toBeNull()
        expect(i.limite).toEqual({ disponivel: null, cabe: null, motivo: "sem_cartao" })
        expect(i.primeiroMesNegativo).toEqual({ antes: null, depois: "2026-11" })
    })

    it("o cartão sem limite cadastrado diz sem_limite, não 'não cabe'", () => {
        const i = impactoDaParcela(dezParcelas, dados({ hojeYmd: HOJE, cartoes: [c1] }))
        expect(i.limite).toEqual({ disponivel: null, cabe: null, motivo: "sem_limite" })
        expect(i.proximasFaturas).toHaveLength(3)
    })

    it("a última parcela com a sobra dos centavos entra no fim", () => {
        const i = impactoDaParcela({ ...dezParcelas, cardId: null, parcelas: 3, valorParcela: 33.33, ultimaParcela: 33.34 }, dados({ hojeYmd: HOJE }))
        expect(i.parcelaEFim).toBe(`${currencyBRL(33.33)} até jan/2027`)
        expect(i.pico.comEsta).toBe(33.34)
    })
})

describe("impactoDoPlano — o detalhe de um parcelado que já existe", () => {
    it("o antes é a carteira sem o plano e sem as parcelas dele; o depois, como está", () => {
        const geladeira = plano({
            id: "geladeira",
            payment_method: "credit_card",
            payment_credit_card_id: "c1",
            total_installments: 10,
            generated_count: 1,
            installment_amount: 300,
            final_installment_amount: 300,
            next_billing_date: "2026-11-10",
            billing_anchor_day: 10,
        })
        const d = dados({
            hojeYmd: HOJE,
            cartoes: [c1],
            planos: [geladeira],
            transacoes: [
                noCartao("expense", 300, "2026-10-10", "c1", { installment_plan_id: "geladeira", installment_sequence: 1 }),
            ],
        })
        const i = impactoDoPlano(geladeira, d)
        expect(i.parcelaEFim).toBe(`${currencyBRL(300)} até jul/2027`)
        expect(i.pico).toEqual({ semEsta: 0, comEsta: 300, mes: "2026-10" })
        expect(i.proximasFaturas?.[0]).toEqual({ closeYmd: "2026-11-05", antes: 0, depois: 300 })
    })
})

describe("onde o quadro aparece", () => {
    it.each([
        ["src/components/transactions/transaction-form-fields.tsx", "<ImpactoDaParcela proposto={planoProposto} />"],
        ["src/components/wireframe/frase-rapida-wireframe.tsx", "<ImpactoDaParcela proposto={proposto} />"],
        ["src/components/transactions/transaction-detail-sheet.tsx", "<ImpactoDaParcela planoId={t.installment_plan_id} />"],
    ])("%s monta o quadro", (arquivo, jsx) => {
        expect(semComentarios(lerFonte(arquivo), "tudo")).toContain(jsx)
    })
})
