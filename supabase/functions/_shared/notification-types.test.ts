import { assertEquals } from 'jsr:@std/assert@1.0.19'
import { resolveNotificationHref } from './notification-types.ts'

Deno.test('resolveNotificationHref aceita caminho interno', () => {
  assertEquals(resolveNotificationHref({ href: '/bills' }), '/bills')
})

Deno.test('resolveNotificationHref recusa o que sai do app, como o cliente', () => {
  for (const href of ['/\\evil.com', '/\t/evil.com', '/\n/evil.com', '//evil.com', 'https://evil.com']) {
    assertEquals(resolveNotificationHref({ href }), '/dashboard', JSON.stringify(href))
  }
  assertEquals(resolveNotificationHref({ href: '//evil.com', kind: 'bill_reminder' }), '/bills')
})
