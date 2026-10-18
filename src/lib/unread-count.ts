/** Intervalo da sondagem do sino, com a aba visível. */
export const BELL_POLL_MS = 60_000

/** O sino nunca baixa por abrir o painel: o número exato do servidor vence o tamanho da lista. */
export function unreadAfterOpen(serverCount: number, listUnread: number): number {
    void listUnread
    return serverCount
}

/** Ajuste por delta (marcar lida, nova chegada); nunca fica abaixo de zero. */
export function unreadAfterDelta(current: number, delta: number): number {
    return Math.max(0, current + delta)
}
