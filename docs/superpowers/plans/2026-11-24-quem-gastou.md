# Quem gastou — barra dividida com lista: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** trocar as barras longas do cartão "Quem gastou" por uma barra dividida na cor de cada pessoa e uma lista com %, compras e valor, ao lado do insight no desktop.

**Architecture:** a função `quemGastou` ganha a contagem de compras. `lib/avatar` ganha o índice de identidade. O componente espelha o "Como foi pago" (`components/analise-do-mes/como-foi-pago.tsx`, ramo de várias formas), e o `CategoryDetailLayout` põe `quem` e `insight` em par.

**Tech Stack:** Next 16, React 19, Tailwind v4, vitest, componentes de `src/components/ui/`.

**Spec:** `docs/superpowers/specs/2026-11-24-quem-gastou-design.md`

## Global Constraints

- Banco é produção: nenhum teste ou verificação grava dado.
- Não fazer push. Não fazer stage de `CLAUDE.md` nem de `graphify-out/graph.json`. Não rodar `prettier --write` em arquivo inteiro.
- Raio só da escala: o cartão é o do `CartaoDoGrafico` (`rounded-surface`), a barra é a do `ChartSplit`, e nenhum `rounded-*` novo vai na tela.
- Nenhuma classe montada em tempo de execução (o Tailwind não a gera): a cor vai por `style`/config, `var(--identity-N)`.
- Textos: "Quem gastou" / "Quem recebeu"; linha miúda "93% · 14 compras", "1 compra", "entrada"/"entradas" na receita; barra com `label` "Gastos do mês por pessoa" / "Entradas do mês por pessoa".
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- Duas pessoas com a mesma identidade: a barra precisa separá-las, e todas as cores passam para `var(--chart-1..5)` na ordem da lista (teste na Tarefa 2).
- Pessoa fora do diretório ("Ex-membro"): sem `avatar_color` e com o nome como semente, o índice tem de ser estável (teste na Tarefa 2).
- Estorno de uma pessoa: abate o valor, mas não conta compra (teste na Tarefa 1).
- Nome longo: trunca dentro do `ItemContent`, sem largura fixa, e o valor nunca quebra (`shrink-0`) (conferido na Tarefa 3, a 375px).
- Insight ausente: `quem` ocupa a linha inteira, sem uma coluna vazia ao lado (conferido na Tarefa 3).

---

### Task 1: `quemGastou` conta as compras

**Files:**
- Modify: `src/lib/composicao-do-mes.ts` (função `quemGastou`, ~linha 481)
- Test: `src/lib/composicao-do-mes.test.ts` (`describe("quemGastou")`, ~linha 212)

**Interfaces:**
- Produces: `quemGastou(txsDoMes: Transaction[], tipo: TipoDaCategoria): { userId: string; valor: number; compras: number }[]`

- [ ] **Step 1:** No teste existente, mude a expectativa para:
  ```ts
  expect(r).toEqual([
      { userId: "ana", valor: 120, compras: 2 },
      { userId: "bia", valor: 50, compras: 1 },
  ])
  ```
  Bia tem uma compra e um estorno, e o estorno não conta.
- [ ] **Step 2:** `npx vitest run src/lib/composicao-do-mes.test.ts -t quemGastou`. Esperado: FAIL, sem `compras`.
- [ ] **Step 3:** Conte as transações com `peso(t, tipo) > 0` por pessoa, ao lado dos centavos. Atualize o comentário da função.
- [ ] **Step 4:** O mesmo comando. Esperado: PASS. Rode também `npx tsc --noEmit`: o `QuemGastou` aceita o campo a mais.
- [ ] **Step 5:** Commit: `feat(categoria): quemGastou conta as compras de cada pessoa`.

### Task 2: índice de identidade e cores das pessoas

**Files:**
- Modify: `src/lib/avatar.ts`
- Create: `src/lib/avatar.test.ts`

