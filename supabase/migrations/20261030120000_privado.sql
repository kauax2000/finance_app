-- Bloco 7B — Gasto privado entre adultos e titular do cartão (spec §12).
--
-- Só acrescenta: as colunas novas têm padrão (`is_private` falso, titular
-- nulo), e o front de `main` não manda nenhuma das duas. Até o 2.0 marcar uma
-- compra como privada ou escolher um titular, nenhuma regra daqui muda nada
-- para quem usa o `main`.
--
-- O privado é a compra do adulto paga por Pix, débito ou dinheiro, ou num
-- cartão cujo titular é ele. O valor continua na linha (e em todos os totais);
-- a descrição, a categoria e o `capture_meta` moram em `transacoes_privadas`,
-- que só o autor lê. Na linha fica a palavra fixa 'Gasto pessoal'.

-- 1. o titular do cartão ------------------------------------------------------
-- Nulo é o "cartão da casa": nele o privado não vale, e a conferência e o PDF
-- continuam abertos a todo adulto.
alter table public.credit_cards
  add column if not exists holder_user_id uuid references auth.users(id) on delete set null;

create index if not exists credit_cards_holder_user_id_idx
  on public.credit_cards (holder_user_id) where holder_user_id is not null;

-- O titular é adulto da carteira do cartão, e só o dono o define ou troca
-- (Ruling 4): trocar o titular é trocar quem lê a fatura. O titular atual só
-- pode limpar o próprio. Quem chama sem sessão (a service role) passa.
-- Gatilho, e não só política: vale também para quem grava sem RLS, e o
-- update de cartão é de todo adulto. `security definer`: lê
-- `workspace_members` sem depender da RLS de quem grava.
create or replace function public.conferir_titular()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is not null
     and not public.is_workspace_owner(new.workspace_id)
     and not (
       tg_op = 'UPDATE'
       and new.holder_user_id is null
       and old.holder_user_id = v_uid
     ) then
    raise exception 'TITULAR_SO_DONO' using errcode = 'P0001';
  end if;

  if new.holder_user_id is not null and not exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = new.workspace_id
      and wm.user_id = new.holder_user_id
      and wm.role in ('owner', 'member')
  ) then
    raise exception 'TITULAR_NAO_ADULTO' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function public.conferir_titular() from public, anon, authenticated;

-- O insert só com titular; o update também quando ele vira nulo (o titular
-- tirado é uma troca).
drop trigger if exists conferir_titular on public.credit_cards;
create trigger conferir_titular
  before insert on public.credit_cards
  for each row
  when (new.holder_user_id is not null)
  execute function public.conferir_titular();

drop trigger if exists conferir_titular_troca on public.credit_cards;
create trigger conferir_titular_troca
  before update of holder_user_id, workspace_id on public.credit_cards
  for each row
  when (new.holder_user_id is distinct from old.holder_user_id or new.workspace_id is distinct from old.workspace_id)
  execute function public.conferir_titular();

-- 2. o privado na linha -------------------------------------------------------
alter table public.transactions
  add column if not exists is_private boolean not null default false;

-- 3. os detalhes, fora da linha da casa ---------------------------------------
-- Uma linha por transação privada. Só o autor lê e escreve (`user_id`); quem
-- grava pelo caminho normal é o gatilho abaixo, ao marcar e ao editar.
create table if not exists public.transacoes_privadas (
  transaction_id uuid primary key references public.transactions(id) on delete cascade,
  workspace_id uuid not null,
  user_id uuid not null,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  capture_meta jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_transacoes_privadas_updated_at on public.transacoes_privadas;
create trigger set_transacoes_privadas_updated_at before update on public.transacoes_privadas
  for each row execute function public.set_updated_at();

alter table public.transacoes_privadas enable row level security;
revoke all on public.transacoes_privadas from anon;
revoke truncate on public.transacoes_privadas from authenticated;

drop policy if exists transacoes_privadas_select on public.transacoes_privadas;
create policy transacoes_privadas_select on public.transacoes_privadas
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Escrever direto só na própria transação: ninguém pendura detalhe na de outro.
drop policy if exists transacoes_privadas_insert on public.transacoes_privadas;
create policy transacoes_privadas_insert on public.transacoes_privadas
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.transactions t
      where t.id = transacoes_privadas.transaction_id
        and t.user_id = (select auth.uid())
        and t.workspace_id = transacoes_privadas.workspace_id
    )
  );

