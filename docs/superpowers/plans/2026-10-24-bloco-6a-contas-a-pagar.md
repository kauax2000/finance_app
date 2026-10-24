# Bloco 6A — Contas a pagar: auditoria e revisão — plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para executar este plano tarefa a tarefa. Os passos usam checkbox (`- [ ]`).

**Objetivo:** contas a pagar passam a funcionar de ponta a ponta. O bloco entrega:
- a recorrência que não trava;
- a edição que reprograma;
- o fim que encerra;
- o "pular" atômico;
- o aviso que não se perde num dia sem cron;
- o valor variável pela média;
- o casamento automático com um lançamento que já pagou a conta;
- o boleto anexo à instância, que aparece no pagamento;
- o fim do "Beta".

O motor de insights é o Bloco 6B, em `docs/superpowers/plans/2026-10-24-bloco-6b-insights.md`.

**Arquitetura:**
- **Uma regra de recorrência só.** Ela mora em `supabase/functions/_shared/recorrencia-conta.ts`, puro e sem import, com datas `YYYY-MM-DD`. `src/lib/bills/recurrence.ts` a reexporta, como `src/lib/captura/frase.ts` faz com `_shared/frase.ts`. O cliente e a Edge leem a mesma regra.
- **O cron de lembretes ganha um passo 0,** gerar as instâncias que faltam. Assim, uma conta nunca paga não para a recorrência: cada ciclo vencido continua devido.
- **O banco garante o resto:**
  - pular e ligar um pagamento são RPCs atômicos;
  - apagar o lançamento de uma conta paga reabre a instância;
  - a conta de valor variável tem o estimado pela média das 3 últimas pagas.
- **Telas:** entram como wireframes (`AGENTS.md`). O "Beta" sai do design system existente; isso é a remoção de uma marca, não um componente novo.

**Tecnologia:** Next 16 / React 19, Supabase (Postgres, Edge em Deno, pg_cron), Vitest e Deno test. Nenhuma dependência nova.

**Spec:** `docs/superpowers/specs/2026-10-20-proposta-funcional-design.md`, §11 "Revisão de Contas a pagar (P6)".

## Restrições globais

- **O banco de dev é o de produção.** Nenhuma tarefa roda `supabase db push`, deploy ou SQL contra o projeto. Quem publica é o orquestrador, e só com o pedido explícito do dono.
- **O front de `main` continua em produção até o fim do 2.0.** Por isso:
  - as migrações só acrescentam;
  - `pay_bill_instance` mantém a assinatura e o comportamento;
  - `bills` e `bill_instances` aceitam os inserts e updates de hoje;
  - as Edges existentes aceitam os mesmos pedidos.
- **O repositório é público.** Nenhuma chave, URL de projeto ou dado real entra nele.
- **Assinatura e conta a pagar são distintas** (spec §11, literal):
  - a assinatura cobra sozinha, e o app lança;
  - a conta a pagar é paga pela pessoa, e o app lembra e confirma;
  - o Pix Automático é assinatura.
- **O casamento automático usa estes números** (spec §11): descrição parecida, valor dentro de **±15%** e data dentro de **±5 dias**. A pergunta é "isso pagou a conta {nome}?". Um toque liga os dois, sem lançar duas vezes.
- **Data do app:** `America/Sao_Paulo`. No servidor valem `app_today()` e `appTodayYmd()`; no cliente, o dia local, recalculado quando a janela volta a ter foco.
- **Testes:**
  - O Vitest roda em ambiente `node`, só `src/**/*.test.ts`.
  - O Deno roda `supabase/functions/_shared/*.test.ts` (`npm run test:edge`).
  - Os testes de fonte usam `lerFonte` e `semComentarios` de `@/test/fonte`.
  - O teste que importa `@/lib/supabase` faz `vi.mock`.
- **Wireframe** (`AGENTS.md`):
  - só em `src/components/wireframe/`;
  - etiqueta `WIREFRAME · Bloco 6 · <funcionalidade>`, com o `WireframeBox`;
  - controles nativos, e todo `<button>` declara `type`;
  - nada de `@/components/ui`;
  - funciona de verdade.
