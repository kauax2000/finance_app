# Transações: gasto sem vermelho, parcela embaixo e deslizar a linha Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Em Transações, o gasto perde o vermelho e a parcela vai para a segunda linha do telefone. No telefone, arrastar a linha para a esquerda revela as ações dela.

**Architecture:**
- **Task 1, cor e parcela:**
  - `TableCellMoney` (`src/components/ui/table.tsx`, ~linha 1173) ganha `tone="income"`, e o `col.money` do `DataTable` repassa;
  - Transações liga esse tom;
  - no telefone, o título usa `descricaoNaTabela`;
  - a célula de Categoria, que só aparece na legenda do telefone, ganha "· 2 de 3".
- **Task 2, deslizar:**
  - prop nova `mobileSwipe` no `DataTable`, só no gêmeo do telefone (`GemeoDoTelefone`);
  - a física do gesto mora em duas funções puras, num arquivo novo `src/lib/deslize.ts`;
  - Transações liga a prop.

**Tech Stack:** React 19, Tailwind v4, `motion` (já instalado), vitest.

**Spec:** `docs/superpowers/specs/2026-11-18-transacoes-gasto-parcela-deslizar-design.md`

## Global Constraints

- `src/components/ui/` está autorizado por este pedido (18/11/2026).
- Só tokens:
  - o gasto em `text-foreground`, a entrada em `text-income`;
  - Excluir sobre `bg-destructive` com `text-destructive-foreground` (ou o token de tinta que o `Button variant="destructive"` usa);
  - Editar e Confirmar em `bg-secondary`.
- Os botões revelados medem no mínimo 44px de alvo. Cada um tem 72px de largura, ícone de 20 sobre o rótulo em `text-2xs`, e a altura da linha.
- A trava de direção é de 8px. A linha abre quando o arraste passa da metade da largura das ações e volta abaixo disso. Não há deslize total.
- O gesto só vale para `pointerType === "touch"`. O toque simples e o toque longo continuam.
- A linha assenta na `MOLA` (`src/lib/spring.ts`). Com movimento reduzido, assenta sem mola.
- O padrão de `tone` (`"sign"`) e o `mobileSwipe` desligado mantêm todo o resto do app como está.
- Sem prettier. Comentários em português. Nunca `git add graphify-out/graph.json` nem `CLAUDE.md`. Sem push. Cada commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Depois de cada commit, `graphify update .`.
- Na mesma mudança:
  - no `AGENTS.md`, o bullet do `DataTable` cita `mobileSwipe` e `tone="income"`;
  - em `docs/design/HISTORICO-DESIGN-SYSTEM.md`, as rodadas 400 (Task 1) e 401 (Task 2);
  - na página `src/app/designsystem/docs/data-table.tsx`, um exemplo de cada.
- Sem navegador no subagente: o banco é de produção. O controlador confere a tela.

## Review Focus

- **Linha aberta e a pessoa rola a lista:** a linha fecha.
- **Linha prevista** (`hidden` em todas as ações): não desliza.
- **Toque simples numa linha aberta:** fecha, e não abre o lançamento.
- **Seleção em curso** (`marcando`): não desliza, porque o toque marca.
- **Valor zero:** nem verde nem vermelho.

---

### Task 1: O gasto sem vermelho e a parcela na segunda linha

**Files:**
- Modify: `src/components/ui/table.tsx` (`TableCellMoney`), `src/components/ui/data-table.tsx` (`col.money`, ~linha 2304)
- Modify: `src/components/transactions/transacoes-tabela.tsx`: o `identity.title` (~linha 203), a célula `category` (~linha 220) e o `col.money` (~linha 280)
- Modify: `src/components/transactions/transacoes-tabela-regras.ts`, que ganha `parcelaDe`
- Test: `src/components/transactions/transacoes-tabela.test.ts`, `src/components/ui/table-versions.test.ts` (ou o teste de `TableCellMoney` que já existe)

**Interfaces:**
- Produces:
  - `tone?: "sign" | "none" | "income"` no `TableCellMoney` e no `col.money`;
  - `export function parcelaDe(descricao: string): string | null` em `transacoes-tabela-regras.ts`.

- [ ] **Step 1: Testes que falham**
  - `parcelaDe`:
    - `parcelaDe("Botox Renata (2/3)")` dá `"2 de 3"`;
    - `parcelaDe("Mercado")` dá `null`;
    - `parcelaDe("Zara (1/12)")` dá `"1 de 12"`.
  - Renderizando `TableCellMoney`:
    - com `tone="income"`, `value={-10}` não leva `text-expense` e leva `text-foreground`;
    - com `tone="income"`, `value={10}` leva `text-income`;
    - com `tone="income"`, `value={0}` não leva nenhum dos dois;
    - com o padrão `"sign"`, `value={-10}` segue `text-expense`.
  - Na fonte de Transações:
    - o `col.money` passa `tone: "income"`;
    - o `identity.title` usa `descricaoNaTabela(t)`;
    - a célula de categoria usa `parcelaDe`.
