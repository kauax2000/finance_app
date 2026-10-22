import { assertEquals } from 'jsr:@std/assert@1.0.19'
import { corpoDoLembrete, pessoasParaLembrar } from './review-reminder.ts'
import { DEFAULT_NOTIFICATION_PREFS, isTypeAllowedForPrefs } from './notification-types.ts'

Deno.test('pessoasParaLembrar agrupa por pessoa e carteira e conta', () => {
  const r = pessoasParaLembrar([
    { user_id: 'u1', workspace_id: 'w1' },
    { user_id: 'u1', workspace_id: 'w1' },
    { user_id: 'u1', workspace_id: 'w2' },
    { user_id: 'u2', workspace_id: 'w1' },
    { user_id: 'u1', workspace_id: 'w1' },
  ])
  assertEquals(r, [
    { userId: 'u1', workspaceId: 'w1', total: 3 },
    { userId: 'u1', workspaceId: 'w2', total: 1 },
    { userId: 'u2', workspaceId: 'w1', total: 1 },
  ])
})

Deno.test('pessoasParaLembrar sem linhas não lembra ninguém', () => {
  assertEquals(pessoasParaLembrar([]), [])
})

Deno.test('corpoDoLembrete: singular e plural', () => {
  assertEquals(corpoDoLembrete(1), 'Você tem 1 lançamento para conferir.')
  assertEquals(corpoDoLembrete(3), 'Você tem 3 lançamentos para conferir.')
})

Deno.test("isTypeAllowedForPrefs: 'review' segue notify_review", () => {
  assertEquals(isTypeAllowedForPrefs('review', DEFAULT_NOTIFICATION_PREFS), true)
  assertEquals(isTypeAllowedForPrefs('review', { ...DEFAULT_NOTIFICATION_PREFS, notify_review: false }), false)
})
