import { describe, expect, it } from "vitest"
import {
    compraTipica,
    compromissos,
    descricaoSemParcela,
    diaDeMaisGasto,
    diasUteisEFimDeSemana,
    fatosDoMes,
    insights,
    maisFrequente,
    porDiaDaSemana,
    concentracaoDasCompras,
    repeticoes,
    tendenciaDosMeses,
    resumoDoRitmo,
    ritmoDoMes,
} from "@/lib/categoria-resumo"
import { buildCreditCardClosingLookup } from "@/lib/expense-month-attribution"
import { currencyBRL } from "@/lib/formatters"
import type { Transaction, WorkspaceInstallmentPlan, WorkspaceSubscription } from "@/lib/supabase"

const lookup = buildCreditCardClosingLookup([{ id: "c1", closing_day: 10 }])

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
const estorno = (p: Partial<Transaction> = {}) =>
    tx({ type: "income", payment_method: "credit_card", payment_credit_card_id: "c1", amount: 100, ...p })

// A Carro de novembro: 9 lançamentos, maior R$ 2.000 PIX em 9/nov, estacionamento 3x.
const carro: Transaction[] = [
    tx({ id: "1", description: "Consórcio", amount: 2000, date: "2026-11-09" }),
    tx({ id: "2", description: "Seguro", amount: 442.54, date: "2026-11-03" }),
    tx({ id: "3", description: "Estacionamento", amount: 20, date: "2026-11-02" }),
    tx({ id: "4", description: "estacionamento", amount: 30, date: "2026-11-12" }),
    tx({ id: "5", description: "Estacionamento", amount: 25, date: "2026-11-20" }),
    tx({ id: "6", description: "Gasolina", amount: 180, date: "2026-11-06" }),
    tx({ id: "7", description: "Lavagem", amount: 60, date: "2026-11-15" }),
    tx({ id: "8", description: "Pedágio", amount: 12, date: "2026-11-16" }),
    tx({ id: "9", description: "Óleo", amount: 250, date: "2026-11-18" }),
]

describe("ritmoDoMes", () => {
    it("acumula dia a dia e corta o atual em hoje", () => {
        const rows = [
            tx({ date: "2026-11-02", amount: 10 }),
            tx({ date: "2026-11-04", amount: 5 }),
            tx({ date: "2026-10-03", amount: 7 }),
        ]
        const r = ritmoDoMes({ rows, tipo: "expense", yearMonth: "2026-11", hojeYmd: "2026-11-04", lookup })
        expect(r).toHaveLength(30)
        expect(r[0]).toEqual({ dia: 1, atual: 0, anterior: 0, faixa: [0, 0], projecao: null })
        expect(r[1].atual).toBe(10)
        expect(r[3].atual).toBe(15)
        expect(r[4].atual).toBeNull()
        expect(r[2].anterior).toBe(7)
        expect(r[29].anterior).toBe(7)
    })
    it("mês passado: o atual vai até o fim", () => {
        const r = ritmoDoMes({ rows: [], tipo: "expense", yearMonth: "2026-09", hojeYmd: "2026-11-20", lookup })
        expect(r).toHaveLength(30)
        expect(r[29].atual).toBe(0)
    })
    it("mês anterior mais longo: ainda chega ao total final no último dia", () => {
        const rows = [tx({ date: "2026-01-05", amount: 10 }), tx({ date: "2026-01-31", amount: 20 })]
        const r = ritmoDoMes({ rows, tipo: "expense", yearMonth: "2026-02", hojeYmd: "2026-03-10", lookup })
        expect(r).toHaveLength(28)
        expect(r[27].anterior).toBe(30)
    })
    it("estorno abate", () => {
        const rows = [tx({ date: "2026-11-02", amount: 100 }), estorno({ date: "2026-11-03", amount: 30 })]
        const r = ritmoDoMes({ rows, tipo: "expense", yearMonth: "2026-11", hojeYmd: "2026-11-30", lookup })
        expect(r[2].atual).toBe(70)
    })
    it("a faixa só existe até hoje", () => {
        const rows = [tx({ date: "2026-11-02", amount: 10 }), tx({ date: "2026-10-03", amount: 7 })]
        const r = ritmoDoMes({ rows, tipo: "expense", yearMonth: "2026-11", hojeYmd: "2026-11-04", lookup })
        expect(r[1].faixa).toEqual([0, 10])
        expect(r[3].faixa).toEqual([7, 10])
        expect(r[4].faixa).toBeNull()
    })
    it("a projeção sai do atual de hoje e chega ao atual + previsto no último dia", () => {
        const rows = [tx({ date: "2026-11-02", amount: 100 })]
        const r = ritmoDoMes({ rows, tipo: "expense", yearMonth: "2026-11", hojeYmd: "2026-11-10", lookup, previsto: 200 })
        expect(r[8].projecao).toBeNull()
        expect(r[9].projecao).toBe(100)
        expect(r[19].projecao).toBe(200)
        expect(r[29].projecao).toBe(300)
    })
    it("mês fechado: nenhuma projeção", () => {
        const rows = [tx({ date: "2026-10-02", amount: 100 })]
        const r = ritmoDoMes({ rows, tipo: "expense", yearMonth: "2026-10", hojeYmd: "2026-11-10", lookup, previsto: 200 })
        expect(r.every((d) => d.projecao === null)).toBe(true)
    })
})