drop policy if exists transacoes_privadas_update on public.transacoes_privadas;
create policy transacoes_privadas_update on public.transacoes_privadas
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.transactions t
      where t.id = transacoes_privadas.transaction_id
        and t.user_id = (select auth.uid())
        and t.workspace_id = transacoes_privadas.workspace_id
    )
  );

drop policy if exists transacoes_privadas_delete on public.transacoes_privadas;
create policy transacoes_privadas_delete on public.transacoes_privadas
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- 4. o gatilho do privado -----------------------------------------------------
-- Vale para todo caminho de escrita (cliente, RPC `security definer`, service
-- role): é a garantia, e a tela só explica antes (Ruling 3).
--
-- Antes de gravar (`guardar_privado`):
-- - confere onde o privado vale e recusa com PRIVADO_NAO_PERMITIDO: despesa
--   de adulto da carteira (o papel do autor, lido direto: o
--   `is_workspace_adult` lê `auth.uid()`, nulo na service role), paga por
--   Pix, débito ou dinheiro, ou num cartão cujo titular é o autor; sem
--   assinatura, parcelamento nem instância de conta ligada. O `project_id` do
--   7C entra aqui quando a coluna existir (Ruling 2);
-- - só o autor marca, edita ou desmarca (quem chama sem sessão, a service
--   role, passa);
-- - move a descrição, a categoria e o `capture_meta` para
--   `transacoes_privadas` e mascara a linha; ao desmarcar, devolve-os e apaga
--   a linha de lá.
--
-- Num insert a transação ainda não existe, e a chave estrangeira de
-- `transacoes_privadas` recusaria a linha: o gatilho de antes guarda os
-- detalhes numa configuração local da transação (`set_config(..., true)`),
-- e o de depois (`guardar_privado_depois`) os grava e limpa. A chave é a
-- carteira com o `client_id` (ou o `id`): no upsert que cai no conflito
-- (`onConflict: workspace_id,client_id`), o `excluded` já chega mascarado ao
-- update, e é por ela que o update acha o que a pessoa mandou.
--
-- Na edição de uma privada, o campo que veio diferente do da linha (a
-- máscara) é o novo; o igual fica como está em `transacoes_privadas`. Assim
-- o `main`, que devolve a máscara, não apaga o original.
-- ponytail: por isso, numa privada, limpar a categoria (nulo, igual à
-- máscara) não limpa; quem precisar desmarca, ou edita em
-- `transacoes_privadas`.
--
-- Nenhum dos dois escreve em `transactions`: não há recursão.
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
    -- O autor não troca (o `preserve_row_author` roda depois deste).
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

create or replace function public.guardar_privado_depois()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_chave text := 'privado.t' || pg_catalog.md5(new.workspace_id::text || ':' || coalesce(new.client_id::text, new.id::text));
  v_enviado jsonb := nullif(pg_catalog.current_setting(v_chave, true), '')::jsonb;
begin
  perform pg_catalog.set_config(v_chave, '', true);
  insert into public.transacoes_privadas (transaction_id, workspace_id, user_id, description, category_id, capture_meta)
  values (
    new.id, new.workspace_id, new.user_id,
    v_enviado ->> 'description',
    (v_enviado ->> 'category_id')::uuid,
    nullif(v_enviado -> 'capture_meta', 'null'::jsonb)
  )
  on conflict (transaction_id) do update
    set workspace_id = excluded.workspace_id,
        user_id = excluded.user_id,
        description = excluded.description,
        category_id = excluded.category_id,
        capture_meta = excluded.capture_meta;
  return null;
