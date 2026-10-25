-- Bloco 7A — O limite mensal por pessoa (spec §12).
--
-- Só acrescenta: o front de `main` não lê nada daqui, e o check de
-- `insights.kind` só cresce. O limite é mensal e se repete (uma linha por
-- pessoa e carteira, sem mês); a compra no crédito conta pelo mês do
-- fechamento, e o aviso sai em 80% e em 100% (a Edge `evaluate-budgets`).

-- 1. o limite -----------------------------------------------------------------
-- O gasto é de quem lançou (`transactions.user_id`), não de quem pagou: o
-- `paid_by` do 7C não muda a régua.
create table if not exists public.workspace_member_limits (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

drop trigger if exists set_workspace_member_limits_updated_at on public.workspace_member_limits;
create trigger set_workspace_member_limits_updated_at before update on public.workspace_member_limits
  for each row execute function public.set_updated_at();

-- O adulto vê o de todos; o convidado, só o dele. Só o dono escreve. Sem
-- plano nada disso se desliga: o limite continua visível.
alter table public.workspace_member_limits enable row level security;
revoke all on public.workspace_member_limits from anon;
revoke truncate on public.workspace_member_limits from authenticated;

drop policy if exists workspace_member_limits_select on public.workspace_member_limits;
create policy workspace_member_limits_select on public.workspace_member_limits
  for select to authenticated
  using (public.is_workspace_adult(workspace_id) or user_id = (select auth.uid()));

drop policy if exists workspace_member_limits_insert on public.workspace_member_limits;
create policy workspace_member_limits_insert on public.workspace_member_limits
  for insert to authenticated
  with check (public.is_workspace_owner(workspace_id));

drop policy if exists workspace_member_limits_update on public.workspace_member_limits;
create policy workspace_member_limits_update on public.workspace_member_limits
  for update to authenticated
  using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));

drop policy if exists workspace_member_limits_delete on public.workspace_member_limits;
create policy workspace_member_limits_delete on public.workspace_member_limits
  for delete to authenticated
  using (public.is_workspace_owner(workspace_id));

-- 2. o dedupe do aviso --------------------------------------------------------
-- Um aviso por pessoa, mês e nível. A Edge reivindica com `on conflict do
-- nothing` antes de avisar; ir de 79% a 101% grava o 80 junto com o 100, para
-- o de 80 não sair depois. Só a service role: RLS ligada e nenhuma política.
create table if not exists public.limites_avisados (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ym text not null check (ym ~ '^[0-9]{4}-[0-9]{2}$'),
  nivel smallint not null check (nivel in (80, 100)),
  avisado_em timestamptz not null default now(),
  primary key (workspace_id, user_id, ym, nivel)
);

alter table public.limites_avisados enable row level security;
revoke all on public.limites_avisados from anon, authenticated;

-- 3. o insight do limite ------------------------------------------------------
-- `limite_pessoa` entra nos dois checks, sem tirar nenhum tipo. `not valid` +
-- `validate`: o lock forte não espera a varredura da tabela.
alter table public.insights drop constraint if exists insights_kind_check;
alter table public.insights
  add constraint insights_kind_check
  check (kind in ('fatura_fechou', 'relatorio_mes', 'recorrencia', 'gasto_atipico', 'preco_assinatura', 'duplicidade', 'parcelas_acabando', 'seguro_baixo', 'sazonal', 'a_conferir', 'limite_pessoa'))
  not valid;
alter table public.insights validate constraint insights_kind_check;

alter table public.insights_silenciados drop constraint if exists insights_silenciados_kind_check;
alter table public.insights_silenciados
  add constraint insights_silenciados_kind_check
  check (kind in ('fatura_fechou', 'relatorio_mes', 'recorrencia', 'gasto_atipico', 'preco_assinatura', 'duplicidade', 'parcelas_acabando', 'seguro_baixo', 'sazonal', 'a_conferir', 'limite_pessoa'))
  not valid;
alter table public.insights_silenciados validate constraint insights_silenciados_kind_check;