- [ ] **Step 2: Rodar** `npx vitest run src/components/transactions src/components/ui/table`. Esperado: FALHA.
- [ ] **Step 3: Implementar**
  - **Categoria:** a célula escreve `${c.name} · ${parcela}` quando houver parcela, e `Sem categoria · 2 de 3` sem categoria. Ela segue escondida no desktop.
  - **Catálogo:** um exemplo `tone="income"` na página do `DataTable`.
  - **Docs:** o `AGENTS.md` e a "Rodada 400 — o gasto sem vermelho em Transações".
- [ ] **Step 4: Rodar** `npx vitest run src/components src/lib src/app/designsystem`, `npx tsc --noEmit`, `npx eslint` nos arquivos tocados e `npm run ds:audit -- src/components/ui/table.tsx src/components/transactions/transacoes-tabela.tsx`. Esperado: PASSA.
- [ ] **Step 5: Commit** com `feat(transacoes): o gasto perde o vermelho e a parcela vai para a segunda linha do telefone`.

### Task 2: Deslizar a linha no telefone

**Files:**
- Create: `src/lib/deslize.ts`, `src/lib/deslize.test.ts`
- Modify: `src/components/ui/data-table.tsx`: a prop `mobileSwipe` em `DataTableProps`, repassada ao `GemeoDoTelefone`, e a linha deslizável dentro dele
- Modify: `src/components/transactions/transacoes-tabela.tsx`, que passa `mobileSwipe`
- Test: `src/components/ui/data-table-agrupada.test.ts` (ou um `data-table-deslize.test.ts` novo)

**Interfaces:**
- Consumes: as `rowActions` (`DataTableAction<T>`, com `label`, `icon`, `variant`, `hidden(row)` e `onSelect(row)`) e a `MOLA` de `@/lib/spring`.
- Produces:
  - `export function travarDirecao(dx: number, dy: number): "x" | "y" | null`: `null` enquanto `Math.max(|dx|, |dy|) < 8`; depois, `"x"` se `|dx| > |dy|`, senão `"y"`;
  - `export function assentarDeslize(deslocamento: number, larguraAcoes: number): number`: devolve `-larguraAcoes` se `deslocamento <= -larguraAcoes / 2`, senão `0`;
  - `mobileSwipe?: boolean` em `DataTableProps`, desligado por padrão.

- [ ] **Step 1: Testes que falham**
  - `deslize.test.ts`:
    - `travarDirecao(3, 2)` é `null`, `travarDirecao(-10, 2)` é `"x"` e `travarDirecao(2, 12)` é `"y"`;
    - `assentarDeslize(-80, 144)` é `-144`, `assentarDeslize(-60, 144)` é `0` e `assentarDeslize(20, 144)` é `0`.
  - Fonte do `data-table.tsx`:
    - contém `mobileSwipe` e `travarDirecao(`, e `pointerType === "touch"` no ramo do deslize;
    - contém `data-slot="data-table-mobile-swipe-actions"`.
  - Transações passa `mobileSwipe`.
- [ ] **Step 2: Rodar** `npx vitest run src/lib/deslize.test.ts src/components/ui/data-table`. Esperado: FALHA.
- [ ] **Step 3: Implementar**
  - **A linha deslizável:** com `mobileSwipe`, cada linha do gêmeo com ao menos uma ação visível vira um invólucro `relative overflow-hidden`. Atrás, à direita, fica uma faixa `data-slot="data-table-mobile-swipe-actions"` com as ações visíveis em ordem. Na frente, a linha, que anda em `translateX`.
  - **O arraste:** `pointerdown` só com `pointerType === "touch"` e sem `marcando`. O `pointermove` chama `travarDirecao`. Com `"x"`, a linha segue o dedo, limitada entre `-larguraAcoes` e 0 (com resistência além disso, se quiser). Com `"y"`, o gesto é solto e a rolagem segue. No `pointerup`, o valor de `assentarDeslize` anima na `MOLA`, ou vai direto com movimento reduzido.
  - **Abrir e fechar:**
    - uma linha aberta por vez: o estado de qual está aberta mora no `GemeoDoTelefone`;
    - fecha num toque fora, num `scroll` de `window` ou quando outra linha abre;
    - o toque numa linha aberta fecha e não chama `onRowClick`;
    - um arraste horizontal não dispara o toque longo nem o clique.
  - **Os botões:** só focáveis com a linha aberta (`tabIndex={aberta ? 0 : -1}` e `aria-hidden` fechada). O toque chama `onSelect(row)` e fecha a linha.
  - **Catálogo:** um exemplo com `mobileSwipe` no `IphoneFrame` da página do `DataTable`.
  - **Docs:** o `AGENTS.md` e a "Rodada 401 — deslizar a linha no telefone".
- [ ] **Step 4: Rodar** `npx vitest run src/components src/lib src/app/designsystem`, `npx tsc --noEmit`, `npx eslint src/components/ui/data-table.tsx src/lib/deslize.ts src/components/transactions/transacoes-tabela.tsx` e `npm run ds:audit -- src/components/ui/data-table.tsx`. Esperado: PASSA.
- [ ] **Step 5: Commit** com `feat(data-table): no telefone, deslizar a linha revela as ações dela; Transações liga`.