end;
$$;

revoke all on function public.guardar_privado() from public, anon, authenticated;
revoke all on function public.guardar_privado_depois() from public, anon, authenticated;

-- A lista de colunas inclui os vínculos e o tipo: ligar uma assinatura ou um
-- parcelamento a uma privada que já existe (o `virar_assinatura`) também cai
-- aqui.
drop trigger if exists guardar_privado on public.transactions;
create trigger guardar_privado
  before insert or update of is_private, description, category_id, capture_meta, payment_method, payment_credit_card_id,
    subscription_id, installment_plan_id, type, workspace_id
  on public.transactions
  for each row execute function public.guardar_privado();

drop trigger if exists guardar_privado_depois on public.transactions;
create trigger guardar_privado_depois
  after insert on public.transactions
  for each row
  when (new.is_private)
  execute function public.guardar_privado_depois();

-- A conta ligada mora em `bill_instances.transaction_id`: o gatilho de
-- `transactions` não a vê nascer. Ligar uma instância a uma privada
-- (`pay_bill_instance`, `ligar_pagamento_da_conta`, `virar_conta`) é recusado
-- aqui.
create or replace function public.recusar_conta_na_privada()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.transactions t
    where t.id = new.transaction_id
      and t.is_private
  ) then
    raise exception 'PRIVADO_NAO_PERMITIDO' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function public.recusar_conta_na_privada() from public, anon, authenticated;

drop trigger if exists recusar_conta_na_privada on public.bill_instances;
create trigger recusar_conta_na_privada
  before insert or update of transaction_id on public.bill_instances
  for each row
  when (new.transaction_id is not null)
  execute function public.recusar_conta_na_privada();

-- 5. transactions: só o autor mexe na privada ---------------------------------
-- O estado final do 7A (20261029120000), com `(not is_private or user_id =
-- auth.uid())` no ramo do adulto do update e do delete: um membro no `main`
-- não mexe na privada de outro, nem pelo `update` direto. O ramo do convidado
-- fica como está (só as dele, e só despesa). O select e o insert não mudam:
-- todo adulto vê a linha mascarada, e o valor entra nos totais.
drop policy if exists "Workspace members can update transactions" on public.transactions;
create policy "Workspace members can update transactions" on public.transactions
  for update
  using (
    (public.is_workspace_adult(workspace_id) and (not is_private or user_id = (select auth.uid())))
    or (user_id = (select auth.uid()) and public.is_workspace_member(workspace_id))
  )
  with check (
    (public.is_workspace_adult(workspace_id) and (not is_private or user_id = (select auth.uid())))
    or (user_id = (select auth.uid()) and public.is_workspace_member(workspace_id) and type = 'expense')
  );

drop policy if exists "Workspace members can delete transactions" on public.transactions;
create policy "Workspace members can delete transactions" on public.transactions
  for delete
  using (
    (public.is_workspace_adult(workspace_id) and (not is_private or user_id = (select auth.uid())))
    or (user_id = (select auth.uid()) and public.is_workspace_member(workspace_id))
  );

