import { supabase } from "@/lib/supabase"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { executeMutation } from "@/lib/offline/mutation-gateway"
import { dispatchFinanceCategoriesMutated } from "@/lib/workspace-data-events"

export type CategoryRowInput = {
    user_id: string
    workspace_id: string
    name: string
    type: "income" | "expense"
    color: string | null
    icon: string | null
}

export async function saveCategory(
    input: CategoryRowInput & { editingId?: string | null }
): Promise<
    | { ok: true; categoryId: string; queued: boolean }
    | { ok: false; errorMessage: string }
> {
    const clientId = crypto.randomUUID()
    const editingId = input.editingId ?? null
    const { editingId: _e, ...row } = input
    const operation = editingId ? "update" : "insert"
    const offlinePayload = editingId
        ? { ...row, serverId: editingId }
        : { ...row, client_id: clientId }

    const gateway = await executeMutation({
        entity: "category",
        operation,
        workspaceId: input.workspace_id,
        idempotencyKey: clientId,
        offlinePayload,
        onQueued: () => dispatchFinanceCategoriesMutated(),
        onlineFn: async () => {
            if (editingId) {
                const { error } = await supabase
                    .from("categories")
                    .update(row)
                    .eq("id", editingId)
                if (error) {
                    throw new Error(
                        formatSupabasePostgrestError(error) ??
                            "Não foi possível salvar a categoria."
                    )
                }
                return { categoryId: editingId, queued: false }
            }

            const { data, error } = await supabase
                .from("categories")
                .insert({ ...row, client_id: clientId })
                .select("id")
                .single()

            if (error || !data) {
                throw new Error(
                    formatSupabasePostgrestError(error) ??
                        "Não foi possível criar a categoria."
                )
            }
            return { categoryId: data.id as string, queued: false }
        },
    })

    if (!gateway.ok) {
        return { ok: false, errorMessage: gateway.errorMessage }
    }
    if ("queued" in gateway && gateway.queued) {
        return { ok: true, categoryId: clientId, queued: true }
    }
    if ("data" in gateway) {
        return { ok: true, categoryId: gateway.data.categoryId, queued: false }
    }
    return { ok: false, errorMessage: "Resposta inesperada ao salvar categoria." }
}

export async function deleteCategoryById(
    id: string,
    workspaceId: string
): Promise<{ ok: true } | { ok: false; errorMessage: string }> {
    const gateway = await executeMutation({
        entity: "category",
        operation: "delete",
        workspaceId,
        offlinePayload: { serverId: id, id },
        onQueued: () => dispatchFinanceCategoriesMutated(),
        onlineFn: async () => {
            const { error } = await supabase.from("categories").delete().eq("id", id)
            if (error) {
                throw new Error(
                    formatSupabasePostgrestError(error) ??
                        "Não foi possível excluir a categoria."
                )
            }
            return { ok: true as const }
        },
    })

    if (!gateway.ok) {
        return { ok: false, errorMessage: gateway.errorMessage }
    }
    return { ok: true }
}
