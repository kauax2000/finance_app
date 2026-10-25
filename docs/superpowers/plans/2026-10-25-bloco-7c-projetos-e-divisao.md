# Bloco 7C — Projetos, propósito da carteira, quem pagou e acerto: plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para executar este plano tarefa a tarefa. Os passos usam checkbox (`- [ ]`).

**Objetivo:** dois jeitos de separar dinheiro, e a divisão entre adultos.
- **Projeto dentro da carteira:** mesma gente, mesmo dinheiro. Tem orçamento total, gasto, quanto falta e o resumo, e depois é arquivado.
- **Carteira de projeto:** outra gente ou outro dinheiro, com datas, orçamento total e sem ciclo.
- **Modelos** ao criar uma carteira (Casa, Casal, Pessoal, Viagem, Reforma e Evento), e o primeiro uso oferece a Casa.
- Na carteira **dividida**: quem pagou, as partes de cada adulto (iguais, por pesos ou livres numa despesa), o saldo e o acerto.

**Pressupõe os Blocos 7A e 7B:** o `is_workspace_adult`, o `sponsor_user_id` do convidado e o trigger do privado, que recusa `project_id` numa privada.

**Arquitetura:**
- **As partes são do banco.** Um trigger em `transactions` gera `transaction_shares` em toda origem: o formulário, a captura, a assinatura, a parcela, a conta, o `main` e os `virar_*`.
  - A soma sempre fecha, e o centavo que sobra vai para quem pagou.
  - A tela só lê as partes, nunca as calcula. A única conta da tela é conferir se as partes digitadas à mão fecham.
- **O saldo é uma RPC só**, `saldos_da_carteira`: pago − partes ± acertos. O Pix do acerto acontece fora do app.
- **O resumo do projeto** é uma função pura no cliente, sobre as transações do projeto.
- **Telas:** entram como wireframes (`AGENTS.md`).

**Tecnologia:** Next 16 / React 19, Supabase (Postgres, Edge em Deno), Vitest. Nenhuma dependência nova.

**Spec:** `docs/superpowers/specs/2026-10-20-proposta-funcional-design.md` §12: "Carteiras com propósito: a forma dupla" e "Quem pagou, modo da carteira e acerto". **Levantamento:** `docs/superpowers/plans/2026-10-25-bloco-7-levantamento.md` (§4, §6 e §12).

## Restrições globais

- **Valem todas as do 7A** (banco de produção, front de `main` no ar, repositório público, testes, wireframe, fechamento de cada tarefa e a etiqueta `WIREFRAME · Bloco 7 · <funcionalidade>`).
- **A regra mostrada ao escolher (spec §12, literal):** "Vai usar o cartão da casa e são as mesmas pessoas? É um projeto. Gente de fora ou dinheiro separado? É uma carteira."
- **Os modelos (spec §12):**
  - Casa (dia a dia, pote único);
  - Casal (dia a dia, dividida);
  - Pessoal;
  - Viagem, Reforma e Evento (projeto).
- **A divisão (spec §12):**
  - `paid_by` vale o autor por padrão;
  - `split_mode` é `pooled` (o padrão) ou `split`;
  - a regra é igual ou por pesos entre os **membros**, e livre por despesa;
  - a soma fecha, e o centavo que sobra vai para quem pagou;
  - a regra da parcelada mora no plano;
  - a despesa do convidado tem `paid_by` = o responsável, e **o convidado nunca entra no saldo**;
  - saldo = pago − partes ± acertos;
  - trocar de modo não apaga nada;
  - **`transaction_splits` é removido.**
- **O `main` não manda `paid_by` nem `project_id`.** Por isso o padrão vem de trigger, e não de `default` de coluna, que não lê outra coluna.

## Decisões desta rodada (o orquestrador registra no ledger)

1. **Projeto:**
   - a tabela é `projects(id uuid pk, workspace_id uuid not null, name text not null, starts_on date, ends_on date, budget_total numeric(12,2) check (budget_total is null or budget_total > 0), archived_at timestamptz, created_by uuid, created_at, updated_at)`;
   - RLS: `select` para o membro, convidado incluído, para ele marcar a despesa dele. Escrita só do adulto;
   - `transactions.project_id uuid references projects on delete set null`, com o trigger `same_ws_project_id` no molde do `same_ws_bill_id` do 6A;
   - um projeto arquivado não aceita lançamento novo: o trigger recusa com `PROJETO_ARQUIVADO`;
   - **o resumo** é gasto, falta, por categoria e por pessoa.
