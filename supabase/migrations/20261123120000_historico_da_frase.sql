-- O lançamento inteligente (a frase no app e o Atalho, pela Edge `capture`)
-- aprende a categoria com o que a pessoa já lançou: 24 meses da carteira,
-- agrupados pelo que o voto lê, com a contagem (`n`) e a data mais recente.
-- Agrupado, cabe numa leitura só o que 300 linhas cruas não cobriam.
-- Invoker: a RLS de `transactions` decide o que cada um vê. A Edge chama com
-- o service_role e passa `p_user_id` na carteira em que a pessoa é convidada
-- (só os lançamentos dela, como antes).
create or replace function public.historico_da_frase(p_workspace_id uuid, p_user_id uuid default null)
returns table (
  description text,
  type text,
  category_id uuid,
  payment_method text,
  payment_credit_card_id uuid,
  date timestamptz,
  n integer
)
language sql
stable
security invoker
set search_path = public
as $$
  select t.description, t.type, t.category_id, t.payment_method, t.payment_credit_card_id,
         max(t.date), count(*)::integer
  from public.transactions t
  where t.workspace_id = p_workspace_id
    and t.date >= now() - interval '24 months'
    and (p_user_id is null or t.user_id = p_user_id)
  group by t.description, t.type, t.category_id, t.payment_method, t.payment_credit_card_id
  order by max(t.date) desc
  limit 2000;
$$;

revoke all on function public.historico_da_frase(uuid, uuid) from public, anon;
grant execute on function public.historico_da_frase(uuid, uuid) to authenticated, service_role;