**Interfaces:**
- Produces:
  - `identityIndexFor(stored: string | null | undefined, fallbackSeed: string): number`. Devolve de 1 a 6, a posição de `identityToneFor(...)` em `IDENTITY_TONES` mais 1. Reuse a função existente; não duplique o hash.
  - `coresDasPessoas(indices: number[]): string[]`. Devolve `var(--identity-N)` para cada índice. Se houver índice repetido, devolve `var(--chart-${(i % 5) + 1})` pela posição `i` para todas.

- [ ] **Step 1:** Testes:
  - `identityIndexFor(null, "Ex-membro")` é igual a ele mesmo numa segunda chamada e está entre 1 e 6;
  - `IDENTITY_TONES[identityIndexFor(x, s) - 1] === identityToneFor(x, s)` para `(null, "ana@x.com")` e `("bogus", "s")`;
  - `coresDasPessoas([1, 4])` dá `["var(--identity-1)", "var(--identity-4)"]`;
  - `coresDasPessoas([3, 3])` dá `["var(--chart-1)", "var(--chart-2)"]`.
- [ ] **Step 2:** `npx vitest run src/lib/avatar.test.ts`. Esperado: FAIL (exports não existem).
- [ ] **Step 3:** Implemente as duas funções em `src/lib/avatar.ts`.
- [ ] **Step 4:** O mesmo comando. Esperado: PASS.
- [ ] **Step 5:** Commit: `feat(avatar): índice de identidade e cores das pessoas para gráfico`.

### Task 3: o cartão e o par com o insight

**Files:**
- Modify: `src/components/categories/detail/quem-gastou.tsx`
- Modify: `src/components/categories/detail/category-detail-layout.tsx`

**Interfaces:**
- Consumes: `quemGastou` → `{ userId, valor, compras }[]` (Tarefa 1); `identityIndexFor`, `coresDasPessoas` (Tarefa 2); `ChartSplit`, `ChartSwatch`, `splitPercents` e `type ChartConfig` de `@/components/ui/chart`; `ItemContent` de `@/components/ui/item`.
- Produces: `QuemGastou` com a mesma assinatura de props (`pessoas` passa a ter `compras`).

- [ ] **Step 1:** Reescreva o corpo de `QuemGastou`.
  - Modelo: o ramo de "várias formas" do `como-foi-pago.tsx` (linhas ~131–176). Não use o cabeçalho de "93% em…" nem a `Caption`.
  - `ChartSplit labels="none"` com config `{ [userId]: { label: nome, color } }`, `nameKey="userId"`, `dataKey="valor"` e o label dos Global Constraints.
  - Embaixo, a `<ul className="mt-2 grid grid-cols-1 gap-3">`. Cada linha tem:
    - o avatar `sm` de hoje;
    - o `ItemContent` com o nome `truncate`;
    - a linha miúda `text-xs text-muted-foreground nums` com `ChartSwatch` e `{pct}% · {compras} compra(s)`;
    - o valor `nums shrink-0 font-mono font-semibold` com `reaisInteiros`.
  - Apague o `Progress` e as larguras `w-28`/`w-20`.
- [ ] **Step 2:** Em `CategoryDetailLayout`, quando `quem && insight`, embrulhe os dois em `<div className="grid gap-(--space-block) md:grid-cols-2">`. Se só um existir, ele fica solto como hoje. Atualize o comentário de `quem`.
- [ ] **Step 3:** Rode `npx tsc --noEmit && npm run lint && npx vitest run src/lib src/components/categories` e `npm run ds:audit -- src/components/categories/detail/quem-gastou.tsx`. Esperado: tudo verde, e o auditor sem violação nova.
- [ ] **Step 4:** Confira no painel do navegador (`dev-attach`, :3000), em `/categories/fdc3a58a-7d80-4cc6-a0ee-a92148f53820`, Carro, novembro de 2026, só leitura:
  - a barra em duas cores;
  - "93% · N compras";
  - o par com o insight no desktop;
  - a 375px, empilhado e sem corte do valor;
  - `getComputedStyle` do cartão com `borderRadius` 22px, igual aos vizinhos.
- [ ] **Step 5:** Commit: `feat(categoria): quem gastou vira barra dividida com lista, ao lado do insight`.
