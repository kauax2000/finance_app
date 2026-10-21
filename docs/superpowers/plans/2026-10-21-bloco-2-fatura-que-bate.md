# Bloco 2 — Fatura que bate e anexos: plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para executar este plano tarefa a tarefa. Os passos usam checkbox (`- [ ]`).

**Objetivo:** o total da fatura no app bate com o do banco, e quando não bate o app diz onde está a diferença. A pessoa importa extrato, fatura e planilha, e guarda nota ou recibo junto de um lançamento.

**Arquitetura:**
- **Lógica:** funções puras em `src/lib/import/` e `src/lib/fatura/`, com testes Vitest, fazem a leitura (CSV, OFX, texto de PDF), a conferência e a sugestão de categoria. O PDF vira texto **no cliente** com `pdfjs-dist`.
- **Banco:** uma migração traz:
  - colunas novas em `transactions`;
  - a tabela do total do banco;
  - os anexos, com bucket privado e políticas;
  - o trigger de aviso, que passa a ignorar as importações.
- **Telas:** entram como **wireframes** em `src/components/wireframe/` (regra do `AGENTS.md`).

**Tecnologia:** Next 16 / React 19, Supabase (Postgres, Storage, Edge em Deno), Vitest (ambiente `node`, só `*.test.ts`), `pdfjs-dist` (dependência nova).

**Spec:** `docs/superpowers/specs/2026-10-20-proposta-funcional-design.md`, §6 (Bloco 2), §3 (cotas do plano gratuito), §7 (`source` e "a conferir") e §8 (IA). Regra das telas: `AGENTS.md`, "Funcionalidade nova entra em wireframe".

## Restrições globais

- **O banco de dev é o de produção.** Nenhuma tarefa roda `supabase db push`, deploy ou SQL contra o projeto. Na prévia, só navegar e ler; nunca salvar nem importar dado. Quem aplica é o dono, pelo roteiro da Tarefa 9.
- **O repositório é público:** nenhum segredo, URL de projeto nem dado real de fatura entra no repo. As amostras de fatura nos testes são **sintéticas**, com nomes e valores inventados.
- **Testes:**
  - Vitest roda em ambiente `node` e só pega `src/**/*.test.ts`, sem DOM nem testing-library.
  - Para componente, use `renderToStaticMarkup` ou um teste de fonte (`lerFonte`/`semComentarios` de `@/test/fonte`).
  - O Deno testa só `supabase/functions/_shared`.
- **Tipos:**
  - Não há banco local, então `npm run db:types` não roda. Cada coluna ou tabela nova é escrita **à mão** em `src/types/database.ts`, seguindo o formato gerado.
  - `src/types/database-drift.ts` reprova divergência.
- **Wireframe** (`AGENTS.md`):
  - Só em `src/components/wireframe/`. A tela apenas importa.
  - A cara é fixa:
    - `border-dashed border-muted-foreground/60 bg-muted/40 text-muted-foreground font-mono`;
    - a etiqueta `WIREFRAME · Bloco 2 · <funcionalidade>`.
  - Controles nativos, e todo `<button>` declara `type`. Nenhum componente de `src/components/ui/`.
  - Funciona de verdade.
- **Lista de valores de `transactions.source`** (spec §7, mais 1 decisão desta rodada): `app`, `quick_text`, `shortcut`, `apple_pay`, `whatsapp`, `share`, `import_pdf`, `import_sheet`, `import_statement`, `recurring`. O padrão é `app`.
- **Cota de anexos:** 25 MB (`26214400` bytes) por carteira enquanto o Supabase for Free. Arquivo até 10 MB (`10485760`). Tipos aceitos: `image/webp`, `image/jpeg`, `image/png`, `application/pdf`. A imagem vira WebP com lado maior de 1600 px e qualidade 0,8.
- **URL assinada:** 3600 s.
- **Mudança de jornada:** atualizar `docs/JORNADAS.md`, `docs/atlas/template.html`, rodar `python3 docs/atlas/build.py` e republicar o Atlas (o orquestrador republica).
- **Fechamento de cada tarefa de código:** `npx tsc --noEmit && npm run lint && npm run test:unit` verdes. Com Edge, também `npm run test:edge`.

## Decisões desta rodada (o orquestrador registra no ledger)

1. **Sem IA no Bloco 2.**
   - A spec põe o módulo de IA no Bloco 3 (§14). Aqui o PDF é lido só pelo leitor determinístico.
   - Quando a soma não fecha, a leitura fica "incompleta", mostra a diferença e ainda deixa importar o que achou.
   - A IA entra no Bloco 3 pela mesma função (`extrairItensDaFatura` passa a ter um fallback).
2. **`source`, `needs_review` e `import_batch_id` nascem aqui** (a importação precisa deles). A lista "A conferir" fica para o Bloco 3. Aqui, o detalhe do lançamento mostra o selo e o "Confirmar".
3. **`import_statement`** é o `source` de CSV e OFX de banco. `import_sheet` fica para a planilha da pessoa.
4. **Parcela importada vira despesa simples**, com "(k/n)" na descrição e `needs_review`. Transformar em plano de parcelamento fica fora do bloco.
5. **Importação não avisa membros nem dispara alerta de orçamento**, porque o histórico importado viraria enxurrada. O `WHEN` do trigger ganha `new.import_batch_id is null`.
6. **Estorno é receita com `payment_method = 'credit_card'` e cartão.**
   - Ele abate a fatura do ciclo em que cai e **não** conta como receita no Painel.
   - Ele reduz a despesa do mês de fechamento.
   - A fatura pode ficar negativa (saldo credor) e aparece assim.
