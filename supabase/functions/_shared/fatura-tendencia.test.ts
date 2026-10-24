/**
 * O alerta de fatura alta (edge) contra os vetores dourados
 * (src/lib/fixtures/fatura-tendencia-vectors.json). As parcelas são as mesmas
 * que o Vitest confere contra o `sumProjectedCreditCardInstallmentsInWindow` do
 * cliente (src/lib/fatura-tendencia-parity.test.ts).
 */
import { assertEquals } from 'jsr:@std/assert@1.0.19'
import { isoPrefixYmd } from './credit-card-cycle.ts'
import { avaliarTendencia, parcelasProjetadasNaJanela } from './fatura-tendencia.ts'

const vectors = JSON.parse(
  await Deno.readTextFile(new URL('../../../src/lib/fixtures/fatura-tendencia-vectors.json', import.meta.url))
)

Deno.test('parcelasProjetadasNaJanela bate com os vetores dourados', () => {
  for (const v of vectors.parcelas) {
    const janela = { start: isoPrefixYmd(v.window.start)!, end: isoPrefixYmd(v.window.end)! }
    assertEquals(parcelasProjetadasNaJanela(v.card_id, janela, v.plans, v.rows), v.expected, v.name)
  }
})

Deno.test('avaliarTendencia bate com os vetores dourados', () => {
  for (const v of vectors.tendencia) {
    assertEquals(avaliarTendencia(v.aberta, v.fechadas), v.expected, v.name)
  }
})
