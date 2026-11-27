import { describe, expect, it } from "vitest"
import { reaisInteiros } from "@/components/categories/detail/regua-do-mes-contas"
import { compromissos } from "@/lib/categoria-resumo"
import { currencyBRL } from "@/lib/formatters"
import type { Insight } from "@/lib/insights/acoes"
import {
    insightsDaCaixa,
    insightsLocais,
    ordenarInsights,
    paraQuemLe,
    type InsightDaCategoria,
} from "@/lib/insights-da-categoria"
import type { Transaction, WorkspaceInstallmentPlan } from "@/lib/supabase"

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
        needs_review: false,
        ...p,
    } as Transaction
}
const carro: Transaction[] = [
    tx({ id: "1", description: "Consórcio", amount: 2000, date: "2026-11-09" }),
    tx({ id: "2", description: "Seguro", amount: 442.54, date: "2026-11-03" }),
    tx({ id: "3", description: "Estacionamento", amount: 20, date: "2026-11-02" }),
]
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
const semCompromisso = { itens: [], porMes: 0, ateAcabar: 0 }

const base = {
    tipo: "expense" as const,
    categoryId: "cat",
    yearMonth: "2026-11",
    aberto: true,
    lancado: 0,
    previsto: 0,
    media: null,
    limite: 500 as number | null,
    txs: [] as Transaction[],
    compromissos: semCompromisso,
}

