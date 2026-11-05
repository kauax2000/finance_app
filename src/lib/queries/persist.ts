import type { Query } from "@tanstack/react-query"
import { queryRoot } from "@/lib/queries/keys"

/** Increment to drop all persisted cache after schema / shape changes. */
// v2: budgets workspace-scoped, invalidation map, persister namespaced por usuário (Fase 5/6)
export const PERSIST_BUSTER = "v2"

const NON_PERSISTED_ROOTS = new Set<string>([
    queryRoot.profile,
    // PII de outros membros (emails/nomes/avatars) fora do IndexedDB
    queryRoot.memberDirectory,
    // o pacote de Membros carrega o mesmo diretório
    queryRoot.membersPageBundle,
    // resultado de busca digitada: efêmero, não vale gravar
    queryRoot.transactionsSearch,
    // a frase rápida busca de novo quando precisa: não vale gravar
    queryRoot.fraseHistorico,
    // lido uma vez por carga (staleTime Infinity): um snapshot restaurado nunca
    // buscaria de novo e o diálogo de volta se repetiria
    "acesso",
])

export function shouldPersistQuery(query: Query): boolean {
    if (query.state.status !== "success") return false
    const key = query.queryKey[0]
    if (typeof key !== "string") return false
    if (NON_PERSISTED_ROOTS.has(key)) return false
    return true
}
