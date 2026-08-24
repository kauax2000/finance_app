-- Advisor auth_rls_initplan (Supabase Security/Performance Advisors):
-- políticas com `auth.uid()` sem wrap em SELECT re-avaliam a função por LINHA
-- em vez de uma vez por query (initplan). As políticas core já tinham sido
-- corrigidas (20260514120000, hoje no baseline); estas são as 32 restantes
-- (per-user e INSERT/UPDATE), recriadas mecanicamente a partir de pg_policies
-- trocando `auth.uid()` por `(select auth.uid())`. Semântica idêntica.

drop policy if exists "Workspace members can insert bill_instances" on public.bill_instances;
create policy "Workspace members can insert bill_instances" on public.bill_instances
  as permissive
  for insert
  to public
  with check ((is_workspace_member(workspace_id) AND ((select auth.uid()) = user_id)));

drop policy if exists "Workspace members can insert bills" on public.bills;
create policy "Workspace members can insert bills" on public.bills
  as permissive
  for insert
  to public
  with check ((is_workspace_member(workspace_id) AND ((select auth.uid()) = user_id)));

drop policy if exists "Workspace members can insert credit_card_category_spend_alerts" on public.credit_card_category_spend_alerts;
create policy "Workspace members can insert credit_card_category_spend_alerts" on public.credit_card_category_spend_alerts
  as permissive
  for insert
  to public
  with check ((is_workspace_member(workspace_id) AND ((select auth.uid()) = created_by)));

drop policy if exists "Workspace members can insert credit_card_invoice_payments" on public.credit_card_invoice_payments;
create policy "Workspace members can insert credit_card_invoice_payments" on public.credit_card_invoice_payments
  as permissive
  for insert
  to public
  with check ((is_workspace_member(workspace_id) AND ((select auth.uid()) = created_by)));

drop policy if exists "Workspace members can insert credit cards" on public.credit_cards;
create policy "Workspace members can insert credit cards" on public.credit_cards
  as permissive
  for insert
  to public
  with check ((is_workspace_member(workspace_id) AND ((select auth.uid()) = user_id)));

drop policy if exists "Workspace members can delete own notifications" on public.notifications;
create policy "Workspace members can delete own notifications" on public.notifications
  as permissive
  for delete
  to public
  using ((((select auth.uid()) = user_id) AND is_workspace_member(workspace_id)));

drop policy if exists "Workspace members can update own notifications" on public.notifications;
create policy "Workspace members can update own notifications" on public.notifications
  as permissive
  for update
  to public
  using ((((select auth.uid()) = user_id) AND is_workspace_member(workspace_id)));

drop policy if exists "Workspace members can view own notifications" on public.notifications;
create policy "Workspace members can view own notifications" on public.notifications
  as permissive
  for select
  to public
  using ((((select auth.uid()) = user_id) AND is_workspace_member(workspace_id)));

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  as permissive
  for insert
  to public
  with check (((select auth.uid()) = id));

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  as permissive
  for update
  to public
  using (((select auth.uid()) = id));

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  as permissive
  for select
  to public
  using (((select auth.uid()) = id));

drop policy if exists push_subscriptions_delete_own on public.push_subscriptions;
create policy push_subscriptions_delete_own on public.push_subscriptions
  as permissive
  for delete
  to public
  using (((select auth.uid()) = user_id));

drop policy if exists push_subscriptions_insert_own on public.push_subscriptions;
create policy push_subscriptions_insert_own on public.push_subscriptions
  as permissive
  for insert
  to public
  with check (((select auth.uid()) = user_id));

drop policy if exists push_subscriptions_select_own on public.push_subscriptions;
create policy push_subscriptions_select_own on public.push_subscriptions
  as permissive
  for select
  to public
  using (((select auth.uid()) = user_id));

drop policy if exists push_subscriptions_update_own on public.push_subscriptions;
create policy push_subscriptions_update_own on public.push_subscriptions
  as permissive
  for update
  to public
  using (((select auth.uid()) = user_id))
  with check (((select auth.uid()) = user_id));

drop policy if exists "Users can delete own sessions" on public.user_sessions;
create policy "Users can delete own sessions" on public.user_sessions
  as permissive
  for delete
  to public
  using (((select auth.uid()) = user_id));

