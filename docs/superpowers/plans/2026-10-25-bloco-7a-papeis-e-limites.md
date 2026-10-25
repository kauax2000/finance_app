# Bloco 7A — Papéis, convite e limite por pessoa: plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para executar este plano tarefa a tarefa. Os passos usam checkbox (`- [ ]`).

**Objetivo:** a carteira passa a ter três papéis (dono, membro e convidado). O convite escolhe o papel, e o convite de um menor registra o consentimento do responsável. O convidado lança e vê só o que é dele. Cada pessoa pode ter um limite mensal, com aviso em 80% e 100% para ela e para o dono. O bloco também fecha os dois itens que o 6B adiou: o insight "limite da pessoa", e o convidado que recebe só os avisos do próprio limite.

**O Bloco 7 tem três planos, nesta ordem:**
- **7A** (este): papéis e limites;
- **7B** (`2026-10-25-bloco-7b-gasto-privado.md`): o gasto privado entre adultos e o titular do cartão. Ele depende do `is_workspace_adult` deste plano;
- **7C** (`2026-10-25-bloco-7c-projetos-e-divisao.md`): projetos, propósito da carteira, modelos, quem pagou, divisão e acerto. Ele depende do papel `guest` e do `sponsor` deste plano.

**Arquitetura:**
- **O papel mora no banco.** `workspace_members.role` ganha `guest`.
- Um helper novo, `is_workspace_adult(ws)`, vale para dono e membro. O `is_workspace_member` continua como está e inclui o convidado. As políticas que são só da casa trocam para o helper novo, e a de transações ganha o ramo "o convidado vê só as dele".
- **A RLS e as RPCs são a garantia** (spec §12). A tela só esconde o que a RLS já recusa.
- **Toda Edge que avisa "todos os membros" passa a avisar só os adultos**, por um helper compartilhado. O convidado recebe só o aviso do próprio limite.
- **O limite por pessoa** é uma linha por pessoa e carteira, mensal e repetida. Quem o avalia é a Edge `evaluate-budgets`, que o cliente já chama a cada lançamento. O gasto da pessoa no mês sai de uma função pura em `_shared` e conta a compra no crédito pelo mês do fechamento, com a mesma régua do orçamento.
- **Telas:** entram como wireframes (`AGENTS.md`).

**Tecnologia:** Next 16 / React 19, Supabase (Postgres, Edge em Deno), Vitest e Deno test. Nenhuma dependência nova.

**Spec:** `docs/superpowers/specs/2026-10-20-proposta-funcional-design.md` §12, nas partes "Papéis", "Plano", "Limite por pessoa" e "Notificações", mais a linha "Limite da pessoa" do catálogo de §11. **Levantamento do código:** os fatos com arquivo e linha estão em `docs/superpowers/plans/2026-10-25-bloco-7-levantamento.md`.

## Restrições globais

- **O banco de dev é o de produção.** Nenhuma tarefa roda `supabase db push`, deploy ou SQL contra o projeto. Quem publica é o orquestrador, e só com o pedido explícito do dono.
- **O front de `main` continua em produção até o fim do 2.0.** Por isso:
  - as migrações só acrescentam;
  - os checks só crescem (`guest` entra, nada sai);
  - **as Edges valem para os dois fronts na hora em que sobem.** Toda Edge mudada mantém o comportamento de hoje quando o corpo não traz o campo novo. Exemplo: um convite sem `role` é `member`.
  - Até o 2.0 convidar alguém como `guest`, nenhuma política nova muda nada para quem usa o `main`.
- **O repositório é público.** Nenhuma chave, URL de projeto ou dado real entra nele.
- **A tabela de papéis (spec §12, literal):**

  | | Dono | Membro | Convidado |
  |---|---|---|---|
  | Lançar despesa | sim | sim | sim (autor = ele) |
  | Ver transações | todas | todas | só as dele |
  | Editar/excluir | tudo | tudo | só as dele |
  | Categorias e cartões | gerencia | gerencia | só lê |
  | Orçamento, faturas, previsão, contas, insights da casa | vê | vê | não |
  | O próprio limite | vê | vê | vê |
  | Convites e membros | gerencia | não | não |

  A coluna "privadas" do spec é do 7B.