describe("insightsLocais", () => {
    it("parcela que termina libera valor/mês", () => {
        const c = compromissos({ categoryId: "cat", parcelas: [plano({})], assinaturas: [], hojeYmd: "2026-11-21" })
        const r = insightsLocais({ ...base, lancado: 3000, limite: null, compromissos: c })
        expect(r).toHaveLength(1)
        expect(r[0]).toMatchObject({
            ordem: 5,
            tom: "success",
            numero: `+${reaisInteiros(2000)}/mês`,
            acao: { tipo: "previsao" },
        })
        expect(r[0].titulo.startsWith("Sobra em ")).toBe(true)
        expect(r[0]).toMatchObject({ foco: "dado", rotulo: "Ver na Previsão", corpo: { tipo: "parcela", atual: 3, total: 6 } })
        expect(r[0].linha).toMatch(/^Consórcio · 3 de 6 · termina em /)
    })
    it("a parcela que termina no ano do mês visto não diz o ano", () => {
        const c = { itens: [{ id: "p", nome: "Seguro", tipo: "parcela" as const, valor: 300, proximaYmd: null, total: 12, terminaYm: "2026-11" }], porMes: 300, ateAcabar: 300 }
        const [r] = insightsLocais({ ...base, yearMonth: "2026-03", limite: null, compromissos: c })
        expect(r.titulo).toBe("Sobra em dezembro")
        expect(r.linha).toBe("Seguro · 12 de 12 · termina em novembro")
    })
    it("a parcela que termina em outro ano diz o ano curto", () => {
        const c = { itens: [{ id: "p", nome: "Seguro carro", tipo: "parcela" as const, valor: 300, proximaYmd: null, total: 12, terminaYm: "2027-08" }], porMes: 300, ateAcabar: 300 }
        const [r] = insightsLocais({ ...base, limite: null, compromissos: c })
        expect(r.titulo).toBe("Sobra em set/27")
        expect(r.linha).toBe("Seguro carro · 12 de 12 · termina em ago/27")
    })
    it("a parcela que termina em dezembro sobra em janeiro do ano seguinte", () => {
        const c = { itens: [{ id: "p", nome: "Seguro", tipo: "parcela" as const, valor: 300, proximaYmd: null, total: 12, terminaYm: "2026-12" }], porMes: 300, ateAcabar: 300 }
        const [r] = insightsLocais({ ...base, limite: null, compromissos: c })
        expect(r.titulo).toBe("Sobra em jan/27")
        expect(r.linha).toBe("Seguro · 12 de 12 · termina em dezembro")
    })
    it("sugere limite em centenas para despesa sem limite", () => {
        const r = insightsLocais({ ...base, lancado: 10, media: 2342.5, limite: null })
        expect(r).toHaveLength(1)
        expect(r[0]).toMatchObject({
            ordem: 8,
            numero: `${reaisInteiros(2400)}/mês`,
            foco: "acao",
            rotulo: `Definir ${reaisInteiros(2400)}`,
            linha: `Este mês: ${reaisInteiros(10)} · pela média de 6 meses`,
            corpo: { tipo: "limite", lancado: 10, sugerido: 2400 },
            acao: { tipo: "limite", valor: 2400 },
        })
    })
    it("concentração: 2 maiores > 70%", () => {
        const r = insightsLocais({ ...base, lancado: 2910, txs: carro })
        const c = r.find((i) => i.ordem === 9)
        expect(c).toMatchObject({
            numero: "84%",
            foco: "dado",
            acao: { tipo: "ordenar-por-valor" },
            linha: `Consórcio e Seguro · resto ${reaisInteiros(2910 - 2442.54)}`,
            corpo: { tipo: "concentracao", partes: [{ nome: "Consórcio", valor: 2000 }, { nome: "Seguro", valor: 442.54 }], resto: 2910 - 2442.54 },
        })
    })
    it("concentração não aparece se os 2 maiores passam do lançado", () => {
        expect(insightsLocais({ ...base, lancado: 1000, txs: carro }).find((i) => i.ordem === 9)).toBeUndefined()
    })
    it("receita não sugere limite; mês vazio dá nada", () => {
        expect(insightsLocais({ ...base, tipo: "income", media: 1000, limite: null })).toEqual([])
        expect(insightsLocais({ ...base, limite: null })).toEqual([])
    })
    it("a conferir: conta e soma os needs_review", () => {
        const txs = [tx({ id: "a", amount: 30, needs_review: true }), tx({ id: "b", amount: 20, needs_review: true }), tx({ id: "c" })]
        const r = insightsLocais({ ...base, txs })
        expect(r).toHaveLength(1)
        expect(r[0]).toMatchObject({
            ordem: 2,
            titulo: "2 para conferir",
            numero: reaisInteiros(50),
            foco: "acao",
            rotulo: "Conferir agora",
            corpo: { tipo: "conferir", resto: 0, total: 50 },
            acao: { tipo: "link", href: "/transactions?conferir=1&cats=cat" },
        })
    })
    it("a conferir: 1 lançamento sem resto; 5 mostram 3 linhas, as mais recentes, e resto 2", () => {
        const um = insightsLocais({ ...base, txs: [tx({ id: "a", needs_review: true })] })[0].corpo
        expect(um).toMatchObject({ tipo: "conferir", resto: 0 })
        expect((um as { linhas: unknown[] }).linhas).toHaveLength(1)
        const cinco = ["01", "02", "03", "04", "05"].map((d) =>
            tx({ id: d, description: `d${d}`, amount: 10, date: `2026-11-${d}`, source: "app", needs_review: true }),
        )
        const c = insightsLocais({ ...base, txs: cinco })[0].corpo
        expect(c).toMatchObject({
            resto: 2,
            total: 50,
            linhas: [
                { dataYmd: "2026-11-05", origem: "app", descricao: "d05", valor: 10 },
                { dataYmd: "2026-11-04", origem: "app", descricao: "d04", valor: 10 },
                { dataYmd: "2026-11-03", origem: "app", descricao: "d03", valor: 10 },
            ],
        })
    })
    it("ritmo: passa do limite no mês aberto", () => {
        const r = insightsLocais({ ...base, lancado: 3500, previsto: 400, limite: 3500 })
        expect(r).toHaveLength(1)
        expect(r[0]).toMatchObject({ ordem: 3, numero: `${reaisInteiros(400)} acima`, tom: "warning", foco: "dado", rotulo: "Ajustar limite", linha: `Fecha em ${reaisInteiros(3900)} · limite ${reaisInteiros(3500)}`, corpo: { tipo: "ritmo", lancado: 3500, previsto: 400, limite: 3500 }, acao: { tipo: "limite" } })
    })
    it("ritmo some com o mês fechado, sem limite ou dentro dele", () => {
        expect(insightsLocais({ ...base, aberto: false, lancado: 3500, previsto: 400, limite: 3500 })).toEqual([])
        expect(insightsLocais({ ...base, lancado: 3500, previsto: 400, limite: null })).toEqual([])
        expect(insightsLocais({ ...base, lancado: 100, previsto: 100, limite: 500 })).toEqual([])
    })
})

