-- Bloco 7C, Tarefa 2 — quem pagou, as partes geradas pelo banco, o acerto e a
-- saída do `transaction_splits`.
--
-- Só acrescenta, fora o `drop table public.transaction_splits` (Decisão 7),
-- guardado por uma conferência de tabela vazia. O front de `main` continua em
-- produção e não manda `paid_by`, `shares_manual` nem `split_weights`: quem
-- preenche é o banco, por gatilho, em todo caminho de escrita (o cliente, a
-- fila offline, a importação, a captura pela service role, os crons de
-- assinatura e parcela, `pay_bill_instance` e os `virar_*`). Nenhum depende de
-- uma RPC para ganhar `paid_by` ou partes.

-- 1. quem pagou ---------------------------------------------------------------
-- O padrão é o autor; a despesa do convidado é paga pelo responsável dele
-- (`workspace_members.sponsor_user_id`, 7A). Não é `default` de coluna porque
-- o padrão lê outra coluna. `shares_manual` marca as partes escritas à mão
-- (`definir_partes`): o gatilho das partes não as reescreve.
alter table public.transactions
  add column if not exists paid_by uuid references auth.users(id) on delete set null,
  add column if not exists shares_manual boolean not null default false;

create index if not exists idx_transactions_paid_by on public.transactions (paid_by)
  where paid_by is not null;

-- `before insert or update`: a linha antiga, sem `paid_by`, ganha o padrão na
-- primeira edição. O autor vem de `old` no update: o `preserve_transactions_author`
-- roda depois deste (ordem alfabética) e o `new.user_id` ainda pode ser o que o
-- cliente mandou.
create or replace function public.definir_quem_pagou()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_autor uuid := case when tg_op = 'UPDATE' then old.user_id else new.user_id end;
  v_papel text;
  v_responsavel uuid;
begin
  select wm.role, wm.sponsor_user_id into v_papel, v_responsavel
  from public.workspace_members wm
  where wm.workspace_id = new.workspace_id
    and wm.user_id = v_autor;

  if tg_op = 'UPDATE'
     and old.paid_by is not null
     and new.paid_by is not distinct from old.paid_by
     and new.workspace_id is not distinct from old.workspace_id
     and new.is_private is not distinct from old.is_private then
    -- Quem pagou não está em jogo: editar a descrição de uma despesa antiga
    -- não muda o saldo de ninguém, mesmo que o pagador tenha saído.
    null;
  elsif new.is_private then
    -- Ruling 4: a privada é paga pelo autor, e só ele tem parte nela.
    new.paid_by := v_autor;
  elsif v_papel = 'guest' then
    -- O convidado nunca é quem pagou: o responsável dele, ou o dono quando o
    -- responsável saiu (`on delete set null`).
    new.paid_by := coalesce(v_responsavel, (
      select wm.user_id from public.workspace_members wm
      where wm.workspace_id = new.workspace_id
        and wm.role = 'owner'
      order by wm.joined_at, wm.user_id
      limit 1
    ));
  elsif new.paid_by is null then
    new.paid_by := v_autor;
  elsif new.paid_by is distinct from v_autor and not exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = new.workspace_id
      and wm.user_id = new.paid_by
      and wm.role in ('owner', 'member')
  ) then
    -- Mudar de carteira leva quem pagou de volta ao autor; escolher alguém de
    -- fora dos adultos é recusado.
    if tg_op = 'UPDATE' and new.paid_by is not distinct from old.paid_by then
      new.paid_by := v_autor;
    else
      raise exception 'PAGADOR_INVALIDO' using errcode = 'P0001';
    end if;
  end if;

  -- A linha nasce automática. As partes à mão deixam de valer quando o valor,
  -- o tipo, a carteira ou o privado mudam: elas voltam ao automático, e o
  -- gatilho de depois as refaz.
  if tg_op = 'INSERT' then
    new.shares_manual := false;
  elsif new.shares_manual and old.shares_manual and (
    new.amount is distinct from old.amount
    or new.type is distinct from old.type
    or new.workspace_id is distinct from old.workspace_id
    or new.is_private is distinct from old.is_private
  ) then
    new.shares_manual := false;
  end if;

  return new;
end;
$$;

revoke all on function public.definir_quem_pagou() from public, anon, authenticated;

drop trigger if exists definir_quem_pagou on public.transactions;
create trigger definir_quem_pagou
  before insert or update on public.transactions
  for each row execute function public.definir_quem_pagou();

