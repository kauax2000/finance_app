# Bloco 9b — as lacunas que o Bloco 9 deixou: plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para executar este plano tarefa a tarefa. Os passos usam checkbox (`- [ ]`).

**Objetivo:** fechar as lacunas #94, #95, #96 e #97 de `docs/JORNADAS.md` §19. A #92, do estorno antigo, fica aberta por decisão do dono (26/10).

**Arquitetura:**
- **Cobrança e captura:** mudam editando no lugar a `20261102120000_bloco9.sql`, que nunca foi aplicada em lugar nenhum.
- **O resto é Edge e teste:**
  - a `credit-card-calendar-alerts` avisa as duas faturas que vencem no mesmo dia;
  - a `capture` deixa de duplicar a foto;
  - o `billing-daily` desiste depois de um teto de tentativas.
- **A #96 não acontece:**
  - o insight de lançamento repetido é da carteira (`user_id` nulo);
  - a política `insights_select` (`20261029120000_papeis.sql:428-441`) e o envio (`insights-daily`, `adultosDaCarteira`) o escondem do convidado;
  - todo adulto enxerga os dois lançamentos.

  A tarefa vira um teste que trava isso e o fechamento da lacuna.

**Tecnologia:** Next 16 / React 19, Supabase (Postgres, Edge em Deno), Vitest e Deno test. Nenhuma dependência nova.

