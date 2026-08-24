-- Dedupe de notificação de transação (member_expense_created).
--
-- O check aplicativo era read-then-write sem constraint: duas invocações
-- concorrentes (webhook + cliente) passavam ambas e duplicavam a notificação.
-- Além disso, o filtro por metadata->>transaction_id não tinha índice
-- (scan do histórico inteiro de notificações do usuário, por membro).
--
-- Este índice único parcial resolve os dois problemas: backstop de corrida e
-- lookup indexado para o check.

-- Limpeza de duplicatas existentes (mantém a mais antiga por destinatário/tx).
do $$
declare
  v_dupes int;
begin
  with ranked as (
    select id,
           row_number() over (
             partition by user_id, workspace_id,
                          (metadata->>'transaction_id')
             order by created_at asc, id asc
           ) as rn
    from public.notifications
    where metadata->>'kind' = 'member_expense_created'
      and metadata->>'transaction_id' is not null
  )
  delete from public.notifications n
  using ranked
  where n.id = ranked.id and ranked.rn > 1;
  get diagnostics v_dupes = row_count;
  if v_dupes > 0 then
    raise notice 'notification_tx_dedupe_index: removed % duplicate notification(s)', v_dupes;
  end if;
end;
$$;

create unique index if not exists notifications_member_expense_dedupe
  on public.notifications (user_id, workspace_id, ((metadata->>'transaction_id')))
  where metadata->>'kind' = 'member_expense_created'
    and (metadata->>'transaction_id') is not null;
