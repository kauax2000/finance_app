import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { bearerJwt, getAuthUserFromJwt } from '../_shared/auth-user.ts'
import { deliverNotification } from '../_shared/deliver-notification.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-app-session-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

type AcceptInviteBody = {
  token: string
}

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest('SHA-256', data)
  const bytes = Array.from(new Uint8Array(hash))
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  const jwt = bearerJwt(req.headers.get('Authorization'))
  if (!jwt) return json(401, { error: 'Missing authorization header' })

  const authResult = await getAuthUserFromJwt(supabaseUrl, anonKey, jwt)
  if (authResult.error || !authResult.user) {
    return json(401, { error: 'Invalid or expired token', details: authResult.error ?? 'unknown' })
  }

  let body: AcceptInviteBody
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'Invalid JSON body' })
  }

  const token = body.token?.trim()
  if (!token) return json(400, { error: 'token is required' })

  const tokenHash = await sha256Hex(token)
  const user = authResult.user
  const userEmail = (user.email ?? '').trim().toLowerCase()
  if (!userEmail) return json(400, { error: 'Authenticated user has no email' })

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  // Atomic validate → claim → join (row-locked; enforces max_uses under
  // concurrency). See migration 20260824121000_accept_workspace_invite_rpc.sql.
  const { data: result, error: rpcErr } = await supabaseAdmin.rpc('accept_workspace_invite', {
    p_token_hash: tokenHash,
    p_user_id: user.id,
    p_user_email: userEmail,
  })

  if (rpcErr) return json(500, { error: rpcErr.message })

  const status = typeof result?.status === 'string' ? result.status : 'error'
  const workspaceId =
    typeof result?.workspace_id === 'string' ? result.workspace_id : null

  switch (status) {
    case 'not_found':
      return json(404, { error: 'Invite not found' })
    case 'not_pending':
      return json(400, { error: 'Invite is not pending' })
    case 'expired':
      return json(400, { error: 'Invite expired' })
    case 'email_mismatch':
      return json(403, { error: 'Invite email does not match current user' })
    case 'exhausted':
      return json(400, { error: 'Invite exhausted' })
    case 'invalid_user':
      return json(400, { error: 'Authenticated user has no email' })
    case 'already_member':
      return json(200, { ok: true, workspace_id: workspaceId, already_member: true })
    case 'accepted':
      break
    default:
      return json(500, { error: 'Unexpected invite acceptance result' })
  }

  const inviteId = typeof result?.invite_id === 'string' ? result.invite_id : null
  const createdBy = typeof result?.created_by === 'string' ? result.created_by : null

  // Membership is committed at this point: activity/notification failures are
  // logged, never surfaced as errors for an operation that succeeded.
  if (createdBy && workspaceId) {
    try {
      await supabaseAdmin.from('user_activity_logs').insert({
        user_id: createdBy,
        type: 'family_member_joined',
        description: 'Convite aceito por membro da família',
        metadata: { member_id: user.id, workspace_id: workspaceId, invite_id: inviteId },
        status: 'success',
      })

      const { data: inviterUser } = await supabaseAdmin.auth.admin.getUserById(createdBy)

      const notifyResult = await deliverNotification({
        supabaseAdmin,
        userId: createdBy,
        userEmail: inviterUser?.user?.email,
        workspaceId,
        type: 'system',
        title: 'Convite aceito',
        body: `${user.email ?? 'Um usuário'} aceitou o convite.`,
        metadata: {
          kind: 'invite_accepted',
          workspace_id: workspaceId,
          invite_id: inviteId,
          href: '/members',
        },
      })

      if (!notifyResult.ok) {
        console.error('workspace-invites-accept: notify failed:', notifyResult.error)
      }
    } catch (error) {
      console.error('workspace-invites-accept: post-accept side effects failed:', error)
    }
  }

  return json(200, { ok: true, workspace_id: workspaceId })
})
