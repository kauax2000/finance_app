import { isProjectedTransactionRow } from "@/lib/category-expense-month-rows"
import type { Transaction } from "@/lib/supabase"
import type { EstadoDaLista } from "@/lib/transactions/filtros"

/** O valor com sinal: receita positiva, despesa negativa. */
export const valorComSinal = (t: Pick<Transaction, "type" | "amount">) =>
    t.type === "income" ? Number(t.amount) : -Number(t.amount)

/** O resultado do dia (receitas − despesas), sem as linhas projetadas ("Previsto"). */
export function totalDoDia(linhas: Transaction[]): number {
    let soma = 0
    for (const t of linhas) if (!isProjectedTransactionRow(t)) soma += valorComSinal(t)
    return Math.round(soma * 100) / 100
}

/** O tipo comum do lote; `null` vazio ou com despesas e receitas misturadas. */
export function tipoDoLote(linhas: Pick<Transaction, "type">[]): "expense" | "income" | null {
    const tipo = linhas[0]?.type
    if (!tipo) return null
    return linhas.every((t) => t.type === tipo) ? tipo : null
}

/** O clique num cabeçalho: a mesma coluna inverte o sentido; outra começa decrescente. */
export function ordemDepoisDoClique(
    atual: EstadoDaLista["sort"],
    coluna: EstadoDaLista["sort"]["key"],
): EstadoDaLista["sort"] {
    if (atual.key === coluna) return { key: coluna, dir: atual.dir === "desc" ? "asc" : "desc" }
    return { key: coluna, dir: "desc" }
}

/**
 * A data da linha como meio-dia local: `new Date("2026-11-07")` é meia-noite
 * UTC, que no Brasil cai no dia anterior e partiria o grupo do dia.
 */
export const diaLocalDe = (t: Pick<Transaction, "date">) => `${t.date.slice(0, 10)}T12:00:00`
