import { beforeEach, describe, expect, it, vi } from "vitest"

import type { InstallmentPlanFormSavePayload } from "@/components/transactions/transaction-form-types"

vi.mock("@/lib/edge-invoke", () => ({ invokeEdgeJson: vi.fn(() => Promise.resolve()) }))
vi.mock("@/lib/credit-card-notifications", () => ({ scheduleEvaluateCreditCardAlerts: vi.fn() }))
vi.mock("@/lib/toast", () => ({ toastError: vi.fn(), toastSuccess: vi.fn() }))

const { persistInstallmentPlanCreate } = await import("@/components/transactions/transaction-form-persistence")

const payload: InstallmentPlanFormSavePayload = {
    categoryId: null,
    description: "Geladeira",
    firstBillingYmd: "2026-04-10",
    paymentMethod: "credit_card",
    paymentCreditCardId: "card-nu",
    totalInstallments: 3,
    installmentAmount: 100,
    finalInstallmentAmount: 100,
}

function clienteFalso(updateError: unknown = null) {
    const passos: string[] = []
    const eq = vi.fn((coluna: string, valor: string) => {
        passos.push(`eq:${coluna}=${valor}`)
        return Promise.resolve({ error: updateError })
    })
    const update = vi.fn((linha: Record<string, unknown>) => {
        passos.push(`update:${JSON.stringify(linha)}`)
        return { eq }
    })
    const supabase = {
        rpc: vi.fn(() => {
            passos.push("rpc")
            return Promise.resolve({ data: "plan-1", error: null })
        }),
        from: vi.fn(() => ({ update })),
    }
    return { supabase, update, passos }
}

describe("persistInstallmentPlanCreate", () => {
    beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}))

    it("marca as parcelas do plano com a origem depois da RPC, antes do onAfterSuccess", async () => {
        const { supabase, passos } = clienteFalso()
        const onAfterSuccess = vi.fn(async (planId?: string) => {
            passos.push(`after:${planId}`)
        })
        const r = await persistInstallmentPlanCreate({
            supabase: supabase as never,
            user: { id: "u" } as never,
            workspaceId: "ws-1",
            payload: { ...payload, source: "share", needsReview: true },
            onAfterSuccess,
        })
        expect(r).toEqual({ planId: "plan-1" })
        expect(passos).toEqual([
            "rpc",
            'update:{"source":"share","needs_review":true}',
            "eq:installment_plan_id=plan-1",
            "after:plan-1",
        ])
    })

    it("sem origem, não toca nas parcelas", async () => {
        const { supabase, update } = clienteFalso()
        await persistInstallmentPlanCreate({
            supabase: supabase as never,
            user: { id: "u" } as never,
            workspaceId: "ws-1",
            payload,
            onAfterSuccess: async () => {},
        })
        expect(update).not.toHaveBeenCalled()
    })

    it("a marca que falha só é registrada: o plano fica", async () => {
        const { supabase } = clienteFalso({ message: "rls" })
        const r = await persistInstallmentPlanCreate({
            supabase: supabase as never,
            user: { id: "u" } as never,
            workspaceId: "ws-1",
            payload: { ...payload, source: "quick_text", needsReview: true },
            onAfterSuccess: async () => {},
        })
        expect(r).toEqual({ planId: "plan-1" })
        expect(console.error).toHaveBeenCalled()
    })
})
