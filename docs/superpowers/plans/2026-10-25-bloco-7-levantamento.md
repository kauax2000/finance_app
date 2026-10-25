# Bloco 7 — levantamento do código (somente leitura)

Branch `finance-app-2.0`, 2026-10-25. Os caminhos são relativos à raiz do repo. `BL` = `supabase/migrations/00000000000000_baseline.sql`.
O grafo do graphify não indexa SQL: `graphify explain "is_workspace_member"` não encontra nada. Por isso tudo o que é migração foi lido direto do arquivo.

---

## 1. Papéis

**A coluna**
- `workspace_members.role text not null`, com `CHECK (role = ANY (ARRAY['owner','member']))`: BL:1986-1992.
- `workspace_invites.role` tem default `'member'` e `CHECK (role = 'member')`: BL:1935, BL:1946.
- No TS:
  - `WorkspaceRole = "owner" | "member"`: `src/lib/supabase.ts:372`;
  - `WorkspaceInvite.role: "member"`: `src/lib/supabase.ts:437`;
  - o tipo gerado `role: string`: `src/types/database.ts:1613`.
- **O front reduz qualquer outro valor a `member`:** `src/lib/queries/fetch-workspaces-data.ts:74-77` (`typed.role === "owner" || typed.role === "member" ? typed.role : "member"`). Em `main` é igual, nas linhas 73-75.

**Os helpers** (todos `security definer`, todos leem `auth.uid()`)
- `is_workspace_member(ws)`: existe uma linha em `workspace_members`. Não olha o papel. BL:891-901.
- `workspace_role(ws)` devolve o `role` da pessoa logada: BL:1503-1512.
- `is_workspace_owner(ws)` é `workspace_role(ws) = 'owner'`: BL:907-912.
- `workspace_has_members(ws)`: `20260915100000_security_privileges_policies.sql:77-90`.
- `workspace_member_directory(ws)`: devolve perfil sem `role`, e só para membros. BL:1484-1497.
- O trigger `workspace_members_guard` deixa as chaves imutáveis e barra a saída do último owner: `20260915100000:113-157`. A versão atual está em `20260915130000_account_deletion_cascade.sql:29-60`.

**Funções que leem `role = 'owner'` direto**
- `get_workspace_delete_impact` e `delete_workspace`: BL:563, BL:739 e `20260824151000:110`.
- `tem_cobertura`, `workspace_plan` e `avisos_de_teste_pendentes`: `20261025120000_planos.sql:107,119,195,418,425`.
- As Edges `workspace-invites-create:96` e `workspace-invites-resend:74` exigem `member.role === 'owner'`.

**Políticas de RLS por forma** (o estado final, com as substituições das migrações seguintes)

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| transactions | member (BL:3126) | member e `user_id = auth.uid()` (`20260915100000:161-164`) | member (BL:3076) | member (BL:2980) |
| categories, budgets | member | member e `user_id = uid` (`20260915100000:166-174`) | member | member |
| credit_cards, bills, bill_instances, workspace_subscriptions, workspace_installment_plans | member | member e `user_id = uid` (`20260824170000`) | member | member |
| credit_card_invoice_payments, credit_card_category_spend_alerts | member | member e `created_by = uid` | member | member |
| credit_card_statement_totals | member | member e `created_by = uid` | member | member (`20261022120000:54-72`) |
| attachments | member | member e `created_by = uid` | — | member (`20261022130000:109-122`) |
| storage `attachments` (a pasta é a carteira) | member | member | — | member (`20261022130000:134-147`) |
| transaction_splits | member, pelo `EXISTS` na transação (BL:3120) | idem | idem | idem |
| notifications | dono da linha e member (`20260824170000:43-58`) | — (service) | dono | dono |
| insights | member e (`user_id` nulo ou o próprio), fora os silenciados (`20261028120000:73-84`) | só RPC | só RPC | — |
| workspace_members | member (BL:2918) | "Creator bootstraps own workspace" (`20260915100000:94-110`) | **owner** (BL:2866, sem `WITH CHECK`) | owner (BL:2858) ou a própria linha **só se `role='member'`** (`20260824170000:198-203`) |
| workspace_invites | owner, ou o próprio e-mail pendente (`20260915110000:623-631`) | owner e `created_by` (`20260824170000:170`) | owner | — |
| workspaces | member ou `created_by` (`20260824170000:229`) | `created_by = uid` | owner (BL:2870) | owner e `type <> 'personal'` (BL:2854) |
| workspace_member_notification_prefs | o próprio e member | idem | idem | — |
| profiles, user_settings, push_subscriptions, user_sessions, user_activity_logs, insights_silenciados | o próprio | — | — | — |
| billing_*, ia_*, review_reminder_dedupe, orcamentos_copiados, insights_push_semana, capture_tokens (com a select do próprio) | RLS sem política: só a service role | | | |

