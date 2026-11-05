#!/usr/bin/env bash
# Publica no projeto novo (sa-east-1) as mesmas 18 Edge Functions que estão no
# projeto antigo (us-west-2). As que existem no código mas nunca foram
# publicadas lá (asaas-webhook, billing-*, insights-daily, mcp, review-reminder)
# ficam de fora, como hoje.
set -euo pipefail
cd "$(dirname "$0")/.."

REF=gexvgoknthcvdnqtdukq
FUNCOES=(
  sessions activity-logs delete-user evaluate-budgets
  workspace-invites-create workspace-invites-accept workspace-invites-resend
  evaluate-bills-reminders run-recurring-billing evaluate-credit-card-alerts
  push-subscribe push-unsubscribe credit-card-calendar-alerts
  notify-transaction-created attachments-cleanup ia-ler capture reativacao
)

for f in "${FUNCOES[@]}"; do
  echo "== $f"
  supabase functions deploy "$f" --project-ref "$REF" --use-api --no-verify-jwt
done
