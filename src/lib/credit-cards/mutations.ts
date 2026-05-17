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