-- 2. o modo da carteira -------------------------------------------------------
-- `split_mode` entrou na Tarefa 1. `split_since` é o dia em que a divisão
-- começou: as despesas de antes não ganham parte. Ele é carimbado na primeira
-- vez que o modo vira `split` e nunca se perde: voltar a `pooled` e depois a
-- `split` mantém o dia, e as partes guardadas valem de novo.
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

drop policy if exists workspace_split_weights_insert on public.workspace_split_weights;
create policy workspace_split_weights_insert on public.workspace_split_weights
  for insert to authenticated
  with check (public.is_workspace_adult(workspace_id));

drop policy if exists workspace_split_weights_update on public.workspace_split_weights;
create policy workspace_split_weights_update on public.workspace_split_weights
  for update to authenticated
  using (public.is_workspace_adult(workspace_id))
  with check (public.is_workspace_adult(workspace_id));

drop policy if exists workspace_split_weights_delete on public.workspace_split_weights;
create policy workspace_split_weights_delete on public.workspace_split_weights
  for delete to authenticated
  using (public.is_workspace_adult(workspace_id));

-- A regra da parcelada mora no plano: um array de `{ user_id, weight }`. Nulo
-- vale os pesos da carteira; quem não está no array não tem parte.
alter table public.workspace_installment_plans
  add column if not exists split_weights jsonb
    constraint workspace_installment_plans_split_weights_array
    check (split_weights is null or pg_catalog.jsonb_typeof(split_weights) = 'array');

-- Ruling 5: os pesos do plano são validados na escrita — um array de
-- `{ user_id, weight }`, cada `user_id` um adulto da carteira, `weight` um
-- número > 0, sem repetir pessoa. Um valor ruim não chega ao cron das parcelas.
create or replace function public.validar_pesos_do_plano()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.split_weights is null then
    return new;
  end if;
  if pg_catalog.jsonb_typeof(new.split_weights) <> 'array'
     or pg_catalog.jsonb_array_length(new.split_weights) = 0
     or exists (
       select 1 from pg_catalog.jsonb_array_elements(new.split_weights) e
       where pg_catalog.jsonb_typeof(e) <> 'object'
         or pg_catalog.jsonb_typeof(e -> 'weight') <> 'number'
         or coalesce(e ->> 'user_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
     ) then
    raise exception 'PESOS_INVALIDOS' using errcode = '22023';
  end if;
  -- As conversões só correm depois da forma conferida acima.
  if exists (
       select 1 from pg_catalog.jsonb_array_elements(new.split_weights) e
       where (e ->> 'weight')::numeric <= 0
         or not exists (
           select 1 from public.workspace_members wm
           where wm.workspace_id = new.workspace_id
             and wm.user_id = (e ->> 'user_id')::uuid
             and wm.role in ('owner', 'member')
         )
     ) or (
       select count(distinct pg_catalog.lower(e ->> 'user_id')) <> count(*)
       from pg_catalog.jsonb_array_elements(new.split_weights) e
     ) then
    raise exception 'PESOS_INVALIDOS' using errcode = '22023';
  end if;
  return new;
end;
$$;

revoke all on function public.validar_pesos_do_plano() from public, anon, authenticated;

drop trigger if exists validar_pesos_do_plano on public.workspace_installment_plans;
create trigger validar_pesos_do_plano
  before insert or update of split_weights, workspace_id on public.workspace_installment_plans
  for each row execute function public.validar_pesos_do_plano();

-- 4. as partes ----------------------------------------------------------------
-- Só o banco escreve: o gatilho e o `definir_partes`. O adulto lê.
create table if not exists public.transaction_shares (
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  user_id uuid not null,
  amount numeric(15, 2) not null,
  primary key (transaction_id, user_id)
);

create index if not exists idx_transaction_shares_user_id on public.transaction_shares (user_id);

alter table public.transaction_shares enable row level security;
revoke all on public.transaction_shares from anon;
revoke insert, update, delete, truncate on public.transaction_shares from authenticated;

drop policy if exists transaction_shares_select on public.transaction_shares;
create policy transaction_shares_select on public.transaction_shares
  for select to authenticated
  using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_shares.transaction_id
        and public.is_workspace_adult(t.workspace_id)
    )
  );

