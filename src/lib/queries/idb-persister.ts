import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister"
import { createStore, del, get, set } from "idb-keyval"

const idbStore = createStore("finance-app-rq", "cache")
const PERSISTER_KEY_BASE = "tanstack-query"

/**
 * Namespace do cache por usuário: sem isso, num dispositivo compartilhado o
 * usuário B podia hidratar o cache financeiro do usuário A antes do primeiro
 * fetch. Lê o user id de forma síncrona do token supabase em localStorage
 * (o provider de query monta acima do AuthProvider).
 */
function currentUserIdSync(): string | null {
    if (typeof window === "undefined") return null
    try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
        const ref = new URL(url).hostname.split(".")[0]
        if (!ref) return null
        const raw = window.localStorage.getItem(`sb-${ref}-auth-token`)
        if (!raw) return null
        const parsed = JSON.parse(raw) as { user?: { id?: string } }
        return parsed?.user?.id ?? null
    } catch {
        return null
    }
}

function persisterKey(): string {
    return `${PERSISTER_KEY_BASE}:u:${currentUserIdSync() ?? "anon"}`
}

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
        key: persisterKey(),
        storage: asyncStorage,
        throttleTime: 1000,
    })
}

export async function clearFinanceQueryIdb(): Promise<void> {
    const { clear } = await import("idb-keyval")
    await clear(idbStore)
}
