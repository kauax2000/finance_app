import { describe, expect, it } from "vitest"
import type { Transaction } from "@/lib/supabase"
import { valoresDuplicados } from "./duplicar"

const base = {
    id: "t1",
    user_id: "u",
    type: "expense",
    amount: 109.95,
    description: "Lentes (1/2)",
    date: "2026-10-06",
    category_id: "cat",
    payment_method: "credit_card",
    payment_credit_card_id: "card",
    installment_plan_id: "plan",
    installment_sequence: 1,
    needs_review: true,
    project_id: "proj",
} as unknown as Transaction

describe("valoresDuplicados", () => {
    it("a parcela vira despesa simples de hoje, sem o (k/n)", () => {
        const v = valoresDuplicados(base, new Date(2026, 10, 7, 15))
        expect(v).toEqual({
            tipo: "expense",
            valor: 109.95,
            descricao: "Lentes",
            data: "2026-11-07",
            categoryId: "cat",
            paymentMethod: "credit_card",
            creditCardId: "card",
            projectId: "proj",
            installmentPlanId: null,
            needsReview: false,
        })
    })
    it("fora do crédito não leva cartão; descrição sem (k/n) fica igual", () => {
        const v = valoresDuplicados(
            { ...base, description: "Mercado (do bairro)", payment_method: "pix" } as Transaction,
            new Date(2026, 10, 7),
        )
        expect(v.descricao).toBe("Mercado (do bairro)")
        expect(v.creditCardId).toBeNull()
    })
})
