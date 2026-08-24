/**
 * Constant-time string comparison for shared secrets (cron secret,
 * internal webhook secret, service-role bearer). Plain `===` leaks the
 * matching prefix length through response timing.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder()
  const ab = enc.encode(a)
  const bb = enc.encode(b)
  // Length differences still short-circuit, but the secret's byte values
  // are never compared with early exit.
  if (ab.length !== bb.length) return false
  let diff = 0
  for (let i = 0; i < ab.length; i++) {
    diff |= ab[i] ^ bb[i]
  }
  return diff === 0
}

/** True when `provided` matches the configured `secret` (both non-empty). */
export function secretMatches(
  secret: string | undefined | null,
  provided: string | undefined | null
): boolean {
  const s = secret?.trim()
  const p = provided?.trim()
  if (!s || !p) return false
  return timingSafeEqual(s, p)
}