- **Limite (spec §12):**
  - é mensal e se repete;
  - a compra no crédito conta pelo mês do fechamento;
  - avisa em **80%** e em **100%**, à pessoa e ao dono.
- **Sem plano, nada que protege alguém se desliga** (spec §12): o convidado continua restrito e o limite continua visível. O `garantir_escrita` não mexe em RLS.
- **Data do app:** `America/Sao_Paulo`. No servidor valem `app_today()` e `appTodayYmd()`.
- **Testes:**
  - Vitest roda em ambiente `node`, só `src/**/*.test.ts`.
  - Deno roda `supabase/functions/_shared/**/*.test.ts` (`npm run test:edge`).
  - **O pgTAP não roda aqui nem na CI.** A RLS nova é trancada por testes de fonte sobre a migração (`lerFonte`, `semComentarios` de `src/test/fonte.ts`), como em `src/lib/insights/migracao-insights.test.ts`.
  - Os módulos novos de `_shared` **não importam nada**, e o cliente os reexporta.
- **Wireframe:**
  - fica só em `src/components/wireframe/`;
  - usa a etiqueta `WIREFRAME · Bloco 7 · <funcionalidade>`;
  - usa controles nativos, com `type` declarado em todo `<button>`;
  - não usa nada de `@/components/ui`.
- **Mudança de jornada:** a Tarefa 6 atualiza `docs/JORNADAS.md` e `docs/atlas/template.html` e roda `python3 docs/atlas/build.py`.
- **Fechamento de cada tarefa:**
  - sempre `npx tsc --noEmit && npm run lint && npm run test:unit`;
  - mais `npm run test:edge` quando mexe em `supabase/functions`;
  - mais `npm run ds:audit -- src/components/wireframe` quando mexe em wireframe;
  - mais `npm run build` quando mexe em tela.

  Não ponha `graphify-out/` no stage, e reverta qualquer mudança no `deno.lock`.

## Decisões desta rodada (o orquestrador registra no ledger)

1. **O convidado ocupa assento do plano.** A spec §15.11 diz "as pessoas convidadas, até 5". O `tem_cobertura` fica como está: o filho coberto também tem o Família na própria carteira pessoal, como a spec diz ("com a carteira pessoal de cada uma").
2. **`is_workspace_member` não muda.** Entra `is_workspace_adult(ws uuid) returns boolean` (`security definer`, `stable`, `set search_path = ''`), que vale para `role in ('owner','member')`. As políticas mudam assim:
   - **`transactions`:** o adulto continua como hoje. O convidado faz `select`, `update` e `delete` só com `user_id = auth.uid()`. O `insert` continua exigindo membro e `user_id = auth.uid()`;
   - **`categories` e `credit_cards`:** o `select` fica com o membro, convidado incluído. A escrita fica só com o adulto;
   - **só o adulto, em tudo:** `budgets`, `bills`, `bill_instances`, `workspace_subscriptions`, `workspace_installment_plans`, `credit_card_invoice_payments`, `credit_card_category_spend_alerts` e `credit_card_statement_totals`;
   - **`attachments`:** o adulto, ou `created_by = auth.uid()`. No storage `attachments`, o adulto da pasta, ou `owner_id = auth.uid()::text`;
   - **`insights` (select):** o adulto, como hoje, ou `user_id = auth.uid()`. O convidado vê só os insights dele;
   - **`workspace_members`:** a política de sair vale para `member` e para `guest`.