7. **`workspace_plan()` não nasce aqui.** Nenhum consumidor existe no Bloco 2. Ele vem no Bloco 3, com a primeira Edge paga.
8. **Cota de anexo por carteira**, e não por assinante: o assinante só existe no Bloco 4.
9. **Categoria pelo histórico:**
   - primeiro, a descrição normalizada **igual** (spec §7);
   - se não houver, a transação mais recente que compartilha a **primeira palavra significativa** (3 letras ou mais, não numérica).

## Foco de revisão

1. **PDF com senha:** o app pede a senha e tenta de novo. Senha errada mostra "Senha incorreta". Nunca trava nem falha calado. (Tarefa 6, teste de fonte do fluxo e teste do resultado `precisaSenha`.)
2. **Fatura cuja soma não fecha com o total:** fica `completa: false`, com a diferença. A conferência nunca diz "bate" para a fatura inteira, mas a importação dos itens achados continua possível. (Tarefa 4.)
3. **Importar o mesmo arquivo duas vezes:**
   - na segunda conferência, os itens já importados caem em "bate";
   - repetir o envio do mesmo lote, num retry de rede, não duplica: o `client_id` é gerado uma vez por item e reaproveitado.
   (Tarefas 5 e 6.)
4. **Estorno maior que as compras do ciclo:** o total fica negativo e é exibido como negativo, nunca zerado. (Tarefa 2.)
5. **Anexo acima da cota, acima de 10 MB ou de tipo não aceito:**
   - mensagem clara antes do envio;
   - se a linha falhar depois do upload, o objeto é removido e nada fica órfão.
   (Tarefa 8.)

---

### Tarefa 1: Migração — colunas de importação, total do banco e aviso sem importação

**Arquivos:**
- Criar: `supabase/migrations/20261022120000_fatura_que_bate.sql`
- Modificar: `src/types/database.ts` (`transactions`, nova tabela), `src/lib/supabase.ts` (tipos `Transaction` e `CreditCardStatementTotal`)
- Teste: `src/lib/fatura/migracao-fatura.test.ts`

**Interfaces:**
- Produz, em `transactions`:
  - `source text not null default 'app'`, com check na lista das Restrições globais;
  - `needs_review boolean not null default false`;
  - `import_batch_id uuid null`, com índice parcial `where import_batch_id is not null`.
- Produz a tabela `public.credit_card_statement_totals`:
  - colunas: `id uuid pk default gen_random_uuid()`, `workspace_id uuid not null`, `credit_card_id uuid not null`, `statement_close_date date not null`, `bank_total numeric(15,2) not null`, `source text not null check (source in ('manual','pdf','csv','ofx'))`, `created_by uuid not null default auth.uid()`, `created_at`, `updated_at`;
  - unique `(workspace_id, credit_card_id, statement_close_date)`;
  - FKs com cascade para `workspaces` e `credit_cards`;
  - triggers `set_updated_at` e `same_ws_credit_card_id` (o mesmo `assert_same_workspace_ref` que `credit_card_invoice_payments` usa);
  - RLS: SELECT, UPDATE e DELETE por `is_workspace_member(workspace_id)`; INSERT por isso e mais `created_by = (select auth.uid())`.
- Recria o trigger `transactions_notify_created` com o `WHEN` acrescido de `and new.import_batch_id is null`.

- [ ] **Passo 1: teste de fonte que falha.**
  - `src/lib/fatura/migracao-fatura.test.ts` lê a migração (`semComentarios`) e afirma:
    - os nomes e os defaults acima;
    - os 10 valores do check de `source`;
    - `enable row level security` na tabela nova;
    - o `WHEN` contendo `new.import_batch_id is null` junto das três condições antigas;
    - o recurso ao `assert_same_workspace_ref`.
  - Afirma também que `src/types/database.ts` contém `credit_card_statement_totals` e `import_batch_id`.
- [ ] **Passo 2:** `npx vitest run src/lib/fatura/migracao-fatura.test.ts` → FAIL (`ENOENT`).
- [ ] **Passo 3:** escrever a migração (padrão de `20260915100000_security_privileges_policies.sql` para RLS e triggers) e os tipos à mão.
- [ ] **Passo 4:** `npx vitest run src/lib/fatura/migracao-fatura.test.ts && npx tsc --noEmit` → PASS.
- [ ] **Passo 5:** commit `feat(fatura): colunas de importação, total do banco e aviso sem importação`.

---

### Tarefa 2: Estorno no cálculo da fatura (app e Edge)

**Arquivos:**
- Modificar:
  - `src/lib/credit-card-billing.ts`: `buildCardMonthlyInvoiceSnapshot` (~401) e `buildCardCycleSnapshot` (~613);
  - `src/lib/credit-card-invoice-analytics.ts` (~53-73);
  - `src/lib/expense-month-attribution.ts` (`aggregateIncomeExpenseForMonth`);
  - `supabase/functions/_shared/credit-card-cycle.ts` (~118);
  - as queries de `supabase/functions/evaluate-credit-card-alerts/index.ts` (~173-177) e `credit-card-calendar-alerts/index.ts` (~205-208), que passam a trazer `type in ('expense','income')`, mantendo `payment_method = 'credit_card'`.
- Teste:
  - `src/lib/credit-card-billing.test.ts` (existente; acrescentar);
  - `src/lib/expense-month-attribution.test.ts` (existente, ou criar);
  - `supabase/functions/_shared/credit-card-cycle.test.ts` (acrescentar).

