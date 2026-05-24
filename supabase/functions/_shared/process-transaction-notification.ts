import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { deliverNotification } from '../_shared/deliver-notification.ts'
import { currencyBRL, displayActorName } from '../_shared/formatters.ts'
import {
  shouldNotifyMembersForTransaction,
  type TransactionNotifyRow,
} from '../_shared/transaction-notify-rules.ts'

export type NotifyTransactionResult = {
  ok: true
  skipped?: string
  notified: number
  results?: Array<{ user_id: string; ok: boolean; skipped?: string }>
}

async function notificationAlreadySent(
  supabaseAdmin: SupabaseClient,
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

export async function processTransactionNotification(
  supabaseAdmin: SupabaseClient,
  transactionId: string
): Promise<NotifyTransactionResult | { ok: false; error: string; status?: number }> {
  const { data: txRow, error: txErr } = await supabaseAdmin
    .from('transactions')
    .select(
      'id, user_id, workspace_id, type, amount, description, subscription_id, installment_plan_id'
    )
    .eq('id', transactionId)
    .maybeSingle()

  if (txErr) return { ok: false, error: txErr.message, status: 500 }
  if (!txRow) return { ok: false, error: 'Transaction not found', status: 404 }

  const tx = txRow as TransactionNotifyRow
  const workspaceId = tx.workspace_id
  if (!workspaceId) {
    return { ok: true, skipped: 'no_workspace', notified: 0 }
  }

  const { data: workspace, error: wsErr } = await supabaseAdmin
    .from('workspaces')
    .select('type')
    .eq('id', workspaceId)
    .maybeSingle()

  if (wsErr) return { ok: false, error: wsErr.message, status: 500 }

  const { count: memberCount, error: memCountErr } = await supabaseAdmin
    .from('workspace_members')
    .select('user_id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)

  if (memCountErr) return { ok: false, error: memCountErr.message, status: 500 }

  if (
    !shouldNotifyMembersForTransaction(tx, {
      type: String(workspace?.type ?? ''),
      member_count: memberCount ?? 0,
    })
  ) {
    return { ok: true, skipped: 'not_eligible', notified: 0 }
  }

  const { data: members, error: memErr } = await supabaseAdmin
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .neq('user_id', tx.user_id)

  if (memErr) return { ok: false, error: memErr.message, status: 500 }
  if (!members?.length) {
    return { ok: true, skipped: 'no_recipients', notified: 0 }
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

  return { ok: true, notified, results }
}