3. **As RPCs que conferem "membro" e mexem em dado da casa passam a conferir adulto:**
   - `pay_bill_instance`, `pular_instancia_da_conta` e `ligar_pagamento_da_conta`;
   - `virar_assinatura` e `virar_conta`: são invoker, então a RLS já barra, e o teste de fonte confere;
   - `garantir_orcamentos_do_mes`, `registrar_insight` e `complete_workspace_categories_onboarding`;
   - `delete_workspace_installment_plan_cascade`, `rpc_fetch_bills_page_bundle`, `rpc_fetch_category_detail_bundle` e `rpc_fetch_subscriptions_page_bundle`. Os três bundles são invoker, então a RLS já devolve vazio.

   **Ficam abertas ao convidado, porque lançar despesa é dele:** `criar_plano_parcelado`, `create_workspace_installment_plan`, `create_capture_token` e `marcar_insight`. As linhas do plano parcelado que o convidado cria ficam invisíveis a ele, e as parcelas são transações dele.

   Antes de mudar, levante em `supabase/migrations/` todas as RPCs `security definer` que leem `workspace_members` ou `is_workspace_member`. O teste de fonte lista as que ficaram com membro, e cada uma tem um comentário que diz por quê.
4. **O convite escolhe o papel:**
   - `workspace_invites.role`: o check passa a `in ('member','guest')`;
   - o check novo `workspace_invites_guest_requer_email` exige `role = 'member' or invited_email is not null`. **O link é sempre de membro**;
   - colunas novas: `menor boolean not null default false` e `consentimento_em timestamptz`, com o check `not menor or (role = 'guest' and consentimento_em is not null)`;
   - a RPC `accept_workspace_invite` grava `v_invite.role`, e não mais `'member'` fixo;
   - ao aceitar um convite `guest`, a RPC grava `workspace_members.sponsor_user_id = v_invite.created_by` (coluna nova, nula para adultos). O 7C usa a coluna como o responsável que paga pelo convidado.
5. **Trocar o papel** é a RPC `trocar_papel(p_workspace_id uuid, p_user_id uuid, p_role text) returns void`:
   - `security definer`, `set search_path = ''`, grant para `authenticated`;
   - só o dono chama;
   - `p_role in ('member','guest')`. Não troca a linha de um `owner` nem a própria;
   - para `guest`, preenche `sponsor_user_id` com quem chamou se estiver nulo; para `member`, zera;
   - registra `family_role_changed` em `user_activity_logs`.

   A política "Owners can update member roles" ganha `with check (public.is_workspace_owner(workspace_id) and role in ('member','guest'))`. Assim, ninguém vira `owner` por `update` direto.
6. **O consentimento (LGPD art. 14), textos exatos:**
   - **no diálogo de convite**, quando "É menor de idade" está marcado, a caixa obrigatória diz: "Sou o responsável legal e autorizo o uso do app (LGPD, art. 14).";
   - **no e-mail de convite `menor`**, entra o parágrafo: "{responsável} criou este convite como responsável legal e autorizou o uso do app por você, como pede a LGPD (art. 14).";
   - a Edge recusa `menor` sem `consentimento: true` com 400 `consentimento_obrigatorio`, e `guest` sem e-mail com 400 `convidado_requer_email`.
7. **O limite por pessoa:**
   - `workspace_member_limits(workspace_id uuid, user_id uuid, amount numeric(12,2) not null check (amount > 0), created_by uuid, created_at, updated_at, primary key (workspace_id, user_id))`;
   - RLS: `select` para o adulto, ou `user_id = auth.uid()`. Escrita só do dono.
   - **O gasto da pessoa no mês** são as despesas (`type = 'expense'`) com `user_id` = a pessoa, com o crédito pelo mês do fechamento.
   - **O autor é a régua, e continua sendo depois do `paid_by` do 7C:** o limite é de quem gastou, não de quem pagou.
   - O dedupe do aviso é `limites_avisados(workspace_id, user_id, ym text, nivel smallint check in (80,100), primary key (workspace_id, user_id, ym, nivel))`, com RLS ligada e sem política (só a service role).
   - **Quem recebe:** a pessoa e cada dono da carteira, uma vez cada, mesmo que a pessoa seja dona.
   - O aviso é `type: 'budget'`, com `metadata.kind: 'member_limit'` e a preferência `notify_budget`, para não mexer no check de notificação.
   - Junto com o aviso, entra um insight `limite_pessoa` com `user_id` = a pessoa, e um com `user_id` = cada dono, sem push próprio (o aviso já é o push). O `dedupe_key` é `lim:{user_id}:{ym}:{nivel}`.