**Fontes:**
- `docs/JORNADAS.md` §19 (#94–#97);
- o roteiro `supabase/BLOCO_9_DEPLOYMENT.md`;
- o plano do Bloco 9 em `docs/superpowers/plans/2026-10-26-bloco-9-correcoes.md`.

## Restrições globais

- **O banco de dev é o de produção.** Nenhuma tarefa roda `db push`, deploy ou SQL contra o projeto. Quem publica é o dono.
- **O `main` continua no ar.**
  - A Edge `credit-card-calendar-alerts`, compartilhada com o `main`, só é republicada junto com o front.
  - As chaves de deduplicação já gravadas continuam valendo, para nenhum aviso sair duas vezes no dia da republicação.
- **O repositório é público.** Nenhuma chave, ref de projeto ou dado real.
- **Testes:**
  - o SQL é trancado por teste de fonte (`src/test/migracoes.ts`) e pelo pgTAP em `supabase/tests/database/`, que roda no projeto de teste;
  - a Edge é testada por `npm run test:edge`;
  - a lógica pura do Deno mora em `_shared`, sem dependência.
- **Fechamento de cada tarefa:** `npx tsc --noEmit && npm run lint && npm run test:unit`, mais `npm run test:edge` quando a tarefa mexe em Edge.
  - Antes do `tsc`, rode `find .next -name "* [0-9]*.ts" -delete`.
  - Não ponha `graphify-out/` no stage, e reverta o `deno.lock`.

## Decisões (o orquestrador registra no ledger)

1. **#94, duas faturas no mesmo vencimento.** A `credit-card-calendar-alerts` olha o ciclo de `nextPaymentDueCycleOnOrAfter` **e o seguinte**. Se os dois vencem no mesmo dia, gera os eventos dos dois.
   - O primeiro mantém a chave de hoje: `cal:due_soon:<venc>:c:<cartão>`.
   - O segundo leva o sufixo `:f:<fechamento>`.
   - Cada um checa o pagamento da sua janela (`checkPaid` por `win.end`, como já é).
2. **#95, captura.**
   - **(a)** A foto da compra com `client_id` sobe num caminho fixo, `<workspace>/<client_id>.<ext>`, com `upsert: false`. Se o upload responde que o objeto já existe, a linha do anexo não é criada e a resposta diz `anexo: true`. Sem `client_id`, o caminho segue aleatório.
   - **(b)** `criar_plano_parcelado` procura o plano do `client_id` em **qualquer** carteira, e não só no destino. Se achar, devolve esse plano.
3. **#97, aviso de cobrança.**
   - `billing_avisos.tentativas int not null default 0` entra na `20261102120000_bloco9.sql`, ao lado de `pendente`.
   - O reenvio do `billing-daily` soma 1 a cada tentativa.
   - Na 7ª tentativa sem sucesso (7 dias, com o cron diário), grava `pendente = false` e registra no log `desistiu`.
4. **#96:** um teste de fonte trava três coisas, sem mudar o código:
   - a duplicidade é gravada com `user_id: null`;
   - a `insights_select` final só mostra o insight da carteira a adulto;
   - o envio de push usa `adultosDaCarteira`.

## Foco de revisão

1. **Republicação:** no dia em que a `credit-card-calendar-alerts` sobe de novo, um aviso que já saiu não sai de novo, porque a chave do primeiro ciclo não mudou.
2. **Caso comum do cartão:** um cartão com um vencimento só por mês recebe exatamente os mesmos eventos de antes.
3. **Retry da captura:** o retry de verdade (não simultâneo) continua com um anexo só.
4. **Objeto órfão:** um objeto órfão do 1º envio, sem linha de anexo, não deixa a compra sem anexo para sempre.
5. **Teto do aviso:** o teto não apaga o registro. A deduplicação continua barrando o reenvio.

---

### Tarefa 1: Duas faturas no mesmo vencimento (#94)

**Arquivos:**
- Modificar:
  - `supabase/functions/credit-card-calendar-alerts/index.ts`, no bloco de `dueCycle` (por volta das linhas 176-207);
  - se precisar de função pura, `supabase/functions/_shared/credit-card-cycle.ts` (`dueCyclesOnOrAfter`).
- Teste: `supabase/functions/_shared/credit-card-cycle.test.ts` e o teste de fonte da Edge, se houver.

**Interfaces:** `dueCyclesOnOrAfter(today: Ymd, closingDay: number, dueDay: number): { close: Ymd; due: Ymd }[]` devolve 1 ou 2 ciclos: o de `nextPaymentDueCycleOnOrAfter` e, se vencer no mesmo dia, o seguinte.

- [ ] **Passo 1: testes que falham.**
  - Cartão que fecha no dia 30 e vence no 31, com hoje em 29/05/2026: dois ciclos, com fechamentos em 30/04 e 30/05, ambos vencendo em 31/05.
  - Cartão que fecha no 28 e vence no 10: um ciclo só.
  - A chave do primeiro evento continua `cal:due_soon:2026-05-31:c:<id>`.
  - A do segundo é `cal:due_soon:2026-05-31:c:<id>:f:2026-05-30`.
- [ ] **Passo 2:** `npm run test:edge`. Esperado: FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npm run test:edge && npx tsc --noEmit && npm run lint && npm run test:unit`, e `deno check` na Edge. Esperado: PASS.
- [ ] **Passo 5:** commit `fix(cartao): as duas faturas do mesmo vencimento recebem aviso`.

### Tarefa 2: Captura sem foto dupla e sem plano em duas carteiras (#95)

**Arquivos:**
- Modificar:
  - `supabase/functions/capture/index.ts`, por volta das linhas 308-360: o caminho da foto, o upload e o `ponytail:` que sai;
  - `supabase/migrations/20261102120000_bloco9.sql`: a busca do `client_id` em `criar_plano_parcelado`, por volta das linhas 301-306;
  - `supabase/tests/database/bloco9.test.sql`;
  - `src/lib/bloco9/migracao-bloco9.test.ts`.

- [ ] **Passo 1: testes que falham.**
  - Fonte da `capture`: com `client_id`, o caminho é `${workspace}/${client_id}.${ext}`.
  - Fonte da `capture`: o upload que volta "já existe" não cria a linha de anexo e marca `anexo = true`.
  - Fonte da migração: a busca do `client_id` não filtra por `workspace_id`.
  - pgTAP: o mesmo `client_id` com destino diferente devolve o plano já criado.
- [ ] **Passo 2:** `npx vitest run src/lib/bloco9`. Esperado: FAIL.
- [ ] **Passo 3:** implementar. Reconheça o erro de "já existe" do Storage pelo status ou pela mensagem que o cliente de Storage do supabase-js devolve; procure o padrão no código do projeto antes de inventar um.
- [ ] **Passo 4:** `npm run test:edge && npx tsc --noEmit && npm run lint && npm run test:unit`, e `deno check` na `capture`. Esperado: PASS.
- [ ] **Passo 5:** commit `fix(captura): um anexo e um plano por client_id, mesmo em reenvios simultâneos`.

### Tarefa 3: Teto do aviso de cobrança pendente (#97)

**Arquivos:**
- Modificar:
  - `supabase/migrations/20261102120000_bloco9.sql` (a coluna `tentativas`);
  - `supabase/functions/billing-daily/index.ts` (`reenviarAvisos`);
  - `supabase/functions/_shared/billing.ts`;
  - `src/types/database.ts`;
  - `src/lib/planos/edges-planos.test.ts`.
- Teste: `supabase/functions/_shared/billing.test.ts`.

**Interfaces:**
- `MAX_TENTATIVAS_AVISO = 7` em `_shared/billing.ts`;
- `desisteDoAviso(tentativas: number): boolean`, que é `tentativas >= MAX_TENTATIVAS_AVISO`.

- [ ] **Passo 1: testes que falham.**
  - `desisteDoAviso(6) === false` e `desisteDoAviso(7) === true`.
  - Fonte: o reenvio soma `tentativas` na mesma escrita da reivindicação (o compare-and-swap em `enviado_em`).
  - Fonte: ao desistir, grava `pendente: false` e registra `desistiu` no log.
- [ ] **Passo 2:** `npm run test:edge && npx vitest run src/lib/planos`. Esperado: FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npm run test:edge && npx tsc --noEmit && npm run lint && npm run test:unit`, e `deno check` no `billing-daily`. Esperado: PASS.
- [ ] **Passo 5:** commit `fix(cobranca): o aviso pendente desiste depois de 7 tentativas`.

### Tarefa 4: Trava da #96 e documentos

**Arquivos:**
- Criar: `src/lib/insights/duplicidade-da-casa.test.ts`.
- Modificar:
  - `docs/JORNADAS.md` §19: fecham as #94, #95, #96 e #97, e a #92 continua aberta;
  - `docs/LACUNAS-MAPA.md`;
  - `docs/atlas/template.html`, com a data e as contagens;
  - `docs/atlas/atlas-jornadas.html`, que é gerado;
  - `supabase/BLOCO_9_DEPLOYMENT.md`: o teto do aviso, a `capture` e a `credit-card-calendar-alerts` que mudaram, e o pgTAP novo.

- [ ] **Passo 1:** escrever o teste da Decisão 4. Ele deve passar já, sem mudança de código; se falhar, pare e reporte, porque aí a #96 seria real.
- [ ] **Passo 2:** atualizar os documentos e rodar `python3 docs/atlas/build.py`.
- [ ] **Passo 3:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run build`. Esperado: PASS.
- [ ] **Passo 4:** commit `docs(bloco9b): lacunas fechadas, roteiro e Atlas`.
