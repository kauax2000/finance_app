import { describe, expect, it } from "vitest"

import {
    chaveDoGrupo,
    composicaoDoMes,
    fraseDaComposicao,
    quemGastou,
    type ComposicaoDoMes,
} from "@/lib/composicao-do-mes"
import type { CreditCardClosingLookup } from "@/lib/expense-month-attribution"
import type { Transaction, WorkspaceInstallmentPlan, WorkspaceSubscription } from "@/lib/supabase"

const lookup: CreditCardClosingLookup = new Map([["cc", 5]])
let seq = 0
function tx(p: Partial<Transaction> & { date: string; amount: number }): Transaction {
    return {
        id: `t${++seq}`,
        user_id: "u1",
        category_id: "cat",
        type: "expense",
        description: "Compra",
        is_recurring: false,
        recurring_interval: null,
        payment_method: "pix",
        source: "app",
        needs_review: false,
        import_batch_id: null,
        created_at: p.date,
        updated_at: p.date,
        ...p,
    }
}
function plano(p: Partial<WorkspaceInstallmentPlan> & { id: string }): WorkspaceInstallmentPlan {
    return {
        workspace_id: "w",
        user_id: "u1",
        category_id: "cat",
        description: null,
        payment_method: "pix",
        payment_credit_card_id: null,
        total_installments: 6,
        generated_count: 3,
        installment_amount: 100,
        final_installment_amount: 100,
        next_billing_date: "2026-12-10",
        is_active: true,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
        ...p,
    }
}

const base = {
    tipo: "expense" as const,
    yearMonth: "2026-11",
    lookup,
    parcelas: [] as WorkspaceInstallmentPlan[],
    assinaturas: [] as WorkspaceSubscription[],
    categoryId: "cat",
    criadaEm: "2026-08-15T12:00:00Z",
}
const texto = (partes: { texto: string }[]) => partes.map((p) => p.texto).join("").replace(/\s/g, " ")

describe("chaveDoGrupo", () => {
    it("tira o sufixo de parcela, o acento e fica com a primeira palavra", () => {
        expect(chaveDoGrupo("Estacionamento Shopping (2/3)")).toBe("estacionamento")
        expect(chaveDoGrupo("Consórcio Mãe - 3/6")).toBe("consorcio")
        expect(chaveDoGrupo("  Posto 123 ")).toBe("posto")
        expect(chaveDoGrupo("")).toBe("")
    })
})

