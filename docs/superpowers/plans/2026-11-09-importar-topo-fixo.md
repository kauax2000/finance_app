# Topo fixo na tela cheia do Importar — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** na tela cheia ("Ver todos") do Importar extrato, no desktop, ficam parados:
- a linha das abas, com a busca, as Ações e o Ver menos;
- o cabeçalho das colunas da tabela.

Só as linhas dos lançamentos rolam.

**Architecture:**
- Hoje quem rola é o `DialogBody`. Na tela cheia, a partir de `md`, ele deixa de rolar e vira coluna flex.
- A altura desce por uma cadeia de `min-h-0` / `flex-1` até o `table-viewport` do `DataTable`, que passa a ser o único rolável.
- O cabeçalho cola com o `stickyHeader` do `DataTable`, uma prop que já existe.
- Tudo por classe no lado da tela (`importar-extrato-dialog.tsx`, `conferir-importacao.tsx`), sem mexer em `src/components/ui/`.

**Tech Stack:** React 19, Tailwind v4, Vitest (testes de fonte).

**Spec:** pedido do dono (09/11/2026), com print anotado: "deixe toda essa seção de cima com os tabs do lado esquerdo, as ações do lado direito e a primeira linha, que é os títulos de cada coluna, fixados; o scroll só acontece dali para baixo, a partir da primeira linha do primeiro lançamento."

## A cadeia de hoje (medida no navegador)

Do diálogo até o viewport da tabela, na tela cheia:

1. `form` (flex coluna, `min-h-0 flex-1`)
2. `dialog-body` (bloco, rola: `min-h-0 flex-1 overflow-y-auto`)
3. a raiz do passo, em `importar-extrato-dialog.tsx` (`<div key="conferir" className={ESMAECE_AO_CHEGAR}>`, bloco)
4. a raiz de `ConferirImportacao` (flex coluna, `gap-2 md:gap-4`)
5. o invólucro `ESCADA_DA_TABELA` (bloco)
6. `[data-slot=table-panel-group]` (flex coluna)
7. `[data-slot=table-panel]` (o `Card`, flex coluna, `overflow-hidden`)
8. um `div` `hidden md:block`, o pai do viewport (o gêmeo do telefone é outro filho, `md:hidden`)
9. `[data-slot=table-viewport]` (`overflow-x-auto`; o y computa `auto`)

Abaixo da tabela, na mesma raiz (4), ficam o `Item` do saldo e as legendas. Eles continuam embaixo, parados, fora da rolagem.

## Comportamento

- **Só desktop** (`md:` em toda classe nova). No telefone nada muda: o `DialogBody` rola como hoje e o gêmeo da tabela é uma lista.
- **Só tela cheia** (`imp.expandido`). O compacto não muda.
- **Altura:**
  - Com muitas linhas, a tabela ocupa a sobra entre a linha das abas e o saldo, e o viewport rola dentro dela.
  - Com poucas linhas (por exemplo, a busca achou 3), a moldura encolhe ao conteúdo e não estica até o fim. Por isso o `Card` leva `min-h-0`, e não `flex-1`.
- **Cabeçalho:** `stickyHeader` no `DataTable`, ligado só com `imp.expandido`.
- **A borda de baixo dissolve:** se o `DataTable` aceitar `fade="bottom"` (confira em `data-table.tsx`), ligue na tela cheia, para as linhas se dissolverem no fim do viewport como nas outras listas com teto. Se a prop não existir, pule e diga no relatório.
- **A escada de entrada** (`ESCADA_DA_TABELA`) continua igual.

## Global Constraints

- Não tocar `src/components/ui/`, `src/app/globals.css`, `CLAUDE.md` nem `graphify-out/`. O `graphify-out/` só muda por `graphify update .`.
- Só tokens e utilitários. Seletores arbitrários de descendente (`[&_[data-slot=…]]:`) são permitidos, se o `ds:audit` passar.
- Sem prettier. Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sem push.
- O banco do dev é produção. No navegador, nunca clicar em Importar nem em Desfazer.
- Verificação:
  - `npx tsc --noEmit`
  - `npx eslint src/components/transactions/importar`
  - `npx vitest run src/components/transactions/importar`
  - `npm run ds:audit -- src/components/transactions/importar`

## Review Focus

