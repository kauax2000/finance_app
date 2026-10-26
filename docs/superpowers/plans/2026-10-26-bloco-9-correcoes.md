# Bloco 9 — Correções antes do lançamento: plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para executar este plano tarefa a tarefa. Os passos usam checkbox (`- [ ]`).

**Objetivo:** fechar as lacunas de código que precisam mudar antes do lançamento do 2.0. Telas, publicação e funcionalidades novas ficam de fora.

O bloco faz quatro coisas:
- **tira o gasto privado entre adultos** (decisão do dono, 26/10). Numa carteira, todo adulto vê todos os gastos; quem quer privacidade cria uma carteira só sua. O **titular do cartão fica**;
- **corrige o vencimento** do cartão que vence no mesmo mês em que fecha;
- **faz o estorno no cartão descontar o orçamento** da categoria;
- **fecha furos** de convite, anexo, só leitura, captura, insights e cobrança.

**Arquitetura:**
- **As migrações dos Blocos 7B a 8 nunca foram aplicadas em lugar nenhum.** Por isso o gasto privado sai **editando essas migrações no lugar**, e não por uma migração de remoção. Assim nenhuma tabela ou coluna morta nasce. As correções novas vão numa migração nova, `20261102120000_bloco9.sql`.
- **A regra de uma conta mora num lugar só:**
  - o vencimento continua em `estimatedDueDateForClose` (cliente) e `estimatedDueYmdForClose` (Deno), com o arquivo de vetores compartilhado;
  - o gasto da categoria continua em `gastoDaCategoriaNoMes` (Deno) e `buildCategoryCommitmentsForMonth` (cliente), com os vetores de paridade.
- **Telas:** o que muda em tela é mínimo e segue o padrão de cada uma (wireframe onde já é wireframe).

**Tecnologia:** Next 16 / React 19, Supabase (Postgres, Edge em Deno), Vitest e Deno test. Nenhuma dependência nova.

**Spec:** `docs/superpowers/specs/2026-10-20-proposta-funcional-design.md`. O §12 "Gasto privado entre adultos" está **revogado** pelo dono. **Fontes:**
- o mapa das lacunas, `docs/LACUNAS-MAPA.md`;
- `docs/JORNADAS.md` §19;
- o levantamento do código, `docs/superpowers/plans/2026-10-26-bloco-9-levantamento.md`.

## Restrições globais

- **O banco de dev é o de produção.** Nenhuma tarefa roda `supabase db push`, deploy ou SQL contra o projeto. Quem publica é o orquestrador, e só com o pedido explícito do dono.
- **O front de `main` continua no ar até o 2.0.** Por isso:
  - a migração nova só acrescenta;
  - as Edges já publicadas e compartilhadas com o `main` mantêm o comportamento de hoje para os pedidos antigos. São elas: `workspace-invites-accept`, `credit-card-calendar-alerts`, `notify-transaction-created` e `evaluate-budgets`.
- **O front 2.0 roda contra o banco sem as migrações dos Blocos 3A a 9** (o dev usa produção). Coluna nova só entra por `select("*")` ou consulta tolerante, e `src/**/colunas-tolerantes.test.ts` trava isso.
- **O repositório é público.** Nenhuma chave, ref de projeto ou dado real.
- **Testes:**
  - Vitest roda só `src/**/*.test.ts`;
  - Deno roda `supabase/functions/_shared/**` (`npm run test:edge`);
  - o SQL é trancado por teste de fonte (`src/test/migracoes.ts`) e pelos pgTAP em `supabase/tests/database/`, que rodam no projeto de teste;
  - os módulos de `_shared` não importam nada que traga dependência.
- **Wireframe:**
  - fica só em `src/components/wireframe/`;
  - usa controles nativos, com `type` em todo `<button>`;
  - não usa nada de `@/components/ui`.
- **Mudança de jornada:** a Tarefa 7 atualiza `docs/JORNADAS.md` e `docs/atlas/template.html` e roda `python3 docs/atlas/build.py`.
- **Fechamento de cada tarefa:**
  - sempre `npx tsc --noEmit && npm run lint && npm run test:unit`;
  - mais `npm run test:edge` quando mexe em Edge;
  - mais `npm run ds:audit -- src/components/wireframe && npm run build` quando mexe em tela.

  Rode `find .next -name "* [0-9]*.ts" -delete` antes do `tsc`. Não ponha `graphify-out/` no stage, e reverta qualquer mudança no `deno.lock`.