**RPCs que conferem membro**
- **Membro:**
  - BL: `complete_workspace_categories_onboarding` (476), `create_workspace_installment_plan` (505), `delete_workspace_installment_plan_cascade` (614), `rpc_fetch_bills_page_bundle`, `rpc_fetch_category_detail_bundle` e `rpc_fetch_subscriptions_page_bundle` (933, 1064, 1196);
  - nas migrações: `pay_bill_instance`, `create_capture_token` (`20261023120000:52`), `criar_plano_parcelado` (`20261024120000:223`, que lê `workspace_members` direto porque roda pela service role), `garantir_orcamentos_do_mes` (`20261026120000:241`), `registrar_insight` (`20261028120000:184`), `marcar_insight` (144), e `virar_*` como invoker.
- **Owner:** só `delete_workspace` e `get_workspace_delete_impact`. Nenhuma RPC lê `member` contra `guest`.
- Os três bundles são `security invoker` (`20260824160000:24`, `20261022121000:14`, BL:1187). Leem `public.transactions` e devolvem `to_jsonb(t)` com a RLS de quem chama.

## 2. Convites

**Tabela:** `workspace_invites` (BL:1931-1948). Colunas: `invited_email` (nulo = link), `role`, `token_hash`, `status`, `max_uses` (1 com e-mail, nulo no link), `usage_count`. O `token_raw` saiu em `20260915120000`.

**Edges**
- `workspace-invites-create/index.ts`:
  - confere que é owner (88-96) e que a carteira não é pessoal (105-107), com limite de envios (114-120);
  - o link revoga os links pendentes (122-130);
  - grava **`role: 'member'` fixo** (141, 152);
  - manda o e-mail pela Resend (171-187) e registra `family_member_invited` (196-204).
- `workspace-invites-accept/index.ts` chama a RPC `accept_workspace_invite` com a service role (47), registra a atividade e avisa quem convidou por `deliverNotification` (87-113).
- `workspace-invites-resend/index.ts`: só o owner reenvia (67-74), e o assunto está na linha 131.

**RPC:** `accept_workspace_invite`, que **insere `role` fixo como `'member'`** e ignora `v_invite.role`.
- Versão atual: `20260824121000_accept_workspace_invite_rpc.sql:85-87`.
- Original: BL:154-156.

**E-mail:** `supabase/functions/_shared/workspace-invite-email.ts:87-117` (`renderInviteHtml`).
- O texto é "Você recebeu um convite" e "${inviter} convidou você para participar do workspace <strong>${workspace}</strong>".
- O assunto é `Convite para o workspace …` (create:175, resend:131).
- O remetente é `RESEND_FROM`, com fallback `onboarding@resend.dev` (31, 45).
- O texto ainda diz "workspace". Não há texto de consentimento dos pais (LGPD art. 14).

**Telas**
- `/members`: `src/app/(app)/members/page-client.tsx`. Convida por e-mail (361) ou por link (418, `invite_kind: "link"` em 431), remove membro (523-536) e mostra o selo "Owner"/"Membro" (663, 710-713).
- O diálogo global `src/components/members/workspace-invite-dialog.tsx` é aberto por `src/components/layout/global-shell-dialogs-provider.tsx:69,291`.
- O aceite: `src/app/(auth)/invites/accept/page-client.tsx`.

**O convite escolhe o papel?** Não. A tabela, a Edge e a RPC fixam `member`.

**O dono troca o papel hoje?** Não há tela. Nenhum `.update({ role` em `src/`. A política "Owners can update member roles" (BL:2866) permite pelo PostgREST, sem `WITH CHECK`, e o guard só barra tirar o último owner. A atividade `family_role_changed` já existe no check de `user_activity_logs` (BL:1862).