describe("composicaoDoMes", () => {
    // A Carro: o Consórcio começou em setembro (3/6 em novembro), o Seguro é antigo (10/12).
    const carroParcelas = [
        plano({ id: "consorcio", description: "Consórcio Mãe", total_installments: 6, installment_amount: 2000, final_installment_amount: 2000 }),
        plano({ id: "seguro", description: "Seguro", total_installments: 12, installment_amount: 442.54, final_installment_amount: 442.54 }),
    ]
    const carroMes = [
        tx({ date: "2026-11-10", amount: 2000, description: "Consórcio Mãe - 3/6", installment_plan_id: "consorcio", installment_sequence: 3 }),
        tx({ date: "2026-11-05", amount: 442.54, description: "Seguro (10/12)", installment_plan_id: "seguro", installment_sequence: 10 }),
        tx({ date: "2026-11-03", amount: 300, description: "Posto Shell" }),
        tx({ date: "2026-11-12", amount: 200, description: "Posto Ipiranga" }),
        tx({ date: "2026-11-15", amount: 120, description: "Estacionamento" }),
    ]
    const carroHistorico = [
        ...["2026-09", "2026-10"].flatMap((ym) => [
            tx({ date: `${ym}-05`, amount: 442.54, installment_plan_id: "seguro" }),
            tx({ date: `${ym}-08`, amount: 400, description: "Posto Shell" }),
            tx({ date: `${ym}-09`, amount: 100, description: "Estacionamento" }),
        ]),
        ...carroMes,
    ]

    it("a Carro: o Consórcio novo puxa o mês para cima", () => {
        const c = composicaoDoMes({ ...base, txsDoMes: carroMes, historico: carroHistorico, parcelas: carroParcelas, media: 2907 })
        expect(c.fixo.total).toBe(2442.54)
        expect(c.variavel.total).toBe(620)
        expect(c.caso).toBe("novo")
        expect(c.direcao).toBe("acima")
        expect(c.destaque).toEqual({ nome: "Consórcio Mãe", desdeYm: "2026-09" })
        expect(c.fixo.itens[0]).toMatchObject({ id: "consorcio", tipo: "parcela", valor: 2000, atual: 3, total: 6, diaYmd: "2026-11-10", novoDesdeYm: "2026-09" })
        expect(c.fixo.itens[1].novoDesdeYm).toBeUndefined()
        expect(c.fixo.ultimaTerminaYm).toBe("2027-02")
        expect(c.fixo.proximoMes).toBe(2442.54)
        expect(c.normais).toEqual({ fixo: 442.54, variavel: 500 })
        expect(c.variavel.grupos.map((g) => [g.chave, g.nome, g.vezes, g.valor, g.normal])).toEqual([
            ["posto", "Posto Shell", 2, 500, 400],
            ["estacionamento", "Estacionamento", 1, 120, 100],
        ])
        expect(texto(fraseDaComposicao(c, true))).toBe("O mês está 5% acima da média por causa de Consórcio Mãe, que começou em setembro.")
    })

    it("sem fixo: o caso vem do variável", () => {
        const mes = carroMes.slice(2)
        const c = composicaoDoMes({ ...base, txsDoMes: mes, historico: carroHistorico.filter((t) => !t.installment_plan_id), media: 500 })
        expect(c.fixo.total).toBe(0)
        expect(c.fixo.itens).toEqual([])
        expect(c.caso).toBe("variavelPuxou")
        expect(c.destaque).toMatchObject({ nome: "Posto Shell", aMais: 100 })
        const partes = fraseDaComposicao(c, true)
        expect(texto(partes)).toBe("O mês está 24% acima da média: Posto Shell subiu 25% (R$ 100 a mais que o normal).")
        expect(partes.find((p) => p.texto === "24% acima")?.tom).toBe("warning")
    })

    it("um grupo só deste mês é novo, sem variação", () => {
        const c = composicaoDoMes({ ...base, txsDoMes: [tx({ date: "2026-11-02", amount: 80, description: "Lava Rápido" })], historico: [], media: null })
        expect(c.variavel.grupos[0]).toMatchObject({ chave: "lava", novo: true, variacao: null, normal: null })
    })

    it("o estorno abate o grupo", () => {
        const mes = [
            tx({ date: "2026-11-02", amount: 300, description: "Posto", payment_method: "credit_card", payment_credit_card_id: "cc" }),
            tx({ date: "2026-11-03", amount: 100, description: "Posto", type: "income", payment_method: "credit_card", payment_credit_card_id: "cc" }),
        ]
        const c = composicaoDoMes({ ...base, txsDoMes: mes, historico: [], media: null })
        expect(c.variavel.total).toBe(200)
        expect(c.variavel.grupos).toEqual([expect.objectContaining({ chave: "posto", vezes: 1, valor: 200 })])
    })

    it("sem média: o caso é semMedia, sem porcentagem", () => {
        const c = composicaoDoMes({ ...base, txsDoMes: carroMes, historico: carroMes, parcelas: carroParcelas, media: null, criadaEm: "2026-10-15" })
        expect(c.caso).toBe("semMedia")
        expect(c.variacaoTotal).toBeNull()
        expect(c.normais).toEqual({ fixo: null, variavel: null })
        expect(texto(fraseDaComposicao(c, true))).toBe("R$ 2.443 fixos e R$ 620 do dia a dia neste mês.")
    })

    it("dentro de ±2%: o caso é normal", () => {
        const c = composicaoDoMes({ ...base, txsDoMes: carroMes, historico: carroHistorico, parcelas: carroParcelas, media: 3050 })
        expect(c.caso).toBe("normal")
        expect(c.direcao).toBeNull()
        expect(texto(fraseDaComposicao(c, true))).toBe("O mês está dentro do seu normal. R$ 2.443 dele já eram parcelas.")
    })

    it("o fixo puxou: o variável fica abaixo do normal", () => {
        // O Seguro sobe para 1.000 sem plano novo; o variável cai de 500 para 450.
        const mes = [
            tx({ date: "2026-11-05", amount: 1000, installment_plan_id: "seguro", installment_sequence: 10 }),
            tx({ date: "2026-11-03", amount: 450, description: "Posto" }),
        ]
        const hist = [...carroHistorico.filter((t) => t.date < "2026-11"), ...mes]
        const c = composicaoDoMes({ ...base, txsDoMes: mes, historico: hist, parcelas: carroParcelas, media: 942.54 })
        expect(c.caso).toBe("fixoPuxou")
        expect(c.direcao).toBe("acima")
        const partes = fraseDaComposicao(c, true)
        expect(texto(partes)).toBe(
            "O mês está 54% acima da média só por causa das parcelas. O que você controla, R$ 450, está 10% abaixo do seu normal.",
        )
        expect(partes.find((p) => p.texto === "10% abaixo")?.tom).toBe("success")
    })

    it("abaixo da média: o grupo que mais caiu, mesmo sumido", () => {
        const mes = [tx({ date: "2026-11-03", amount: 400, description: "Posto Shell" })]
        const c = composicaoDoMes({ ...base, txsDoMes: mes, historico: [...carroHistorico.filter((t) => t.date < "2026-11" && !t.installment_plan_id), ...mes], media: 500 })
        expect(c.caso).toBe("variavelPuxou")
        expect(c.direcao).toBe("abaixo")
        expect(c.destaque).toMatchObject({ nome: "Estacionamento", aMais: -100, variacao: -1 })
        const partes = fraseDaComposicao(c, true)
        expect(texto(partes)).toBe("O mês está 20% abaixo da média: Estacionamento caiu 100% (R$ 100 a menos que o normal).")
        expect(partes.find((p) => p.texto === "20% abaixo")?.tom).toBe("success")
        // Na receita, entrar menos é ruim.
        expect(fraseDaComposicao(c, false).find((p) => p.texto === "20% abaixo")?.tom).toBe("warning")
    })
})

