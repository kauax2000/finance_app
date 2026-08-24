-- Fim das linhas órfãs: workspace_id NOT NULL + ON DELETE CASCADE.
--
-- `transactions/categories/budgets.workspace_id` era nullable com FK
-- ON DELETE SET NULL. Como o RLS é `is_workspace_member(workspace_id)` e
-- `is_workspace_member(NULL)` = false, qualquer linha que perdesse o
-- workspace ficava permanentemente invisível e indeletável via API —
-- dinheiro órfão. O trigger de delete de workspace compensava com deletes
-- manuais; o CASCADE torna isso desnecessário.

-- 1. Re-hospedar/limpar órfãos existentes: linhas sem workspace vão para o
--    workspace pessoal do dono; sem workspace pessoal, são removidas.
do $$
declare
  v_rehomed int := 0;
  v_deleted int := 0;
  v_n int;
begin
  -- transactions
  update public.transactions t
  set workspace_id = w.id
  from public.workspaces w
  where t.workspace_id is null
    and w.created_by = t.user_id
    and w.type = 'personal';
  get diagnostics v_n = row_count; v_rehomed := v_rehomed + v_n;

  delete from public.transactions where workspace_id is null;
  get diagnostics v_n = row_count; v_deleted := v_deleted + v_n;

  -- categories
  update public.categories c
  set workspace_id = w.id
  from public.workspaces w
  where c.workspace_id is null
    and w.created_by = c.user_id
    and w.type = 'personal';
  get diagnostics v_n = row_count; v_rehomed := v_rehomed + v_n;

  delete from public.categories where workspace_id is null;
  get diagnostics v_n = row_count; v_deleted := v_deleted + v_n;

  -- budgets
  update public.budgets b
  set workspace_id = w.id
  from public.workspaces w
  where b.workspace_id is null
    and w.created_by = b.user_id
    and w.type = 'personal';
  get diagnostics v_n = row_count; v_rehomed := v_rehomed + v_n;

  delete from public.budgets where workspace_id is null;
  get diagnostics v_n = row_count; v_deleted := v_deleted + v_n;

  if v_rehomed > 0 or v_deleted > 0 then
    raise notice 'workspace_id_not_null: re-homed % orphan row(s), deleted % unrecoverable orphan row(s)',
      v_rehomed, v_deleted;
  end if;
end;
$$;

-- 2. NOT NULL + CASCADE
alter table public.transactions alter column workspace_id set not null;
alter table public.categories   alter column workspace_id set not null;
alter table public.budgets      alter column workspace_id set not null;

alter table public.transactions drop constraint if exists transactions_workspace_id_fkey;
alter table public.transactions
  add constraint transactions_workspace_id_fkey
  foreign key (workspace_id) references public.workspaces(id) on delete cascade;

alter table public.categories drop constraint if exists categories_workspace_id_fkey;
alter table public.categories
  add constraint categories_workspace_id_fkey
  foreign key (workspace_id) references public.workspaces(id) on delete cascade;

alter table public.budgets drop constraint if exists budgets_workspace_id_fkey;
alter table public.budgets
  add constraint budgets_workspace_id_fkey
  foreign key (workspace_id) references public.workspaces(id) on delete cascade;

-- 3. O trigger de guarda só precisa proteger o workspace pessoal;
--    os deletes manuais viram responsabilidade do CASCADE.
create or replace function public.workspaces_before_delete_guard_and_cleanup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.type = 'personal' then
    raise exception 'WORKSPACE_PERSONAL_IMMUTABLE'
      using errcode = 'P0001';
  end if;
  return old;
end;
$$;

-- 4. Impacto de delete: reportar também cartões/assinaturas/parcelas/contas
--    (todos CASCADE em workspace_id — sumiam sem aviso na confirmação).
create or replace function public.get_workspace_delete_impact(p_workspace_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
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
    raise exception 'WORKSPACE_NOT_FOUND' using errcode = 'P0001';
  end if;
  if not coalesce(is_owner, false) then
    raise exception 'WORKSPACE_NOT_OWNER' using errcode = 'P0001';
  end if;
  if wtype = 'personal' then
    raise exception 'WORKSPACE_PERSONAL_IMMUTABLE' using errcode = 'P0001';
  end if;

  return jsonb_build_object(
    'transactions',
      (select count(*) from public.transactions where workspace_id = p_workspace_id),
    'budgets',
      (select count(*) from public.budgets where workspace_id = p_workspace_id),
    'categories',
      (select count(*) from public.categories where workspace_id = p_workspace_id),
    'members',
      (select count(*) from public.workspace_members where workspace_id = p_workspace_id),
    'other_members',
      (select count(*) from public.workspace_members
       where workspace_id = p_workspace_id and user_id <> auth.uid()),
    'credit_cards',
      (select count(*) from public.credit_cards where workspace_id = p_workspace_id),
    'subscriptions',
      (select count(*) from public.workspace_subscriptions where workspace_id = p_workspace_id),
    'installment_plans',
      (select count(*) from public.workspace_installment_plans where workspace_id = p_workspace_id),
    'bills',
      (select count(*) from public.bills where workspace_id = p_workspace_id)
  );
end;
$$;

revoke all on function public.get_workspace_delete_impact(uuid) from public;
grant execute on function public.get_workspace_delete_impact(uuid) to authenticated;
