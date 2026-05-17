import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { bearerJwt, getAuthUserFromJwt } from '../_shared/auth-user.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-app-session-id',
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

async function assertCallerSessionAllowed(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  token: string,
  req: Request
): Promise<Response | null> {
  const tokenHash = hashToken(token)
  const sessionIdHeader = req.headers.get('x-app-session-id')?.trim() || null

  const { count: totalCount, error: totalErr } = await supabaseAdmin
    .from('user_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (totalErr) {
    return new Response(
      JSON.stringify({ error: totalErr.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { count: activeCount, error: activeErr } = await supabaseAdmin
    .from('user_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true)

  if (activeErr) {
    return new Response(
      JSON.stringify({ error: activeErr.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

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

  const { data: byHash } = await supabaseAdmin
    .from('user_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('token_hash', tokenHash)
    .maybeSingle()

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

const ACTIVITY_TYPES = new Set([
  'family_member_invited',
  'family_member_joined',
  'family_member_removed',
  'family_permission_changed',
  'family_role_changed',
  'password_change',
  'profile_update',
  'security_settings',
  'device_added',
  'device_removed',
])

/** null window = always allow insert (no dedupe) */
const DEDUPE_WINDOW_MINUTES: Record<string, number | null> = {
  family_member_invited: 24 * 60,
  family_member_joined: 24 * 60,
  family_member_removed: null,
  family_permission_changed: 60,
  family_role_changed: 60,
  profile_update: 60,
  password_change: 24 * 60,
  security_settings: 24 * 60,
  device_added: 24 * 60,
  device_removed: 24 * 60,
}

const STATUS_VALUES = new Set(['success', 'failed', 'pending'])

interface CreateActivityBody {
  type: string
  description: string
  status?: string
  metadata?: Record<string, unknown>
  user_agent?: string
  ip_address?: string
  device?: string
}

interface ActivityRow {
  id: string
  type: string
  description: string
  ip_address: string | null
  device: string | null
  status: string
  created_at: string
  metadata: Record<string, unknown> | null
  dedupe_key?: string | null
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

function formatDeviceFromUserAgent(userAgent: string): string {
  const info = parseDeviceInfo(userAgent)
  return `${info.device_name} - ${info.browser}`
}

function parseDeviceInfo(userAgent: string): {
  device_type: string
  device_name: string
  browser: string
  os: string
} {
  const ua = userAgent.toLowerCase()

  let deviceType = 'desktop'
  let deviceName = 'Computador'
  let browser = 'Outro'
  let os = 'Outro'

  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone') || ua.includes('ipod')) {
    deviceType = 'mobile'
    if (ua.includes('ipad')) deviceType = 'tablet'
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

function normalizeIp(ip: string | null | undefined): string | null {
  if (!ip || ip === 'unknown') return null
  const trimmed = ip.trim()
  if (!trimmed) return null
  const v4 = /^(\d{1,3}\.){3}\d{1,3}$/
  if (v4.test(trimmed)) return trimmed
  if (trimmed.includes(':') && /^[0-9a-fA-F:.]+$/.test(trimmed)) return trimmed
  return null
}

function hashString(s: string): string {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash | 0
  }
  return Math.abs(hash).toString(16)
}

function stableStringify(val: unknown): string {
  if (val === null || typeof val !== 'object') return JSON.stringify(val)
  if (Array.isArray(val)) return `[${val.map(stableStringify).join(',')}]`
  const o = val as Record<string, unknown>
  const keys = Object.keys(o).sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(o[k])}`).join(',')}}`
}

function buildDedupeKey(userId: string, type: string, metadata: Record<string, unknown>): string {
  const parts: string[] = [userId, type]

  const fieldMap: Record<string, string[]> = {
    family_member_invited: ['invite_id', 'invited_email'],
    family_member_joined: ['member_id'],
    family_member_removed: ['member_id'],
    family_permission_changed: ['member_id', 'permissions'],
    family_role_changed: ['member_id', 'role'],
    password_change: [],
    device_added: ['device_id', 'device_type'],
    device_removed: ['device_id', 'device_removed_bulk', 'revoked_session_id'],
  }

  if (type === 'profile_update' || type === 'security_settings') {
    const keys = Object.keys(metadata).sort()
    for (const k of keys) {
      parts.push(k, stableStringify(metadata[k]))
    }
  } else {
    const fields = fieldMap[type] ?? []
    for (const f of fields) {
      const v = metadata[f]
      if (v !== undefined && v !== null) {
        parts.push(f, typeof v === 'object' ? stableStringify(v) : String(v))
      }
    }
  }

  return hashString(parts.join('|'))
}

async function shouldInsertActivity(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  type: string,
  metadata: Record<string, unknown>,
  dedupeKey: string
): Promise<boolean> {
  const windowMin = DEDUPE_WINDOW_MINUTES[type]
  if (windowMin === null) return true

  const windowStart = new Date(Date.now() - windowMin * 60 * 1000).toISOString()

  const { data, error } = await supabaseAdmin
    .from('user_activity_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('type', type)
    .eq('dedupe_key', dedupeKey)
    .gte('created_at', windowStart)
    .limit(1)

  if (error) {
    console.error('dedupe check error:', error.message)
    return true
  }

  return !data || data.length === 0
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
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = jwt

    const authResult = await getAuthUserFromJwt(supabaseUrl, anonKey, jwt)
    if (authResult.error || !authResult.user) {
      return new Response(
        JSON.stringify({
          error: 'Invalid or expired token',
          details: authResult.error ?? 'unknown',
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    const user = authResult.user

    const blocked = await assertCallerSessionAllowed(supabaseAdmin, user.id, token, req)
    if (blocked) return blocked

    const { method } = req

    if (method === 'GET') {
      const url = new URL(req.url)
      const filter = url.searchParams.get('filter') || 'all'

      let query = supabaseAdmin
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', user.id)

      if (filter === 'family') {
        query = query.in('type', [
          'family_member_invited',
          'family_member_joined',
          'family_member_removed',
          'family_permission_changed',
          'family_role_changed',
        ])
      } else if (filter === 'security') {
        query = query.in('type', [
          'password_change',
          'security_settings',
          'device_added',
          'device_removed',
        ])
      } else if (filter === 'profile') {
        query = query.eq('type', 'profile_update')
      }

      const { data: rows, error } = await query
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const list = (rows ?? []) as ActivityRow[]
      const activities = list.map((row) => ({
        id: row.id,
        type: row.type,
        description: row.description,
        ip_address: row.ip_address != null ? String(row.ip_address) : '',
        device: row.device ?? 'Desconhecido',
        status: row.status,
        created_at: row.created_at,
        metadata: row.metadata ?? {},
      }))

      return new Response(JSON.stringify({ activities }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (method === 'POST') {
      const body = (await req.json()) as CreateActivityBody
      const { type, description } = body

      if (!type || !description) {
        return new Response(JSON.stringify({ error: 'type and description are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (!ACTIVITY_TYPES.has(type)) {
        return new Response(JSON.stringify({ error: 'Invalid activity type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const status =
        body.status && STATUS_VALUES.has(body.status) ? body.status : 'success'

      const headerUa = req.headers.get('user-agent') ?? ''
      const ua = body.user_agent || headerUa
      const ip =
        normalizeIp(body.ip_address) ?? normalizeIp(getClientIp(req))
      const device =
        body.device?.trim() ||
        (ua ? formatDeviceFromUserAgent(ua) : 'Desconhecido')

      const metadata = body.metadata ?? {}
      const dedupeKey = buildDedupeKey(user.id, type, metadata)

      const allowInsert = await shouldInsertActivity(
        supabaseAdmin,
        user.id,
        type,
        metadata,
        dedupeKey
      )

      if (!allowInsert) {
        return new Response(JSON.stringify({ skipped: true, activity: null }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: inserted, error } = await supabaseAdmin
        .from('user_activity_logs')
        .insert({
          user_id: user.id,
          type,
          description,
          ip_address: ip,
          device,
          status,
          metadata,
          dedupe_key: dedupeKey,
        })
        .select()
        .single()

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const activity = {
        id: inserted.id,
        type: inserted.type,
        description: inserted.description,
        ip_address: inserted.ip_address != null ? String(inserted.ip_address) : '',
        device: inserted.device ?? 'Desconhecido',
        status: inserted.status,
        created_at: inserted.created_at,
        metadata: inserted.metadata ?? {},
      }

      return new Response(JSON.stringify({ activity }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