2. **Carteira de projeto:** `workspaces.purpose text not null default 'everyday' check in ('everyday','project')`, mais `workspaces.starts_on date`, `ends_on date` e `budget_total numeric(12,2)`, nulos fora do `project`.
   - Com `purpose = 'project'`:
     - `copiar_orcamentos_do_mes` e `garantir_orcamentos_do_mes` pulam a carteira;
     - a navegação esconde Previsão;
     - o Painel mostra o resumo da carteira-projeto no lugar do seguro para gastar.
3. **Os modelos** são a RPC `criar_carteira_de_modelo(p_modelo text, p_nome text) returns uuid`:
   - `security invoker`, para a RLS valer;
   - cria pelo mesmo caminho do `create_shared_workspace`, grava `purpose` e `split_mode` e semeia as categorias com a mesma forma do `handle_new_user`;
   - marca `categories_onboarding_completed_at`, para o assistente não abrir.

   As categorias de cada modelo, exatas:
   - **`casa`** (`everyday`, `pooled`):
     - despesa: Mercado, Contas da casa, Transporte, Saúde, Lazer, Educação, Outros;
     - receita: Salário, Outros.
   - **`casal`** (`everyday`, `split`): as mesmas da Casa.
   - **`viagem`** (`project`, `split`): despesa Passagens, Hospedagem, Alimentação, Passeios, Transporte e Outros.
   - **`reforma`** (`project`, `split`): despesa Material, Mão de obra, Projeto, Móveis e Outros.
   - **`evento`** (`project`, `split`): despesa Local, Comida e bebida, Decoração, Convites, Fornecedores e Outros.
   - **`pessoal`** não cria nada. Ela aponta para a carteira pessoal que o `handle_new_user` já criou.

   **"O primeiro uso cria a Casa"** é um passo da jornada `/comecar`. Quem ainda não é dono de nenhuma carteira compartilhada vê "Criar a Casa", que chama o modelo `casa`. O `handle_new_user` não muda, porque o `main` depende dele.
4. **Quem pagou:** `transactions.paid_by uuid references auth.users on delete set null`. O trigger `before insert` preenche:
   - o `sponsor_user_id` do membro, quando o autor é `guest` naquela carteira;
   - senão, o autor.

   A tela só deixa escolher entre os adultos. O limite da pessoa (7A) continua pelo autor.
5. **As partes:**
   - `workspace_split_weights(workspace_id, user_id, weight numeric(6,2) not null check (weight > 0), primary key (workspace_id, user_id))`. Sem linha, o peso vale 1, que é a divisão igual;
   - `transaction_shares(transaction_id uuid references transactions on delete cascade, user_id uuid, amount numeric(12,2) not null, primary key (transaction_id, user_id))`. RLS: `select` do adulto. Não há escrita direta;
   - `transactions.shares_manual boolean not null default false`;
   - `workspace_installment_plans.split_weights jsonb`, um array de `{ user_id, weight }`. Nulo vale os pesos da carteira;
   - `workspaces.split_mode text not null default 'pooled' check in ('pooled','split')` e `workspaces.split_since date`, gravado quando o modo vira `split`.
   - **O trigger `gerar_partes()`** é `after insert or update of amount, paid_by, type, workspace_id, installment_plan_id`, `security definer`. Ele gera as partes de toda despesa:
     - de carteira `split`;
     - com `date >= split_since`;
     - com `shares_manual = false`.

     As partes vão entre os adultos da carteira, pelos pesos do plano da parcela ou da carteira, e o resto vai para quem pagou. Fora disso, ele apaga as partes automáticas.
   - **O algoritmo, para não ter duas leituras:**
     1. trabalhe em centavos;
     2. a parte de cada um é `floor(total * peso / soma_pesos)`;
     3. os centavos que sobram vão inteiros para `paid_by`;
     4. se `paid_by` não for adulto da carteira, o resto vai para o adulto de menor `user_id`.
   - **`definir_partes(p_transaction_id uuid, p_partes jsonb) returns void`:**
     - `security definer`, só para adulto;
     - um `p_partes` que não soma o valor exato dá `PARTES_NAO_FECHAM`;
     - `p_partes` nulo volta ao automático (`shares_manual = false` e regenera).