describe("resumoDoRitmo", () => {
    it("Carro: R$ 671,62 a menos que outubro no dia 21", () => {
        const rows = [tx({ date: "2026-11-05", amount: 3062.54 }), tx({ date: "2026-10-10", amount: 3734.16 })]
        const r = ritmoDoMes({ rows, tipo: "expense", yearMonth: "2026-11", hojeYmd: "2026-11-21", lookup, previsto: 100 })
        const s = resumoDoRitmo(r, { aberto: true })
        expect(s.hoje).toBe(21)
        expect(s.diferenca).toBeCloseTo(-671.62, 2)
        expect(s.fechamento).toBeCloseTo(3162.54, 2)
        expect(s.anteriorFinal).toBeCloseTo(3734.16, 2)
    })
    it("sem anterior, a diferença é null", () => {
        const rows = [tx({ date: "2026-11-05", amount: 50 })]
        const r = ritmoDoMes({ rows, tipo: "expense", yearMonth: "2026-11", hojeYmd: "2026-11-21", lookup })
        expect(resumoDoRitmo(r, { aberto: true }).diferenca).toBeNull()
        expect(resumoDoRitmo(r, { aberto: true }).anteriorFinal).toBeNull()
    })
})

describe("porDiaDaSemana", () => {
    it("soma por dia da semana, 0 = segunda", () => {
        // segundas: 2/nov (20), 9/nov (2000) e 16/nov (12) = 2032, três compras; 15/nov é domingo
        const r = porDiaDaSemana(carro, "expense")
        expect(r).toHaveLength(7)
        expect(r[0]).toEqual({ dia: 0, nome: "Seg", total: 2032, compras: 3 })
        expect(r[6].total).toBe(60)
    })
    it("estorno abate e sem lançamentos zera", () => {
        expect(porDiaDaSemana([], "expense").every((d) => d.total === 0)).toBe(true)
        const r = porDiaDaSemana([tx({ date: "2026-11-09", amount: 100 }), estorno({ date: "2026-11-09", amount: 40 })], "expense")
        expect(r[0].total).toBe(60)
        expect(r[0].compras).toBe(1)
    })
})

describe("diasUteisEFimDeSemana", () => {
    const semana = (totais: number[]) => totais.map((total, dia) => ({ dia, total }))
    it("seg a sex são úteis, sáb e dom fim de semana, e os % somam 100", () => {
        const r = diasUteisEFimDeSemana(semana([2080, 170, 330, 250, 60, 172, 0]))
        expect(r).toEqual({ uteis: { total: 2890, pct: 94 }, fim: { total: 172, pct: 6 } })
    })
    it("o mês todo em dia útil dá 100 e 0", () => {
        const r = diasUteisEFimDeSemana(semana([10, 0, 5, 0, 0, 0, 0]))
        expect(r).toEqual({ uteis: { total: 15, pct: 100 }, fim: { total: 0, pct: 0 } })
    })
    it("o mês zerado dá 0 e 0", () => {
        const r = diasUteisEFimDeSemana(semana([0, 0, 0, 0, 0, 0, 0]))
        expect(r).toEqual({ uteis: { total: 0, pct: 0 }, fim: { total: 0, pct: 0 } })
    })
})

