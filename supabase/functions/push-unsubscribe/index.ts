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

  let body: { endpoint?: string | null }
  try {
    body = await req.json().catch(() => ({}))
  } catch {
    body = {}
  }

  const userId = authResult.user.id
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  const endpoint = typeof body.endpoint === 'string' ? body.endpoint.trim() : ''

  let query = supabaseAdmin.from('push_subscriptions').delete().eq('user_id', userId)
  if (endpoint) {
    query = query.eq('endpoint', endpoint)
  }

  const { error } = await query
  if (error) {
    return json(500, { error: error.message })
  }

  return json(200, { ok: true })
})
