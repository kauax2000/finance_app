import { describe, expect, it, vi } from "vitest"
import type { SupabaseClient, User } from "@supabase/supabase-js"
import type { PayBillInput } from "./pay-bill-flow"

vi.mock("@/lib/supabase", () => ({ supabase: {} }))

const { executePayBillFlow } = await import("./pay-bill-flow")

describe("executePayBillFlow", () => {
    it("uma data no futuro bloqueia o pagamento", async () => {
        vi.useFakeTimers({ now: new Date(2026, 10, 15, 12) })
        const rpc = vi.fn()
        const r = await executePayBillFlow({
            supabase: { rpc } as unknown as SupabaseClient,
            user: { id: "u1" } as User,
            workspaceId: "w1",
            input: {
                kind: "regular",
                instance: { id: "i1", due_date: "2026-11-10" },
                bill: { frequency: "monthly", due_day_of_month: 10, end_date: null, is_active: true },
            } as unknown as PayBillInput,
            payload: {
                amount: 10,
                paidDateYmd: "2026-11-16",
                categoryId: "c1",
                paymentMethod: null,
                paymentCreditCardId: null,
                description: null,
            },
        })
        expect(r).toEqual({ ok: false, error: "A data do pagamento não pode ser depois de hoje." })
        expect(rpc).not.toHaveBeenCalled()
        vi.useRealTimers()
    })
})
