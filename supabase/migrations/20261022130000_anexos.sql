-- Anexos (Bloco 2): a nota ou o recibo do lançamento, o boleto da conta a pagar
-- e o PDF da fatura do banco. Bucket privado (só URL assinada), 10 MB por
-- arquivo e 25 MB por carteira enquanto o Supabase for Free. O objeto mora em
-- `<workspace_id>/<uuid>.<ext>`; a pasta é a carteira, e é ela que as políticas
-- de storage conferem. Um cron semanal apaga o objeto que ficou sem linha.

-- 1. bucket privado -----------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'attachments', 'attachments', false, 10485760,
  array['image/webp', 'image/jpeg', 'image/png', 'application/pdf']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2. tabela -------------------------------------------------------------------
create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  transaction_id uuid null references public.transactions(id) on delete cascade,
  bill_instance_id uuid null references public.bill_instances(id) on delete cascade,
  statement_total_id uuid null references public.credit_card_statement_totals(id) on delete cascade,
  path text not null unique,
  mime text not null,
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 10485760),
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  constraint attachments_tem_vinculo check (
    transaction_id is not null or bill_instance_id is not null or statement_total_id is not null
  ),
  -- A linha só aponta para objeto da própria pasta da carteira.
  constraint attachments_path_na_carteira check (split_part(path, '/', 1) = workspace_id::text)
);

create index if not exists idx_attachments_workspace on public.attachments (workspace_id);
create index if not exists idx_attachments_transaction
  on public.attachments (transaction_id) where transaction_id is not null;
create index if not exists idx_attachments_bill_instance
  on public.attachments (bill_instance_id) where bill_instance_id is not null;
create index if not exists idx_attachments_statement_total
  on public.attachments (statement_total_id) where statement_total_id is not null;

-- O vínculo é da mesma carteira.
drop trigger if exists same_ws_transaction_id on public.attachments;
create trigger same_ws_transaction_id
  before insert or update of transaction_id on public.attachments
  for each row execute function public.assert_same_workspace_ref('transaction_id', 'transactions');

drop trigger if exists same_ws_bill_instance_id on public.attachments;
create trigger same_ws_bill_instance_id
  before insert or update of bill_instance_id on public.attachments
  for each row execute function public.assert_same_workspace_ref('bill_instance_id', 'bill_instances');

drop trigger if exists same_ws_statement_total_id on public.attachments;
create trigger same_ws_statement_total_id
  before insert or update of statement_total_id on public.attachments
  for each row execute function public.assert_same_workspace_ref('statement_total_id', 'credit_card_statement_totals');

-- 3. cota por carteira --------------------------------------------------------
create or replace function public.attachments_enforce_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usado bigint;
begin
  -- Dois envios ao mesmo tempo não passam juntos da cota.
  perform pg_advisory_xact_lock(hashtext('attachments_quota:' || new.workspace_id::text));

  select coalesce(sum(size_bytes), 0) into v_usado
  from public.attachments
  where workspace_id = new.workspace_id;

  if v_usado + new.size_bytes > 26214400 then
    raise exception 'cota_anexos_excedida'
      using detail = format('carteira %s: %s bytes em uso', new.workspace_id, v_usado);
  end if;
  return new;
end;
$$;

revoke all on function public.attachments_enforce_quota() from public, anon, authenticated;

drop trigger if exists attachments_enforce_quota on public.attachments;
create trigger attachments_enforce_quota
  before insert on public.attachments
  for each row execute function public.attachments_enforce_quota();

-- 4. RLS ----------------------------------------------------------------------
alter table public.attachments enable row level security;
revoke all on public.attachments from anon;

drop policy if exists "Workspace members can view attachments" on public.attachments;
create policy "Workspace members can view attachments"
  on public.attachments for select
  using (is_workspace_member(workspace_id));

drop policy if exists "Workspace members can insert attachments" on public.attachments;
create policy "Workspace members can insert attachments"
  on public.attachments for insert
  with check (is_workspace_member(workspace_id) and created_by = (select auth.uid()));

drop policy if exists "Workspace members can delete attachments" on public.attachments;
create policy "Workspace members can delete attachments"
  on public.attachments for delete
  using (is_workspace_member(workspace_id));

-- 5. storage.objects: a pasta é a carteira -----------------------------------
-- Guardado como em 20260824123000: gerenciar políticas de storage.objects exige
-- ser dono da tabela, o que alguns ambientes negam ao papel da migração.
do $$
begin
  drop policy if exists "Workspace members can view attachments" on storage.objects;
  drop policy if exists "Workspace members can upload attachments" on storage.objects;
  drop policy if exists "Workspace members can delete attachments" on storage.objects;

  create policy "Workspace members can view attachments" on storage.objects
    for select to authenticated
    using (bucket_id = 'attachments' and public.is_workspace_member(((storage.foldername(name))[1])::uuid));

  create policy "Workspace members can upload attachments" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'attachments' and public.is_workspace_member(((storage.foldername(name))[1])::uuid));

  create policy "Workspace members can delete attachments" on storage.objects
    for delete to authenticated
    using (bucket_id = 'attachments' and public.is_workspace_member(((storage.foldername(name))[1])::uuid));
exception
  when insufficient_privilege then
    raise notice 'anexos: sem privilégio para as políticas de storage.objects; aplique pelo SQL editor do Dashboard.';
end;
$$;

-- 6. limpeza semanal dos órfãos (hosted: extensão presente; local: no-op) ------
do $cron$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(j.jobid) from cron.job j
    where j.jobname = 'attachments-cleanup-weekly';
    perform cron.schedule(
      'attachments-cleanup-weekly', '0 7 * * 0',
      $cmd$select public.invoke_edge_function('attachments-cleanup')$cmd$
    );
  end if;
end;
$cron$;