describe("concentracaoDasCompras", () => {
    const valores = [2000, 240, 210, 180, 150, 120, 100, 85, 70, 55, 40, 35, 30, 25, 18, 12]
    it("5 de 16 compras fazem 80% do mês, da maior para a menor", () => {
        const txs = [...valores].reverse().map((v, i) => tx({ id: String(i), amount: v }))
        const r = concentracaoDasCompras(txs, "expense")
        expect(r.n80).toBe(5)
        expect(r.total).toBe(3370)
        expect(r.quantidade).toBe(16)
        expect(r.compras.map((c) => c.valor)).toEqual(valores)
        expect(r.outras).toBeNull()
    })
    it("uma compra só faz o mês inteiro", () => {
        expect(concentracaoDasCompras([tx({ amount: 42 })], "expense").n80).toBe(1)
    })
    it("10 compras iguais de R$ 50: 8 fazem 80%", () => {
        const txs = Array.from({ length: 10 }, (_, i) => tx({ id: String(i), amount: 50 }))
        expect(concentracaoDasCompras(txs, "expense").n80).toBe(8)
    })
    it("acima de 40, as menores viram \"outras\", e o n80 conta a lista inteira", () => {
        const txs = Array.from({ length: 45 }, (_, i) => tx({ id: String(i), amount: 100 - i }))
        const r = concentracaoDasCompras(txs, "expense")
        expect(r.compras).toHaveLength(39)
        expect(r.outras?.quantidade).toBe(6)
        expect(r.outras?.valor).toBe(61 + 60 + 59 + 58 + 57 + 56)
        expect(r.quantidade).toBe(45)
        expect(r.n80).toBe(34)
    })
    it("estorno não é compra", () => {
        const r = concentracaoDasCompras([estorno(), tx({ amount: 30, description: "Gasolina", date: "2026-11-09" })], "expense")
        expect(r.compras).toEqual([{ id: "x", descricao: "Gasolina", data: "2026-11-09", valor: 30 }])
        expect(r.total).toBe(30)
    })
})

describe("compraTipica", () => {
    it("mediana", () => {
        expect(compraTipica(carro, "expense")).toBe(60)
        expect(compraTipica([tx({ amount: 10 }), tx({ amount: 20 })], "expense")).toBe(15)
    })
    it("uma compra só = ela; nenhuma = null; estorno ignorado", () => {
        expect(compraTipica([tx({ amount: 42 }), estorno()], "expense")).toBe(42)
        expect(compraTipica([], "expense")).toBeNull()
    })
})

describe("maisFrequente", () => {
    it("estacionamento 3x, normalizado", () => {
        expect(maisFrequente(carro, "expense")).toEqual({ descricao: "Estacionamento", vezes: 3, total: 75 })
    })
    it("uma compra só e estorno: null", () => {
        expect(maisFrequente([tx({ description: "A" })], "expense")).toBeNull()
        expect(maisFrequente([tx({ description: "A" }), estorno({ description: "A" })], "expense")).toBeNull()
    })
})

describe("diaDeMaisGasto", () => {
    it("o dia de maior soma", () => {
        expect(diaDeMaisGasto(carro, "expense")).toEqual({ ymd: "2026-11-09", total: 2000, quantidade: 1 })
    })
    it("soma o dia e vazio é null", () => {
        const r = diaDeMaisGasto([tx({ date: "2026-11-02", amount: 5 }), tx({ date: "2026-11-02", amount: 6 })], "expense")
        expect(r).toEqual({ ymd: "2026-11-02", total: 11, quantidade: 2 })
        expect(diaDeMaisGasto([], "expense")).toBeNull()
    })
})

function plano(p: Partial<WorkspaceInstallmentPlan>): WorkspaceInstallmentPlan {
    return {
        id: "p",
        category_id: "cat",
        description: "Consórcio",
        total_installments: 6,
        generated_count: 3,
        installment_amount: 2000,
        final_installment_amount: 2000,
        next_billing_date: "2026-12-09",
        is_active: true,
        ...p,
    } as WorkspaceInstallmentPlan
}
function assinatura(p: Partial<WorkspaceSubscription>): WorkspaceSubscription {
    return {
        id: "s",
        name: "Streaming",
        amount: 30,
        billing_interval: "monthly",
        next_billing_date: "2026-11-25",
        category_id: "cat",
        is_active: true,
        ...p,
    } as WorkspaceSubscription
}