8. **O convidado no app:**
   - a navegação mostra Painel, Transações, Categorias (só leitura) e Cartões (só leitura);
   - Orçamento, Previsão, Contas a pagar, Assinaturas, Membros e as telas de fatura e conferência somem;
   - uma rota fora da lista dele leva ao Painel (`/dashboard`);
   - o Painel do convidado é um wireframe: o limite dele, o gasto do mês, as transações dele e "Lançar despesa".

## Foco de revisão

1. **O convidado lê o que não é dele.**
   - Um `select` de transações como convidado traz só as dele.
   - `budgets`, `bills`, as faturas e os insights da carteira vêm vazios.
   - Um anexo de outra pessoa não abre pelo storage.
   - Uma RPC de conta (`pay_bill_instance`) recusa.
   - (Tarefa 1, teste de fonte de cada política e RPC.)
2. **O aviso vaza para o convidado.**
   - O lançamento de um membro não avisa o convidado.
   - O orçamento estourado, a fatura, a conta vencendo e os insights da casa também não.
   - A despesa do convidado avisa o dono e os membros.
   - (Tarefa 2, teste do helper e um teste de fonte em cada Edge.)
3. **Promoção por fora.**
   - Um `update` direto de `role` para `owner` falha.
   - `trocar_papel` chamado por um membro falha.
   - Um link com `role: guest` é recusado pela Edge e pelo check.
   - (Tarefas 1 e 2.)
4. **O limite avisa duas vezes, ou no mês errado.**
   - O segundo lançamento acima de 80% no mesmo mês não avisa de novo.
   - A compra no crédito de 28/10, num cartão que fecha no dia 25, conta em novembro.
   - O dono que é a própria pessoa recebe um aviso, não dois.
   - (Tarefa 3.)
5. **O front antigo.**
   - Um convite sem `role` no corpo continua `member`.
   - Uma carteira sem convidado não muda nada para ninguém.
   - (Tarefas 1 e 2, teste de fonte do default e do corpo sem `role`.)

---

### Tarefa 1: Migração — o papel `guest`, a RLS e as RPCs

**Arquivos:**
- Criar: `supabase/migrations/20261029120000_papeis.sql`
- Modificar:
  - `src/types/database.ts`: o `role`, as colunas novas do convite e o `sponsor_user_id`;
  - `src/lib/supabase.ts`: `WorkspaceRole = "owner" | "member" | "guest"`, `WorkspaceInvite.role` e `WorkspaceMember.sponsor_user_id`;
  - `src/lib/queries/fetch-workspaces-data.ts:74-77`: o `guest` não vira mais `member`;
  - `src/types/database-drift.ts`, se a interface de `WorkspaceMember` mudar;
  - `supabase/tests/database/*.test.sql`: só onde um teste afirma o check antigo.
- Teste: `src/lib/papeis/migracao-papeis.test.ts` (teste de fonte)

**Interfaces (produz):**
- `public.is_workspace_adult(p_workspace_id uuid) returns boolean`.
- `workspace_members.role in ('owner','member','guest')` e `workspace_members.sponsor_user_id uuid references auth.users on delete set null`.
- `workspace_invites`: `role in ('member','guest')`, `menor` e `consentimento_em`, com os dois checks da Decisão 4.
- `public.trocar_papel(...)` (Decisão 5) e o `with check` da política de update.
- As políticas da Decisão 2 e as RPCs da Decisão 3.
- No TS, `WorkspaceRole` com `guest`.

