import { supabase, type CreditCard, type WorkspaceInstallmentPlan } from "@/lib/supabase"
import { formatSupabasePostgrestError, isPostgrestRelationMissingError, isWorkspaceInstallmentPlansTableMissingError, throwIfQueryError } from "@/lib/supabase-errors"
import { fetchCreditCardExpenseRows, type CcTxRow } from "@/lib/credit-cards-workspace-transactions"

export type CreditCardsPageBundle = {
    cards: CreditCard[]
    ccTransactions: CcTxRow[]
    installmentPlans: WorkspaceInstallmentPlan[]
    creditCardsTableMissing: boolean
}

export async function fetchCreditCardsPageBundle(
    workspaceId: string,
): Promise<CreditCardsPageBundle> {
    const [cardsRes, txPack, plansRes] = await Promise.all([
        supabase
            .from("credit_cards")
            .select("brand, closing_day, created_at, credit_limit, due_day, expiry_month, expiry_year, id, is_active, last_four, name, updated_at, user_id, workspace_id")
            .eq("workspace_id", workspaceId)
            .order("name"),
        fetchCreditCardExpenseRows(supabase, workspaceId),
        supabase
            .from("workspace_installment_plans")
            .select("billing_anchor_day, category_id, created_at, description, final_installment_amount, generated_count, id, installment_amount, is_active, next_billing_date, payment_credit_card_id, payment_method, total_installments, updated_at, user_id, workspace_id")
            .eq("workspace_id", workspaceId)
            .order("next_billing_date", { ascending: true }),
    ])

    let creditCardsTableMissing = false
    let cards: CreditCard[] = []

    if (cardsRes.error) {
        if (isPostgrestRelationMissingError(cardsRes.error)) {
            creditCardsTableMissing = true
        } else {
            throw new Error(
                formatSupabasePostgrestError(cardsRes.error) ??
                    "Não foi possível carregar os cartões.",
            )
        }
    } else {
        const list = (cardsRes.data as CreditCard[]) ?? []
        list.sort((a, b) => {
            if (a.is_active !== b.is_active) {
                return a.is_active ? -1 : 1
            }
            return a.name.localeCompare(b.name, "pt-BR")
        })
        cards = list
    }

    throwIfQueryError(txPack.error, "Não foi possível carregar os lançamentos dos cartões.")
    const ccTransactions = txPack.rows ?? []

    let installmentPlans: WorkspaceInstallmentPlan[] = []
    if (plansRes.error) {
        if (!isWorkspaceInstallmentPlansTableMissingError(plansRes.error)) {
            throwIfQueryError(plansRes.error, "Não foi possível carregar os parcelamentos.")
        }
    } else {
        installmentPlans = (plansRes.data as WorkspaceInstallmentPlan[]) ?? []
    }

    return {
        cards,
        ccTransactions,
        installmentPlans,
        creditCardsTableMissing,
    }
}