-- O algoritmo da Decisão 5, num lugar só:
--   1. em centavos;
--   2. a parte de cada um é `floor(total * peso / soma_pesos)`;
--   3. os centavos que sobram vão inteiros para quem pagou;
--   4. se quem pagou não está entre os pesos, o resto vai para o menor `user_id`.
create or replace function public.dividir_em_partes(p_total_centavos bigint, p_pesos jsonb, p_pagador uuid)
returns table(user_id uuid, centavos bigint)
language sql
immutable
set search_path = ''
as $$
  with pesos as (
    select (e ->> 'user_id')::uuid as user_id, (e ->> 'weight')::numeric as peso
    from pg_catalog.jsonb_array_elements(p_pesos) e
  ), base as (
    select p.user_id, pg_catalog.floor(p_total_centavos * p.peso / sum(p.peso) over ())::bigint as centavos
    from pesos p
  ), resto as (
    select p_total_centavos - sum(b.centavos)::bigint as centavos from base b
  ), quem as (
    select coalesce(
      (select b.user_id from base b where b.user_id = p_pagador),
      (select b.user_id from base b order by b.user_id limit 1)
    ) as user_id
  )
  select b.user_id, b.centavos + case when b.user_id = q.user_id then r.centavos else 0 end
  from base b
  cross join resto r
  cross join quem q;
$$;

revoke all on function public.dividir_em_partes(bigint, jsonb, uuid) from public, anon, authenticated;

-- O corpo das partes de uma despesa, chamado pelo gatilho de `transactions` e
-- pelo de `workspace_installment_plans` (Ruling 6).
--
-- Ruling 2: lê só `amount`, `paid_by`, `type`, `date`, `workspace_id`,
-- `installment_plan_id`, `is_private`, `user_id` e `shares_manual`, colunas que
-- o mascaramento do 7B não toca. Só escreve em `transaction_shares`: convive
-- com o `guardar_privado`/`guardar_privado_depois` em qualquer ordem e não
-- dispara gatilho nenhum.
--
-- A despesa ganha partes numa carteira `split`, com data a partir de
-- `split_since`, quando não é à mão. Fora disso, as automáticas saem — menos
-- numa carteira que voltou a `pooled`: trocar o modo não apaga nada, e a
-- despesa que já tinha partes as mantém em dia; a que nasce no pote único não
-- ganha nenhuma.
--
-- As partes nascem na escrita, entre os adultos daquele momento: a despesa
-- lançada antes de outro adulto entrar fica com quem estava (lacuna, Ruling 7).
-- A privada (Ruling 4) tem uma parte só, inteira do autor. Com os pesos do
-- plano que deixam quem pagou de fora, o centavo que sobra vai para o menor
-- `user_id` entre os participantes do plano, e não para quem pagou.
create or replace function public.refazer_partes(p_transaction_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_valor numeric;
  v_pagador uuid;
  v_autor uuid;
  v_tipo text;
  v_data timestamptz;
  v_ws uuid;
  v_plano uuid;
  v_privada boolean;
  v_manual boolean;
  v_modo text;
  v_desde date;
  v_pesos jsonb;
begin
  select t.amount, t.paid_by, t.user_id, t.type, t.date, t.workspace_id, t.installment_plan_id, t.is_private, t.shares_manual
  into v_valor, v_pagador, v_autor, v_tipo, v_data, v_ws, v_plano, v_privada, v_manual
  from public.transactions t
  where t.id = p_transaction_id;
  if not found or v_manual then
    return;
  end if;

  select w.split_mode, w.split_since into v_modo, v_desde
  from public.workspaces w
  where w.id = v_ws;

  if v_tipo <> 'expense'
     or v_valor <= 0
     or v_desde is null
     or (v_data at time zone 'America/Sao_Paulo')::date < v_desde then
    delete from public.transaction_shares s where s.transaction_id = p_transaction_id;
    return;
  end if;

  if v_modo is distinct from 'split'
     and not exists (select 1 from public.transaction_shares s where s.transaction_id = p_transaction_id) then
    return;
  end if;

  delete from public.transaction_shares s where s.transaction_id = p_transaction_id;

  if v_privada then
    insert into public.transaction_shares (transaction_id, user_id, amount)
    values (p_transaction_id, v_autor, v_valor);
    return;
  end if;

  -- Os pesos do plano da parcela, entre os adultos que ele cita; senão, os da
  -- carteira, entre todos os adultos. O convidado nunca tem parte. As
  -- conversões são guardadas e há um peso por pessoa: um valor ruim que
  -- escapou da validação cai nos pesos da carteira, sem derrubar o lançamento.
  select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('user_id', x.user_id, 'weight', x.weight))
  into v_pesos
  from (
    select wm.user_id, max(c.peso) as weight
    from public.workspace_installment_plans p
    cross join lateral pg_catalog.jsonb_array_elements(
      case when pg_catalog.jsonb_typeof(p.split_weights) = 'array' then p.split_weights else '[]'::jsonb end
    ) e
    cross join lateral (
      select
        case when e ->> 'user_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          then (e ->> 'user_id')::uuid end as user_id,
        case when pg_catalog.jsonb_typeof(e -> 'weight') = 'number' then (e ->> 'weight')::numeric end as peso
    ) c
    join public.workspace_members wm
      on wm.workspace_id = v_ws
     and wm.user_id = c.user_id
    where p.id = v_plano
      and wm.role in ('owner', 'member')
      and c.peso > 0
    group by wm.user_id
  ) x;

  if v_pesos is null then
    select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('user_id', wm.user_id, 'weight', coalesce(sw.weight, 1)))
    into v_pesos
    from public.workspace_members wm
    left join public.workspace_split_weights sw
      on sw.workspace_id = wm.workspace_id
     and sw.user_id = wm.user_id
    where wm.workspace_id = v_ws
      and wm.role in ('owner', 'member');
  end if;

  if v_pesos is null then
    return;
  end if;

  insert into public.transaction_shares (transaction_id, user_id, amount)
  select p_transaction_id, d.user_id, d.centavos::numeric / 100
  from public.dividir_em_partes(pg_catalog.round(v_valor * 100)::bigint, v_pesos, v_pagador) d;