## Decisões desta rodada (o orquestrador registra no ledger)

1. **Sai o gasto privado; fica o titular do cartão.**
   - Sai:
     - `transactions.is_private`;
     - `transacoes_privadas`;
     - `guardar_privado`/`guardar_privado_depois` e a recusa `PRIVADO_NAO_PERMITIDO`/`PRIVADO_SEM_DETALHE`;
     - o ramo do privado nas políticas de `transactions`, `attachments` e storage;
     - o filtro `is_private` das Edges e dos detectores;
     - o mascaramento ("Gasto pessoal de …", `rotuloDaTransacao`, `comDetalhesPrivados`);
     - a chave "Privado" e o `podeSerPrivado`;
     - a regra de privado do 7C (Ruling 4 do 7C) e a recusa de `project_id` na privada (Ruling 1 do 7C).
   - Fica, do 7B:
     - `credit_cards.holder_user_id` e só o dono escolhe o titular;
     - a conferência e o PDF só com titular e dono (`conferencia_liberada`, `anexo_oculto` só para o titular);
     - o roteamento dos avisos com dado do banco (`leitoresDoCartao`).
   - As lacunas #68 e a parte "privadas" da #66 deixam de existir.
2. **#66, o titular que sai:** um gatilho em `workspace_members` (AFTER DELETE ou UPDATE OF role, quando o papel sai de adulto) zera `credit_cards.holder_user_id` daquela pessoa naquela carteira. Ele pula quando a carteira está sendo apagada ou quando `pg_trigger_depth() > 1`.
3. **#57:** `attachments_enforce_quota` passa a ler o `owner_id` do objeto. Quem não é adulto só cria linha para um objeto que ele mesmo subiu; senão, `raise 'anexo_de_outro'` com `42501`. A captura e a service role (`auth.uid()` nulo) passam.
4. **#60:**
   - nasce a tabela `workspace_ex_convidados(workspace_id, user_id, saiu_em, pk)`, com RLS ligada e sem grant, e um gatilho AFTER DELETE em `workspace_members` quando `old.role = 'guest'`;
   - `accept_workspace_invite` devolve `status 'ex_convidado'` para um convite **por link** de quem está nessa tabela, e apaga a linha num aceite com sucesso;
   - a Edge `workspace-invites-accept` ganha o `case 'ex_convidado'` → 403 "Peça ao dono um convite por e-mail.". **A Edge sobe antes da migração**; o roteiro diz.
5. **#23:** `criar_plano_parcelado` ganha `p_client_id uuid default null`:
   - toma `pg_advisory_xact_lock(hashtext('plano:' || p_client_id))`;
   - devolve o plano que já existe para aquele `client_id`;
   - grava o `client_id` na 1ª parcela por dentro.

   A `capture` passa o `client_id` e deixa de fazer o `update` à parte. `create_workspace_installment_plan`, que o `main` usa, continua compatível pelo `default`.
6. **#79:** `garantir_escrita` também em `projects` (insert e update), `workspace_split_weights` e `workspace_member_limits` (insert, update e delete).
7. **#33:** o vencimento é **o primeiro `min(due_day, dias do mês)` estritamente depois do fechamento**: no mês do fechamento se couber, senão no seguinte.
   - Na colisão de fevereiro (fechamento e vencimento grampeados no mesmo dia), o vencimento vai para o mês seguinte.
   - Os chamadores que assumem "mês seguinte" mudam junto:
     - `payment-events.ts` olha os fechamentos de `ym-1` e `ym`;
     - `jornada.ts` `datasDoCartao` anda para a frente;
     - `insights-daily` `relatorioDoMes` filtra por `estimatedDueYmdForClose(close) ∈ mês`;
     - o texto de `credit-card-billing-copy.ts:42`.
   - **A `credit-card-calendar-alerts` publicada só sobe de novo junto com o front 2.0.**