**O convidado não consegue sair:** a política "Members can leave" exige `workspace_role = 'member'`.

## 3. Assentos do plano (Bloco 4)

**`tem_cobertura(p_user_id)`** (`20261025120000_planos.sql:93-125`): a pessoa está coberta se estiver entre as **5 primeiras pessoas distintas, por `min(joined_at)`, fora o assinante**, somando todas as carteiras em que o assinante é `owner`. Sem filtro de papel:
```sql
join public.workspace_members m on m.workspace_id = d.workspace_id and m.user_id <> d.user_id
where d.user_id = a.assinante and d.role = 'owner'
group by m.user_id order by min(m.joined_at), m.user_id limit 5
```
Os "5" não são um limite de entrada: nada impede o 6º membro. O 6º só não ganha cobertura. O teste é `src/lib/planos/migracao-planos.test.ts:87-92`.

**O plano da pessoa e da carteira**
- `plano_do_usuario` devolve `familia` em quatro casos: `enforced_since` nulo, plano próprio, até 14 dias de teste ou cobertura. Senão, `leitura` (132-166).
- `workspace_plan(ws)` é `familia` se algum owner tiver `familia` (176-203).

**Só leitura:** o trigger `garantir_escrita` (225-283) vale só em quatro tabelas:
- `transactions`: insert, update e delete;
- `workspace_installment_plans`, `workspace_subscriptions` e `attachments`: só insert.

Ele não alcança budgets, categories, credit_cards nem members. A mensagem `workspace_somente_leitura` é tratada em `src/lib/supabase-errors.ts:37` e `src/lib/offline/handlers/by-id.ts:24`. O wireframe é `src/components/wireframe/somente-leitura-wireframe.tsx`.

**Como o convidado contaria hoje:** como pessoa coberta, ocupando 1 dos 5. Com isso:
- o filho coberto também ganha `familia` na **própria carteira pessoal**, porque a cobertura é da pessoa;
- o `role` não muda o cálculo de `workspace_plan`, que só lê os owners.

Decidir se o `guest` ocupa assento ou não.

## 4. Transações

**Colunas** (`src/types/database.ts:1180-1205`; BL:1810-1836 com as migrações):
`id, user_id, category_id, type, amount, description, date, is_recurring, recurring_interval, created_at, updated_at, workspace_id, payment_method, payment_credit_card_id, subscription_id, installment_plan_id, installment_sequence, client_id, source, needs_review, import_batch_id, capture_meta`.

**O autor é `user_id`.** Não há `created_by`.
- O INSERT exige `user_id = auth.uid()`.
- O trigger `preserve_row_author` mantém o autor original no UPDATE (`20260915100000:179-200`).
- A captura grava `user_id` = o dono do token (`supabase/functions/capture/index.ts:10`).

**Não existem** `is_private`, `paid_by`, `project_id`, `sponsor_user_id` nem `holder_user_id`. O `git grep` em todo o repo encontra esses nomes só no spec.

**`transaction_splits`** (BL:1797-1804: `transaction_id`, `category_id`, `amount`, `percentage`)
- No banco: índices (BL:2337; `20260824152000:29`), FKs (BL:2689-2695), RLS (BL:2974-3122, BL:3190) e grants (BL:3648-3650, **anon incluso**).
- Fora do banco: `src/types/database.ts:1138`, os testes pgTAP `supabase/tests/database/baseline_objects.test.sql:9` e `workspace_core_data_rls.test.sql:54-57`, e `docs/PERFORMANCE.md:51`.
- **Nenhum leitor ou escritor em `src/` nem em `functions/`, nesta branch nem em `main`** (`git grep transaction_splits main` só acha tipos, migrações, testes e docs).

**Caminhos de escrita**

*Cliente (supabase-js, RLS):*
- `src/lib/transactions/mutations.ts:67-101` (update e upsert `onConflict workspace_id,client_id`) e `:258` (delete);
- `src/lib/offline/handlers/transactions.ts:45-54` (upsert da fila offline);
- `src/components/transactions/transaction-form-persistence.ts:60-69` (update e o `evaluate-budgets`);
- `src/lib/import/importar.ts:114-133` (upsert do lote; delete para desfazer);
- `src/lib/piloto/piloto.ts:114` (delete);
- `src/components/wireframe/a-conferir-wireframe.tsx:74` (update de `needs_review`).