6. **O acerto:**
   - `settlements(id uuid pk, workspace_id uuid not null, from_user uuid not null, to_user uuid not null, amount numeric(12,2) not null check (amount > 0), settled_on date not null default app_today(), note text, created_by uuid, created_at)`, com `check (from_user <> to_user)`;
   - RLS: `select` e `insert` do adulto. `delete` só de quem criou.
   - `saldos_da_carteira(p_workspace_id uuid) returns table(user_id uuid, pago numeric, partes numeric, acertos numeric, saldo numeric)`:
     - `security definer`, só para adulto, e só com os adultos;
     - `pago` é a soma de `amount` das despesas com partes em que `paid_by` = a pessoa;
     - `partes` é a soma das partes dela;
     - `acertos` = o que ela pagou − o que ela recebeu;
     - `saldo = pago − partes + acertos`. Positivo quer dizer que os outros devem a ela.
   - **Trocar o modo não apaga nada:** de `split` para `pooled`, as partes ficam guardadas e o saldo some da tela; de volta a `split`, elas valem de novo.
7. **`transaction_splits` sai:**
   - a migração confere que a tabela está vazia (`raise exception` se tiver linha) antes do `drop table`;
   - nem o 2.0 nem o `main` a leem em tempo de execução (levantamento §4);
   - saem também o tipo em `database.ts` e as afirmações dos pgTAP em `baseline_objects.test.sql` e `workspace_core_data_rls.test.sql`.

## Foco de revisão

1. **A soma não fecha.**
   - R$ 100,00 dividido por três adultos de peso igual dá 33,33, 33,33 e 33,34, com os 0,01 para quem pagou.
   - Pesos 2 e 1 em R$ 10,00 dão 6,66 e 3,34 se quem pagou tem peso 1, e 6,67 e 3,33 se quem pagou tem peso 2.
   - (Tarefa 2, teste de fonte do algoritmo e testes do `partesFecham` no cliente.)
2. **O convidado no saldo.**
   - A despesa do convidado tem `paid_by` = o responsável.
   - O convidado não tem parte nenhuma.
   - O `saldos_da_carteira` não o lista.
   - (Tarefa 2.)
3. **Origem que escapa do trigger.**
   - Um lançamento feito pela `capture`, pela assinatura do cron, pela parcela e pelo `main` (sem `paid_by`) ganha `paid_by` e as partes do mesmo jeito.
   - (Tarefa 2, teste de fonte: o trigger é `after insert`, não depende do corpo e não está só numa RPC.)
4. **Mudar de modo apaga ou soma o que não devia.**
   - `pooled` → `split` → `pooled` → `split` não duplica as partes.
   - Uma despesa anterior ao `split_since` não entra no saldo.
   - (Tarefa 2.)
5. **O projeto arquivado e a carteira-projeto.**
   - Lançar num projeto arquivado é recusado.
   - A carteira de propósito `project` não ganha orçamento copiado no dia 1.
   - O resumo do projeto bate com a soma das transações dele.
   - (Tarefas 1 e 3.)

---

### Tarefa 1: Migração — projetos, propósito e modelos

**Arquivos:**
- Criar: `supabase/migrations/20261031120000_projetos.sql`
- Modificar: `src/types/database.ts`, `src/lib/supabase.ts` (os tipos de `Workspace`, `Transaction` e `Project`), `src/types/database-drift.ts` se precisar
- Teste: `src/lib/projetos/migracao-projetos.test.ts` (fonte)

**Interfaces (produz):** a tabela, as colunas e os triggers das Decisões 1 e 2; `criar_carteira_de_modelo` e as listas de categorias da Decisão 3; o pulo do `purpose = 'project'` nas duas funções de orçamento.

- [ ] **Passo 1: teste de fonte que falha.** Ele confere:
  - as colunas e os checks;
  - a RLS de `projects` (membro lê, adulto escreve);
  - `same_ws_project_id` e `PROJETO_ARQUIVADO`;
  - `criar_carteira_de_modelo` como invoker, com os seis modelos e as listas de categorias exatas da Decisão 3;
  - o `purpose` nas duas funções de orçamento;
  - nenhum `drop`.
- [ ] **Passo 2:** `npx vitest run src/lib/projetos/migracao-projetos.test.ts`. Esperado: FAIL.
- [ ] **Passo 3:** escrever a migração e os tipos.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run test:unit`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(projetos): projeto, carteira de projeto e modelos`.

### Tarefa 2: Migração — quem pagou, partes, acerto e a saída do `transaction_splits`

**Arquivos:**
- Criar: `supabase/migrations/20261031130000_divisao.sql`
- Modificar:
  - `src/types/database.ts`, com o `transaction_splits` fora;
  - `src/lib/supabase.ts`;
  - `supabase/tests/database/baseline_objects.test.sql` e `workspace_core_data_rls.test.sql`;
  - `docs/PERFORMANCE.md:51`.