**Interfaces:**
- Produz `sumCreditCardRefundsInWindow(transactions: CreditCardInvoiceSumTx[], cardId: string, start: Date, end: Date): number` em `credit-card-billing.ts`.
  - Soma as linhas `type === "income" && payment_method === "credit_card" && payment_credit_card_id === cardId` dentro da janela inclusiva.
  - Os `postedTotal`, `openTotal` e `lastClosedTotal` dos dois snapshots passam a ser `despesas − estornos`.
  - `sumCreditCardExpensesInWindow` **não muda** de significado.
- Produz `sumCardRefundsInWindow(rows: CardTxRow[], cardId: string, win: OpenWindow): number` em `_shared/credit-card-cycle.ts`.
  - Os dois avaliadores usam `despesas − estornos` no limite e no texto.
- `filterCardExpensesInWindow` passa a incluir os estornos do cartão (a lista da fatura os mostra). O ranking por categoria continua só com despesas.
- `aggregateIncomeExpenseForMonth`:
  - a receita com `payment_method === "credit_card"` **sai** da receita;
  - ela **reduz** a despesa do mês dado por `expenseYearMonthKey` (o mês do fechamento).

- [ ] **Passo 1: testes que falham.**
  - **App:**
    - ciclo com despesas de 300 e 50 e um estorno de 80 → `openTotal` 270;
    - estorno de 500 contra despesa de 200 → −300 (Foco 4);
    - estorno de **outro** cartão não entra;
    - estorno fora da janela não entra;
    - mês com receita de salário de 5000 e estorno de 80 no cartão que fecha nesse mês → receita 5000, despesa reduzida em 80.
  - **Deno:** `sumCardRefundsInWindow` com os mesmos números, e `sumCardExpensesInWindow` inalterada.
- [ ] **Passo 2:** `npx vitest run src/lib/credit-card-billing.test.ts src/lib/expense-month-attribution.test.ts` e `npm run test:edge` → FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** mesmos comandos → PASS, depois `npx tsc --noEmit && npm run lint && npm run test:unit`.
- [ ] **Passo 5:** commit `feat(fatura): estorno no cartão abate a fatura, no app e nos avisos`.

---

### Tarefa 3: Total do banco no cálculo e nas telas que mostram fatura fechada

**Arquivos:**
- Criar: `src/lib/fatura/total-com-banco.ts`
- Modificar:
  - `src/lib/credit-cards-workspace-transactions.ts` (nova leitura);
  - `src/lib/bills/credit-card-bill-projector.ts` (~77-89);
  - `src/components/dashboard/use-dashboard-data.ts` (~424-448);
  - `src/components/credit-cards/credit-card-invoice-analytics-panel.tsx` (bloco do valor, ~743-835, só para `cycleOffset < 0`).
- Teste: `src/lib/fatura/total-com-banco.test.ts`

**Interfaces:**
- Produz `totalComBanco(calculado: number, bancoTotal: number | null): { total: number; diferenca: number | null }`:
  - `total = bancoTotal ?? calculado`;
  - `diferenca = bancoTotal == null ? null : roundCents(bancoTotal − calculado)`.
- Produz `fetchStatementTotals(workspaceId: string): Promise<CreditCardStatementTotal[]>` e a chave de React Query `["credit-card-statement-totals", workspaceId]`.
- Produz `statementTotalKey(cardId: string, closeYmd: string): string`, que devolve `${cardId}:${closeYmd}` (a mesma forma da chave de pagamento do dashboard, ~325-333).
- Consumidores:
  - o projetor usa `totalComBanco(committedLastClosedTotal, banco)` como valor da conta virtual;
  - o KPI "Faturas abertas" usa o total do banco quando o ciclo do snapshot já fechou;
  - o painel, num ciclo passado, mostra "Total do banco R$ X · diferença R$ Y" (texto simples, dentro do `CardContent` existente).

- [ ] **Passo 1: testes que falham.**
  - `totalComBanco(270, null)` → `{ total: 270, diferenca: null }`;
  - `totalComBanco(270, 333)` → `{ total: 333, diferenca: 63 }`;
  - `totalComBanco(270, 270)` → `diferenca: 0`;
  - um teste de fonte afirma que `credit-card-bill-projector.ts` chama `totalComBanco(`.
- [ ] **Passo 2:** `npx vitest run src/lib/fatura/total-com-banco.test.ts` → FAIL.
- [ ] **Passo 3:** implementar e ligar os três consumidores.
- [ ] **Passo 4:** PASS, depois `npx tsc --noEmit && npm run lint && npm run test:unit`.
- [ ] **Passo 5:** commit `feat(fatura): total do banco vale sobre o calculado nas faturas fechadas`.

---

### Tarefa 4: Leitores — CSV, OFX e texto de fatura

**Arquivos:**
- Criar:
  - `src/lib/import/tipos.ts`;
  - `src/lib/import/normalizar.ts`;
  - `src/lib/import/csv.ts`;
  - `src/lib/import/ofx.ts`;
  - `src/lib/import/fatura-texto.ts`;
  - `src/lib/import/fixtures/` (textos sintéticos de fatura em `.ts` exportando `string`).
- Teste: `src/lib/import/leitores.test.ts`

**Interfaces** (produz, em `tipos.ts`):

```ts
export type ItemBanco = {
  data: string            // "YYYY-MM-DD"
  descricao: string
  valor: number           // sempre positivo
  estorno: boolean        // crédito na fatura, ou receita em conta
  parcela: { k: number; n: number } | null
  categoria?: string      // só a planilha traz
}
export type LeituraFatura = {
  itens: ItemBanco[]
  total: number | null
  vencimento: string | null
  fechamento: string | null
  completa: boolean       // total achado e |soma(itens) − total| < 0.01
  diferenca: number | null
}
```

