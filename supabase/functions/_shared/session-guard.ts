import { tokenHashCandidates, sha256Hex } from './token-hash.ts'

/**
 * App-session enforcement shared by `sessions` and `activity-logs`.
 *
 * Matches the caller's JWT to an active `user_sessions` row:
 * 1. by `token_hash` (SHA-256, with legacy 32-bit fallback during transition);
 * 2. by the `x-app-session-id` header (re-binds the hash after JWT rotation);
 * 3. by the JWT's GoTrue `session_id` claim stored in `auth_session_id`
 *    (re-binds when localStorage was cleared but the login session is intact).
 *
 * Bootstrap (zero rows for the user) is allowed; all-revoked (rows exist,
 * none active) is rejected.
 */

export type SupabaseAdmin = {
  // Structural stand-in for the supabase-js client (avoids importing createClient here).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any
}

export type SessionGuardResult =
  | { ok: true }
  | { ok: false; status: number; message: string }

function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  const parts = jwt.split('.')
  if (parts.length !== 3) return null
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const jsonStr = atob(b64)
    const payload = JSON.parse(jsonStr)
    return typeof payload === 'object' && payload !== null ? payload : null
  } catch {
    return null
  }
}

/** GoTrue session id claim from an (already validated) access token. */
export function jwtAuthSessionId(jwt: string): string | null {
  const payload = decodeJwtPayload(jwt)
  const sid = payload?.session_id
  return typeof sid === 'string' && sid.trim() ? sid.trim() : null
}

export async function assertCallerSessionAllowed(
  supabaseAdmin: SupabaseAdmin,
  userId: string,
  token: string,
  req: Request
): Promise<SessionGuardResult> {
  const hashes = await tokenHashCandidates(token)
  const currentHash = hashes[0]
  const sessionIdHeader = req.headers.get('x-app-session-id')?.trim() || null
  const authSessionId = jwtAuthSessionId(token)

  const [totalRes, activeRes] = await Promise.all([
    supabaseAdmin
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabaseAdmin
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true),
  ])

  if (totalRes.error) return { ok: false, status: 500, message: totalRes.error.message }
  if (activeRes.error) return { ok: false, status: 500, message: activeRes.error.message }

  const t = totalRes.count ?? 0
  const a = activeRes.count ?? 0

  if (t === 0) return { ok: true }
  if (a === 0) {
    return { ok: false, status: 401, message: 'Session expired or invalidated' }
  }

  const { data: hashRows, error: hashErr } = await supabaseAdmin
    .from('user_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .in('token_hash', hashes)
    .limit(1)

  if (hashErr) return { ok: false, status: 500, message: hashErr.message }

  const byHash = hashRows?.[0] ?? null
  if (byHash) {
    return { ok: true }
  }

  const rebind = async (rowId: string): Promise<SessionGuardResult> => {
    const { error: upErr } = await supabaseAdmin
      .from('user_sessions')
      .update({
        token_hash: currentHash,
        ...(authSessionId ? { auth_session_id: authSessionId } : {}),
      })
      .eq('id', rowId)
    if (upErr) return { ok: false, status: 500, message: upErr.message }
    return { ok: true }
  }

  if (sessionIdHeader) {
    const { data: bySid, error: sidErr } = await supabaseAdmin
      .from('user_sessions')
      .select('id')
      .eq('id', sessionIdHeader)
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle()

    if (sidErr) return { ok: false, status: 500, message: sidErr.message }
    if (bySid) return rebind(bySid.id)
  }

  if (authSessionId) {
    const { data: byAuthSid, error: authSidErr } = await supabaseAdmin
      .from('user_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('auth_session_id', authSessionId)
      .eq('is_active', true)
      .limit(1)

    if (authSidErr) return { ok: false, status: 500, message: authSidErr.message }
    const row = byAuthSid?.[0] ?? null
    if (row) return rebind(row.id)
  }

  return { ok: false, status: 401, message: 'Session expired or invalidated' }
}

/**
 * Guard for POST session (re-)registration: blocks a revoked device from
 * re-creating an active row with a JWT minted before the revocation.
 *
 * A fresh password login mints a new GoTrue `session_id`, so it never
 * matches a revoked row and registration proceeds. A revoked device reusing
 * its old JWT matches the inactive row it came from and is rejected.
 */
export async function assertRegistrationAllowed(
  supabaseAdmin: SupabaseAdmin,
  userId: string,
  token: string
): Promise<SessionGuardResult> {
  const [totalRes, activeRes] = await Promise.all([
    supabaseAdmin
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabaseAdmin
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true),
  ])

  if (totalRes.error) return { ok: false, status: 500, message: totalRes.error.message }
  if (activeRes.error) return { ok: false, status: 500, message: activeRes.error.message }

  const t = totalRes.count ?? 0
  const a = activeRes.count ?? 0

  // Bootstrap: first session ever for the user.
  if (t === 0) return { ok: true }

  const authSessionId = jwtAuthSessionId(token)

  if (authSessionId) {
    const { data: revokedRows, error: revErr } = await supabaseAdmin
      .from('user_sessions')
      .select('id, is_active')
      .eq('user_id', userId)
      .eq('auth_session_id', authSessionId)

    if (revErr) return { ok: false, status: 500, message: revErr.message }

    const rows = (revokedRows ?? []) as { id: string; is_active: boolean }[]
    const hasActive = rows.some((r) => r.is_active)
    const hasRevoked = rows.some((r) => !r.is_active)
    if (hasRevoked && !hasActive) {
      return { ok: false, status: 401, message: 'Session expired or invalidated' }
    }
    // Known-active login session (or a login session we never saw): allowed.
    return { ok: true }
  }

  // Legacy JWT without session_id claim: fall back to the documented rule —
  // block re-registration only when every session was revoked.
  if (a === 0) {
    return { ok: false, status: 401, message: 'Session expired or invalidated' }
  }
  return { ok: true }
}

export { sha256Hex }
