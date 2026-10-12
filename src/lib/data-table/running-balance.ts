/**
 * O saldo corrente: o saldo **depois** de cada lançamento, na
 * ordem em que a tabela os mostra.
 *
 * Ele só é verdade numa condição: as linhas em ordem de data e **sem filtro**.
 * Ordenado por valor, o "saldo depois" de uma linha soma lançamentos de outras
 * datas; filtrado, falta o que o filtro escondeu. Fora disso a coluna mostra
 * "—" (`null` aqui), em vez de afirmar um número que ninguém apurou — a mesma
 * régua do `MoneyDisplay` para `null`.
 *
 * `start` é o saldo **antes** do lançamento mais antigo da lista. `direction`
 * é a ordem da tela: `desc` (o mais novo em cima, a do app) acumula de baixo
 * para cima.
 */
export function runningBalance(
  amounts: readonly number[],
  {
    start = 0,
    direction,
    sortedByDate,
    filtered,
  }: {
    start?: number
    direction: "asc" | "desc"
    sortedByDate: boolean
    filtered: boolean
  }
): (number | null)[] {
  if (!sortedByDate || filtered) return amounts.map(() => null)
  const ordem = direction === "asc" ? amounts : [...amounts].reverse()
  let saldo = start
  const acumulado = ordem.map((v) => {
    // Em centavos, para a soma não acumular o erro do ponto flutuante.
    saldo = Math.round((saldo + v) * 100) / 100
    return saldo
  })
  return direction === "asc" ? acumulado : acumulado.reverse()
}
