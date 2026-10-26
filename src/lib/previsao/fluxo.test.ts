import { describe, expect, it } from "vitest"
import { statementTotalKey } from "@/lib/fatura/total-com-banco"
import { fluxoDoMes, projecaoMensal, seguroParaGastar } from "./fluxo"
import { assinatura, cartao, conta, dados, noCartao, pendente, plano, tx } from "./dados-de-teste"

describe("fluxoDoMes — a tabela de casos da spec §10", () => {
    it("1. sem renda recorrente: entra só o que já entrou; o estorno no cartão não é receita", () => {
        const d = dados({
            hojeYmd: "2026-11-10",
            transacoes: [
                tx("income", 3000, "2026-11-05"),
                tx("expense", 500, "2026-11-08"),
                tx("expense", 200, "2026-11-20"),
                noCartao("income", 50, "2026-11-06", "c"),
                tx("income", 999, "2026-10-31"),
            ],
        })
        expect(fluxoDoMes(d, "2026-11")).toEqual({
            ym: "2026-11",
            receitas: { recebidas: 3000, previstas: 0 },
            despesas: { pagas: 500, previstas: 200 },
            faturas: [],
            contasSemValor: [],
            entra: 3000,
            sai: 700,
            sobra: 2300,
        })
    })

    it("2. com o salário recorrente dia 5: previsto antes, recebido depois de lançado", () => {
        const salario = assinatura({
            id: "salario",
            kind: "income",
            amount: 5000,
            next_billing_date: "2026-11-05",
            start_date: "2026-01-05",
        })
        const academia = assinatura({ id: "academia", amount: 100, next_billing_date: "2026-11-15" })
        const antes = dados({ hojeYmd: "2026-11-03", assinaturas: [salario, academia] })
        expect(fluxoDoMes(antes, "2026-11")).toMatchObject({
            receitas: { recebidas: 0, previstas: 5000 },
            despesas: { pagas: 0, previstas: 100 },
            entra: 5000,
            sobra: 4900,
        })

        // O cron lançou o salário em 05/11 e ainda não avançou a próxima cobrança.
        const depois = dados({
            hojeYmd: "2026-11-06",
            assinaturas: [salario, academia],
            transacoes: [tx("income", 5000, "2026-11-05", { subscription_id: "salario" })],
        })
        expect(fluxoDoMes(depois, "2026-11").receitas).toEqual({ recebidas: 5000, previstas: 0 })
        expect(fluxoDoMes(depois, "2026-12").receitas).toEqual({ recebidas: 0, previstas: 5000 })
    })

    it("4. a fatura que vence no último dia (due_day 31 em novembro) entra no mês; a seguinte não", () => {
        // Fecha 31 e vence 31: o vencimento grampeado não cabe depois do
        // fechamento no mesmo mês, então vai ao último dia do mês seguinte.
        const c = cartao("c", 31, 31)
        const d = dados({
            hojeYmd: "2026-11-10",
            cartoes: [c],
            transacoes: [noCartao("expense", 400, "2026-10-15", "c"), noCartao("expense", 150, "2026-11-05", "c")],
        })
        const nov = seguroParaGastar(d)
        expect(nov.faturas).toEqual([
            {
                cardId: "c",
                nome: "Cartão c",
                closeYmd: "2026-10-31",
                dueYmd: "2026-11-30",
                total: 400,
                paga: false,
                usaTotalDoBanco: false,
            },
        ])
        expect(nov.sai).toBe(400)
        // A compra de 05/11 está na fatura aberta, que vence em 31/12.
        expect(nov.comprometidoNaProximaFatura).toBe(150)
        expect(fluxoDoMes(d, "2026-12").faturas.map((f) => [f.dueYmd, f.total])).toEqual([["2026-12-31", 150]])
    })

    it("8. a conta vencida no mês anterior entra; a sem valor vai a contasSemValor", () => {
        const aluguel = conta({ id: "aluguel", name: "Aluguel", due_day_of_month: 5, amount_estimated: 1500 })
        const agua = conta({ id: "agua", name: "Água", due_day_of_month: 15, amount_estimated: null })
        const d = dados({
            hojeYmd: "2026-11-10",
            contas: [aluguel, agua],
            contasPendentes: [pendente("aluguel", "2026-10-05"), pendente("agua", "2026-11-15")],
        })
        // Outubro vencido (1500) + a ocorrência de 05/11 projetada (1500) + a água (0).
        expect(fluxoDoMes(d, "2026-11")).toMatchObject({
            despesas: { pagas: 0, previstas: 3000 },
            contasSemValor: ["Água"],
            sai: 3000,
        })
        // Dezembro: só 05/12; o vencido de outubro não volta.
        expect(fluxoDoMes(d, "2026-12")).toMatchObject({
            despesas: { pagas: 0, previstas: 1500 },
            contasSemValor: ["Água"],
        })
    })

    it("8b. o valor da própria ocorrência pendente vence o estimado da conta", () => {
        const luz = conta({ id: "luz", due_day_of_month: 12, amount_estimated: 200 })
        const d = dados({ hojeYmd: "2026-11-10", contas: [luz], contasPendentes: [pendente("luz", "2026-11-12", 210)] })
        expect(fluxoDoMes(d, "2026-11").despesas.previstas).toBe(210)
    })

    it("9. a fatura paga continua no caixa do mês do vencimento, marcada paga", () => {
        const c = cartao("c", 10, 20)
        const d = dados({
            hojeYmd: "2026-11-25",
            cartoes: [c],
            transacoes: [noCartao("expense", 300, "2026-11-01", "c")],
            faturasPagas: new Set([statementTotalKey("c", "2026-11-10")]),
        })
        const nov = fluxoDoMes(d, "2026-11")
        expect(nov.faturas).toMatchObject([{ closeYmd: "2026-11-10", dueYmd: "2026-11-20", total: 300, paga: true }])
        expect(nov.sai).toBe(300)
    })
})

