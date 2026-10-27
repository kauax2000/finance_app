import { assertEquals } from 'jsr:@std/assert@1.0.19'
import { clientIdDoJwt } from './auth-user.ts'

const b64url = (o: unknown) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const jwt = (payload: unknown) => `${b64url({ alg: 'ES256' })}.${b64url(payload)}.assinatura`

Deno.test('clientIdDoJwt lê o client_id do token de uma IA', () => {
  assertEquals(clientIdDoJwt(jwt({ sub: 'u', role: 'authenticated', client_id: 'cli-123' })), 'cli-123')
})

Deno.test('clientIdDoJwt: sessão do app (sem client_id ou vazio) é null', () => {
  assertEquals(clientIdDoJwt(jwt({ sub: 'u', role: 'authenticated' })), null)
  assertEquals(clientIdDoJwt(jwt({ sub: 'u', client_id: '' })), null)
  assertEquals(clientIdDoJwt(jwt({ sub: 'u', client_id: 42 })), null)
})

Deno.test('clientIdDoJwt: token malformado é null', () => {
  assertEquals(clientIdDoJwt('nao-e-jwt'), null)
  assertEquals(clientIdDoJwt('a.%%%.c'), null)
  assertEquals(clientIdDoJwt(`a.${btoa('nao json')}.c`), null)
  assertEquals(clientIdDoJwt(''), null)
})
