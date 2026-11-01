-- Parcial do Bloco 7C: só o que a linha Divisão de Configurações lê e grava
-- (modo e pesos). Copiado sem mudança de `20261029120000_papeis.sql` e
-- `20261031130000_divisao.sql`; `split_mode` vem de `20261031120000_projetos.sql`.
-- Tudo aqui é idempotente diante dessas migrações, que seguem pendentes e rodam
-- inteiras depois, e o que elas repetem as deixa iguais.
--
-- Fora daqui: as partes, `paid_by`, os gatilhos em `transactions`, o acerto e o
-- `drop table transaction_splits`. Até eles subirem, o diálogo trava "Dividida",
-- e `split` gravado por outro caminho não gera parte nenhuma.

create or replace function public.is_workspace_adult(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = (select auth.uid())
      and wm.role in ('owner', 'member')
  );
$$;

revoke all on function public.is_workspace_adult(uuid) from public;
grant execute on function public.is_workspace_adult(uuid) to anon, authenticated, service_role;

alter table public.workspaces
  add column if not exists split_mode text not null default 'pooled'
    constraint workspaces_split_mode_check check (split_mode in ('pooled', 'split'));

alter table public.workspaces
  add column if not exists split_since date;

create or replace function public.carimbar_split_since()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.split_mode = 'split' then
    new.split_since := coalesce(new.split_since, public.app_today());
  end if;
  return new;
end;
$$;

revoke all on function public.carimbar_split_since() from public, anon, authenticated;

-- No insert vale sempre: os modelos `casal`, `viagem`, `reforma` e `evento`
-- (`criar_carteira_de_modelo`) nascem `split`.
drop trigger if exists carimbar_split_since on public.workspaces;
create trigger carimbar_split_since
  before insert or update of split_mode on public.workspaces
  for each row execute function public.carimbar_split_since();

-- 3. os pesos -----------------------------------------------------------------
-- Sem linha, o peso vale 1: a divisão igual.
create table if not exists public.workspace_split_weights (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  weight numeric(6, 2) not null check (weight > 0),
  primary key (workspace_id, user_id)
);

create index if not exists idx_workspace_split_weights_user_id on public.workspace_split_weights (user_id);

alter table public.workspace_split_weights enable row level security;
revoke all on public.workspace_split_weights from anon;
revoke truncate on public.workspace_split_weights from authenticated;

drop policy if exists workspace_split_weights_select on public.workspace_split_weights;
create policy workspace_split_weights_select on public.workspace_split_weights
  for select to authenticated
  using (public.is_workspace_adult(workspace_id));

-- Os pesos são do dono, como o modo ("Owners can update workspace"): um membro
-- não passa a parte dele para os outros pela API. O peso guardado é de um adulto
-- da carteira; o dono apaga qualquer linha, até a de quem saiu.
drop policy if exists workspace_split_weights_insert on public.workspace_split_weights;
create policy workspace_split_weights_insert on public.workspace_split_weights
  for insert to authenticated
  with check (
    public.is_workspace_owner(workspace_id)
    and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspace_split_weights.workspace_id
        and wm.user_id = workspace_split_weights.user_id
        and wm.role in ('owner', 'member')
    )
  );

drop policy if exists workspace_split_weights_update on public.workspace_split_weights;
create policy workspace_split_weights_update on public.workspace_split_weights
  for update to authenticated
  using (public.is_workspace_owner(workspace_id))
  with check (
    public.is_workspace_owner(workspace_id)
    and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspace_split_weights.workspace_id
        and wm.user_id = workspace_split_weights.user_id
        and wm.role in ('owner', 'member')
    )
  );

drop policy if exists workspace_split_weights_delete on public.workspace_split_weights;
create policy workspace_split_weights_delete on public.workspace_split_weights
  for delete to authenticated
  using (public.is_workspace_owner(workspace_id));
