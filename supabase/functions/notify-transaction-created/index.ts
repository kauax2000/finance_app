import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { deliverNotification } from '../_shared/deliver-notification.ts'
import { currencyBRL, displayActorName } from '../_shared/formatters.ts'
import {
  shouldNotifyMembersForTransaction,
  type TransactionNotifyRow,
} from '../_shared/transaction-notify-rules.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-notify-internal-secret',
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

function isAuthorized(req: Request): boolean {
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

async function notificationAlreadySent(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  workspaceId: string,
  transactionId: string
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .eq('metadata->>kind', 'member_expense_created')
    .eq('metadata->>transaction_id', transactionId)
    .maybeSingle()
  return !!data?.id
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  if (!isAuthorized(req)) {
    return json(401, { error: 'Unauthorized' })
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
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  const { data: txRow, error: txErr } = await supabaseAdmin
    .from('transactions')
    .select(
      'id, user_id, workspace_id, type, amount, description, subscription_id, installment_plan_id'
    )
    .eq('id', transactionId)
    .maybeSingle()

  if (txErr) return json(500, { error: txErr.message })
  if (!txRow) return json(404, { error: 'Transaction not found' })

  const tx = txRow as TransactionNotifyRow
  const workspaceId = tx.workspace_id
  if (!workspaceId) {
    return json(200, { ok: true, skipped: 'no_workspace', notified: 0 })
  }

  const { data: workspace, error: wsErr } = await supabaseAdmin
    .from('workspaces')
    .select('type')
    .eq('id', workspaceId)
    .maybeSingle()

  if (wsErr) return json(500, { error: wsErr.message })

  const { count: memberCount, error: memCountErr } = await supabaseAdmin
    .from('workspace_members')
    .select('user_id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)

  if (memCountErr) return json(500, { error: memCountErr.message })

  if (
    !shouldNotifyMembersForTransaction(tx, {
      type: String(workspace?.type ?? ''),
      member_count: memberCount ?? 0,
    })
  ) {
    return json(200, { ok: true, skipped: 'not_eligible', notified: 0 })
  }

  const { data: members, error: memErr } = await supabaseAdmin
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .neq('user_id', tx.user_id)

  if (memErr) return json(500, { error: memErr.message })
  if (!members?.length) {
    return json(200, { ok: true, skipped: 'no_recipients', notified: 0 })
  }

  const { data: actorProfile } = await supabaseAdmin
    .from('profiles')
    .select('full_name, email')
    .eq('id', tx.user_id)
    .maybeSingle()

  const actorName = displayActorName(actorProfile)
  const amountLabel = currencyBRL(Number(tx.amount))
  const description = tx.description?.trim() || 'Sem descrição'
  const title = `${actorName} adicionou uma despesa`
  const msgBody = `${amountLabel} — ${description}`
  const href = `/transactions?txn=${tx.id}`

  let notified = 0
  const results: Array<{ user_id: string; ok: boolean; skipped?: string }> = []

  for (const member of members) {
    const memberId = member.user_id as string
    if (await notificationAlreadySent(supabaseAdmin, memberId, workspaceId, tx.id)) {
      results.push({ user_id: memberId, ok: true, skipped: 'duplicate' })
      continue
    }

    const delivered = await deliverNotification({
      supabaseAdmin,
      userId: memberId,
      workspaceId,
      type: 'transaction',
      title,
      body: msgBody,
      metadata: {
        kind: 'member_expense_created',
        transaction_id: tx.id,
        actor_user_id: tx.user_id,
        href,
      },
      allowTransactionType: true,
    })

    if (!delivered.ok) {
      results.push({ user_id: memberId, ok: false })
      continue
    }

    if (delivered.skipped) {
      results.push({ user_id: memberId, ok: true, skipped: delivered.skipped })
      continue
    }

    notified += 1
    results.push({ user_id: memberId, ok: true })
  }

  return json(200, { ok: true, notified, results })
})