*SQL:*
- Assinaturas: `charge_subscription_cycle` e `seed_subscription_first_transaction`, na versão final de `20261026120000_previsao.sql:26-150`.
- Parcelas: `charge_workspace_installment_plan_step` (`20260915110000:316`) e `catch_up_recurring_billing` (413).
- Contas: `pay_bill_instance` (`20260915140000:57`).
- Parcelamento: `criar_plano_parcelado` e `create_workspace_installment_plan` (`20261024120000:112,200`).
- Ligação a insights: `virar_assinatura` e `virar_conta` (`20261028120000:262,355`), que ligam lançamentos passados.
- Ligação a contas: `ligar_pagamento_da_conta` (`20261027120000:117`).

*Triggers em `transactions`:*
- `garantir_escrita`, `origem_do_cron`, `preserve_transactions_author`, `same_ws_*` e `set_transactions_updated_at`;
- `transactions_notify_created` (`20261022120000:75-85`), que chama a Edge `notify-transaction-created` por `invoke_edge_function`;
- `reabrir_instancia_ao_apagar` e `acompanhar_valor_pago` (`20261027120000:183-225`).

*Edge:* `capture/index.ts:276-316`, pela service role (insert, update da `capture_meta`, parcelado por `criar_plano_parcelado`).

O que gerar `transaction_shares` precisa ser trigger, como pede o spec: são cinco origens diferentes, e várias rodam como `security definer` ou pela service role.

## 5. Cartões

**`credit_cards`** (BL:1719-1741, mais `wallet_alias` em `20261023120000:110-116`): `id, workspace_id, user_id (quem criou), name, last_four, brand, closing_day, due_day, credit_limit, is_active, expiry_month/year, client_id, created_at, updated_at, wallet_alias`.
- **Não há coluna de titular.** `user_id` é o criador e é exigido no insert.
- Qualquer membro atualiza e apaga.

**A conferência (Bloco 2)**
- `credit_card_statement_totals`: `bank_total` e `source` em manual, pdf, csv ou ofx; `created_by`. Está em `20261022120000:23-72` e é lida e escrita por **todos os membros**.
- `transactions.import_batch_id`, `source` e `needs_review`: mesmo arquivo, 6-20.
- `attachments`, com `statement_total_id` para o PDF da fatura (`20261022130000:19-35`):
  - **todos os membros** veem e apagam (109-122);
  - no storage, as políticas por pasta da carteira valem para todo membro (134-147).
- Hoje o PDF e o resultado da conferência são visíveis a qualquer membro. O "só o titular e o dono" do spec não tem onde se apoiar.

## 6. Carteiras

**Colunas:** `id, name, type ('personal'|'shared'), created_by, icon, icon_background_color, created_at, updated_at, categories_onboarding_completed_at` (BL:2027-2039), mais `monthly_savings_target` (`20261026120000:269-271`).
- **Não há `purpose`, `split_mode` nem `kind`.** A única "espécie" é `type`.
- O ícone tem um check de vocabulário próprio (`20261014120000`).

**A primeira carteira**
- O trigger `handle_new_user` (BL:797-885) cria a **"Carteira pessoal de <nome>"** (`type='personal'`) e o owner.
- Ele semeia **7 categorias de despesa e 5 de receita** (BL:863-881) **só nessa carteira pessoal**.

**Carteira compartilhada**
- A RPC `create_shared_workspace` (`20260915150000`, `security invoker`) cria a carteira e o owner numa transação só, **sem categorias**.
- As categorias vêm do assistente `src/components/categories/categories-onboarding-wizard.tsx` e de `complete_workspace_categories_onboarding`.
- O cliente chama em `src/components/workspace-provider.tsx:222-246`. A UI é `src/components/workspace/project-form-dialog.tsx` e `create-project-dialog.tsx`: o nome "Project" ali é só nome, quem cria é `createWorkspace`.

**A carteira pessoal existe como conceito:**
- `type='personal'` não pode ser compartilhada (`workspace-invites-create:105-107`);
- não pode ser apagada (BL:2854);
- é procurada em `avisos_de_teste_pendentes` (`planos.sql`).

O "primeiro uso cria a Casa" do spec é novo, porque hoje o primeiro uso cria a Pessoal. A jornada `/comecar` existe (`src/app/(app)/comecar`, `user_settings.jornada_concluida_em`).

