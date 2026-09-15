# Runbook — levar `fix/revisao-geral` para produção

A ordem importa em dois pontos: o convite perde `token_raw` e a exclusão de
conta depende do gatilho novo. Tudo abaixo roda **na ordem**.

## 0. Antes

- Backup (ou PITR anotado).
- Rodar os relatórios só de leitura e guardar o resultado **antes** de qualquer
  deploy — eles descrevem dados gravados pelos defeitos:
  - `supabase/reports/2026-09_invoice_payment_transactions.sql` — despesas
    criadas por "Pagar fatura" (3.4). Revisão manual; nada é apagado.
  - Valores mascarados lidos errado (3.1): limite R$ 10.000 virava R$ 10,
    assinatura R$ 1.299,90 virava R$ 1,30.

    ```sql
    select id, workspace_id, name, credit_limit
    from public.credit_cards
    where credit_limit is not null and credit_limit < 100;

    select id, workspace_id, name, amount
    from public.workspace_subscriptions
    where amount < 10;
    ```

- Definir `APP_BASE_URL` nos secrets das Edge Functions. Sem ele,
  `workspace-invites-create` e `workspace-invites-resend` respondem 500 (fora
  de localhost o `Origin` do chamador não é mais aceito).

## 1. Edge Functions de convite

Deploy de `workspace-invites-create`, `workspace-invites-resend` e
`workspace-invites-accept` **antes** da migração `20260915120000`. As versões
novas já não escrevem nem leem `token_raw`; as antigas quebram quando a coluna
cair.

## 2. Migrações

```
20260915100000_security_privileges_policies.sql
20260915110000_billing_anchor_timezone.sql
20260915120000_invite_token_not_stored.sql
20260915130000_account_deletion_cascade.sql
20260915140000_pay_bill_instance.sql
20260915150000_create_shared_workspace.sql
```

`supabase db push` aplica na ordem. Convites pendentes com link já enviado
continuam válidos (o hash fica); o link só não pode mais ser recuperado —
quem precisar reenvia.

## 3. Front e o resto das Edge Functions

Logo depois das migrações:

- Front: lê `pay_bill_instance` (140000) e `create_shared_workspace` (150000), e não seleciona mais `token_raw`.
- Edge Functions alteradas: `_shared` (todas que o importam), `activity-logs`,
  `credit-card-calendar-alerts`, `delete-user` (depende de 130000),
  `dispatch-notifications`, `evaluate-bills-reminders`, `evaluate-budgets`,
  `evaluate-credit-card-alerts`, `notify-transaction-created`,
  `push-subscribe`, `push-unsubscribe`, `run-recurring-billing`, `sessions`.

## 4. Conferir

- Chave anônima em RPC de cobrança é recusada:
  `POST /rest/v1/rpc/run_subscription_billing` com a `anon key` → 401/403.
- Criar um convite numa carteira compartilhada: o link aparece na resposta e
  aponta para `APP_BASE_URL`.
- Pagar uma fatura: nenhuma transação nova; a fatura sai de Contas a pagar.
- Rota inexistente responde 404.
