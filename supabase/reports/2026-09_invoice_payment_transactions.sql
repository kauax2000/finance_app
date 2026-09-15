-- Relatório (só leitura): lançamentos criados por "Pagar fatura" antes da
-- correção 3.4 da revisão geral.
--
-- O fluxo antigo gravava, no mesmo clique, uma despesa no próprio cartão
-- ("Fatura <cartão> · <final>") e a linha de credit_card_invoice_payments. A
-- despesa dobra a fatura seguinte e as despesas do mês. Nada aqui apaga: a
-- lista vai para revisão manual antes de qualquer exclusão em produção.

select
  t.id                          as transaction_id,
  t.workspace_id,
  t.user_id,
  t.description,
  t.amount,
  t.date,
  p.statement_close_date,
  p.paid_at,
  t.created_at                  as transaction_created_at,
  p.updated_at                  as payment_updated_at
from public.transactions t
join public.credit_cards c
  on c.id = t.payment_credit_card_id
join public.credit_card_invoice_payments p
  on p.workspace_id = t.workspace_id
 and p.credit_card_id = t.payment_credit_card_id
where t.type = 'expense'
  and t.description = 'Fatura ' || c.name || ' · ' || c.last_four
  -- os dois saem do mesmo clique; o upsert atualiza updated_at num segundo pagamento
  and least(
        abs(extract(epoch from (t.created_at - p.created_at))),
        abs(extract(epoch from (t.created_at - p.updated_at)))
      ) < 120
order by t.created_at desc;
