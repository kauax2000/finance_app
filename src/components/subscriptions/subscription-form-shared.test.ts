import { describe, expect, it } from "vitest"
import {
    buildSubscriptionFormPayload,
    categoriesForKind,
    categoryIdForKind,
    SUBSCRIPTION_SELECT_NONE,
} from "./subscription-form-shared"

describe("buildSubscriptionFormPayload", () => {
    it("accepts valid payload with comma decimal", () => {
        const r = buildSubscriptionFormPayload({
            name: " Netflix ",
            amountStr: "29,90",
            billing: "monthly",
            billingDate: "2026-04-05",
            cId: SUBSCRIPTION_SELECT_NONE,
            n: "",
            active: true,
            paymentMethod: null,
            paymentCreditCardId: "",
        })
        expect(r.ok).toBe(true)
        if (r.ok) {
            expect(r.payload.name).toBe("Netflix")
            expect(r.payload.amount).toBe(29.9)
            expect(r.payload.billing_interval).toBe("monthly")
            expect(r.payload.start_date).toBe("2026-04-05")
            expect(r.payload.next_billing_date).toBe("2026-04-05")
            expect(r.payload.category_id).toBeNull()
            expect(r.payload.is_active).toBe(true)
            expect(r.payload.payment_method).toBeNull()
            expect(r.payload.payment_credit_card_id).toBeNull()
        }
    })

    it("stores credit card when method is credit_card", () => {
        const r = buildSubscriptionFormPayload({
            name: "Stream",
            amountStr: "10",
            billing: "monthly",
            billingDate: "2026-04-05",
            cId: SUBSCRIPTION_SELECT_NONE,
            n: "",
            active: true,
            paymentMethod: "credit_card",
            paymentCreditCardId: "card-uuid-1",
        })
        expect(r.ok).toBe(true)
        if (r.ok) {
            expect(r.payload.payment_method).toBe("credit_card")
            expect(r.payload.payment_credit_card_id).toBe("card-uuid-1")
        }
    })

    it("clears card id when method is not credit_card", () => {
        const r = buildSubscriptionFormPayload({
            name: "Stream",
            amountStr: "10",
            billing: "monthly",
            billingDate: "2026-04-05",
            cId: SUBSCRIPTION_SELECT_NONE,
            n: "",
            active: true,
            paymentMethod: "pix",
            paymentCreditCardId: "should-be-ignored",
        })
        expect(r.ok).toBe(true)
        if (r.ok) {
            expect(r.payload.payment_method).toBe("pix")
            expect(r.payload.payment_credit_card_id).toBeNull()
        }
    })

    it("rejects invalid amount", () => {
        const r = buildSubscriptionFormPayload({
            name: "X",
            amountStr: "abc",
            billing: "monthly",
            billingDate: "2026-04-05",
            cId: SUBSCRIPTION_SELECT_NONE,
            n: "",
            active: true,
            paymentMethod: null,
            paymentCreditCardId: "",
        })
        expect(r.ok).toBe(false)
        if (!r.ok) {
            expect(r.error).toContain("valor")
        }
    })

    it("rejects empty name", () => {
        const r = buildSubscriptionFormPayload({
            name: "   ",
            amountStr: "10",
            billing: "weekly",
            billingDate: "2026-04-05",
            cId: SUBSCRIPTION_SELECT_NONE,
            n: "",
            active: true,
            paymentMethod: null,
            paymentCreditCardId: "",
        })
        expect(r.ok).toBe(false)
        if (!r.ok) {
            expect(r.error).toContain("nome")
        }
    })

    it("accepts bimonthly billing interval", () => {
        const r = buildSubscriptionFormPayload({
            name: "Plano trimestral alternado",
            amountStr: "120",
            billing: "bimonthly",
            billingDate: "2026-04-05",
            cId: SUBSCRIPTION_SELECT_NONE,
            n: "",
            active: true,
            paymentMethod: null,
            paymentCreditCardId: "",
        })
        expect(r.ok).toBe(true)
        if (r.ok) {
            expect(r.payload.billing_interval).toBe("bimonthly")
        }
    })

    it("rejects empty billing date", () => {
        const r = buildSubscriptionFormPayload({
            name: "S",
            amountStr: "10",
            billing: "yearly",
            billingDate: "  ",
            cId: SUBSCRIPTION_SELECT_NONE,
            n: "",
            active: true,
            paymentMethod: null,
            paymentCreditCardId: "",
        })
        expect(r.ok).toBe(false)
        if (!r.ok) {
            expect(r.error).toContain("cobrança")
        }
    })
})

describe("buildSubscriptionFormPayload kind", () => {
    const opts = {
        name: "Salário",
        amountStr: "5000",
        billing: "monthly" as const,
        billingDate: "2026-04-05",
        cId: SUBSCRIPTION_SELECT_NONE,
        n: "",
        active: true,
        paymentMethod: "pix" as const,
        paymentCreditCardId: "",
    }

    it("defaults to expense", () => {
        const r = buildSubscriptionFormPayload(opts)
        expect(r.ok && r.payload.kind).toBe("expense")
    })

    it("income leaves out the credit card even if one was picked", () => {
        const r = buildSubscriptionFormPayload({
            ...opts,
            kind: "income",
            paymentMethod: "credit_card",
            paymentCreditCardId: "card-1",
        })
        expect(r.ok).toBe(true)
        if (r.ok) {
            expect(r.payload.kind).toBe("income")
            expect(r.payload.payment_method).toBeNull()
            expect(r.payload.payment_credit_card_id).toBeNull()
        }
    })
})

describe("categoria por tipo", () => {
    const despesas = [{ id: "d1", name: "Lazer", color: "#000" }]
    const receitas = [{ id: "r1", name: "Salário", color: "#000" }]

    it("a receita escolhe entre as categorias de receita", () => {
        expect(categoriesForKind("income", despesas, receitas)).toBe(receitas)
        expect(categoriesForKind("expense", despesas, receitas)).toBe(despesas)
    })

    it("ao trocar o tipo, a categoria do outro tipo cai; a que serve fica", () => {
        expect(categoryIdForKind("d1", "income", despesas, receitas)).toBe(SUBSCRIPTION_SELECT_NONE)
        expect(categoryIdForKind("r1", "expense", despesas, receitas)).toBe(SUBSCRIPTION_SELECT_NONE)
        expect(categoryIdForKind("r1", "income", despesas, receitas)).toBe("r1")
        expect(categoryIdForKind(SUBSCRIPTION_SELECT_NONE, "income", despesas, receitas)).toBe(SUBSCRIPTION_SELECT_NONE)
    })
})
