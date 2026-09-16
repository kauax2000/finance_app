import { assertEquals } from 'jsr:@std/assert@1.0.19'
import { sessionGuardMessage } from './http.ts'

Deno.test('sessionGuardMessage passes the guard 401 through, so the client can detect revocation', () => {
  assertEquals(
    sessionGuardMessage('sessions', { status: 401, message: 'Session expired or invalidated' }),
    'Session expired or invalidated'
  )
})

Deno.test('sessionGuardMessage masks a 500, which carries the database error', () => {
  const original = console.error
  console.error = () => {}
  try {
    assertEquals(
      sessionGuardMessage('sessions', { status: 500, message: 'relation "user_sessions" does not exist' }),
      'Erro interno. Tente novamente.'
    )
  } finally {
    console.error = original
  }
})
