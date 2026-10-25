/**
 * Quem recebe os avisos da carteira (Bloco 7A). O convidado (`guest`) não
 * recebe o que é da casa — lançamento dos outros, orçamento, fatura, conta,
 * insight —, só o que é dele. Puro e sem import, como os outros de `_shared`.
 */

type Membro = { user_id: string; role: string }

/** Dono e membro, sem repetir e sem `excluir` (o autor do lançamento). */
export function adultosDaCarteira(rows: Membro[], excluir?: string): string[] {
  const ids = rows
    .filter((r) => (r.role === 'owner' || r.role === 'member') && r.user_id !== excluir)
    .map((r) => r.user_id)
  return [...new Set(ids)]
}

/** Só os donos, sem repetir. */
export function donosDaCarteira(rows: Membro[]): string[] {
  return [...new Set(rows.filter((r) => r.role === 'owner').map((r) => r.user_id))]
}

/**
 * Quem recebe um aviso de cartão (Bloco 7B, Rulings 5 e 6). Os adultos, como
 * sempre; só o aviso que carrega dado do banco (total, diferença, resumo da
 * conferência) de um cartão com titular fica com o titular e os donos. O
 * titular que não é mais adulto da carteira some com os outros.
 */
export function leitoresDoCartao(rows: Membro[], holderUserId: string | null, usaBanco: boolean): string[] {
  const adultos = adultosDaCarteira(rows)
  if (!holderUserId || !usaBanco) return adultos
  const donos = donosDaCarteira(rows)
  return adultos.filter((u) => u === holderUserId || donos.includes(u))
}
