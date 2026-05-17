export type OfflineEntity =
    | "transaction"
    | "category"
    | "budget"
    | "credit_card"
    | "bill"
    | "bill_instance"
    | "subscription"

export type OfflineOperation = "insert" | "update" | "delete"

export type OfflineMutationStatus = "pending" | "syncing" | "failed" | "conflict"

export type OfflineMutation = {
    id: string
    idempotencyKey: string
    entity: OfflineEntity
    operation: OfflineOperation
    workspaceId: string
    payload: Record<string, unknown>
    createdAt: number
    status: OfflineMutationStatus
    retryCount: number
    lastError?: string
    serverId?: string
}

export type MutationGatewayResult<T> =
    | { ok: true; data: T }
    | { ok: true; queued: true; mutationId: string }
    | { ok: false; errorMessage: string }
