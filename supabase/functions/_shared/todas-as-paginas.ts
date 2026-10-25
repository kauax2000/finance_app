export const PAGE_SIZE = 1000

/** Lê todas as páginas: o PostgREST corta em `max_rows` (1000) sem erro. */
export async function todasAsPaginas<T>(
  pagina: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await pagina(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(error.message)
    const batch = data ?? []
    out.push(...batch)
    if (batch.length < PAGE_SIZE) return out
  }
}
