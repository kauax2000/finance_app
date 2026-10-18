import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'
import { internalError } from '../_shared/http.ts'
import { bearerJwt, getAuthUserFromJwt } from '../_shared/auth-user.ts'
import { deliverNotification } from '../_shared/deliver-notification.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-app-session-id',
}

/**
 * Os `kind` que o cliente ainda pode pedir. Vazia: o último produtor do
 * cliente (`category_created`) saiu, e os avisos de produto nascem nas funções
 * do servidor. Um produtor novo do cliente entra aqui, com nome.
 */
const ALLOWED_KINDS = new Set<string>([])

type DispatchBody = {
  type: string
  workspace_id: string
  title?: string
  body?: string
  metadata?: Record<string, unknown>
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

  const authHeader = req.headers.get('Authorization')
  const jwt = bearerJwt(authHeader)
  if (!jwt) {
    return json(401, { error: 'Missing authorization header' })
  }

  const authResult = await getAuthUserFromJwt(supabaseUrl, anonKey, jwt)
  if (authResult.error || !authResult.user) {
    return json(401, { error: 'Invalid or expired token' })
  }

  let body: DispatchBody
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'Invalid JSON body' })
  }

  // Só `system`: os outros tipos furariam as regras de quem os produz
  // (orçamento, cartão, contas) e o filtro de preferências delas.
  if (body.type !== 'system') {
    return json(400, { error: 'Invalid type' })
  }
  const kind = typeof body.metadata?.kind === 'string' ? body.metadata.kind.trim() : ''
  if (!ALLOWED_KINDS.has(kind)) {
    return json(400, { error: 'Invalid kind' })
  }

  const workspaceId = typeof body.workspace_id === 'string' ? body.workspace_id.trim() : ''
  if (!workspaceId) {
    return json(400, { error: 'workspace_id is required' })
  }

  const user = authResult.user
  const userId = user.id

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  const { data: membership, error: memErr } = await supabaseAdmin
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle()

  if (memErr) return json(500, { error: internalError('dispatch-notifications', memErr) })
  if (!membership) {
    return json(403, { error: 'Not a member of this workspace' })
  }

  const title = (body.title ?? '').trim().slice(0, 120) || 'Notificação'
  const msg = (body.body ?? '').trim().slice(0, 500) || 'Você tem uma nova notificação.'
  // Vindo do cliente, só o `kind` passa: `critical` furava as preferências de
  // notificação e `href` decide para onde o clique leva.
  const metadata: Record<string, unknown> = { kind }

  const delivered = await deliverNotification({
    supabaseAdmin,
    userId,
    userEmail: user.email,
    workspaceId,
    type: 'system',
    title,
    body: msg,
    metadata,
    allowTransactionType: false,
  })

  if (!delivered.ok) {
    return json(500, { error: delivered.error })
  }

  return json(200, {
    ok: true,
    skipped: delivered.skipped,
    delivered: {
      in_app: delivered.in_app,
      push: delivered.push,
      email: delivered.email,
      notification_id: delivered.notification_id,
    },
  })
})
