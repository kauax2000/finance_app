import { beforeEach, describe, expect, it, vi } from "vitest"

import type { TransactionFormSavePayload } from "@/components/transactions/transaction-form-types"

// O id do lançamento sai do salvar online e falta na fila offline: a foto do
// recibo só se anexa com ele.
const online = { atual: true }
const upsert = vi.fn()
const enqueueMutation = vi.fn(async () => ({ id: "mut-1" }))

vi.mock("@/lib/offline/connectivity", () => ({ isOnline: () => online.atual }))
vi.mock("@/lib/offline/outbox", () => ({ enqueueMutation }))
vi.mock("@/lib/workspace-data-events", () => ({ dispatchFinanceTransactionsMutated: vi.fn() }))
vi.mock("@/lib/supabase", () => ({
    supabase: {
        from: () => ({ upsert: (...a: unknown[]) => upsert(...a) }),
    },
}))
vi.mock("@/lib/edge-invoke", () => ({ invokeEdgeJson: vi.fn(() => Promise.resolve()) }))
vi.mock("@/lib/credit-card-notifications", () => ({ scheduleEvaluateCreditCardAlerts: vi.fn() }))
vi.mock("@/lib/toast", () => ({ toastError: vi.fn(), toastSuccess: vi.fn() }))

const { saveTransaction } = await import("@/lib/transactions/mutations")
const { persistTransactionSave } = await import("@/lib/transaction-detail-sheet-mutations")

const payload: TransactionFormSavePayload = {
    editingId: null,
    categoryId: null,
    type: "income",
    amount: 42,
    description: "Recibo",
    dateIso: "2026-04-10T12:00:00.000Z",
    isRecurring: false,
    recurringInterval: null,
    paymentMethod: null,
    paymentCreditCardId: null,
}

function inserido(resposta: { data: unknown; error: unknown }) {
    upsert.mockReturnValue({ select: () => ({ single: async () => resposta }) })
}

const ctx = { userId: "u", workspaceId: "ws-1" }

describe("saveTransaction devolve o id", () => {
    beforeEach(() => {
        upsert.mockReset()
        enqueueMutation.mockClear()
        online.atual = true
    })

    it("online, o id da linha criada", async () => {
        inserido({ data: { id: "tx-1" }, error: null })
        expect(await saveTransaction(ctx, { ...payload, description: "a" })).toEqual({ ok: true, id: "tx-1" })
    })

    it("offline, na fila e sem id", async () => {
        online.atual = false
        expect(await saveTransaction(ctx, { ...payload, description: "b" })).toEqual({ ok: true })
        expect(enqueueMutation).toHaveBeenCalledOnce()
        expect(upsert).not.toHaveBeenCalled()
    })

    it("o erro do banco segue como erro", async () => {
        inserido({ data: null, error: { message: "falhou", code: "XX000" } })
        const r = await saveTransaction(ctx, { ...payload, description: "c" })
        expect(r.ok).toBe(false)
    })
})

describe("persistTransactionSave devolve { id } ou false", () => {
    const base = {
        supabase: {} as never,
        user: { id: "u" } as never,
        workspaceId: "ws-1",
        resolveEditingTransaction: () => null,
    }

    beforeEach(() => {
        upsert.mockReset()
        online.atual = true
    })

    it("online: { id } e o onAfterSuccess recebe o id", async () => {
        inserido({ data: { id: "tx-2" }, error: null })
        const onAfterSuccess = vi.fn(async () => {})
        expect(await persistTransactionSave({ ...base, payload: { ...payload, description: "d" }, onAfterSuccess })).toEqual({
            id: "tx-2",
        })
        expect(onAfterSuccess).toHaveBeenCalledWith("tx-2")
    })

    it("offline: { id: undefined }", async () => {
        online.atual = false
        const r = await persistTransactionSave({ ...base, payload: { ...payload, description: "e" }, onAfterSuccess: async () => {} })
        expect(r).toEqual({ id: undefined })
    })

    it("falha: false", async () => {
        inserido({ data: null, error: { message: "falhou", code: "XX000" } })
        const r = await persistTransactionSave({ ...base, payload: { ...payload, description: "f" }, onAfterSuccess: async () => {} })
        expect(r).toBe(false)
    })
})
