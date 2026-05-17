import { supabase, type CreditCard, type WorkspaceInstallmentPlan } from "@/lib/supabase"
import {
    formatSupabasePostgrestError,
    isPostgrestRelationMissingError,
    isWorkspaceInstallmentPlansTableMissingError,
} from "@/lib/supabase-errors"
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
            .select("*")
            .eq("workspace_id", workspaceId)
            .order("name"),
        fetchCreditCardExpenseRows(supabase, workspaceId),
        supabase
            .from("workspace_installment_plans")
            .select("*")
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

    const ccTransactions = txPack.error ? [] : (txPack.rows ?? [])

    let installmentPlans: WorkspaceInstallmentPlan[] = []
    if (plansRes.error) {
        if (!isWorkspaceInstallmentPlansTableMissingError(plansRes.error)) {
            /* keep empty; non-fatal for page */
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