-- 6. a conferência do cartão com titular --------------------------------------
-- Num cartão com titular, o total do banco e o PDF da fatura são do titular e
-- do dono. No cartão da casa (titular nulo), de todo adulto, como hoje.
-- `security definer`: o cartão é lido sem depender da RLS de quem chama.
create or replace function public.conferencia_liberada(p_workspace_id uuid, p_credit_card_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_workspace_owner(p_workspace_id)
    or not exists (
      select 1 from public.credit_cards c
      where c.id = p_credit_card_id
        and c.holder_user_id is not null
        and c.holder_user_id is distinct from (select auth.uid())
    );
$$;

revoke all on function public.conferencia_liberada(uuid, uuid) from public, anon;
grant execute on function public.conferencia_liberada(uuid, uuid) to authenticated, service_role;

-- As quatro do 7A (só o adulto, o autor no insert), com a conferência. `to
-- authenticated`: o anon não executa o helper, e sem política vê vazio.
drop policy if exists "Workspace members can view credit_card_statement_totals" on public.credit_card_statement_totals;
create policy "Workspace members can view credit_card_statement_totals" on public.credit_card_statement_totals
  for select to authenticated
  using (public.is_workspace_adult(workspace_id) and public.conferencia_liberada(workspace_id, credit_card_id));
drop policy if exists "Workspace members can insert credit_card_statement_totals" on public.credit_card_statement_totals;
create policy "Workspace members can insert credit_card_statement_totals" on public.credit_card_statement_totals
  for insert to authenticated
  with check (
    public.is_workspace_adult(workspace_id)
    and created_by = (select auth.uid())
    and public.conferencia_liberada(workspace_id, credit_card_id)
  );
drop policy if exists "Workspace members can update credit_card_statement_totals" on public.credit_card_statement_totals;
create policy "Workspace members can update credit_card_statement_totals" on public.credit_card_statement_totals
  for update to authenticated
  using (public.is_workspace_adult(workspace_id) and public.conferencia_liberada(workspace_id, credit_card_id))
  with check (public.is_workspace_adult(workspace_id) and public.conferencia_liberada(workspace_id, credit_card_id));
drop policy if exists "Workspace members can delete credit_card_statement_totals" on public.credit_card_statement_totals;
create policy "Workspace members can delete credit_card_statement_totals" on public.credit_card_statement_totals
  for delete to authenticated
  using (public.is_workspace_adult(workspace_id) and public.conferencia_liberada(workspace_id, credit_card_id));

-- 7. anexos -------------------------------------------------------------------
-- O anexo some para quem não é o autor da privada, e o da fatura de um cartão
-- com titular, para quem não é o titular nem o dono. `security definer`: a
-- transação e o total são lidos sem a RLS de quem chama (o convidado não vê a
-- linha de outro, e a resposta seria "não oculto").
create or replace function public.anexo_oculto(p_transaction_id uuid, p_statement_total_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
      select 1 from public.transactions t
      where t.id = p_transaction_id
        and t.is_private
        and t.user_id is distinct from (select auth.uid())
    )
    or exists (
      select 1 from public.credit_card_statement_totals s
      where s.id = p_statement_total_id
        and not public.conferencia_liberada(s.workspace_id, s.credit_card_id)
    );
$$;

revoke all on function public.anexo_oculto(uuid, uuid) from public, anon;
grant execute on function public.anexo_oculto(uuid, uuid) to authenticated, service_role;

-- No storage o objeto é achado pelo caminho, sem a RLS de `attachments` (que
-- já esconde a linha, e a ausência leria como "não oculto").
create or replace function public.objeto_de_anexo_oculto(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.attachments a
    where a.path = p_name
      and public.anexo_oculto(a.transaction_id, a.statement_total_id)
  );
$$;

revoke all on function public.objeto_de_anexo_oculto(text) from public, anon;
grant execute on function public.objeto_de_anexo_oculto(text) to authenticated, service_role;

-- O estado final do 7A, com o oculto por fora dos dois ramos: o ramo do
-- convidado também vale para o adulto (`created_by`), e o anexo que ele subiu
-- na compra de outra pessoa, depois marcada privada, some para ele também.
drop policy if exists "Workspace members can view attachments" on public.attachments;
create policy "Workspace members can view attachments" on public.attachments
  for select to authenticated
  using (
    (
      public.is_workspace_adult(workspace_id)
      or (
        public.is_workspace_member(workspace_id)
        and (
          created_by = (select auth.uid())
          or exists (
            select 1 from public.transactions t
            where t.id = attachments.transaction_id
              and t.user_id = (select auth.uid())
          )
        )
      )
    )
    and not public.anexo_oculto(transaction_id, statement_total_id)
  );

drop policy if exists "Workspace members can insert attachments" on public.attachments;
create policy "Workspace members can insert attachments" on public.attachments
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (
      public.is_workspace_adult(workspace_id)
      or (
        public.is_workspace_member(workspace_id)
        and bill_instance_id is null
        and statement_total_id is null
        and exists (
          select 1 from public.transactions t
          where t.id = attachments.transaction_id
            and t.user_id = (select auth.uid())
        )
      )
    )
    and not public.anexo_oculto(transaction_id, statement_total_id)
  );

