import { describe, expect, it } from "vitest"

import {
    foraDoNormal,
    chaveDoGrupo,
    composicaoDoMes,
    fixoEmLinhas,
    leituraDoMes,
    tomDoInsight,
    quemGastou,
    type ComposicaoDoMes,
    type GrupoVariavel,
    type ItemFixo,
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
    })

    it("sem fixo: o caso vem do variável", () => {
        const mes = carroMes.slice(2)
        const c = composicaoDoMes({ ...base, txsDoMes: mes, historico: carroHistorico.filter((t) => !t.installment_plan_id), media: 500 })
        expect(c.fixo.total).toBe(0)
        expect(c.fixo.itens).toEqual([])
        expect(c.caso).toBe("variavelPuxou")
        expect(c.destaque).toMatchObject({ nome: "Posto Shell", aMais: 100 })
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
    })

    it("dentro de ±2%: o caso é normal", () => {
        const c = composicaoDoMes({ ...base, txsDoMes: carroMes, historico: carroHistorico, parcelas: carroParcelas, media: 3050 })
        expect(c.caso).toBe("normal")
        expect(c.direcao).toBeNull()
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
    })

    it("abaixo da média: o grupo que mais caiu, mesmo sumido", () => {
        const mes = [tx({ date: "2026-11-03", amount: 400, description: "Posto Shell" })]
        const c = composicaoDoMes({ ...base, txsDoMes: mes, historico: [...carroHistorico.filter((t) => t.date < "2026-11" && !t.installment_plan_id), ...mes], media: 500 })
        expect(c.caso).toBe("variavelPuxou")
        expect(c.direcao).toBe("abaixo")
        expect(c.destaque).toMatchObject({ nome: "Estacionamento", aMais: -100, variacao: -1 })
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

describe("leituraDoMes", () => {
    const grupo = (chave: string, nome: string, valor: number, normal: number | null): GrupoVariavel => ({
        chave,
        nome,
        vezes: 1,
        valor,
        normal,
        variacao: normal ? (valor - normal) / normal : null,
        novo: normal == null,
    })
    const item = (id: string, nome: string, valor: number, novoDesdeYm?: string): ItemFixo => ({
        id,
        nome,
        tipo: "parcela",
        valor,
        diaYmd: "2026-11-05",
        novoDesdeYm,
    })
    // A Carro em novembro: o variável subiu 14% (R$ 380), puxado pelo Abastecimento; o Seguro carro é o fixo novo.
    const carro: ComposicaoDoMes = {
        fixo: { total: 739, itens: [item("consorcio", "Consórcio", 443), item("seguro", "Seguro carro", 296, "2026-09")], proximoMes: 443 },
        variavel: {
            total: 3139,
            grupos: [
                grupo("abastecimento", "Abastecimento", 1700, 1360),
                grupo("estacionamento", "Estacionamento", 300, 310),
                grupo("lava", "Lava Rápido", 80, null),
            ],
            outros: null,
        },
        normais: { fixo: 443, variavel: 2759 },
        caso: "variavelPuxou",
        direcao: "acima",
        variacaoTotal: 0.2,
    }
    it("a Carro: manchete do variável, dois motivos em reais e a sugestão", () => {
        const l = leituraDoMes(carro, true, "2026-11", true)
        expect(l.tom).toBe("warning")
        expect(texto(l.manchete)).toBe("Suas compras do mês subiram 14%")
        expect(l.manchete.find((p) => p.texto === "14%")?.tom).toBe("warning")
        expect(texto(l.apoio)).toBe("São R$ 380 acima do seu normal, e quase tudo veio de dois lugares:")
        expect(l.motivos).toEqual([
            { chave: "abastecimento", nome: "Abastecimento", delta: 340, parte: "variavel" },
            { nome: "Seguro carro", detalhe: "novo desde set", delta: 296, parte: "fixo" },
        ])
        expect(l.sugestao).toEqual({ mes: "dezembro", valor: 3202, grupo: { chave: "abastecimento", nome: "Abastecimento" } })
    })
    it("mês fechado: sem sugestão", () => {
        expect(leituraDoMes(carro, true, "2026-11", false).sugestao).toBeNull()
    })
    it("o motivo principal do fixo: a sugestão fica sem grupo", () => {
        const c: ComposicaoDoMes = { ...carro, fixo: { ...carro.fixo, total: 1043 } }
        const l = leituraDoMes(c, true, "2026-11", true)
        expect(l.motivos[0]).toMatchObject({ nome: "Seguro carro", delta: 600, parte: "fixo" })
        expect(l.sugestao).toEqual({ mes: "dezembro", valor: 3202 })
    })
    // A Renata: o variável subiu com um grupo novo; as parcelas caíram e ficam fora (não vão na direção da manchete).
    const renata: ComposicaoDoMes = {
        fixo: { total: 1418, itens: [item("a", "Escova progressiva", 1418)], proximoMes: 1418 },
        variavel: {
            total: 776,
            grupos: [grupo("corte", "Corte e hidratação", 480, null), grupo("escova", "Escova", 200, 180), grupo("manicure", "Manicure", 96, 284)],
            outros: null,
        },
        normais: { fixo: 1820, variavel: 464 },
        caso: "variavelPuxou",
        direcao: "abaixo",
        variacaoTotal: -0.04,
    }
    it("a Renata: só os motivos que subiram", () => {
        const l = leituraDoMes(renata, true, "2026-11", true)
        expect(texto(l.manchete)).toBe("Suas compras do mês subiram 67%")
        expect(l.motivos).toEqual([
            { chave: "corte", nome: "Corte e hidratação", detalhe: "novo", delta: 480, parte: "variavel" },
        ])
        // A Escova (+20) explica menos de 10% dos R$ 312: não entra.
        expect(texto(l.apoio)).toBe("São R$ 312 acima do seu normal, e veio de um lugar:")
    })
    it("mês fechado nomeia o mês", () => {
        expect(texto(leituraDoMes(renata, true, "2026-11", false).manchete)).toBe("Suas compras subiram 67% em novembro")
    })
    it("motivos que cobrem pouco da diferença: o que mais pesou", () => {
        const c: ComposicaoDoMes = {
            ...renata,
            variavel: { ...renata.variavel, grupos: renata.variavel.grupos.map((g) => (g.chave === "corte" ? { ...g, valor: 120, normal: 0 } : g)) },
        }
        expect(texto(leituraDoMes(c, true, "2026-11", true).apoio)).toBe("São R$ 312 acima do seu normal. O que mais pesou:")
    })
    it("a receita diz entradas avulsas e inverte o tom", () => {
        const l = leituraDoMes(renata, false, "2026-11", true)
        expect(texto(l.manchete)).toBe("As entradas avulsas do mês subiram 67%")
        expect(l.manchete.find((p) => p.texto === "67%")?.tom).toBe("success")
        expect(l.tom).toBe("success")
    })
    it("a receita chama o fixo de entradas fixas", () => {
        const c: ComposicaoDoMes = { ...renata, variavel: { ...renata.variavel, total: 300 } }
        const l = leituraDoMes(c, false, "2026-11", true)
        expect(texto(l.manchete)).toBe("As entradas avulsas do mês caíram 35%")
        expect(l.motivos.map((m) => [m.nome, m.delta])).toEqual([
            ["Entradas fixas", -402],
            ["Manicure", -188],
        ])
        expect(l.manchete.find((p) => p.texto === "35%")?.tom).toBe("warning")
    })
    it("um motivo só: veio de um lugar", () => {
        const c: ComposicaoDoMes = { ...renata, variavel: { ...renata.variavel, grupos: [renata.variavel.grupos[0]] } }
        expect(texto(leituraDoMes(c, true, "2026-11", true).apoio)).toBe("São R$ 312 acima do seu normal, e veio de um lugar:")
    })
    it("variável no normal e total fora: a manchete do total, com a diferença contra a média", () => {
        const c: ComposicaoDoMes = {
            ...carro,
            variavel: { ...carro.variavel, total: 2800 },
            fixo: { ...carro.fixo, total: 1043 },
            caso: "fixoPuxou",
            direcao: "acima",
            variacaoTotal: 0.1,
        }
        const l = leituraDoMes(c, true, "2026-11", true)
        expect(texto(l.manchete)).toBe("O mês está 10% acima da média")
        // Total 3.843 contra a média 3.493,64.
        expect(texto(l.apoio)).toBe("São R$ 349 acima do seu normal, e quase tudo veio de dois lugares:")
        expect(l.motivos.map((m) => m.nome)).toEqual(["Seguro carro", "Abastecimento"])
    })
    it("normal: sem motivos, o apoio diz as parcelas", () => {
        const c: ComposicaoDoMes = { ...carro, variavel: { ...carro.variavel, total: 2800 }, caso: "normal", direcao: null, variacaoTotal: 0.01 }
        const l = leituraDoMes(c, true, "2026-11", true)
        expect(l.tom).toBe("info")
        expect(texto(l.manchete)).toBe("O mês está dentro do seu normal")
        expect(texto(l.apoio)).toBe("R$ 739 dele já eram parcelas.")
        expect(l.motivos).toEqual([])
        expect(l.sugestao?.valor).toBe(3202)
    })
    it("normal sem fixo: sem apoio", () => {
        const c: ComposicaoDoMes = {
            ...carro,
            fixo: { total: 0, itens: [], proximoMes: 0 },
            variavel: { ...carro.variavel, total: 2800 },
            caso: "normal",
            direcao: null,
            variacaoTotal: 0.01,
        }
        expect(leituraDoMes(c, true, "2026-11", true).apoio).toEqual([])
    })
    it("sem média: sem motivos e sem sugestão", () => {
        const c: ComposicaoDoMes = { ...carro, normais: { fixo: null, variavel: null }, caso: "semMedia", direcao: null, variacaoTotal: null }
        const l = leituraDoMes(c, true, "2026-11", true)
        expect(texto(l.manchete)).toBe("Ainda não dá para comparar este mês")
        expect(texto(l.apoio)).toBe("R$ 739 em parcelas e assinaturas, R$ 3.139 em compras neste mês.")
        expect(l.motivos).toEqual([])
        expect(l.sugestao).toBeNull()
    })
})