8. **#35, o estorno no cartão desconta a categoria:**
   - o estorno no cartão (`type = 'income'`, `payment_method = 'credit_card'`, `payment_credit_card_id`) passa a escolher uma categoria **de despesa** no formulário;
   - `gastoDaCategoriaNoMes` e `buildCategoryCommitmentsForMonth` abatem esse estorno da categoria, pelo mesmo mês do fechamento;
   - todo leitor de **receita por categoria** ignora a receita cuja categoria é de despesa (o estorno não é renda);
   - os vetores de paridade do orçamento ganham um caso de estorno.
9. **#48:** "Apagar um" lê os dois lançamentos e mantém, nesta ordem: o que tem anexo, depois o já revisado (`needs_review = false`), depois o mais antigo. Apaga o outro. Se só um ainda existe, só marca o insight `acted`.
10. **#46:** a mudança de preço só casa com descrição normalizada **igual** ao nome da assinatura, ou contida nele **e** com o mesmo `payment_method` **e** (se a assinatura tem cartão) o mesmo cartão.
11. **#81:** a `billing-checkout` atualiza o cliente do Asaas (nome e CPF) quando ele já existe, antes de criar a cobrança. Uma falha só registra o status e segue. O verbo (`PUT` ou `POST /customers/{id}`) vai para o §0 do roteiro do Bloco 8; o código usa o que os fatos de 25/10 indicarem.
12. **#87:**
   - **(a)** `billing_avisos.pendente boolean not null default false`. Os avisos de texto fixo (`fim`, `reembolso`, `estorno`) ficam pendentes até a entrega dar certo, e o `billing-daily` reenvia os pendentes com mais de 1 h;
   - **(b)** o destino do aviso vira uma função só em `_shared/billing.ts`: a carteira pessoal, senão a mais antiga em que a pessoa é dona, senão qualquer uma. Sem nenhuma, vai só por e-mail;
   - **(c)** o texto do estorno concluído no cron decide pelo `billing_parcelamentos.ativado_em`, não pelo `provider_ref` atual.

## Foco de revisão

1. **Sobra do privado.** Nenhum `is_private`, `transacoes_privadas`, `Gasto pessoal`, `guardar_privado` ou `PRIVADO_` sobra em `src/`, `supabase/` ou nos testes, fora do histórico em `docs/`. O titular e a conferência continuam funcionando. (Tarefa 1, varredura de fonte.)
2. **O vencimento em todo lugar.** Um cartão que fecha no dia 5 e vence no 25 dá o vencimento de 25 do mesmo mês: na previsão, no Painel, na jornada, nos avisos e no relatório. Fecha 28 e vence 10 continua 10 do mês seguinte. (Tarefa 3.)
3. **O estorno conta uma vez.** Ele abate o orçamento da categoria e não aparece como renda. A fatura e a previsão não mudam. (Tarefa 4.)
4. **Convite de ex-convidado:**
   - o link recusa;
   - o e-mail aceita;
   - a Edge publicada antes da migração ainda responde certo ao `main`.

   (Tarefa 2.)
5. **Captura simultânea:** dois reenvios ao mesmo tempo dão um plano só, e o `create_workspace_installment_plan` do `main` não muda. (Tarefa 2.)

---

### Tarefa 1: Tirar o gasto privado, manter o titular

**Arquivos:**
- Modificar:
  - `supabase/migrations/20261030120000_privado.sql` (fica só o titular e a conferência);
  - `20261031120000_projetos.sql` (sai a redefinição de `guardar_privado`);
  - `20261031130000_divisao.sql` (sai o ramo `is_private`);
  - `20261101120000_cobranca_asaas.sql` (se citar privado);
  - todo `src/` e `supabase/functions/` que usa o privado;
  - `src/types/database.ts`;
  - os testes do privado.
- Teste: `src/lib/privado/` vira `src/lib/titular/` (só o titular). Um teste de varredura em `src/lib/titular/sem-privado.test.ts`.

**Interfaces (produz):** o banco e o código sem gasto privado. `holder_user_id`, `conferir_titular`, `conferencia_liberada` e `leitoresDoCartao` continuam.

