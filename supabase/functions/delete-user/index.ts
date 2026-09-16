import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'
import { bearerJwt, getAuthUserFromJwt } from '../_shared/auth-user.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-app-session-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/**
 * Best-effort password-attempt limiter (per isolate; resets on cold start).
 * GoTrue also rate-limits the token endpoint — this adds a cheap per-user
 * guard against using this endpoint as a password oracle.
 */
const MAX_PASSWORD_ATTEMPTS = 5
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000
const passwordAttempts = new Map<string, { count: number; resetAt: number }>()

function passwordAttemptAllowed(userId: string): boolean {
  const now = Date.now()
  const entry = passwordAttempts.get(userId)
  if (!entry || entry.resetAt <= now) return true
  return entry.count < MAX_PASSWORD_ATTEMPTS
}

function recordFailedPasswordAttempt(userId: string): void {
  const now = Date.now()
  const entry = passwordAttempts.get(userId)
  if (!entry || entry.resetAt <= now) {
    passwordAttempts.set(userId, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS })
    return
  }
  entry.count += 1
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const jwt = bearerJwt(req.headers.get('Authorization'))
    if (!jwt) return json(401, { error: 'Missing authorization header' })

    const authResult = await getAuthUserFromJwt(supabaseUrl, anonKey, jwt)
    if (authResult.error || !authResult.user) {
      return json(401, { error: 'Invalid or expired token' })
    }
    const user = authResult.user

    const email = user.email
    if (!email) {
      return json(400, { error: 'Conta sem email não pode ser excluída desta forma.' })
    }

    let body: { password?: string }
    try {
      body = await req.json()
    } catch {
      return json(400, { error: 'Invalid JSON body' })
    }

    const password = body.password
    if (!password || typeof password !== 'string') {
      return json(400, { error: 'Senha é obrigatória' })
    }

    if (!passwordAttemptAllowed(user.id)) {
      return json(429, { error: 'Muitas tentativas. Tente novamente em alguns minutos.' })
    }

    const verifyClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { error: signInError } = await verifyClient.auth.signInWithPassword({ email, password })
    if (signInError) {
      recordFailedPasswordAttempt(user.id)
      return json(401, { error: 'Senha incorreta' })
    }

    // The verification sign-in minted a fresh GoTrue session; revoke it so a
    // failed deletion doesn't leave a stray active session behind.
    try {
      await verifyClient.auth.signOut({ scope: 'local' })
    } catch {
      /* best effort */
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const userId = user.id

    // Toda FK para auth.users é ON DELETE CASCADE, e os guardas de carteira
    // pessoal e de último dono liberam quando a pessoa deixa de existir
    // (migração 20260915130000). A exclusão inteira é uma transação: ou tudo
    // sai, ou nada sai.
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteUserError) {
      console.error('delete-user: auth.admin.deleteUser', deleteUserError)
      return json(500, { error: 'Erro ao excluir conta. Tente novamente.' })
    }

    // O Storage não tem FK: os avatares saem depois, sem bloquear a resposta.
    try {
      const { data: avatarFiles } = await supabaseAdmin.storage.from('avatars').list(userId)
      if (avatarFiles && avatarFiles.length > 0) {
        const paths = avatarFiles.map((f: { name: string }) => `${userId}/${f.name}`)
        await supabaseAdmin.storage.from('avatars').remove(paths)
      }
    } catch (error) {
      console.error('delete-user: avatares', error)
    }

    return json(200, { success: true })
  } catch (error) {
    console.error('delete-user:', error)
    return json(500, { error: 'Erro ao excluir conta. Tente novamente.' })
  }
})