## 7. Leituras que precisariam mascarar

**Não há views:** `Views: never` em `src/types/database.ts:1770`, e não há `create view` nas migrações. Todo cliente lê `transactions` direto com supabase-js. Os três bundles RPC são invoker e leem a tabela base.

**Cliente**
- Lista e Painel: `fetch-transactions-list-page.ts:95`, `fetch-transactions-workspace-aux.ts:51`, `use-transactions-range.ts:26,64` (o Painel, por `use-dashboard-data.ts`), `use-transactions-list-controller.ts:836`, `transactions-detail-sheet-query.ts:36,80` e `transaction-detail-sheet-mutations.ts:176`.
- Cartões, categorias, assinaturas e contas: `credit-cards-workspace-transactions.ts:201-238`, `fetch-category-detail-bundle.ts:175-191`, `fetch-bills-page-bundle.ts:154`, `fetch-subscriptions-page-bundle.ts:78`, `categories/page-client.tsx:230`, `subscription-detail-sheet.tsx:165` e `installment-purchase-section.tsx:74`.
- Busca: `src/lib/queries/use-transactions-search.ts:79-96`, usada por `app-command-palette.tsx:282`. Filtra `.or(...)` por **`description`**. Se o banco esconder só a exibição e o filtro rodar na tabela base, a busca vira um oráculo: um "ilike" na descrição privada revela que ela existe.
- Sugestão de categoria e frase: `src/lib/captura/frase-no-form.ts:269` (o histórico com descrição), `importar-extrato-wireframe.tsx:105`, `piloto.ts:100` e `insights/acoes.ts:58`.
- Exportação: o **Cofre** (`src/lib/cofre/exportar.ts:7-18, 239`) faz `select("*")` em `transactions` e `attachments` de **todas** as carteiras da pessoa. O CSV de assinaturas usa `src/lib/data-table/csv.ts`.

**Edges** (service role, sem RLS)
- `_shared/process-transaction-notification.ts:48-140`: o corpo é `${valor} — ${description}` e vai a **todos os membros menos o autor**. O convidado receberia, e a privada vazaria.
- `insights-daily/index.ts:318-397` lê descrições, e `_shared/insights/detectores.ts:78,134,209,243` as põe no payload, porque recorrência, atípico e duplicidade usam o estabelecimento.
- `capture/index.ts:208-219` usa o histórico com `description` de todas as carteiras da pessoa para casar.
- `review-reminder:76`, `credit-card-calendar-alerts:250,318`, `evaluate-credit-card-alerts:200` e `evaluate-budgets:181` leem as transações, mas só somam e contam.
- IA (`ia-ler`) lê `workspace_members` (123) e `workspace_plan`. Não lê transações. O WhatsApp está adiado.
- Anexos: tabela e storage abertos a qualquer membro (§5).

## 8. Orçamentos e limites (o molde para `workspace_member_limits`)

**`budgets`** (BL:1622-1642): `workspace_id, user_id, category_id, period_start/end, year, month, amount`, os carimbos `threshold_80_sent_at`, `threshold_100_sent_at` e `threshold_over_sent_at`, e `repeats` (`20261026120000:155-162`).
- É uma linha por categoria e mês.
- O cron `copiar_orcamentos_do_mes`, com o marcador `orcamentos_copiados`, copia para o mês seguinte. `garantir_orcamentos_do_mes` faz a mesma cópia ao abrir o Painel.

**A Edge `evaluate-budgets`**
- **O cliente chama a cada lançamento:** `transaction-form-persistence.ts:69`, `lib/bills/pay-bill-flow.ts:41` e a Edge `capture` pelo caminho de serviço. Não há trigger. A importação não chama (`importar.ts:102`).
- O fluxo (`evaluate-budgets/index.ts`):
  1. pega a carteira pela categoria (116-125) e confere o membro (127-135);
  2. soma o gasto do mês com `gastoDaCategoriaNoMes` (`_shared/orcamento-mes.ts:13-33`). No cartão, conta o mês do fechamento por `statementCloseYmdForPurchaseYmd`. `diasCandidatos` (43-61) resolve o mês;
  3. reivindica por update condicional `.is(key, null)` (221-233);
  4. avisa **todos os membros** (239-245) com `kind: 'budget_threshold'`.
