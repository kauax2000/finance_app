-- ============================================================================
-- BASELINE — schema completo do finance-app (Fase 3 da revisão de backend)
-- ============================================================================
--
-- Gerado em 2026-08-24 a partir de `supabase db dump --local` de um banco
-- construído com: os SQLs soltos históricos (ordem de dependência verificada)
-- + todas as 37 migrações anteriores (até 20260824131000, inclusive).
--
-- Este arquivo substitui TODAS as migrações anteriores e TODOS os SQLs soltos.
-- Um banco novo é construído apenas com esta migração (+ as posteriores).
--
-- Produção: NUNCA execute este arquivo lá. O histórico remoto é reconciliado
-- com `supabase migration repair` (ver docs/BASELINE_RUNBOOK.md):
--   1. `supabase db push` das migrações pendentes (até 20260824131000)
--   2. repair: marcar versões antigas como reverted e esta como applied
--   3. `supabase db push --dry-run` deve reportar nada a aplicar
--   4. `supabase db diff --linked` deve ser vazio (diff real = baseline
--      incompleto; corrija ESTE arquivo, nunca o banco de produção)
--
-- Apêndices no fim (objetos fora do escopo do pg_dump de `public`):
--   A. trigger `on_auth_user_created` em auth.users
--   B. bucket `avatars` + políticas de storage.objects (owner-scoped)
--   C. jobs pg_cron (billing diário, limpeza de activity logs)
-- ============================================================================




SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."accept_workspace_invite"("p_token_hash" "text", "p_user_id" "uuid", "p_user_email" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_invite public.workspace_invites%rowtype;
  v_email text := lower(coalesce(trim(p_user_email), ''));
  v_next_usage integer;
  v_exhausted boolean;
begin
  if p_user_id is null then
    return jsonb_build_object('status', 'invalid_user');
  end if;
  if v_email = '' then
    return jsonb_build_object('status', 'invalid_user');
  end if;

  select * into v_invite
  from public.workspace_invites
  where token_hash = p_token_hash
  for update;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  -- Idempotency first: re-clicking the link after joining (even once the
  -- invite is exhausted/accepted) must not read as an error.
  if exists (
    select 1 from public.workspace_members
    where workspace_id = v_invite.workspace_id and user_id = p_user_id
  ) then
    return jsonb_build_object(
      'status', 'already_member',
      'workspace_id', v_invite.workspace_id
    );
  end if;

  if v_invite.status <> 'pending' then
    return jsonb_build_object('status', 'not_pending', 'workspace_id', v_invite.workspace_id);
  end if;

  if v_invite.expires_at < now() then
    update public.workspace_invites set status = 'expired' where id = v_invite.id;
    return jsonb_build_object('status', 'expired', 'workspace_id', v_invite.workspace_id);
  end if;

  if v_invite.invited_email is not null
     and lower(trim(v_invite.invited_email)) <> v_email then
    return jsonb_build_object('status', 'email_mismatch');
  end if;

  -- Claim BEFORE joining: the invite row is locked, so concurrent accepts
  -- serialize here and the (max_uses + 1)-th caller is rejected.
  if v_invite.max_uses is not null and v_invite.usage_count >= v_invite.max_uses then
    return jsonb_build_object('status', 'exhausted', 'workspace_id', v_invite.workspace_id);
  end if;

  v_next_usage := v_invite.usage_count + 1;
  v_exhausted := v_invite.max_uses is not null and v_next_usage >= v_invite.max_uses;

  update public.workspace_invites
  set usage_count = v_next_usage,
      status = case when v_exhausted then 'accepted' else status end,
      accepted_at = case when v_exhausted then now() else accepted_at end
  where id = v_invite.id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_invite.workspace_id, p_user_id, 'member')
  on conflict (workspace_id, user_id) do nothing;

  return jsonb_build_object(
    'status', 'accepted',
    'workspace_id', v_invite.workspace_id,
    'invite_id', v_invite.id,
    'created_by', v_invite.created_by
  );
end;
$$;


