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

  const { data: invite, error: inviteErr } = await supabaseAdmin
    .from('workspace_invites')
    .select('*')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (inviteErr) return json(500, { error: inviteErr.message })
  if (!invite) return json(404, { error: 'Invite not found' })
  if (invite.status !== 'pending') return json(400, { error: 'Invite is not pending' })
  if (new Date(invite.expires_at).getTime() < Date.now()) {
    await supabaseAdmin.from('workspace_invites').update({ status: 'expired' }).eq('id', invite.id)
    return json(400, { error: 'Invite expired' })
  }

  const invitedEmail = invite.invited_email as string | null
  if (invitedEmail != null && invitedEmail.trim().toLowerCase() !== userEmail) {
    return json(403, { error: 'Invite email does not match current user' })
  }

  const maxUses = invite.max_uses as number | null
  const usageCount = typeof invite.usage_count === 'number' ? invite.usage_count : 0

  const { data: existingMember } = await supabaseAdmin
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', invite.workspace_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingMember) {
    return json(200, { ok: true, workspace_id: invite.workspace_id, already_member: true })
  }

  if (maxUses !== null && usageCount >= maxUses) {
    return json(400, { error: 'Invite exhausted' })
  }

  const { error: memberErr } = await supabaseAdmin
    .from('workspace_members')
    .upsert(
      {
        workspace_id: invite.workspace_id,
        user_id: user.id,
        role: 'member',
      },
      { onConflict: 'workspace_id,user_id' },
    )

  if (memberErr) return json(500, { error: memberErr.message })

  const nextUsage = usageCount + 1
  const exhausted = maxUses !== null && nextUsage >= maxUses

  const patch: Record<string, unknown> = { usage_count: nextUsage }
  if (exhausted) {
    patch.status = 'accepted'
    patch.accepted_at = new Date().toISOString()
  }

  const { data: claimedRows, error: updErr } = await supabaseAdmin
    .from('workspace_invites')
    .update(patch)
    .eq('id', invite.id)
    // Only one concurrent accept may advance usage_count; duplicate requests lose the race.
    .eq('usage_count', usageCount)
    .select('id')

  if (updErr) return json(500, { error: updErr.message })

  const claimed = Array.isArray(claimedRows) && claimedRows.length > 0

  if (!claimed) {
    return json(200, { ok: true, workspace_id: invite.workspace_id, idempotent: true })
  }

  await supabaseAdmin.from('user_activity_logs').insert({
    user_id: invite.created_by,
    type: 'family_member_joined',
    description: 'Convite aceito por membro da família',
    metadata: { member_id: user.id, workspace_id: invite.workspace_id, invite_id: invite.id },
    status: 'success',
  })

  const { data: inviterUser } = await supabaseAdmin.auth.admin.getUserById(invite.created_by)

  const notifyResult = await deliverNotification({
    supabaseAdmin,
    userId: invite.created_by,
    userEmail: inviterUser?.user?.email,
    workspaceId: invite.workspace_id,
    type: 'system',
    title: 'Convite aceito',
    body: `${user.email ?? 'Um usuário'} aceitou o convite.`,
    metadata: {
      kind: 'invite_accepted',
      workspace_id: invite.workspace_id,
      invite_id: invite.id,
      href: '/members',
    },
  })

  if (!notifyResult.ok) {
    return json(500, { error: notifyResult.error })
  }

  return json(200, { ok: true, workspace_id: invite.workspace_id })
})