- **Mudança de jornada:** a Tarefa 7 atualiza `docs/JORNADAS.md` e `docs/atlas/template.html` e roda `python3 docs/atlas/build.py`. O orquestrador republica.
- **Fechamento de cada tarefa:** `npx tsc --noEmit && npm run lint && npm run test:unit`.
  - Também `npm run test:edge` quando a tarefa mexe em `supabase/functions`.
  - Também `npm run ds:audit -- src/components/wireframe` quando mexe em wireframe.
  - Também `npm run build` quando mexe em tela.
  - Se o `tsc` acusar cópias `.next/**/* N.ts`, apague-as com `find .next -name "* [0-9]*.ts" -delete`.
  - Não ponha `graphify-out/` no stage, e reverta qualquer mudança no `deno.lock`.

## Decisões desta rodada (o orquestrador registra no ledger)

1. **A conta que não é paga não para.**
   - O passo 0 do `evaluate-bills-reminders` cria, para cada conta ativa e não `one_time`, a instância `pending` de cada vencimento que já chegou (até hoje), a partir da última instância. Ele respeita o `end_date` e usa `on conflict do nothing` em `(bill_id, due_date)`.
   - Três meses sem pagar viram três pendências vencidas, uma por mês, porque é o que se deve.
   - O limite de 60 dias do lembrete continua valendo para o aviso, não para a geração.
2. **A próxima data continua contada do vencimento pago, e não do dia do pagamento.** O ciclo é a referência. Com o passo 0, pagar uma conta atrasada não cria uma fila de atrasadas novas.
3. **Editar a agenda de uma conta reprograma a instância pendente.**
   - Ao mudar `due_day_of_month`, `frequency`, `start_date` ou `end_date`, a pendente que ainda não venceu (`due_date >= hoje`) passa à nova data, que é `computeFirstDueYmd` a partir de hoje.
   - A pendente vencida não muda, porque é dívida de um ciclo que já passou.
   - Reativar uma conta sem pendente cria a próxima.
4. **O fim encerra.**
   - Não nasce instância depois do `end_date`, nem a primeira.
   - O lembrete ignora a instância depois do `end_date`.
   - A conta com o `end_date` vencido e sem pendente aparece como "Encerrada".
   - A `one_time` paga aparece como "Concluída".
   - Os dois estados são calculados, sem coluna nova.
5. **Pular é atômico:** `pular_instancia_da_conta(p_instance_id uuid, p_next_due_date date)`. Ele falha com `BILL_INSTANCE_NOT_PENDING` quando a instância não está pendente.
6. **Apagar o lançamento de uma conta paga reabre a instância.** Ela volta a `pending`, e `paid_at`, `paid_amount`, `transaction_id` e `amount` ficam nulos. Mudar o valor do lançamento atualiza o `paid_amount`. Os dois casos são gatilhos em `transactions`.
7. **O valor variável pela média.**
   - A coluna nova é `bills.valor_variavel boolean not null default false`.
   - Quando uma instância de conta com `valor_variavel` vira `paid`, um gatilho grava `bills.amount_estimated` como a média dos `paid_amount` das 3 últimas pagas, arredondada a centavo.
   - Todo leitor (lista, lembrete, previsão do Bloco 5) já usa `amount_estimated`, então fica uma fonte só.
8. **O casamento automático é calculado no cliente, sobre os lançamentos recentes, e aparece na lista de Pendentes.** Assim ele cobre qualquer canal, porque a captura chega pela Edge.
   - A regra mora em `src/lib/bills/casamento.ts`.
   - A semelhança da descrição reusa o casador de palavras de `src/lib/fatura/conferir.ts`.
   - Um toque chama `ligar_pagamento_da_conta(p_instance_id, p_transaction_id, p_next_due_date)`, que marca a instância paga com o valor e a data do lançamento e liga os dois, sem lançamento novo.
   - Um lançamento já ligado a uma instância não casa de novo.
9. **O boleto é anexo da instância**, como já é hoje. Ele não é copiado ao pagar: o diálogo de pagar mostra o anexo, e o detalhe do lançamento pago mostra os anexos da instância ligada (por `bill_instances.transaction_id`). A tabela `attachments` não tem política de `update`, e não ganha uma.
10. **O "hoje" da tela de contas** é recalculado no foco da janela e na virada do dia. Hoje ele nasce congelado por `useMemo([])`, em `page-client.tsx:217`.
11. **O aviso de lembrete por janela.** O dia exato (`o === daysUntil`) vira "o primeiro dia dentro da janela ainda não avisado", como `withinReminderWindow` dos cartões. O `releaseDedupe` passa a filtrar também por `sent_on`.
12. **O pagamento com data no futuro** é recusado no diálogo ("A data do pagamento não pode ser depois de hoje.").

