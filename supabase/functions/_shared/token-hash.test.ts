import { assertEquals, assertMatch, assertNotEquals } from 'jsr:@std/assert'
import { legacyHashToken, sha256Hex, tokenHashCandidates } from './token-hash.ts'

Deno.test('sha256Hex produces the known SHA-256 of "abc"', async () => {
  assertEquals(
    await sha256Hex('abc'),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
  )
})

Deno.test('sha256Hex is 64 lowercase hex chars', async () => {
  assertMatch(await sha256Hex('any token value'), /^[0-9a-f]{64}$/)
})

Deno.test('sha256Hex differs for different inputs', async () => {
  assertNotEquals(await sha256Hex('token-a'), await sha256Hex('token-b'))
})

Deno.test('legacyHashToken matches the historical 32-bit format', () => {
  // Reference values computed with the original implementation.
  assertEquals(legacyHashToken(''), '0')
  assertEquals(legacyHashToken('abc'), '17862')
  // Negative hash values serialize with a leading minus (historic behavior).
  const h = legacyHashToken('some.jwt.value-that-hashes-negative-eventually-xyz')
  assertMatch(h, /^-?[0-9a-f]+$/)
})

Deno.test('tokenHashCandidates returns [sha256, legacy] in order', async () => {
  const token = 'header.payload.signature'
  const [current, legacy] = await tokenHashCandidates(token)
  assertEquals(current, await sha256Hex(token))
  assertEquals(legacy, legacyHashToken(token))
})