- O limite por pessoa pode reaproveitar `gastoDaCategoriaNoMes` com o filtro por autor. O spec diz "a compra no crédito conta pelo mês do fechamento", o que a função já faz.
- Com `repeats`, o limite precisa de uma chave de período para os carimbos de 80% e 100%: uma linha por mês, como `budgets`, ou uma tabela de dedupe.

**Como entra um tipo de notificação novo**
1. Migração: `drop constraint notifications_type_check`, depois `add ... check (type = any (array[...]))` com **`not valid`** e `validate`. É o padrão de `20261023120000:143-148` e `20261028120000:455-460`. O check atual é `transaction, budget, system, promotion, credit_card, bill, review, insight`.
2. `supabase/functions/_shared/notification-types.ts`: a união `NotificationEventType` (1-9), `isTypeAllowedForPrefs` (39-51) e, se houver, a coluna de preferência (`WorkspaceNotificationPrefs` e `DEFAULT_NOTIFICATION_PREFS`). A coluna entra em `workspace_member_notification_prefs` com `add column ... default true`.
3. `_shared/deliver-notification.ts:187-195`: a lista `emailAllowed`.
4. Cliente: `src/lib/notifications.ts:6` (`AppNotificationType`) e o ícone em `src/lib/notification-visuals.tsx:96`. O destino do toque fica em `resolveNotificationHref` (`notification-types.ts:84-106`), espelhado em `src/lib/notification-href.ts`.
5. Testes: `notification-types.test.ts` e os testes de fonte das migrações (`src/lib/insights/migracao-insights.test.ts:167` casa o array exato).

O mais barato é reusar o `type: 'budget'` com `metadata.kind: 'member_limit'`: não muda o check, e a preferência é a `notify_budget`.

## 9. Insights adiados do 6B

- Os adiamentos estão registrados em `docs/JORNADAS.md:1462` (lacuna 41), `docs/atlas/template.html:966,1016`, `supabase/BLOCO_6B_DEPLOYMENT.md:428-431` e `docs/superpowers/plans/2026-10-24-bloco-6b-insights.md:73-74`. O spec traz a linha "Limite da pessoa | 80% e 100% | Ver limite" (`proposta-funcional:450`).
- O check de `insights.kind` (`20261028120000:16`, também em `insights_silenciados:43`) **não tem `limite_pessoa`**. É preciso aumentar os dois checks.
- O cron gera tudo como carteira: `type Linha = { … user_id: null … }` (`insights-daily/index.ts:98,147`), e só olha `user_id` nulo (486). O pessoal só nasce por `registrar_insight`, que aceita só `seguro_baixo` (`20261028120000:187-189`). `inserir_insights` já aceita `user_id`.
- O envio vai a **todos os membros**: `avisar()` em `insights-daily/index.ts:497-560` lê `workspace_members` sem filtro. A RLS `insights_select` mostra a qualquer membro o insight com `user_id` nulo. Para o convidado receber só o próprio limite, mudam três coisas:
  1. a RLS: o convidado só vê `user_id = uid`;
  2. o envio: tirar o `guest` dos insights da carteira;
  3. o insight do limite: gravar com `user_id` = a pessoa, e uma linha para o dono.
- Outros envios para todos os membros que precisam do mesmo filtro: `process-transaction-notification.ts:92-96`, `evaluate-budgets:239-245`, e `credit-card-calendar-alerts`, `evaluate-credit-card-alerts`, `evaluate-bills-reminders` e `review-reminder` (não abertos a fundo; seguem o mesmo padrão de `workspace_members` com `deliverNotification`).

## 10. Pontos de entrada na tela