ALTER FUNCTION "public"."accept_workspace_invite"("p_token_hash" "text", "p_user_id" "uuid", "p_user_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."catch_up_recurring_billing"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_uid uuid := auth.uid();
  r record;
  v_step smallint;
  v_inst_n int := 0;
  v_sub_n int := 0;
  v_today date;
  v_charge date;
  v_ts timestamptz;
  v_next date;
  v_rows int;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  v_today := (timezone('UTC', now()))::date;

  -- ── Installment billing ─────────────────────────────────────────────
  for r in
    select p.id
    from public.workspace_installment_plans p
    where p.is_active = true
      and p.generated_count < p.total_installments
      and p.next_billing_date <= v_today
      and exists (
        select 1 from public.workspace_members wm
        where wm.workspace_id = p.workspace_id and wm.user_id = v_uid
      )
  loop
    loop
      v_step := public.charge_workspace_installment_plan_step(r.id);
      exit when v_step = 0;
      if v_step = 1 then v_inst_n := v_inst_n + 1; end if;
    end loop;
  end loop;

  -- ── Subscription billing (mirrors run_subscription_billing, scoped) ─
  <<sub_outer>>
  for r in
    select ws.*
    from public.workspace_subscriptions ws
    where ws.is_active = true
      and exists (
        select 1 from public.workspace_members wm
        where wm.workspace_id = ws.workspace_id and wm.user_id = v_uid
      )
      and (
        (ws.next_billing_date is not null and ws.next_billing_date <= v_today)
        or (
          ws.next_billing_date is null
          and ws.day_of_month is not null
          and extract(day from v_today)::smallint = ws.day_of_month
          and ws.start_date <= v_today
        )
      )
  loop
    <<sub_step>>
    loop
      -- Skip-locked: if the cron writer holds this row it will finish the
      -- charge; waiting here would only serialize the dashboard behind cron.
      select * into r
      from public.workspace_subscriptions
      where id = r.id and is_active = true
      for update skip locked;

      if not found then exit sub_step; end if;

      if r.next_billing_date is not null and r.next_billing_date <= v_today then
        v_charge := r.next_billing_date;

        v_ts := (to_char(v_charge, 'YYYY-MM-DD') || 'T12:00:00Z')::timestamptz;
        insert into public.transactions (
          user_id, workspace_id, category_id, type, amount, description, date,
          is_recurring, recurring_interval, subscription_id,
          payment_method, payment_credit_card_id
        ) values (
          r.user_id, r.workspace_id, r.category_id, 'expense', r.amount, r.name, v_ts,
          false, null, r.id,
          r.payment_method, r.payment_credit_card_id
        )
        on conflict (subscription_id, ((date at time zone 'UTC')::date))
          where subscription_id is not null
          do nothing;
        get diagnostics v_rows = row_count;
        v_sub_n := v_sub_n + v_rows;

        v_next := case r.billing_interval
          when 'weekly'  then (v_charge + interval '7 days')::date
          when 'monthly' then (v_charge + interval '1 month')::date
          when 'bimonthly' then (v_charge + interval '2 months')::date
          when 'yearly'  then (v_charge + interval '1 year')::date
          else (v_charge + interval '1 month')::date
        end;
        update public.workspace_subscriptions set next_billing_date = v_next where id = r.id;

      elsif
        r.next_billing_date is null
        and r.day_of_month is not null
        and extract(day from v_today)::smallint = r.day_of_month
        and r.start_date <= v_today
      then
        v_charge := v_today;

        v_ts := (to_char(v_charge, 'YYYY-MM-DD') || 'T12:00:00Z')::timestamptz;
        insert into public.transactions (
          user_id, workspace_id, category_id, type, amount, description, date,
          is_recurring, recurring_interval, subscription_id,
          payment_method, payment_credit_card_id
        ) values (
          r.user_id, r.workspace_id, r.category_id, 'expense', r.amount, r.name, v_ts,
          false, null, r.id,
          r.payment_method, r.payment_credit_card_id
        )
        on conflict (subscription_id, ((date at time zone 'UTC')::date))
          where subscription_id is not null
          do nothing;
        get diagnostics v_rows = row_count;
        v_sub_n := v_sub_n + v_rows;

        v_next := (v_charge + interval '1 month')::date;
        update public.workspace_subscriptions set next_billing_date = v_next where id = r.id;

      else
        exit sub_step;
      end if;

      select * into r
      from public.workspace_subscriptions
      where id = r.id and is_active = true;
      if not found then exit sub_step; end if;
      if r.next_billing_date is null or r.next_billing_date > v_today then
        exit sub_step;
      end if;
    end loop sub_step;
  end loop sub_outer;

  return jsonb_build_object('subscriptions', v_sub_n, 'installments', v_inst_n);
end;
$$;


ALTER FUNCTION "public"."catch_up_recurring_billing"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."charge_workspace_installment_plan_step"("p_plan_id" "uuid") RETURNS smallint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  r public.workspace_installment_plans%rowtype;
  v_today date;
  v_charge date;
  v_ts timestamptz;
  v_next date;
  v_amount numeric(15, 2);
  v_new_count int;
  v_part int;
  v_desc text;
  v_inserted boolean := false;
begin
  v_today := (timezone('UTC', now()))::date;

  select * into r
  from public.workspace_installment_plans
  where id = p_plan_id
  for update;

  if not found then
    return 0;
  end if;

  if
    not r.is_active
    or r.generated_count >= r.total_installments
    or r.next_billing_date > v_today
  then
    return 0;
  end if;

  v_charge := r.next_billing_date;
  v_part := r.generated_count + 1;

  if r.generated_count = r.total_installments - 1 then
    v_amount := r.final_installment_amount;
  else
    v_amount := r.installment_amount;
  end if;

  v_desc := trim(coalesce(r.description, ''));
  if v_desc = '' then
    v_desc := 'Parcela ' || v_part::text || '/' || r.total_installments::text;
  else
    v_desc := v_desc || ' (' || v_part::text || '/' || r.total_installments::text || ')';
  end if;

  if not exists (
    select 1
    from public.transactions t
    where t.installment_plan_id = r.id
      and (t.date at time zone 'UTC')::date = v_charge
  ) then
    v_ts := (to_char(v_charge, 'YYYY-MM-DD') || 'T12:00:00Z')::timestamptz;
    insert into public.transactions (
      user_id,
      workspace_id,
      category_id,
      type,
      amount,
      description,
      date,
      is_recurring,
      recurring_interval,
      installment_plan_id,
      installment_sequence,
      payment_method,
      payment_credit_card_id
    ) values (
      r.user_id,
      r.workspace_id,
      r.category_id,
      'expense',
      v_amount,
      v_desc,
      v_ts,
      false,
      null,
      r.id,
      v_part::smallint,
      r.payment_method,
      r.payment_credit_card_id
    );
    v_inserted := true;
  end if;

  v_new_count := r.generated_count + 1;

  if v_new_count >= r.total_installments then
    update public.workspace_installment_plans
    set
      generated_count = v_new_count,
      next_billing_date = null,
      is_active = false
    where id = r.id;
  else
    v_next := (v_charge + interval '1 month')::date;
    update public.workspace_installment_plans
    set
      generated_count = v_new_count,
      next_billing_date = v_next
    where id = r.id;
  end if;

  if v_inserted then
    return 1;
  end if;
  return 2;
end;
$$;


ALTER FUNCTION "public"."charge_workspace_installment_plan_step"("p_plan_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_sessions"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    DELETE FROM user_sessions
    WHERE last_active_at < NOW() - INTERVAL '30 days'
    AND is_active = FALSE;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_sessions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_activity_logs"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    DELETE FROM user_activity_logs
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;


ALTER FUNCTION "public"."cleanup_old_activity_logs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_workspace_categories_onboarding"("p_workspace_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not public.is_workspace_member(p_workspace_id) then
    raise exception 'not a workspace member';
  end if;

  update public.workspaces
  set
    categories_onboarding_completed_at = now(),
    updated_at = now()
  where id = p_workspace_id;
end;
$$;


ALTER FUNCTION "public"."complete_workspace_categories_onboarding"("p_workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_workspace_installment_plan"("p_workspace_id" "uuid", "p_category_id" "uuid", "p_description" "text", "p_payment_method" "text", "p_payment_credit_card_id" "uuid", "p_total_installments" integer, "p_installment_amount" numeric, "p_final_installment_amount" numeric, "p_next_billing_date" "date") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_uid uuid := auth.uid();
  v_plan_id uuid;
  v_step smallint;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_workspace_member(p_workspace_id) then
    raise exception 'Forbidden';
  end if;

  if p_total_installments is null or p_total_installments < 2 then
    raise exception 'Invalid total_installments';
  end if;

  insert into public.workspace_installment_plans (
    workspace_id,
    user_id,
    category_id,
    description,
    payment_method,
    payment_credit_card_id,
    total_installments,
    generated_count,
    installment_amount,
    final_installment_amount,
    next_billing_date,
    is_active
  ) values (
    p_workspace_id,
    v_uid,
    p_category_id,
    nullif(trim(coalesce(p_description, '')), ''),
    p_payment_method,
    p_payment_credit_card_id,
    p_total_installments,
    0,
    p_installment_amount,
    p_final_installment_amount,
    p_next_billing_date,
    true
  )
  returning id into v_plan_id;

  loop
    v_step := public.charge_workspace_installment_plan_step(v_plan_id);
    exit when v_step = 0;
  end loop;

  return v_plan_id;
end;
$$;


ALTER FUNCTION "public"."create_workspace_installment_plan"("p_workspace_id" "uuid", "p_category_id" "uuid", "p_description" "text", "p_payment_method" "text", "p_payment_credit_card_id" "uuid", "p_total_installments" integer, "p_installment_amount" numeric, "p_final_installment_amount" numeric, "p_next_billing_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_workspace"("p_workspace_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  wtype text;
  is_owner boolean;
begin
  select w.type, (wm.role = 'owner')
  into wtype, is_owner
  from public.workspaces w
  left join public.workspace_members wm
    on wm.workspace_id = w.id
   and wm.user_id = auth.uid()
  where w.id = p_workspace_id;

  if wtype is null then
    raise exception 'WORKSPACE_NOT_FOUND'
      using errcode = 'P0001';
  end if;

  if not coalesce(is_owner, false) then
    raise exception 'WORKSPACE_NOT_OWNER'
      using errcode = 'P0001';
  end if;

  if wtype = 'personal' then
    raise exception 'WORKSPACE_PERSONAL_IMMUTABLE'
      using errcode = 'P0001';
  end if;

  delete from public.workspaces
  where id = p_workspace_id;
end;
$$;


ALTER FUNCTION "public"."delete_workspace"("p_workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_workspace_installment_plan_cascade"("p_plan_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_workspace_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select workspace_id into v_workspace_id
  from public.workspace_installment_plans
  where id = p_plan_id;

  if not found then
    return;
  end if;

  if not public.is_workspace_member(v_workspace_id) then
    raise exception 'Forbidden';
  end if;

  delete from public.transactions
  where installment_plan_id = p_plan_id;

  delete from public.workspace_installment_plans
  where id = p_plan_id;
end;
$$;


ALTER FUNCTION "public"."delete_workspace_installment_plan_cascade"("p_plan_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_workspace_member_notification_prefs"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.workspace_member_notification_prefs (workspace_id, user_id)
  values (new.workspace_id, new.user_id)
  on conflict (workspace_id, user_id) do nothing;
  return new;
end;
$$;


ALTER FUNCTION "public"."ensure_workspace_member_notification_prefs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_device_info_from_user_agent"("user_agent_text" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    device_type TEXT;
    device_name TEXT;
    browser TEXT;
    os TEXT;
BEGIN
    -- Detect device type
    IF user_agent_text ILIKE '%mobile%' OR user_agent_text ILIKE '%android%' OR user_agent_text ILIKE '%iphone%' OR user_agent_text ILIKE '%ipad%' THEN
        device_type := 'mobile';
        IF user_agent_text ILIKE '%ipad%' THEN
            device_type := 'tablet';
        END IF;
    ELSE
        device_type := 'desktop';
    END IF;

    -- Detect browser
    IF user_agent_text ILIKE '%Chrome%' AND user_agent_text NOT ILIKE '%Edg%' THEN
        browser := 'Chrome';
    ELSIF user_agent_text ILIKE '%Firefox%' THEN
        browser := 'Firefox';
    ELSIF user_agent_text ILIKE '%Safari%' AND user_agent_text NOT ILIKE '%Chrome%' THEN
        browser := 'Safari';
    ELSIF user_agent_text ILIKE '%Edg%' THEN
        browser := 'Edge';
    ELSE
        browser := 'Outro';
    END IF;

    -- Detect OS
    IF user_agent_text ILIKE '%Macintosh%' OR user_agent_text ILIKE '%Mac OS%' THEN
        os := 'macOS';
    ELSIF user_agent_text ILIKE '%Windows%' THEN
        os := 'Windows';
    ELSIF user_agent_text ILIKE '%Linux%' THEN
        os := 'Linux';
    ELSIF user_agent_text ILIKE '%Android%' THEN
        os := 'Android';
    ELSIF user_agent_text ILIKE '%iPhone%' OR user_agent_text ILIKE '%iPad%' THEN
        os := 'iOS';
    ELSE
        os := 'Outro';
    END IF;

    -- Device name based on OS
    IF os = 'macOS' THEN
        device_name := 'Mac';
    ELSIF os = 'Windows' THEN
        device_name := 'Windows PC';
    ELSIF os = 'Linux' THEN
        device_name := 'Linux PC';
    ELSIF os = 'Android' THEN
        device_name := 'Android';
    ELSIF os = 'iOS' THEN
        IF user_agent_text ILIKE '%iPad%' THEN
            device_name := 'iPad';
        ELSE
            device_name := 'iPhone';
        END IF;
    ELSE
        device_name := 'Computador';
    END IF;

    RETURN jsonb_build_object(
        'device_type', device_type,
        'device_name', device_name,
        'browser', browser,
        'os', os
    );
END;
$$;


ALTER FUNCTION "public"."get_device_info_from_user_agent"("user_agent_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_workspace_delete_impact"("p_workspace_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  wtype text;
  is_owner boolean;
  tx_count bigint;
  budget_count bigint;
  category_count bigint;
  member_count bigint;
  other_members bigint;
begin
  select w.type, (wm.role = 'owner')
  into wtype, is_owner
  from public.workspaces w
  left join public.workspace_members wm
    on wm.workspace_id = w.id
   and wm.user_id = auth.uid()
  where w.id = p_workspace_id;

  if wtype is null then
    raise exception 'WORKSPACE_NOT_FOUND'
      using errcode = 'P0001';
  end if;

  if not coalesce(is_owner, false) then
    raise exception 'WORKSPACE_NOT_OWNER'
      using errcode = 'P0001';
  end if;

  if wtype = 'personal' then
    raise exception 'WORKSPACE_PERSONAL_IMMUTABLE'
      using errcode = 'P0001';
  end if;

  select count(*) into tx_count
  from public.transactions
  where workspace_id = p_workspace_id;

  select count(*) into budget_count
  from public.budgets
  where workspace_id = p_workspace_id;

  select count(*) into category_count
  from public.categories
  where workspace_id = p_workspace_id;

  select count(*) into member_count
  from public.workspace_members
  where workspace_id = p_workspace_id;

  select count(*) into other_members
  from public.workspace_members
  where workspace_id = p_workspace_id
    and user_id <> auth.uid();

  return jsonb_build_object(
    'transactions', tx_count,
    'budgets', budget_count,
    'categories', category_count,
    'members', member_count,
    'other_members', other_members
  );
end;
$$;


ALTER FUNCTION "public"."get_workspace_delete_impact"("p_workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  personal_workspace_id uuid;
  accent_palette text[] := array[
    '#2563EB','#7C3AED','#DB2777','#DC2626','#EA580C','#CA8A04',
    '#16A34A','#0D9488','#0891B2','#4F46E5','#9333EA','#C026D3'
  ];
  accent_pick text;
  raw_full text;
  first_name text;
  personal_workspace_name text;
begin
  accent_pick := accent_palette[
    1 + floor(random() * array_length(accent_palette, 1))::int
  ];
  raw_full := coalesce(trim(new.raw_user_meta_data->>'full_name'), '');
  first_name := nullif(split_part(raw_full, ' ', 1), '');
  if first_name is null then
    first_name := nullif(split_part(coalesce(new.email, ''), '@', 1), '');
  end if;
  if first_name is null then
    first_name := 'Usuário';
  end if;
  personal_workspace_name := 'Carteira pessoal de ' || first_name;
  insert into public.profiles (id, email, full_name, avatar_color)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    (array[
      'bg-red-500','bg-orange-500','bg-amber-500','bg-yellow-500','bg-lime-500',
      'bg-green-500','bg-emerald-500','bg-teal-500','bg-cyan-500','bg-sky-500',
      'bg-blue-500','bg-indigo-500','bg-violet-500','bg-purple-500','bg-fuchsia-500',
      'bg-pink-500','bg-rose-500'
    ])[1 + floor(random() * 17)::int]
  )
  on conflict (id) do nothing;

  select w.id
    into personal_workspace_id
  from public.workspaces w
  where w.created_by = new.id
    and w.type = 'personal'
  order by w.created_at asc
  limit 1;

  if personal_workspace_id is null then
    insert into public.workspaces (id, name, type, created_by, icon, icon_background_color)
    values (
      gen_random_uuid(),
      personal_workspace_name,
      'personal',
      new.id,
      'home',
      accent_pick
    )
    returning id into personal_workspace_id;
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (personal_workspace_id, new.id, 'owner')
  on conflict (workspace_id, user_id) do update set role = excluded.role;

  insert into public.categories (user_id, workspace_id, name, type, color, icon)
  values
    (new.id, personal_workspace_id, 'Alimentação', 'expense', '#EF4444', 'utensils'),
    (new.id, personal_workspace_id, 'Transporte', 'expense', '#3B82F6', 'car'),
    (new.id, personal_workspace_id, 'Moradia', 'expense', '#8B5CF6', 'home'),
    (new.id, personal_workspace_id, 'Lazer', 'expense', '#F59E0B', 'gamepad-2'),
    (new.id, personal_workspace_id, 'Saúde', 'expense', '#10B981', 'heart'),
    (new.id, personal_workspace_id, 'Educação', 'expense', '#6366F1', 'graduation-cap'),
    (new.id, personal_workspace_id, 'Outros', 'expense', '#6B7280', 'more-horizontal')
  on conflict do nothing;

  insert into public.categories (user_id, workspace_id, name, type, color, icon)
  values
    (new.id, personal_workspace_id, 'Salário', 'income', '#10B981', 'briefcase'),
    (new.id, personal_workspace_id, 'Freelance', 'income', '#3B82F6', 'laptop'),
    (new.id, personal_workspace_id, 'Investimentos', 'income', '#F59E0B', 'trending-up'),
    (new.id, personal_workspace_id, 'Presentes', 'income', '#EC4899', 'gift'),
    (new.id, personal_workspace_id, 'Outros', 'income', '#6B7280', 'more-horizontal')
  on conflict do nothing;

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_workspace_member"("workspace_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = is_workspace_member.workspace_id
      and wm.user_id = (select auth.uid())
  );
$$;


ALTER FUNCTION "public"."is_workspace_member"("workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_workspace_owner"("workspace_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select public.workspace_role(is_workspace_owner.workspace_id) = 'owner';
$$;


ALTER FUNCTION "public"."is_workspace_owner"("workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_fetch_bills_page_bundle"("p_workspace_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
declare
  v_bills jsonb;
  v_pending jsonb;
  v_paid jsonb;
  v_cats jsonb;
  v_cards jsonb;
  v_cc_tx jsonb;
  v_plans jsonb;
  v_inv jsonb;
  v_since date := (current_date - interval '90 days')::date;
begin
  if not public.is_workspace_member(p_workspace_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select coalesce(
    jsonb_agg(
      case
        when c.id is not null then to_jsonb(b) || jsonb_build_object('category', to_jsonb(c))
        else to_jsonb(b)
      end
      order by b.name
    ),
    '[]'::jsonb
  )
  into v_bills
  from public.bills b
  left join public.categories c on c.id = b.category_id
  where b.workspace_id = p_workspace_id;

  select coalesce(jsonb_agg(to_jsonb(i) order by i.due_date), '[]'::jsonb)
  into v_pending
  from public.bill_instances i
  where i.workspace_id = p_workspace_id
    and i.status = 'pending';

  select coalesce(jsonb_agg(to_jsonb(i) order by i.paid_at desc), '[]'::jsonb)
  into v_paid
  from (
    select *
    from public.bill_instances i2
    where i2.workspace_id = p_workspace_id
      and i2.status = 'paid'
      and i2.due_date >= v_since
    order by i2.paid_at desc nulls last
    limit 120
  ) i;

  select coalesce(jsonb_agg(to_jsonb(c) order by c.name), '[]'::jsonb)
  into v_cats
  from public.categories c
  where c.workspace_id = p_workspace_id;

  select coalesce(jsonb_agg(to_jsonb(cc) order by cc.name), '[]'::jsonb)
  into v_cards
  from public.credit_cards cc
  where cc.workspace_id = p_workspace_id;

  select coalesce(
    jsonb_agg(
      to_jsonb(t) || jsonb_build_object(
        'category', case when cat.id is null then null else jsonb_build_object('name', cat.name) end
      )
      order by t.date desc
    ),
    '[]'::jsonb
  )
  into v_cc_tx
  from public.transactions t
  left join public.categories cat on cat.id = t.category_id
  where t.workspace_id = p_workspace_id
    and t.type = 'expense'
    and t.payment_method = 'credit_card';

  select coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb)
  into v_plans
  from public.workspace_installment_plans p
  where p.workspace_id = p_workspace_id;

  select coalesce(jsonb_agg(to_jsonb(ip)), '[]'::jsonb)
  into v_inv
  from public.credit_card_invoice_payments ip
  where ip.workspace_id = p_workspace_id;

  return jsonb_build_object(
    'bills', coalesce(v_bills, '[]'::jsonb),
    'pending_instances', coalesce(v_pending, '[]'::jsonb),
    'recent_paid_instances', coalesce(v_paid, '[]'::jsonb),
    'categories', coalesce(v_cats, '[]'::jsonb),
    'credit_cards', coalesce(v_cards, '[]'::jsonb),
    'cc_transactions', coalesce(v_cc_tx, '[]'::jsonb),
    'installment_plans', coalesce(v_plans, '[]'::jsonb),
    'invoice_payments', coalesce(v_inv, '[]'::jsonb),
    'table_missing', false
  );
exception
  when undefined_table then
    return jsonb_build_object(
      'bills', '[]'::jsonb,
      'pending_instances', '[]'::jsonb,
      'recent_paid_instances', '[]'::jsonb,
      'categories', '[]'::jsonb,
      'credit_cards', '[]'::jsonb,
      'cc_transactions', '[]'::jsonb,
      'installment_plans', '[]'::jsonb,
      'invoice_payments', '[]'::jsonb,
      'table_missing', true
    );
end;
$$;


ALTER FUNCTION "public"."rpc_fetch_bills_page_bundle"("p_workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_fetch_category_detail_bundle"("p_workspace_id" "uuid", "p_category_id" "uuid", "p_year_month" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
declare
  v_period_start date;
  v_period_end date;
  v_prev_start date;
  v_prev_end date;
  v_range_start date;
  v_cat jsonb;
  v_budget jsonb;
  v_tx_month jsonb;
  v_tx_range jsonb;
  v_ws_month jsonb;
  v_prev_cat jsonb;
  v_plans jsonb;
  v_subs jsonb;
  v_ym date;
  v_ps text;
  v_pe text;
  v_prs text;
  v_pre text;
  v_rs text;
  y int;
  m int;
begin
  if not public.is_workspace_member(p_workspace_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  y := split_part(p_year_month, '-', 1)::int;
  m := split_part(p_year_month, '-', 2)::int;
  v_ym := make_date(y, m, 1);
  v_period_start := date_trunc('month', v_ym)::date;
  v_period_end := (date_trunc('month', v_ym) + interval '1 month - 1 day')::date;
  v_prev_end := (v_period_start - interval '1 day')::date;
  v_prev_start := date_trunc('month', v_prev_end)::date;
  v_range_start := (v_period_start - interval '11 months')::date;

  v_ps := to_char(v_period_start, 'YYYY-MM-DD');
  v_pe := to_char(v_period_end, 'YYYY-MM-DD');
  v_prs := to_char(v_prev_start, 'YYYY-MM-DD');
  v_pre := to_char(v_prev_end, 'YYYY-MM-DD');
  v_rs := to_char(v_range_start, 'YYYY-MM-DD');

  select to_jsonb(c) into v_cat
  from public.categories c
  where c.workspace_id = p_workspace_id and c.id = p_category_id;

  select to_jsonb(b) into v_budget
  from public.budgets b
  where b.workspace_id = p_workspace_id
    and b.user_id = (select auth.uid())
    and b.category_id = p_category_id
    and b.period_start = v_period_start
  limit 1;

  select coalesce(
    jsonb_agg(
      to_jsonb(t)
      || jsonb_build_object(
        'category', case when cat.id is null then null else to_jsonb(cat) end,
        'subscription', case when ws.id is null then null else to_jsonb(ws) end,
        'installment_plan', case when ip.id is null then null else to_jsonb(ip) end
      )
      order by t.date desc, t.created_at desc
    ),
    '[]'::jsonb
  )
  into v_tx_month
  from public.transactions t
  left join public.categories cat on cat.id = t.category_id
  left join public.workspace_subscriptions ws on ws.id = t.subscription_id
  left join public.workspace_installment_plans ip on ip.id = t.installment_plan_id
  where t.workspace_id = p_workspace_id
    and t.category_id = p_category_id
    and t.date >= (v_ps || 'T00:00:00.000Z')::timestamptz
    and t.date <= (v_pe || 'T23:59:59.999Z')::timestamptz;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'date', t.date,
        'amount', t.amount,
        'type', t.type,
        'category_id', t.category_id
      )
      order by t.date
    ),
    '[]'::jsonb
  )
  into v_tx_range
  from public.transactions t
  where t.workspace_id = p_workspace_id
    and t.category_id = p_category_id
    and t.date >= (v_rs || 'T00:00:00.000Z')::timestamptz
    and t.date <= (v_pe || 'T23:59:59.999Z')::timestamptz;

  select coalesce(
    jsonb_agg(jsonb_build_object('amount', t.amount, 'type', t.type)),
    '[]'::jsonb
  )
  into v_ws_month
  from public.transactions t
  where t.workspace_id = p_workspace_id
    and t.date >= (v_ps || 'T00:00:00.000Z')::timestamptz
    and t.date <= (v_pe || 'T23:59:59.999Z')::timestamptz;

  select coalesce(
    jsonb_agg(jsonb_build_object('amount', t.amount, 'type', t.type)),
    '[]'::jsonb
  )
  into v_prev_cat
  from public.transactions t
  where t.workspace_id = p_workspace_id
    and t.category_id = p_category_id
    and t.date >= (v_prs || 'T00:00:00.000Z')::timestamptz
    and t.date <= (v_pre || 'T23:59:59.999Z')::timestamptz;

  select coalesce(jsonb_agg(to_jsonb(p) order by p.next_billing_date), '[]'::jsonb)
  into v_plans
  from public.workspace_installment_plans p
  where p.workspace_id = p_workspace_id
    and p.category_id = p_category_id;

  select coalesce(jsonb_agg(to_jsonb(s) order by s.name), '[]'::jsonb)
  into v_subs
  from public.workspace_subscriptions s
  where s.workspace_id = p_workspace_id
    and s.category_id = p_category_id;

  return jsonb_build_object(
    'category', v_cat,
    'budget', v_budget,
    'txs_month', coalesce(v_tx_month, '[]'::jsonb),
    'series_rows', coalesce(v_tx_range, '[]'::jsonb),
    'workspace_month_rows', coalesce(v_ws_month, '[]'::jsonb),
    'prev_category_rows', coalesce(v_prev_cat, '[]'::jsonb),
    'installment_plans', coalesce(v_plans, '[]'::jsonb),
    'subscriptions', coalesce(v_subs, '[]'::jsonb)
  );
end;
$$;


ALTER FUNCTION "public"."rpc_fetch_category_detail_bundle"("p_workspace_id" "uuid", "p_category_id" "uuid", "p_year_month" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_fetch_subscriptions_page_bundle"("p_workspace_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
declare
  v_cats jsonb;
  v_cards jsonb;
  v_subs jsonb;
  v_stats jsonb;
begin
  if not public.is_workspace_member(p_workspace_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(to_jsonb(c) order by c.name), '[]'::jsonb)
  into v_cats
  from public.categories c
  where c.workspace_id = p_workspace_id;

  select coalesce(jsonb_agg(to_jsonb(cc) order by cc.name), '[]'::jsonb)
  into v_cards
  from public.credit_cards cc
  where cc.workspace_id = p_workspace_id;

  select coalesce(jsonb_agg(to_jsonb(s) order by s.name), '[]'::jsonb)
  into v_subs
  from public.workspace_subscriptions s
  where s.workspace_id = p_workspace_id;

  select coalesce(
    jsonb_object_agg(
      t.subscription_id::text,
      jsonb_build_object('count', t.cnt, 'lastDate', t.last_d)
    ),
    '{}'::jsonb
  )
  into v_stats
  from (
    select
      subscription_id,
      count(*)::int as cnt,
      max((date at time zone 'utc')::date)::text as last_d
    from public.transactions
    where workspace_id = p_workspace_id
      and subscription_id is not null
    group by subscription_id
  ) t;

  return jsonb_build_object(
    'categories', coalesce(v_cats, '[]'::jsonb),
    'credit_cards', coalesce(v_cards, '[]'::jsonb),
    'subscriptions', coalesce(v_subs, '[]'::jsonb),
    'billing_stats', coalesce(v_stats, '{}'::jsonb),
    'table_missing', false
  );
exception
  when undefined_table then
    return jsonb_build_object(
      'categories', '[]'::jsonb,
      'credit_cards', '[]'::jsonb,
      'subscriptions', '[]'::jsonb,
      'billing_stats', '{}'::jsonb,
      'table_missing', true
    );
end;
$$;


ALTER FUNCTION "public"."rpc_fetch_subscriptions_page_bundle"("p_workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."run_installment_billing"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  r record;
  v_step smallint;
  n int := 0;
begin
  for r in
    select p.id
    from public.workspace_installment_plans p
    where p.is_active = true
      and p.generated_count < p.total_installments
      and p.next_billing_date <= (timezone('UTC', now()))::date
  loop
    loop
      v_step := public.charge_workspace_installment_plan_step(r.id);
      exit when v_step = 0;
      if v_step = 1 then
        n := n + 1;
      end if;
    end loop;
  end loop;

  return n;
end;
$$;


ALTER FUNCTION "public"."run_installment_billing"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."run_subscription_billing"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  r public.workspace_subscriptions%rowtype;
  v_id uuid;
  v_today date;
  v_charge date;
  v_ts timestamptz;
  v_next date;
  v_rows int;
  n int := 0;
begin
  v_today := (timezone('UTC', now()))::date;

  for v_id in
    select ws.id
    from public.workspace_subscriptions ws
    where ws.is_active = true
      and (
        (ws.next_billing_date is not null and ws.next_billing_date <= v_today)
        or (
          ws.next_billing_date is null
          and ws.day_of_month is not null
          and extract(day from v_today)::smallint = ws.day_of_month
          and ws.start_date <= v_today
        )
      )
  loop
    -- Serialize against catch_up_recurring_billing; skip rows another
    -- writer is already charging.
    select * into r
    from public.workspace_subscriptions
    where id = v_id and is_active = true
    for update skip locked;

    if not found then
      continue;
    end if;

    if r.next_billing_date is not null and r.next_billing_date <= v_today then
      v_charge := r.next_billing_date;

      v_ts := (to_char(v_charge, 'YYYY-MM-DD') || 'T12:00:00Z')::timestamptz;
      insert into public.transactions (
        user_id, workspace_id, category_id, type, amount, description, date,
        is_recurring, recurring_interval, subscription_id,
        payment_method, payment_credit_card_id
      ) values (
        r.user_id, r.workspace_id, r.category_id, 'expense', r.amount, r.name, v_ts,
        false, null, r.id,
        r.payment_method, r.payment_credit_card_id
      )
      on conflict (subscription_id, ((date at time zone 'UTC')::date))
        where subscription_id is not null
        do nothing;
      get diagnostics v_rows = row_count;
      n := n + v_rows;

      v_next := case r.billing_interval
        when 'weekly' then (v_charge + interval '7 days')::date
        when 'monthly' then (v_charge + interval '1 month')::date
        when 'bimonthly' then (v_charge + interval '2 months')::date
        when 'yearly' then (v_charge + interval '1 year')::date
        else (v_charge + interval '1 month')::date
      end;

      update public.workspace_subscriptions
      set next_billing_date = v_next
      where id = r.id;

    elsif
      r.next_billing_date is null
      and r.day_of_month is not null
      and extract(day from v_today)::smallint = r.day_of_month
      and r.start_date <= v_today
    then
      v_charge := v_today;

      v_ts := (to_char(v_charge, 'YYYY-MM-DD') || 'T12:00:00Z')::timestamptz;
      insert into public.transactions (
        user_id, workspace_id, category_id, type, amount, description, date,
        is_recurring, recurring_interval, subscription_id,
        payment_method, payment_credit_card_id
      ) values (
        r.user_id, r.workspace_id, r.category_id, 'expense', r.amount, r.name, v_ts,
        false, null, r.id,
        r.payment_method, r.payment_credit_card_id
      )
      on conflict (subscription_id, ((date at time zone 'UTC')::date))
        where subscription_id is not null
        do nothing;
      get diagnostics v_rows = row_count;
      n := n + v_rows;

      v_next := (v_charge + interval '1 month')::date;
      update public.workspace_subscriptions
      set next_billing_date = v_next
      where id = r.id;
    end if;
  end loop;

  return n;
end;
$$;


ALTER FUNCTION "public"."run_subscription_billing"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."seed_subscription_first_transaction"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_charge date;
  v_ts timestamptz;
begin
  v_charge := coalesce(new.next_billing_date, new.start_date);

  if v_charge is null then
    return new;
  end if;

  v_ts := (to_char(v_charge, 'YYYY-MM-DD') || 'T12:00:00Z')::timestamptz;

  insert into public.transactions (
    user_id, workspace_id, category_id, type, amount, description, date,
    is_recurring, recurring_interval, subscription_id,
    payment_method, payment_credit_card_id
  ) values (
    new.user_id, new.workspace_id, new.category_id, 'expense', new.amount, new.name, v_ts,
    false, null, new.id,
    new.payment_method, new.payment_credit_card_id
  )
  on conflict (subscription_id, ((date at time zone 'UTC')::date))
    where subscription_id is not null
    do nothing;

  return new;
end;
$$;


ALTER FUNCTION "public"."seed_subscription_first_transaction"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_credit_card_category_spend_alert_workspace"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  w uuid;
  cat_ws uuid;
begin
  select cc.workspace_id into strict w
  from public.credit_cards cc
  where cc.id = new.credit_card_id;

  new.workspace_id := w;

  if new.category_id is not null then
    select c.workspace_id into cat_ws
    from public.categories c
    where c.id = new.category_id;

    if cat_ws is null or cat_ws is distinct from new.workspace_id then
      raise exception 'category not in card workspace';
    end if;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."set_credit_card_category_spend_alert_workspace"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."workspace_member_directory"("p_workspace_id" "uuid") RETURNS TABLE("user_id" "uuid", "email" "text", "full_name" "text", "avatar_url" "text", "avatar_color" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select p.id,
    coalesce(p.email, ''),
    coalesce(p.full_name, ''),
    p.avatar_url,
    coalesce(nullif(btrim(p.avatar_color), ''), 'bg-sky-500')
  from public.workspace_members wm
  join public.profiles p on p.id = wm.user_id
  where wm.workspace_id = p_workspace_id
    and public.is_workspace_member(p_workspace_id);
$$;


ALTER FUNCTION "public"."workspace_member_directory"("p_workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."workspace_role"("workspace_id" "uuid") RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select wm.role
  from public.workspace_members wm
  where wm.workspace_id = workspace_role.workspace_id
    and wm.user_id = (select auth.uid())
  limit 1;
$$;


ALTER FUNCTION "public"."workspace_role"("workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."workspaces_before_delete_guard_and_cleanup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if old.type = 'personal' then
    raise exception 'WORKSPACE_PERSONAL_IMMUTABLE'
      using errcode = 'P0001';
  end if;

  delete from public.transactions
  where workspace_id = old.id;

  delete from public.budgets
  where workspace_id = old.id;

  delete from public.categories
  where workspace_id = old.id;

  return old;
end;
$$;


ALTER FUNCTION "public"."workspaces_before_delete_guard_and_cleanup"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."bill_instances" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "bill_id" "uuid" NOT NULL,
    "due_date" "date" NOT NULL,
    "amount" numeric(15,2),
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "paid_at" timestamp with time zone,
    "paid_amount" numeric(15,2),
    "payment_method" "text",
    "payment_credit_card_id" "uuid",
    "transaction_id" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "client_id" "uuid",
    CONSTRAINT "bill_instances_credit_card_requires_method" CHECK ((("payment_credit_card_id" IS NULL) OR ("payment_method" = 'credit_card'::"text"))),
    CONSTRAINT "bill_instances_paid_amount_consistency" CHECK ((("paid_amount" IS NULL) OR ("status" = 'paid'::"text"))),
    CONSTRAINT "bill_instances_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'skipped'::"text"])))
);


ALTER TABLE "public"."bill_instances" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bill_notification_dedupe" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "bill_instance_id" "uuid" NOT NULL,
    "reminder_offset_days" integer NOT NULL,
    "user_id" "uuid" NOT NULL,
    "sent_on" "date" DEFAULT ("timezone"('utc'::"text", "now"()))::"date" NOT NULL
);


ALTER TABLE "public"."bill_notification_dedupe" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bills" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "notes" "text",
    "category_id" "uuid",
    "frequency" "text" DEFAULT 'monthly'::"text" NOT NULL,
    "due_day_of_month" smallint DEFAULT 10 NOT NULL,
    "amount_estimated" numeric(15,2),
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "default_payment_method" "text",
    "default_payment_credit_card_id" "uuid",
    "reminder_days_before" integer[] DEFAULT ARRAY[3, 0] NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "icon" "text",
    "client_id" "uuid",
    CONSTRAINT "bills_default_credit_card_requires_method" CHECK ((("default_payment_credit_card_id" IS NULL) OR ("default_payment_method" = 'credit_card'::"text"))),
    CONSTRAINT "bills_due_day_of_month_range" CHECK ((("due_day_of_month" >= 1) AND ("due_day_of_month" <= 31))),
    CONSTRAINT "bills_frequency_check" CHECK (("frequency" = ANY (ARRAY['monthly'::"text", 'bimonthly'::"text", 'quarterly'::"text", 'yearly'::"text", 'one_time'::"text"])))
);


ALTER TABLE "public"."bills" OWNER TO "postgres";


COMMENT ON COLUMN "public"."bills"."icon" IS 'Lucide-style icon id (same vocabulary as categories.icon); null = default in UI';



CREATE TABLE IF NOT EXISTS "public"."budgets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "amount" numeric NOT NULL,
    "threshold_80_sent_at" timestamp with time zone,
    "threshold_100_sent_at" timestamp with time zone,
    "threshold_over_sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "workspace_id" "uuid",
    "year" integer NOT NULL,
    "month" integer NOT NULL,
    "client_id" "uuid",
    CONSTRAINT "budgets_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "budgets_month_bounds_check" CHECK ((("month" >= 1) AND ("month" <= 12))),
    CONSTRAINT "budgets_period_check" CHECK (("period_end" >= "period_start")),
    CONSTRAINT "budgets_year_bounds_check" CHECK ((("year" >= 1900) AND ("year" <= 2200)))
);


ALTER TABLE "public"."budgets" OWNER TO "postgres";


COMMENT ON COLUMN "public"."budgets"."year" IS 'Year (e.g. 2026). Derived from period_start.';



COMMENT ON COLUMN "public"."budgets"."month" IS 'Month-of-year (1-12). Derived from period_start.';



CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "color" "text",
    "icon" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "workspace_id" "uuid",
    "client_id" "uuid",
    CONSTRAINT "categories_type_check" CHECK (("type" = ANY (ARRAY['income'::"text", 'expense'::"text"])))
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_card_category_spend_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "credit_card_id" "uuid" NOT NULL,
    "category_id" "uuid",
    "threshold_brl" numeric(15,2) NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "credit_card_category_spend_alerts_threshold_positive" CHECK (("threshold_brl" > (0)::numeric))
);


ALTER TABLE "public"."credit_card_category_spend_alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_card_invoice_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "credit_card_id" "uuid" NOT NULL,
    "statement_close_date" "date" NOT NULL,
    "status" "text" DEFAULT 'paid'::"text" NOT NULL,
    "paid_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "credit_card_invoice_payments_status_check" CHECK (("status" = 'paid'::"text"))
);


ALTER TABLE "public"."credit_card_invoice_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_card_notification_dedupe" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "credit_card_id" "uuid" NOT NULL,
    "dedupe_key" "text" NOT NULL,
    "sent_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."credit_card_notification_dedupe" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_cards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "last_four" "text" NOT NULL,
    "brand" "text",
    "closing_day" smallint NOT NULL,
    "due_day" smallint NOT NULL,
    "credit_limit" numeric(15,2),
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expiry_month" smallint,
    "expiry_year" smallint,
    "client_id" "uuid",
    CONSTRAINT "credit_cards_closing_day_range" CHECK ((("closing_day" >= 1) AND ("closing_day" <= 31))),
    CONSTRAINT "credit_cards_due_day_range" CHECK ((("due_day" >= 1) AND ("due_day" <= 31))),
    CONSTRAINT "credit_cards_expiry_both_or_neither" CHECK (((("expiry_month" IS NULL) AND ("expiry_year" IS NULL)) OR (("expiry_month" IS NOT NULL) AND ("expiry_year" IS NOT NULL)))),
    CONSTRAINT "credit_cards_expiry_month_range" CHECK ((("expiry_month" IS NULL) OR (("expiry_month" >= 1) AND ("expiry_month" <= 12)))),
    CONSTRAINT "credit_cards_expiry_year_range" CHECK ((("expiry_year" IS NULL) OR (("expiry_year" >= 2000) AND ("expiry_year" <= 2100)))),
    CONSTRAINT "credit_cards_last_four_digits" CHECK (("last_four" ~ '^[0-9]{4}$'::"text"))
);


ALTER TABLE "public"."credit_cards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['transaction'::"text", 'budget'::"text", 'system'::"text", 'promotion'::"text", 'credit_card'::"text", 'bill'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "avatar_color" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."avatar_color" IS 'Tailwind class from the app palette (e.g. bg-sky-500). Used for deterministic initials avatar background.';



CREATE TABLE IF NOT EXISTS "public"."push_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "endpoint" "text" NOT NULL,
    "p256dh" "text" NOT NULL,
    "auth" "text" NOT NULL,
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."push_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transaction_splits" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "transaction_id" "uuid" NOT NULL,
    "category_id" "uuid",
    "amount" numeric(15,2) NOT NULL,
    "percentage" numeric(5,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."transaction_splits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "category_id" "uuid",
    "type" "text" NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "description" "text",
    "date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_recurring" boolean DEFAULT false,
    "recurring_interval" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "workspace_id" "uuid",
    "payment_method" "text",
    "payment_credit_card_id" "uuid",
    "subscription_id" "uuid",
    "installment_plan_id" "uuid",
    "installment_sequence" smallint,
    "client_id" "uuid",
    CONSTRAINT "transactions_installment_plan_expense_only" CHECK ((("installment_plan_id" IS NULL) OR ("type" = 'expense'::"text"))),
    CONSTRAINT "transactions_payment_card_matches_method" CHECK ((("payment_credit_card_id" IS NULL) OR ("payment_method" = 'credit_card'::"text"))),
    CONSTRAINT "transactions_payment_method_check" CHECK ((("payment_method" IS NULL) OR ("payment_method" = ANY (ARRAY['pix'::"text", 'ted'::"text", 'debit_card'::"text", 'credit_card'::"text", 'cash'::"text", 'other'::"text"])))),
    CONSTRAINT "transactions_recurring_interval_check" CHECK (("recurring_interval" = ANY (ARRAY['daily'::"text", 'weekly'::"text", 'monthly'::"text"]))),
    CONSTRAINT "transactions_subscription_expense_only" CHECK ((("subscription_id" IS NULL) OR ("type" = 'expense'::"text"))),
    CONSTRAINT "transactions_subscription_installment_exclusive" CHECK ((("subscription_id" IS NULL) OR ("installment_plan_id" IS NULL))),
    CONSTRAINT "transactions_type_check" CHECK (("type" = ANY (ARRAY['income'::"text", 'expense'::"text"])))
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."transactions" IS 'Financial transactions. INSERT webhook notify-transaction-created alerts shared workspace members.';



COMMENT ON COLUMN "public"."transactions"."installment_sequence" IS '1-based index for installment-generated expense rows (compra parcelada).';



CREATE TABLE IF NOT EXISTS "public"."user_activity_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "description" "text" NOT NULL,
    "ip_address" "inet",
    "device" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "status" "text" DEFAULT 'success'::"text",
    "dedupe_key" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_activity_logs_status_check" CHECK (("status" = ANY (ARRAY['success'::"text", 'failed'::"text", 'pending'::"text"]))),
    CONSTRAINT "user_activity_logs_type_check" CHECK (("type" = ANY (ARRAY['family_member_invited'::"text", 'family_member_joined'::"text", 'family_member_removed'::"text", 'family_permission_changed'::"text", 'family_role_changed'::"text", 'password_change'::"text", 'profile_update'::"text", 'security_settings'::"text", 'device_added'::"text", 'device_removed'::"text"])))
);


ALTER TABLE "public"."user_activity_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "device_type" "text",
    "device_name" "text",
    "browser" "text",
    "os" "text",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_active_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true,
    "token_hash" "text",
    "device_id" "text",
    "device_fingerprint" "text",
    "auth_session_id" "text",
    CONSTRAINT "user_sessions_device_type_check" CHECK (("device_type" = ANY (ARRAY['desktop'::"text", 'mobile'::"text", 'tablet'::"text"])))
);


ALTER TABLE "public"."user_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_settings" (
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "current_workspace_id" "uuid"
);


ALTER TABLE "public"."user_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspace_installment_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "category_id" "uuid",
    "description" "text",
    "payment_method" "text",
    "payment_credit_card_id" "uuid",
    "total_installments" integer NOT NULL,
    "generated_count" integer DEFAULT 0 NOT NULL,
    "installment_amount" numeric(15,2) NOT NULL,
    "final_installment_amount" numeric(15,2) NOT NULL,
    "next_billing_date" "date" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "workspace_installment_plans_final_amount_positive" CHECK (("final_installment_amount" > (0)::numeric)),
    CONSTRAINT "workspace_installment_plans_generated_count_check" CHECK ((("generated_count" >= 0) AND ("generated_count" <= "total_installments"))),
    CONSTRAINT "workspace_installment_plans_installment_amount_positive" CHECK (("installment_amount" > (0)::numeric)),
    CONSTRAINT "workspace_installment_plans_payment_card_matches" CHECK ((("payment_credit_card_id" IS NULL) OR ("payment_method" = 'credit_card'::"text"))),
    CONSTRAINT "workspace_installment_plans_payment_method_check" CHECK ((("payment_method" IS NULL) OR ("payment_method" = ANY (ARRAY['pix'::"text", 'ted'::"text", 'debit_card'::"text", 'credit_card'::"text", 'cash'::"text", 'other'::"text"])))),
    CONSTRAINT "workspace_installment_plans_total_installments_check" CHECK (("total_installments" >= 2))
);


ALTER TABLE "public"."workspace_installment_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspace_invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "invited_email" "text",
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "token_hash" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "accepted_at" timestamp with time zone,
    "usage_count" integer DEFAULT 0 NOT NULL,
    "max_uses" integer,
    "token_raw" "text",
    CONSTRAINT "workspace_invites_email_max_uses_chk" CHECK (((("invited_email" IS NOT NULL) AND ("max_uses" = 1)) OR ("invited_email" IS NULL))),
    CONSTRAINT "workspace_invites_role_check" CHECK (("role" = 'member'::"text")),
    CONSTRAINT "workspace_invites_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'revoked'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."workspace_invites" OWNER TO "postgres";


COMMENT ON COLUMN "public"."workspace_invites"."token_raw" IS 'Plain invite token for building /invites/accept URL. Hash remains canonical for verification. Visible only via RLS to workspace owners and the invited_email user while pending.';



CREATE TABLE IF NOT EXISTS "public"."workspace_member_notification_prefs" (
    "workspace_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "notify_email" boolean DEFAULT true NOT NULL,
    "notify_in_app" boolean DEFAULT true NOT NULL,
    "notify_transactions" boolean DEFAULT true NOT NULL,
    "notify_budget" boolean DEFAULT true NOT NULL,
    "notify_promotions" boolean DEFAULT false NOT NULL,
    "notify_credit_cards" boolean DEFAULT true NOT NULL,
    "notify_credit_card_calendar" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notify_bills" boolean DEFAULT true NOT NULL,
    "notify_push" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."workspace_member_notification_prefs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."workspace_member_notification_prefs"."notify_credit_card_calendar" IS 'Invoice close / payment due reminders (scheduled); separate from spend/limit alerts.';



COMMENT ON COLUMN "public"."workspace_member_notification_prefs"."notify_bills" IS 'Reminders for Contas a Pagar (due soon / due today).';



CREATE TABLE IF NOT EXISTS "public"."workspace_members" (
    "workspace_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "workspace_members_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'member'::"text"])))
);


ALTER TABLE "public"."workspace_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspace_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "billing_interval" "text" NOT NULL,
    "currency" "text" DEFAULT 'BRL'::"text" NOT NULL,
    "start_date" "date" NOT NULL,
    "next_billing_date" "date",
    "day_of_month" smallint,
    "category_id" "uuid",
    "notes" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "payment_method" "text",
    "payment_credit_card_id" "uuid",
    "client_id" "uuid",
    CONSTRAINT "workspace_subscriptions_billing_interval_check" CHECK (("billing_interval" = ANY (ARRAY['weekly'::"text", 'monthly'::"text", 'bimonthly'::"text", 'yearly'::"text"]))),
    CONSTRAINT "workspace_subscriptions_day_of_month_range" CHECK ((("day_of_month" IS NULL) OR (("day_of_month" >= 1) AND ("day_of_month" <= 31)))),
    CONSTRAINT "workspace_subscriptions_payment_card_matches" CHECK ((("payment_credit_card_id" IS NULL) OR ("payment_method" = 'credit_card'::"text"))),
    CONSTRAINT "workspace_subscriptions_payment_method_check" CHECK ((("payment_method" IS NULL) OR ("payment_method" = ANY (ARRAY['pix'::"text", 'ted'::"text", 'debit_card'::"text", 'credit_card'::"text", 'cash'::"text", 'other'::"text"]))))
);


ALTER TABLE "public"."workspace_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspaces" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" DEFAULT 'personal'::"text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "icon" "text" DEFAULT 'home'::"text" NOT NULL,
    "icon_background_color" "text" DEFAULT '#2563EB'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "categories_onboarding_completed_at" timestamp with time zone,
    CONSTRAINT "workspaces_icon_allowed" CHECK (("icon" = ANY (ARRAY['briefcase'::"text", 'home'::"text", 'users'::"text", 'plane'::"text", 'heart'::"text", 'shopping-cart'::"text", 'wallet'::"text", 'building-2'::"text", 'laptop'::"text", 'trending-up'::"text", 'gift'::"text", 'sparkles'::"text", 'target'::"text", 'zap'::"text", 'coffee'::"text", 'music'::"text", 'camera'::"text", 'dumbbell'::"text", 'book-open'::"text", 'globe'::"text"]))),
    CONSTRAINT "workspaces_type_check" CHECK (("type" = ANY (ARRAY['personal'::"text", 'shared'::"text"])))
);


ALTER TABLE "public"."workspaces" OWNER TO "postgres";


COMMENT ON COLUMN "public"."workspaces"."categories_onboarding_completed_at" IS 'When set, the categories/budgets onboarding wizard is skipped for this workspace.';



ALTER TABLE ONLY "public"."bill_instances"
    ADD CONSTRAINT "bill_instances_client_id_key" UNIQUE ("client_id");



ALTER TABLE ONLY "public"."bill_instances"
    ADD CONSTRAINT "bill_instances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bill_instances"
    ADD CONSTRAINT "bill_instances_unique_cycle" UNIQUE ("bill_id", "due_date");



ALTER TABLE ONLY "public"."bill_notification_dedupe"
    ADD CONSTRAINT "bill_notification_dedupe_bill_instance_id_reminder_offset_d_key" UNIQUE ("bill_instance_id", "reminder_offset_days", "user_id", "sent_on");



ALTER TABLE ONLY "public"."bill_notification_dedupe"
    ADD CONSTRAINT "bill_notification_dedupe_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bills"
    ADD CONSTRAINT "bills_client_id_key" UNIQUE ("client_id");



ALTER TABLE ONLY "public"."bills"
    ADD CONSTRAINT "bills_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."budgets"
    ADD CONSTRAINT "budgets_client_id_key" UNIQUE ("client_id");



ALTER TABLE ONLY "public"."budgets"
    ADD CONSTRAINT "budgets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_client_id_key" UNIQUE ("client_id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_card_category_spend_alerts"
    ADD CONSTRAINT "credit_card_category_spend_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_card_invoice_payments"
    ADD CONSTRAINT "credit_card_invoice_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_card_invoice_payments"
    ADD CONSTRAINT "credit_card_invoice_payments_unique_cycle" UNIQUE ("workspace_id", "credit_card_id", "statement_close_date");



ALTER TABLE ONLY "public"."credit_card_notification_dedupe"
    ADD CONSTRAINT "credit_card_notification_dedupe_credit_card_id_dedupe_key_key" UNIQUE ("credit_card_id", "dedupe_key");



ALTER TABLE ONLY "public"."credit_card_notification_dedupe"
    ADD CONSTRAINT "credit_card_notification_dedupe_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_cards"
    ADD CONSTRAINT "credit_cards_client_id_key" UNIQUE ("client_id");



ALTER TABLE ONLY "public"."credit_cards"
    ADD CONSTRAINT "credit_cards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_user_id_endpoint_key" UNIQUE ("user_id", "endpoint");



ALTER TABLE ONLY "public"."transaction_splits"
    ADD CONSTRAINT "transaction_splits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_client_id_key" UNIQUE ("client_id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_activity_logs"
    ADD CONSTRAINT "user_activity_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."workspace_installment_plans"
    ADD CONSTRAINT "workspace_installment_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workspace_invites"
    ADD CONSTRAINT "workspace_invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workspace_invites"
    ADD CONSTRAINT "workspace_invites_token_hash_key" UNIQUE ("token_hash");



ALTER TABLE ONLY "public"."workspace_member_notification_prefs"
    ADD CONSTRAINT "workspace_member_notification_prefs_pkey" PRIMARY KEY ("workspace_id", "user_id");



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("workspace_id", "user_id");



ALTER TABLE ONLY "public"."workspace_subscriptions"
    ADD CONSTRAINT "workspace_subscriptions_client_id_key" UNIQUE ("client_id");



ALTER TABLE ONLY "public"."workspace_subscriptions"
    ADD CONSTRAINT "workspace_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id");



CREATE INDEX "categories_client_id_idx" ON "public"."categories" USING "btree" ("client_id") WHERE ("client_id" IS NOT NULL);



CREATE UNIQUE INDEX "credit_card_category_spend_alerts_card_category_unique" ON "public"."credit_card_category_spend_alerts" USING "btree" ("credit_card_id", "category_id") WHERE ("category_id" IS NOT NULL);



CREATE UNIQUE INDEX "credit_card_category_spend_alerts_card_uncategorized_unique" ON "public"."credit_card_category_spend_alerts" USING "btree" ("credit_card_id") WHERE ("category_id" IS NULL);



CREATE INDEX "idx_activity_dedupe" ON "public"."user_activity_logs" USING "btree" ("user_id", "type", "dedupe_key");



CREATE INDEX "idx_activity_logs_created_at" ON "public"."user_activity_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_activity_logs_type" ON "public"."user_activity_logs" USING "btree" ("type");



CREATE INDEX "idx_activity_logs_user_id" ON "public"."user_activity_logs" USING "btree" ("user_id");



CREATE INDEX "idx_bill_instances_workspace_status_due" ON "public"."bill_instances" USING "btree" ("workspace_id", "status", "due_date");



CREATE INDEX "idx_bill_notification_dedupe_workspace" ON "public"."bill_notification_dedupe" USING "btree" ("workspace_id");



CREATE INDEX "idx_bills_workspace_active" ON "public"."bills" USING "btree" ("workspace_id", "is_active");



CREATE UNIQUE INDEX "idx_budgets_user_category_period" ON "public"."budgets" USING "btree" ("user_id", "category_id", "period_start");



CREATE INDEX "idx_budgets_user_period" ON "public"."budgets" USING "btree" ("user_id", "period_start", "period_end");



CREATE INDEX "idx_budgets_workspace_id" ON "public"."budgets" USING "btree" ("workspace_id");



CREATE INDEX "idx_categories_user_id" ON "public"."categories" USING "btree" ("user_id");



CREATE INDEX "idx_categories_workspace_id" ON "public"."categories" USING "btree" ("workspace_id");



CREATE INDEX "idx_cc_category_spend_alerts_credit_card_id" ON "public"."credit_card_category_spend_alerts" USING "btree" ("credit_card_id");



CREATE INDEX "idx_cc_category_spend_alerts_workspace_id" ON "public"."credit_card_category_spend_alerts" USING "btree" ("workspace_id");



CREATE INDEX "idx_cc_notif_dedupe_workspace" ON "public"."credit_card_notification_dedupe" USING "btree" ("workspace_id");



CREATE INDEX "idx_credit_card_invoice_payments_card_close" ON "public"."credit_card_invoice_payments" USING "btree" ("credit_card_id", "statement_close_date" DESC);



CREATE INDEX "idx_credit_card_invoice_payments_card_workspace" ON "public"."credit_card_invoice_payments" USING "btree" ("credit_card_id", "workspace_id");



CREATE INDEX "idx_credit_cards_workspace_id" ON "public"."credit_cards" USING "btree" ("workspace_id");



CREATE INDEX "idx_notifications_user_created_at" ON "public"."notifications" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_notifications_user_read_at" ON "public"."notifications" USING "btree" ("user_id", "read_at");



CREATE INDEX "idx_notifications_workspace_user_created" ON "public"."notifications" USING "btree" ("workspace_id", "user_id", "created_at" DESC);



CREATE INDEX "idx_notifications_workspace_user_unread" ON "public"."notifications" USING "btree" ("workspace_id", "user_id") WHERE ("read_at" IS NULL);



CREATE INDEX "idx_sessions_device_id" ON "public"."user_sessions" USING "btree" ("user_id", "device_id");



CREATE INDEX "idx_sessions_fingerprint" ON "public"."user_sessions" USING "btree" ("user_id", "device_fingerprint");



CREATE INDEX "idx_transaction_splits_transaction_id" ON "public"."transaction_splits" USING "btree" ("transaction_id");



CREATE INDEX "idx_transactions_date" ON "public"."transactions" USING "btree" ("date");



CREATE INDEX "idx_transactions_installment_plan_id" ON "public"."transactions" USING "btree" ("installment_plan_id") WHERE ("installment_plan_id" IS NOT NULL);



CREATE INDEX "idx_transactions_subscription_id" ON "public"."transactions" USING "btree" ("subscription_id") WHERE ("subscription_id" IS NOT NULL);



CREATE INDEX "idx_transactions_user_id" ON "public"."transactions" USING "btree" ("user_id");



CREATE INDEX "idx_transactions_workspace_category_date" ON "public"."transactions" USING "btree" ("workspace_id", "category_id", "date" DESC) WHERE ("category_id" IS NOT NULL);



CREATE INDEX "idx_transactions_workspace_cc_date" ON "public"."transactions" USING "btree" ("workspace_id", "payment_credit_card_id", "date" DESC) WHERE ("payment_method" = 'credit_card'::"text");



CREATE INDEX "idx_transactions_workspace_date_desc" ON "public"."transactions" USING "btree" ("workspace_id", "date" DESC, "created_at" DESC);



CREATE INDEX "idx_transactions_workspace_id" ON "public"."transactions" USING "btree" ("workspace_id");



CREATE INDEX "idx_transactions_workspace_subscription" ON "public"."transactions" USING "btree" ("workspace_id", "subscription_id") WHERE ("subscription_id" IS NOT NULL);



CREATE INDEX "idx_transactions_workspace_subscription_date" ON "public"."transactions" USING "btree" ("workspace_id", "subscription_id", "date" DESC) WHERE ("subscription_id" IS NOT NULL);



CREATE INDEX "idx_user_sessions_auth_session" ON "public"."user_sessions" USING "btree" ("user_id", "auth_session_id");



CREATE INDEX "idx_user_sessions_is_active" ON "public"."user_sessions" USING "btree" ("user_id", "is_active");



CREATE INDEX "idx_user_sessions_token_hash" ON "public"."user_sessions" USING "btree" ("token_hash");



CREATE INDEX "idx_user_sessions_user_id" ON "public"."user_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_user_settings_current_workspace" ON "public"."user_settings" USING "btree" ("current_workspace_id");



CREATE INDEX "idx_workspace_installment_plans_next_billing" ON "public"."workspace_installment_plans" USING "btree" ("next_billing_date") WHERE ("is_active" = true);



CREATE INDEX "idx_workspace_installment_plans_workspace_id" ON "public"."workspace_installment_plans" USING "btree" ("workspace_id");



CREATE INDEX "idx_workspace_invites_created_by" ON "public"."workspace_invites" USING "btree" ("created_by", "created_at" DESC);



CREATE INDEX "idx_workspace_invites_invited_email" ON "public"."workspace_invites" USING "btree" ("invited_email");



CREATE INDEX "idx_workspace_invites_workspace_status" ON "public"."workspace_invites" USING "btree" ("workspace_id", "status", "created_at" DESC);



CREATE INDEX "idx_workspace_member_notification_prefs_user" ON "public"."workspace_member_notification_prefs" USING "btree" ("user_id");



CREATE INDEX "idx_workspace_members_user" ON "public"."workspace_members" USING "btree" ("user_id");



CREATE INDEX "idx_workspace_members_workspace" ON "public"."workspace_members" USING "btree" ("workspace_id");



CREATE INDEX "idx_workspace_subscriptions_active_next_billing" ON "public"."workspace_subscriptions" USING "btree" ("next_billing_date") WHERE ("is_active" = true);



CREATE INDEX "idx_workspace_subscriptions_workspace_id" ON "public"."workspace_subscriptions" USING "btree" ("workspace_id");



CREATE INDEX "idx_workspaces_created_by" ON "public"."workspaces" USING "btree" ("created_by");



CREATE UNIQUE INDEX "idx_workspaces_one_personal_per_creator" ON "public"."workspaces" USING "btree" ("created_by") WHERE ("type" = 'personal'::"text");



CREATE INDEX "idx_workspaces_type" ON "public"."workspaces" USING "btree" ("type");



CREATE INDEX "push_subscriptions_user_id_idx" ON "public"."push_subscriptions" USING "btree" ("user_id");



CREATE INDEX "transactions_client_id_idx" ON "public"."transactions" USING "btree" ("client_id") WHERE ("client_id" IS NOT NULL);



CREATE UNIQUE INDEX "transactions_installment_seq_unique" ON "public"."transactions" USING "btree" ("installment_plan_id", "installment_sequence") WHERE (("installment_plan_id" IS NOT NULL) AND ("installment_sequence" IS NOT NULL));



CREATE UNIQUE INDEX "transactions_subscription_charge_unique" ON "public"."transactions" USING "btree" ("subscription_id", ((("date" AT TIME ZONE 'UTC'::"text"))::"date")) WHERE ("subscription_id" IS NOT NULL);



CREATE OR REPLACE TRIGGER "seed_workspace_subscription_first_transaction" AFTER INSERT ON "public"."workspace_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."seed_subscription_first_transaction"();



CREATE OR REPLACE TRIGGER "set_bill_instances_updated_at" BEFORE UPDATE ON "public"."bill_instances" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_bills_updated_at" BEFORE UPDATE ON "public"."bills" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_budgets_updated_at" BEFORE UPDATE ON "public"."budgets" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_credit_card_category_spend_alerts_updated_at" BEFORE UPDATE ON "public"."credit_card_category_spend_alerts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_credit_card_invoice_payments_updated_at" BEFORE UPDATE ON "public"."credit_card_invoice_payments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_credit_cards_updated_at" BEFORE UPDATE ON "public"."credit_cards" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_user_settings_updated_at" BEFORE UPDATE ON "public"."user_settings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_workspace_installment_plans_updated_at" BEFORE UPDATE ON "public"."workspace_installment_plans" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_workspace_member_notification_prefs_updated_at" BEFORE UPDATE ON "public"."workspace_member_notification_prefs" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_workspace_subscriptions_updated_at" BEFORE UPDATE ON "public"."workspace_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_workspaces_updated_at" BEFORE UPDATE ON "public"."workspaces" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_cc_category_spend_alerts_workspace" BEFORE INSERT OR UPDATE ON "public"."credit_card_category_spend_alerts" FOR EACH ROW EXECUTE FUNCTION "public"."set_credit_card_category_spend_alert_workspace"();



CREATE OR REPLACE TRIGGER "trg_workspace_members_notification_prefs" AFTER INSERT ON "public"."workspace_members" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_workspace_member_notification_prefs"();



CREATE OR REPLACE TRIGGER "workspaces_before_delete_guard" BEFORE DELETE ON "public"."workspaces" FOR EACH ROW EXECUTE FUNCTION "public"."workspaces_before_delete_guard_and_cleanup"();



ALTER TABLE ONLY "public"."bill_instances"
    ADD CONSTRAINT "bill_instances_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bill_instances"
    ADD CONSTRAINT "bill_instances_payment_credit_card_id_fkey" FOREIGN KEY ("payment_credit_card_id") REFERENCES "public"."credit_cards"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bill_instances"
    ADD CONSTRAINT "bill_instances_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bill_instances"
    ADD CONSTRAINT "bill_instances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bill_instances"
    ADD CONSTRAINT "bill_instances_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bill_notification_dedupe"
    ADD CONSTRAINT "bill_notification_dedupe_bill_instance_id_fkey" FOREIGN KEY ("bill_instance_id") REFERENCES "public"."bill_instances"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bill_notification_dedupe"
    ADD CONSTRAINT "bill_notification_dedupe_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bill_notification_dedupe"
    ADD CONSTRAINT "bill_notification_dedupe_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bills"
    ADD CONSTRAINT "bills_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bills"
    ADD CONSTRAINT "bills_default_payment_credit_card_id_fkey" FOREIGN KEY ("default_payment_credit_card_id") REFERENCES "public"."credit_cards"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bills"
    ADD CONSTRAINT "bills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bills"
    ADD CONSTRAINT "bills_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budgets"
    ADD CONSTRAINT "budgets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budgets"
    ADD CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budgets"
    ADD CONSTRAINT "budgets_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."credit_card_category_spend_alerts"
    ADD CONSTRAINT "credit_card_category_spend_alerts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_card_category_spend_alerts"
    ADD CONSTRAINT "credit_card_category_spend_alerts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_card_category_spend_alerts"
    ADD CONSTRAINT "credit_card_category_spend_alerts_credit_card_id_fkey" FOREIGN KEY ("credit_card_id") REFERENCES "public"."credit_cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_card_category_spend_alerts"
    ADD CONSTRAINT "credit_card_category_spend_alerts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_card_invoice_payments"
    ADD CONSTRAINT "credit_card_invoice_payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_card_invoice_payments"
    ADD CONSTRAINT "credit_card_invoice_payments_credit_card_id_fkey" FOREIGN KEY ("credit_card_id") REFERENCES "public"."credit_cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_card_invoice_payments"
    ADD CONSTRAINT "credit_card_invoice_payments_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_card_notification_dedupe"
    ADD CONSTRAINT "credit_card_notification_dedupe_credit_card_id_fkey" FOREIGN KEY ("credit_card_id") REFERENCES "public"."credit_cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_card_notification_dedupe"
    ADD CONSTRAINT "credit_card_notification_dedupe_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_cards"
    ADD CONSTRAINT "credit_cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_cards"
    ADD CONSTRAINT "credit_cards_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transaction_splits"
    ADD CONSTRAINT "transaction_splits_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transaction_splits"
    ADD CONSTRAINT "transaction_splits_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_installment_plan_id_fkey" FOREIGN KEY ("installment_plan_id") REFERENCES "public"."workspace_installment_plans"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_payment_credit_card_id_fkey" FOREIGN KEY ("payment_credit_card_id") REFERENCES "public"."credit_cards"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."workspace_subscriptions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_activity_logs"
    ADD CONSTRAINT "user_activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_current_workspace_id_fkey" FOREIGN KEY ("current_workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_installment_plans"
    ADD CONSTRAINT "workspace_installment_plans_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workspace_installment_plans"
    ADD CONSTRAINT "workspace_installment_plans_payment_credit_card_id_fkey" FOREIGN KEY ("payment_credit_card_id") REFERENCES "public"."credit_cards"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workspace_installment_plans"
    ADD CONSTRAINT "workspace_installment_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_installment_plans"
    ADD CONSTRAINT "workspace_installment_plans_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_invites"
    ADD CONSTRAINT "workspace_invites_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_invites"
    ADD CONSTRAINT "workspace_invites_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_member_notification_prefs"
    ADD CONSTRAINT "workspace_member_notification_prefs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_member_notification_prefs"
    ADD CONSTRAINT "workspace_member_notification_prefs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_subscriptions"
    ADD CONSTRAINT "workspace_subscriptions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workspace_subscriptions"
    ADD CONSTRAINT "workspace_subscriptions_payment_credit_card_id_fkey" FOREIGN KEY ("payment_credit_card_id") REFERENCES "public"."credit_cards"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workspace_subscriptions"
    ADD CONSTRAINT "workspace_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_subscriptions"
    ADD CONSTRAINT "workspace_subscriptions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Invitees can view own pending email invites" ON "public"."workspace_invites" FOR SELECT USING ((("status" = 'pending'::"text") AND ("expires_at" > "now"()) AND ("invited_email" IS NOT NULL) AND ("lower"(TRIM(BOTH FROM COALESCE("invited_email", ''::"text"))) = "lower"(TRIM(BOTH FROM COALESCE(("auth"."jwt"() ->> 'email'::"text"), ''::"text"))))));



CREATE POLICY "Members can insert own workspace notification prefs" ON "public"."workspace_member_notification_prefs" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND "public"."is_workspace_member"("workspace_id")));



CREATE POLICY "Members can leave workspace" ON "public"."workspace_members" FOR DELETE USING ((("auth"."uid"() = "user_id") AND ("public"."workspace_role"("workspace_id") = 'member'::"text")));



CREATE POLICY "Members can update own workspace notification prefs" ON "public"."workspace_member_notification_prefs" FOR UPDATE USING ((("auth"."uid"() = "user_id") AND "public"."is_workspace_member"("workspace_id")));



CREATE POLICY "Members can view own workspace notification prefs" ON "public"."workspace_member_notification_prefs" FOR SELECT USING ((("auth"."uid"() = "user_id") AND "public"."is_workspace_member"("workspace_id")));



CREATE POLICY "Owners can add members" ON "public"."workspace_members" FOR INSERT WITH CHECK (("public"."is_workspace_owner"("workspace_id") OR ((EXISTS ( SELECT 1
   FROM "public"."workspaces" "w"
  WHERE (("w"."id" = "workspace_members"."workspace_id") AND ("w"."created_by" = "auth"."uid"())))) AND ("user_id" = "auth"."uid"()) AND ("role" = 'owner'::"text"))));



CREATE POLICY "Owners can create invites" ON "public"."workspace_invites" FOR INSERT WITH CHECK (("public"."is_workspace_owner"("workspace_id") AND ("auth"."uid"() = "created_by")));



CREATE POLICY "Owners can delete workspace" ON "public"."workspaces" FOR DELETE USING (("public"."is_workspace_owner"("id") AND ("type" <> 'personal'::"text")));



CREATE POLICY "Owners can remove members" ON "public"."workspace_members" FOR DELETE USING ("public"."is_workspace_owner"("workspace_id"));



CREATE POLICY "Owners can update invites" ON "public"."workspace_invites" FOR UPDATE USING ("public"."is_workspace_owner"("workspace_id"));



CREATE POLICY "Owners can update member roles" ON "public"."workspace_members" FOR UPDATE USING ("public"."is_workspace_owner"("workspace_id"));



CREATE POLICY "Owners can update workspace" ON "public"."workspaces" FOR UPDATE USING ("public"."is_workspace_owner"("id"));



CREATE POLICY "Owners can view invites" ON "public"."workspace_invites" FOR SELECT USING ("public"."is_workspace_owner"("workspace_id"));



CREATE POLICY "Users can create workspaces" ON "public"."workspaces" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can delete own activities" ON "public"."user_activity_logs" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete own sessions" ON "public"."user_sessions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own activities" ON "public"."user_activity_logs" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert own sessions" ON "public"."user_sessions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own settings" ON "public"."user_settings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own sessions" ON "public"."user_sessions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own settings" ON "public"."user_settings" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view members of own workspaces" ON "public"."workspace_members" FOR SELECT USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Users can view own activities" ON "public"."user_activity_logs" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own sessions" ON "public"."user_sessions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own settings" ON "public"."user_settings" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own workspaces" ON "public"."workspaces" FOR SELECT USING (("public"."is_workspace_member"("id") OR ("created_by" = "auth"."uid"())));



CREATE POLICY "Workspace members can delete bill_instances" ON "public"."bill_instances" FOR DELETE USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Workspace members can delete bills" ON "public"."bills" FOR DELETE USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Workspace members can delete budgets" ON "public"."budgets" FOR DELETE USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Workspace members can delete categories" ON "public"."categories" FOR DELETE USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Workspace members can delete credit cards" ON "public"."credit_cards" FOR DELETE USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Workspace members can delete credit_card_category_spend_alerts" ON "public"."credit_card_category_spend_alerts" FOR DELETE USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Workspace members can delete credit_card_invoice_payments" ON "public"."credit_card_invoice_payments" FOR DELETE USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Workspace members can delete own notifications" ON "public"."notifications" FOR DELETE USING ((("auth"."uid"() = "user_id") AND "public"."is_workspace_member"("workspace_id")));



CREATE POLICY "Workspace members can delete splits" ON "public"."transaction_splits" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."transactions" "t"
  WHERE (("t"."id" = "transaction_splits"."transaction_id") AND "public"."is_workspace_member"("t"."workspace_id")))));



CREATE POLICY "Workspace members can delete transactions" ON "public"."transactions" FOR DELETE USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Workspace members can delete workspace_installment_plans" ON "public"."workspace_installment_plans" FOR DELETE USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Workspace members can delete workspace_subscriptions" ON "public"."workspace_subscriptions" FOR DELETE USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Workspace members can insert bill_instances" ON "public"."bill_instances" FOR INSERT WITH CHECK (("public"."is_workspace_member"("workspace_id") AND ("auth"."uid"() = "user_id")));



CREATE POLICY "Workspace members can insert bills" ON "public"."bills" FOR INSERT WITH CHECK (("public"."is_workspace_member"("workspace_id") AND ("auth"."uid"() = "user_id")));



CREATE POLICY "Workspace members can insert budgets" ON "public"."budgets" FOR INSERT WITH CHECK ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Workspace members can insert categories" ON "public"."categories" FOR INSERT WITH CHECK ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Workspace members can insert credit cards" ON "public"."credit_cards" FOR INSERT WITH CHECK (("public"."is_workspace_member"("workspace_id") AND ("auth"."uid"() = "user_id")));



CREATE POLICY "Workspace members can insert credit_card_category_spend_alerts" ON "public"."credit_card_category_spend_alerts" FOR INSERT WITH CHECK (("public"."is_workspace_member"("workspace_id") AND ("auth"."uid"() = "created_by")));



CREATE POLICY "Workspace members can insert credit_card_invoice_payments" ON "public"."credit_card_invoice_payments" FOR INSERT WITH CHECK (("public"."is_workspace_member"("workspace_id") AND ("auth"."uid"() = "created_by")));



CREATE POLICY "Workspace members can insert splits" ON "public"."transaction_splits" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."transactions" "t"
  WHERE (("t"."id" = "transaction_splits"."transaction_id") AND "public"."is_workspace_member"("t"."workspace_id")))));



