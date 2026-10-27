import {
  addCalendarDays,
  type CardTxRow,
  cardInvoiceNetInWindow,
  escolherTotal,
  estimatedDueYmdForClose,
  formatYmd,
  invoiceWindowEndingAt,
  openInvoiceWindow,
  statementTotalKey,
  type Ymd,
} from '../credit-card-cycle.ts'
import { type Dinheiro, dinheiro } from './resposta.ts'

export type Cartao = { id: string; name: string; closing_day: number; due_day: number; last_four: string | null }

const centavos = (reais: number) => Math.round(reais * 100)

export function faturaDoCartao(
  cartao: Cartao,
  linhas: CardTxRow[],
  totaisDoBanco: Map<string, number | string>,
  hoje: Ymd,
): {
  cartao_id: string
  nome: string
  final: string | null
  aberta: { inicio: string; fim: string; vencimento: string; total: Dinheiro }
  ultima_fechada: { inicio: string; fechamento: string; vencimento: string; total: Dinheiro; do_banco: boolean }
} {
  const aberta = openInvoiceWindow(hoje, cartao.closing_day)
  const fechamento = addCalendarDays(aberta.start, -1)
  const fechada = invoiceWindowEndingAt(fechamento, cartao.closing_day)
  const doBanco = totaisDoBanco.get(statementTotalKey(cartao.id, formatYmd(fechamento)))
  const totalFechada = escolherTotal(cardInvoiceNetInWindow(linhas, cartao.id, fechada), doBanco)
  return {
    cartao_id: cartao.id,
    nome: cartao.name,
    final: cartao.last_four,
    aberta: {
      inicio: formatYmd(aberta.start),
      fim: formatYmd(aberta.end),
      vencimento: formatYmd(estimatedDueYmdForClose(aberta.end, cartao.due_day)),
      total: dinheiro(centavos(cardInvoiceNetInWindow(linhas, cartao.id, aberta))),
    },
    ultima_fechada: {
      inicio: formatYmd(fechada.start),
      fechamento: formatYmd(fechamento),
      vencimento: formatYmd(estimatedDueYmdForClose(fechamento, cartao.due_day)),
      total: dinheiro(centavos(totalFechada)),
      do_banco: doBanco != null,
    },
  }
}

/** Da menor `ultima_fechada.inicio` à maior `aberta.fim`: uma consulta cobre todos os cartões. */
export function janelaDasFaturas(cartoes: Cartao[], hoje: Ymd): { inicio: string; fim: string } {
  const fat = cartoes.map((c) => faturaDoCartao(c, [], new Map(), hoje))
  const inicios = fat.map((f) => f.ultima_fechada.inicio).sort()
  const fins = fat.map((f) => f.aberta.fim).sort()
  return { inicio: inicios[0], fim: fins[fins.length - 1] }
}
