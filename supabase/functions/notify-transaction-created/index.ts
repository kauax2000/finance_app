import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { bearerJwt, getAuthUserFromJwt } from '../_shared/auth-user.ts'
import { processTransactionNotification } from '../_shared/process-transaction-notification.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-app-session-id, x-notify-internal-secret',
}

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function bearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7).trim()
  return token.length > 0 ? token : null
}

function isServiceAuthorized(req: Request): boolean {
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim()
  const internalSecret = Deno.env.get('NOTIFY_INTERNAL_SECRET')?.trim()
  const bearer = bearerToken(req.headers.get('Authorization'))
  if (serviceRoleKey && bearer === serviceRoleKey) return true
  const headerSecret = req.headers.get('x-notify-internal-secret')?.trim()
  if (internalSecret && headerSecret === internalSecret) return true
  return false
}

type WebhookBody = {
  transaction_id?: string
  record?: Record<string, unknown>
}

function resolveTransactionId(body: WebhookBody): string | null {
  const direct =
    typeof body.transaction_id === 'string' ? body.transaction_id.trim() : ''
  if (direct) return direct
  const recordId = body.record?.id
  if (typeof recordId === 'string' && recordId.trim()) return recordId.trim()
  return null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  let body: WebhookBody
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'Invalid JSON body' })
  }

  const transactionId = resolveTransactionId(body)
  if (!transactionId) {
    return json(400, { error: 'transaction_id is required' })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  if (!isServiceAuthorized(req)) {
    const jwt = bearerJwt(req.headers.get('Authorization'))
    if (!jwt) {
      return json(401, { error: 'Unauthorized' })
    }

    const authResult = await getAuthUserFromJwt(supabaseUrl, anonKey, jwt)
    if (authResult.error || !authResult.user) {
      return json(401, { error: 'Invalid or expired token' })
    }

    const { data: txOwner, error: ownerErr } = await supabaseAdmin
      .from('transactions')
      .select('user_id')
      .eq('id', transactionId)
      .maybeSingle()

    if (ownerErr) return json(500, { error: ownerErr.message })
    if (!txOwner) return json(404, { error: 'Transaction not found' })
    if (txOwner.user_id !== authResult.user.id) {
      return json(403, { error: 'Forbidden' })
    }
  }

  const result = await processTransactionNotification(supabaseAdmin, transactionId)
  if (!result.ok) {
    return json(result.status ?? 500, { error: result.error })
  }

  return json(200, result)
})
