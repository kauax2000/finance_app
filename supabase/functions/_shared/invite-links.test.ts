import { assertEquals } from 'jsr:@std/assert@1.0.19'
import { escolherLinksAtivos, type LinhaDeLink } from './invite-links.ts'

const agora = new Date('2026-11-05T12:00:00Z')
const linha = (id: string, role: 'member' | 'guest', criado: string, expira = '2026-11-10T00:00:00Z'): LinhaDeLink => ({
  id,
  role,
  created_at: criado,
  expires_at: expira,
  token_hash: `h-${id}`,
})

Deno.test('um link de cada papel devolve os dois', () => {
  const r = escolherLinksAtivos(
    [linha('a', 'member', '2026-11-01T00:00:00Z'), linha('b', 'guest', '2026-11-02T00:00:00Z')],
    agora
  )
  assertEquals(r.member?.id, 'a')
  assertEquals(r.guest?.id, 'b')
})

Deno.test('dois de membro: vale o created_at maior', () => {
  const r = escolherLinksAtivos(
    [linha('velho', 'member', '2026-11-01T00:00:00Z'), linha('novo', 'member', '2026-11-03T00:00:00Z')],
    agora
  )
  assertEquals(r.member?.id, 'novo')
  assertEquals(r.guest, null)
})

Deno.test('convidado vencido vira null', () => {
  const r = escolherLinksAtivos([linha('g', 'guest', '2026-10-01T00:00:00Z', '2026-11-04T00:00:00Z')], agora)
  assertEquals(r.guest, null)
})

Deno.test('lista vazia devolve os dois null', () => {
  assertEquals(escolherLinksAtivos([], agora), { member: null, guest: null })
})
