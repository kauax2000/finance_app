import { assertEquals } from 'jsr:@std/assert@1.0.19'
import { offsetDaJanela, overdueDedupeBucket, shouldSendOverdue, withinReminderWindow } from './notification-schedule.ts'

Deno.test('conta atrasada avisa no 1º dia e a cada 7 dias depois, tolerando um dia perdido', () => {
  assertEquals([1, 2, 3, 7, 8, 9, 10, 15].map(shouldSendOverdue), [true, true, false, false, true, true, false, true])
  assertEquals(shouldSendOverdue(0), false)
})

Deno.test('"em breve" tolera um dia perdido', () => {
  assertEquals([withinReminderWindow(3, 3), withinReminderWindow(2, 3), withinReminderWindow(1, 3)], [true, true, false])
  assertEquals(withinReminderWindow(4, 3), false)
})

Deno.test('a chave da atrasada muda a cada janela de 7 dias', () => {
  assertEquals([1, 7, 8, 14, 15].map(overdueDedupeBucket), [0, 0, 1, 1, 2])
  // Os dois dias que avisam caem na mesma janela: um aviso só por janela.
  assertEquals(overdueDedupeBucket(1), overdueDedupeBucket(2))
  assertEquals(overdueDedupeBucket(8), overdueDedupeBucket(9))
})

Deno.test('conta a vencer: o menor offset da janela ainda não avisado', () => {
  // Um dia sem cron não perde o aviso: em 2 dias, o de 3 ainda vale.
  assertEquals(offsetDaJanela([3, 0], 2), 3)
  assertEquals(offsetDaJanela([3, 0], 2, [3]), null)
  // No dia, só o 0 (o menor dos devidos), mesmo sem o 3 avisado.
  assertEquals(offsetDaJanela([3, 0], 0), 0)
  assertEquals(offsetDaJanela([3, 0], 0, [0]), null)
  assertEquals(offsetDaJanela([3, 0], 4), null)
  assertEquals(offsetDaJanela([7, 3, 0], 5), 7)
  assertEquals(offsetDaJanela([7, 3, 0], 1), 3)
  assertEquals(offsetDaJanela([], 0), null)
})
