import { approxRange } from "@/components/ui/filter-bar"
import { PAGE_SIZE } from "@/lib/queries/fetch-transactions-list-page"
import type { Transaction } from "@/lib/supabase"
import { PARCELADAS_TODAS, type EstadoDaLista } from "@/lib/transactions/filtros"

const COLUNA_DE_LISTA = {
    pagamento: "payment_method",
    cartao: "payment_credit_card_id",
    pessoa: "user_id",
    pagou: "paid_by",
    projeto: "project_id",
} as const

/** Os valores do `FilterBar` são decimais com ponto; igual ao `numero` do servidor. */
const numero = (v: string | undefined) => (v && Number.isFinite(Number(v)) ? Number(v) : null)

/**
 * A mesma regra do `aplicarFiltros` (queries/transacoes-filtradas), sobre linhas já em memória.
 * `periodo` e `categoria` ficam de fora: a página da categoria fixa os dois.
 */
export function filtrarNaMemoria(linhas: Transaction[], estado: Pick<EstadoDaLista, "type" | "q" | "filtros">): Transaction[] {
    // shortcut: sem remoção de acento, como o ilike do servidor
    const contem = (t: Transaction, texto: string) => (t.description ?? "").toLowerCase().includes(texto.toLowerCase())
    const q = estado.q.trim()
    return linhas.filter((t) => {
        if (estado.type !== "all" && t.type !== estado.type) return false
        if (q && !contem(t, q)) return false
        for (const { field, operator, values } of estado.filtros) {
            const nega = operator === "is-not"
            switch (field) {
                case "descricao":
                    if (values[0]?.trim() && !contem(t, values[0].trim())) return false
                    break
                case "pagamento":
                case "cartao":
                case "pessoa":
                case "pagou":
                case "projeto":
                    if (values.length && values.includes(String(t[COLUNA_DE_LISTA[field]])) === nega) return false
                    break
                case "valor": {
                    const [x, y] = values.map(numero)
                    const a = t.amount
                    if (operator === "between") {
                        if (x != null && a < x) return false
                        if (y != null && a > y) return false
                    } else if (operator === "gte" && x != null) {
                        if (a < x) return false
                    } else if (operator === "lte" && x != null) {
                        if (a > x) return false
                    } else if (operator === "eq" && x != null) {
                        if (a !== x) return false
                    } else if (operator === "approx" && x != null) {
                        const [de, ate] = approxRange(x)
                        if (a < de || a > ate) return false
                    }
                    break
                }
                case "conferir":
                    if (!t.needs_review) return false
                    break
                case "parcelada": {
                    const ids = values.filter((v) => v !== PARCELADAS_TODAS)
                    const plano = t.installment_plan_id ?? null
                    if (values.includes(PARCELADAS_TODAS)) {
                        if ((plano === null) !== nega) return false
                    } else if (ids.length) {
                        if (nega ? plano !== null && ids.includes(plano) : plano === null || !ids.includes(plano)) return false
                    }
                    break
                }
                case "recorrente":
                    if (!t.is_recurring) return false
                    break
                case "assinatura":
                    if (values[0] && t.subscription_id !== values[0]) return false
                    break
            }
        }
        return true
    })
}

/** A ordem do `ordenar` do servidor: a chave, e na data `created_at`, depois `id`, no mesmo sentido. */
export function ordenarNaMemoria(linhas: Transaction[], sort: EstadoDaLista["sort"]): Transaction[] {
    const cmp = (a: string | number, b: string | number) => (a < b ? -1 : a > b ? 1 : 0)
    const sinal = sort.dir === "asc" ? 1 : -1
    return [...linhas].sort(
        (a, b) =>
            sinal *
            (cmp(a[sort.key], b[sort.key]) ||
                (sort.key === "date" ? cmp(a.created_at ?? "", b.created_at ?? "") : 0) ||
                cmp(a.id, b.id)),
    )
}

export function paginarNaMemoria(linhas: Transaction[], page: number): Transaction[] {
    return linhas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
}