- [ ] **Passo 1: teste de fonte que falha.** Ele confere:
  - os três checks de papel e os dois do convite;
  - `is_workspace_adult` com `role in ('owner','member')` e `search_path = ''`;
  - em cada tabela "só do adulto" da Decisão 2, as políticas usam `is_workspace_adult`;
  - a política de `select` de `transactions` tem o ramo `user_id = auth.uid()`;
  - `categories` e `credit_cards` têm escrita por adulto e `select` por membro;
  - o storage tem o ramo `owner_id`;
  - `insights_select` tem o ramo `user_id = auth.uid()` para o convidado;
  - a política de sair aceita `guest`;
  - `accept_workspace_invite` insere `v_invite.role` e grava `sponsor_user_id`;
  - `trocar_papel` exige dono e recusa `owner`;
  - o `with check` do update;
  - cada RPC da Decisão 3 confere adulto, e as quatro abertas ao convidado ficam com membro;
  - nenhum `drop table` e nenhum `drop column`.
- [ ] **Passo 2:** `npx vitest run src/lib/papeis/migracao-papeis.test.ts`. Esperado: FAIL.
- [ ] **Passo 3:** escrever a migração. Recrie cada política com `drop policy if exists` e `create policy` com o mesmo nome. Refaça o check com `not valid` e depois `validate`, como em `20261028120000_insights.sql`. Atualize os tipos.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run test:unit`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(papeis): convidado, adulto e a RLS da casa`.

### Tarefa 2: Edges — avisos só aos adultos e o convite com papel

**Arquivos:**
- Criar: `supabase/functions/_shared/destinatarios.ts` e o teste dele
- Modificar:
  - `_shared/process-transaction-notification.ts`;
  - `evaluate-budgets/index.ts`, `credit-card-calendar-alerts/index.ts`, `evaluate-credit-card-alerts/index.ts`, `evaluate-bills-reminders/index.ts`, `review-reminder/index.ts` e `insights-daily/index.ts` (`avisar`);
  - `workspace-invites-create/index.ts`, `workspace-invites-resend/index.ts` e `_shared/workspace-invite-email.ts`;
  - `capture/index.ts`: o histórico que casa a descrição;
  - qualquer outra Edge que leia `workspace_members` para avisar. Faça o levantamento com `grep -rn "workspace_members" supabase/functions`.
- Teste: `supabase/functions/_shared/destinatarios.test.ts`, `src/lib/papeis/edges-papeis.test.ts` (fonte)

**Interfaces:**
- Consome: o `role` da Tarefa 1.
- Produz:
  - `adultosDaCarteira(rows: { user_id: string; role: string }[], excluir?: string): string[]`, puro e sem import, que devolve só `owner` e `member`, sem repetir e sem `excluir`;
  - `donosDaCarteira(rows): string[]`;
  - **o corpo do convite:** `{ role?: 'member' | 'guest', menor?: boolean, consentimento?: boolean }`. A falta de `role` vale `member`.

- [ ] **Passo 1: testes que falham.**
  - `adultosDaCarteira` com um dono, um membro e um convidado, excluindo o autor, dá o dono e o membro sem o autor.
  - `donosDaCarteira` dá só os donos.
  - O teste de fonte confere que cada Edge de aviso da lista usa `adultosDaCarteira`. Uma nova que leia `workspace_members` e chame `deliverNotification` sem o helper falha o teste: varra `supabase/functions/*/index.ts` em busca de `deliverNotification(` mais `workspace_members`.
  - Ainda na fonte:
    - `workspace-invites-create` recusa `guest` sem e-mail (`convidado_requer_email`) e `menor` sem consentimento (`consentimento_obrigatorio`);
    - grava `role ?? 'member'`, `menor` e `consentimento_em`;
    - `renderInviteHtml` traz o parágrafo da Decisão 6 só quando `menor`;
    - o histórico da `capture` filtra `user_id` = o dono do token quando o papel dele na carteira é `guest`.
