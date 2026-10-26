-- Bloco 7B — o titular do cartão (spec §12).
--
-- O gasto privado entre adultos que este bloco trazia saiu antes de ser
-- aplicado (Bloco 9, Decisão 1): numa carteira todo adulto vê todos os
-- gastos, e quem quer privacidade cria outra carteira. Fica o titular: a
-- conferência e o PDF da fatura de um cartão com titular são dele e do dono.
--
-- Só acrescenta: o titular nasce nulo, e o front de `main` não o manda. Até o
-- 2.0 escolher um titular, nenhuma regra daqui muda nada para quem usa o
-- `main`.

-- 1. o titular do cartão ------------------------------------------------------
-- Nulo é o "cartão da casa": nele a conferência e o PDF continuam abertos a
-- todo adulto.
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

-- 2. a conferência do cartão com titular --------------------------------------
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

-- 3. anexos -------------------------------------------------------------------
-- O PDF da fatura de um cartão com titular some para quem não é o titular nem
-- o dono. `security definer`: o total é lido sem a RLS de quem chama (a
-- ausência leria como "não oculto").
create or replace function public.anexo_oculto(p_statement_total_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.credit_card_statement_totals s
    where s.id = p_statement_total_id
      and not public.conferencia_liberada(s.workspace_id, s.credit_card_id)
  );
$$;

revoke all on function public.anexo_oculto(uuid) from public, anon;
grant execute on function public.anexo_oculto(uuid) to authenticated, service_role;

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
      and public.anexo_oculto(a.statement_total_id)
  );
$$;

revoke all on function public.objeto_de_anexo_oculto(text) from public, anon;
grant execute on function public.objeto_de_anexo_oculto(text) to authenticated, service_role;

-- O estado final do 7A, com o oculto por fora dos dois ramos: a fatura de um
-- cartão com titular some também para o adulto que subiu o PDF dela.
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
    and not public.anexo_oculto(statement_total_id)
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
    and not public.anexo_oculto(statement_total_id)
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
    and not public.anexo_oculto(statement_total_id)
  );

-- No storage, o estado final do 7A com o oculto antes da pasta. O objeto
-- órfão (a linha de `attachments` sumiu: o cartão apagado levou a fatura, o
-- insert da linha foi recusado) fica fechado até o
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
    raise notice 'titular: sem privilégio para as políticas de storage.objects; aplique pelo SQL editor do Dashboard.';
end;
$$;