CREATE POLICY "Workspace members can insert transactions" ON "public"."transactions" FOR INSERT WITH CHECK ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Workspace members can insert workspace_installment_plans" ON "public"."workspace_installment_plans" FOR INSERT WITH CHECK (("public"."is_workspace_member"("workspace_id") AND ("auth"."uid"() = "user_id")));



CREATE POLICY "Workspace members can insert workspace_subscriptions" ON "public"."workspace_subscriptions" FOR INSERT WITH CHECK (("public"."is_workspace_member"("workspace_id") AND ("auth"."uid"() = "user_id")));



CREATE POLICY "Workspace members can update bill_instances" ON "public"."bill_instances" FOR UPDATE USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Workspace members can update bills" ON "public"."bills" FOR UPDATE USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Workspace members can update budgets" ON "public"."budgets" FOR UPDATE USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Workspace members can update categories" ON "public"."categories" FOR UPDATE USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Workspace members can update credit cards" ON "public"."credit_cards" FOR UPDATE USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Workspace members can update credit_card_category_spend_alerts" ON "public"."credit_card_category_spend_alerts" FOR UPDATE USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Workspace members can update credit_card_invoice_payments" ON "public"."credit_card_invoice_payments" FOR UPDATE USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Workspace members can update own notifications" ON "public"."notifications" FOR UPDATE USING ((("auth"."uid"() = "user_id") AND "public"."is_workspace_member"("workspace_id")));



