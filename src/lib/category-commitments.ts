import { roundCents } from "@/lib/money-brl"
import type {
    Category,
    CreditCard,
    Transaction,
    WorkspaceInstallmentPlan,
    WorkspaceSubscription,
} from "@/lib/supabase"
import { localYmdFromDate, transactionLocalYmd } from "@/lib/transaction-date"
import { paddedBoundsForYearMonth, periodBoundsFromYearMonth } from "@/lib/budget-month"
import {
    buildCreditCardClosingLookup,
    projectedChargeCountsInExpenseMonth,
    sinalNaDespesa,
    projectedSubscriptionCountsInExpenseMonth,
    transactionCountsInExpenseMonth,
    type CreditCardClosingLookup,
} from "@/lib/expense-month-attribution"
import {
    buildGlobalInstallmentDedupeKeys,
    expandRemainingInstallmentCharges,
    isProjectedChargeAlreadyPosted,
} from "@/lib/credit-card-installment-projection"
import { expandSubscriptionChargesInYmdRange } from "@/lib/subscription-billing-projection"

export type CategoryCommitmentTotals = {
    postedTotal: number
    projectedInstallmentsTotal: number
    projectedSubscriptionsTotal: number
    committedTotal: number
}

export type CategoryCommitmentsById = Record<string, CategoryCommitmentTotals>

function ensureBucket(out: CategoryCommitmentsById, categoryId: string): CategoryCommitmentTotals {
    const prev = out[categoryId]
    if (prev) return prev
    const next = {
        postedTotal: 0,
        projectedInstallmentsTotal: 0,
        projectedSubscriptionsTotal: 0,
        committedTotal: 0,
    }
    out[categoryId] = next
    return next
}

function subscriptionChargeInMonth(
    chargeDate: Date,
    sub: WorkspaceSubscription,
    yearMonth: string,
    period_start: string,
    period_end: string,
    closingLookup: CreditCardClosingLookup,
): boolean {
    if (sub.payment_method === "credit_card" && sub.payment_credit_card_id) {
        return projectedSubscriptionCountsInExpenseMonth(
            chargeDate,
            sub,
            yearMonth,
            closingLookup,
        )
    }
    const ymd = localYmdFromDate(chargeDate)
    return ymd >= period_start && ymd <= period_end
}

