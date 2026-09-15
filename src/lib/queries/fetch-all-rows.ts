/** O `max_rows` padrão do PostgREST no Supabase: acima disso a resposta vem cortada, sem erro. */
export const POSTGREST_MAX_ROWS = 1000

type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>

/**
 * Busca todas as linhas pedindo página por página. Um `.limit(6000)` sozinho
 * devolvia no máximo 1000 linhas e a tela somava só essas, calada. A consulta
 * precisa de ordem estável (desempate por `id`) para as páginas não se
 * sobreporem.
 */
export async function fetchAllRows<T>(
    page: (from: number, to: number) => Page<T>,
    pageSize = POSTGREST_MAX_ROWS,
): Promise<T[]> {
    const rows: T[] = []
    for (let from = 0; ; from += pageSize) {
        const { data, error } = await page(from, from + pageSize - 1)
        if (error) throw new Error(error.message)
        rows.push(...(data ?? []))
        if (!data || data.length < pageSize) return rows
    }
}