end;
$$;

revoke all on function public.refazer_partes(uuid) from public, anon, authenticated;

-- Mudar de carteira começa do zero: as partes da outra casa saem antes, e o
-- pote único de destino não as mantém.
create or replace function public.gerar_partes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.workspace_id is distinct from old.workspace_id then
    delete from public.transaction_shares s where s.transaction_id = new.id;
  end if;
  perform public.refazer_partes(new.id);
  return null;
end;
$$;

revoke all on function public.gerar_partes() from public, anon, authenticated;

-- `date`, `shares_manual` e `is_private` entram na lista: a despesa que muda
-- de dia cruza o `split_since`, o `definir_partes(…, null)` volta ao
-- automático por aqui, e marcar como privada a deixa só com o autor.
drop trigger if exists gerar_partes on public.transactions;
create trigger gerar_partes
  after insert or update of amount, paid_by, type, date, workspace_id, installment_plan_id, shares_manual, is_private
  on public.transactions
  for each row execute function public.gerar_partes();

-- Ruling 6: a regra da parcelada mora no plano. Mudar os pesos refaz as partes
-- automáticas das parcelas dele; as escritas à mão ficam. A tela grava os
-- pesos logo depois de criar o plano (o `criar_plano_parcelado` não muda de
-- assinatura: o `main` o chama). Apagar o plano solta as parcelas
-- (`set null`), e elas passam aos pesos da carteira (lacuna).
create or replace function public.refazer_partes_do_plano()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  for v_id in
    select t.id from public.transactions t
    where t.installment_plan_id = new.id
      and not t.shares_manual
  loop
    perform public.refazer_partes(v_id);
  end loop;
  return null;
end;
$$;

revoke all on function public.refazer_partes_do_plano() from public, anon, authenticated;

drop trigger if exists refazer_partes_do_plano on public.workspace_installment_plans;
create trigger refazer_partes_do_plano
  after update of split_weights on public.workspace_installment_plans
  for each row
  when (new.split_weights is distinct from old.split_weights)
  execute function public.refazer_partes_do_plano();

