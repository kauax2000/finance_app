-- Linha de base do lançamento inteligente (somente leitura).
-- Últimos 60 dias, por origem: quantos lançamentos, e a fração sem categoria,
-- a conferir e sem forma de pagamento. Nenhum texto livre sai.
select
  coalesce(source, 'formulario') as origem,
  count(*) as total,
  round(100.0 * count(*) filter (where category_id is null) / count(*), 1) as pct_sem_categoria,
  round(100.0 * count(*) filter (where needs_review) / count(*), 1) as pct_a_conferir,
  round(100.0 * count(*) filter (where payment_method is null) / count(*), 1) as pct_sem_forma
from public.transactions
where created_at >= now() - interval '60 days'
group by 1
order by total desc;
