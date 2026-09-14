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

/**
 * A chave é resolvida a cada leitura e gravação, e não uma vez ao montar: quem
 * entrava sem recarregar a página gravava o cache na chave "anon", e ele sumia
 * no próximo carregamento. A chave que o persister passa é ignorada.
 */
const asyncStorage = {
    getItem: async (): Promise<string | null> => {
        const v = await get<string>(persisterKey(), idbStore)
        return v ?? null
    },
    setItem: async (_key: string, value: string): Promise<void> => {
        await set(persisterKey(), value, idbStore)
    },
    removeItem: async (): Promise<void> => {
        await del(persisterKey(), idbStore)
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
