import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { bearerJwt, getAuthUserFromJwt } from '../_shared/auth-user.ts'
import {
  buildInviteAcceptUrl,
  renderInviteHtml,
  resolvePublicAppBase,
  sendEmailResend,
} from '../_shared/workspace-invite-email.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-app-session-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

type ResendBody = {
  workspace_id?: string
  invite_id?: string
}

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
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

  let body: ResendBody
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'Invalid JSON body' })
  }

  const workspaceId = typeof body.workspace_id === 'string' ? body.workspace_id.trim() : ''
  const inviteId = typeof body.invite_id === 'string' ? body.invite_id.trim() : ''
  if (!workspaceId) return json(400, { error: 'workspace_id is required' })
  if (!inviteId) return json(400, { error: 'invite_id is required' })

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  const caller = authResult.user

  const { data: member, error: memberErr } = await supabaseAdmin
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', caller.id)
    .maybeSingle()

  if (memberErr) return json(500, { error: memberErr.message })
  if (!member || member.role !== 'owner') {
    return json(403, { error: 'Only owner can resend invites' })
  }

  const { data: invite, error: inviteErr } = await supabaseAdmin
    .from('workspace_invites')
    .select('id, workspace_id, invited_email, status, expires_at, token_raw, workspace:workspaces(name)')
    .eq('id', inviteId)
    .maybeSingle()

  if (inviteErr) return json(500, { error: inviteErr.message })
  if (!invite) return json(404, { error: 'Invite not found' })
  if (invite.workspace_id !== workspaceId) {
    return json(400, { error: 'Invite does not belong to this workspace' })
  }
  if (invite.status !== 'pending') {
    return json(400, { error: 'Invite is not pending' })
  }
  const invitedEmail =
    typeof invite.invited_email === 'string' ? invite.invited_email.trim().toLowerCase() : ''
  if (!invitedEmail) {
    return json(400, { error: 'Link invites cannot be resent by email' })
  }

  const expiresAt = new Date(invite.expires_at as string).getTime()
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return json(400, { error: 'Invite has expired' })
  }

  const tokenRaw = typeof invite.token_raw === 'string' ? invite.token_raw.trim() : ''
  if (!tokenRaw) {
    return json(500, { error: 'Invite token unavailable' })
  }

  const ws = invite.workspace as { name?: string } | null
  const workspaceName = typeof ws?.name === 'string' ? ws.name : 'workspace'

  const appBase = resolvePublicAppBase(req)
  const inviteUrl = buildInviteAcceptUrl(appBase, tokenRaw)

  try {
    await sendEmailResend({
      to: invitedEmail,
      subject: `Convite para o workspace ${workspaceName}`,
      html: renderInviteHtml({
        inviterName: caller.email ?? 'Alguém',
        workspaceName,
        inviteUrl,
      }),
    })
  } catch (error) {
    return json(500, { error: error instanceof Error ? error.message : 'Email send failed' })
  }

  await supabaseAdmin.from('user_activity_logs').insert({
    user_id: caller.id,
    type: 'family_member_invited',
    description: `Convite reenviado para ${invitedEmail}`,
    metadata: {
      workspace_id: workspaceId,
      invite_id: inviteId,
      invited_email: invitedEmail,
      resent: true,
    },
    status: 'success',
  })

  return json(200, { ok: true, invite_id: inviteId })
})
