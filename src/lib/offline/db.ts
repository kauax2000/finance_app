import Dexie, { type Table } from "dexie"
import type { OfflineMutation } from "@/lib/offline/types"

class FinanceOfflineDb extends Dexie {
    outbox!: Table<OfflineMutation, string>

    constructor() {
        super("finance-app-offline")
        this.version(1).stores({
            outbox: "id, status, workspaceId, createdAt, entity",
        })
    }
}

let db: FinanceOfflineDb | null = null

export function getOfflineDb(): FinanceOfflineDb {
    if (typeof indexedDB === "undefined") {
        throw new Error("IndexedDB is not available")
    }
    if (!db) {
        db = new FinanceOfflineDb()
    }
    return db
}
