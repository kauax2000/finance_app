import { syncMutation } from "@/lib/offline/handlers"
import {
    getPendingMutations,
    removeMutation,
    updateMutation,
} from "@/lib/offline/outbox"
import { isOnline } from "@/lib/offline/connectivity"
import {
    dispatchFinanceCategoriesMutated,
    dispatchFinanceCreditCardsMutated,
    dispatchFinanceSubscriptionsMutated,
    dispatchFinanceTransactionsMutated,
} from "@/lib/workspace-data-events"
import type { OfflineEntity } from "@/lib/offline/types"
import { toast } from "sonner"

const MAX_RETRIES = 5
const BACKOFF_MS = [1000, 5000, 30_000, 60_000, 120_000]

let processing = false
let scheduledRetry: ReturnType<typeof setTimeout> | null = null

function scheduleRetryPass(delayMs: number): void {
    if (scheduledRetry) return
    scheduledRetry = setTimeout(() => {
        scheduledRetry = null
        void processOutbox()
    }, delayMs)
}

/** Post-sync cache invalidation per entity (via os eventos finance:*). */
function dispatchForEntities(entities: Set<OfflineEntity>): void {
    if (entities.has("transaction")) dispatchFinanceTransactionsMutated()
    if (entities.has("category") || entities.has("budget")) {
        dispatchFinanceCategoriesMutated()
    }
    if (entities.has("credit_card")) dispatchFinanceCreditCardsMutated()
    if (entities.has("subscription")) dispatchFinanceSubscriptionsMutated()
    // bills/bill_instances: o bridge invalida o domínio bills via evento de transactions
    if (
        (entities.has("bill") || entities.has("bill_instance")) &&
        !entities.has("transaction")
    ) {
        dispatchFinanceTransactionsMutated()
    }
}

/**
 * Drena o outbox em ordem de criação SEM head-of-line blocking: uma mutation
 * que falha é re-marcada como pending (com retryCount) e o loop segue para a
 * próxima; o novo passe de retry é agendado FORA do lock (antes, o backoff
 * dormia dentro do loop segurando `processing` por até ~3,5min).
 */
export async function processOutbox(): Promise<void> {
    if (!isOnline() || processing) return
    processing = true

    let minRetryDelay: number | null = null

    try {
        const pending = await getPendingMutations()
        const touched = new Set<OfflineEntity>()

        for (const mutation of pending) {
            // Dead-letter: falhas definitivas não são reprocessadas automaticamente.
            if (mutation.status === "failed") continue

            await updateMutation(mutation.id, { status: "syncing" })

            const result = await syncMutation(mutation)

            if (result.ok) {
                await removeMutation(mutation.id)
                touched.add(mutation.entity)
                continue
            }

            const retryCount = mutation.retryCount + 1
            if (retryCount >= MAX_RETRIES) {
                await updateMutation(mutation.id, {
                    status: "failed",
                    retryCount,
                    lastError: result.error,
                })
                toast.error("Falha ao sincronizar alteração offline", {
                    description: result.error,
                })
            } else {
                await updateMutation(mutation.id, {
                    status: "pending",
                    retryCount,
                    lastError: result.error,
                })
                const delay = BACKOFF_MS[retryCount - 1] ?? 120_000
                minRetryDelay =
                    minRetryDelay === null ? delay : Math.min(minRetryDelay, delay)
            }
        }

        if (touched.size > 0) {
            dispatchForEntities(touched)
        }
    } finally {
        processing = false
    }

    if (minRetryDelay !== null) {
        scheduleRetryPass(minRetryDelay)
    }
}