drop policy if exists "Users can insert own sessions" on public.user_sessions;
create policy "Users can insert own sessions" on public.user_sessions
  as permissive
  for insert
  to public
  with check (((select auth.uid()) = user_id));

drop policy if exists "Users can update own sessions" on public.user_sessions;
create policy "Users can update own sessions" on public.user_sessions
  as permissive
  for update
  to public
  using (((select auth.uid()) = user_id));

drop policy if exists "Users can view own sessions" on public.user_sessions;
create policy "Users can view own sessions" on public.user_sessions
  as permissive
  for select
  to public
  using (((select auth.uid()) = user_id));

drop policy if exists "Users can insert own settings" on public.user_settings;
create policy "Users can insert own settings" on public.user_settings
  as permissive
  for insert
  to public
  with check (((select auth.uid()) = user_id));

drop policy if exists "Users can update own settings" on public.user_settings;
create policy "Users can update own settings" on public.user_settings
  as permissive
  for update
  to public
  using (((select auth.uid()) = user_id));

drop policy if exists "Users can view own settings" on public.user_settings;
create policy "Users can view own settings" on public.user_settings
  as permissive
  for select
  to public
  using (((select auth.uid()) = user_id));

drop policy if exists "Workspace members can insert workspace_installment_plans" on public.workspace_installment_plans;
create policy "Workspace members can insert workspace_installment_plans" on public.workspace_installment_plans
  as permissive
  for insert
  to public
  with check ((is_workspace_member(workspace_id) AND ((select auth.uid()) = user_id)));

drop policy if exists "Owners can create invites" on public.workspace_invites;
create policy "Owners can create invites" on public.workspace_invites
  as permissive
  for insert
  to public
  with check ((is_workspace_owner(workspace_id) AND ((select auth.uid()) = created_by)));

drop policy if exists "Members can insert own workspace notification prefs" on public.workspace_member_notification_prefs;
create policy "Members can insert own workspace notification prefs" on public.workspace_member_notification_prefs
  as permissive
  for insert
  to public
  with check ((((select auth.uid()) = user_id) AND is_workspace_member(workspace_id)));

drop policy if exists "Members can update own workspace notification prefs" on public.workspace_member_notification_prefs;
create policy "Members can update own workspace notification prefs" on public.workspace_member_notification_prefs
  as permissive
  for update
  to public
  using ((((select auth.uid()) = user_id) AND is_workspace_member(workspace_id)));

drop policy if exists "Members can view own workspace notification prefs" on public.workspace_member_notification_prefs;
create policy "Members can view own workspace notification prefs" on public.workspace_member_notification_prefs
  as permissive
  for select
  to public
  using ((((select auth.uid()) = user_id) AND is_workspace_member(workspace_id)));

drop policy if exists "Members can leave workspace" on public.workspace_members;
create policy "Members can leave workspace" on public.workspace_members
  as permissive
  for delete
  to public
  using ((((select auth.uid()) = user_id) AND (workspace_role(workspace_id) = 'member'::text)));

drop policy if exists "Owners can add members" on public.workspace_members;
create policy "Owners can add members" on public.workspace_members
  as permissive
  for insert
  to public
  with check ((is_workspace_owner(workspace_id) OR ((EXISTS ( SELECT 1
   FROM workspaces w
  WHERE ((w.id = workspace_members.workspace_id) AND (w.created_by = (select auth.uid()))))) AND (user_id = (select auth.uid())) AND (role = 'owner'::text))));

drop policy if exists "Workspace members can insert workspace_subscriptions" on public.workspace_subscriptions;
create policy "Workspace members can insert workspace_subscriptions" on public.workspace_subscriptions
  as permissive
  for insert
  to public
  with check ((is_workspace_member(workspace_id) AND ((select auth.uid()) = user_id)));

drop policy if exists "Users can create workspaces" on public.workspaces;
create policy "Users can create workspaces" on public.workspaces
  as permissive
  for insert
  to public
  with check (((select auth.uid()) = created_by));

drop policy if exists "Users can view own workspaces" on public.workspaces;
create policy "Users can view own workspaces" on public.workspaces
  as permissive
  for select
  to public
  using ((is_workspace_member(id) OR (created_by = (select auth.uid()))));

