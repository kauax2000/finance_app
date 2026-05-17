import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister"
import { createStore, del, get, set } from "idb-keyval"

const idbStore = createStore("finance-app-rq", "cache")
const PERSISTER_KEY = "tanstack-query"

const asyncStorage = {
    getItem: async (key: string): Promise<string | null> => {
        const v = await get<string>(key, idbStore)
        return v ?? null
    },
    setItem: async (key: string, value: string): Promise<void> => {
        await set(key, value, idbStore)
    },
    removeItem: async (key: string): Promise<void> => {
        await del(key, idbStore)
    },
}

export function createFinanceQueryPersister() {
    return createAsyncStoragePersister({
        key: PERSISTER_KEY,
        storage: asyncStorage,
        throttleTime: 1000,
    })
}

export async function clearFinanceQueryIdb(): Promise<void> {
    const { clear } = await import("idb-keyval")
    await clear(idbStore)
}
