/** Regras de quando os crons avisam (contas e faturas). */

/**
 * Conta atrasada: avisa no 1º dia de atraso e a cada 7 dias depois, tolerando um
 * dia perdido (dias 1–2, 8–9, 15–16…). A chave de `overdueDedupeBucket` é a mesma
 * nos dois dias da janela, então sai um aviso só por janela.
 */
export function shouldSendOverdue(diasDeAtraso: number): boolean {
  return diasDeAtraso >= 1 && (diasDeAtraso - 1) % 7 <= 1
}

/** "Em breve" tolera um dia perdido: alvo 3 vale para 3 e 2. */
export function withinReminderWindow(diasAte: number, alvo: number): boolean {
  return diasAte === alvo || diasAte === alvo - 1
}

/** A chave de deduplicação da conta atrasada muda a cada janela de 7 dias. */
export function overdueDedupeBucket(diasDeAtraso: number): number {
  return Math.floor((diasDeAtraso - 1) / 7)
}

/**
 * Conta a vencer: um offset `o` é devido quando `0 <= diasAte <= o`, e só o menor
 * dos devidos é avisado (um aviso por instância por dia). Se ele já foi avisado,
 * nada sai — um maior seria um aviso velho. Na Edge, `avisados` é a própria chave
 * da dedupe (o `sent_on` fixo no vencimento vale entre os dias).
 */
export function offsetDaJanela(
  offsets: readonly number[],
  diasAte: number,
  avisados: readonly number[] = [],
): number | null {
  const devidos = offsets.filter((o) => diasAte >= 0 && diasAte <= o)
  if (devidos.length === 0) return null
  const menor = Math.min(...devidos)
  return avisados.includes(menor) ? null : menor
}
