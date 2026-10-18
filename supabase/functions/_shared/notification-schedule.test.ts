import { assertEquals } from 'jsr:@std/assert@1.0.19'
import { overdueDedupeBucket, shouldSendOverdue, withinReminderWindow } from './notification-schedule.ts'

Deno.test('conta atrasada avisa no 1º dia e a cada 7 dias depois', () => {
  assertEquals([1, 2, 7, 8, 15].map(shouldSendOverdue), [true, false, false, true, true])
  assertEquals(shouldSendOverdue(0), false)
})

Deno.test('"em breve" tolera um dia perdido', () => {
  assertEquals([withinReminderWindow(3, 3), withinReminderWindow(2, 3), withinReminderWindow(1, 3)], [true, true, false])
  assertEquals(withinReminderWindow(4, 3), false)
})

Deno.test('a chave da atrasada muda a cada janela de 7 dias', () => {
  assertEquals([1, 7, 8, 14, 15].map(overdueDedupeBucket), [0, 0, 1, 1, 2])
})
