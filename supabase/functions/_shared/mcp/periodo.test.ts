import { assertEquals, assertThrows } from 'jsr:@std/assert@1.0.19'
import { dataValida, intervaloDoMes, mesAnterior, mesDe } from './periodo.ts'

Deno.test('mcp: intervalo do mês', () => {
  assertEquals(intervaloDoMes('2026-02'), { inicio: '2026-02-01', fim: '2026-02-28' })
  assertEquals(intervaloDoMes('2028-02').fim, '2028-02-29')
  assertThrows(() => intervaloDoMes('2026-13'), Error, 'mes_invalido')
})

Deno.test('mcp: mês anterior e mês de uma data', () => {
  assertEquals(mesAnterior('2026-01'), '2025-12')
  assertEquals(mesAnterior('2026-10'), '2026-09')
  assertEquals(mesDe('2026-10-27'), '2026-10')
})

Deno.test('mcp: data válida de calendário', () => {
  assertEquals(dataValida('2026-02-30'), false)
  assertEquals(dataValida('2026-02-28'), true)
  assertEquals(dataValida('26-02-28'), false)
})