CREATE POLICY "Workspace members can update splits" ON "public"."transaction_splits" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."transactions" "t"
  WHERE (("t"."id" = "transaction_splits"."transaction_id") AND "public"."is_workspace_member"("t"."workspace_id")))));



CREATE POLICY "Workspace members can update transactions" ON "public"."transactions" FOR UPDATE USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Workspace members can update workspace_installment_plans" ON "public"."workspace_installment_plans" FOR UPDATE USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Workspace members can update workspace_subscriptions" ON "public"."workspace_subscriptions" FOR UPDATE USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Workspace members can view bill_instances" ON "public"."bill_instances" FOR SELECT USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Workspace members can view bills" ON "public"."bills" FOR SELECT USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Workspace members can view budgets" ON "public"."budgets" FOR SELECT USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Workspace members can view categories" ON "public"."categories" FOR SELECT USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Workspace members can view credit cards" ON "public"."credit_cards" FOR SELECT USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Workspace members can view credit_card_category_spend_alerts" ON "public"."credit_card_category_spend_alerts" FOR SELECT USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Workspace members can view credit_card_invoice_payments" ON "public"."credit_card_invoice_payments" FOR SELECT USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Workspace members can view own notifications" ON "public"."notifications" FOR SELECT USING ((("auth"."uid"() = "user_id") AND "public"."is_workspace_member"("workspace_id")));