describe("seguroParaGastar", () => {
    it("3. meses de 28, 30 e 31 dias: diasRestantes conta hoje", () => {
        const fev = seguroParaGastar(dados({ hojeYmd: "2027-02-10", transacoes: [tx("income", 2800, "2027-02-01")] }))
        expect(fev).toMatchObject({ seguro: 2800, diasRestantes: 19, porDia: 147.37 })

        const nov = seguroParaGastar(dados({ hojeYmd: "2026-11-30", transacoes: [tx("income", 300, "2026-11-01")] }))
        expect(nov).toMatchObject({ diasRestantes: 1, porDia: 300 })

        const dez = seguroParaGastar(dados({ hojeYmd: "2026-12-01", transacoes: [tx("income", 3100, "2026-12-01")] }))
        expect(dez).toMatchObject({ diasRestantes: 31, porDia: 100 })

        const d = dados({ hojeYmd: "2026-11-10", transacoes: [tx("income", 2800, "2027-02-01")] })
        expect(seguroParaGastar(d, "2027-02")).toMatchObject({ diasRestantes: 28, porDia: 100 })
        expect(seguroParaGastar(d, "2026-10")).toMatchObject({ diasRestantes: 0, porDia: 0 })
    })

    it("11. a reserva abate o seguro, e o porDia é 0 com o seguro negativo", () => {
        const transacoes = [tx("income", 3000, "2026-11-01"), tx("expense", 500, "2026-11-02")]
        expect(seguroParaGastar(dados({ hojeYmd: "2026-11-10", transacoes, reserva: 1000 }))).toMatchObject({
            sobra: 2500,
            reserva: 1000,
            seguro: 1500,
            diasRestantes: 21,
            porDia: 71.43,
        })
        expect(seguroParaGastar(dados({ hojeYmd: "2026-11-10", transacoes, reserva: 3000 }))).toMatchObject({
            seguro: -500,
            porDia: 0,
        })
    })

    it("soma em centavos: 0,10 + 0,20 dá 0,30", () => {
        const d = dados({ hojeYmd: "2026-11-10", transacoes: [tx("income", 0.1, "2026-11-01"), tx("income", 0.2, "2026-11-02")] })
        expect(seguroParaGastar(d).entra).toBe(0.3)
    })
})

