import type { PostgrestError } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { periodBoundsFromYearMonth } from "@/lib/budget-month"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { executeMutation } from "@/lib/offline/mutation-gateway"

export type CategoryBudgetUpsertInput = {
    userId: string
    workspaceId: string
    categoryId: string
    yearMonth: string
    amount: number
    budgetId?: string | null
}

function buildBudgetRow(input: CategoryBudgetUpsertInput, clientId?: string) {
    const { period_start, period_end } = periodBoundsFromYearMonth(input.yearMonth)
    const yearInt = Number(input.yearMonth.slice(0, 4))
    const monthOfYearInt = Number(input.yearMonth.slice(5, 7))

    return {
        user_id: input.userId,
        workspace_id: input.workspaceId,
        category_id: input.categoryId,
        year: yearInt,
        month: monthOfYearInt,
        period_start,
        period_end,
        amount: input.amount,
        ...(clientId ? { client_id: clientId } : {}),
    }
}

export async function upsertCategoryBudget(
    input: CategoryBudgetUpsertInput,
): Promise<{ error: PostgrestError | null }> {
    const clientId = crypto.randomUUID()
    const row = buildBudgetRow(input, clientId)
    const operation = input.budgetId ? "update" : "insert"
    const offlinePayload = input.budgetId
        ? { ...row, serverId: input.budgetId }
        : row

    const gateway = await executeMutation({
        entity: "budget",
        operation,
        workspaceId: input.workspaceId,
        idempotencyKey: clientId,
        offlinePayload,
        onlineFn: async () => {
            const { error } = await supabase.from("budgets").upsert(row, {
                onConflict: "user_id,category_id,period_start",
            })
            if (error) {
                throw new Error(
                    formatSupabasePostgrestError(error) ??
                        "Não foi possível salvar o orçamento."
                )
            }
            return { ok: true as const }
        },
    })

    if (!gateway.ok) {
        return {
            error: {
                message: gateway.errorMessage,
                details: "",
                hint: "",
                code: "offline",
            } as PostgrestError,
        }
    }

    return { error: null }
}

export async function deleteCategoryBudgetById(
    budgetId: string,
    workspaceId: string,
): Promise<{ error: PostgrestError | null }> {
    const gateway = await executeMutation({
        entity: "budget",
        operation: "delete",
        workspaceId,
        offlinePayload: { serverId: budgetId, id: budgetId },
        onlineFn: async () => {
            const { error } = await supabase.from("budgets").delete().eq("id", budgetId)
            if (error) {
                throw new Error(
                    formatSupabasePostgrestError(error) ??
                        "Não foi possível remover o orçamento."
                )
            }
            return { ok: true as const }
        },
    })

    if (!gateway.ok) {
        return {
            error: {
                message: gateway.errorMessage,
                details: "",
                hint: "",
                code: "offline",
            } as PostgrestError,
        }
    }

    return { error: null }
}
