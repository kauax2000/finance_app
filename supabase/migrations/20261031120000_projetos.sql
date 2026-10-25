-- Bloco 7C, Tarefa 1 — projetos, carteira de projeto e modelos.
--
-- Só acrescenta: o front de `main` continua em produção e não manda
-- `project_id`, `purpose` nem `split_mode`; os padrões das colunas valem o de
-- hoje para ele.

-- 1. o projeto ----------------------------------------------------------------
-- Um projeto é um rótulo de planejamento dentro da carteira: o cartão e as
-- pessoas da casa, com um período e um orçamento total opcionais. O membro lê
-- (o convidado incluído, para marcar a despesa dele); só o adulto escreve.
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (pg_catalog.btrim(name) <> ''),
  starts_on date,
  ends_on date,
  budget_total numeric(12, 2) check (budget_total is null or budget_total > 0),
  archived_at timestamptz,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_periodo check (starts_on is null or ends_on is null or ends_on >= starts_on)
);

create index if not exists idx_projects_workspace_id on public.projects (workspace_id);

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.projects enable row level security;
revoke all on public.projects from anon;
revoke truncate on public.projects from authenticated;
-- A carteira e o autor não se trocam: as transações do projeto apontariam
-- para outra casa. O update só alcança o que a tela edita.
revoke update on public.projects from authenticated;
grant update (name, starts_on, ends_on, budget_total, archived_at) on public.projects to authenticated;

drop policy if exists projects_select on public.projects;
create policy projects_select on public.projects
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects
  for insert to authenticated
  with check (public.is_workspace_adult(workspace_id) and created_by = (select auth.uid()));

drop policy if exists projects_update on public.projects;
create policy projects_update on public.projects
  for update to authenticated
  using (public.is_workspace_adult(workspace_id))
  with check (public.is_workspace_adult(workspace_id));

drop policy if exists projects_delete on public.projects;
create policy projects_delete on public.projects
  for delete to authenticated
  using (public.is_workspace_adult(workspace_id));

-- 2. o lançamento no projeto --------------------------------------------------
-- Apagar o projeto solta os lançamentos (`on delete set null`), sem apagá-los.
alter table public.transactions
  add column if not exists project_id uuid references public.projects(id) on delete set null;

create index if not exists idx_transactions_project_id on public.transactions (project_id)
  where project_id is not null;

-- No molde do `same_ws_bill_id` do 6A: o projeto é da mesma carteira.
drop trigger if exists same_ws_project_id on public.transactions;
create trigger same_ws_project_id
  before insert or update of project_id, workspace_id on public.transactions
  for each row execute function public.assert_same_workspace_ref('project_id', 'projects');

-- O projeto arquivado não aceita lançamento novo. Só o vínculo novo é
-- recusado: editar um lançamento que já era do projeto passa, e o `main`, que
-- não manda `project_id`, nunca cai aqui.
create or replace function public.recusar_projeto_arquivado()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.project_id is not distinct from old.project_id then
    return new;
  end if;
  if exists (
    select 1 from public.projects p
    where p.id = new.project_id
      and p.archived_at is not null
  ) then
    raise exception 'PROJETO_ARQUIVADO' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function public.recusar_projeto_arquivado() from public, anon, authenticated;

drop trigger if exists recusar_projeto_arquivado on public.transactions;
create trigger recusar_projeto_arquivado
  before insert or update of project_id on public.transactions
  for each row
  when (new.project_id is not null)
  execute function public.recusar_projeto_arquivado();

-- 3. a privada não leva projeto (Ruling 1) ------------------------------------
-- O 7B deixou o `project_id` para cá: um projeto revelaria o propósito do gasto
-- privado. A função é a de 20261030120000 com uma linha a mais na régua de onde
-- o privado vale; a lista de colunas do gatilho ganha `project_id`, para ligar
-- um projeto a uma privada que já existe também cair aqui.
create or replace function public.guardar_privado()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_chave text;
  v_enviado jsonb;
  v_lado public.transacoes_privadas%rowtype;
  v_desc text;
  v_cat uuid;
  v_meta jsonb;
  v_pode boolean;
