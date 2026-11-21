import { describe, expect, it } from "vitest"
import {
    compraTipica,
    compromissos,
    diaDeMaisGasto,
    fraseDoResumo,
    insights,
    maisFrequente,
    porDiaDaSemana,
    porFaixaDeValor,
    repeticoes,
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
        expect(r[0]).toEqual({ dia: 1, atual: 0, anterior: 0 })
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
})

describe("porDiaDaSemana", () => {
    it("soma por dia da semana, 0 = segunda", () => {
        // segundas: 2/nov (20) e 9/nov (2000) = 2032; 15/nov é domingo
        const r = porDiaDaSemana(carro, "expense")
        expect(r).toHaveLength(7)
        expect(r[0]).toEqual({ dia: 0, nome: "Seg", total: 2032 })
        expect(r[6].total).toBe(60)
    })
    it("estorno abate e sem lançamentos zera", () => {
        expect(porDiaDaSemana([], "expense").every((d) => d.total === 0)).toBe(true)
        const r = porDiaDaSemana([tx({ date: "2026-11-09", amount: 100 }), estorno({ date: "2026-11-09", amount: 40 })], "expense")
        expect(r[0].total).toBe(60)
    })
})

describe("porFaixaDeValor", () => {
    it("conta as quatro faixas", () => {
        const r = porFaixaDeValor(carro, "expense")
        expect(r.map((f) => f.faixa)).toEqual(["até R$ 50", "R$ 50–200", "R$ 200–500", "R$ 500+"])
        expect(r.map((f) => f.quantidade)).toEqual([4, 2, 2, 1])
        expect(r[3].total).toBe(2000)
    })
    it("estorno não é compra", () => {
        const r = porFaixaDeValor([estorno()], "expense")
        expect(r.every((f) => f.quantidade === 0)).toBe(true)
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

const texto = (f: ReturnType<typeof fraseDoResumo>) => f.partes.map((p) => p.texto).join("")
const base = {
    nomeDaCategoria: "Carro",
    tipo: "expense" as const,
    yearMonth: "2026-11",
    aberto: true,
    lancado: 3000,
    previsto: 3000,
    media: 3000,
    maior: null,
    compras: 5,
    proximoMes: 0,
}

describe("fraseDoResumo", () => {
    it("sem lançamentos", () => {
        const t = texto(fraseDoResumo({ ...base, lancado: 0, previsto: 0, media: null }))
        expect(t).toBe("Nenhum gasto com Carro em novembro de 2026 até agora.")
        expect(t).not.toContain("NaN")
        expect(texto(fraseDoResumo({ ...base, tipo: "income", lancado: 0, previsto: 0 }))).toContain("Nenhuma entrada")
    })
    it("veredito da média e o maior lançamento", () => {
        const maior = tx({ description: "Consórcio", amount: 2000 })
        const t = texto(fraseDoResumo({ ...base, lancado: 3500, previsto: 3500, media: 3000, maior }))
        expect(t).toContain(currencyBRL(3500))
        expect(t).toContain("acima da média")
        expect(t).toContain("Consórcio")
        expect(fraseDoResumo({ ...base, lancado: 3500, previsto: 3500, maior }).partes.some((p) => p.forte)).toBe(true)
    })
    it("o maior só puxa acima de 40% do mês", () => {
        const maior = tx({ description: "Consórcio", amount: 1000 })
        expect(texto(fraseDoResumo({ ...base, maior }))).not.toContain("Consórcio")
    })
    it("o que ainda vem e o mês seguinte", () => {
        const t = texto(fraseDoResumo({ ...base, previsto: 3442.54, proximoMes: 2442.54 }))
        expect(t).toContain(currencyBRL(442.54))
        expect(t).toContain(currencyBRL(2442.54))
        const fechado = texto(fraseDoResumo({ ...base, aberto: false, previsto: 3000, proximoMes: 0 }))
        expect(fechado).not.toContain("Ainda")
    })
    it("mês aberto com previsto: o veredito é da projeção e diz isso", () => {
        // lançado 2.500 < média 3.000 < lançado + previsto 3.600
        const t = texto(fraseDoResumo({ ...base, lancado: 2500, previsto: 3600, media: 3000 }))
        expect(t).toContain("deve fechar acima da média")
        expect(t).not.toContain("abaixo da média")
        const sem = texto(fraseDoResumo({ ...base, lancado: 2500, previsto: 2500, media: 3000 }))
        expect(sem).toContain("abaixo da média")
    })
    it("o maior só puxa com 2 compras ou mais", () => {
        const maior = tx({ description: "Consórcio", amount: 2000 })
        expect(texto(fraseDoResumo({ ...base, maior, compras: 1 }))).not.toContain("puxou")
        expect(texto(fraseDoResumo({ ...base, maior, compras: 2 }))).toContain("puxou")
    })
    it("lançado negativo não vira frase de veredito", () => {
        const t = texto(fraseDoResumo({ ...base, lancado: -50, previsto: -50, media: 3000 }))
        expect(t).not.toContain("média")
    })
    it("receita usa entrada", () => {
        expect(texto(fraseDoResumo({ ...base, tipo: "income" }))).toContain("entrou")
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