1. Rolar a tabela: a linha das abas e o cabeçalho das colunas não se mexem, e o `DialogBody` não rola junto (ele não tem barra própria).
2. Busca com 3 resultados: a moldura encolhe até a última linha, e o saldo vem logo abaixo, sem um vão até o fim do diálogo.
3. Janela a 375px (telefone): o diálogo rola como antes, e o gêmeo da tabela continua aparecendo. Nenhum `display: flex` vaza para o `hidden md:block`.
4. Recolher e voltar a "Ver todos": a rolagem da tabela recomeça no topo.
5. Uma coluna larga ou janela estreita no desktop: a rolagem horizontal da tabela continua funcionando, junto com a vertical.

---

### Task 1: a cadeia de altura e o cabeçalho fixo

**Files:**
- Modify: `src/components/transactions/importar/importar-extrato-dialog.tsx` (o `DialogBody` e a raiz do passo `conferir`)
- Modify: `src/components/transactions/importar/conferir-importacao.tsx` (a raiz de `ConferirImportacao`, o invólucro da tabela, o `DataTable`)
- Modify, se as classes do invólucro morarem ali: `src/components/transactions/importar/movimento.ts`
- Test: `src/components/transactions/importar/importar-extrato-dialog.test.ts`

**Classes, por elo (tudo com `md:`, e só com a tela cheia):**

| Elo | Recebe |
| --- | --- |
| 2. `DialogBody` | `md:flex md:flex-col md:overflow-hidden` |
| 3. raiz do passo `conferir` | `md:flex md:min-h-0 md:flex-1 md:flex-col` |
| 4. raiz de `ConferirImportacao` | `md:min-h-0 md:flex-1` |
| 5. invólucro da tabela | `md:flex md:min-h-0 md:flex-col` |
| 6–8. dentro do `DataTable` | por seletor de descendente a partir do invólucro (5) |
| 9. viewport | por `viewportClassName` do `DataTable`, se bastar |

O que os seletores de descendente (6–8) fazem:
- `table-panel-group` vira `min-h-0`;
- `table-panel` vira `min-h-0`;
- o pai direto do viewport, `[data-slot=table-panel]>div:has(>[data-slot=table-viewport])`, vira flex coluna com `min-h-0`, só com `md:`, porque ele é `hidden` no telefone;
- o viewport fica `min-h-0`.

**Raízes de bloco que precisam de classe:** os elos 2 e 3 só recebem as classes com `expandido`. No `importar-extrato-dialog.tsx` a variável já existe (`const expandido = imp.passo === "conferir" && imp.expandido`). No `conferir-importacao.tsx` é `imp.expandido`.

**Por que `stickyHeader` basta:** o `TableHeader` com `sticky` cola no topo do viewport, e o viewport agora rola nos dois eixos.

- [ ] **Step 1: testes de fonte que falham.**
  - `importar-extrato-dialog.tsx` contém `md:overflow-hidden` no `DialogBody`, ligado a `expandido`.
  - `conferir-importacao.tsx` contém `stickyHeader={imp.expandido}`.
  - `conferir-importacao.tsx` (ou `movimento.ts`) contém `has-[` ou `:has(>[data-slot=table-viewport])`.
  - Toda classe nova de flex na cadeia começa com `md:`. Teste com `not.toMatch(/(?<![:\w-])flex-1 md:min-h-0/)` ou uma asserção equivalente que pegue um `flex` sem `md:` nas strings novas.
- [ ] **Step 2:** `npx vitest run src/components/transactions/importar` → FAIL.
- [ ] **Step 3:** implementar a tabela de classes acima e o `stickyHeader`. Ligue o `fade="bottom"` se a prop existir no `DataTable`.
- [ ] **Step 4:** a Verificação passa.
- [ ] **Step 5:** commit `feat(importar): na tela cheia o topo e o cabeçalho ficam parados, e só as linhas rolam`.

### Task 2: conferir no navegador (controlador)

- [ ] Abrir o Importar com um CSV de teste de 60 linhas, gerado no próprio navegador, e ir a "Ver todos". Só ler: **nunca clicar Importar**.
- [ ] Medir os cinco pontos do Review Focus:
  - o `scrollTop` do `dialog-body` fica 0 depois de rolar a tabela;
  - o `top` da linha das abas e do `thead` não muda;
  - a busca com 3 resultados;
  - a 375px;
  - Recolher e voltar.
- [ ] Mandar um print ao dono.
