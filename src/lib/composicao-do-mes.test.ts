import { describe, expect, it } from "vitest"

import {
    foraDoNormal,
    chaveDoGrupo,
    composicaoDoMes,
    fixoEmLinhas,
    fraseDaComposicao,
    tomDoInsight,
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
        expect(c.variavel.grupos[0].ultimaYmd).toBe("2026-11-12")
        expect(c.puxouOVariavel).toEqual({ nome: "Posto Shell", valor: 500, variacao: 0.25, aMais: 100 })
        expect(texto(fraseDaComposicao(c, true))).toBe(
            "O que você controla subiu 24%: R$ 620, R$ 120 acima do seu normal, puxado por Posto Shell (↑ 25%). As parcelas subiram com Consórcio Mãe, que começou em setembro.",
        )
    })

    it("sem fixo: o caso vem do variável", () => {
        const mes = carroMes.slice(2)
        const c = composicaoDoMes({ ...base, txsDoMes: mes, historico: carroHistorico.filter((t) => !t.installment_plan_id), media: 500 })
        expect(c.fixo.total).toBe(0)
        expect(c.fixo.itens).toEqual([])
        expect(c.caso).toBe("variavelPuxou")
        expect(c.destaque).toMatchObject({ nome: "Posto Shell", aMais: 100 })
        const partes = fraseDaComposicao(c, true)
        expect(texto(partes)).toBe(
            "O que você controla subiu 24%: R$ 620, R$ 120 acima do seu normal, puxado por Posto Shell (↑ 25%).",
        )
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
        // O total está no normal, mas o variável não: a frase começa por ele.
        expect(texto(fraseDaComposicao(c, true))).toBe(
            "O que você controla subiu 24%: R$ 620, R$ 120 acima do seu normal, puxado por Posto Shell (↑ 25%). As parcelas subiram.",
        )
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
            "O que você controla caiu 10%: R$ 450, R$ 50 abaixo do seu normal, puxado por Estacionamento (↓ 100%). As parcelas subiram.",
        )
        expect(partes.find((p) => p.texto === "caiu 10%")?.tom).toBe("success")
    })

    it("abaixo da média: o grupo que mais caiu, mesmo sumido", () => {
        const mes = [tx({ date: "2026-11-03", amount: 400, description: "Posto Shell" })]
        const c = composicaoDoMes({ ...base, txsDoMes: mes, historico: [...carroHistorico.filter((t) => t.date < "2026-11" && !t.installment_plan_id), ...mes], media: 500 })
        expect(c.caso).toBe("variavelPuxou")
        expect(c.direcao).toBe("abaixo")
        expect(c.destaque).toMatchObject({ nome: "Estacionamento", aMais: -100, variacao: -1 })
        const partes = fraseDaComposicao(c, true)
        expect(texto(partes)).toBe(
            "O que você controla caiu 20%: R$ 400, R$ 100 abaixo do seu normal, puxado por Estacionamento (↓ 100%).",
        )
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
    // A Renata em novembro: o variável subiu com um grupo novo, o fixo caiu e o total ficou abaixo.
    const renata: ComposicaoDoMes = {
        fixo: { total: 1418, itens: [], proximoMes: 1418 },
        variavel: { total: 776, grupos: [], outros: null },
        normais: { fixo: 1820, variavel: 464 },
        caso: "variavelPuxou",
        direcao: "abaixo",
        variacaoTotal: -0.04,
        puxouOVariavel: { nome: "Corte e hidratação", valor: 480, variacao: null, aMais: 480 },
    }
    it("a Renata: começa pelo que ela controla", () => {
        const partes = fraseDaComposicao(renata, true)
        expect(texto(partes)).toBe(
            "O que você controla subiu 67%: R$ 776, R$ 312 acima do seu normal, puxado por Corte e hidratação (novo, R$ 480). As parcelas caíram.",
        )
        expect(partes.find((p) => p.texto === "subiu 67%")?.tom).toBe("warning")
    })
    it("a receita inverte o tom e diz avulsas", () => {
        const partes = fraseDaComposicao(renata, false)
        expect(texto(partes)).toBe(
            "As avulsas subiram 67%: R$ 776, R$ 312 acima do seu normal, puxadas por Corte e hidratação (novo, R$ 480). As entradas fixas caíram.",
        )
        expect(partes.find((p) => p.texto === "subiram 67%")?.tom).toBe("success")
    })
    it("o fixo dentro de ±5% não entra na frase", () => {
        const c: ComposicaoDoMes = { ...renata, normais: { fixo: 1400, variavel: 464 } }
        expect(texto(fraseDaComposicao(c, true))).toBe(
            "O que você controla subiu 67%: R$ 776, R$ 312 acima do seu normal, puxado por Corte e hidratação (novo, R$ 480).",
        )
    })
    it("o variável dentro de ±5%: o caso de hoje, sem o \"só por causa\"", () => {
        const c: ComposicaoDoMes = {
            ...renata,
            fixo: { total: 3000, itens: [], proximoMes: 0 },
            variavel: { total: 470, grupos: [], outros: null },
            caso: "fixoPuxou",
            direcao: "acima",
            variacaoTotal: 0.54,
            destaque: { nome: "parcelas", variacao: 470 / 464 - 1 },
        }
        expect(texto(fraseDaComposicao(c, true))).toBe(
            "O mês está 54% acima da média por causa das parcelas. O que você controla, R$ 470, está dentro do seu normal.",
        )
    })
    it("um grupo novo puxando o mês", () => {
        const c: ComposicaoDoMes = { ...vazia, caso: "variavelPuxou", direcao: "acima", variacaoTotal: 0.3, destaque: { nome: "Lava Rápido", aMais: 80 } }
        expect(texto(fraseDaComposicao(c, true))).toBe("O mês está 30% acima da média: Lava Rápido é novo neste mês (R$ 80).")
    })
})

