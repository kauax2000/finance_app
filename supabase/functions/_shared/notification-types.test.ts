import { assertEquals } from 'jsr:@std/assert@1.0.19'
import {
  canaisDoAviso,
  DEFAULT_NOTIFICATION_PREFS,
  isTypeAllowedForPrefs,
  resolveNotificationHref,
} from './notification-types.ts'

Deno.test('resolveNotificationHref aceita caminho interno', () => {
  assertEquals(resolveNotificationHref({ href: '/bills' }), '/bills')
})

Deno.test('resolveNotificationHref apara antes de checar, como o cliente', () => {
  assertEquals(resolveNotificationHref({ href: ' /categories/x' }), '/categories/x')
})

Deno.test('resolveNotificationHref recusa o que sai do app, como o cliente', () => {
  for (const href of ['/\\evil.com', '/\t/evil.com', '/\n/evil.com', '//evil.com', 'https://evil.com']) {
    assertEquals(resolveNotificationHref({ href }), '/dashboard', JSON.stringify(href))
  }
  assertEquals(resolveNotificationHref({ href: '//evil.com', kind: 'bill_reminder' }), '/bills')
})

Deno.test('canaisDoAviso: essencial manda in-app e e-mail mesmo desligados; push segue a preferência', () => {
  const desligado = { ...DEFAULT_NOTIFICATION_PREFS, notify_in_app: false, notify_email: false, notify_push: false }
  assertEquals(canaisDoAviso(desligado, true), { in_app: true, email: true, push: false })
  assertEquals(canaisDoAviso({ ...desligado, notify_push: true }, true).push, true)
})

Deno.test('canaisDoAviso: sem essencial, os três seguem as preferências', () => {
  const p = { ...DEFAULT_NOTIFICATION_PREFS, notify_email: false, notify_push: true }
  assertEquals(canaisDoAviso(p, false), { in_app: true, email: false, push: true })
})

Deno.test("isTypeAllowedForPrefs: 'insight' segue notify_insights, ligado por padrão", () => {
  assertEquals(isTypeAllowedForPrefs('insight', DEFAULT_NOTIFICATION_PREFS), true)
  assertEquals(isTypeAllowedForPrefs('insight', { ...DEFAULT_NOTIFICATION_PREFS, notify_insights: false }), false)
})
