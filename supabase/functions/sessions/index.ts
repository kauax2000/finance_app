import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { bearerJwt, getAuthUserFromJwt } from '../_shared/auth-user.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-app-session-id',
}

function getClientIp(req: Request): string | null {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    null
  )
}

function normalizeIp(ip: string | null | undefined): string | null {
  if (!ip || ip === 'unknown') return null
  const trimmed = ip.trim()
  if (!trimmed) return null
  const v4 = /^(\d{1,3}\.){3}\d{1,3}$/
  if (v4.test(trimmed)) return trimmed
  if (trimmed.includes(':') && /^[0-9a-fA-F:.]+$/.test(trimmed)) return trimmed
  return null
}

function hashToken(token: string): string {
  let hash = 0
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(16)
}

/**
 * Ensures the caller has an active app session row (user_sessions), or is bootstrapping
 * (no rows yet). Revoked devices keep a valid JWT but fail here unless they re-register
 * (POST with user_agent), which is blocked when all sessions were revoked (activeCount === 0
 * but totalCount > 0). Syncs token_hash when JWT rotated and x-app-session-id matches.
 */
async function assertCallerSessionAllowed(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  token: string,
  req: Request
): Promise<Response | null> {
  const tokenHash = hashToken(token)
  const sessionIdHeader = req.headers.get('x-app-session-id')?.trim() || null

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

  if (totalRes.error) {
    return new Response(
      JSON.stringify({ error: totalRes.error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (activeRes.error) {
    return new Response(
      JSON.stringify({ error: activeRes.error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const totalCount = totalRes.count
  const activeCount = activeRes.count

  const t = totalCount ?? 0
  const a = activeCount ?? 0

  if (t === 0) {
    return null
  }

  if (a === 0) {
    return new Response(
      JSON.stringify({ error: 'Session expired or invalidated' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { data: hashRows, error: hashErr } = await supabaseAdmin
    .from('user_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('token_hash', tokenHash)
    .limit(1)

  if (hashErr) {
    return new Response(
      JSON.stringify({ error: hashErr.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const byHash = hashRows?.[0] ?? null

  if (byHash) {
    return null
  }

  if (sessionIdHeader) {
    const { data: bySid, error: sidErr } = await supabaseAdmin
      .from('user_sessions')
      .select('id')
      .eq('id', sessionIdHeader)
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle()

    if (sidErr) {
      return new Response(
        JSON.stringify({ error: sidErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (bySid) {
      const { error: upErr } = await supabaseAdmin
        .from('user_sessions')
        .update({ token_hash: tokenHash })
        .eq('id', bySid.id)

      if (upErr) {
        return new Response(
          JSON.stringify({ error: upErr.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return null
    }
  }

  return new Response(
    JSON.stringify({ error: 'Session expired or invalidated' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const authHeader = req.headers.get('Authorization')
    const jwt = bearerJwt(authHeader)
    if (!jwt) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = jwt
    const authResult = await getAuthUserFromJwt(supabaseUrl, anonKey, jwt)
    if (authResult.error || !authResult.user) {
      return new Response(
        JSON.stringify({
          error: 'Invalid or expired token',
          details: authResult.error ?? 'unknown',
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const user = authResult.user

    const { method } = req

    if (method === 'GET') {
      const blocked = await assertCallerSessionAllowed(supabaseAdmin, user.id, token, req)
      if (blocked) return blocked

      const { data: sessions, error } = await supabaseAdmin
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_active_at', { ascending: false })

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const sessionsWithDevice = await Promise.all(
        (sessions || []).map(async (session) => {
          const deviceInfo = await getDeviceInfo(session.user_agent || '')
          return {
            ...session,
            ...deviceInfo,
            ip_address: session.ip_address || 'Unknown',
          }
        })
      )

      return new Response(
        JSON.stringify({ sessions: sessionsWithDevice }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'POST') {
      const body = await req.json().catch(() => ({}))
      const { action, session_id, except_session_id, user_agent, ip_address, device_id, device_fingerprint } = body

      if (action === 'revoke_session' && session_id) {
        const blocked = await assertCallerSessionAllowed(supabaseAdmin, user.id, token, req)
        if (blocked) return blocked

        const { error } = await supabaseAdmin
          .from('user_sessions')
          .update({ is_active: false })
          .eq('id', session_id)
          .eq('user_id', user.id)

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (action === 'revoke_all') {
        const blocked = await assertCallerSessionAllowed(supabaseAdmin, user.id, token, req)
        if (blocked) return blocked

        let query = supabaseAdmin
          .from('user_sessions')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .eq('is_active', true)

        if (except_session_id) {
          query = query.neq('id', except_session_id)
        }

        const { error } = await query

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!user_agent) {
        return new Response(
          JSON.stringify({ error: 'user_agent is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const did = typeof device_id === 'string' && device_id.trim() ? device_id.trim() : null
      const dfp = typeof device_fingerprint === 'string' && device_fingerprint.trim() ? device_fingerprint.trim() : null
      const resolvedIp = normalizeIp(ip_address) ?? normalizeIp(getClientIp(req))

      const deviceInfo = await getDeviceInfo(user_agent)

      if (did) {
        const { data: deviceRows, error: findErr } = await supabaseAdmin
          .from('user_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('device_id', did)
          .eq('is_active', true)
          .order('last_active_at', { ascending: false })
          .limit(1)

        const byDevice = deviceRows?.[0] ?? null

        if (findErr) {
          return new Response(
            JSON.stringify({ error: findErr.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (byDevice) {
          const { error: upErr } = await supabaseAdmin
            .from('user_sessions')
            .update({
              last_active_at: new Date().toISOString(),
              token_hash: hashToken(token),
              user_agent,
              ...(resolvedIp ? { ip_address: resolvedIp } : {}),
              ...(dfp ? { device_fingerprint: dfp } : {}),
            })
            .eq('id', byDevice.id)

          if (upErr) {
            return new Response(
              JSON.stringify({ error: upErr.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          return new Response(
            JSON.stringify({
              session: { ...byDevice, ...deviceInfo, ip_address: byDevice.ip_address || resolvedIp || 'Unknown' },
              reused: true,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      if (dfp) {
        const { data: legacyRows, error: legErr } = await supabaseAdmin
          .from('user_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('device_fingerprint', dfp)
          .eq('is_active', true)

        if (legErr) {
          return new Response(
            JSON.stringify({ error: legErr.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const legacy = (legacyRows || []).find(
          (r) => !r.device_id || (did && r.device_id === did)
        )

        if (legacy) {
          const { error: upErr } = await supabaseAdmin
            .from('user_sessions')
            .update({
              last_active_at: new Date().toISOString(),
              token_hash: hashToken(token),
              user_agent,
              device_id: did ?? legacy.device_id,
              device_fingerprint: dfp,
              ...(resolvedIp ? { ip_address: resolvedIp } : {}),
            })
            .eq('id', legacy.id)

          if (upErr) {
            return new Response(
              JSON.stringify({ error: upErr.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          const merged = { ...legacy, device_id: did ?? legacy.device_id, device_fingerprint: dfp, user_agent }
          return new Response(
            JSON.stringify({
              session: { ...merged, ...deviceInfo, ip_address: merged.ip_address || resolvedIp || 'Unknown' },
              reused: true,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      const { data: insertedRows, error } = await supabaseAdmin
        .from('user_sessions')
        .insert({
          user_id: user.id,
          user_agent,
          ip_address: resolvedIp || null,
          device_id: did,
          device_fingerprint: dfp,
          device_type: deviceInfo.device_type,
          device_name: deviceInfo.device_name,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          is_active: true,
          token_hash: hashToken(token),
        })
        .select()
        .limit(1)

      const newSession = insertedRows?.[0] ?? null

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!newSession) {
        return new Response(
          JSON.stringify({ error: 'Failed to create session row' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          session: {
            ...newSession,
            ...deviceInfo,
          },
          reused: false,
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'DELETE') {
      const blocked = await assertCallerSessionAllowed(supabaseAdmin, user.id, token, req)
      if (blocked) return blocked

      const url = new URL(req.url)
      const exceptSessionId = url.searchParams.get('except_session_id')

      let query = supabaseAdmin
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (exceptSessionId) {
        query = query.neq('id', exceptSessionId)
      }

      const { error } = await query

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'PATCH') {
      const blocked = await assertCallerSessionAllowed(supabaseAdmin, user.id, token, req)
      if (blocked) return blocked

      const url = new URL(req.url)
      const sessionId = url.searchParams.get('session_id')

      if (!sessionId) {
        return new Response(
          JSON.stringify({ error: 'session_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error } = await supabaseAdmin
        .from('user_sessions')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', sessionId)
        .eq('user_id', user.id)

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function getDeviceInfo(userAgent: string): Promise<{
  device_type: string
  device_name: string
  browser: string
  os: string
}> {
  const ua = userAgent.toLowerCase()

  let deviceType = 'desktop'
  let deviceName = 'Computador'
  let browser = 'Outro'
  let os = 'Outro'

  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone') || ua.includes('ipod')) {
    deviceType = 'mobile'
    if (ua.includes('ipad')) {
      deviceType = 'tablet'
    }
  } else if (ua.includes('tablet')) {
    deviceType = 'tablet'
  }

  if (ua.includes('chrome') && !ua.includes('edg')) {
    browser = 'Chrome'
  } else if (ua.includes('firefox')) {
    browser = 'Firefox'
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari'
  } else if (ua.includes('edg')) {
    browser = 'Edge'
  } else if (ua.includes('opr') || ua.includes('opera')) {
    browser = 'Opera'
  }

  if (ua.includes('macintosh') || ua.includes('mac os')) {
    os = 'macOS'
    deviceName = 'Mac'
  } else if (ua.includes('windows')) {
    os = 'Windows'
    deviceName = 'Windows PC'
  } else if (ua.includes('linux')) {
    os = 'Linux'
    deviceName = 'Linux PC'
  } else if (ua.includes('android')) {
    os = 'Android'
    deviceName = 'Android'
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS'
    deviceName = ua.includes('ipad') ? 'iPad' : 'iPhone'
  }

  return { device_type: deviceType, device_name: deviceName, browser, os }
}