## Foco de revisão

1. **Instância duplicada.** O passo 0, o pagamento e o pular podem rodar no mesmo dia, mas dão uma instância só por `(bill_id, due_date)`. Pagar uma atrasada de 3 meses não cria vencidas novas além das que o passo 0 já criou. (Tarefa 1, testes da regra. Tarefa 3, teste de fonte do `on conflict`.)
2. **O fim de mês.**
   - Uma conta do dia 31 vence no último dia em fevereiro (28/29) e em abril (30).
   - A `quarterly` iniciada em 31/01 vence em 30/04.
   - A `yearly` de 29/02 vence em 28/02 no ano que não é bissexto.
   - (Tarefa 1.)
3. **Casamento errado ou duplo.**
   - O lançamento de R$ 200 não casa com uma conta de R$ 150 (33% acima).
   - O de R$ 172 casa (14,7%).
   - Um lançamento casa com uma conta só, a de maior semelhança.
   - Um lançamento já ligado não reaparece.
   - Uma receita nunca casa.
   - (Tarefa 5.)
4. **Lançamento apagado ou editado depois de pagar.** A instância reabre, a conta volta a "Pendentes", e o lembrete volta a valer. O `paid_amount` acompanha a edição. (Tarefa 2, teste de fonte dos gatilhos.)
5. **Valor variável sem histórico.**
   - Com 0 pagas, fica o `amount_estimated` digitado, ou nulo.
   - Com 1 ou 2 pagas, a média é das que existem.
   - Uma paga com `paid_amount` nulo não entra.
   - (Tarefa 2.)

---

### Tarefa 1: A regra única de recorrência das contas

**Arquivos:**
- Criar: `supabase/functions/_shared/recorrencia-conta.ts` e `recorrencia-conta.test.ts` (Deno)
- Modificar: `src/lib/bills/recurrence.ts` (passa a reexportar e a adaptar) e os testes existentes dele

**Interfaces (produz), em `_shared/recorrencia-conta.ts`, sem nenhum import:**
```ts
export type Frequencia = 'monthly' | 'bimonthly' | 'quarterly' | 'yearly' | 'one_time'
export function primeiroVencimento(inicioYmd: string, diaDoVencimento: number): string
export function proximoVencimento(depoisDeYmd: string, frequencia: Frequencia, diaDoVencimento: number): string | null
export function proximoVencimentoDaConta(conta: { frequency: Frequencia; due_day_of_month: number; end_date: string | null; is_active: boolean }, vencimentoPagoYmd: string): string | null
export function vencimentosQueFaltam(conta: { frequency: Frequencia; due_day_of_month: number; end_date: string | null; is_active: boolean }, ultimoVencimentoYmd: string, hojeYmd: string): string[]   // os vencimentos depois do último, até hoje, inclusive
```
- Hoje, `src/lib/bills/recurrence.ts` exporta `computeFirstDueYmd`, `computeNextDueYmd`, `computeNextBillInstanceDueYmd` e `billStartYmd`. Eles passam a chamar as funções acima, com a mesma assinatura e o mesmo resultado.
- O dia é limitado ao tamanho do mês (31 → 30, 28 ou 29).
- `vencimentosQueFaltam` devolve `[]` para `one_time` e para conta inativa, e para ao passar do `end_date`.

- [ ] **Passo 1: testes Deno que falham.**
  - Fim de mês: 31 em fevereiro, abril e no ano bissexto.
  - `quarterly` de 31/01 vence em 30/04.
  - `yearly` de 29/02 vence em 28/02.
  - `one_time` dá `null`.
  - `end_date` corta a recorrência.
  - `vencimentosQueFaltam`, com o último vencimento em 10/08 e hoje 15/11 (mensal, dia 10), dá `['2026-09-10','2026-10-10','2026-11-10']`.
  - Com hoje em 09/11, dá até `'2026-10-10'`.