- Teste: `src/lib/divisao/migracao-divisao.test.ts` (fonte)

**Interfaces (produz):** as colunas, as tabelas, os triggers e as RPCs das Decisões 4, 5, 6 e 7.

- [ ] **Passo 1: teste de fonte que falha.** Ele confere:
  - o trigger de `paid_by` com o ramo do `sponsor_user_id`;
  - `gerar_partes` como `after insert or update` em `transactions`, com `floor`, o resto para `paid_by`, o filtro `role in ('owner','member')`, o `split_since` e o `shares_manual`;
  - o uso de `split_weights` do plano antes dos pesos da carteira;
  - `definir_partes` com `PARTES_NAO_FECHAM`;
  - `saldos_da_carteira` só para adulto e com a fórmula da Decisão 6;
  - a RLS de `settlements` e de `transaction_shares`;
  - a guarda de tabela vazia antes do `drop table public.transaction_splits`;
  - nenhum outro `drop`.
- [ ] **Passo 2:** `npx vitest run src/lib/divisao/migracao-divisao.test.ts`. Esperado: FAIL.
- [ ] **Passo 3:** escrever a migração.
  - Escreva o algoritmo da Decisão 5 numa função SQL `dividir_em_partes(p_total_centavos bigint, p_pesos jsonb, p_pagador uuid) returns table(user_id uuid, centavos bigint)`, chamada pelo trigger. Assim o teste de fonte lê um lugar só.
  - Ponha no fim da migração, comentados, os dois exemplos do Foco de revisão 1 como `select` de conferência para o roteiro.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run test:unit`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(divisao): quem pagou, partes geradas pelo banco e acerto`.

### Tarefa 3: Telas — projetos, modelos e a carteira de projeto

**Arquivos:**
- Criar:
  - `src/lib/projetos/resumo.ts` e o teste;
  - `src/components/wireframe/projetos-wireframe.tsx` (a lista, criar, editar, o detalhe com o resumo, arquivar);
  - `src/components/wireframe/modelos-de-carteira-wireframe.tsx` (os seis modelos e a regra da escolha);
  - `src/app/(app)/projetos/page.tsx` e `src/app/(app)/projetos/[id]/page.tsx`, cada um com o `loading.tsx` e o `AdiarMontagem`, como em `adiar-montagem.test.ts`.
- Modificar:
  - o criar carteira (`src/components/workspace/create-project-dialog.tsx` e `project-form-dialog.tsx`), que importa o wireframe de modelos;
  - o formulário de lançamento: o seletor de projeto (nativo, dentro de um wireframe pequeno), escondido na privada;
  - a jornada `/comecar`: o passo "Criar a Casa";
  - o Painel: com `purpose = 'project'`, o resumo da carteira no lugar do seguro;
  - `src/config/navigation.ts` e `mobile-navigation.ts`: o item "Projetos" e a Previsão escondida no `project`.
- Teste: `src/lib/projetos/resumo.test.ts` e `src/lib/projetos/modelos.test.ts`

**Interfaces:**
- Consome: a Tarefa 1.
- Produz:
  - `resumoDoProjeto(lancs: { amount: number; type: string; category_id: string | null; user_id: string }[], orcamento: number | null): { gastoCentavos: number; faltaCentavos: number | null; porCategoria: Record<string, number>; porPessoa: Record<string, number> }`. Só despesas entram; `falta` é nula sem orçamento e pode ser negativa;
  - `MODELOS_DE_CARTEIRA`: os seis, com `purpose`, `split_mode`, rótulo e descrição curta;
  - `REGRA_DA_ESCOLHA`, a frase literal das Restrições.

- [ ] **Passo 1: testes que falham.**
  - `resumoDoProjeto` com três despesas, uma receita e o orçamento de R$ 1.000 dá o gasto certo, a falta certa e as quebras por categoria e por pessoa.
  - O gasto acima do orçamento dá falta negativa.
  - Sem orçamento, a falta é `null`.
  - `MODELOS_DE_CARTEIRA` tem os seis com os pares da Decisão 3.
  - `REGRA_DA_ESCOLHA` é a frase exata.
- [ ] **Passo 2:** `npx vitest run src/lib/projetos`. Esperado: FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run ds:audit -- src/components/wireframe && npm run build`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(projetos): projetos, modelos de carteira e o resumo`.