const linha = (kind: string, payload: Record<string, unknown>, id = `${kind}-1`): Insight => ({
    id,
    workspace_id: "w",
    kind,
    payload,
    status: "new",
    created_at: "2026-11-20T00:00:00Z",
})
const ctx = {
    categoryId: "cat",
    assinaturas: [
        { id: "s1", category_id: "cat" },
        { id: "s2", category_id: "outra" },
    ],
    txs: [
        tx({ id: "t1", description: "Netflix", amount: 23.9, date: "2026-11-05", payment_method: "credit_card" }),
        tx({ id: "t2", description: "Netflix", amount: 23.9, date: "2026-11-05", payment_method: "pix" }),
    ],
}

describe("insightsDaCaixa", () => {
    it("duplicidade da categoria filtra pela descrição", () => {
        const r = insightsDaCaixa(
            [linha("duplicidade", { ids: ["t1", "t2"], valor: 23.9, descricao: "Netflix", dataYmd: "2026-11-05" })],
            ctx,
        )
        expect(r).toEqual([
            expect.objectContaining({
                ordem: 1,
                titulo: "Lançamento repetido?",
                linha: "Netflix, duas vezes em 05/11",
                rotulo: "Ver os dois na lista",
                foco: "acao",
                corpo: {
                    tipo: "duplicado",
                    lancamentos: [
                        { descricao: "Netflix", dataYmd: "2026-11-05", forma: "Cartão de crédito", valor: 23.9 },
                        { descricao: "Netflix", dataYmd: "2026-11-05", forma: "PIX", valor: 23.9 },
                    ],
                },
                acao: { tipo: "filtrar", descricao: "Netflix" },
            }),
        ])
    })
    it("duplicidade só aparece com os dois lançamentos no mês da página", () => {
        const l = (ids: string[]) => linha("duplicidade", { ids, valor: 1, descricao: "Netflix", dataYmd: "2026-11-05" })
        expect(insightsDaCaixa([l(["t1", "t2"])], ctx)).toHaveLength(1)
        expect(insightsDaCaixa([l(["t1", "t3"])], ctx)).toEqual([])
        expect(insightsDaCaixa([l(["t3", "t4"])], ctx)).toEqual([])
    })
    it("preço que cai mostra a economia com o menos", () => {
        const r = insightsDaCaixa([linha("preco_assinatura", { assinaturaId: "s1", nome: "Streaming", de: 21.9, para: 19.9 })], ctx)
        expect(r[0].linha).toBe(`−${reaisInteiros(24)} por ano`)
    })
    it("sazonal: título, número e conta a pagar; sem category_id não aparece", () => {
        const p = { termo: "ipva", mesAnterior: "2026-01", valor: 1800 }
        const r = insightsDaCaixa([linha("sazonal", { ...p, category_id: "cat" }, "sz")], ctx)
        expect(r[0]).toMatchObject({
            ordem: 4,
            titulo: "IPVA chega em janeiro",
            numero: reaisInteiros(1800),
            linha: "Foi o que você pagou em jan/26",
            rotulo: "Criar conta do IPVA",
            foco: "acao",
            corpo: { tipo: "sazonal", dataYmd: null, valor: 1800 },
            acao: { tipo: "conta-a-pagar", insightId: "sz" },
        })
        const [com] = insightsDaCaixa([linha("sazonal", { ...p, category_id: "cat", dataYmd: "2026-01-20" })], ctx)
        expect(com.corpo).toEqual({ tipo: "sazonal", dataYmd: "2026-01-20", valor: 1800 })
        expect(insightsDaCaixa([linha("sazonal", p)], ctx)).toEqual([])
    })
    it("recorrência: rótulo pelo destino; sem nome some", () => {
        const p = { nome: "Academia", valorMedio: 120, lancamentos: ["a", "b", "c"], category_id: "cat" }
        const r = insightsDaCaixa([linha("recorrencia", { ...p, destino: "assinatura" }, "r1")], ctx)
        expect(r[0]).toMatchObject({
            ordem: 6,
            titulo: "Academia todo mês",
            numero: `~${reaisInteiros(120)}/mês`,
            linha: "Há 3 meses seguidos, sem cadastro",
            rotulo: "Virar assinatura",
            foco: "acao",
            corpo: { tipo: "recorrencia", insightId: "r1", valorMedio: 120 },
            acao: { tipo: "recorrencia", insightId: "r1" },
        })
        expect(insightsDaCaixa([linha("recorrencia", { ...p, destino: "conta" })], ctx)[0].rotulo).toBe("Virar conta a pagar")
        expect(insightsDaCaixa([linha("recorrencia", { ...p, nome: undefined })], ctx)).toEqual([])
    })
    it("preço da assinatura com centavos", () => {
        const r = insightsDaCaixa([linha("preco_assinatura", { assinaturaId: "s1", nome: "Streaming", de: 21.9, para: 23.9 })], ctx)
        expect(r[0]).toMatchObject({
            ordem: 7,
            titulo: "Streaming mudou de preço",
            numero: `${currencyBRL(21.9)} → ${currencyBRL(23.9)}`,
            linha: `+${reaisInteiros(24)} por ano`,
            rotulo: `Atualizar para ${currencyBRL(23.9)}`,
            foco: "acao",
            corpo: { tipo: "preco", de: 21.9, para: 23.9 },
        })
    })
    it("nenhum tipo de outra categoria aparece", () => {
        const fora = [
            linha("duplicidade", { ids: ["t3", "t4"], valor: 10, descricao: "x", dataYmd: "2026-11-05" }),
            linha("sazonal", { termo: "ipva", mesAnterior: "2026-01", valor: 1, category_id: "outra" }),
            linha("recorrencia", { nome: "Y", valorMedio: 1, lancamentos: [], category_id: "outra" }),
            linha("preco_assinatura", { assinaturaId: "s2", nome: "Z", de: 1, para: 2 }),
            linha("preco_assinatura", { assinaturaId: "nenhuma", nome: "Z", de: 1, para: 2 }),
        ]
        expect(insightsDaCaixa(fora, ctx)).toEqual([])
    })
})

