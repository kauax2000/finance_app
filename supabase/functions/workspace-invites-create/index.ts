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

type CreateInviteBody = {
  workspace_id?: string
  invited_email?: string | null
  invite_kind?: string
  /** camelCase alias (some clients send this) */
  inviteKind?: string
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

  let body: CreateInviteBody
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'Invalid JSON body' })
  }

  const workspaceId = typeof body.workspace_id === 'string' ? body.workspace_id.trim() : ''
  if (!workspaceId) return json(400, { error: 'workspace_id is required' })

  const kindNorm = (() => {
    const k = body.invite_kind ?? body.inviteKind
    return typeof k === 'string' ? k.trim().toLowerCase() : ''
  })()
  const invitedEmailRaw =
    typeof body.invited_email === 'string' ? body.invited_email.trim() : undefined
  /** Link flow: `invite_kind: "link"` or explicit JSON `invited_email: null`. */
  const isLink = kindNorm === 'link' || body.invited_email === null
  const invitedEmail = invitedEmailRaw ? invitedEmailRaw.toLowerCase() : ''

  if (isLink && invitedEmailRaw) {
    return json(400, { error: 'invite_kind link cannot include invited_email' })
  }

  if (!isLink && !invitedEmail) {
    return json(400, {
      error:
        'invited_email is required unless invite_kind is link (or invited_email is null for link-only)',
    })
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  const caller = authResult.user

  const { data: member, error: memberErr } = await supabaseAdmin
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', caller.id)
    .maybeSingle()

  if (memberErr) return json(500, { error: memberErr.message })
  if (!member || member.role !== 'owner') return json(403, { error: 'Only owner can invite' })

  const { data: workspace, error: workspaceErr } = await supabaseAdmin
    .from('workspaces')
    .select('id,name')
    .eq('id', workspaceId)
    .maybeSingle()
  if (workspaceErr) return json(500, { error: workspaceErr.message })
  if (!workspace) return json(404, { error: 'Workspace not found' })

  if (isLink) {
    const { error: revokeErr } = await supabaseAdmin
      .from('workspace_invites')
      .update({ status: 'revoked' })
      .eq('workspace_id', workspaceId)
      .eq('status', 'pending')
      .is('invited_email', null)
    if (revokeErr) return json(500, { error: revokeErr.message })
  }

  const tokenRaw = crypto.randomUUID()
  const tokenHash = await sha256Hex(tokenRaw)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  // Omit token_raw from INSERT: some PostgREST schema caches reject unknown columns on INSERT.
  // Persist via UPDATE immediately after the row exists; callers rely on token_raw for reload-safe links.
  const insertRow = isLink
    ? {
        workspace_id: workspaceId,
        invited_email: null as string | null,
        role: 'member' as const,
        token_hash: tokenHash,
        status: 'pending' as const,
        expires_at: expiresAt,
        created_by: caller.id,
        usage_count: 0,
        max_uses: null as number | null,
      }
    : {
        workspace_id: workspaceId,
        invited_email: invitedEmail,
        role: 'member' as const,
        token_hash: tokenHash,
        status: 'pending' as const,
        expires_at: expiresAt,
        created_by: caller.id,
        usage_count: 0,
        max_uses: 1,
      }

  const { data: invite, error: inviteErr } = await supabaseAdmin
    .from('workspace_invites')
    .insert(insertRow)
    .select('*')
    .single()

  if (inviteErr) return json(500, { error: inviteErr.message })

  const { error: rawErr } = await supabaseAdmin
    .from('workspace_invites')
    .update({ token_raw: tokenRaw })
    .eq('id', invite.id)

  if (rawErr) {
    await supabaseAdmin.from('workspace_invites').delete().eq('id', invite.id)
    return json(500, {
      error:
        rawErr.message ||
        'Não foi possível salvar o token do convite. Verifique se a coluna token_raw existe (workspace-invites-token-raw-and-invitee-rls.sql).',
    })
  }

  const appBase = resolvePublicAppBase(req)
  const inviteUrl = buildInviteAcceptUrl(appBase, tokenRaw)

  if (!isLink) {
    try {
      await sendEmailResend({
        to: invitedEmail,
        subject: `Convite para o workspace ${workspace.name}`,
        html: renderInviteHtml({
          inviterName: caller.email ?? 'Alguém',
          workspaceName: workspace.name,
          inviteUrl,
        }),
      })
    } catch (error) {
      return json(500, { error: error instanceof Error ? error.message : 'Email send failed' })
    }
  }

  const metadata: Record<string, unknown> = {
    workspace_id: workspaceId,
    invite_id: invite.id,
  }
  if (!isLink) metadata.invited_email = invitedEmail

  await supabaseAdmin.from('user_activity_logs').insert({
    user_id: caller.id,
    type: 'family_member_invited',
    description: isLink
      ? 'Link de convite criado'
      : `Convite enviado para ${invitedEmail}`,
    metadata,
    status: 'success',
  })

  if (isLink) {
    return json(200, {
      ok: true,
      invite_id: invite.id,
      expires_at: invite.expires_at,
      invite_url: inviteUrl,
    })
  }

  return json(200, { ok: true, invite_id: invite.id, expires_at: invite.expires_at })
})