describe("fixoEmLinhas", () => {
    const item = (id: string, valor: number, novoDesdeYm?: string) =>
        ({ id, nome: id, tipo: "parcela", valor, diaYmd: "2026-11-05", novoDesdeYm }) as const
    it("3 linhas e o resto somado, e a soma bate com o total", () => {
        const itens = [item("Yoga", 332.1), item("Zara", 299), item("Botox", 279), item("Joias", 200.2, "2026-11"), item("Lentes", 109, "2026-11")]
        const { linhas, resto } = fixoEmLinhas(itens, "2026-11")
        expect(linhas.map((i) => i.id)).toEqual(["Yoga", "Zara", "Botox"])
        expect(resto).toEqual({ n: 2, nomes: ["Joias", "Lentes"], valor: 309.2, soParcelas: true, todosNovos: true })
        expect(linhas.reduce((a, i) => a + i.valor, 0) + resto!.valor).toBeCloseTo(1219.3, 2)
    })
    it("até 3 itens: sem resto; um antigo no resto não é novo", () => {
        expect(fixoEmLinhas([item("a", 1)], "2026-11").resto).toBeNull()
        expect(fixoEmLinhas([item("a", 4), item("b", 3), item("c", 2), item("d", 1, "2026-09")], "2026-11").resto?.todosNovos).toBe(false)
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

describe("foraDoNormal", () => {
    it("decide pelo % que se escreve: 5,4% é normal, 5,6% não", () => {
        expect(foraDoNormal(-0.054)).toBe(false)
        expect(foraDoNormal(0.056)).toBe(true)
        expect(foraDoNormal(0.02)).toBe(false)
    })
})

describe("tomDoInsight", () => {
    const base: ComposicaoDoMes = {
        fixo: { total: 1000, itens: [], proximoMes: 1000 },
        variavel: { total: 500, grupos: [], outros: null },
        normais: { fixo: 1000, variavel: 500 },
        caso: "normal",
        direcao: null,
        variacaoTotal: 0,
    }
    it("o variável subiu: aviso na despesa, bom na receita", () => {
        const c = { ...base, variavel: { ...base.variavel, total: 776 } }
        expect(tomDoInsight(c, true)).toBe("warning")
        expect(tomDoInsight(c, false)).toBe("success")
    })
    it("o variável caiu: bom na despesa, aviso na receita", () => {
        const c = { ...base, variavel: { ...base.variavel, total: 300 } }
        expect(tomDoInsight(c, true)).toBe("success")
        expect(tomDoInsight(c, false)).toBe("warning")
    })
    it("variável no normal: vale a direção do total", () => {
        expect(tomDoInsight({ ...base, caso: "fixoPuxou", direcao: "acima", variacaoTotal: 0.54 }, true)).toBe("warning")
        expect(tomDoInsight({ ...base, caso: "variavelPuxou", direcao: "abaixo", variacaoTotal: -0.2 }, true)).toBe("success")
    })
    it("tudo no normal ou sem média: info", () => {
        expect(tomDoInsight(base, true)).toBe("info")
        expect(tomDoInsight({ ...base, caso: "semMedia", normais: { fixo: null, variavel: null }, direcao: null, variacaoTotal: null }, true)).toBe("info")
    })
})
