import { assertEquals } from 'jsr:@std/assert'
import {
  INVITE_EMAILS_PER_DAY,
  INVITE_EMAILS_PER_RECIPIENT_PER_DAY,
  inviteEmailLimitReached,
} from './invite-rate-limit.ts'

const sentTo = (email: string) => ({ metadata: { invited_email: email } })
const link = { metadata: { workspace_id: 'w1' } }

Deno.test('abaixo dos dois tetos, envia', () => {
  assertEquals(inviteEmailLimitReached([sentTo('a@x.com'), link], 'b@x.com'), false)
})

Deno.test('o mesmo destinatário esgota antes do teto diário', () => {
  const rows = Array.from({ length: INVITE_EMAILS_PER_RECIPIENT_PER_DAY }, () => sentTo('a@x.com'))
  assertEquals(inviteEmailLimitReached(rows, 'a@x.com'), true)
  assertEquals(inviteEmailLimitReached(rows, 'b@x.com'), false)
})

Deno.test('o teto diário vale para qualquer destinatário', () => {
  const rows = Array.from({ length: INVITE_EMAILS_PER_DAY }, (_, i) => sentTo(`${i}@x.com`))
  assertEquals(inviteEmailLimitReached(rows, 'novo@x.com'), true)
})

Deno.test('link de convite não conta como e-mail', () => {
  const rows = Array.from({ length: INVITE_EMAILS_PER_DAY }, () => link)
  assertEquals(inviteEmailLimitReached(rows, 'a@x.com'), false)
})
