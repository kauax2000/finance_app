/** Validate JWT using Supabase Auth REST (stable in Deno Edge; avoids client auth quirks). */
export type AuthUser = { id: string; email?: string | null }

export async function getAuthUserFromJwt(
  supabaseUrl: string,
  anonKey: string,
  jwt: string
): Promise<{ user: AuthUser; error: null } | { user: null; error: string }> {
  const base = supabaseUrl.replace(/\/$/, '')
  const res = await fetch(`${base}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      apikey: anonKey,
    },
  })

  if (!res.ok) {
    let detail = res.statusText
    try {
      const j = (await res.json()) as { msg?: string; error_description?: string; message?: string }
      if (j.msg) detail = j.msg
      else if (j.error_description) detail = j.error_description
      else if (j.message) detail = j.message
    } catch {
      try {
        const t = await res.text()
        if (t) detail = t.slice(0, 200)
      } catch {
        /* ignore */
      }
    }
    return { user: null, error: detail }
  }

  const user = (await res.json()) as { id?: string; email?: string | null }
  if (!user?.id) {
    return { user: null, error: 'Invalid user payload' }
  }
  return { user: { id: user.id, email: user.email }, error: null }
}

export function bearerJwt(authHeader: string | null): string | null {
  if (!authHeader?.trim()) return null
  const m = authHeader.match(/^Bearer\s+(.+)$/i)
  const raw = (m?.[1] ?? authHeader).trim()
  return raw || null
}
