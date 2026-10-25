/**
 * O limite mensal por pessoa (Bloco 7A, spec §12). **Sem nenhum import**, como
 * os outros módulos novos de `_shared`: o cliente o reexporta por
 * `src/lib/limites/limites.ts`, e o cartão entra pronto no lançamento.
 */

export type LancamentoDaPessoa = {
  user_id: string
  type: string
  amount: number
  date: string
  payment_method: string | null
  card: { closing_day: number } | null
}

/** 80 a partir de 80% do limite, 100 a partir de 100%; abaixo, 0. Em centavos. */
export function nivelDoLimite(gastoCentavos: number, limiteCentavos: number): 0 | 80 | 100 {
  if (!(limiteCentavos > 0)) return 0
  if (gastoCentavos >= limiteCentavos) return 100
  if (gastoCentavos * 100 >= limiteCentavos * 80) return 80
  return 0
}

/**
 * O mês ("2026-11") em que a compra conta: o do dia, ou, no crédito, o do
 * fechamento da fatura — o primeiro fechamento no dia da compra ou depois, com
 * o dia de fechamento preso ao fim do mês curto. É a conta de
 * `statementCloseYmdForPurchaseYmd` (`credit-card-cycle.ts`), que o teste confere
 * dia a dia.
 */
export function mesDaCompra(date: string, closingDay: number | null): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date.trim())
  if (!m) return null
  let y = Number(m[1])
  let mes = Number(m[2])
  if (closingDay != null) {
    const fecha = Math.min(closingDay, new Date(Date.UTC(y, mes, 0)).getUTCDate())
    if (Number(m[3]) > fecha) {
      mes += 1
      if (mes > 12) {
        mes = 1
        y += 1
      }
    }
  }
  return `${y}-${String(mes).padStart(2, '0')}`
}

/**
 * O gasto da pessoa no mês, em centavos: as despesas de que ela é autora
 * (`user_id`; o `paid_by` do 7C não muda a régua), o crédito pelo mês do
 * fechamento. A receita não entra.
 */
export function gastoDaPessoaNoMes(lancs: LancamentoDaPessoa[], userId: string, ym: string): number {
  let cents = 0
  for (const t of lancs) {
    if (t.type !== 'expense' || t.user_id !== userId) continue
    const fechamento = t.payment_method === 'credit_card' ? (t.card?.closing_day ?? null) : null
    if (mesDaCompra(t.date, fechamento) !== ym) continue
    cents += Math.round(Number(t.amount || 0) * 100)
  }
  return cents
}

export type MembroDoLimite = { user_id: string; role: string }

export type AvisosDoLimite = { nivel: 0 | 80 | 100; reivindicar: Array<80 | 100>; destinatarios: string[] }

/**
 * O que o gasto do autor pede: o nível, os níveis a reivindicar (o 100 leva o
 * 80 junto, para o de 80 não sair depois) e quem recebe — a pessoa e cada
 * dono, uma vez cada (o dono que é a própria pessoa recebe um). Quem não é
 * membro da carteira não tem limite avaliado.
 */
export function decidirAvisosDoLimite(
  autorId: string,
  membros: MembroDoLimite[],
  gastoCentavos: number,
  limiteCentavos: number
): AvisosDoLimite {
  const nivel = nivelDoLimite(gastoCentavos, limiteCentavos)
  if (nivel === 0 || !membros.some((m) => m.user_id === autorId)) return { nivel: 0, reivindicar: [], destinatarios: [] }
  const donos = membros.filter((m) => m.role === 'owner').map((m) => m.user_id)
  return { nivel, reivindicar: nivel === 100 ? [80, 100] : [80], destinatarios: [...new Set([autorId, ...donos])] }
}

/** Avisa só se a reivindicação devolveu o próprio nível (o resto já saiu). */
export function nivelNovo(nivel: 80 | 100, reivindicados: number[]): boolean {
  return reivindicados.includes(nivel)
}

/** Para onde o aviso leva, pelo papel de quem o recebe na hora do envio. */
export function destinoDoAvisoDoLimite(role: string): string {
  return role === 'guest' ? '/dashboard' : '/members#limites'
}