begin
  if tg_op = 'INSERT' then
    if not new.is_private then
      return new;
    end if;
  else
    if not new.is_private and not old.is_private then
      return new;
    end if;
    -- O autor não troca (o `preserve_transactions_author` roda depois deste).
    new.user_id := old.user_id;

    -- O cartão apagado (`on delete set null`, uma cascata): a privada fica
    -- como está, sem cartão.
    if old.is_private and new.is_private
       and old.payment_credit_card_id is not null and new.payment_credit_card_id is null
       and pg_catalog.pg_trigger_depth() > 1 then
      return new;
    end if;
  end if;

  if v_uid is not null and v_uid is distinct from new.user_id then
    raise exception 'PRIVADO_NAO_PERMITIDO' using errcode = 'P0001';
  end if;

  -- Desmarcar: o que a pessoa mandou de novo vale; o resto volta de lá.
  if not new.is_private then
    select * into v_lado from public.transacoes_privadas p where p.transaction_id = old.id;
    if found then
      if new.description is not distinct from old.description then
        new.description := v_lado.description;
      end if;
      if new.category_id is not distinct from old.category_id then
        new.category_id := v_lado.category_id;
      end if;
      if new.capture_meta is not distinct from old.capture_meta then
        new.capture_meta := v_lado.capture_meta;
      end if;
      delete from public.transacoes_privadas p where p.transaction_id = old.id;
    end if;
    return new;
  end if;

  v_pode := new.type = 'expense'
    and new.subscription_id is null
    and new.installment_plan_id is null
    and new.project_id is null
    and not exists (
      select 1 from public.bill_instances i
      where i.transaction_id = new.id
    )
    and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = new.workspace_id
        and wm.user_id = new.user_id
        and wm.role in ('owner', 'member')
    )
    and (
      new.payment_method in ('pix', 'debit_card', 'cash')
      or (
        new.payment_method = 'credit_card'
        and exists (
          select 1 from public.credit_cards c
          where c.id = new.payment_credit_card_id
            and c.holder_user_id = new.user_id
        )
      )
    );
  if not coalesce(v_pode, false) then
    raise exception 'PRIVADO_NAO_PERMITIDO' using errcode = 'P0001';
  end if;

  v_chave := 'privado.t' || pg_catalog.md5(new.workspace_id::text || ':' || coalesce(new.client_id::text, new.id::text));

  if tg_op = 'UPDATE' then
    v_enviado := nullif(pg_catalog.current_setting(v_chave, true), '')::jsonb;
  end if;

  if v_enviado is not null then
    perform pg_catalog.set_config(v_chave, '', true);
    v_desc := v_enviado ->> 'description';
    v_cat := (v_enviado ->> 'category_id')::uuid;
    v_meta := nullif(v_enviado -> 'capture_meta', 'null'::jsonb);
  elsif tg_op = 'UPDATE' and old.is_private then
    select * into v_lado from public.transacoes_privadas p where p.transaction_id = old.id;
    v_desc := case when new.description is distinct from old.description then new.description else v_lado.description end;
    v_cat := case when new.category_id is distinct from old.category_id then new.category_id else v_lado.category_id end;
    v_meta := case when new.capture_meta is distinct from old.capture_meta then new.capture_meta else v_lado.capture_meta end;
  else
    v_desc := new.description;
    v_cat := new.category_id;
    v_meta := new.capture_meta;
  end if;

  if tg_op = 'INSERT' then
    perform pg_catalog.set_config(
      v_chave,
      pg_catalog.jsonb_build_object('description', v_desc, 'category_id', v_cat, 'capture_meta', v_meta)::text,
      true
    );
  else
    insert into public.transacoes_privadas (transaction_id, workspace_id, user_id, description, category_id, capture_meta)
    values (new.id, new.workspace_id, new.user_id, v_desc, v_cat, v_meta)
    on conflict (transaction_id) do update
      set workspace_id = excluded.workspace_id,
          user_id = excluded.user_id,
          description = excluded.description,
          category_id = excluded.category_id,
          capture_meta = excluded.capture_meta;
  end if;

  new.description := 'Gasto pessoal';
  new.category_id := null;
  new.capture_meta := null;
  return new;
end;
$$;

revoke all on function public.guardar_privado() from public, anon, authenticated;

drop trigger if exists guardar_privado on public.transactions;
create trigger guardar_privado
  before insert or update of is_private, description, category_id, capture_meta, payment_method, payment_credit_card_id,
    subscription_id, installment_plan_id, type, workspace_id, project_id
  on public.transactions
  for each row execute function public.guardar_privado();

