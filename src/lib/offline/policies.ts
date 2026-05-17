import type { OfflineEntity } from "@/lib/offline/types"

/** Entities that support offline write via outbox. */
export const OFFLINE_WRITABLE_ENTITIES = new Set<OfflineEntity>([
    "transaction",
    "category",
    "budget",
    "credit_card",
    "bill",
    "bill_instance",
    "subscription",
])

export function isOfflineWritable(entity: OfflineEntity): boolean {
    return OFFLINE_WRITABLE_ENTITIES.has(entity)
}

/** Edge-only flows — block when offline. */
export const OFFLINE_BLOCKED_ACTIONS = new Set([
    "workspace_invite",
    "delete_account",
    "session",
    "avatar_upload",
    "pay_bill_edge",
    "recurring_billing_catchup",
])