- `normalizar.ts`:
  - `normalizarDescricao(s: string): string`: minúscula, sem acento, sem pontuação, espaços colapsados;
  - `palavraSignificativa(s: string): string | null`: a primeira palavra normalizada com 3 letras ou mais e não numérica;
  - `lerValorBr(s: string): number | null`: aceita "1.234,56", "-12,50", "R$ 9,90" e "12.50" com ponto decimal. Reaproveita `parseMoneyBrl` se ele já cobrir;
  - `lerData(s: string, anoPadrao?: number): string | null`: "dd/mm/aaaa", "aaaa-mm-dd", "dd/mm" e "dd MMM" ("12 OUT").
- `csv.ts`:
  - `lerCsv(texto: string): string[][]`: delimitador `;` ou `,` detectado na 1ª linha, aspas RFC 4180, `\r\n`;
  - `mapearCsv(linhas: string[][], mapa: { data: number; descricao: number; valor: number; categoria?: number }, opcoes: { temCabecalho: boolean; negativoEhDespesa: boolean }): ItemBanco[]`. A linha que não lê data ou valor é pulada e contada em `ignoradas`, então o retorno é `{ itens, ignoradas: number }`.
- `ofx.ts`:
  - `lerOfx(texto: string, destino: "cartao" | "conta"): { itens: ItemBanco[]; ignoradas: number }`;
  - lê blocos `<STMTTRN>`: `DTPOSTED`, `TRNAMT`, `MEMO` ou `NAME`;
  - **cartão:** negativo é compra; positivo com descrição que casa `/pagamento|pgto/i` é ignorado; os outros positivos são estorno;
  - **conta:** negativo é despesa, positivo é receita (`estorno: true`).
- `fatura-texto.ts`:
  - `removerIdentificacao(texto: string): string`: tira CPF (`\d{3}\.?\d{3}\.?\d{3}-?\d{2}`), CEP, linhas que começam com "CPF", "Endereço" ou "Titular", e números de cartão com 16 dígitos (mantém os 4 finais);
  - `extrairItensDaFatura(texto: string, contexto: { fechamento: string }): LeituraFatura`:
    - linha de item: data no início (`dd/mm` ou `dd MMM`), descrição, valor no fim;
    - estorno: valor negativo, "-" no fim, ou descrição com `/estorno|credito|crédito|reembolso/i`;
    - parcela: `(\d{1,2})/(\d{1,2})` ou "parcela k de n" na descrição;
    - ano: se o mês do item for maior que o mês do fechamento, é o ano anterior;
    - total: `/(total (da fatura|a pagar)|valor total)\D*([\d.]+,\d{2})/i`;
    - vencimento: `/vencimento\D*(\d{2}\/\d{2}\/\d{4})/i`;
    - linhas de pagamento (`/pagamento recebido|pagamento efetuado/i`) não entram.

- [ ] **Passo 1: testes que falham** em `leitores.test.ts`:
  - **`lerValorBr`:** "1.234,56" → 1234.56; "-12,50" → −12.5; "R$ 9,90" → 9.9; "12.50" → 12.5; "abc" → null.
  - **`lerCsv`:** `;` com campo entre aspas contendo `;` → 3 colunas; `,` → 3 colunas.
  - **`mapearCsv`:** cabeçalho pulado; linha sem valor vai para `ignoradas: 1`; "-45,90" com `negativoEhDespesa` → `{ valor: 45.9, estorno: false }`.
  - **`lerOfx`:**
    - amostra sintética de cartão: 2 compras, 1 "PAGAMENTO RECEBIDO" (ignorado) e 1 estorno → 3 itens, `ignoradas: 1`;
    - amostra de conta: sinais invertidos corretamente.
  - **`extrairItensDaFatura`, com 3 textos sintéticos em `fixtures/`** (layouts "dd/mm desc valor", "dd MMM desc valor" e parcela "k/n"):
    - itens, parcela `{ k: 3, n: 10 }`, estorno detectado;
    - um item de dezembro numa fatura que fecha em janeiro recebe o ano anterior;
    - texto com total que fecha → `completa: true, diferenca: 0`;
    - texto com um item a menos → `completa: false`, com `diferenca` igual ao valor faltante (Foco 2);
    - sem linha de total → `completa: false, total: null`.
  - **`removerIdentificacao`:** some "CPF 123.456.789-00" e "4111 1111 1111 1234" vira "1234".
- [ ] **Passo 2:** `npx vitest run src/lib/import/leitores.test.ts` → FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** PASS, depois `npm run lint && npm run test:unit`.
- [ ] **Passo 5:** commit `feat(import): leitores de CSV, OFX e texto de fatura`.

---

### Tarefa 5: Conferência, categoria pelo histórico e importação em lote

**Arquivos:**
- Criar:
  - `src/lib/fatura/conferir.ts`;
  - `src/lib/import/categoria-pelo-historico.ts`;
  - `src/lib/import/importar.ts`.
- Teste:
  - `src/lib/fatura/conferir.test.ts`;
  - `src/lib/import/importar.test.ts`.

**Interfaces:**
- `conferir.ts`:

```ts
export type LancamentoParaConferir = {
  id: string; date: string /* YYYY-MM-DD */; description: string | null
  amount: number; type: "expense" | "income"; installment_sequence: number | null
}
export type ResultadoConferencia = {
  bate: Array<{ banco: ItemBanco; app: LancamentoParaConferir }>
  faltaNoApp: ItemBanco[]
  soNoApp: LancamentoParaConferir[]
  valorDiferente: Array<{ banco: ItemBanco; app: LancamentoParaConferir }>
  parcelaForaDeSequencia: Array<{ banco: ItemBanco; app: LancamentoParaConferir }>
  somaBanco: number; somaApp: number; diferenca: number
}
export function similaridade(a: string, b: string): number
export function conferirFatura(banco: ItemBanco[], app: LancamentoParaConferir[]): ResultadoConferencia
```

- **`similaridade`:** Jaccard dos conjuntos de palavras de `normalizarDescricao`, só palavras com 3 caracteres ou mais e não numéricas. Vazio dá 0.
- **`conferirFatura`**, nesta ordem e sem reutilizar um lançamento já casado:
  1. casa por **mesmo tipo** (estorno com `income`, compra com `expense`), |valor − amount| < 0,005 e |dias| ≤ 3, preferindo maior `similaridade` e depois menor distância em dias.
     - Se o item do banco tem `parcela` e o casado tem `installment_sequence` diferente de `k`, o par vai para `parcelaForaDeSequencia`.
     - Senão, vai para `bate`.
  2. entre os que sobraram, casa por mesmo tipo, |dias| ≤ 3, `similaridade ≥ 0,5` e valor diferente. Vai para `valorDiferente`.
  3. o que sobra do banco vai para `faltaNoApp`; o que sobra do app vai para `soNoApp`.
  - Somas: com sinal (estorno negativo), e `diferenca = somaBanco − somaApp`.
- **`sugerirCategoria(descricao: string, historico: Array<{ description: string | null; category_id: string | null; date: string }>): string | null`:**
  - a transação mais recente com `normalizarDescricao` igual e `category_id` não nulo;
  - senão, a mais recente com a mesma `palavraSignificativa`;
  - senão, `null`.
- **`importar.ts`:**

```ts
export type DestinoImportacao =
  | { tipo: "cartao"; cardId: string }
  | { tipo: "conta"; paymentMethod: "debit_card" | "pix" | "other" }
export type ItemImportavel = ItemBanco & { clientId: string; categoryId: string | null }
export function prepararItens(itens: ItemBanco[], historico: Parameters<typeof sugerirCategoria>[1]): ItemImportavel[]
export function linhasDeImportacao(ctx: { userId: string; workspaceId: string; batchId: string }, itens: ItemImportavel[], destino: DestinoImportacao, source: "import_pdf" | "import_sheet" | "import_statement"): TablesInsert<"transactions">[]
export async function importarLancamentos(supabase: SupabaseClient, ctx: { userId: string; workspaceId: string }, itens: ItemImportavel[], destino: DestinoImportacao, source: "import_pdf" | "import_sheet" | "import_statement", batchId: string): Promise<{ ok: true; inseridos: number } | { ok: false; erro: string }>
export async function desfazerImportacao(supabase: SupabaseClient, workspaceId: string, batchId: string): Promise<{ ok: boolean; erro?: string }>
```

- **`prepararItens`:** gera `clientId` (`crypto.randomUUID()`) **uma vez por item** e sugere a categoria.
- **`linhasDeImportacao`** (pura):
  - `type` é `income` se `estorno`, senão `expense`;
  - **destino cartão:** `payment_method: "credit_card"` e `payment_credit_card_id` (também no estorno);
  - **destino conta:** o `paymentMethod`;
  - `date` no meio-dia local do dia;
  - `description` com " (k/n)" quando há parcela;
  - `needs_review: true`, `import_batch_id`, `source`, `client_id: clientId`.
- **`importarLancamentos`:** `upsert` em fatias de 500 com `onConflict: "workspace_id,client_id"`. Não chama `evaluate-budgets` nem os alertas (Decisão 5).
- **`desfazerImportacao`:** `delete().eq("workspace_id", …).eq("import_batch_id", batchId)`.

- [ ] **Passo 1: testes que falham.**
  - **`conferir.test.ts`:**
    - mesmo valor com a data a 2 dias → `bate`;
    - a 4 dias → `faltaNoApp` e `soNoApp`;
    - "UBER *TRIP" contra "uber", R$ 25 contra 27 → `valorDiferente`;
    - estorno contra despesa de mesmo valor **não** casa;
    - parcela 3/10 contra lançamento com `installment_sequence` 2 → `parcelaForaDeSequencia`;
    - dois itens iguais no banco contra um no app → 1 `bate` e 1 `faltaNoApp`;
    - conferir de novo depois de importar todos os faltantes → tudo em `bate` (Foco 3);
    - `somaBanco`, `somaApp` e `diferenca` com estorno.
  - **`importar.test.ts`:**
    - `sugerirCategoria`: igual, pela palavra, e `null`;
    - `linhasDeImportacao`: estorno num cartão vira `income` + `credit_card`; destino conta com despesa; " (3/10)" na descrição; `needs_review`, `import_batch_id` e `source`;
    - **o mesmo `ItemImportavel` gera sempre o mesmo `client_id`** (Foco 3).
- [ ] **Passo 2:** `npx vitest run src/lib/fatura/conferir.test.ts src/lib/import/importar.test.ts` → FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** PASS, depois `npx tsc --noEmit && npm run lint && npm run test:unit`.
- [ ] **Passo 5:** commit `feat(fatura): conferência com o banco, categoria pelo histórico e importação em lote`.

---

### Tarefa 6: Wireframe base e "Conferir fatura" no cartão

