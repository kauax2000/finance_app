-- Remove global notification columns from user_settings (prefs live on workspace_member_notification_prefs)
-- Run after: workspace-member-notification-prefs.sql (backfill must have copied values)

alter table public.user_settings drop column if exists notify_email;
alter table public.user_settings drop column if exists notify_in_app;
alter table public.user_settings drop column if exists notify_transactions;
alter table public.user_settings drop column if exists notify_budget;
alter table public.user_settings drop column if exists notify_promotions;
