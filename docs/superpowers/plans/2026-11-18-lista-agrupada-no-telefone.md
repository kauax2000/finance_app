# Lista agrupada no telefone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No telefone, a lista de Transações vira a lista agrupada do iOS: um cartão por dia, com o nome e o total do dia por fora, e a categoria na segunda linha.

**Architecture:**
- **Task 1, no `DataTable`** (`src/components/ui/data-table.tsx`):
  - prop nova `mobileGroups?: "band" | "inset"`, padrão `"band"`;
  - o retorno do `groupBy` ganha `aside?: React.ReactNode`;
  - com `"inset"`, o `GemeoDoTelefone` (~linha 1560) parte as linhas em grupos consecutivos;
  - cada grupo: um cabeçalho fora do cartão (`label` à esquerda, `aside` à direita) e um cartão com um `ItemGroup variant="divided"`;
  - o fio do `divided` começa depois da mídia;
  - abaixo do `md`, o `TablePanel` não desenha a moldura.
- **Task 2, em Transações** (`src/components/transactions/transacoes-tabela.tsx`):
  - liga `mobileGroups="inset"`;
  - o `diaDaLinha` (~linha 408) passa a dar o `aside` com o total do dia;
  - a legenda do telefone mostra a categoria, e o pagamento só quando as linhas da lista não têm todas o mesmo pagamento.

**Tech Stack:** React 19, TanStack Table v9, Tailwind v4, vitest (testes de fonte com `lerFonte`/`semComentarios` de `@/test/fonte`, e testes puros).

**Spec:** `docs/superpowers/specs/2026-11-18-lista-agrupada-no-telefone-design.md`

## Global Constraints

- `src/components/ui/` está autorizado para esta mudança (o dono escolheu a opção A, 18/11/2026).
- Só tokens e peças do design system: `Card`, `ItemGroup`, `Item`. Nada de cor, raio ou medida crua.
- O cabeçalho do dia: `text-2xs font-semibold tracking-wider uppercase text-muted-foreground`, o mesmo corpo da faixa de hoje. O cartão: `rounded-surface` sobre `bg-card`. Entre os dias, 8px.
- O desktop não muda. O `mobileGroups` padrão (`"band"`) mantém o gêmeo de hoje, para o Importar e o catálogo.
- Sem prettier. Comentários em português. Nunca `git add graphify-out/graph.json` nem `CLAUDE.md`. Sem push. Cada commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Depois de cada commit, `graphify update .`.
- Na Task 1, na mesma mudança: o bullet do `DataTable` no `AGENTS.md`, um exemplo na página `src/app/designsystem/docs/data-table.tsx` e a "Rodada 396" no `docs/design/HISTORICO-DESIGN-SYSTEM.md`.
- Sem navegador no subagente: o banco é de produção. O controlador confere a tela.

## Review Focus

- **Dia só com entradas** (um salário): o total é a soma das entradas, com o mais. Nunca `−R$ 0,00`.
- **Linhas previstas** (recorrentes futuras, `isProjectedTransactionRow`): ficam no cartão do dia, mas fora da soma.
- **Lista com um pagamento só, e lista com vários:** com um só, a segunda linha é só a categoria; com dois ou mais, "Mercado · Pix".
- **Seleção e toque longo** (`mobileRow="compact"`): a caixa de marcar e o menu seguem funcionando dentro dos cartões.
- **Ordenação que desliga o grupo** (`groupBy` devolve `null`, ordenado por valor): o gêmeo volta a ser uma lista só, num cartão, sem cabeçalhos.

---

### Task 1: `mobileGroups="inset"` no DataTable

**Files:**
- Modify: `src/components/ui/data-table.tsx`: a prop (~linha 573), o tipo do `groupBy` (~linha 534), o `GemeoDoTelefone` (~linha 1560) e a moldura do `TablePanel` no telefone
- Modify: `src/app/designsystem/docs/data-table.tsx`, `AGENTS.md`, `docs/design/HISTORICO-DESIGN-SYSTEM.md`
- Test: `src/components/ui/data-table-agrupada.test.ts` (novo)

**Interfaces:**
- Produces:
  - `mobileGroups?: "band" | "inset"` em `DataTableProps`
  - `groupBy?: (row: T, ctx: { sorting: SortingState }) => { key: string; label: React.ReactNode; aside?: React.ReactNode } | null`
  - o cabeçalho com `data-slot="data-table-mobile-group-heading"` e o cartão com `data-slot="data-table-mobile-group"`

- [ ] **Step 1: Testes que falham** (`semComentarios` do `data-table.tsx`):
  - contém `mobileGroups` e `aside?: React.ReactNode`;
  - contém `data-slot="data-table-mobile-group-heading"`;
  - o ramo `"inset"` monta um `ItemGroup variant="divided"` por grupo;
  - o padrão é `mobileGroups = "band"`.
- [ ] **Step 2: Rodar** `npx vitest run src/components/ui/data-table-agrupada.test.ts`. Esperado: FALHA.
- [ ] **Step 3: Implementar** como na Architecture e na Spec. Depois, a página do catálogo (um exemplo agrupado no `IphoneFrame`), o `AGENTS.md` e o histórico.
- [ ] **Step 4: Rodar** `npx vitest run src/components src/app/designsystem`, `npx tsc --noEmit`, `npx eslint src/components/ui/data-table.tsx` e `npm run ds:audit -- src/components/ui/data-table.tsx`. Esperado: PASSA.
- [ ] **Step 5: Commit** com `feat(data-table): no telefone, mobileGroups="inset" desenha um cartão por grupo, com o cabeçalho por fora`.

### Task 2: Transações liga a lista agrupada

**Files:**
- Modify: `src/components/transactions/transacoes-tabela.tsx`: o `diaDaLinha` (~linha 408), a coluna `payment` (~linha 228) e o `<DataTable` (~linha 589)
- Test: o teste de `transacoes-tabela` que já existe, ou `src/components/transactions/transacoes-tabela-agrupada.test.ts` (novo)

**Interfaces:**
- Consumes: Task 1 (`mobileGroups`, `aside`).
- Produces: `function totalDoDia(itens: Transaction[]): string`, exportada, pura. Ela soma as saídas não previstas com `signedCurrencyBRL` e, sem saídas, as entradas.

- [ ] **Step 1: Testes que falham:**
  - `totalDoDia` de duas saídas (29,09 e 213,36) é `"−R$ 242,45"`, no formato exato de `signedCurrencyBRL`;
  - `totalDoDia` de uma entrada só (1.200,00) dá o valor com o mais;
  - `totalDoDia` ignora uma linha prevista;
  - a fonte liga `mobileGroups="inset"`;
  - a legenda omite o pagamento quando todas as linhas têm o mesmo.
- [ ] **Step 2: Rodar** `npx vitest run src/components/transactions`. Esperado: FALHA.
- [ ] **Step 3: Implementar.** Para saber se há um pagamento só, compare `pagamentoDe(t)` nas `transacoes` da página. A coluna `payment` continua no desktop.
- [ ] **Step 4: Rodar** `npx vitest run src/components/transactions`, `npx tsc --noEmit`, `npx eslint src/components/transactions` e `npm run ds:audit -- src/components/transactions/transacoes-tabela.tsx`. Esperado: PASSA.
- [ ] **Step 5: Commit** com `feat(transacoes): no telefone, um cartão por dia com o total e a categoria na legenda`.
