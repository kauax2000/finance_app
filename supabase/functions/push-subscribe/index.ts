import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { bearerJwt, getAuthUserFromJwt } from '../_shared/auth-user.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-app-session-id',
}

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  const jwt = bearerJwt(req.headers.get('Authorization'))
  if (!jwt) {
    return json(401, { error: 'Missing authorization header' })
  }

  const authResult = await getAuthUserFromJwt(supabaseUrl, anonKey, jwt)
  if (authResult.error || !authResult.user) {
    return json(401, { error: 'Invalid or expired token' })
  }

  let body: {
    endpoint?: string
    keys?: { p256dh?: string; auth?: string }
    user_agent?: string
  }
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'Invalid JSON body' })
  }

  const endpoint = typeof body.endpoint === 'string' ? body.endpoint.trim() : ''
  const p256dh = typeof body.keys?.p256dh === 'string' ? body.keys.p256dh.trim() : ''
  const auth = typeof body.keys?.auth === 'string' ? body.keys.auth.trim() : ''

  if (!endpoint || !p256dh || !auth) {
    return json(400, { error: 'endpoint and keys (p256dh, auth) are required' })
  }

  const userId = authResult.user.id
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  const { error } = await supabaseAdmin.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint,
      p256dh,
      auth,
      user_agent: body.user_agent?.slice(0, 512) ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,endpoint' }
  )

  if (error) {
    return json(500, { error: error.message })
  }

  return json(200, { ok: true })
})
