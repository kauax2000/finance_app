// antes de qualquer Date: a hora local do teste é a de São Paulo
process.env.TZ = "America/Sao_Paulo"

import { describe, expect, it } from "vitest"
import vectors from "@/lib/fixtures/fatura-tendencia-vectors.json"
import { cartao, dados, noCartao, plano, totalDoBanco } from "./dados-de-teste"
import { avaliarTendencia, faturasAcimaDoNormal } from "./fatura-alta"

describe("avaliarTendencia (paridade com o cron)", () => {
    it.each(vectors.tendencia)("$name", (v) => {
        expect(avaliarTendencia(v.aberta, v.fechadas)).toEqual(v.expected)
    })
})

describe("faturasAcimaDoNormal", () => {
    // Fecha 10, vence 20. Hoje 14/11: as fechadas são as de 10/11, 10/10 e 10/09; a aberta fecha em 10/12.
    const c = cartao("c", 10, 20)
    const fechadas = [
        noCartao("expense", 100, "2026-11-01", "c"),
        noCartao("expense", 100, "2026-10-01", "c"),
        noCartao("expense", 100, "2026-09-01", "c"),
    ]
    const aberta = noCartao("expense", 130, "2026-11-12", "c")

    it("3 fechadas de 100 e a aberta em 130: 30% acima do normal", () => {
        const d = dados({ hojeYmd: "2026-11-14", cartoes: [c], transacoes: [...fechadas, aberta] })
        expect(faturasAcimaDoNormal(d)).toEqual([
            {
                cardId: "c",
                nome: "Cartão c",
                closeYmd: "2026-12-10",
                dueYmd: "2026-12-20",
                prevista: 130,
                media: 100,
                percentual: 30,
            },
        ])
    })

    it("com 2 fechadas não avisa (a sem movimento não conta)", () => {
        const d = dados({ hojeYmd: "2026-11-14", cartoes: [c], transacoes: [...fechadas.slice(0, 2), aberta] })
        expect(faturasAcimaDoNormal(d)).toEqual([])
    })

    it("a fechada com o total do banco vale o do banco", () => {
        const d = dados({
            hojeYmd: "2026-11-14",
            cartoes: [c],
            transacoes: [...fechadas, aberta],
            totaisDoBanco: [totalDoBanco("c", "2026-11-10", 200)],
        })
        expect(faturasAcimaDoNormal(d)).toEqual([])
    })

    it("a parcela projetada na janela aberta entra na prevista", () => {
        const d = dados({
            hojeYmd: "2026-11-14",
            cartoes: [c],
            transacoes: [...fechadas],
            planos: [
                plano({
                    id: "p",
                    payment_method: "credit_card",
                    payment_credit_card_id: "c",
                    total_installments: 2,
                    installment_amount: 130,
                    final_installment_amount: 130,
                    next_billing_date: "2026-11-20",
                }),
            ],
        })
        expect(faturasAcimaDoNormal(d)).toMatchObject([{ prevista: 130, percentual: 30 }])
    })

    it("o cartão inativo não entra", () => {
        const d = dados({
            hojeYmd: "2026-11-14",
            cartoes: [{ ...c, is_active: false }],
            transacoes: [...fechadas, aberta],
        })
        expect(faturasAcimaDoNormal(d)).toEqual([])
    })
})