-- As partes à mão: `p_partes` é um array de `{ user_id, amount }` entre os
-- adultos, que soma o valor exato. Nulo volta ao automático.
create or replace function public.definir_partes(p_transaction_id uuid, p_partes jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ws uuid;
  v_privada boolean;
  v_valor numeric;
  v_tipo text;
  v_data timestamptz;
  v_desde date;
  v_soma numeric;
begin
  select t.workspace_id, t.is_private, t.amount, t.type, t.date
  into v_ws, v_privada, v_valor, v_tipo, v_data
  from public.transactions t
  where t.id = p_transaction_id;

  if v_ws is null or not public.is_workspace_adult(v_ws) then
    raise exception 'not a workspace adult' using errcode = '42501';
  end if;
  -- Ruling 4: a privada fica inteira com o autor; ninguém a divide à mão.
  if v_privada then
    raise exception 'PRIVADO_NAO_PERMITIDO' using errcode = 'P0001';
  end if;

  if p_partes is null then
    update public.transactions set shares_manual = false where id = p_transaction_id;
    return;
  end if;

  select w.split_since into v_desde from public.workspaces w where w.id = v_ws;
  if v_tipo <> 'expense' or v_desde is null or (v_data at time zone 'America/Sao_Paulo')::date < v_desde then
    raise exception 'PARTES_FORA_DA_DIVISAO' using errcode = 'P0001';
  end if;

  if pg_catalog.jsonb_typeof(p_partes) <> 'array' or pg_catalog.jsonb_array_length(p_partes) = 0 then
    raise exception 'PARTES_INVALIDAS' using errcode = '22023';
  end if;
  if exists (
    select 1 from pg_catalog.jsonb_array_elements(p_partes) e
    where (e ->> 'amount')::numeric is null
      or (e ->> 'amount')::numeric < 0
      or (e ->> 'amount')::numeric <> pg_catalog.round((e ->> 'amount')::numeric, 2)
      or not exists (
        select 1 from public.workspace_members wm
        where wm.workspace_id = v_ws
          and wm.user_id = (e ->> 'user_id')::uuid
          and wm.role in ('owner', 'member')
      )
  ) or (
    select count(distinct e ->> 'user_id') <> count(*) from pg_catalog.jsonb_array_elements(p_partes) e
  ) then
    raise exception 'PARTES_INVALIDAS' using errcode = '22023';
  end if;

  select sum((e ->> 'amount')::numeric) into v_soma from pg_catalog.jsonb_array_elements(p_partes) e;
  if v_soma is distinct from v_valor then
    raise exception 'PARTES_NAO_FECHAM' using errcode = 'P0001';
  end if;

  -- Primeiro a marca: o gatilho das partes vê a linha à mão e não a refaz.
  update public.transactions set shares_manual = true where id = p_transaction_id;
  delete from public.transaction_shares s where s.transaction_id = p_transaction_id;
  insert into public.transaction_shares (transaction_id, user_id, amount)
  select p_transaction_id, (e ->> 'user_id')::uuid, (e ->> 'amount')::numeric
  from pg_catalog.jsonb_array_elements(p_partes) e;
end;
$$;

revoke all on function public.definir_partes(uuid, jsonb) from public, anon;
grant execute on function public.definir_partes(uuid, jsonb) to authenticated;

-- 5. o acerto -----------------------------------------------------------------
-- Um pagamento entre dois adultos da carteira. Não se edita: quem errou apaga
-- o que criou e lança de novo.
create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  from_user uuid not null,
  to_user uuid not null,
  amount numeric(12, 2) not null check (amount > 0),
  settled_on date not null default public.app_today(),
  note text,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint settlements_pessoas_distintas check (from_user <> to_user)
);

create index if not exists idx_settlements_workspace_id on public.settlements (workspace_id);

alter table public.settlements enable row level security;
revoke all on public.settlements from anon;
revoke update, truncate on public.settlements from authenticated;

drop policy if exists settlements_select on public.settlements;
create policy settlements_select on public.settlements
  for select to authenticated
  using (public.is_workspace_adult(workspace_id));

drop policy if exists settlements_insert on public.settlements;
create policy settlements_insert on public.settlements
  for insert to authenticated
  with check (
    public.is_workspace_adult(workspace_id)
    and created_by = (select auth.uid())
    and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = settlements.workspace_id
        and wm.user_id = settlements.from_user
        and wm.role in ('owner', 'member')
    )
    and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = settlements.workspace_id
        and wm.user_id = settlements.to_user
        and wm.role in ('owner', 'member')
    )
  );

drop policy if exists settlements_delete on public.settlements;
create policy settlements_delete on public.settlements
  for delete to authenticated
  using (public.is_workspace_adult(workspace_id) and created_by = (select auth.uid()));

-- A carteira só de leitura (sem plano) não lança acerto, como não lança despesa.
drop trigger if exists garantir_escrita on public.settlements;
create trigger garantir_escrita before insert on public.settlements
  for each row execute function public.garantir_escrita();

