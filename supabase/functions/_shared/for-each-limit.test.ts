import { assertEquals } from 'jsr:@std/assert'
import { forEachLimit } from './for-each-limit.ts'

Deno.test('processa todos os itens sem passar do teto de chamadas abertas', async () => {
  let open = 0
  let peak = 0
  const done: number[] = []
  await forEachLimit([1, 2, 3, 4, 5, 6, 7], 3, async (n) => {
    open++
    peak = Math.max(peak, open)
    await new Promise((r) => setTimeout(r, 5))
    done.push(n)
    open--
  })
  assertEquals(done.sort(), [1, 2, 3, 4, 5, 6, 7])
  assertEquals(peak, 3)
})

Deno.test('lista vazia não chama nada', async () => {
  let calls = 0
  await forEachLimit([], 5, async () => {
    calls++
  })
  assertEquals(calls, 0)
})
