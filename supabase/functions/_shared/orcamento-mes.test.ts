/**
 * O gasto da categoria no mês do orçamento (edge) contra os vetores dourados
 * (src/lib/fixtures/orcamento-mes-vectors.json), os mesmos que o Vitest confere
 * contra o `postedTotal` da tela de Categorias (src/lib/orcamento-mes-parity.test.ts).
 */
import { assertEquals } from 'jsr:@std/assert@1.0.19'
import { gastoDaCategoriaNoMes } from './orcamento-mes.ts'

const vectors = JSON.parse(
  await Deno.readTextFile(new URL('../../../src/lib/fixtures/orcamento-mes-vectors.json', import.meta.url))
)

Deno.test('gastoDaCategoriaNoMes bate com os vetores dourados', () => {
  for (const v of vectors.cases) {
    assertEquals(gastoDaCategoriaNoMes(v.rows, v.category_id, v.ym, v.cards), v.expected, v.name)
  }
})
