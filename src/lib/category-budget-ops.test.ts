import { beforeEach, describe, expect, it, vi } from "vitest"

const rpc = vi.fn()
const selectId = vi.fn()
vi.mock("@/lib/supabase", () => ({
    supabase: {
        rpc: (...a: unknown[]) => rpc(...a),
        from: () => ({ update: () => ({ eq: () => ({ select: (...a: unknown[]) => selectId(...a) }) }) }),
    },
}))
import {
    buildBudgetRow,
    definirRepeticao,
    garantirOrcamentosDoMes,
    resetGarantidosParaTeste,
} from "@/lib/category-budget-ops"

const base = {
    userId: "u1",
    workspaceId: "w1",
    categoryId: "c1",
    yearMonth: "2026-10",
    amount: 500,
}

describe("buildBudgetRow", () => {
    it("valor mudou: zera os três avisos para rearmar", () => {
        expect(buildBudgetRow({ ...base, previousAmount: 400 })).toMatchObject({
            threshold_80_sent_at: null,
            threshold_100_sent_at: null,
            threshold_over_sent_at: null,
        })
    })

    it("mesmo valor ou sem valor anterior: não mexe nos avisos", () => {
        for (const previousAmount of [500, undefined, null]) {
            const row = buildBudgetRow({ ...base, previousAmount })
            expect(row).not.toHaveProperty("threshold_80_sent_at")
            expect(row).not.toHaveProperty("threshold_100_sent_at")
            expect(row).not.toHaveProperty("threshold_over_sent_at")
        }
    })
})

describe("buildBudgetRow repeats", () => {
    it("sem repeats a linha não leva a coluna (insert usa o padrão do banco, update mantém)", () => {
        expect(buildBudgetRow(base)).not.toHaveProperty("repeats")
    })

    it("leva repeats quando a pessoa definiu", () => {
        expect(buildBudgetRow({ ...base, repeats: true }).repeats).toBe(true)
        expect(buildBudgetRow({ ...base, repeats: false }).repeats).toBe(false)
    })
})

describe("garantirOrcamentosDoMes", () => {
    beforeEach(() => {
        rpc.mockReset()
        resetGarantidosParaTeste()
    })

    it("chama o RPC uma vez por carteira e mês, e de novo num mês novo", async () => {
        rpc.mockResolvedValue({ data: 0, error: null })
        const onCopied = vi.fn()
        await garantirOrcamentosDoMes("w1", "2026-10", onCopied)
        await garantirOrcamentosDoMes("w1", "2026-10", onCopied)
        expect(rpc).toHaveBeenCalledTimes(1)
        expect(rpc).toHaveBeenCalledWith("garantir_orcamentos_do_mes", { p_workspace_id: "w1" })
        await garantirOrcamentosDoMes("w1", "2026-11", onCopied)
        await garantirOrcamentosDoMes("w2", "2026-11", onCopied)
        expect(rpc).toHaveBeenCalledTimes(3)
        expect(onCopied).not.toHaveBeenCalled()
    })

    it("copiou linhas: avisa; erro: console.error e tenta de novo", async () => {
        const onCopied = vi.fn()
        rpc.mockResolvedValueOnce({ data: 3, error: null })
        await garantirOrcamentosDoMes("w1", "2026-10", onCopied)
        expect(onCopied).toHaveBeenCalledTimes(1)

        const err = vi.spyOn(console, "error").mockImplementation(() => {})
        rpc.mockResolvedValueOnce({ data: null, error: { message: "x" } })
        await garantirOrcamentosDoMes("w2", "2026-10", onCopied)
        expect(err).toHaveBeenCalled()
        rpc.mockResolvedValueOnce({ data: 0, error: null })
        await garantirOrcamentosDoMes("w2", "2026-10", onCopied)
        expect(rpc).toHaveBeenCalledTimes(3)
        err.mockRestore()
    })

    it("duas telas abrem com o pedido no ar: um RPC só, e as duas buscam de novo", async () => {
        let resolver!: (v: { data: number; error: null }) => void
        rpc.mockReturnValueOnce(new Promise((r) => (resolver = r)))
        const painel = vi.fn()
        const categorias = vi.fn()
        const a = garantirOrcamentosDoMes("w4", "2026-10", painel)
        const b = garantirOrcamentosDoMes("w4", "2026-10", categorias)
        resolver({ data: 2, error: null })
        await Promise.all([a, b])
        expect(rpc).toHaveBeenCalledTimes(1)
        expect(painel).toHaveBeenCalledTimes(1)
        expect(categorias).toHaveBeenCalledTimes(1)

        const depois = vi.fn()
        await garantirOrcamentosDoMes("w4", "2026-10", depois)
        expect(rpc).toHaveBeenCalledTimes(1)
        expect(depois).not.toHaveBeenCalled()
    })

    it("rejeição lançada também libera a chave", async () => {
        const err = vi.spyOn(console, "error").mockImplementation(() => {})
        rpc.mockRejectedValueOnce(new Error("rede"))
        await garantirOrcamentosDoMes("w3", "2026-10", vi.fn())
        rpc.mockResolvedValueOnce({ data: 0, error: null })
        await garantirOrcamentosDoMes("w3", "2026-10", vi.fn())
        expect(rpc).toHaveBeenCalledTimes(2)
        err.mockRestore()
    })
})

describe("definirRepeticao", () => {
    beforeEach(() => selectId.mockReset())

    it("sucesso com linha afetada", async () => {
        selectId.mockResolvedValue({ data: [{ id: "b1" }], error: null })
        expect(await definirRepeticao("b1", false)).toEqual({ ok: true })
    })

    it("nenhuma linha afetada é falha", async () => {
        selectId.mockResolvedValue({ data: [], error: null })
        expect(await definirRepeticao("b1", false)).toEqual({
            ok: false,
            erro: "Não foi possível alterar este orçamento.",
        })
    })

    it("sem conexão: falha clara sem chamar o Supabase", async () => {
        vi.stubGlobal("navigator", { onLine: false })
        try {
            expect(await definirRepeticao("b1", true)).toEqual({
                ok: false,
                erro: "Sem conexão. Tente de novo quando voltar a internet.",
            })
            expect(selectId).not.toHaveBeenCalled()
        } finally {
            vi.unstubAllGlobals()
        }
    })
})
