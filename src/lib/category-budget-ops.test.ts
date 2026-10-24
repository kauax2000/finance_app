import { beforeEach, describe, expect, it, vi } from "vitest"

const rpc = vi.fn()
vi.mock("@/lib/supabase", () => ({ supabase: { rpc: (...a: unknown[]) => rpc(...a) } }))
import {
    buildBudgetRow,
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
    it("repete por padrão e respeita o falso", () => {
        expect(buildBudgetRow(base).repeats).toBe(true)
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
})
