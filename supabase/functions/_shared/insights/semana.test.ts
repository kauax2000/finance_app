import { assertEquals } from 'jsr:@std/assert@1.0.19'
import { segundaDaSemana } from './semana.ts'

Deno.test('segundaDaSemana: terça e domingo caem na segunda anterior', () => {
  assertEquals(segundaDaSemana('2026-10-27'), '2026-10-26')
  assertEquals(segundaDaSemana('2026-11-01'), '2026-10-26')
})

Deno.test('segundaDaSemana: a segunda é ela mesma, e a virada de mês e de ano', () => {
  assertEquals(segundaDaSemana('2026-10-26'), '2026-10-26')
  assertEquals(segundaDaSemana('2026-11-02'), '2026-11-02')
  assertEquals(segundaDaSemana('2027-01-01'), '2026-12-28')
})