- [ ] **Passo 1: teste que falha.** Uma varredura de `src/` e `supabase/` (fora de `docs/`) não acha `is_private`, `transacoes_privadas`, `guardar_privado`, `PRIVADO_NAO_PERMITIDO`, `PRIVADO_SEM_DETALHE`, `Gasto pessoal`, `comDetalhesPrivados`, `rotuloDaTransacao` nem `podeSerPrivado`. Os testes de titular e conferência continuam.
- [ ] **Passo 2:** rodar a varredura. Esperado: FAIL.
- [ ] **Passo 3:** tirar o privado das migrações, do código, das Edges (`insights-daily`, a notificação de lançamento, `capture`, `virar_*`) e dos wireframes. Manter o titular.
  - As políticas de `transactions` voltam ao estado do 7A com a onda final dele (convidado só `expense`).
  - As de `attachments` e storage ficam com o 7A, mais o ramo do titular do 7B.
  - O teste `colunas-tolerantes` perde as colunas do privado.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run test:edge && npm run build`. Esperado: PASS.
- [ ] **Passo 5:** commit `refactor(privado): carteira é pública entre adultos; fica o titular do cartão`.

### Tarefa 2: Migração do Bloco 9 — convite, anexo, titular, captura e só leitura

**Arquivos:**
- Criar: `supabase/migrations/20261102120000_bloco9.sql`, `src/lib/bloco9/migracao-bloco9.test.ts`
- Modificar:
  - `supabase/functions/workspace-invites-accept/index.ts` (o `case 'ex_convidado'`);
  - `supabase/functions/capture/index.ts` (o `p_client_id`);
  - `src/types/database.ts`;
  - a tela de aceite do convite, para mostrar a frase do 403;
  - `supabase/tests/database/bloco9.test.sql` (pgTAP, para o projeto de teste).

**Interfaces:** as Decisões 2, 3, 4, 5, 6 e 12(a), esta só com a coluna `pendente`.

- [ ] **Passo 1: testes de fonte que falham.** Eles conferem:
  - o gatilho do titular (Decisão 2);
  - o `owner_id` em `attachments_enforce_quota` (Decisão 3);
  - `workspace_ex_convidados`, o gatilho, o status `ex_convidado` e a linha apagada no aceite (Decisão 4);
  - `p_client_id`, `pg_advisory_xact_lock` e o `client_id` gravado por dentro (Decisão 5);
  - os três gatilhos `garantir_escrita` (Decisão 6);
  - `billing_avisos.pendente` (Decisão 12a);
  - na Edge de aceite, o `case 'ex_convidado'` com 403;
  - na `capture`, o `p_client_id` passado e o `update` à parte removido.
- [ ] **Passo 2:** `npx vitest run src/lib/bloco9`. Esperado: FAIL.
- [ ] **Passo 3:** escrever a migração, as Edges e o pgTAP, com os casos: link recusado para ex-convidado; e-mail aceito; dois `criar_plano_parcelado` com o mesmo `client_id` dando o mesmo plano; só leitura barrando projeto, peso e limite; o titular zerado ao sair.
- [ ] **Passo 4:** `npm run test:edge && npx tsc --noEmit && npm run lint && npm run test:unit`, e `deno check` nas duas Edges. Esperado: PASS.
- [ ] **Passo 5:** commit `fix(bloco9): ex-convidado, anexo de outro, titular que sai, captura sem plano duplo e só leitura completa`.

### Tarefa 3: Vencimento no mesmo mês do fechamento (#33)

**Arquivos:**
- Modificar:
  - `src/lib/credit-card-billing.ts` (`estimatedDueDateForClose`);
  - `supabase/functions/_shared/credit-card-cycle.ts` (`estimatedDueYmdForClose` e o comentário de `nextPaymentDueCycleOnOrAfter`);
  - `src/lib/fixtures/billing-calendar-vectors.json`;
  - `src/components/dashboard/payment-events.ts`;
  - `src/lib/jornada/jornada.ts`;
  - `supabase/functions/insights-daily/index.ts` (`relatorioDoMes`);
  - `src/lib/credit-card-billing-copy.ts:42`;
  - os comentários em `fluxo.ts:114` e `transactions-table.tsx:92`.
- Teste: `src/lib/billing-calendar-parity.test.ts` e `supabase/functions/_shared/credit-card-cycle.test.ts` (os dois leem o arquivo de vetores), mais testes de `payment-events`, `jornada` e do relatório.

**Interfaces:** as mesmas assinaturas; muda o resultado (Decisão 7).

- [ ] **Passo 1: vetores que falham.** Eles cobrem:
  - fecha 05/10 e vence 25 → 25/10;
  - fecha 03/10 e vence 10 → 10/10;
  - fecha 28/10 e vence 10 → 10/11;
  - fecha e vence no mesmo dia → mês seguinte;
  - a colisão de fevereiro → março;
  - `payment-events` mostra o vencimento do mês vindo do fechamento do mês anterior **e** do mesmo mês;
  - `datasDoCartao` nunca devolve data passada;
  - o relatório do mês acha a fatura que fechou e venceu no mesmo mês.
- [ ] **Passo 2:** `npx vitest run src/lib && npm run test:edge`. Esperado: FAIL.
- [ ] **Passo 3:** implementar as duas funções iguais e os chamadores. Ajustar os testes antigos que esperavam "mês seguinte" com `due_day > closing_day`.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run test:edge && npm run build`. Esperado: PASS.
- [ ] **Passo 5:** commit `fix(cartao): vencimento no mesmo mês quando vence depois do fechamento`.

