/**
 * Títulos e corpos das notificações do servidor, em funções puras. O dinheiro
 * é escrito à mão: o `Intl` do Deno pode vir sem os dados de pt-BR, e o texto
 * sairia "BRL 1,234.56".
 */

export type Copy = { title: string; body: string }

/** "R$ 1.234,56"; negativo com U+2212, como `src/lib/formatters.ts`. O espaço depois do "R$" é o inseparável (U+00A0): o push não quebra a linha entre o símbolo e o número. */
export function moneyBRL(value: number): string {
  if (!Number.isFinite(value)) return '—'
  const cents = Math.round(Math.abs(value) * 100)
  const int = String(Math.floor(cents / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const frac = String(cents % 100).padStart(2, '0')
  return `${value < 0 && cents > 0 ? '−' : ''}R$\u00a0${int},${frac}`
}

/** "2026-11-10" → "10/11". */
export function ddmm(isoDate: string): string {
  const [, m, d] = isoDate.slice(0, 10).split('-')
  return `${d}/${m}`
}

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

/** Mês 1–12 por extenso, em minúscula. */
export function monthNamePt(month: number): string {
  return MESES[month - 1] ?? ''
}

/** O nome do cartão com o final: "Nubank ··1234". */
export function cardLabel(name: string, lastFour: string | null | undefined): string {
  const four = (lastFour ?? '').trim()
  return four ? `${name} ··${four}` : name
}

/** Porcentagem inteira, para baixo, contada em centavos (0,29/1 dá 29, e não 28). */
function percent(part: number, whole: number): number {
  const w = Math.round(whole * 100)
  if (w <= 0) return 0
  return Math.floor((Math.round(part * 100) * 100) / w)
}

function emDias(dias: number): string {
  if (dias === 0) return 'hoje'
  if (dias === 1) return 'amanhã'
  return `em ${dias} dias`
}

export function budgetCopy(a: {
  categoria: string
  mes: string
  gasto: number
  limite: number
  nivel: '80' | '100' | 'over'
}): Copy {
  const de = `${moneyBRL(a.gasto)} de ${moneyBRL(a.limite)}`
  if (a.nivel === '80') {
    return {
      title: `${a.categoria}: ${percent(a.gasto, a.limite)}% do orçamento de ${a.mes}`,
      body: `${de} — restam ${moneyBRL(a.limite - a.gasto)}.`,
    }
  }
  if (a.nivel === '100') {
    return { title: `${a.categoria}: orçamento de ${a.mes} esgotado`, body: `${de}.` }
  }
  return {
    title: `${a.categoria}: orçamento de ${a.mes} estourado`,
    body: `${de} (${percent(a.gasto, a.limite)}%) — ${moneyBRL(a.gasto - a.limite)} acima.`,
  }
}

export function cardLimitCopy(a: { cartao: string; usado: number; limite: number }): Copy {
  return {
    title: `${a.cartao}: ${percent(a.usado, a.limite)}% do limite`,
    body: `${moneyBRL(a.usado)} de ${moneyBRL(a.limite)}; disponível ${moneyBRL(Math.max(0, a.limite - a.usado))}.`,
  }
}

/** `null`: não envia — fatura zerada não é aviso. */
export function invoiceCopy(a: {
  cartao: string
  evento: 'closed' | 'closing_soon' | 'due_soon' | 'due_today'
  valor: number
  data: string
  dias?: number
}): Copy | null {
  if (!(a.valor > 0)) return null
  const fatura = `Fatura do ${a.cartao}`
  switch (a.evento) {
    case 'closed':
      return { title: `${fatura} fechou`, body: `Total ${moneyBRL(a.valor)}, vence em ${a.data}.` }
    case 'closing_soon':
      return {
        title: `${fatura} fecha ${emDias(a.dias ?? 0)}`,
        body: `Parcial ${moneyBRL(a.valor)}, fecha em ${a.data}.`,
      }
    case 'due_soon':
    case 'due_today':
      return {
        title: `${fatura} vence ${emDias(a.evento === 'due_today' ? 0 : (a.dias ?? 0))}`,
        body: `${moneyBRL(a.valor)} — vencimento ${a.data}.`,
      }
  }
}

/** `dias` < 0: atrasada. `valor` nulo: a conta não tem valor estimado. */
export function billCopy(a: { conta: string; valor: number | null; data: string; dias: number }): Copy {
  const valor = a.valor != null && Number.isFinite(a.valor) ? moneyBRL(a.valor) : null
  if (a.dias < 0) {
    return {
      title: `${a.conta} está atrasada`,
      body: `Vencia em ${a.data}${valor ? ` (${valor})` : ''}. Registre o pagamento.`,
    }
  }
  return {
    title: `${a.conta} vence ${emDias(a.dias)}`,
    body: valor ? `${valor} em ${a.data}.` : `Vence em ${a.data}.`,
  }
}
