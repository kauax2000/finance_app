import { assertEquals } from 'jsr:@std/assert@1.0.19'
import { avisoDoTeste, AVISO_TESTE_DIA, COBERTOS_MAX, TESTE_DIAS } from './plano.ts'

Deno.test('avisoDoTeste: título fixo e as três partes no plural', () => {
  const a = avisoDoTeste({ lancados_sozinho: 12, a_conferir: 3, avisos: 5 })
  assertEquals(a.titulo, 'Seu teste termina em 2 dias')
  assertEquals(
    a.corpo,
    'Nestes dias o app lançou 12 gastos sozinho, separou 3 para conferir e mandou 5 avisos. Assine em Planos para continuar lançando.',
  )
})

Deno.test('avisoDoTeste: um gasto e um aviso ficam no singular', () => {
  const a = avisoDoTeste({ lancados_sozinho: 1, a_conferir: 1, avisos: 1 })
  assertEquals(
    a.corpo,
    'Nestes dias o app lançou 1 gasto sozinho, separou 1 para conferir e mandou 1 aviso. Assine em Planos para continuar lançando.',
  )
})

Deno.test('avisoDoTeste: a parte com zero some da frase', () => {
  assertEquals(
    avisoDoTeste({ lancados_sozinho: 4, a_conferir: 0, avisos: 2 }).corpo,
    'Nestes dias o app lançou 4 gastos sozinho e mandou 2 avisos. Assine em Planos para continuar lançando.',
  )
  assertEquals(
    avisoDoTeste({ lancados_sozinho: 0, a_conferir: 0, avisos: 1 }).corpo,
    'Nestes dias o app mandou 1 aviso. Assine em Planos para continuar lançando.',
  )
  assertEquals(
    avisoDoTeste({ lancados_sozinho: 2, a_conferir: 0, avisos: 0 }).corpo,
    'Nestes dias o app lançou 2 gastos sozinho. Assine em Planos para continuar lançando.',
  )
})

Deno.test('avisoDoTeste: com tudo zerado, só o convite', () => {
  assertEquals(
    avisoDoTeste({ lancados_sozinho: 0, a_conferir: 0, avisos: 0 }).corpo,
    'Assine em Planos para continuar lançando.',
  )
})

Deno.test('constantes de plano', () => {
  assertEquals([TESTE_DIAS, AVISO_TESTE_DIA, COBERTOS_MAX], [14, 12, 5])
})
