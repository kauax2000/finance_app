-- Chamada interna às Edge Functions por pg_net, sem configuração de Dashboard.
-- URL e segredo moram no Vault (`edge_functions_url`, `cron_secret`); nada
-- disso entra no repositório. Sem os dois segredos, a chamada vira no-op.

-- 1. invoke_edge_function -----------------------------------------------------
create or replace function public.invoke_edge_function(
  p_function text,
  p_body jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
  v_request_id bigint;
begin
  select decrypted_secret into v_url
  from vault.decrypted_secrets
  where name = 'edge_functions_url';

  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'cron_secret';

  if v_url is null or v_secret is null then
    raise notice 'invoke_edge_function(%): faltam edge_functions_url ou cron_secret no Vault', p_function;
    return null;
  end if;

  select net.http_post(
    url := v_url || '/' || p_function,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', v_secret
    ),
    body := p_body
  ) into v_request_id;

  return v_request_id;
exception when others then
  -- quem chama (trigger de insert, cron) nunca pode falhar por causa do aviso
  raise warning 'invoke_edge_function(%): %', p_function, sqlerrm;
  return null;
end;
$$;

revoke all on function public.invoke_edge_function(text, jsonb) from public, anon, authenticated;

-- 2. crons (hosted: extensão presente; local: no-op) --------------------------
do $cron$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(j.jobid) from cron.job j
    where j.jobname = 'credit-card-calendar-alerts-daily';
    perform cron.schedule(
      'credit-card-calendar-alerts-daily', '0 12 * * *',
      $cmd$select public.invoke_edge_function('credit-card-calendar-alerts')$cmd$
    );

    perform cron.unschedule(j.jobid) from cron.job j
    where j.jobname = 'bills-reminders-daily';
    perform cron.schedule(
      'bills-reminders-daily', '0 12 * * *',
      $cmd$select public.invoke_edge_function('evaluate-bills-reminders')$cmd$
    );
  end if;
end;
$cron$;

-- 3. trigger: despesa manual avisa os membros ----------------------------------
create or replace function public.transactions_notify_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.invoke_edge_function(
    'notify-transaction-created',
    jsonb_build_object('transaction_id', new.id)
  );
  return null;
end;
$$;

revoke all on function public.transactions_notify_created() from public, anon, authenticated;

drop trigger if exists transactions_notify_created on public.transactions;
create trigger transactions_notify_created
  after insert on public.transactions
  for each row
  when (new.type = 'expense' and new.subscription_id is null and new.installment_plan_id is null)
  execute function public.transactions_notify_created();

comment on table public.transactions is
  'Financial transactions. Trigger transactions_notify_created (INSERT de despesa manual) chama a Edge Function notify-transaction-created por pg_net.';
