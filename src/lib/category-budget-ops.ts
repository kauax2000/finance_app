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
    /** Valor salvo antes desta edição; se mudou, os avisos de limite rearmam. */
    previousAmount?: number | null
    /** Copia o orçamento para o mês seguinte. Sem valor, a linha não leva a coluna: insert fica com o padrão do banco (`true`) e update mantém o que está salvo. */
    repeats?: boolean
}

export function buildBudgetRow(input: CategoryBudgetUpsertInput, clientId?: string) {
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
        ...(input.repeats !== undefined ? { repeats: input.repeats } : {}),
        // Valor novo, limite novo: os avisos de 80%, 100% e estouro podem soar de novo.
        ...(input.previousAmount != null && input.previousAmount !== input.amount
            ? {
                  threshold_80_sent_at: null,
                  threshold_100_sent_at: null,
                  threshold_over_sent_at: null,
              }
            : {}),
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
                onConflict: "workspace_id,category_id,period_start",
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

/** Liga ou desliga a cópia do orçamento para o mês seguinte. */
export async function definirRepeticao(
    budgetId: string,
    repeats: boolean,
): Promise<{ ok: boolean; erro?: string }> {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
        return { ok: false, erro: "Sem conexão. Tente de novo quando voltar a internet." }
    }
    const { data, error } = await supabase
        .from("budgets")
        .update({ repeats })
        .eq("id", budgetId)
        .select("id")
    if (!error) {
        return data?.length ? { ok: true } : { ok: false, erro: "Não foi possível alterar este orçamento." }
    }
    return {
        ok: false,
        erro: formatSupabasePostgrestError(error) ?? "Não foi possível salvar a repetição do orçamento.",
    }
}

// Chave `${carteira}:${YYYY-MM}` → o pedido da cópia nesta sessão. Enquanto ele
// voa, quem abre outra tela espera o mesmo pedido em vez de pular a cópia.
const garantidos = new Map<string, Promise<number>>()

export function resetGarantidosParaTeste() {
    garantidos.clear()
}

async function pedirCopia(workspaceId: string): Promise<number> {
    const { data, error } = await supabase.rpc("garantir_orcamentos_do_mes", {
        p_workspace_id: workspaceId,
    })
    if (error) throw error
    return typeof data === "number" ? data : 0
}

/**
 * Copia os orçamentos que repetem do mês anterior (RPC idempotente) no máximo
 * uma vez por carteira e mês. `onCopied` roda só quando o RPC criou linhas, em
 * cada tela que esperou por ele (inclusive a que abriu com o pedido no ar).
 * Erro vai ao console e a chave sai do mapa, para a próxima abertura tentar de novo.
 */
export async function garantirOrcamentosDoMes(
    workspaceId: string,
    yearMonth: string,
    onCopied: () => void,
): Promise<void> {
    const key = `${workspaceId}:${yearMonth}`
    let pedido = garantidos.get(key)
    if (!pedido) {
        pedido = pedirCopia(workspaceId)
        garantidos.set(key, pedido)
        // Resolvido, quem abrir depois já lê o mês copiado: não precisa buscar de novo.
        pedido.then(
            () => garantidos.set(key, Promise.resolve(0)),
            () => garantidos.delete(key),
        )
    }
    try {
        if ((await pedido) > 0) onCopied()
    } catch (e) {
        console.error(e)
    }
}
