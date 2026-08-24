import { supabase } from "@/lib/supabase"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { executeMutation } from "@/lib/offline/mutation-gateway"
import type { SubscriptionBillingInterval, TransactionPaymentMethod } from "@/lib/supabase"

/**
 * Caminho único de escrita para assinaturas (gateway offline).
 *
 * Antes, o insert vivia duplicado em `subscriptions/page-client.tsx` e
 * `global-shell-dialogs-provider.tsx` com `supabase.from(...)` direto — o
 * handler offline (`handlers/subscriptions.ts`), a policy e o `client_id`
 * existiam, mas nada os usava.
 */

export type SubscriptionWritePayload = {
    name: string
    amount: number
    billing_interval: SubscriptionBillingInterval
    currency?: string
    start_date?: string
    next_billing_date?: string | null
    day_of_month?: number | null
    category_id?: string | null
    notes?: string | null
    payment_method?: TransactionPaymentMethod | null
    payment_credit_card_id?: string | null
    is_active?: boolean
}

export type SubscriptionMutationResult =
    | { ok: true; queued?: boolean }
    | { ok: false; errorMessage: string }

function fromGateway(
    r:
        | { ok: true; data?: unknown }
        | { ok: true; queued: true; mutationId: string }
        | { ok: false; errorMessage: string },
): SubscriptionMutationResult {
    if (!r.ok) return { ok: false, errorMessage: r.errorMessage }
    return { ok: true, queued: "queued" in r ? r.queued : undefined }
}

export async function createSubscription(input: {
    workspaceId: string
    userId: string
    payload: SubscriptionWritePayload
}): Promise<SubscriptionMutationResult> {
    const clientId = crypto.randomUUID()
    const row = {
        workspace_id: input.workspaceId,
        user_id: input.userId,
        ...input.payload,
    }

    const gateway = await executeMutation({
        entity: "subscription",
        operation: "insert",
        workspaceId: input.workspaceId,
        idempotencyKey: clientId,
        offlinePayload: { ...row, client_id: clientId },
        onlineFn: async () => {
            const { error } = await supabase
                .from("workspace_subscriptions")
                .insert({ ...row, client_id: clientId })
            if (error) {
                throw new Error(
                    formatSupabasePostgrestError(error) ??
                        "Não foi possível cadastrar a assinatura.",
                )
            }
            return { ok: true as const }
        },
    })
    return fromGateway(gateway)
}

export async function updateSubscription(input: {
    workspaceId: string
    subscriptionId: string
    payload: Partial<SubscriptionWritePayload>
}): Promise<SubscriptionMutationResult> {
    const gateway = await executeMutation({
        entity: "subscription",
        operation: "update",
        workspaceId: input.workspaceId,
        offlinePayload: { ...input.payload, serverId: input.subscriptionId },
        onlineFn: async () => {
            const { error } = await supabase
                .from("workspace_subscriptions")
                .update({ ...input.payload })
                .eq("id", input.subscriptionId)
            if (error) {
                throw new Error(
                    formatSupabasePostgrestError(error) ??
                        "Não foi possível salvar a assinatura.",
                )
            }
            return { ok: true as const }
        },
    })
    return fromGateway(gateway)
}

export async function setSubscriptionActive(input: {
    workspaceId: string
    subscriptionId: string
    isActive: boolean
}): Promise<SubscriptionMutationResult> {
    return updateSubscription({
        workspaceId: input.workspaceId,
        subscriptionId: input.subscriptionId,
        payload: { is_active: input.isActive },
    })
}

export async function deleteSubscriptions(input: {
    workspaceId: string
    ids: string[]
}): Promise<SubscriptionMutationResult> {
    if (input.ids.length === 0) return { ok: true }

    // Cada delete vira uma mutation própria no outbox (replay individual).
    for (const id of input.ids) {
        const gateway = await executeMutation({
            entity: "subscription",
            operation: "delete",
            workspaceId: input.workspaceId,
            offlinePayload: { serverId: id, id },
            onlineFn: async () => {
                const { error } = await supabase
                    .from("workspace_subscriptions")
                    .delete()
                    .eq("id", id)
                if (error) {
                    throw new Error(
                        formatSupabasePostgrestError(error) ??
                            "Não foi possível excluir a assinatura.",
                    )
                }
                return { ok: true as const }
            },
        })
        if (!gateway.ok) return fromGateway(gateway)
    }
    return { ok: true }
}
