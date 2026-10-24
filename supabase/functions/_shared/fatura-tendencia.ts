/**
 * O alerta de fatura alta (`cc_invoice_trending_high`): a fatura em aberto,
 * somada às parcelas que ainda vão cair nela, contra a média das 3 últimas
 * fechadas. As parcelas seguem `sumProjectedCreditCardInstallmentsInWindow` do
 * cliente (src/lib/credit-card-installment-projection.ts), travado pelos vetores
 * de `src/lib/fixtures/fatura-tendencia-vectors.json`.
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- `@ts-expect-error` quebraria o `deno check`, onde a linha não tem erro.
// @ts-ignore TS5097: o Deno exige a extensão; o tsc do app chega aqui pelo teste de paridade.
import { type CardTxRow, daysInMonth, formatYmd, isoPrefixYmd, type OpenWindow, type Ymd } from './credit-card-cycle.ts'

/** As colunas de `workspace_installment_plans` que a projeção lê. */
export type PlanoNoCartao = {
  id: string
  is_active: boolean
  payment_method: string | null
  payment_credit_card_id: string | null
  next_billing_date: string
  installment_amount: number
  final_installment_amount: number
  total_installments: number
  generated_count: number
  billing_anchor_day: number | null
}

/** A linha do cartão com o vínculo da parcela, para não contar duas vezes a já lançada. */
export type ParcelaTxRow = CardTxRow & {
  installment_plan_id: string | null
  installment_sequence: number | null
}

/** `addMonths` do cliente: o dia é a âncora, ou o último dia do mês quando ele não existe. */
function somarMeses(x: Ymd, n: number, ancora: number): Ymd {
  const idx = x.y * 12 + (x.m - 1) + n
  const y = Math.floor(idx / 12)
  const m = idx - y * 12 + 1
  return { y, m, d: Math.min(ancora, daysInMonth(y, m)) }
}

/**
 * As parcelas do cartão com data na janela que ainda não viraram lançamento. O
 * calendário é o do plano inteiro (seq 1..total, de trás para a frente a partir
 * de `next_billing_date`), como o cliente: a parcela gerada e apagada volta.
 */
export function parcelasProjetadasNaJanela(
  cardId: string,
  janela: OpenWindow,
  planos: PlanoNoCartao[],
  rows: ParcelaTxRow[]
): number {
  const lancadas = new Set<string>()
  const doCartao = new Set<string>()
  for (const t of rows) {
    if (t.type !== 'expense' || t.payment_method !== 'credit_card' || t.payment_credit_card_id !== cardId) continue
    const pid = t.installment_plan_id
    if (!pid) continue
    doCartao.add(pid)
    const dia = isoPrefixYmd(t.date)
    if (dia) lancadas.add(`${pid}:${formatYmd(dia)}`)
    if (t.installment_sequence != null && t.installment_sequence >= 1) lancadas.add(`${pid}#${t.installment_sequence}`)
  }

  const inicio = formatYmd(janela.start)
  const fim = formatYmd(janela.end)
  let cents = 0
  for (const p of planos) {
    if (!p.is_active || p.payment_method !== 'credit_card') continue
    // O plano antigo sem cartão é reconhecido pela parcela já lançada nele.
    if (p.payment_credit_card_id !== cardId && !(p.payment_credit_card_id == null && doCartao.has(p.id))) continue
    const total = Number(p.total_installments)
    const proximo = isoPrefixYmd(p.next_billing_date)
    if (!proximo || !(total > 0)) continue
    const ancora = p.billing_anchor_day ?? proximo.d
    const primeira = somarMeses(proximo, -(Number(p.generated_count) || 0), ancora)
    for (let seq = 1; seq <= total; seq++) {
      const dia = formatYmd(somarMeses(primeira, seq - 1, ancora))
      if (dia < inicio || dia > fim) continue
      if (lancadas.has(`${p.id}#${seq}`) || lancadas.has(`${p.id}:${dia}`)) continue
      cents += Math.round(Number(seq === total ? p.final_installment_amount : p.installment_amount) * 100)
    }
  }
  return cents / 100
}

/**
 * Dispara só com 3 fechadas e a aberta acima de 120% da média delas (120%
 * exatos não). A conta é em centavos inteiros; `percentual` é o quanto a aberta
 * passa da média, arredondado.
 */
export function avaliarTendencia(
  abertaPrevista: number,
  ultimasFechadas: number[]
): { dispara: boolean; media: number; acima: number; percentual: number } {
  const n = ultimasFechadas.length
  const abertaC = Math.round(abertaPrevista * 100)
  const somaC = ultimasFechadas.reduce((s, v) => s + Math.round(v * 100), 0)
  const mediaC = n > 0 ? Math.round(somaC / n) : 0
  const percentual = somaC > 0 ? Math.round(((abertaC * n - somaC) * 100) / somaC) : 0
  return {
    // aberta > 1,2 × soma/n  ⇔  aberta × n × 5 > soma × 6
    dispara: n >= 3 && somaC > 0 && abertaC * n * 5 > somaC * 6,
    media: mediaC / 100,
    acima: (abertaC - mediaC) / 100,
    percentual,
  }
}