export function buildCategoryCommitmentsForMonth(args: {
    yearMonth: string
    transactions: Pick<
        Transaction,
        | "type"
        | "amount"
        | "date"
        | "category_id"
        | "subscription_id"
        | "installment_plan_id"
        | "installment_sequence"
        | "payment_method"
        | "payment_credit_card_id"
    >[]
    installmentPlans: WorkspaceInstallmentPlan[]
    subscriptions: WorkspaceSubscription[]
    creditCards?: Pick<CreditCard, "id" | "closing_day">[]
}): CategoryCommitmentsById {
    const { period_start, period_end } = periodBoundsFromYearMonth(args.yearMonth)
    const { padStart, padEnd } = paddedBoundsForYearMonth(args.yearMonth)
    const closingLookup: CreditCardClosingLookup = buildCreditCardClosingLookup(
        args.creditCards ?? [],
    )
    const out: CategoryCommitmentsById = {}

    // O estorno no cartão abate a categoria dele no mês do fechamento.
    for (const t of args.transactions) {
        const sinal = sinalNaDespesa(t)
        if (!sinal) continue
        const categoryId = t.category_id
        if (!categoryId) continue
        if (!transactionCountsInExpenseMonth(t, args.yearMonth, closingLookup)) continue
        const b = ensureBucket(out, categoryId)
        b.postedTotal += sinal * (Number(t.amount) || 0)
    }

    const installmentDedupe = buildGlobalInstallmentDedupeKeys(args.transactions)
    const postedBySubscriptionDay = new Set<string>()
    for (const t of args.transactions) {
        if (t.type !== "expense") continue
        const sid = t.subscription_id
        if (!sid) continue
        const ymd = transactionLocalYmd((t as Pick<Transaction, "date">).date)
        if (!ymd) continue
        postedBySubscriptionDay.add(`${sid}:${ymd}`)
    }

    for (const p of args.installmentPlans) {
        if (!p.is_active) continue
        const categoryId = p.category_id
        if (!categoryId) continue
        for (const charge of expandRemainingInstallmentCharges(p)) {
            const inMonth =
                p.payment_method === "credit_card" && p.payment_credit_card_id
                    ? projectedChargeCountsInExpenseMonth(
                          charge.chargeDate,
                          p,
                          args.yearMonth,
                          closingLookup,
                      )
                    : (() => {
                          const ymd = localYmdFromDate(charge.chargeDate)
                          return ymd >= period_start && ymd <= period_end
                      })()
            if (!inMonth) continue
            if (isProjectedChargeAlreadyPosted(charge, installmentDedupe)) continue
            const b = ensureBucket(out, categoryId)
            b.projectedInstallmentsTotal += Number(charge.amount) || 0
        }
    }

    for (const s of args.subscriptions) {
        if (!s.is_active || s.kind === "income") continue
        const categoryId = s.category_id
        if (!categoryId) continue
        const rangeStart =
            s.payment_method === "credit_card" && s.payment_credit_card_id
                ? padStart
                : period_start
        const rangeEnd =
            s.payment_method === "credit_card" && s.payment_credit_card_id
                ? padEnd
                : period_end
        for (const charge of expandSubscriptionChargesInYmdRange(s, rangeStart, rangeEnd)) {
            if (
                !subscriptionChargeInMonth(
                    charge.chargeDate,
                    s,
                    args.yearMonth,
                    period_start,
                    period_end,
                    closingLookup,
                )
            ) {
                continue
            }
            if (postedBySubscriptionDay.has(`${s.id}:${charge.chargeYmd}`)) continue
            const b = ensureBucket(out, categoryId)
            b.projectedSubscriptionsTotal += charge.amount
        }
    }

    for (const [categoryId, b] of Object.entries(out)) {
        out[categoryId] = {
            ...b,
            postedTotal: roundCents(Number(b.postedTotal) || 0),
            projectedInstallmentsTotal: roundCents(Number(b.projectedInstallmentsTotal) || 0),
            projectedSubscriptionsTotal: roundCents(Number(b.projectedSubscriptionsTotal) || 0),
            committedTotal: roundCents(
                (Number(b.postedTotal) || 0) +
                    (Number(b.projectedInstallmentsTotal) || 0) +
                    (Number(b.projectedSubscriptionsTotal) || 0),
            ),
        }
    }
    return out
}

/**
 * O total do mês da tela de Categorias: só as categorias de despesa. O estorno
 * antigo, gravado numa de receita, deixaria um balde negativo abatendo o total.
 */
export function totalDasDespesas(
    categories: Pick<Category, "id" | "type">[],
    spendByCategoryId: Record<string, number>,
): number {
    return categories
        .filter((c) => c.type === "expense")
        .reduce((sum, c) => sum + (spendByCategoryId[c.id] ?? 0), 0)
}

/**
 * O gráfico "Despesa por categoria" do Painel: as linhas já no mês (o estorno no
 * cartão pelo fechamento). O estorno abate a categoria de despesa dele; sem
 * categoria ele não tem de onde abater.
 */
export function despesaPorCategoria(
    transactions: Pick<
        Transaction,
        "type" | "amount" | "category_id" | "payment_method" | "payment_credit_card_id"
    >[],
    categories: Pick<Category, "id" | "name" | "type" | "color">[],
): { id: string; name: string; value: number; color: string }[] {
    const spendById = new Map<string, number>()
    for (const t of transactions) {
        const sinal = sinalNaDespesa(t)
        // O estorno sem categoria não abate o balde "Sem categoria", de propósito.
        if (!sinal || (sinal < 0 && !t.category_id)) continue
        const id = t.category_id ?? "__none__"
        spendById.set(id, (spendById.get(id) ?? 0) + sinal * Number(t.amount))
    }

    const rows: { id: string; name: string; value: number; color: string }[] = categories
        .filter((c) => c.type === "expense")
        .map((c) => ({
            id: c.id,
            name: c.name,
            value: roundCents(spendById.get(c.id) ?? 0),
            // Sem cor gravada, quem decide é a rampa do gráfico (ver `resolveFill`).
            color: c.color ?? "",
        }))

    rows.push({
        id: "__none__",
        name: "Sem categoria",
        value: roundCents(spendById.get("__none__") ?? 0),
        color: "",
    })

    rows.sort((a, b) => {
        if (b.value !== a.value) return b.value - a.value
        return a.name.localeCompare(b.name, "pt-BR")
    })

    return rows
}