- [ ] **Passo 2:** `npm run test:edge && npx vitest run src/lib/papeis/edges-papeis.test.ts`. Esperado: FAIL.
- [ ] **Passo 3:** implementar. A despesa do convidado continua avisando os adultos, porque o autor é o único excluído.
- [ ] **Passo 4:** `npm run test:edge && npx tsc --noEmit && npm run test:unit`, mais `DENO_NO_PACKAGE_JSON=1 deno check` em cada Edge mexida. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(papeis): avisos só aos adultos e convite com papel`.

### Tarefa 3: O limite por pessoa — tabela, avaliação, aviso e insight

**Arquivos:**
- Criar: `supabase/migrations/20261029130000_limites.sql` e `supabase/functions/_shared/limite-pessoa.ts` (puro, com o teste)
- Modificar:
  - `supabase/functions/evaluate-budgets/index.ts`;
  - `supabase/functions/_shared/insights/textos.ts` (o modelo `limite_pessoa`);
  - `src/types/database.ts`;
  - `src/lib/limites/limites.ts` (novo, reexporta o puro e lê e grava o limite).
- Teste: `supabase/functions/_shared/limite-pessoa.test.ts`, `src/lib/limites/migracao-limites.test.ts` (fonte), `supabase/functions/_shared/insights/textos.test.ts` (o tom)

**Interfaces:**
- Consome:
  - `is_workspace_adult` e `is_workspace_owner`;
  - `adultosDaCarteira` e `donosDaCarteira` (Tarefa 2);
  - `statementCloseYmdForPurchaseYmd` e `diasCandidatos`, como `_shared/orcamento-mes.ts` usa.
- Produz:
  - as tabelas da Decisão 7;
  - os checks de `insights.kind` e `insights_silenciados.kind` com `'limite_pessoa'` a mais;
  - `nivelDoLimite(gastoCentavos: number, limiteCentavos: number): 0 | 80 | 100`, que dá 80 a partir de 80% e 100 a partir de 100%;
  - `gastoDaPessoaNoMes(lancs: { user_id: string; type: string; amount: number; date: string; payment_method: string | null; card: { closing_day: number } | null }[], userId: string, ym: string): number` (em centavos);
  - o modelo de texto `limite_pessoa`. Para a pessoa: "Você chegou a {nivel}% do seu limite do mês ({gasto} de {limite})." Para o dono: "{nome} chegou a {nivel}% do limite do mês ({gasto} de {limite})." A ação é "Ver limite".

- [ ] **Passo 1: testes que falham.**
  - `nivelDoLimite(79_99, 100_00) === 0`, `nivelDoLimite(80_00, 100_00) === 80`, `nivelDoLimite(100_00, 100_00) === 100` e `nivelDoLimite(150_00, 100_00) === 100`.
  - `gastoDaPessoaNoMes`:
    - a compra no crédito de `2026-10-28` num cartão com `closing_day: 25` conta em `2026-11`, e não em `2026-10`;
    - a despesa de outra pessoa não entra;
    - a receita não entra.
  - O teste de fonte confere:
    - as RLS da Decisão 7;
    - `limites_avisados` sem política;
    - os dois checks de `kind` com `limite_pessoa`;
    - o `evaluate-budgets` reivindicando em `limites_avisados` com `on conflict do nothing` antes de avisar, e avisando `pessoa ∪ donos` sem repetir;
    - o insight com `user_id` preenchido.
  - O teste de tom passa pelo modelo novo.
- [ ] **Passo 2:** `npm run test:edge && npx vitest run src/lib/limites`. Esperado: FAIL.
- [ ] **Passo 3:** implementar.
  - O `evaluate-budgets` avalia o limite do autor do lançamento, mesmo que a categoria não tenha orçamento.
  - Só o nível mais alto atingido avisa: ir de 79% a 101% num lançamento dá o aviso de 100%, e grava também o de 80% para ele não sair depois.
  - O insight entra por `inserir_insights`.
- [ ] **Passo 4:** `npm run test:edge && npx tsc --noEmit && npm run test:unit`, mais o `deno check` do `evaluate-budgets`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(limites): limite mensal por pessoa com aviso em 80% e 100%`.