**Arquivos:**
- Criar:
  - `src/components/wireframe/wireframe-box.tsx`;
  - `src/components/wireframe/conferir-fatura-wireframe.tsx`;
  - `src/lib/import/pdf-texto.ts`.
- Modificar:
  - `.claude/skills/design-system-guard/scripts/audit.mjs` (pular `components/wireframe/`, com comentário citando o `AGENTS.md`);
  - `src/components/credit-cards/credit-card-detail-view.tsx` (~328-348: render do wireframe logo depois do `CreditCardInvoiceAnalyticsPanel`);
  - `package.json` (dependência `pdfjs-dist`, versão estável atual).
- Teste: `src/components/wireframe/wireframe.test.ts`

**Interfaces:**
- `WireframeBox({ bloco, titulo, children }: { bloco: number; titulo: string; children: ReactNode })`:
  - um `<section>` com a classe fixa das Restrições globais;
  - a etiqueta `WIREFRAME · Bloco {bloco} · {titulo}`;
  - `aria-label` igual à etiqueta.
- `pdfParaTexto(arquivo: File, senha?: string): Promise<{ ok: true; texto: string } | { ok: false; precisaSenha: true; senhaIncorreta: boolean } | { ok: false; erro: string }>`:
  - `import("pdfjs-dist")` dinâmico, com o worker por `new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url)`;
  - junta os itens por linha (mesma coordenada y arredondada), em ordem de x;
  - trata `PasswordException` (`NEED_PASSWORD` e `INCORRECT_PASSWORD`).
- `ConferirFaturaWireframe({ card, transactions, workspaceId, userId })`. Funciona assim:
  1. `<select>` com os ciclos **fechados** (padrão: o último), pelos fechamentos de `credit-card-billing.ts`.
  2. "Total do banco": `<input>` mais "Gravar". Faz upsert em `credit_card_statement_totals` (`source: "manual"`) e invalida a chave da Tarefa 3.
  3. `<input type="file" accept=".pdf,.csv,.ofx">`:
     - **PDF:** `pdfParaTexto`, depois `removerIdentificacao` e `extrairItensDaFatura`. Pedindo senha, aparece `<input type="password">` com "Abrir"; senha errada mostra "Senha incorreta" (Foco 1);
     - **CSV:** os mesmos campos de mapeamento da Tarefa 7 (reaproveita o componente dela quando existir; aqui, só data, descrição e valor por índice);
     - **OFX:** `lerOfx(texto, "cartao")`.
  4. Mostra total lido, soma, completa ou incompleta com a diferença, e as cinco listas da conferência com contagem.
  5. Em "Falta no app": caixas marcadas por padrão e "Importar selecionados". Usa `prepararItens` uma vez (o estado guarda os `clientId`), `importarLancamentos(..., { tipo: "cartao", cardId }, source, batchId)` e invalida as listas.
  6. "Usar o total lido como total do banco": grava com `source` `pdf`, `csv` ou `ofx`.

- [ ] **Passo 1: testes que falham** em `wireframe.test.ts`:
  - `renderToStaticMarkup(WireframeBox({ bloco: 2, titulo: "Conferir fatura", children: "x" }))` contém `WIREFRAME · Bloco 2 · Conferir fatura`, `border-dashed` e `font-mono`;
  - teste de fonte:
    - nenhum arquivo em `src/components/wireframe/` importa de `@/components/ui/`;
    - todo `<button` lá tem `type=`;
    - `conferir-fatura-wireframe.tsx` contém `precisaSenha` e `Senha incorreta` (Foco 1) e chama `prepararItens(` fora do clique de importar, ou guarda o resultado em estado (afirme `useState` com `prepararItens`);
  - `audit.mjs` contém `components/wireframe/`.
- [ ] **Passo 2:** `npx vitest run src/components/wireframe/wireframe.test.ts` → FAIL.
- [ ] **Passo 3:** `npm install pdfjs-dist` e implementar.
- [ ] **Passo 4:**
  - `npx vitest run src/components/wireframe/wireframe.test.ts && npx tsc --noEmit && npm run lint && npm run test:unit && npm run ds:audit -- src/components/wireframe` → PASS, e o auditor sem achados na pasta;
  - na prévia do dev server (já rodando em :3000; ver `.claude/launch.json`), abrir um cartão e **só olhar** se o wireframe aparece. Não gravar nada (produção).
- [ ] **Passo 5:** commit `feat(fatura): wireframe de conferir fatura no cartão, com PDF, CSV e OFX`.

---

### Tarefa 7: Wireframes de importar extrato e planilha, de estorno no formulário e de "a conferir" no detalhe

**Arquivos:**
- Criar:
  - `src/components/wireframe/importar-extrato-wireframe.tsx`;
  - `src/components/wireframe/estorno-wireframe.tsx`;
  - `src/components/wireframe/a-conferir-wireframe.tsx`.
- Modificar:
  - `src/app/(app)/transactions/page-client.tsx`: link sempre visível "Importar extrato ou planilha" (dentro de um `WireframeBox`) acima da `TransactionsToolbar`, que abre o wireframe com `?importar=1`. Fechar tira o parâmetro;
  - `src/lib/transactions-list-search-params.ts`: `importar` é consumido e removido como `new`;
  - `src/components/transactions/transaction-form-use.tsx` (~265-270, 497-516, 596-601) e `transaction-form-fields.tsx` (~454): com `type === "income"`, o estado novo `estornoCartaoId: string | null` grava `payment_method: "credit_card"` e `payment_credit_card_id`;
  - `src/components/transactions/transaction-detail-sheet.tsx` (~418-420): `<AConferirWireframe>` quando `needs_review` ou `import_batch_id`.
