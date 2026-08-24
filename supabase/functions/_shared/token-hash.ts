/**
 * Session token hashing for `user_sessions.token_hash`.
 *
 * SHA-256 replaces the legacy 32-bit Java-style string hash (trivially
 * collidable, ~4e9 output space). Legacy hashes still exist in rows written
 * before the migration, so lookups must match either format until rows
 * self-heal (every write path re-stamps the SHA-256 value).
 */

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Legacy 32-bit hash — kept ONLY to match pre-migration rows on read. */
export function legacyHashToken(token: string): string {
  let hash = 0
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(16)
}

/** [current, legacy] hashes for read-path matching during the transition. */
export async function tokenHashCandidates(token: string): Promise<string[]> {
  return [await sha256Hex(token), legacyHashToken(token)]
}