-- O saldo de cada pessoa: pago − partes + acertos. Positivo, os outros devem a
-- ela. Conta só as despesas com partes a partir de `split_since`. Ruling 7:
-- lista os adultos de hoje e todo mundo que aparece nas partes, nos pagamentos
-- ou nos acertos da carteira, com `saiu` para quem não é mais adulto — assim a
-- soma dos saldos é sempre 0, e quem saiu continua na tela até acertar. O
-- convidado nunca aparece: não paga (o responsável paga por ele) nem tem parte.
create or replace function public.saldos_da_carteira(p_workspace_id uuid)
returns table(user_id uuid, pago numeric, partes numeric, acertos numeric, saldo numeric, saiu boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  if not public.is_workspace_adult(p_workspace_id) then
    raise exception 'not a workspace adult' using errcode = '42501';
  end if;

  return query
  with adultos as (
    select wm.user_id
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.role in ('owner', 'member')
  ), despesas as (
    select t.id, t.amount, t.paid_by
    from public.transactions t
    join public.workspaces w on w.id = t.workspace_id
    where t.workspace_id = p_workspace_id
      and t.type = 'expense'
      and w.split_since is not null
      and (t.date at time zone 'America/Sao_Paulo')::date >= w.split_since
      and exists (select 1 from public.transaction_shares s where s.transaction_id = t.id)
  ), pagos as (
    select d.paid_by as user_id, sum(d.amount) as valor
    from despesas d
    where d.paid_by is not null
    group by d.paid_by
  ), minhas as (
    select s.user_id, sum(s.amount) as valor
    from public.transaction_shares s
    join despesas d on d.id = s.transaction_id
    group by s.user_id
  ), acertados as (
    select x.user_id, sum(x.valor) as valor
    from (
      select st.from_user as user_id, st.amount as valor
      from public.settlements st
      where st.workspace_id = p_workspace_id
      union all
      select st.to_user as user_id, -st.amount as valor
      from public.settlements st
      where st.workspace_id = p_workspace_id
    ) x
    group by x.user_id
  ), pessoas as (
    select ad.user_id from adultos ad
    union
    select pg.user_id from pagos pg
    union
    select mi.user_id from minhas mi
    union
    select ac.user_id from acertados ac
  )
  select
    pe.user_id,
    coalesce(pg.valor, 0)::numeric,
    coalesce(mi.valor, 0)::numeric,
    coalesce(ac.valor, 0)::numeric,
    (coalesce(pg.valor, 0) - coalesce(mi.valor, 0) + coalesce(ac.valor, 0))::numeric,
    not exists (select 1 from adultos ad where ad.user_id = pe.user_id)
  from pessoas pe
  left join pagos pg on pg.user_id = pe.user_id
  left join minhas mi on mi.user_id = pe.user_id
  left join acertados ac on ac.user_id = pe.user_id
  order by pe.user_id;
end;
$$;

revoke all on function public.saldos_da_carteira(uuid) from public, anon;
grant execute on function public.saldos_da_carteira(uuid) to authenticated;

-- 6. a saída do `transaction_splits` -----------------------------------------
-- Nem o 2.0 nem o `main` a leem (levantamento §4). A conferência para a
-- migração se houver linha: apagar dado é decisão do dono, não da migração.
do $$
declare
  v_tem_linha boolean := false;
begin
  if pg_catalog.to_regclass('public.transaction_splits') is not null then
    execute 'select exists (select 1 from public.transaction_splits)' into v_tem_linha;
  end if;
  if v_tem_linha then
    raise exception 'transaction_splits tem linhas: confira antes de remover' using errcode = 'P0001';
  end if;
end;
$$;

drop table if exists public.transaction_splits;

-- Conferência para o roteiro (Foco de revisão 1), no SQL editor:
--
-- R$ 100,00 entre três adultos de peso igual: 3333, 3333 e 3334 (o centavo
-- para quem pagou, o ...02):
-- select * from public.dividir_em_partes(10000, '[
--   {"user_id":"00000000-0000-0000-0000-000000000001","weight":1},
--   {"user_id":"00000000-0000-0000-0000-000000000002","weight":1},
--   {"user_id":"00000000-0000-0000-0000-000000000003","weight":1}
-- ]'::jsonb, '00000000-0000-0000-0000-000000000002');
--
-- Pesos 2 e 1 em R$ 10,00: 666 e 334 quando quem pagou tem peso 1; 667 e 333
-- quando quem pagou tem peso 2:
-- select * from public.dividir_em_partes(1000, '[
--   {"user_id":"00000000-0000-0000-0000-000000000001","weight":2},
--   {"user_id":"00000000-0000-0000-0000-000000000002","weight":1}
-- ]'::jsonb, '00000000-0000-0000-0000-000000000002');
-- select * from public.dividir_em_partes(1000, '[
--   {"user_id":"00000000-0000-0000-0000-000000000001","weight":2},
--   {"user_id":"00000000-0000-0000-0000-000000000002","weight":1}
-- ]'::jsonb, '00000000-0000-0000-0000-000000000001');