- [ ] **Passo 2:** `npm run test:edge`. Esperado: FAIL.
- [ ] **Passo 3:** implementar, e fazer o `recurrence.ts` reexportar. Os testes Vitest existentes da recorrência continuam passando sem mudança.
- [ ] **Passo 4:** `npm run test:edge && npx tsc --noEmit && npm run lint && npm run test:unit`. Esperado: PASS.
- [ ] **Passo 5:** commit `refactor(contas): regra única de recorrência no _shared`.

### Tarefa 2: Migração — valor variável, pular e ligar atômicos, e reabrir ao apagar

**Arquivos:**
- Criar: `supabase/migrations/20261027120000_contas.sql`
- Modificar: `src/types/database.ts` e `src/lib/supabase.ts` (`Bill.valor_variavel`)
- Teste: `src/lib/bills/migracao-contas.test.ts` (teste de fonte)

**Interfaces (produz):**
- **`bills.valor_variavel boolean not null default false`.**
- **`public.media_da_conta() returns trigger`:** `after update of status on bill_instances`, quando `new.status = 'paid'` e `old.status <> 'paid'`. Se a conta tem `valor_variavel`, faz `update bills set amount_estimated = round(avg(paid_amount), 2)` das 3 últimas instâncias `paid` com `paid_amount` não nulo, ordenadas por `due_date desc`.
- **`public.pular_instancia_da_conta(p_instance_id uuid, p_next_due_date date) returns void`:** `security invoker`, `set search_path = public`, como o `pay_bill_instance`.
  - Faz `update … set status = 'skipped' where id = p_instance_id and status = 'pending'`; sem linha, `raise exception 'BILL_INSTANCE_NOT_PENDING'`.
  - Com `p_next_due_date` não nulo, insere a próxima instância `pending` com `on conflict do nothing`.
  - O grant é para `authenticated` e `service_role`.
- **`public.ligar_pagamento_da_conta(p_instance_id uuid, p_transaction_id uuid, p_next_due_date date) returns void`:** `security invoker`. A ordem é esta:
  1. Confere que o lançamento é `expense`, da mesma carteira e que nenhuma `bill_instances` já aponta para ele. Senão, `raise exception 'TRANSACTION_ALREADY_LINKED'`.
  2. Faz o `update` da instância `pending` para `paid`, com `paid_amount = tx.amount`, `amount = tx.amount`, `paid_at = tx.date`, `payment_method` e `payment_credit_card_id` do lançamento e `transaction_id`. Sem linha, `raise 'BILL_INSTANCE_NOT_PENDING'`.
  3. Insere a próxima instância, como no pular.
  4. O grant é igual ao do pular.
- **`public.reabrir_instancia_ao_apagar() returns trigger`:** `before delete on transactions`, `security definer`, `set search_path = ''`. Faz `update bill_instances set status = 'pending', paid_at = null, paid_amount = null, amount = null, transaction_id = null where transaction_id = old.id`. Retorna `old`.
- **`public.acompanhar_valor_pago() returns trigger`:** `after update of amount on transactions`. Faz `update bill_instances set paid_amount = new.amount, amount = new.amount where transaction_id = new.id and status = 'paid'`.
- **Compatibilidade:** os gatilhos novos convivem com os do Bloco 4 (`garantir_escrita`, `origem_do_cron`). Um `delete` em cascata da carteira passa pelo `reabrir`, que só faz `update` de instâncias da mesma carteira que também está sendo apagada; confira que isso não falha.

- [ ] **Passo 1: teste de fonte que falha.** Ele confere:
  - a coluna e o padrão;
  - a média das 3 últimas pagas com `paid_amount is not null`;
  - as duas RPCs com as mensagens `BILL_INSTANCE_NOT_PENDING` e `TRANSACTION_ALREADY_LINKED` e o `on conflict do nothing`;
  - os dois gatilhos em `transactions` (o `before delete` retornando `old`);
  - o `pay_bill_instance` intocado (o arquivo novo não o recria);
  - nenhum `drop column`.
- [ ] **Passo 2:** `npx vitest run src/lib/bills/migracao-contas.test.ts`. Esperado: FAIL.
- [ ] **Passo 3:** escrever a migração e os tipos.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run test:unit`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(contas): valor variável, pular e ligar atômicos, e reabrir ao apagar`.

