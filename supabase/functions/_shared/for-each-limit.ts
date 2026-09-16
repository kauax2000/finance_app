/** Quantas carteiras um job diário processa ao mesmo tempo. */
export const FAN_OUT_CONCURRENCY = 5

/**
 * Roda `fn` sobre os itens com no máximo `limit` chamadas em aberto. Um laço
 * sequencial por carteira estourava o tempo da função com muitas carteiras;
 * `Promise.all` sem teto abriria uma conexão por carteira de uma vez.
 */
export async function forEachLimit<T>(
  items: Iterable<T>,
  limit: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  const list = [...items]
  let next = 0
  const worker = async () => {
    while (next < list.length) await fn(list[next++])
  }
  await Promise.all(Array.from({ length: Math.min(limit, list.length) }, worker))
}
