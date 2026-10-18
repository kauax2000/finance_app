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
