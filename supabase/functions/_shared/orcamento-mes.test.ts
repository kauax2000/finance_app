/**
 * O gasto da categoria no mês do orçamento (edge) contra os vetores dourados
 * (src/lib/fixtures/orcamento-mes-vectors.json), os mesmos que o Vitest confere
 * contra o `postedTotal` da tela de Categorias (src/lib/orcamento-mes-parity.test.ts).
 */
import { assertEquals } from 'jsr:@std/assert@1.0.19'
import { diasCandidatos, gastoDaCategoriaNoMes } from './orcamento-mes.ts'

const vectors = JSON.parse(
  await Deno.readTextFile(new URL('../../../src/lib/fixtures/orcamento-mes-vectors.json', import.meta.url))
)

Deno.test('gastoDaCategoriaNoMes bate com os vetores dourados', () => {
  for (const v of vectors.cases) {
    assertEquals(gastoDaCategoriaNoMes(v.rows, v.category_id, v.ym, v.cards), v.expected, v.name)
  }
})

Deno.test('diasCandidatos: um dia só quando o corpo traz o pagamento', () => {
  const cards = { c1: 20, c2: 5 }
  assertEquals(diasCandidatos('2026-05-25', cards, { payment_method: 'pix', payment_credit_card_id: null }), [
    '2026-05-25',
  ])
  assertEquals(diasCandidatos('2026-05-25', cards, { payment_method: 'credit_card', payment_credit_card_id: 'c1' }), [
    '2026-06-20',
  ])
  assertEquals(diasCandidatos('2026-05-25', cards, { payment_method: 'credit_card', payment_credit_card_id: 'c9' }), [
    '2026-05-25',
  ])
})

Deno.test('diasCandidatos: sem o pagamento (front antigo), o dia e o fechamento em cada cartão', () => {
  assertEquals(diasCandidatos('2026-05-25', { c1: 20, c2: 5 }), ['2026-05-25', '2026-06-05', '2026-06-20'])
  assertEquals(diasCandidatos('2026-05-25', {}), ['2026-05-25'])
})
