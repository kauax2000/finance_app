import { assertEquals } from 'jsr:@std/assert@1.0.19'
import { marcoDoDia, textoDoAviso } from './reativacao.ts'

Deno.test('marcoDoDia: 3 de 3 a 6, 7 de 7 a 9, nada fora', () => {
  assertEquals(marcoDoDia(2), null)
  assertEquals(marcoDoDia(3), 3)
  assertEquals(marcoDoDia(6), 3)
  assertEquals(marcoDoDia(7), 7)
  assertEquals(marcoDoDia(9), 7)
  assertEquals(marcoDoDia(10), null)
})

Deno.test('textoDoAviso: o 3º dia diz o dia da semana do último acesso', () => {
  const t = textoDoAviso(3, '2026-11-17')
  assertEquals(t.titulo, 'Seus gastos estão esperando')
  assertEquals(t.corpo, 'Leva 10 segundos lançar o que você gastou desde terça.')
  assertEquals(textoDoAviso(3, '2026-11-15').corpo.endsWith('desde domingo.'), true)
})

Deno.test('textoDoAviso: o 7º dia', () => {
  const t = textoDoAviso(7, '2026-11-17')
  assertEquals(t.titulo, 'Uma semana sem lançar')
  assertEquals(t.corpo, 'Abra o Finance e ponha o mês em dia.')
})