drop policy if exists "Workspace members can delete attachments" on public.attachments;
create policy "Workspace members can delete attachments" on public.attachments
  for delete to authenticated
  using (
    (
      public.is_workspace_adult(workspace_id)
      or (
        public.is_workspace_member(workspace_id)
        and (
          created_by = (select auth.uid())
          or exists (
            select 1 from public.transactions t
            where t.id = attachments.transaction_id
              and t.user_id = (select auth.uid())
          )
        )
      )
    )
    and not public.anexo_oculto(transaction_id, statement_total_id)
  );

-- No storage, o estado final do 7A com o oculto antes da pasta. O objeto
-- órfão (a linha de `attachments` sumiu: o cartão apagado levou a fatura, o
-- `main` apagou a privada, o insert da linha foi recusado) fica fechado até o
-- `attachments-cleanup`, menos para quem o subiu (`owner_id`) e para o dono da
-- carteira. O `exists` roda com a RLS de quem chama, que já aplica o
-- `anexo_oculto`. O upload sobe o objeto antes da linha, e quem sobe é o
-- `owner_id`; a captura e a limpeza são da service role, sem RLS. O upload
-- (membro da pasta) fica como está: a linha é que o insert acima barra.
-- Guardado como em 20261022130000.
do $$
begin
  drop policy if exists "Workspace members can view attachments" on storage.objects;
  create policy "Workspace members can view attachments" on storage.objects
    for select to authenticated
    using (bucket_id = 'attachments' and not public.objeto_de_anexo_oculto(objects.name)
      and (
        owner_id = (select auth.uid())::text
        or exists (
          select 1 from public.attachments a
          where a.path = objects.name
        )
        or case when (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          then public.is_workspace_owner(((storage.foldername(name))[1])::uuid)
          else false end
      )
      and case when (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.is_workspace_adult(((storage.foldername(name))[1])::uuid)
        or (
          public.is_workspace_member(((storage.foldername(name))[1])::uuid)
          and (
            owner_id = (select auth.uid())::text
            or exists (
              select 1 from public.attachments a
              where a.path = objects.name
                and (
                  a.created_by = (select auth.uid())
                  or exists (
                    select 1 from public.transactions t
                    where t.id = a.transaction_id
                      and t.user_id = (select auth.uid())
                  )
                )
            )
          )
        )
      else false end);

  drop policy if exists "Workspace members can delete attachments" on storage.objects;
  create policy "Workspace members can delete attachments" on storage.objects
    for delete to authenticated
    using (bucket_id = 'attachments' and not public.objeto_de_anexo_oculto(objects.name)
      and (
        owner_id = (select auth.uid())::text
        or exists (
          select 1 from public.attachments a
          where a.path = objects.name
        )
        or case when (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          then public.is_workspace_owner(((storage.foldername(name))[1])::uuid)
          else false end
      )
      and case when (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.is_workspace_adult(((storage.foldername(name))[1])::uuid)
        or (
          public.is_workspace_member(((storage.foldername(name))[1])::uuid)
          and (
            owner_id = (select auth.uid())::text
            or exists (
              select 1 from public.attachments a
              where a.path = objects.name
                and (
                  a.created_by = (select auth.uid())
                  or exists (
                    select 1 from public.transactions t
                    where t.id = a.transaction_id
                      and t.user_id = (select auth.uid())
                  )
                )
            )
          )
        )
      else false end);
exception
  when insufficient_privilege then
    raise notice 'privado: sem privilégio para as políticas de storage.objects; aplique pelo SQL editor do Dashboard.';
end;
$$;

-- 8. virar assinatura ou conta deixa a privada de fora -----------------------
-- O insight criado antes de a compra virar privada ainda lista o id dela em
-- `payload.lancamentos`. Sem o filtro, o `guardar_privado` (assinatura) e o
-- `recusar_conta_na_privada` (conta) abortavam a ação inteira. Os corpos de
-- 20261028120000, com `not is_private` entre os candidatos.
create or replace function public.virar_assinatura(p_insight_id uuid, p_nome text, p_valor numeric, p_dia smallint, p_payment_method text, p_card_id uuid, p_category_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_ins public.insights%rowtype;
  v_hoje date := public.app_today();
  v_mes date := date_trunc('month', public.app_today())::date;
  v_next date;
  v_sub uuid;
  v_pedidos uuid[];
begin
  if nullif(btrim(p_nome), '') is null then
    raise exception 'INSIGHT_NOME_INVALIDO' using errcode = '22023';
  end if;
  if p_dia is null or p_dia not between 1 and 31 then
    raise exception 'INSIGHT_DIA_INVALIDO' using errcode = '22023';
  end if;
  if p_valor is null or p_valor <= 0 then
    raise exception 'INSIGHT_VALOR_INVALIDO' using errcode = '22023';
  end if;

  select * into v_ins from public.insights where id = p_insight_id;
  if not found then
    raise exception 'INSIGHT_NAO_ENCONTRADO' using errcode = 'P0002';
  end if;
  if v_ins.kind <> 'recorrencia' then
    raise exception 'INSIGHT_TIPO_INVALIDO' using errcode = '22023';
  end if;

  perform public.marcar_insight(p_insight_id, 'acted');

  select coalesce(array_agg(e::uuid), '{}')
  into v_pedidos
  from jsonb_array_elements_text(coalesce(v_ins.payload -> 'lancamentos', '[]'::jsonb)) e;

  perform 1 from public.transactions t where t.id = any(v_pedidos) for update;

  v_next := v_mes + (least(p_dia::int, extract(day from (v_mes + interval '1 month - 1 day'))::int) - 1);
  if v_next <= v_hoje then
    v_mes := (v_mes + interval '1 month')::date;
    v_next := v_mes + (least(p_dia::int, extract(day from (v_mes + interval '1 month - 1 day'))::int) - 1);
  end if;

  insert into public.workspace_subscriptions (
    workspace_id, user_id, name, amount, billing_interval, start_date, next_billing_date,
    billing_anchor_day, category_id, payment_method, payment_credit_card_id, kind, is_active
  ) values (
    v_ins.workspace_id, (select auth.uid()), p_nome, p_valor, 'monthly', v_next, v_next,
    p_dia, p_category_id, p_payment_method,
    case when p_payment_method = 'credit_card' then p_card_id end,
    'expense', true
  )
  returning id into v_sub;

  update public.transactions t
  set subscription_id = v_sub
  where t.id in (
      select distinct on ((x.date at time zone 'UTC')::date) x.id
      from public.transactions x
      where x.id = any(v_pedidos)
        and x.workspace_id = v_ins.workspace_id
        and x.type = 'expense'
        and x.subscription_id is null
        and not x.is_private
        and not exists (select 1 from public.bill_instances i where i.transaction_id = x.id)
      order by (x.date at time zone 'UTC')::date, x.id
    )
    and not exists (
      select 1 from public.transactions y
      where y.subscription_id = v_sub
        and (y.date at time zone 'UTC')::date = (t.date at time zone 'UTC')::date
    );

  return v_sub;
end;
$$;

revoke all on function public.virar_assinatura(uuid, text, numeric, smallint, text, uuid, uuid) from public, anon;
grant execute on function public.virar_assinatura(uuid, text, numeric, smallint, text, uuid, uuid) to authenticated;

create or replace function public.virar_conta(p_insight_id uuid, p_nome text, p_dia smallint, p_valor_variavel boolean, p_category_id uuid, p_next_due_date date)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_ins public.insights%rowtype;
  v_pedidos uuid[];
  v_ids uuid[];
  v_bill uuid;
begin
  if nullif(btrim(p_nome), '') is null then
    raise exception 'INSIGHT_NOME_INVALIDO' using errcode = '22023';
  end if;
  if p_dia is null or p_dia not between 1 and 31 then
    raise exception 'INSIGHT_DIA_INVALIDO' using errcode = '22023';
  end if;
  -- A próxima pendente vem do cliente (Ruling 1), mas nunca nasce atrasada.
  if p_next_due_date is null or p_next_due_date < public.app_today() then
    raise exception 'INSIGHT_DATA_INVALIDA' using errcode = '22023';
  end if;

  select * into v_ins from public.insights where id = p_insight_id;
  if not found then
    raise exception 'INSIGHT_NAO_ENCONTRADO' using errcode = 'P0002';
  end if;
  if v_ins.kind not in ('recorrencia', 'sazonal') then
    raise exception 'INSIGHT_TIPO_INVALIDO' using errcode = '22023';
  end if;

  perform public.marcar_insight(p_insight_id, 'acted');

  select coalesce(array_agg(e::uuid), '{}')
  into v_pedidos
  from jsonb_array_elements_text(coalesce(v_ins.payload -> 'lancamentos', '[]'::jsonb)) e;

  perform 1 from public.transactions t where t.id = any(v_pedidos) for update;

  select coalesce(array_agg(t.id), '{}')
  into v_ids
  from public.transactions t
  where t.id = any(v_pedidos)
    and t.workspace_id = v_ins.workspace_id
    and t.type = 'expense'
    and t.subscription_id is null
    and not t.is_private
    and not exists (select 1 from public.bill_instances i where i.transaction_id = t.id);

  insert into public.bills (
    workspace_id, user_id, name, category_id, frequency, due_day_of_month,
    amount_estimated, start_date, default_payment_method, valor_variavel
  ) values (
    v_ins.workspace_id, (select auth.uid()), p_nome, p_category_id, 'monthly', p_dia,
    coalesce(
      (select round(avg(u.amount), 2) from (
        select t.amount from public.transactions t
        where t.id = any(v_ids)
        order by t.date desc
        limit 3
      ) u),
      (v_ins.payload ->> 'valorMedio')::numeric,
      (v_ins.payload ->> 'valor')::numeric
    ),
    coalesce(
      (select min((t.date at time zone 'UTC')::date) from public.transactions t where t.id = any(v_ids)),
      p_next_due_date,
      public.app_today()
    ),
    nullif(v_ins.payload ->> 'payment_method', 'credit_card'),
    coalesce(p_valor_variavel, false)
  )
  returning id into v_bill;

  insert into public.bill_instances (
    workspace_id, user_id, bill_id, due_date, status, amount,
    paid_at, paid_amount, payment_method, payment_credit_card_id, transaction_id
  )
  select
    v_ins.workspace_id, (select auth.uid()), v_bill, (t.date at time zone 'UTC')::date,
    'paid', t.amount, t.date, t.amount, t.payment_method, t.payment_credit_card_id, t.id
  from public.transactions t
  where t.id = any(v_ids)
  on conflict do nothing;

  if p_next_due_date is not null then
    insert into public.bill_instances (workspace_id, user_id, bill_id, due_date, status, amount)
    values (v_ins.workspace_id, (select auth.uid()), v_bill, p_next_due_date, 'pending', null)
    on conflict do nothing;
  end if;

  return v_bill;
end;
$$;

revoke all on function public.virar_conta(uuid, text, smallint, boolean, uuid, date) from public, anon;
grant execute on function public.virar_conta(uuid, text, smallint, boolean, uuid, date) to authenticated;

comment on table public.transacoes_privadas is
  'Os detalhes de uma transação privada (descrição, categoria, capture_meta). Só o autor lê. Quem grava é o gatilho guardar_privado de transactions; na linha fica ''Gasto pessoal''.';
