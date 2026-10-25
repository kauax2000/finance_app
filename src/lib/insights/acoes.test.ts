import { beforeEach, describe, expect, it, vi } from "vitest"

import { dados as dadosDaPrevisao, tx } from "@/lib/previsao/dados-de-teste"
import { lerFonte, semComentarios } from "@/test/fonte"

const db = vi.hoisted(() => {
    const state = {
        calls: [] as unknown[][],
        results: [] as { data: unknown; error: unknown }[],
    }
    const query: Record<string, unknown> = {}
    for (const method of ["from", "select", "in", "insert", "rpc"]) {
        query[method] = (...args: unknown[]) => {
            state.calls.push([method, ...args])
            return query
        }
    }
    query.then = (resolve: (v: unknown) => unknown) =>
        Promise.resolve(state.results.shift() ?? { data: null, error: null }).then(resolve)
    return { state, client: query }
})

const mut = vi.hoisted(() => ({
    updateSubscription: vi.fn(),
    deleteTransactionById: vi.fn(),
}))

vi.mock("@/lib/supabase", () => ({ supabase: db.client }))
vi.mock("@/lib/subscriptions/mutations", () => ({ updateSubscription: mut.updateSubscription }))
vi.mock("@/lib/transactions/mutations", () => ({ deleteTransactionById: mut.deleteTransactionById }))

const {
    apagarUm,
    atualizarPrecoDaAssinatura,
    linhaDoSeguroDoMes,
    proximoVencimentoDaRecorrencia,
    seguroEstaBaixo,
    sugerirValorVariavel,
    virarAssinatura,
    virarConta,
} = await import("./acoes")

const rpcs = () => db.state.calls.filter((c) => c[0] === "rpc")
const marcouUsado = () => rpcs().some((c) => c[1] === "marcar_insight" && (c[2] as { p_status: string }).p_status === "acted")

const recorrencia = {
    id: "ins-1",
    workspace_id: "ws-1",
    kind: "recorrencia",
    status: "new",
    created_at: "2026-10-20T13:00:00Z",
    payload: {
        nome: "Academia",
        valorMedio: 99.9,
        dia: 5,
        destino: "conta",
        lancamentos: ["t1", "t2", "t3"],
        payment_method: "pix",
        card_id: null,
        category_id: "cat-1",
    },
}
const ajustes = { nome: " Academia ", valor: 99.9, dia: 5, categoryId: "cat-1", valorVariavel: false }

beforeEach(() => {
    db.state.calls = []
    db.state.results = []
    mut.updateSubscription.mockReset()
    mut.deleteTransactionById.mockReset()
})

describe("virarAssinatura", () => {
    it("chama a RPC com o nome aparado e os dados do cartão do payload", async () => {
        const r = await virarAssinatura({ ...recorrencia, payload: { ...recorrencia.payload, payment_method: "credit_card", card_id: "card-1" } }, ajustes)
        expect(r).toEqual({ ok: true })
        expect(rpcs()).toEqual([
            [
                "rpc",
                "virar_assinatura",
                {
                    p_insight_id: "ins-1",
                    p_nome: "Academia",
                    p_valor: 99.9,
                    p_dia: 5,
                    p_payment_method: "credit_card",
                    p_card_id: "card-1",
                    p_category_id: "cat-1",
                },
            ],
        ])
    })

    it("INSIGHT_JA_USADO vira \"Isso já foi feito.\"", async () => {
        db.state.results = [{ data: null, error: { message: "INSIGHT_JA_USADO", code: "P0001" } }]
        expect(await virarAssinatura(recorrencia, ajustes)).toEqual({ ok: false, erro: "Isso já foi feito." })
    })

    it.each([
        ["INSIGHT_NOME_INVALIDO", "Dê um nome."],
        ["INSIGHT_TIPO_INVALIDO", "Este insight não aceita essa ação."],
        ["INSIGHT_GRANDE_DEMAIS", "Os dados deste insight passaram do tamanho aceito."],
    ])("%s tem frase própria", async (codigo, frase) => {
        db.state.results = [{ data: null, error: { message: codigo, code: "22023" } }]
        expect(await virarAssinatura(recorrencia, ajustes)).toEqual({ ok: false, erro: frase })
    })
})