-- 4. a carteira de projeto ----------------------------------------------------
-- `purpose = 'project'` é a carteira com dinheiro separado ou gente de fora
-- (uma viagem com amigos): sem Previsão nem orçamento do mês, e com o período
-- e o orçamento total dela. `split_mode` é o modo da divisão (Decisão 5): mora
-- aqui porque o modelo já o grava; as partes e o `split_since` são da Tarefa 2.
alter table public.workspaces
  add column if not exists purpose text not null default 'everyday'
    constraint workspaces_purpose_check check (purpose in ('everyday', 'project')),
  add column if not exists starts_on date,
  add column if not exists ends_on date,
  add column if not exists budget_total numeric(12, 2)
    constraint workspaces_budget_total_check check (budget_total is null or budget_total > 0),
  add column if not exists split_mode text not null default 'pooled'
    constraint workspaces_split_mode_check check (split_mode in ('pooled', 'split'));

alter table public.workspaces
  add constraint workspaces_project_fields
    check (purpose = 'project' or (starts_on is null and ends_on is null and budget_total is null));

-- O orçamento do mês não vale na carteira de projeto: a cópia do dia 1 e a da
-- abertura do Painel a pulam. As duas são as de 20261026120000 e
-- 20261029120000, com o propósito a mais.
create or replace function public.copiar_orcamentos_do_mes(p_period_start date, p_workspace_id uuid default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inicio date := date_trunc('month', p_period_start)::date;
  v_n integer;
begin
  with alvos as (
    select distinct b.workspace_id
    from public.budgets b
    join public.workspaces w on w.id = b.workspace_id
    where b.period_start = (v_inicio - interval '1 month')::date
      and b.repeats
      and w.purpose = 'everyday'
      and (p_workspace_id is null or b.workspace_id = p_workspace_id)
  ), marcadas as (
    insert into public.orcamentos_copiados (workspace_id, period_start)
    select a.workspace_id, v_inicio from alvos a
    on conflict (workspace_id, period_start) do nothing
    returning workspace_id
  )
  insert into public.budgets (
    user_id, workspace_id, category_id, amount, repeats,
    period_start, period_end, year, month
  )
  select
    b.user_id, b.workspace_id, b.category_id, b.amount, b.repeats,
    v_inicio,
    (v_inicio + interval '1 month - 1 day')::date,
    extract(year from v_inicio)::int,
    extract(month from v_inicio)::int
  from public.budgets b
  join marcadas m on m.workspace_id = b.workspace_id
  where b.period_start = (v_inicio - interval '1 month')::date
    and b.repeats
  on conflict (workspace_id, category_id, period_start) do nothing;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

revoke all on function public.copiar_orcamentos_do_mes(date, uuid) from public, anon, authenticated;
grant execute on function public.copiar_orcamentos_do_mes(date, uuid) to service_role;

create or replace function public.garantir_orcamentos_do_mes(p_workspace_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_workspace_member(p_workspace_id) then
    raise exception 'not a workspace member' using errcode = '42501';
  end if;
  if not public.is_workspace_adult(p_workspace_id) then
    return 0;
  end if;
  if exists (
    select 1 from public.workspaces w
    where w.id = p_workspace_id and w.purpose = 'project'
  ) then
    return 0;
  end if;

  return public.copiar_orcamentos_do_mes(date_trunc('month', public.app_today())::date, p_workspace_id);
end;
$$;

revoke all on function public.garantir_orcamentos_do_mes(uuid) from public, anon;
grant execute on function public.garantir_orcamentos_do_mes(uuid) to authenticated;

-- 5. os modelos de carteira ---------------------------------------------------
-- A carteira nasce pelo mesmo caminho do `create_shared_workspace`
-- (`security invoker`: valem `created_by = auth.uid()`, "Creator bootstraps
-- own workspace" e o insert de categorias do adulto), já com o propósito, o
-- modo e as categorias do modelo, na forma do `handle_new_user`. O assistente
-- de categorias não abre: o modelo já as escolheu.
--
-- A `pessoal` não cria nada: devolve a carteira pessoal que o
-- `handle_new_user` criou no cadastro. O nome é ignorado nela.
create or replace function public.criar_carteira_de_modelo(p_modelo text, p_nome text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_ws uuid;
  v_purpose text;
  v_split text;
  v_icone text;
  v_cor text;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '28000';
  end if;

  if p_modelo = 'pessoal' then
    select w.id into v_ws
    from public.workspaces w
    where w.created_by = v_uid
      and w.type = 'personal'
    order by w.created_at asc
    limit 1;
    if v_ws is null then
      raise exception 'CARTEIRA_PESSOAL_AUSENTE' using errcode = 'P0002';
    end if;
    return v_ws;
  end if;

  case p_modelo
    when 'casa' then
      v_purpose := 'everyday'; v_split := 'pooled'; v_icone := 'home'; v_cor := '#2563EB';
    when 'casal' then
      v_purpose := 'everyday'; v_split := 'split'; v_icone := 'heart'; v_cor := '#DB2777';
    when 'viagem' then
      v_purpose := 'project'; v_split := 'split'; v_icone := 'plane'; v_cor := '#0891B2';
    when 'reforma' then
      v_purpose := 'project'; v_split := 'split'; v_icone := 'building-2'; v_cor := '#EA580C';
    when 'evento' then
      v_purpose := 'project'; v_split := 'split'; v_icone := 'sparkles'; v_cor := '#7C3AED';
    else
      raise exception 'MODELO_DESCONHECIDO' using errcode = '22023';
  end case;

  if nullif(pg_catalog.btrim(p_nome), '') is null then
    raise exception 'WORKSPACE_NAME_REQUIRED' using errcode = '22023';
  end if;

  insert into public.workspaces (
    name, type, created_by, icon, icon_background_color,
    purpose, split_mode, categories_onboarding_completed_at
  )
  values (btrim(p_nome), 'shared', v_uid, v_icone, v_cor, v_purpose, v_split, now())
  returning id into v_ws;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_ws, v_uid, 'owner');

  insert into public.categories (user_id, workspace_id, name, type, color, icon)
  select v_uid, v_ws, c.nome, c.tipo, c.cor, c.icone
  from (values
    ('casa', 'Mercado', 'expense', '#EF4444', 'shopping-cart'),
    ('casa', 'Contas da casa', 'expense', '#8B5CF6', 'home'),
    ('casa', 'Transporte', 'expense', '#3B82F6', 'car'),
    ('casa', 'Saúde', 'expense', '#10B981', 'heart'),
    ('casa', 'Lazer', 'expense', '#F59E0B', 'gamepad-2'),
    ('casa', 'Educação', 'expense', '#6366F1', 'graduation-cap'),
    ('casa', 'Outros', 'expense', '#6B7280', 'more-horizontal'),
    ('casa', 'Salário', 'income', '#10B981', 'briefcase'),
    ('casa', 'Outros', 'income', '#6B7280', 'more-horizontal'),
    ('viagem', 'Passagens', 'expense', '#3B82F6', 'plane'),
    ('viagem', 'Hospedagem', 'expense', '#8B5CF6', 'home'),
    ('viagem', 'Alimentação', 'expense', '#EF4444', 'utensils'),
    ('viagem', 'Passeios', 'expense', '#F59E0B', 'gamepad-2'),
    ('viagem', 'Transporte', 'expense', '#10B981', 'bus'),
    ('viagem', 'Outros', 'expense', '#6B7280', 'more-horizontal'),
    ('reforma', 'Material', 'expense', '#F59E0B', 'shopping-bag'),
    ('reforma', 'Mão de obra', 'expense', '#3B82F6', 'briefcase'),
    ('reforma', 'Projeto', 'expense', '#6366F1', 'laptop'),
    ('reforma', 'Móveis', 'expense', '#8B5CF6', 'home'),
    ('reforma', 'Outros', 'expense', '#6B7280', 'more-horizontal'),
    ('evento', 'Local', 'expense', '#8B5CF6', 'home'),
    ('evento', 'Comida e bebida', 'expense', '#EF4444', 'utensils'),
    ('evento', 'Decoração', 'expense', '#EC4899', 'gift'),
    ('evento', 'Convites', 'expense', '#3B82F6', 'receipt'),
    ('evento', 'Fornecedores', 'expense', '#F59E0B', 'shopping-cart'),
    ('evento', 'Outros', 'expense', '#6B7280', 'more-horizontal')
  ) as c(modelo, nome, tipo, cor, icone)
  where c.modelo = case when p_modelo = 'casal' then 'casa' else p_modelo end;

  return v_ws;
end;
$$;

revoke all on function public.criar_carteira_de_modelo(text, text) from public, anon;
grant execute on function public.criar_carteira_de_modelo(text, text) to authenticated;
