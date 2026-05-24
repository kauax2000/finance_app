-- Member expense notifications: Database Webhook → notify-transaction-created
--
-- This migration documents the required webhook. Configure in Supabase Dashboard:
--   Database → Webhooks → Create a new hook
--
--   Name: notify-transaction-created
--   Table: public.transactions
--   Events: INSERT
--   Type: Supabase Edge Function
--   Function: notify-transaction-created
--
-- Or use HTTP webhook:
--   URL: https://<project-ref>.supabase.co/functions/v1/notify-transaction-created
--   Method: POST
--   Headers:
--     Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
--     Content-Type: application/json
--   Payload: { "transaction_id": "{{ record.id }}" }
--
-- Optional secret (set NOTIFY_INTERNAL_SECRET in Edge Function secrets):
--   x-notify-internal-secret: <same value>
--
-- The function notifies other workspace members when a manual expense is inserted
-- in a shared workspace (excludes subscription/installment automated rows).

comment on table public.transactions is
  'Financial transactions. INSERT webhook notify-transaction-created alerts shared workspace members.';