describe("fraseDaComposicao", () => {
    const vazia: ComposicaoDoMes = {
        fixo: { total: 0, itens: [], proximoMes: 0 },
        variavel: { total: 300, grupos: [], outros: null },
        normais: { fixo: null, variavel: null },
        caso: "normal",
        direcao: null,
        variacaoTotal: 0.01,
    }
    it("normal sem fixo não fala de parcela", () => {
        expect(texto(fraseDaComposicao(vazia, true))).toBe("O mês está dentro do seu normal.")
    })
    it("um grupo novo puxando o mês", () => {
        const c: ComposicaoDoMes = { ...vazia, caso: "variavelPuxou", direcao: "acima", variacaoTotal: 0.3, destaque: { nome: "Lava Rápido", aMais: 80 } }
        expect(texto(fraseDaComposicao(c, true))).toBe("O mês está 30% acima da média: Lava Rápido é novo neste mês (R$ 80).")
    })
})

describe("quemGastou", () => {
    it("soma por pessoa, com o estorno abatendo, do maior para o menor", () => {
        const r = quemGastou(
            [
                tx({ date: "2026-11-02", amount: 100, user_id: "ana" }),
                tx({ date: "2026-11-02", amount: 300, user_id: "bia", payment_method: "credit_card", payment_credit_card_id: "cc" }),
                tx({ date: "2026-11-03", amount: 250, user_id: "bia", type: "income", payment_method: "credit_card", payment_credit_card_id: "cc" }),
                tx({ date: "2026-11-04", amount: 20, user_id: "ana" }),
            ],
            "expense",
        )
        expect(r).toEqual([
            { userId: "ana", valor: 120 },
            { userId: "bia", valor: 50 },
        ])
    })
})
