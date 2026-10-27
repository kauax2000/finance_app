/** Validate JWT using Supabase Auth REST (stable in Deno Edge; avoids client auth quirks). */
export type AuthUser = { id: string; email?: string | null }

export async function getAuthUserFromJwt(
  supabaseUrl: string,
  anonKey: string,
  jwt: string,
  { permitirTokenDeIA = false }: { permitirTokenDeIA?: boolean } = {}
): Promise<{ user: AuthUser; error: null } | { user: null; error: string }> {
  const base = supabaseUrl.replace(/\/$/, '')
  const res = await fetch(`${base}/auth/v1/user`, {
    signal: AbortSignal.timeout(10_000),
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
  // Token OAuth de uma IA (MCP): o Auth já o validou; só as avaliadoras o aceitam.
  if (!permitirTokenDeIA && clientIdDoJwt(jwt)) {
    return { user: null, error: 'token_de_ia' }
  }
  return { user: { id: user.id, email: user.email }, error: null }
}

export function bearerJwt(authHeader: string | null): string | null {
  if (!authHeader?.trim()) return null
  const m = authHeader.match(/^Bearer\s+(.+)$/i)
  const raw = (m?.[1] ?? authHeader).trim()
  return raw || null
}

/** O `client_id` do payload (só tokens OAuth de um cliente o têm). Não verifica a assinatura. */
export function clientIdDoJwt(jwt: string): string | null {
  try {
    const meio = jwt.split('.')[1]
    if (!meio) return null
    const b64 = meio.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(meio.length / 4) * 4, '=')
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
    const id = (JSON.parse(new TextDecoder().decode(bytes)) as { client_id?: unknown })?.client_id
    return typeof id === 'string' && id !== '' ? id : null
  } catch {
    return null
  }
}