- Teste: `src/components/wireframe/wireframe.test.ts` (acrescentar) e `src/components/transactions/transaction-form-layout.test.ts` (ajustar só o que a mudança tornar falso).

**Interfaces:**
- **`ImportarExtratoWireframe({ workspaceId, userId, cards, onClose })`:**
  1. Destino: `<select>` com "Cartão: <nome>" de cada cartão, mais "Conta: Pix", "Conta: Débito" e "Conta: Outro".
  2. Arquivo `.csv` ou `.ofx`.
  3. **CSV:** índices de coluna para data, descrição, valor e categoria opcional, mais "tem cabeçalho" e "valor negativo é despesa". Mostra uma prévia de 5 linhas.
  4. "Planilha": a mesma tela com `source: "import_sheet"`. A categoria por nome casa com a categoria existente ignorando acento e caixa, ou cria a categoria (`type` pelo sinal).
  5. Prévia com contagem e ignoradas, depois "Importar". Usa `prepararItens` uma vez, guardado em estado, e `importarLancamentos`.
  6. O resultado mostra "N importados · Desfazer importação", que chama `desfazerImportacao`.
- **`EstornoWireframe({ cards, value, onChange })`:** `<input type="checkbox">` "É estorno no cartão" mais `<select>` de cartão. Só aparece para receita.
- **`AConferirWireframe({ transaction, onChanged })`:**
  - "Importado · a conferir" com "Confirmar", que faz `update needs_review=false`;
  - quando há `import_batch_id`, "Desfazer importação do lote", com `window.confirm("Desfazer a importação inteira deste lote?")` e depois `desfazerImportacao`.

- [ ] **Passo 1: testes que falham.**
  - **Fonte:**
    - `page-client.tsx` de transactions importa `ImportarExtratoWireframe`;
    - `transaction-detail-sheet.tsx` importa `AConferirWireframe`;
    - `transaction-form-fields.tsx` importa `EstornoWireframe`;
    - `importar-extrato-wireframe.tsx` chama `desfazerImportacao(` e `prepararItens(`;
    - `transactions-list-search-params.ts` trata `importar`.
  - **Puro:** o payload do formulário com receita e `estornoCartaoId` tem `payment_method: "credit_card"`. Exponha e teste a função de montagem do payload se ela já for pura em `transaction-form-use.tsx`; senão, o teste de fonte cobre a atribuição.