describe("virarConta", () => {
    it("a próxima pendente é o mês seguinte ao último lançamento, no dia escolhido", async () => {
        db.state.results = [
            {
                data: [
                    { date: "2026-08-05T15:00:00+00:00", amount: 100 },
                    { date: "2026-10-04T15:00:00+00:00", amount: 100 },
                    { date: "2026-09-06T15:00:00+00:00", amount: 100 },
                ],
                error: null,
            },
        ]
        expect(await virarConta(recorrencia, { ...ajustes, dia: 10, valorVariavel: true })).toEqual({ ok: true })
        expect(db.state.calls[0]).toEqual(["from", "transactions"])
        expect(rpcs()).toEqual([
            [
                "rpc",
                "virar_conta",
                {
                    p_insight_id: "ins-1",
                    p_nome: "Academia",
                    p_dia: 10,
                    p_valor_variavel: true,
                    p_category_id: "cat-1",
                    p_next_due_date: "2026-11-10",
                },
            ],
        ])
    })

    it("o erro da RPC volta em português e nada mais é marcado", async () => {
        db.state.results = [{ data: [], error: null }, { data: null, error: { message: "INSIGHT_JA_USADO" } }]
        expect(await virarConta(recorrencia, ajustes)).toEqual({ ok: false, erro: "Isso já foi feito." })
        expect(rpcs()).toHaveLength(1)
    })
})

describe("proximoVencimentoDaRecorrencia e sugerirValorVariavel", () => {
    it("sem lançamento, o primeiro dia de vencimento a partir de hoje", () => {
        expect(proximoVencimentoDaRecorrencia([], 5, "2026-10-25")).toBe("2026-11-05")
        expect(proximoVencimentoDaRecorrencia([], 28, "2026-10-25")).toBe("2026-10-28")
    })

    it("acima de 5% de variação sugere valor variável", () => {
        expect(sugerirValorVariavel([100, 105])).toBe(false)
        expect(sugerirValorVariavel([100, 105.5])).toBe(true)
        expect(sugerirValorVariavel([])).toBe(false)
    })
})

describe("atualizarPrecoDaAssinatura", () => {
    const preco = {
        ...recorrencia,
        kind: "preco_assinatura",
        payload: { assinaturaId: "sub-1", nome: "Netflix", de: 39.9, para: 44.9, lancamentoId: "t9" },
    }

    it("usa a mutação de assinatura e só então marca usado", async () => {
        mut.updateSubscription.mockResolvedValue({ ok: true })
        expect(await atualizarPrecoDaAssinatura(preco)).toEqual({ ok: true })
        expect(mut.updateSubscription).toHaveBeenCalledWith({
            workspaceId: "ws-1",
            subscriptionId: "sub-1",
            payload: { amount: 44.9 },
        })
        expect(rpcs()).toEqual([["rpc", "marcar_insight", { p_id: "ins-1", p_status: "acted" }]])
    })

    it("com erro na mutação, não marca", async () => {
        mut.updateSubscription.mockResolvedValue({ ok: false, errorMessage: "Sem permissão." })
        expect(await atualizarPrecoDaAssinatura(preco)).toEqual({ ok: false, erro: "Sem permissão." })
        expect(marcouUsado()).toBe(false)
    })
})