describe("projecaoMensal", () => {
    it("10. o plano que termina no 3º mês aparece em fimDeParcelamentos, e o primeiro mês negativo é o certo", () => {
        // Fecha 10 e vence 5: o vencimento cai no mês seguinte ao fechamento.
        const c = cartao("c", 10, 5)
        const d = dados({
            hojeYmd: "2026-11-10",
            cartoes: [c],
            assinaturas: [
                assinatura({ id: "salario", kind: "income", amount: 5000, next_billing_date: "2026-12-05" }),
            ],
            transacoes: [tx("income", 5000, "2026-11-05", { subscription_id: "salario" })],
            planos: [
                // Pix, 4x 400: a 1ª já lançada; faltam 20/11, 20/12 e 20/01.
                plano({
                    id: "curso",
                    description: "Curso",
                    total_installments: 4,
                    generated_count: 1,
                    installment_amount: 400,
                    final_installment_amount: 400,
                    next_billing_date: "2026-11-20",
                }),
                // Cartão, 2x 6000 em 15/11 e 15/12: vencem em 05/01 e 05/02.
                plano({
                    id: "tv",
                    description: "TV",
                    payment_method: "credit_card",
                    payment_credit_card_id: "c",
                    total_installments: 2,
                    installment_amount: 6000,
                    final_installment_amount: 6000,
                    next_billing_date: "2026-11-15",
                }),
            ],
        })
        const p = projecaoMensal(d)
        expect(p.meses.map((m) => [m.ym, m.sobra])).toEqual([
            ["2026-11", 4600],
            ["2026-12", 4600],
            ["2027-01", -1400],
            ["2027-02", -1000],
            ["2027-03", 5000],
            ["2027-04", 5000],
        ])
        // A TV no cartão termina no caixa em fevereiro (a fatura de 10/01 vence em 05/02), não em
        // dezembro, o mês da última compra.
        expect(p.meses.map((m) => m.fimDeParcelamentos)).toEqual([
            [],
            [],
            [{ planoId: "curso", descricao: "Curso" }],
            [{ planoId: "tv", descricao: "TV" }],
            [],
            [],
        ])
        expect(p.primeiroMesNegativo).toBe("2027-01")
        expect(projecaoMensal(d, 2).primeiroMesNegativo).toBeNull()
    })

    it("10b. a parcela no cartão antes do fechamento termina no caixa um mês depois da compra", () => {
        const d = dados({
            hojeYmd: "2026-11-01",
            cartoes: [cartao("c", 25, 5)],
            planos: [
                plano({
                    id: "fone",
                    description: "Fone",
                    payment_method: "credit_card",
                    payment_credit_card_id: "c",
                    installment_amount: 100,
                    final_installment_amount: 100,
                    next_billing_date: "2026-11-05",
                }),
            ],
        })
        // Compra em 05/11, fecha em 25/11, vence em 05/12.
        expect(projecaoMensal(d, 2).meses.map((m) => m.fimDeParcelamentos)).toEqual([
            [],
            [{ planoId: "fone", descricao: "Fone" }],
        ])
    })
})

describe("fluxoDoMes — bordas", () => {
    it("a assinatura no cartão fica fora das despesas e entra na fatura", () => {
        const d = dados({
            hojeYmd: "2026-11-01",
            cartoes: [cartao("c", 10, 20)],
            assinaturas: [
                assinatura({
                    id: "netflix",
                    amount: 40,
                    payment_method: "credit_card",
                    payment_credit_card_id: "c",
                    next_billing_date: "2026-10-07",
                }),
                assinatura({ id: "academia", amount: 100, next_billing_date: "2026-11-15" }),
            ],
        })
        const nov = fluxoDoMes(d, "2026-11")
        expect(nov.despesas.previstas).toBe(100)
        // A cobrança de 07/11 está na fatura de 10/11, que vence em 20/11.
        expect(nov.faturas.map((f) => [f.closeYmd, f.total])).toEqual([["2026-11-10", 40]])
    })

    it("com o cron atrasado, a cobrança de ontem ainda não lançada entra no mês", () => {
        const d = dados({
            hojeYmd: "2026-11-10",
            assinaturas: [assinatura({ id: "academia", amount: 100, next_billing_date: "2026-11-09" })],
        })
        expect(fluxoDoMes(d, "2026-11").despesas.previstas).toBe(100)
    })

    it("duas pendentes da mesma conta não duplicam a projeção", () => {
        const aluguel = conta({ id: "aluguel", due_day_of_month: 5, amount_estimated: 1500 })
        const d = dados({
            hojeYmd: "2026-11-01",
            contas: [aluguel],
            contasPendentes: [pendente("aluguel", "2026-11-05"), pendente("aluguel", "2026-12-05")],
        })
        expect(fluxoDoMes(d, "2026-12").despesas.previstas).toBe(1500)
        expect(fluxoDoMes(d, "2027-01").despesas.previstas).toBe(1500)
    })

    it("duas contas sem valor com o mesmo nome são duas linhas", () => {
        const d = dados({
            hojeYmd: "2026-11-01",
            contas: [conta({ id: "a", name: "Seguro" }), conta({ id: "b", name: "Seguro" })],
            contasPendentes: [pendente("a", "2026-11-10"), pendente("b", "2026-11-20")],
        })
        expect(fluxoDoMes(d, "2026-11").contasSemValor).toEqual(["Seguro", "Seguro"])
    })
})
