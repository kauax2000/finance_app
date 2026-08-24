import { supabase } from "@/lib/supabase"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { executeMutation } from "@/lib/offline/mutation-gateway"
import { dispatchFinanceCreditCardsMutated } from "@/lib/workspace-data-events"

export type CreditCardInsertRow = {
    workspace_id: string
    user_id: string
    name: string
    last_four: string
    brand: string | null
    closing_day: number
    due_day: number
    credit_limit: number | null
    expiry_month?: number | null
    expiry_year?: number | null
    is_active: boolean
}

export async function createCreditCard(
    row: CreditCardInsertRow
): Promise<
    | { ok: true; cardId: string; queued: boolean }
    | { ok: false; errorMessage: string }
> {
    const clientId = crypto.randomUUID()
    const offlinePayload = { ...row, client_id: clientId }

    const gateway = await executeMutation({
        entity: "credit_card",
        operation: "insert",
        workspaceId: row.workspace_id,
        idempotencyKey: clientId,
        offlinePayload,
        onQueued: () => dispatchFinanceCreditCardsMutated(),
        onlineFn: async () => {
            const { data, error } = await supabase
                .from("credit_cards")
                .insert({ ...row, client_id: clientId })
                .select("id")
                .single()

            if (error || !data) {
                throw new Error(
                    formatSupabasePostgrestError(error) ??
                        "Não foi possível criar o cartão."
                )
            }
            return { cardId: data.id as string, queued: false }
        },
    })

    if (!gateway.ok) {
        return { ok: false, errorMessage: gateway.errorMessage }
    }
    if ("queued" in gateway && gateway.queued) {
        return { ok: true, cardId: clientId, queued: true }
    }
    if ("data" in gateway) {
        return { ok: true, cardId: gateway.data.cardId, queued: false }
    }
    return { ok: false, errorMessage: "Resposta inesperada ao salvar cartão." }
}

export type CreditCardUpdatePatch = Partial<
    Omit<CreditCardInsertRow, "workspace_id" | "user_id">
>

export type CreditCardMutationResult =
    | { ok: true; queued?: boolean }
    | { ok: false; errorMessage: string }

/**
 * Update/delete/toggle passavam por `supabase.from` direto nas páginas, sem
 * gateway offline e sem NENHUMA invalidação de cache — os bundles (e o IDB)
 * continuavam servindo cartão renomeado/excluído. Caminho único aqui.
 */
export async function updateCreditCard(input: {
    workspaceId: string
    cardId: string
    patch: CreditCardUpdatePatch
}): Promise<CreditCardMutationResult> {
    const gateway = await executeMutation({
        entity: "credit_card",
        operation: "update",
        workspaceId: input.workspaceId,
        offlinePayload: { ...input.patch, serverId: input.cardId },
        onQueued: () => dispatchFinanceCreditCardsMutated(),
        onlineFn: async () => {
            const { error } = await supabase
                .from("credit_cards")
                .update({ ...input.patch })
                .eq("id", input.cardId)
                .eq("workspace_id", input.workspaceId)
            if (error) {
                throw new Error(
                    formatSupabasePostgrestError(error) ??
                        "Não foi possível salvar o cartão."
                )
            }
            return { ok: true as const }
        },
    })

    if (!gateway.ok) return { ok: false, errorMessage: gateway.errorMessage }
    dispatchFinanceCreditCardsMutated()
    return { ok: true, queued: "queued" in gateway ? gateway.queued : undefined }
}

export async function setCreditCardActive(input: {
    workspaceId: string
    cardId: string
    isActive: boolean
}): Promise<CreditCardMutationResult> {
    return updateCreditCard({
        workspaceId: input.workspaceId,
        cardId: input.cardId,
        patch: { is_active: input.isActive },
    })
}

export async function deleteCreditCard(input: {
    workspaceId: string
    cardId: string
}): Promise<CreditCardMutationResult> {
    const gateway = await executeMutation({
        entity: "credit_card",
        operation: "delete",
        workspaceId: input.workspaceId,
        offlinePayload: { serverId: input.cardId, id: input.cardId },
        onQueued: () => dispatchFinanceCreditCardsMutated(),
        onlineFn: async () => {
            const { error } = await supabase
                .from("credit_cards")
                .delete()
                .eq("id", input.cardId)
                .eq("workspace_id", input.workspaceId)
            if (error) {
                throw new Error(
                    formatSupabasePostgrestError(error) ??
                        "Não foi possível excluir o cartão."
                )
            }
            return { ok: true as const }
        },
    })

    if (!gateway.ok) return { ok: false, errorMessage: gateway.errorMessage }
    dispatchFinanceCreditCardsMutated()
    return { ok: true, queued: "queued" in gateway ? gateway.queued : undefined }
}