describe("compromissos", () => {
    it("Carro: Consórcio 3/6 e Seguro 3/12", () => {
        const r = compromissos({
            categoryId: "cat",
            parcelas: [
                plano({}),
                plano({
                    id: "p2",
                    description: "Seguro",
                    total_installments: 12,
                    generated_count: 3,
                    installment_amount: 442.54,
                    final_installment_amount: 442.54,
                    next_billing_date: "2026-12-03",
                }),
                plano({ id: "p3", category_id: "outra" }),
                plano({ id: "p4", is_active: false }),
            ],
            assinaturas: [],
            hojeYmd: "2026-11-21",
        })
        expect(r.itens).toHaveLength(2)
        expect(r.itens[0]).toMatchObject({ nome: "Consórcio", tipo: "parcela", valor: 2000, atual: 3, total: 6, proximaYmd: "2026-12-09", terminaYm: "2027-02" })
        expect(r.porMes).toBe(2442.54)
        expect(r.ateAcabar).toBeCloseTo(3 * 2000 + 9 * 442.54, 2)
    })
    it("a última parcela usa o valor final", () => {
        const r = compromissos({
            categoryId: "cat",
            parcelas: [plano({ generated_count: 4, final_installment_amount: 1990 })],
            assinaturas: [],
            hojeYmd: "2026-11-21",
        })
        expect(r.ateAcabar).toBe(2000 + 1990)
    })
    it("6 de 6: termina este mês, sem próxima data", () => {
        const r = compromissos({
            categoryId: "cat",
            parcelas: [plano({ generated_count: 6 })],
            assinaturas: [],
            hojeYmd: "2026-11-21",
        })
        expect(r.itens[0]).toMatchObject({ atual: 6, total: 6, proximaYmd: null, terminaYm: "2026-11" })
        expect(r.porMes).toBe(0)
        expect(r.ateAcabar).toBe(0)
    })
    it("assinatura ativa da categoria entra, sem terminar", () => {
        const r = compromissos({
            categoryId: "cat",
            parcelas: [],
            assinaturas: [assinatura({}), assinatura({ id: "s2", is_active: false }), assinatura({ id: "s3", category_id: "o" })],
            hojeYmd: "2026-11-21",
        })
        expect(r.itens).toEqual([
            { id: "s", nome: "Streaming", tipo: "assinatura", valor: 30, proximaYmd: "2026-11-25" },
        ])
        expect(r.porMes).toBe(30)
        expect(r.ateAcabar).toBe(0)
    })
})

describe("repeticoes", () => {
    it("cadência e projeção no mês aberto", () => {
        const r = repeticoes({ txs: carro, tipo: "expense", yearMonth: "2026-11", hojeYmd: "2026-11-21" })
        expect(r).toHaveLength(1)
        expect(r[0]).toMatchObject({ descricao: "Estacionamento", vezes: 3, total: 75, aCadaDias: 9 })
        // faltam 9 dias, cadência 9 → mais 1 compra de ~25
        expect(r[0].projecaoNoMes).toBe(25)
    })
    it("mês passado: sem projeção", () => {
        const r = repeticoes({ txs: carro, tipo: "expense", yearMonth: "2026-11", hojeYmd: "2026-12-10" })
        expect(r[0].projecaoNoMes).toBeNull()
    })
    it("estorno não repete; vazio é lista vazia", () => {
        expect(repeticoes({ txs: [estorno(), estorno()], tipo: "expense", yearMonth: "2026-11", hojeYmd: "2026-11-21" })).toEqual([])
    })
})

// currencyBRL separa o R$ com espaço não separável; os textos esperados usam o espaço comum.
const normal = (s: string) => s.replace(/\u00a0/g, " ")

describe("descricaoSemParcela", () => {
    it("tira o sufixo de parcela", () => {
        expect(descricaoSemParcela("Consórcio Mãe - 3/6")).toBe("Consórcio Mãe")
        expect(descricaoSemParcela("Consórcio Mãe – 3/6")).toBe("Consórcio Mãe")
        expect(descricaoSemParcela("Seguro (4/12)")).toBe("Seguro")
        expect(descricaoSemParcela("Seguro 4/12")).toBe("Seguro")
        expect(descricaoSemParcela("Netflix")).toBe("Netflix")
        expect(descricaoSemParcela("  ")).toBeNull()
        expect(descricaoSemParcela(null)).toBeNull()
    })
})

describe("fatosDoMes", () => {
    const args = {
        tipo: "expense" as const,
        yearMonth: "2026-11",
        lancado: 3062.54,
        media: 2906.77,
        maior: tx({ description: "Consórcio Mãe - 3/6", amount: 2000 }),
        compras: 9,
        proximoMes: 442.54,
    }
    it("puxou, previsto e total, nessa ordem", () => {
        expect(fatosDoMes(args).map((f) => ({ ...f, titulo: normal(f.titulo) }))).toEqual([
            { id: "puxou", rotulo: "Puxou o mês", titulo: "Consórcio Mãe", valor: 2000, acao: "lancamento" },
            { id: "previsto", rotulo: "Já previsto", titulo: "Dezembro", valor: 442.54, acao: "comprometido" },
            { id: "total", rotulo: "Total do mês", titulo: "média R$ 2.906,77", valor: 3062.54 },
        ])
    })
    it("sem maior válido e sem próximo mês, só o total; sem média o título é o mês", () => {
        expect(fatosDoMes({ ...args, maior: null, proximoMes: 0, media: null })).toEqual([
            { id: "total", rotulo: "Total do mês", titulo: "novembro", valor: 3062.54 },
        ])
    })
    it("sem lançado, nada", () => {
        expect(fatosDoMes({ ...args, lancado: 0 })).toEqual([])
    })
})

