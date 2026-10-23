import { beforeEach, describe, expect, it, vi } from "vitest"

import type { OfflineMutation } from "@/lib/offline/types"

const mutation = { id: "m1", entity: "transaction", operation: "insert", workspaceId: "w1", payload: {}, status: "pending", retryCount: 0 } as unknown as OfflineMutation

const mocks = vi.hoisted(() => ({
    sync: vi.fn(),
    updateMutation: vi.fn(async () => {}),
    removeMutation: vi.fn(async () => {}),
    toast: vi.fn(),
}))

vi.mock("@/lib/offline/handlers", () => ({ syncMutation: mocks.sync }))
vi.mock("@/lib/offline/connectivity", () => ({ isOnline: () => true }))
vi.mock("@/lib/offline/outbox", () => ({
    getPendingMutations: async () => [mutation],
    removeMutation: mocks.removeMutation,
    resetStaleSyncing: async () => 0,
    updateMutation: mocks.updateMutation,
}))
vi.mock("@/lib/toast", () => ({ toastErrorWithDescription: mocks.toast }))
vi.mock("@/lib/workspace-data-events", () => ({
    dispatchFinanceCategoriesMutated: vi.fn(),
    dispatchFinanceCreditCardsMutated: vi.fn(),
    dispatchFinanceSubscriptionsMutated: vi.fn(),
    dispatchFinanceTransactionsMutated: vi.fn(),
}))

const { processOutbox } = await import("@/lib/offline/sync-engine")
const { formatSupabasePostgrestError } = await import("@/lib/supabase-errors")

beforeEach(() => vi.clearAllMocks())

describe("sync-engine em só leitura", () => {
    it("a escrita barrada vira failed de uma vez, com a mensagem, e continua na fila", async () => {
        // O handler devolve o que `failure()` monta a partir do erro do Postgres.
        const error = formatSupabasePostgrestError({ code: "P0001", message: "workspace_somente_leitura" })
        mocks.sync.mockResolvedValue({ ok: false, error })

        await processOutbox()

        expect(mocks.updateMutation).toHaveBeenLastCalledWith("m1", {
            status: "failed",
            retryCount: 1,
            lastError: "Sua conta está em só leitura. Assine em Planos para voltar a lançar.",
        })
        expect(mocks.removeMutation).not.toHaveBeenCalled()
        expect(mocks.toast).toHaveBeenCalledOnce()
    })

    it("outro erro continua pending para a próxima tentativa", async () => {
        mocks.sync.mockResolvedValue({ ok: false, error: "Sem rede." })
        await processOutbox()
        expect(mocks.updateMutation).toHaveBeenLastCalledWith("m1", { status: "pending", retryCount: 1, lastError: "Sem rede." })
    })
})