### Tarefa 4: Telas de membros — convite com papel, troca de papel e limites

**Arquivos:**
- Criar: `src/components/wireframe/papeis-wireframe.tsx` (o seletor de papel, o menor e o consentimento, a troca de papel numa linha de membro) e `src/components/wireframe/limites-wireframe.tsx` (a lista de limites por pessoa, com gasto, limite e editar)
- Modificar:
  - `src/components/members/workspace-invite-dialog.tsx` e `src/app/(app)/members/page-client.tsx`, que importam os wireframes;
  - `src/components/workspace-provider.tsx`: expõe `papel: WorkspaceRole | null` e `isAdulto: boolean`;
  - `src/components/wireframe/insights-wireframe.tsx`: o `limite_pessoa` com "Ver limite";
  - `src/lib/insights/acoes.ts`.
- Teste: `src/lib/papeis/papeis.test.ts`, `src/lib/limites/limites.test.ts`

**Interfaces:**
- Consome: o corpo do convite (Tarefa 2), `trocar_papel` (Tarefa 1), as tabelas e `nivelDoLimite` (Tarefa 3).
- Produz:
  - `rotuloDoPapel(role: WorkspaceRole): string`, que dá "Dono", "Membro" e "Convidado";
  - `podeGerenciarMembros(papel)`, verdadeiro só para `owner`;
  - `destinoDoInsightDeLimite(papel): string`. Para o adulto, `/members#limites`; para o convidado, `/dashboard`.

- [ ] **Passo 1: testes que falham** para as três funções e para a montagem do corpo do convite: `montarConvite({ role, menor, consentimento, email })` recusa `guest` sem e-mail e `menor` sem consentimento, com as mesmas mensagens da Edge.
- [ ] **Passo 2:** `npx vitest run src/lib/papeis src/lib/limites`. Esperado: FAIL.
- [ ] **Passo 3:** implementar os wireframes e ligá-los.
  - O "Convidar por link" esconde a escolha de papel: o link é de membro.
  - A linha de membro mostra o papel. Só o dono vê "Trocar papel", que chama `trocar_papel`.
  - A seção `#limites` aparece para o adulto: o dono edita, o membro só vê.
  - O convidado não chega a `/members` (Tarefa 5).
- [ ] **Passo 4:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run ds:audit -- src/components/wireframe && npm run build`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(papeis): convite com papel, troca de papel e limites por pessoa`.

### Tarefa 5: O app do convidado — navegação, rota e Painel

**Arquivos:**
- Criar:
  - `src/lib/papeis/rotas-do-convidado.ts`: a lista das rotas permitidas e `rotaPermitidaAoConvidado(pathname: string): boolean`;
  - `src/components/layout/convidado-route-guard.tsx`;
  - `src/components/wireframe/convidado-painel-wireframe.tsx`.
- Modificar:
  - `src/config/navigation.ts` e `src/config/mobile-navigation.ts`: o filtro por papel;
  - o layout de `src/app/(app)/`, que monta o guard;
  - a página do Painel: com `papel === 'guest'`, renderiza o wireframe no lugar do Painel da casa;
  - o "+ Adicionar": continua abrindo o lançamento.
- Teste: `src/lib/papeis/rotas-do-convidado.test.ts`, `src/config/mobile-navigation.test.ts` (o caso do convidado)