describe("ordem e leitor", () => {
    const mk = (ordem: InsightDaCategoria["ordem"], acao: InsightDaCategoria["acao"]): InsightDaCategoria => ({
        id: String(ordem),
        ordem,
        titulo: "",
        numero: "",
        linha: "",
        rotulo: "",
        foco: "dado",
        corpo: { tipo: "parcela", atual: 1, total: 1 },
        acao,
    })
    it("ordenarInsights põe pela ordem", () => {
        const xs = [mk(9, { tipo: "ordenar-por-valor" }), mk(1, { tipo: "filtrar", descricao: "a" }), mk(5, { tipo: "previsao" })]
        expect(ordenarInsights(xs).map((x) => x.ordem)).toEqual([1, 5, 9])
    })
    it("paraQuemLe tira as ações que escrevem", () => {
        const xs = [
            mk(3, { tipo: "limite" }),
            mk(4, { tipo: "conta-a-pagar", insightId: "a" }),
            mk(6, { tipo: "recorrencia", insightId: "b" }),
            mk(7, { tipo: "atualizar-preco", insightId: "c" }),
            mk(2, { tipo: "link", href: "/x" }),
            mk(5, { tipo: "previsao" }),
        ]
        expect(paraQuemLe(xs, false).map((x) => x.ordem)).toEqual([2, 5])
        expect(paraQuemLe(xs, true)).toHaveLength(6)
    })
})
