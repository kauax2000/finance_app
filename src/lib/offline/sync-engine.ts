import { syncMutation } from "@/lib/offline/handlers"
import {
    getPendingMutations,
    removeMutation,
    updateMutation,
} from "@/lib/offline/outbox"
import { isOnline } from "@/lib/offline/connectivity"
import { dispatchFinanceTransactionsMutated } from "@/lib/workspace-data-events"
import { toast } from "sonner"

const MAX_RETRIES = 5
const BACKOFF_MS = [1000, 5000, 30_000, 60_000, 120_000]

let processing = false

export async function processOutbox(): Promise<void> {
    if (!isOnline() || processing) return
    processing = true

    try {
        const pending = await getPendingMutations()
        let touchedTransactions = false

        for (const mutation of pending) {
            await updateMutation(mutation.id, { status: "syncing" })

            const result = await syncMutation(mutation)

            if (result.ok) {
                await removeMutation(mutation.id)
                if (mutation.entity === "transaction") touchedTransactions = true
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
                await new Promise((r) => setTimeout(r, delay))
            }
        }

        if (touchedTransactions) {
            dispatchFinanceTransactionsMutated()
        }
    } finally {
        processing = false
    }
}
