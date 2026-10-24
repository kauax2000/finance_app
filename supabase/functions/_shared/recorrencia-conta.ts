// A regra de recorrência das contas a pagar, sem nenhum import: o cliente
// (src/lib/bills/recurrence.ts reexporta e adapta) e a Edge leem esta só.
// Só calendário: datas são 'YYYY-MM-DD', sem fuso.

export type Frequencia = 'monthly' | 'bimonthly' | 'quarterly' | 'yearly' | 'one_time'

type Agenda = {
  frequency: Frequencia
  due_day_of_month: number
  end_date: string | null
  is_active: boolean
}

const MESES: Record<Frequencia, number> = { monthly: 1, bimonthly: 2, quarterly: 3, yearly: 12, one_time: 0 }

function diasNoMes(ano: number, mes1: number): number {
  return new Date(Date.UTC(ano, mes1, 0)).getUTCDate()
}

function ymd(ano: number, mes1: number, dia: number): string {
  const d = Math.min(dia, diasNoMes(ano, mes1))
  return `${ano}-${String(mes1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function partes(s: string): [number, number, number] {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  const [ano, mes, dia] = m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [0, 0, 0]
  if (!m || mes < 1 || mes > 12 || dia < 1 || dia > 31) throw new Error(`data inválida: ${s}`)
  return [ano, mes, dia]
}

function ancora(dia: number): number {
  return Math.min(Math.max(1, dia), 31)
}

/** Primeiro vencimento >= início no dia da conta (limitado ao tamanho do mês). */
export function primeiroVencimento(inicioYmd: string, diaDoVencimento: number): string {
  const inicio = inicioYmd.slice(0, 10)
  let [ano, mes] = partes(inicio)
  const dia = ancora(diaDoVencimento)
  let cand = ymd(ano, mes, dia)
  if (cand < inicio) {
    mes += 1
    if (mes > 12) {
      mes = 1
      ano += 1
    }
    cand = ymd(ano, mes, dia)
  }
  return cand
}

/** O vencimento seguinte ao dado; `null` para `one_time`; data malformada lança. */
export function proximoVencimento(
  depoisDeYmd: string,
  frequencia: Frequencia,
  diaDoVencimento: number,
): string | null {
  if (frequencia === 'one_time') return null
  const p = partes(depoisDeYmd)
  const total = p[0] * 12 + (p[1] - 1) + MESES[frequencia]
  return ymd(Math.floor(total / 12), (total % 12) + 1, ancora(diaDoVencimento))
}

/** O que nasce depois de pagar `vencimentoPagoYmd`: `null` se inativa, única ou passou do fim. */
export function proximoVencimentoDaConta(conta: Agenda, vencimentoPagoYmd: string): string | null {
  if (!conta.is_active) return null
  const proximo = proximoVencimento(vencimentoPagoYmd, conta.frequency, conta.due_day_of_month)
  if (!proximo) return null
  if (conta.end_date && proximo > conta.end_date.slice(0, 10)) return null
  return proximo
}

/** Os vencimentos depois do último, até hoje (inclusive), respeitando o fim. */
export function vencimentosQueFaltam(conta: Agenda, ultimoVencimentoYmd: string, hojeYmd: string): string[] {
  const saida: string[] = []
  let atual = ultimoVencimentoYmd
  for (;;) {
    const proximo = proximoVencimentoDaConta(conta, atual)
    if (!proximo || proximo > hojeYmd) return saida
    saida.push(proximo)
    atual = proximo
  }
}