- **Membros:** a rota `/members` (`src/app/(app)/members/page.tsx`, `page-client.tsx` com 52K, `layout.tsx`) e o diálogo `src/components/members/workspace-invite-dialog.tsx`. No telefone, a página `/me` lista "Membros e convidados".
- **Criar e trocar carteira:** `src/components/layout/workspace-switcher.tsx` e `workspace-picker-menu-body.tsx`, mais `workspace/project-form-dialog.tsx` e `create-project-dialog.tsx`. A lógica é `src/components/workspace-provider.tsx`: `createWorkspace` em 222, `setCurrentWorkspaceId`, `isWorkspaceOwner`. A troca também está na paleta (`app-command-palette.tsx`). As configurações da carteira ficam em `src/components/settings/workspace-appearance-settings.tsx` (`OwnerCarteiraOverflowMenu`, 90).
- **Linhas a mascarar:**
  - `src/components/transactions/transactions-table.tsx` (a lista e o gêmeo do telefone) e `transaction-detail-sheet.tsx`;
  - `src/components/dashboard/dashboard-recent-transactions.tsx` (o Painel);
  - `src/components/categories/detail/category-embedded-transactions.tsx`, `src/components/credit-cards/credit-card-detail-view.tsx` e `credit-card-invoice-analytics-panel.tsx`;
  - a lista "A conferir" (`a-conferir-lista-wireframe.tsx`) e o resultado da conferência (`conferir-fatura-wireframe.tsx`).
- **Wireframes existentes** em `src/components/wireframe/` (33 arquivos e `wireframe.test.ts`): a-conferir-* (4), anexos, captura-tokens, casamento-conta, cofre-aberto, compartilhado-aviso, conferir-fatura, conta-*, estorno, foto-recibo, frase-rapida, ia-configuracoes, impacto-parcela, importar-extrato, insights, jornada, jornada-cartao, linha-do-tempo, mapeamento-csv, orcamento-repete, piloto-automatico, planos, precos, privacidade, receita-recorrente, seguro-para-gastar, somente-leitura e `wireframe-box.tsx`. **Nenhum trata de papéis, privado, divisão ou projeto.**

## 11. Testes que trancam RLS e papel

- **pgTAP** em `supabase/tests/database/`:
  - `security_privileges_policies.test.sql` (18 asserts: bootstrap do criador, último owner, autoria, cross-workspace);
  - `workspace_core_data_rls.test.sql` (inclui a política de `transaction_splits`) e `baseline_objects.test.sql:9` (a tabela `transaction_splits` existe);
  - `invite_claim_max_uses.test.sql`, `create_shared_workspace.test.sql`, `account_deletion.test.sql`, `security_definer_functions.test.sql` e `schema_integrity.test.sql`.
  - Rodam por `npm run test:db` (`supabase test db`), **fora da CI**: `.github/workflows/ci.yml` roda só lint, unit, build e e2e. Pela memória do projeto, não há Docker para rodá-los localmente.
- **Testes de fonte** (vitest lendo a migração):
  - `src/lib/planos/migracao-planos.test.ts` (cobertura de 5, `garantir_escrita`);
  - `src/lib/insights/migracao-insights.test.ts` (`insights_select`, os checks);
  - `src/lib/captura/migracao-captura.test.ts`, `src/lib/fatura/migracao-fatura.test.ts`, `src/lib/ia/migracao-ia.test.ts`, `src/lib/previsao/migracao-previsao.test.ts`, `src/lib/anexos.test.ts`, `src/lib/captura/capture-edge.test.ts` e `src/lib/ia/ler.test.ts`.
- `src/types/database-drift.ts:62` confere que as colunas de `Tables<"workspace_members">` batem com `WorkspaceMember`. Coluna nova em tabela tipada exige atualizar a interface e regenerar `database.ts`.
- Nenhum teste tranca o comportamento de `guest`, porque ele não existe.

## 12. Riscos para o front antigo de `main` no ar

O pressuposto: migrações compatíveis com o front de `main`, o mesmo banco de produção que o dev usa, e Edges publicadas que valem para os dois fronts.

- **`guest` no check:** em `main` o `guest` vira `member` (`fetch-workspaces-data.ts:73-75` em `main`). A tela mostra ações de membro e a RLS recusa: o convidado que abrir o front antigo vê erros, não dados. Isso só acontece com quem foi convidado pelo 2.0.
- **Mascaramento no banco:** o spec pede "não pode ser possível ler as colunas originais por `select` direto". Os caminhos possíveis:
  - **revogar colunas** (`revoke select (description…)`) quebra todo `select("*")` e todo `select` com essas colunas, em `main` e no 2.0 ("permission denied for column");
  - **RLS que esconde a linha privada alheia** na tabela base, com uma view ou RPC `security definer` mascarada para a leitura, é aditiva. Em `main`, a linha privada de outro some, e os totais da casa deixam de bater ali;
  - em qualquer caso, os bundles invoker, a busca por `description`, o Cofre e as Edges com service role precisam ir para o caminho mascarado.
