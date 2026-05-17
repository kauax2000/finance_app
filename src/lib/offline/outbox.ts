import { getOfflineDb } from "@/lib/offline/db"
import type {
    OfflineEntity,
    OfflineMutation,
    OfflineOperation,
} from "@/lib/offline/types"

const listeners = new Set<() => void>()

function notify() {
    for (const fn of listeners) {
        fn()
    }
}

export function subscribeOutbox(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

export async function enqueueMutation(input: {
    entity: OfflineEntity
    operation: OfflineOperation
    workspaceId: string
    payload: Record<string, unknown>
    idempotencyKey?: string
}): Promise<OfflineMutation> {
    const db = getOfflineDb()
    const id = crypto.randomUUID()
    const mutation: OfflineMutation = {
        id,
        idempotencyKey: input.idempotencyKey ?? id,
        entity: input.entity,
        operation: input.operation,
        workspaceId: input.workspaceId,
        payload: input.payload,
        createdAt: Date.now(),
        status: "pending",
        retryCount: 0,
    }
    await db.outbox.put(mutation)
    notify()
    return mutation
}

export async function getPendingMutations(): Promise<OfflineMutation[]> {
    const db = getOfflineDb()
    return db.outbox
        .where("status")
        .anyOf(["pending", "failed"])
        .sortBy("createdAt")
}

export async function getPendingCount(): Promise<number> {
    const db = getOfflineDb()
    return db.outbox.where("status").anyOf(["pending", "failed"]).count()
}

export async function updateMutation(
    id: string,
    patch: Partial<OfflineMutation>
): Promise<void> {
    const db = getOfflineDb()
    await db.outbox.update(id, patch)
    notify()
}

export async function removeMutation(id: string): Promise<void> {
    const db = getOfflineDb()
    await db.outbox.delete(id)
    notify()
}

export async function clearOutboxForWorkspace(workspaceId: string): Promise<void> {
    const db = getOfflineDb()
    await db.outbox.where("workspaceId").equals(workspaceId).delete()
    notify()
}

export async function clearAllOutbox(): Promise<void> {
    const db = getOfflineDb()
    await db.outbox.clear()
    notify()
}
