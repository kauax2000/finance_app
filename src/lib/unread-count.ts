/** Intervalo da sondagem do sino, com a aba visível. */
export const BELL_POLL_MS = 60_000

/** Ajuste por delta (marcar lida, nova chegada); nunca fica abaixo de zero. */
export function unreadAfterDelta(current: number, delta: number): number {
    return Math.max(0, current + delta)
}