- **`paid_by` com padrão "o autor":** um `default` de coluna não lê outra coluna. Precisa de trigger `before insert` para o `main`, que não manda `paid_by`. O mesmo vale para `transaction_shares` gerada por trigger: o `main` insere e o trigger cobre.
- **Apagar `transaction_splits`:** nem o `main` nem o 2.0 o usam em tempo de execução (só tipos). O drop é seguro para o app. Quebram os pgTAP `baseline_objects:9` e `workspace_core_data_rls:54-57` e o `database.ts` dos dois lados. O tipo em `main` sobra e não quebra o build, porque nada o importa.
- **Edges compartilhadas:** mudar `workspace-invites-create`, `accept`, `notify-transaction-created`, `insights-daily` ou `evaluate-budgets` vale na hora para o `main`. O `role` precisa ter padrão `member` quando o corpo não trouxer. `accept_workspace_invite` passa a ler `v_invite.role`: o check do convite só aumenta.
- **Políticas que trocam `is_workspace_member` por "adulto" em budgets, categories, cards e bills** não afetam quem é owner ou member no `main`. Alterar o próprio `is_workspace_member` afeta tudo, inclusive o storage e as transações do convidado.
- **`workspaces.purpose` e `split_mode` com default:** aditivos. O `main` usa `create_shared_workspace` e `select *`. O `database-drift.ts` do 2.0 pede a interface atualizada.
- **`credit_cards.holder_user_id` nulo:** aditivo. A política nova de `statement_totals` e de `attachments` (titular ou dono) **tira** a conferência dos outros membros também no `main`.
- **Políticas de insights:** só o 2.0 lê.

---

## Riscos e perguntas

1. **O mecanismo do mascaramento:** RLS na base que esconde a privada alheia, mais uma view ou RPC definer mascarada, aceitando que o `main` perde essas linhas e os totais? Ou revogar colunas, o que quebra o `main` hoje? Todo leitor (cerca de 20 no cliente, 3 bundles, o Cofre, a busca e 4 Edges) muda de fonte no mesmo bloco.
2. **O convidado ocupa assento?** `tem_cobertura` conta toda pessoa e dá `familia` à carteira pessoal do filho coberto.
3. **O convidado entra por link?** Hoje o link é multiuso e sem e-mail. O spec diz que o filho entra pelo convite de e-mail, com o texto LGPD. Proibir `guest` no link, por check ou na Edge?
4. **`is_workspace_member` fica como está** (inclui o convidado) **com um helper novo `is_workspace_adult`?** Ou o contrário? A troca mexe em cerca de 60 políticas e no storage.
5. **O convidado pode sair da carteira?** Hoje a política só deixa `member`.
6. **A troca de papel:** RPC owner-only com `WITH CHECK` e atividade `family_role_changed`? Hoje a política de UPDATE do owner não tem `WITH CHECK`.
7. **O tipo do aviso de limite:** `budget` com `kind` novo, sem migração de check? Ou tipo e preferência novos, o que mexe em 5 lugares?
8. **O privado no cartão depende de `holder_user_id`,** que todo cartão existente terá nulo. O nulo vale como "cartão da casa", e então privado não é permitido?
9. **A conferência e o PDF só para o titular e o dono** muda as políticas de `credit_card_statement_totals`, `attachments` e `storage.objects` (pastas por carteira, não por cartão). Os anexos de transação privada também precisam ser escondidos.
10. **Os insights da carteira usam descrições** (recorrência, atípico, duplicidade). A privada não pode entrar no payload visível a todos: filtrar no detector ou mascarar antes.
11. **`transaction_shares`:** o trigger precisa cobrir os caminhos `security definer` e service role (assinaturas, parcelas, contas, captura, `virar_*`). E "a regra de uma compra parcelada mora no plano" exige uma coluna nova em `workspace_installment_plans`.
12. **"O primeiro uso cria a Casa":** hoje o `handle_new_user` cria a Pessoal com categorias, e a compartilhada nasce sem categorias. Os modelos (Casa, Casal…) precisam de um seed por modelo na RPC de criação.
13. **Os pgTAP não rodam na CI nem aqui** (sem Docker). As garantias novas de RLS ficam trancadas só por testes de fonte, a menos que a CI ganhe o `test:db`.
