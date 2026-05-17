import { isOnline } from "@/lib/offline/connectivity"
import { isOfflineWritable } from "@/lib/offline/policies"
import { enqueueMutation } from "@/lib/offline/outbox"
import type {
    OfflineEntity,
    OfflineOperation,
    MutationGatewayResult,
} from "@/lib/offline/types"

export async function executeMutation<T>(opts: {
    entity: OfflineEntity
    operation: OfflineOperation
    workspaceId: string
    offlinePayload: Record<string, unknown>
    onlineFn: () => Promise<T>
    onQueued?: () => void
    idempotencyKey?: string
}): Promise<MutationGatewayResult<T>> {
    if (!isOfflineWritable(opts.entity)) {
        return {
            ok: false,
            errorMessage: "Esta entidade não suporta alterações offline.",
        }
    }

    if (isOnline()) {
        try {
            const data = await opts.onlineFn()
            return { ok: true, data }
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Não foi possível salvar."
            return { ok: false, errorMessage: message }
        }
    }

    const mutation = await enqueueMutation({
        entity: opts.entity,
        operation: opts.operation,
        workspaceId: opts.workspaceId,
        payload: opts.offlinePayload,
        idempotencyKey: opts.idempotencyKey,
    })

    opts.onQueued?.()

    return { ok: true, queued: true, mutationId: mutation.id }
}

export function assertOnline(actionLabel?: string): void {
    if (!isOnline()) {
        throw new Error(
            actionLabel
                ? `${actionLabel} requer conexão com a internet.`
                : "Esta ação requer conexão com a internet."
        )
    }
}