### Tarefa 4: O estorno no cartão desconta a categoria (#35)

**Arquivos:**
- Modificar:
  - `src/components/transactions/transaction-form-fields.tsx` (o estorno no cartão filtra as categorias de despesa);
  - `src/components/wireframe/estorno-wireframe.tsx` (se escolhe categoria);
  - `supabase/functions/_shared/orcamento-mes.ts`;
  - `src/lib/category-commitments.ts`;
  - `src/lib/fixtures/orcamento-mes-vectors.json`;
  - todo leitor de receita por categoria. Faça o levantamento com `grep "type === \"income\""` e `type = 'income'`: o card de receita, relatórios, `relatorio_mes`, o Painel e a previsão de receita.
- Teste: os testes de paridade do orçamento (Vitest e Deno) e um teste por leitor de receita mudado.

**Interfaces:** `ehEstornoNoCartao(t: { type, payment_method, payment_credit_card_id }): boolean`, pura, em `_shared` e reexportada pelo cliente.

- [ ] **Passo 1: testes que falham.**
  - Uma compra de R$ 100 em Mercado e um estorno de R$ 30 em Mercado no mesmo ciclo dão R$ 70 no orçamento de Mercado, nos dois lados.
  - A receita do mês não conta o estorno.
  - A fatura e a previsão continuam iguais.
- [ ] **Passo 2:** rodar. Esperado: FAIL.
- [ ] **Passo 3:** implementar. O `evaluate-budgets` compartilhado com o `main` só muda o resultado quando há um estorno com categoria de despesa, o que hoje não existe.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run test:edge && npm run ds:audit -- src/components/wireframe && npm run build`. Esperado: PASS.
- [ ] **Passo 5:** commit `fix(orcamento): estorno no cartão desconta a categoria da despesa`.

### Tarefa 5: Insights — apagar o repetido certo e preço da assinatura certa (#48, #46)

**Arquivos:**
- Modificar: `src/lib/insights/acoes.ts`, `supabase/functions/_shared/insights/detectores.ts`, `supabase/functions/insights-daily/index.ts` (o `select` das assinaturas com `payment_method` e `payment_credit_card_id`), `src/lib/insights/insights.ts` (os tipos reexportados)
- Teste: `src/lib/insights/acoes.test.ts`, `supabase/functions/_shared/insights/detectores.test.ts`

**Interfaces:** `qualApagar(linhas: { id: string; created_at: string; needs_review: boolean; anexos: number }[]): string | null`.

- [ ] **Passo 1: testes que falham.**
  - `qualApagar` mantém o que tem anexo, depois o revisado, depois o mais antigo.
  - Com uma linha só, devolve `null`.
  - "Amazon" 14,90 contra "Amazon compra" 19,90 em outro cartão não vira insight.
  - O mesmo cartão, ou o nome igual, ainda vira.
- [ ] **Passo 2:** rodar. Esperado: FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npm run test:edge && npx tsc --noEmit && npm run lint && npm run test:unit`. Esperado: PASS.
- [ ] **Passo 5:** commit `fix(insights): apaga o repetido sem anexo e casa o preço pela assinatura certa`.

### Tarefa 6: Cobrança — cliente atualizado e avisos que não se perdem (#81, #87)

