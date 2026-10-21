export type TransactionNotifyRow = {
  id: string
  user_id: string
  workspace_id: string | null
  type: string
  amount: number
  description: string | null
  subscription_id?: string | null
  installment_plan_id?: string | null
  import_batch_id?: string | null
}

export type WorkspaceNotifyContext = {
  type: string
  member_count: number
}

/** Manual member expense in a shared workspace with at least one other member. */
export function shouldNotifyMembersForTransaction(
  tx: TransactionNotifyRow,
  workspace: WorkspaceNotifyContext | null
): boolean {
  if (tx.type !== 'expense') return false
  if (tx.subscription_id) return false
  if (tx.installment_plan_id) return false
  if (!tx.workspace_id) return false
  if (!workspace || workspace.type !== 'shared') return false
  if (workspace.member_count < 2) return false
  return true
}

export type TriggerSkipReason = 'imported' | 'not_expense' | 'subscription' | 'installment'

/**
 * The WHEN of trigger transactions_notify_created (20261022120000_fatura_que_bate.sql),
 * negated: why the trigger would not dispatch this row, or null when it would.
 * The function repeats it so an old Database Webhook (Bloco 1) cannot notify
 * rows the trigger skips — above all every imported row.
 */
export function triggerSkipReason(
  tx: Pick<TransactionNotifyRow, 'type' | 'subscription_id' | 'installment_plan_id' | 'import_batch_id'>
): TriggerSkipReason | null {
  if (tx.import_batch_id != null) return 'imported'
  if (tx.type !== 'expense') return 'not_expense'
  if (tx.subscription_id != null) return 'subscription'
  if (tx.installment_plan_id != null) return 'installment'
  return null
}