CREATE POLICY "Workspace members can view splits" ON "public"."transaction_splits" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."transactions" "t"
  WHERE (("t"."id" = "transaction_splits"."transaction_id") AND "public"."is_workspace_member"("t"."workspace_id")))));



CREATE POLICY "Workspace members can view transactions" ON "public"."transactions" FOR SELECT USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Workspace members can view workspace_installment_plans" ON "public"."workspace_installment_plans" FOR SELECT USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Workspace members can view workspace_subscriptions" ON "public"."workspace_subscriptions" FOR SELECT USING ("public"."is_workspace_member"("workspace_id"));



ALTER TABLE "public"."bill_instances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bill_notification_dedupe" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bills" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."budgets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_card_category_spend_alerts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_card_invoice_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_card_notification_dedupe" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_cards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."push_subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "push_subscriptions_delete_own" ON "public"."push_subscriptions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "push_subscriptions_insert_own" ON "public"."push_subscriptions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "push_subscriptions_select_own" ON "public"."push_subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "push_subscriptions_update_own" ON "public"."push_subscriptions" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."transaction_splits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_activity_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workspace_installment_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workspace_invites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workspace_member_notification_prefs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workspace_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workspace_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workspaces" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";































































































































































REVOKE ALL ON FUNCTION "public"."accept_workspace_invite"("p_token_hash" "text", "p_user_id" "uuid", "p_user_email" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."accept_workspace_invite"("p_token_hash" "text", "p_user_id" "uuid", "p_user_email" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."catch_up_recurring_billing"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."catch_up_recurring_billing"() TO "anon";
GRANT ALL ON FUNCTION "public"."catch_up_recurring_billing"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."catch_up_recurring_billing"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."charge_workspace_installment_plan_step"("p_plan_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."charge_workspace_installment_plan_step"("p_plan_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."charge_workspace_installment_plan_step"("p_plan_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."charge_workspace_installment_plan_step"("p_plan_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."cleanup_expired_sessions"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cleanup_expired_sessions"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."cleanup_old_activity_logs"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cleanup_old_activity_logs"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."complete_workspace_categories_onboarding"("p_workspace_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."complete_workspace_categories_onboarding"("p_workspace_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_workspace_categories_onboarding"("p_workspace_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_workspace_categories_onboarding"("p_workspace_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_workspace_installment_plan"("p_workspace_id" "uuid", "p_category_id" "uuid", "p_description" "text", "p_payment_method" "text", "p_payment_credit_card_id" "uuid", "p_total_installments" integer, "p_installment_amount" numeric, "p_final_installment_amount" numeric, "p_next_billing_date" "date") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_workspace_installment_plan"("p_workspace_id" "uuid", "p_category_id" "uuid", "p_description" "text", "p_payment_method" "text", "p_payment_credit_card_id" "uuid", "p_total_installments" integer, "p_installment_amount" numeric, "p_final_installment_amount" numeric, "p_next_billing_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."create_workspace_installment_plan"("p_workspace_id" "uuid", "p_category_id" "uuid", "p_description" "text", "p_payment_method" "text", "p_payment_credit_card_id" "uuid", "p_total_installments" integer, "p_installment_amount" numeric, "p_final_installment_amount" numeric, "p_next_billing_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_workspace_installment_plan"("p_workspace_id" "uuid", "p_category_id" "uuid", "p_description" "text", "p_payment_method" "text", "p_payment_credit_card_id" "uuid", "p_total_installments" integer, "p_installment_amount" numeric, "p_final_installment_amount" numeric, "p_next_billing_date" "date") TO "service_role";



REVOKE ALL ON FUNCTION "public"."delete_workspace"("p_workspace_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."delete_workspace"("p_workspace_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_workspace"("p_workspace_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_workspace"("p_workspace_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."delete_workspace_installment_plan_cascade"("p_plan_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."delete_workspace_installment_plan_cascade"("p_plan_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_workspace_installment_plan_cascade"("p_plan_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_workspace_installment_plan_cascade"("p_plan_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_workspace_member_notification_prefs"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_workspace_member_notification_prefs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_workspace_member_notification_prefs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_device_info_from_user_agent"("user_agent_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_device_info_from_user_agent"("user_agent_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_device_info_from_user_agent"("user_agent_text" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_workspace_delete_impact"("p_workspace_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_workspace_delete_impact"("p_workspace_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_workspace_delete_impact"("p_workspace_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_workspace_delete_impact"("p_workspace_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_workspace_member"("workspace_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_workspace_member"("workspace_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_workspace_member"("workspace_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_workspace_member"("workspace_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_workspace_owner"("workspace_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_workspace_owner"("workspace_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_workspace_owner"("workspace_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_workspace_owner"("workspace_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_fetch_bills_page_bundle"("p_workspace_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_fetch_bills_page_bundle"("p_workspace_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_fetch_bills_page_bundle"("p_workspace_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_fetch_category_detail_bundle"("p_workspace_id" "uuid", "p_category_id" "uuid", "p_year_month" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_fetch_category_detail_bundle"("p_workspace_id" "uuid", "p_category_id" "uuid", "p_year_month" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_fetch_category_detail_bundle"("p_workspace_id" "uuid", "p_category_id" "uuid", "p_year_month" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_fetch_subscriptions_page_bundle"("p_workspace_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_fetch_subscriptions_page_bundle"("p_workspace_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_fetch_subscriptions_page_bundle"("p_workspace_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."run_installment_billing"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."run_installment_billing"() TO "anon";
GRANT ALL ON FUNCTION "public"."run_installment_billing"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."run_installment_billing"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."run_subscription_billing"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."run_subscription_billing"() TO "anon";
GRANT ALL ON FUNCTION "public"."run_subscription_billing"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."run_subscription_billing"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."seed_subscription_first_transaction"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."seed_subscription_first_transaction"() TO "anon";
GRANT ALL ON FUNCTION "public"."seed_subscription_first_transaction"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."seed_subscription_first_transaction"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_credit_card_category_spend_alert_workspace"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_credit_card_category_spend_alert_workspace"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_credit_card_category_spend_alert_workspace"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."workspace_member_directory"("p_workspace_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."workspace_member_directory"("p_workspace_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."workspace_member_directory"("p_workspace_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."workspace_role"("workspace_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."workspace_role"("workspace_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."workspace_role"("workspace_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."workspace_role"("workspace_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."workspaces_before_delete_guard_and_cleanup"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."workspaces_before_delete_guard_and_cleanup"() TO "anon";
GRANT ALL ON FUNCTION "public"."workspaces_before_delete_guard_and_cleanup"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."workspaces_before_delete_guard_and_cleanup"() TO "service_role";


















GRANT ALL ON TABLE "public"."bill_instances" TO "anon";
GRANT ALL ON TABLE "public"."bill_instances" TO "authenticated";
GRANT ALL ON TABLE "public"."bill_instances" TO "service_role";



GRANT ALL ON TABLE "public"."bill_notification_dedupe" TO "anon";
GRANT ALL ON TABLE "public"."bill_notification_dedupe" TO "authenticated";
GRANT ALL ON TABLE "public"."bill_notification_dedupe" TO "service_role";



GRANT ALL ON TABLE "public"."bills" TO "anon";
GRANT ALL ON TABLE "public"."bills" TO "authenticated";
GRANT ALL ON TABLE "public"."bills" TO "service_role";



GRANT ALL ON TABLE "public"."budgets" TO "anon";
GRANT ALL ON TABLE "public"."budgets" TO "authenticated";
GRANT ALL ON TABLE "public"."budgets" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."credit_card_category_spend_alerts" TO "anon";
GRANT ALL ON TABLE "public"."credit_card_category_spend_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_card_category_spend_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."credit_card_invoice_payments" TO "anon";
GRANT ALL ON TABLE "public"."credit_card_invoice_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_card_invoice_payments" TO "service_role";



GRANT ALL ON TABLE "public"."credit_card_notification_dedupe" TO "anon";
GRANT ALL ON TABLE "public"."credit_card_notification_dedupe" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_card_notification_dedupe" TO "service_role";



GRANT ALL ON TABLE "public"."credit_cards" TO "anon";
GRANT ALL ON TABLE "public"."credit_cards" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_cards" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."push_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."transaction_splits" TO "anon";
GRANT ALL ON TABLE "public"."transaction_splits" TO "authenticated";
GRANT ALL ON TABLE "public"."transaction_splits" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."user_activity_logs" TO "anon";
GRANT ALL ON TABLE "public"."user_activity_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."user_activity_logs" TO "service_role";



GRANT ALL ON TABLE "public"."user_sessions" TO "anon";
GRANT ALL ON TABLE "public"."user_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."user_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_settings" TO "service_role";



GRANT ALL ON TABLE "public"."workspace_installment_plans" TO "anon";
GRANT ALL ON TABLE "public"."workspace_installment_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."workspace_installment_plans" TO "service_role";



GRANT ALL ON TABLE "public"."workspace_invites" TO "anon";
GRANT ALL ON TABLE "public"."workspace_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."workspace_invites" TO "service_role";



GRANT ALL ON TABLE "public"."workspace_member_notification_prefs" TO "anon";
GRANT ALL ON TABLE "public"."workspace_member_notification_prefs" TO "authenticated";
GRANT ALL ON TABLE "public"."workspace_member_notification_prefs" TO "service_role";



GRANT ALL ON TABLE "public"."workspace_members" TO "anon";
GRANT ALL ON TABLE "public"."workspace_members" TO "authenticated";
GRANT ALL ON TABLE "public"."workspace_members" TO "service_role";



GRANT ALL ON TABLE "public"."workspace_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."workspace_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."workspace_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."workspaces" TO "anon";
GRANT ALL ON TABLE "public"."workspaces" TO "authenticated";
GRANT ALL ON TABLE "public"."workspaces" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
































-- ============================================================================
-- APÊNDICE A — auth: criar perfil/workspace pessoal para novos usuários
-- ============================================================================
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================================================
-- APÊNDICE B — storage: bucket de avatares + políticas owner-scoped
-- (guardado: gerenciar storage.objects exige ownership em alguns ambientes)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

do $$
begin
  drop policy if exists "avatars_upload" on storage.objects;
  drop policy if exists "avatars_update" on storage.objects;
  drop policy if exists "avatars_delete" on storage.objects;
  drop policy if exists "avatars_public_read" on storage.objects;

  drop policy if exists "Anyone can view avatars" on storage.objects;
  drop policy if exists "Users can upload their own avatar" on storage.objects;
  drop policy if exists "Users can update their own avatar" on storage.objects;
  drop policy if exists "Users can delete their own avatar" on storage.objects;

  create policy "Anyone can view avatars" on storage.objects
    for select using (bucket_id = 'avatars');

  create policy "Users can upload their own avatar" on storage.objects
    for insert
    with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

  create policy "Users can update their own avatar" on storage.objects
    for update
    using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

  create policy "Users can delete their own avatar" on storage.objects
    for delete
    using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
exception
  when insufficient_privilege then
    raise notice 'baseline: sem privilégio para políticas de storage.objects; aplique via Dashboard.';
end;
$$;

-- ============================================================================
-- APÊNDICE C — pg_cron (hosted: extensão presente; local: no-op)
-- ============================================================================
do $cron$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(j.jobid) from cron.job j
    where j.jobname = 'subscription-billing-daily';
    perform cron.schedule(
      'subscription-billing-daily', '0 8 * * *',
      'select public.run_subscription_billing()'
    );

    perform cron.unschedule(j.jobid) from cron.job j
    where j.jobname = 'installment-billing-daily';
    perform cron.schedule(
      'installment-billing-daily', '0 8 * * *',
      'select public.run_installment_billing()'
    );

    begin
      perform cron.unschedule('finance_cleanup_old_activity_logs');
    exception when others then null;
    end;
    begin
      perform cron.schedule(
        'finance_cleanup_old_activity_logs', '0 4 * * 0',
        $cmd$select public.cleanup_old_activity_logs()$cmd$
      );
    exception when others then null;
    end;
  end if;
end;
$cron$;

-- Nota: o Database Webhook de `public.transactions` (INSERT) → Edge Function
-- `notify-transaction-created` é configuração de Dashboard, invisível a
-- migrações (ver supabase/NOTIFICATION_DEPLOYMENT.md).