### Tarefa 3: O cron de contas — gerar o que falta e avisar por janela

**Arquivos:**
- Modificar: `supabase/functions/evaluate-bills-reminders/index.ts` e `supabase/functions/_shared/notification-schedule.ts` (se a janela ganhar um helper)
- Teste: `src/lib/bills/edge-contas.test.ts` (teste de fonte) e os testes Deno do helper

**Interfaces:**
- Consome a Tarefa 1 (`vencimentosQueFaltam`, `proximoVencimentoDaConta`).
- **O passo 0, antes dos lembretes.**
  - Para cada conta ativa, não `one_time` e com instância, pega a última instância por `due_date` e insere as `pending` de `vencimentosQueFaltam(conta, ultima.due_date, hoje)` com `on conflict (bill_id, due_date) do nothing`.
  - As contas são paginadas por `id` (500).
  - O `user_id` da instância nova é o da conta.
  - Devolve a contagem `geradas` no JSON.
- **Os lembretes.**
  - Um offset `o` de `reminder_days_before` é devido quando `daysUntil <= o`, `daysUntil >= 0` e ainda não houve dedupe daquele offset. Esse é o critério `withinReminderWindow`, e assim um dia sem cron não perde o aviso.
  - Entre os offsets devidos, só o menor é avisado: num dia, um aviso por instância.
  - Depois do `end_date` da conta não há aviso.
- **`releaseDedupe`** passa a filtrar também por `sent_on`.

- [ ] **Passo 1: testes que falham.**
  - Deno, para a escolha do offset:
    - com `[3,0]`, `daysUntil = 2` sem nada avisado avisa 3;
    - com 3 já avisado, não avisa;
    - com `daysUntil = 0`, avisa 0.
  - Teste de fonte:
    - o passo 0 antes do laço de lembretes, com `on conflict` e `vencimentosQueFaltam`;
    - a checagem do `end_date`;
    - o `sent_on` no `releaseDedupe`.
- [ ] **Passo 2:** `npm run test:edge && npx vitest run src/lib/bills/edge-contas.test.ts`. Esperado: FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npm run test:edge && npx tsc --noEmit && npm run lint && npm run test:unit`. Esperado: PASS.
- [ ] **Passo 5:** commit `fix(contas): recorrência não trava e lembrete por janela`.

### Tarefa 4: Correções no cliente — editar, pular, encerrar, valor variável e "hoje"

**Arquivos:**
- Modificar:
  - `src/lib/bills/mutations.ts`: `insertBillWithFirstInstanceOnline` respeita o `end_date`; `updateBillRow` reprograma a pendente futura; `skipBillInstance` usa a RPC;
  - o handler offline `src/lib/offline/handlers/bills.ts`;
  - `src/components/bills/bill-form-shared.ts` (a validação do `end_date`) e `bill-form-fields.tsx` (monta os wireframes);
  - `src/components/bills/bill-status.ts` (os estados "Encerrada" e "Concluída");
  - `src/app/(app)/bills/page-client.tsx` (o "hoje" vivo);
  - `src/components/bills/pay-bill-dialog.tsx` (a data no futuro).
- Criar:
  - `src/components/wireframe/conta-valor-variavel-wireframe.tsx`;
  - `src/components/wireframe/conta-ou-assinatura-wireframe.tsx`.
- Testes: os de `mutations`, `bill-form-shared`, `bill-status` e da página (crie onde faltar).

**Interfaces:**
- Consome a Tarefa 1 (a recorrência) e a Tarefa 2 (`pular_instancia_da_conta` e `valor_variavel`).
- **`updateBillRow`:**
  - Quando o payload muda `due_day_of_month`, `frequency`, `start_date` ou `end_date`, depois do `update` da conta, a instância `pending` com `due_date >= hoje` vai a `primeiroVencimento(max(hoje, start_date), due_day)`.
  - Se essa data passar do `end_date`, a pendente é apagada.
  - Reativar uma conta sem pendente cria a próxima.
  - Tudo isso no caminho online. No offline, a mesma lógica entra no handler.
- **`statusDaConta(conta, pendentes, hojeYmd)`** devolve `'ativa' | 'encerrada' | 'concluida' | 'inativa'`. "Encerrada" é o `end_date` antes de hoje sem pendente; "Concluída" é a `one_time` sem pendente com uma paga.
- **`ContaValorVariavelWireframe({ valorVariavel, onChange })`**, etiqueta `WIREFRAME · Bloco 6 · Valor variável`: a caixa "O valor muda todo mês (luz, água)" e o texto "O valor estimado passa a ser a média dos 3 últimos pagamentos. Ao pagar, você confirma o valor real.".
- **`ContaOuAssinaturaWireframe({ onde: 'conta' | 'assinatura' })`**, etiqueta `WIREFRAME · Bloco 6 · Conta ou assinatura`. É uma linha de explicação com link para o outro cadastro:
  - **na conta:** "Conta a pagar: você paga, e o app lembra e confirma. Se é cobrado sozinho no cartão ou no Pix Automático, cadastre como assinatura.";
  - **na assinatura:** "Assinatura: é cobrada sozinha, e o app lança. Se você paga por boleto ou Pix, cadastre como conta a pagar.".

  Ele é montado nos dois formulários.
- **Validações do formulário:** "A data de fim não pode ser antes do início." e, no pagamento, "A data do pagamento não pode ser depois de hoje.".

- [ ] **Passo 1: testes que falham.**
  - A conta criada com `end_date` antes do primeiro vencimento não cria instância.
  - Mudar o dia de 10 para 20, com hoje em 15/11, leva a pendente de 10/12 para 20/11.
  - A pendente vencida não muda.
  - `statusDaConta` dá os quatro estados.
  - O pular chama a RPC e mostra "Esta conta já foi paga ou pulada." com `BILL_INSTANCE_NOT_PENDING`.
  - Uma data no futuro bloqueia o pagamento.
  - Teste de fonte de que o "hoje" da página não é `useMemo` com dependência vazia.
- [ ] **Passo 2:** `npx vitest run src/lib/bills src/components/bills`. Esperado: FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run ds:audit -- src/components/wireframe && npm run build`. Esperado: PASS.
- [ ] **Passo 5:** commit `fix(contas): editar reprograma, pular atômico, fim encerra e valor variável`.