**Arquivos:**
- Modificar: `supabase/functions/_shared/asaas.ts` (`atualizarCliente`), `supabase/functions/_shared/billing.ts` (`destinoDoAviso`, `textoDoEstornoConcluido`), `supabase/functions/billing-checkout/index.ts`, `billing-daily/index.ts`, `asaas-webhook/index.ts`, `billing-cancel/index.ts`
- Teste: `supabase/functions/_shared/asaas.test.ts`, `supabase/functions/_shared/billing.test.ts`, `src/lib/planos/edges-planos.test.ts`

**Interfaces:**
- `atualizarCliente(cfg, id, { nome, cpf, email })`;
- `destinoDoAviso(...)`, que ranqueia pessoal, depois dona, depois qualquer uma;
- `textoDoEstornoConcluido(p: { ativado_em: string | null })`, que dá `'reembolso'` ou `'estorno'`;
- `reenviarAvisos(ctx)` no `billing-daily`.

- [ ] **Passo 1: testes que falham.**
  - `atualizarCliente` usa o caminho, o verbo e um corpo sem `externalReference`.
  - O checkout chama `atualizarCliente` quando o cliente já existe, e a falha não bloqueia a compra.
  - `destinoDoAviso` segue a ordem da Decisão 12(b).
  - `textoDoEstornoConcluido` decide por `ativado_em`.
  - O `billing-daily` reenvia os avisos pendentes com mais de 1 h e marca `pendente = false` quando a entrega dá certo.
  - O webhook e o cancel usam a mesma reivindicação.
- [ ] **Passo 2:** `npm run test:edge && npx vitest run src/lib/planos`. Esperado: FAIL.
- [ ] **Passo 3:** implementar. O verbo do Asaas sai dos arquivos de fatos de 25/10; se eles não decidirem, use `PUT`, e o roteiro do Bloco 8 ganha a pergunta no §0.
- [ ] **Passo 4:** `npm run test:edge && npx tsc --noEmit && npm run lint && npm run test:unit`, e `deno check` nas quatro Edges de cobrança. Esperado: PASS.
- [ ] **Passo 5:** commit `fix(cobranca): cliente atualizado no Asaas e avisos de cobrança que não se perdem`.

### Tarefa 7: Roteiros, jornadas, mapa das lacunas e Atlas

**Arquivos:**
- Criar: `supabase/BLOCO_9_DEPLOYMENT.md`
- Modificar:
  - `supabase/BLOCO_7B_DEPLOYMENT.md` (vira só o titular);
  - `supabase/BLOCO_7C_DEPLOYMENT.md` e `supabase/BLOCO_8_DEPLOYMENT.md` (o que citava o privado; a pergunta do verbo do cliente no §0 do 8);
  - `docs/JORNADAS.md` (a jornada 17 vira "Titular do cartão", sai a 17a do privado, e sai o privado das outras jornadas);
  - `docs/LACUNAS-MAPA.md`;
  - `docs/atlas/template.html` e `docs/atlas/atlas-jornadas.html` (gerado).

**O roteiro do Bloco 9:**
1. A **ordem**:
   - a Edge `workspace-invites-accept` sobe **antes** da migração `20261102120000_bloco9.sql`;
   - a `capture` sobe depois da migração;
   - a `credit-card-calendar-alerts` e as Edges de cobrança só sobem com o front 2.0.
2. O pgTAP `bloco9.test.sql` roda no projeto de teste, junto com os dos Blocos 7B a 8.
3. As conferências SQL de depois, só leitura.

**As lacunas:**
- fecham:
  - as #33, #35, #46, #48, #57, #60, #79, #81 e #87;
  - a #66, porque o titular passa a ser zerado ao sair;
  - a #68 e as do privado (61 a 68), que deixam de existir;
- abrem:
  - "o estorno lançado antes do Bloco 9 tem categoria de receita e não desconta o orçamento";
  - "aviso já entregue por push ou e-mail não se recolhe".

**O Atlas:** as mesmas jornadas, as lacunas e a capa. Depois, `python3 docs/atlas/build.py`.

- [ ] **Passo 1:** escrever o roteiro e ajustar os dos Blocos 7B, 7C e 8.
- [ ] **Passo 2:** atualizar `JORNADAS.md`, `LACUNAS-MAPA.md` e `template.html`, e rodar o `build.py`.
- [ ] **Passo 3:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run build`. Esperado: PASS.
- [ ] **Passo 4:** commit `docs(bloco9): roteiro, jornadas, lacunas e Atlas`.
