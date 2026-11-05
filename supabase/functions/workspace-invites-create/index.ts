import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'
import { internalError } from '../_shared/http.ts'
import { bearerJwt, getAuthUserFromJwt } from '../_shared/auth-user.ts'
import { inviteEmailLimitReached, recentInviteLogs } from '../_shared/invite-rate-limit.ts'
import { escolherLinksAtivos, type LinhaDeLink } from '../_shared/invite-links.ts'
import { inviteLinkToken, sha256Hex } from '../_shared/token-hash.ts'
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
  /** Bloco 7A. Sem `role`, o convite é de membro, como no front de `main`. */
  role?: 'member' | 'guest'
  menor?: boolean
  consentimento?: boolean
  /** `get`: devolve o link ativo de cada papel, sem criar nada. */
  action?: string
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
    return json(401, { error: 'Invalid or expired token' })
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

  const role = body.role ?? 'member'
  if (role !== 'member' && role !== 'guest') return json(400, { error: 'role inválido' })
  // O menor é convidado, com o consentimento do responsável (LGPD, art. 14).
  const menor = body.menor === true
  if (menor && role !== 'guest') return json(400, { error: 'menor_requer_convidado' })
  if (menor && body.consentimento !== true) return json(400, { error: 'consentimento_obrigatorio' })

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  const caller = authResult.user

  const { data: member, error: memberErr } = await supabaseAdmin
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', caller.id)
    .maybeSingle()

  if (memberErr) return json(500, { error: internalError('workspace-invites-create', memberErr) })
  if (!member || member.role !== 'owner') return json(403, { error: 'Only owner can invite' })

  const { data: workspace, error: workspaceErr } = await supabaseAdmin
    .from('workspaces')
    .select('id,name')
    .eq('id', workspaceId)
    .maybeSingle()
  if (workspaceErr) return json(500, { error: internalError('workspace-invites-create', workspaceErr) })
  if (!workspace) return json(404, { error: 'Workspace not found' })

  const appBase = resolvePublicAppBase(req)
  if (!appBase) {
    return json(500, { error: 'APP_BASE_URL não configurado.' })
  }

  if (isLink && body.action === 'get') {
    const { data: linhas, error: ativoErr } = await supabaseAdmin
      .from('workspace_invites')
      .select('id,role,expires_at,created_at,token_hash')
      .eq('workspace_id', workspaceId)
      .eq('status', 'pending')
      .is('invited_email', null)
    if (ativoErr) return json(500, { error: internalError('workspace-invites-create', ativoErr) })
    const escolhidos = escolherLinksAtivos((linhas ?? []) as LinhaDeLink[], new Date())
    const montar = async (linha: LinhaDeLink | null) => {
      if (!linha) return null
      const token = await inviteLinkToken(supabaseServiceKey, linha.id)
      // Links criados antes da derivação têm token aleatório: não dá para refazê-los.
      const refeito = (await sha256Hex(token)) === linha.token_hash
      return {
        invite_id: linha.id,
        expires_at: linha.expires_at,
        invite_url: refeito ? buildInviteAcceptUrl(appBase, token) : null,
      }
    }
    return json(200, {
      ok: true,
      links: { member: await montar(escolhidos.member), guest: await montar(escolhidos.guest) },
    })
  }

  if (!isLink) {
    const { data: logs, error: logsErr } = await recentInviteLogs(supabaseAdmin, caller.id)
    if (logsErr) return json(500, { error: internalError('workspace-invites-create', logsErr) })
    if (inviteEmailLimitReached(logs ?? [], invitedEmail)) {
      return json(429, { error: 'Too many invites' })
    }
  }

  if (isLink) {
    const { error: revokeErr } = await supabaseAdmin
      .from('workspace_invites')
      .update({ status: 'revoked' })
      .eq('workspace_id', workspaceId)
      .eq('status', 'pending')
      .eq('role', role)
      .is('invited_email', null)
    if (revokeErr) return json(500, { error: internalError('workspace-invites-create', revokeErr) })
  }

  const inviteId = crypto.randomUUID()
  const tokenRaw = isLink ? await inviteLinkToken(supabaseServiceKey, inviteId) : crypto.randomUUID()
  const tokenHash = await sha256Hex(tokenRaw)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  // Só o hash é gravado. O link do e-mail existe na resposta e no e-mail; o link de convite se refaz do id (`action: 'get'`).
  const insertRow = isLink
    ? {
        id: inviteId,
        workspace_id: workspaceId,
        invited_email: null as string | null,
        role,
        menor,
        consentimento_em: menor ? new Date().toISOString() : null,
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
        role,
        menor,
        consentimento_em: menor ? new Date().toISOString() : null,
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

  if (inviteErr) return json(500, { error: internalError('workspace-invites-create', inviteErr) })

  const inviteUrl = buildInviteAcceptUrl(appBase, tokenRaw)

  if (!isLink) {
    try {
      await sendEmailResend({
        to: invitedEmail,
        subject: `Convite para o workspace ${String(workspace.name).slice(0, 60)}`,
        html: renderInviteHtml({
          inviterName: caller.email ?? 'Alguém',
          workspaceName: workspace.name,
          inviteUrl,
          menor,
        }),
      })
    } catch (error) {
      // Sem o e-mail o convite não chegou a ninguém: não deixa uma pendência órfã.
      console.error('workspace-invites-create: email', error)
      await supabaseAdmin.from('workspace_invites').update({ status: 'revoked' }).eq('id', invite.id)
      return json(502, { error: 'Email send failed' })
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