### Tarefa 5: Casamento automático — "isso pagou a conta?"

**Arquivos:**
- Criar:
  - `src/lib/bills/casamento.ts` e `casamento.test.ts`;
  - `src/components/wireframe/casamento-conta-wireframe.tsx`.
- Modificar: `src/app/(app)/bills/page-client.tsx` (monta a pergunta na aba Pendentes) e `src/lib/bills/mutations.ts` (`ligarPagamento`).

**Interfaces:**
- Consome a Tarefa 2 (`ligar_pagamento_da_conta`) e a Tarefa 1 (`proximoVencimentoDaConta`). A semelhança vem de `src/lib/fatura/conferir.ts`; use a função de semelhança de palavras que ele já exporta, e exporte-a se for interna.
- Produz:
  ```ts
  export type Casamento = { instanciaId: string; contaNome: string; transacaoId: string; descricao: string; valor: number; dataYmd: string; semelhanca: number }
  export function casarPagamentos(pendentes: Array<{ id: string; due_date: string; bill: { name: string; amount_estimated: number | null } ; amount: number | null }>,
    transacoes: Array<{ id: string; type: string; amount: number; date: string; description: string | null }>,
    jaLigadas: Set<string>): Casamento[]
  export function ligarPagamento(supabase: SupabaseClient, c: Casamento, proximoVencimento: string | null): Promise<{ ok: boolean; erro?: string }>
  ```
- **As regras de `casarPagamentos`:**
  - só `expense`;
  - o valor dentro de ±15% de `amount ?? amount_estimated`, e sem estimado não casa;
  - o dia dentro de ±5 do `due_date`;
  - a semelhança da descrição com o nome da conta no mínimo do limiar que o `conferir.ts` usa;
  - cada lançamento vai à instância de maior semelhança (desempate pela menor diferença de valor) e cada instância recebe um lançamento só;
  - um lançamento em `jaLigadas` fica de fora.