**Interfaces:**
- Consome: `papel` e `isAdulto` do provider (Tarefa 4) e o limite (Tarefa 3).
- Produz:
  - `rotaPermitidaAoConvidado`. Ela permite `/dashboard`, `/transactions` (e as subrotas), `/categories` (e as subrotas), `/credit-cards` (sem as telas de fatura e conferência), `/me`, `/settings` e `/account`. Confira os nomes reais das rotas em `src/app/(app)/` antes de fixar a lista.
  - `itensDeNavegacaoPara(papel, itens)`.

- [ ] **Passo 1: testes que falham.**
  - `rotaPermitidaAoConvidado('/bills') === false`, `'/previsao' === false`, `'/members' === false`, `'/transactions?q=x' === true` e `'/dashboard' === true`.
  - A navegação do telefone para o convidado não tem Orçamento, Previsão, Contas nem Membros.
  - A página `/me` do convidado não lista Assinaturas, Contas a pagar nem Membros.
- [ ] **Passo 2:** `npx vitest run src/lib/papeis src/config`. Esperado: FAIL.
- [ ] **Passo 3:** implementar.
  - O guard troca a rota com `router.replace('/dashboard')` só depois de o papel chegar. Com o papel a caminho, ele não redireciona nem pisca.
  - O Painel do convidado mostra:
    - o limite (gasto, limite e o nível, ou "Sem limite definido");
    - o total do mês dele;
    - as últimas transações dele;
    - um botão nativo "Lançar despesa", que abre o mesmo formulário do "+ Adicionar".
- [ ] **Passo 4:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run ds:audit -- src/components/wireframe && npm run build`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(papeis): o app do convidado`.

### Tarefa 6: Roteiro, jornadas e Atlas

**Arquivos:**
- Criar: `supabase/BLOCO_7A_DEPLOYMENT.md`
- Modificar: `docs/JORNADAS.md`, `docs/atlas/template.html`, `docs/atlas/atlas-jornadas.html` (gerado)

**O roteiro (no formato de `supabase/BLOCO_6B_DEPLOYMENT.md`):**
1. Aplicar as duas migrações, na ordem. Elas são compatíveis com o `main`, porque nada muda até existir um `guest`.
2. Redeploy das Edges da Tarefa 2 e do `evaluate-budgets`, pelo fecho dos imports de `_shared/destinatarios.ts` e `_shared/limite-pessoa.ts`. Confirmar que o convite sem `role` continua `member`.
3. **Não convidar ninguém como `guest` antes do front 2.0 subir:** no `main`, o convidado veria a tela de membro e erros da RLS.
4. As conferências SQL de depois:
   - nenhuma linha com `role = 'guest'` antes do lançamento;
   - nenhuma política de `transactions` sem o ramo do convidado;
   - `limites_avisados` vazio até alguém definir um limite.

**As jornadas:**
- "Convidar alguém": o papel, o menor, o consentimento, o e-mail e o aceite, que grava o papel e o responsável;
- "Trocar o papel";
- "O app do convidado": a navegação, o redirecionamento e o Painel;
- "Limite por pessoa": definir, o aviso em 80% e 100% e o insight, com o destino de "Ver limite" por papel;
- as regras técnicas: a tabela de papéis, quem recebe aviso, os assentos;
- as lacunas:
  - fechar a lacuna 41 do 6B (o limite da pessoa e o convidado);
  - abrir "o texto do e-mail ainda diz workspace" se continuar.

**O Atlas:** as mesmas jornadas, as lacunas e a capa. Depois, `python3 docs/atlas/build.py`.

- [ ] **Passo 1:** escrever o roteiro.
- [ ] **Passo 2:** atualizar `JORNADAS.md` e `template.html`, e rodar o `build.py`.
- [ ] **Passo 3:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run build`. Esperado: PASS.
- [ ] **Passo 4:** commit `docs(papeis): roteiro do Bloco 7A, jornadas e Atlas`.
