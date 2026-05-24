export type TransactionNotifyRow = {
  id: string
  user_id: string
  workspace_id: string | null
  type: string
  amount: number
  description: string | null
  subscription_id?: string | null
  installment_plan_id?: string | null
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
