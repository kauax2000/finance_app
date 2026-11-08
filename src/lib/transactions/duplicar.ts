import type { PaymentMethod } from "@/lib/payment-methods"
import type { Transaction } from "@/lib/supabase"
import { localYmdFromDate } from "@/lib/transaction-date"

/** O que o criar abre ao duplicar uma linha (spec §6.4). */
export type ValoresDuplicados = {
    tipo: "expense" | "income"
    valor: number
    descricao: string
    /** `YYYY-MM-DD`: hoje. */
    data: string
    categoryId: string | null
    paymentMethod: PaymentMethod | null
    creditCardId: string | null
    projectId: string | null
    /** A cópia nunca nasce numa parcelada: vira o lançamento simples da parcela. */
    installmentPlanId: null
    needsReview: false
}

/** A cópia de `t` com a data de hoje; a parcela vira despesa simples e perde o "(k/n)". */
export function valoresDuplicados(t: Transaction, hoje: Date): ValoresDuplicados {
    const descricao = (t.description ?? "").replace(/ \(\d+\/\d+\)$/, "")
    return {
        tipo: t.type,
        valor: Number(t.amount),
        descricao,
        data: localYmdFromDate(hoje),
        categoryId: t.category_id ?? null,
        paymentMethod: (t.payment_method as PaymentMethod | null | undefined) ?? null,
        creditCardId: t.payment_method === "credit_card" ? (t.payment_credit_card_id ?? null) : null,
        projectId: t.project_id ?? null,
        installmentPlanId: null,
        needsReview: false,
    }
}