const semCompromisso = { itens: [], porMes: 0, ateAcabar: 0 }

describe("insights", () => {
    it("parcela que termina libera valor/mês", () => {
        const c = compromissos({ categoryId: "cat", parcelas: [plano({})], assinaturas: [], hojeYmd: "2026-11-21" })
        const r = insights({ tipo: "expense", lancado: 3000, media: null, limite: 500, txs: [], compromissos: c })
        expect(r).toHaveLength(1)
        expect(r[0]).toMatchObject({ id: "parcela-termina", tom: "success", acao: "previsao" })
        expect(r[0].texto.map((p) => p.texto).join("")).toContain(currencyBRL(2000))
    })
    it("concentração: 2 maiores > 70%", () => {
        const r = insights({ tipo: "expense", lancado: 2910, media: null, limite: 100, txs: carro.slice(0, 3), compromissos: semCompromisso })
        const c = r.find((i) => i.id === "concentracao")
        expect(c?.tom).toBe("warning")
        expect(c?.texto.map((p) => p.texto).join("")).toContain(currencyBRL(2910 - 2442.54))
    })
    it("concentração não aparece se os 2 maiores passam do lançado", () => {
        const r = insights({ tipo: "expense", lancado: 1000, media: null, limite: 100, txs: carro.slice(0, 3), compromissos: semCompromisso })
        expect(r.find((i) => i.id === "concentracao")).toBeUndefined()
    })
    it("sugere limite em centenas para despesa sem limite", () => {
        const r = insights({ tipo: "expense", lancado: 10, media: 2342.5, limite: null, txs: [], compromissos: semCompromisso })
        expect(r).toHaveLength(1)
        expect(r[0]).toMatchObject({ id: "limite", tom: "info", acao: "limite" })
        expect(r[0].texto.map((p) => p.texto).join("")).toContain(currencyBRL(2400))
    })
    it("receita não sugere limite; vazio não dá NaN", () => {
        expect(insights({ tipo: "income", lancado: 0, media: 1000, limite: null, txs: [], compromissos: semCompromisso })).toEqual([])
        expect(insights({ tipo: "expense", lancado: 0, media: null, limite: null, txs: [], compromissos: semCompromisso })).toEqual([])
    })
    it("no máximo 3, parcela antes de limite", () => {
        const c = compromissos({ categoryId: "cat", parcelas: [plano({})], assinaturas: [], hojeYmd: "2026-11-21" })
        const r = insights({ tipo: "expense", lancado: 2910, media: 3000, limite: null, txs: carro.slice(0, 3), compromissos: c })
        expect(r.map((i) => i.id)).toEqual(["parcela-termina", "concentracao", "limite"])
    })
})

describe("tendenciaDosMeses", () => {
    const carro = [
        { yearMonth: "2026-05", total: 604.85 },
        { yearMonth: "2026-06", total: 3335.54 },
        { yearMonth: "2026-07", total: 3046.58 },
        { yearMonth: "2026-08", total: 3189 },
        { yearMonth: "2026-09", total: 3524.51 },
        { yearMonth: "2026-10", total: 3740.16 },
        { yearMonth: "2026-11", total: 3062.54 },
    ]
    it("vai do primeiro ao último mês inteiro, sem o aberto nem o pela metade", () => {
        const t = tendenciaDosMeses(carro, { aberto: true, primeiroPelaMetade: true })
        expect(t?.desde).toBe("2026-06")
        expect(t?.variacao).toBeCloseTo((3740.16 - 3335.54) / 3335.54, 6)
    })
    it("mês fechado entra; primeiro inteiro entra", () => {
        const t = tendenciaDosMeses(carro.slice(1), { aberto: false, primeiroPelaMetade: false })
        expect(t?.desde).toBe("2026-06")
        expect(t?.variacao).toBeCloseTo((3062.54 - 3335.54) / 3335.54, 6)
    })
    it("menos de dois meses inteiros ou começo zerado: sem tendência", () => {
        expect(tendenciaDosMeses(carro.slice(0, 3), { aberto: true, primeiroPelaMetade: true })).toBeNull()
        expect(tendenciaDosMeses([{ yearMonth: "2026-10", total: 0 }, { yearMonth: "2026-11", total: 50 }], { aberto: false, primeiroPelaMetade: false })).toBeNull()
    })
})
