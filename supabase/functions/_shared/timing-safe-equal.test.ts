import { assert, assertFalse } from 'jsr:@std/assert'
import { secretMatches, timingSafeEqual } from './timing-safe-equal.ts'

Deno.test('timingSafeEqual: equal strings match', () => {
  assert(timingSafeEqual('super-secret', 'super-secret'))
})

Deno.test('timingSafeEqual: different strings do not match', () => {
  assertFalse(timingSafeEqual('super-secret', 'super-secreT'))
  assertFalse(timingSafeEqual('short', 'longer-value'))
  assertFalse(timingSafeEqual('', 'x'))
})

Deno.test('secretMatches: trims and compares', () => {
  assert(secretMatches('  secret  ', 'secret'))
  assert(secretMatches('secret', '  secret\n'))
})

Deno.test('secretMatches: empty/missing values never match', () => {
  assertFalse(secretMatches(undefined, 'secret'))
  assertFalse(secretMatches('secret', undefined))
  assertFalse(secretMatches(null, null))
  assertFalse(secretMatches('', ''))
  assertFalse(secretMatches('   ', '   '))
})