### Tarefa 4: Telas — quem pagou, partes, modo da carteira, saldo e acerto

**Arquivos:**
- Criar:
  - `src/lib/divisao/partes.ts` e o teste;
  - `src/components/wireframe/divisao-wireframe.tsx`, com as peças "Quem pagou", "Partes desta despesa" (ver, editar à mão e voltar ao automático), "Modo e pesos da carteira" e "Saldo e acerto" (a lista do `saldos_da_carteira`, "Acertar" grava em `settlements`, e o histórico dos acertos com apagar o próprio).
- Modificar:
  - o formulário de lançamento: "Quem pagou" só em carteira `split`, entre os adultos;
  - a folha de detalhe da transação: as partes;
  - as configurações da carteira (`src/components/settings/workspace-appearance-settings.tsx`): o modo e os pesos, só para o dono;
  - o Painel: o saldo numa carteira `split`, só para os adultos.
- Teste: `src/lib/divisao/partes.test.ts`

**Interfaces:**
- Consome: a Tarefa 2.
- Produz:
  - `partesFecham(partes: { user_id: string; centavos: number }[], totalCentavos: number): boolean`;
  - `textoDoSaldo(saldoCentavos: number, nome: string, meuId: string, userId: string): string`. Positivo: "{nome} tem a receber {valor}"; negativo: "{nome} deve {valor}"; zero: "{nome} está em dia". Quando é a própria pessoa, "Você…";
  - `sugestaoDeAcerto(saldos: { user_id: string; saldoCentavos: number }[]): { de: string; para: string; centavos: number }[]`. Quem deve paga a quem tem a receber, do maior para o maior, até zerar, no menor número de pagamentos que essa regra gulosa dá.

- [ ] **Passo 1: testes que falham.**
  - `partesFecham` com 33,33 + 33,33 + 33,34 contra 100,00 dá `true`, e com 33,33 × 3 dá `false`.
  - `textoDoSaldo` cobre os três sinais e o "Você".
  - `sugestaoDeAcerto` com `[+50, −30, −20]` dá dois pagamentos (30 e 20) para o de +50.
  - Com todos zerados, a lista é vazia.
- [ ] **Passo 2:** `npx vitest run src/lib/divisao`. Esperado: FAIL.
- [ ] **Passo 3:** implementar.
  - As partes mostradas vêm sempre de `transaction_shares`.
  - O editor só confere o fechamento antes de chamar `definir_partes`, e o erro `PARTES_NAO_FECHAM` vira "As partes precisam somar o valor da despesa." em `src/lib/supabase-errors.ts`.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run ds:audit -- src/components/wireframe && npm run build`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(divisao): quem pagou, partes, saldo e acerto`.

### Tarefa 5: Roteiro, jornadas e Atlas

**Arquivos:**
- Criar: `supabase/BLOCO_7C_DEPLOYMENT.md`
- Modificar: `docs/JORNADAS.md`, `docs/atlas/template.html`, `docs/atlas/atlas-jornadas.html` (gerado)

**O roteiro:**
1. **Antes de tudo:** `select count(*) from public.transaction_splits` tem que dar 0. A migração recusa se não der.
2. Aplicar as duas migrações, depois das do 7B.
3. Conferir:
   - toda transação nova numa carteira `pooled` fica sem partes;
   - os dois `select` de conferência do algoritmo dão os valores do Foco de revisão 1.
4. Nenhuma Edge muda neste bloco. Se a Tarefa 2 tiver precisado mexer numa, liste aqui.

**As jornadas:**
- "Criar uma carteira" com os modelos e a regra;
- "Primeiro uso: a Casa";
- "Projeto": criar, lançar, o resumo e arquivar;
- "Carteira de projeto";
- "Dividir e acertar": o modo, os pesos, quem pagou, as partes, o saldo e o acerto;
- as regras técnicas (o algoritmo, o convidado fora do saldo, a troca de modo);
- a lacuna: o Pix do acerto acontece fora do app, de propósito.

**O Atlas:** as mesmas jornadas, as lacunas e a capa. Depois, `python3 docs/atlas/build.py`.

- [ ] **Passo 1:** escrever o roteiro.
- [ ] **Passo 2:** atualizar `JORNADAS.md` e `template.html`, e rodar o `build.py`.
- [ ] **Passo 3:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run build`. Esperado: PASS.
- [ ] **Passo 4:** commit `docs(divisao): roteiro do Bloco 7C, jornadas e Atlas`.