- [ ] **Passo 2:** `npx vitest run src/components/wireframe/wireframe.test.ts` → FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run ds:audit -- src/components/wireframe` → PASS. Na prévia, **só olhar** `/transactions?importar=1` e o formulário de receita, sem salvar.
- [ ] **Passo 5:** commit `feat(import): wireframes de importar extrato e planilha, de estorno e de a conferir`.

---

### Tarefa 8: Anexos

**Arquivos:**
- Criar:
  - `supabase/migrations/20261022130000_anexos.sql`;
  - `src/lib/anexos.ts`;
  - `src/components/wireframe/anexos-wireframe.tsx`;
  - `supabase/functions/attachments-cleanup/index.ts`;
  - `supabase/functions/_shared/attachments-orphans.ts` com teste Deno `attachments-orphans.test.ts`.
- Modificar:
  - `src/components/transactions/transaction-detail-sheet.tsx` (nova seção com `AnexosWireframe`, depois da Tarefa 7);
  - o painel de detalhe da conta a pagar (`/bills?detail=id`; ache o componente pelo `?detail` em `src/app/(app)/bills/page-client.tsx`), com `AnexosWireframe` vinculado à instância pendente (o boleto);
  - `src/components/wireframe/conferir-fatura-wireframe.tsx` (guarda o PDF lido como anexo do total do banco);
  - `src/lib/transactions/mutations.ts` (apagar objetos antes de excluir a transação, online);
  - `src/types/database.ts`;
  - `supabase/config.toml` (`[functions.attachments-cleanup] verify_jwt = false`);
  - `package.json` (`supabase:deploy:functions` inclui `attachments-cleanup`).
- Teste: `src/lib/anexos.test.ts`

**Interfaces:**
- **Migração:**
  - bucket `attachments` com `public = false`, `file_size_limit = 10485760` e `allowed_mime_types` da lista;
  - tabela `public.attachments`:
    - colunas: `id uuid pk`, `workspace_id uuid not null`, `transaction_id uuid null references transactions on delete cascade`, `bill_instance_id uuid null references bill_instances on delete cascade`, `statement_total_id uuid null references credit_card_statement_totals on delete cascade`, `path text not null unique`, `mime text not null`, `size_bytes integer not null check (size_bytes > 0 and size_bytes <= 10485760)`, `created_by uuid not null default auth.uid()`, `created_at`;
    - check de que pelo menos um dos três vínculos não é nulo;
    - RLS por `is_workspace_member(workspace_id)`; INSERT também com `created_by`;
  - trigger `before insert` que recusa com `raise exception 'cota_anexos_excedida'` quando `sum(size_bytes)` da carteira mais o novo passa de `26214400`;
  - políticas em `storage.objects` para `authenticated`, com `bucket_id = 'attachments' and public.is_workspace_member(((storage.foldername(name))[1])::uuid)`:
    - SELECT, INSERT e DELETE;
    - dentro de `do $$ ... exception when insufficient_privilege`, como em `20260824123000_storage_avatar_policies.sql`;
  - cron `attachments-cleanup-weekly`, `'0 7 * * 0'`, com `select public.invoke_edge_function('attachments-cleanup')` (padrão da migração `20261021120000`).
- **`anexos.ts`:**
  - `validarArquivo(arquivo: { type: string; size: number }, usadoBytes: number): { ok: true } | { ok: false; erro: string }`. As mensagens são exatas:
    - "Tipo não aceito: use foto ou PDF.";
    - "Arquivo acima de 10 MB.";
    - "Sem espaço: os anexos desta carteira passaram de 25 MB.".
    - Uma imagem é validada pelo tamanho **depois** da compressão.
  - `dimensoesAlvo(largura: number, altura: number, max = 1600): { largura: number; altura: number }`;
  - `comprimirImagem(arquivo: File): Promise<Blob>`: `createImageBitmap`, canvas, `toBlob("image/webp", 0.8)`;
  - `enviarAnexo(supabase, ctx: { workspaceId: string }, arquivo: File, vinculo: { transactionId?: string; billInstanceId?: string; statementTotalId?: string }): Promise<{ ok: true; id: string } | { ok: false; erro: string }>`:
    - caminho `${workspaceId}/${crypto.randomUUID()}.${ext}`;
    - upload, depois insere a linha;
    - **se a linha falhar, remove o objeto** (Foco 5);
  - `listarAnexos(supabase, vinculo)`;
  - `urlAssinada(supabase, path)`: `createSignedUrl(path, 3600)`;
  - `apagarAnexo(supabase, anexo)`: remove o objeto e depois a linha.
- **`_shared/attachments-orphans.ts`:** `orfaos(objetos: Array<{ name: string; created_at: string }>, caminhosComLinha: Set<string>, agoraIso: string): string[]`. Devolve os objetos sem linha **e** com mais de 24 h.
- **Edge `attachments-cleanup`:** confere `x-cron-secret`, lista o bucket por pasta de carteira, consulta `attachments.path` e remove os órfãos pela API de Storage.
- **`AnexosWireframe({ workspaceId, vinculo })`:** lista com "Abrir" (URL assinada) e "Apagar", mais `<input type="file" accept="image/*,application/pdf">`. Mostra o erro de `validarArquivo` antes de enviar.

- [ ] **Passo 1: testes que falham.**
  - **`anexos.test.ts`:**
    - `validarArquivo`: tipo `text/plain`; 11 MB; quota 25 MB menos 1 KB mais 2 KB; PDF de 2 MB aceito;
    - `dimensoesAlvo(4000, 3000)` → `{ 1600, 1200 }`;
    - `dimensoesAlvo(800, 600)` → `{ 800, 600 }`;
    - fonte: `enviarAnexo` chama `.remove(` no ramo de erro da inserção (Foco 5);
    - fonte: a migração tem `public = false` ou `false` no insert do bucket, `26214400`, `cota_anexos_excedida`, `attachments-cleanup-weekly` e as 3 políticas.
  - **Deno:** `orfaos` com um objeto com linha (fica), um sem linha com 2 dias (sai) e um sem linha com 1 hora (fica).
- [ ] **Passo 2:** `npx vitest run src/lib/anexos.test.ts` e `npm run test:edge` → FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run test:edge && npm run ds:audit -- src/components/wireframe` → PASS.
- [ ] **Passo 5:** commit `feat(anexos): nota e recibo no lançamento e PDF da fatura, privados e com cota`.

---

### Tarefa 9: Roteiro de publicação, jornadas e Atlas

**Arquivos:**
- Criar: `supabase/BLOCO_2_DEPLOYMENT.md`
- Modificar:
  - `docs/JORNADAS.md`:
    - Jornada 05: importar com `?importar=1`, estorno, "a conferir" e anexos no detalhe;
    - Jornada 06: conferir fatura e total do banco;
    - Jornada 07: a conta virtual usa o total do banco;
    - mapa geral, se alguma ponte mudar;
    - tabela de regras e backend: as tabelas, o bucket e a Edge nova;
  - `docs/atlas/template.html`, com as mesmas mudanças, a data e as contagens;
  - `docs/atlas/atlas-jornadas.html`, gerado.

- [ ] **Passo 1: roteiro em ordem.**
  1. `supabase db push`, que aplica as duas migrações.
  2. Conferir:
     - `select id, public from storage.buckets where id = 'attachments';` → `false`;
     - `select jobname from cron.job;` mostra `attachments-cleanup-weekly`;
     - se as políticas de storage caíram no NOTICE de `insufficient_privilege`, aplicar o bloco pelo SQL Editor.
  3. `supabase functions deploy evaluate-credit-card-alerts credit-card-calendar-alerts attachments-cleanup` (estorno nos avisos e a Edge nova).
  4. **Teste de fumaça, com dado de teste e só depois de publicar:**
     - informar o total do banco num ciclo fechado e ver a diferença;
     - importar um CSV pequeno e desfazer;
     - anexar uma foto e abrir pela URL assinada.
  5. **Ordem com o front:** migração antes do front. O front novo lê `credit_card_statement_totals` e as colunas novas.
- [ ] **Passo 2:** atualizar `JORNADAS.md` e `template.html`, depois `python3 docs/atlas/build.py`. Esperado: sem erro, com `atlas-jornadas.html` alterado.
- [ ] **Passo 3:** `git diff --cached | grep -E "supabase\.co/|eyJ|postgres(ql)?://[^<]"` → nenhuma linha.
- [ ] **Passo 4:** commit `docs(fatura): roteiro do Bloco 2, jornadas e Atlas`.
- [ ] **Passo 5 (orquestrador):** republicar o Atlas em https://claude.ai/artifact/1N43LFYP1YSVsWaRMaNTRL.