describe("apagarUm", () => {
    const dup = {
        ...recorrencia,
        kind: "duplicidade",
        payload: { ids: ["b-2", "a-1"], valor: 50, descricao: "Mercado", dataYmd: "2026-10-20" },
    }

    it("pergunta, apaga o de id maior e marca usado", async () => {
        mut.deleteTransactionById.mockResolvedValue({ ok: true })
        const confirmar = vi.fn(() => true)
        expect(await apagarUm(dup, confirmar)).toEqual({ ok: true })
        expect(confirmar).toHaveBeenCalledOnce()
        expect(mut.deleteTransactionById).toHaveBeenCalledWith("b-2", "ws-1")
        expect(marcouUsado()).toBe(true)
    })

    it("sem confirmação, nada acontece", async () => {
        expect(await apagarUm(dup, () => false)).toEqual({ ok: false, erro: null })
        expect(mut.deleteTransactionById).not.toHaveBeenCalled()
        expect(rpcs()).toEqual([])
    })

    it("com erro ao apagar, não marca", async () => {
        mut.deleteTransactionById.mockResolvedValue({ ok: false, errorMessage: "Falhou." })
        expect(await apagarUm(dup, () => true)).toEqual({ ok: false, erro: "Falhou." })
        expect(marcouUsado()).toBe(false)
    })
})

describe("seguro baixo", () => {
    const s = (seguro: number, recebidas: number, previstas = 0) => ({ seguro, receitas: { recebidas, previstas } })

    it("abaixo de 10% da renda do mês dispara", () => {
        expect(seguroEstaBaixo(s(399.99, 3000, 1000))).toBe(true)
        expect(seguroEstaBaixo(s(400, 3000, 1000))).toBe(false)
        expect(seguroEstaBaixo(s(-50, 1000))).toBe(true)
    })

    it("sem renda, não dispara", () => {
        expect(seguroEstaBaixo(s(-100, 0))).toBe(false)
    })
})

describe("linhaDoSeguroDoMes", () => {
    it("sobra dentro do mês é cumprido", () => {
        const d = dadosDaPrevisao({ hojeYmd: "2026-10-25", transacoes: [tx("income", 1000, "2026-09-10"), tx("expense", 300, "2026-09-12")] })
        expect(linhaDoSeguroDoMes(d, "2026-09")).toBe("Seguro para gastar: cumprido")
    })

    it("gasto acima do que entrou (com a reserva) diz quanto passou", () => {
        const d = dadosDaPrevisao({
            hojeYmd: "2026-10-25",
            reserva: 50,
            transacoes: [tx("income", 100, "2026-09-10"), tx("expense", 300, "2026-09-12")],
        })
        expect(linhaDoSeguroDoMes(d, "2026-09")).toMatch(/^Seguro para gastar: passou R\$\s250,00$/)
    })
})

describe("fonte", () => {
    const fonte = (f: string) => semComentarios(lerFonte(f), "tudo")

    it("o Painel monta a caixa de insights", () => {
        expect(fonte("src/app/(app)/dashboard/page-client.tsx")).toMatch(
            /import\s*\{[^}]*\bInsightsDoPainel\b[^}]*\}\s*from\s*["']@\/components\/wireframe\/insights-wireframe["']/,
        )
        expect(fonte("src/app/(app)/dashboard/page-client.tsx")).toContain("<InsightsDoPainel")
    })

    it("a caixa: rótulo da ação ou Entendi, silenciar no <details>, recorrência num <dialog>", () => {
        const f = fonte("src/components/wireframe/insights-wireframe.tsx")
        expect(f).toContain('titulo="Insights"')
        expect(f).toContain("Entendi")
        expect(f).toContain("Não mostrar mais este tipo")
        expect(f).toContain("<details")
        expect(f).toContain("<dialog")
        expect(f).toContain("showModal()")
        expect(f.match(/type="submit"/g)).toHaveLength(1)
    })

    it("as preferências ganham a chave Insights", () => {
        expect(fonte("src/app/(app)/settings/page-client.tsx")).toContain("<InsightsAvisoWireframe")
        expect(fonte("src/components/wireframe/insights-wireframe.tsx")).toContain("notify_insights")
    })
})
