-- Acompanhamento do lançamento inteligente (somente leitura).
-- Parte 1: a linha de base (últimos 60 dias, por origem), para comparar antes x depois.
-- Parte 2: de onde veio a categoria das capturas do período (capture_meta.categoria).
-- Nenhum texto livre sai.

-- Parte 1
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

-- Parte 2: historico, aprendido, nome, comum, ia ou sem_registro (capturas antigas)
select
  coalesce(capture_meta->>'categoria', 'sem_registro') as categoria_veio_de,
  count(*) as total,
  round(100.0 * count(*) / sum(count(*)) over (), 1) as pct,
  round(100.0 * count(*) filter (where needs_review) / count(*), 1) as pct_a_conferir
from public.transactions
where source in ('shortcut', 'apple_pay', 'share')
  and created_at >= now() - interval '60 days'
group by 1
order by total desc;