- **`CasamentoContaWireframe({ casamento, onLigar, onIgnorar })`**, etiqueta `WIREFRAME · Bloco 6 · Isso pagou a conta?`: "Isso pagou a conta {nome}? {descrição} · {R$} em {dd/mm}" e os botões "Sim, ligar" e "Não".
  - O "Não" guarda o par em `localStorage` (`casamento:ignorado:{instancia}:{transacao}`), dentro de `try/catch`.
  - Os lançamentos lidos são os dos últimos 40 dias da carteira, pela consulta da tela de transações que já existe (procure com graphify).
  - `jaLigadas` são os `transaction_id` das instâncias da carteira.

- [ ] **Passo 1: testes que falham.**
  - R$ 172 contra R$ 150 casa, e R$ 200 não.
  - O dia 6 de diferença não casa.
  - A receita não casa.
  - O lançamento já ligado não casa.
  - Um lançamento com duas contas parecidas vai à de maior semelhança.
  - Duas transações para uma instância: só a melhor.
  - Sem `amount_estimated` e sem `amount`, não casa.
- [ ] **Passo 2:** `npx vitest run src/lib/bills/casamento.test.ts`. Esperado: FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run ds:audit -- src/components/wireframe && npm run build`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(contas): casamento automático do pagamento com a conta`.

### Tarefa 6: O boleto no pagamento e no lançamento

**Arquivos:**
- Modificar:
  - `src/components/bills/pay-bill-dialog.tsx`, que mostra os anexos da instância com `AnexosWireframe somenteLeitura`;
  - o detalhe do lançamento (procure com `graphify query "transaction detail sheet attachments"`), que mostra também os anexos da instância cujo `transaction_id` é este lançamento.
- Criar: `src/lib/bills/anexos-da-conta.ts` e o teste dele.

**Interfaces:**
- Consome `listarAnexos(supabase, vinculo)` de `src/lib/anexos.ts` e `AnexosWireframe` de `src/components/wireframe/anexos-wireframe.tsx`.
- Produz `export function anexosDoLancamento(supabase, transactionId: string): Promise<Array<…>>`. Ele junta os anexos com `transaction_id` e os da instância ligada (`bill_instances.transaction_id = transactionId`), sem repetir o mesmo `path`.

- [ ] **Passo 1: teste que falha.** Com um anexo no lançamento e um na instância ligada, vêm os dois. Com o mesmo `path` nos dois, vem um.
- [ ] **Passo 2:** `npx vitest run src/lib/bills/anexos-da-conta.test.ts`. Esperado: FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run build`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(contas): boleto visível no pagamento e no lançamento pago`.

### Tarefa 7: Sem "Beta", roteiro, jornadas e Atlas

**Arquivos:**
- Modificar:
  - `src/components/bills/bills-toolbar.tsx:184`;
  - `src/config/navigation.ts:113`;
  - `src/app/(app)/me/page-client.tsx:63`;
  - o que mais referenciar o `beta` das contas (`app-sidebar.tsx:92/126` lê o campo e não muda);
  - os testes que travam o "Beta" das contas, se existirem.
- Criar: `supabase/BLOCO_6A_DEPLOYMENT.md`
- Modificar: `docs/JORNADAS.md`, `docs/atlas/template.html`, `docs/atlas/atlas-jornadas.html` (gerado)

**O roteiro:**
1. Aplicar a migração.
2. Deploy do `evaluate-bills-reminders` e de toda Edge que importa um `_shared` mudado (o fecho dos imports).
3. Conferir, só lendo, quantas instâncias o primeiro passo 0 vai criar: as contas ativas com a última instância vencida. O dono decide se roda antes ou deixa o cron criar.
4. Explicar que o front antigo vê as instâncias geradas como "Atrasada", o que é verdade.

**As jornadas:**
- "Contas a pagar" revista: criar, editar e reprogramar, pagar, pular, ligar um pagamento, encerrar e concluir, o valor variável e o boleto;
- a regra técnica do passo 0 e dos gatilhos;
- a lacuna corrigida "recorrência travava sem pagamento";
- a lacuna nova, se houver.

**O Atlas:** a mesma jornada e a capa. Depois, `python3 docs/atlas/build.py`.

- [ ] **Passo 1:** tirar o "Beta" e ajustar os testes.
- [ ] **Passo 2:** o roteiro, as jornadas e o `build.py`.
- [ ] **Passo 3:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run build`. Esperado: PASS.
- [ ] **Passo 4:** commit `docs(contas): sem Beta, roteiro do Bloco 6A, jornadas e Atlas`.
