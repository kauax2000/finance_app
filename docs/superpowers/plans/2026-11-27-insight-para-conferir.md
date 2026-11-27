# Insight "para conferir" com a lista no alto — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O cartão "N para conferir" do carrossel de insights mostra, logo abaixo do título, até 3 linhas no formato das notificações (ícone da origem, descrição, "25 de nov · Apple Pay", valor), sem o total no canto.

**Architecture:** O dado (`lib/insights-da-categoria.ts`) passa a carregar a data e a origem de cada linha e corta em 3; o corpo (`corpo-do-insight.tsx`) desenha as linhas com o `Item` do design system; o carrossel (`insights-da-categoria.tsx`) tira o canto e o `mt-auto` só desse insight.

**Tech Stack:** Next 16, React 19, Tailwind v4, Vitest (`renderToStaticMarkup` e testes de fonte), Heroicons.

**Spec:** `docs/superpowers/specs/2026-11-27-insight-para-conferir-design.md`

## Global Constraints

- Linha: à esquerda `ItemMedia variant="tile" tone="info"` (tinta `soft`, o padrão); no meio a descrição (truncada) e embaixo `"<dia> de <mês curto> · <origem>"`, ex.: `"25 de nov · Apple Pay"`; à direita o valor em `reaisInteiros` com `nums font-mono`.
- Origem = `ROTULO_DA_ORIGEM[source]` (`src/lib/piloto/piloto.ts`); sem rótulo (`app`, `manual`…), o texto é `"pelo app"`.
- Ícone por origem: `shortcut`, `apple_pay` → `DevicePhoneMobileIcon`; `quick_text`, `whatsapp` → `ChatBubbleLeftEllipsisIcon`; `import_pdf`, `import_sheet`, `import_statement` → `DocumentTextIcon`; `recurring` → `ArrowPathIcon`; qualquer outro → `SparklesIcon`. O conjunto (`16/solid`, `20/solid` ou `24/outline`) segue o corpo do ícone dentro do ladrilho (regra G do `ds:audit`).
- Até 3 linhas, as mais recentes por data; o resto vira `"e mais N"` (como hoje).
- O canto do título do insight `conferir` fica vazio; o botão "Conferir agora" e o link não mudam.
- Nada de `src/components/ui/` nem `globals.css` muda. Nenhum outro insight muda.
- Commit ao fim de cada tarefa, só com os arquivos da tarefa; a mensagem termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Nunca `git add` de `CLAUDE.md`, `graphify-out/` ou `docs/design/painel/`.

## Review Focus

- Descrição vazia (`description` null): a linha não pode sumir nem quebrar; mostra `"Sem descrição"`. → teste na Task 2.
- Descrição longa: trunca numa linha, o valor fica inteiro à direita. → classe `truncate`/`min-w-0` conferida no teste de fonte da Task 2.
- Origem desconhecida ou `app`: `"pelo app"` e o ícone ✦. → teste na Task 2.
- Mais de 3 a conferir: 3 linhas + `"e mais N"` com N certo. → teste na Task 1.
- Data inválida/vazia: não lança; cai no texto cru como os helpers de `transaction-date.ts`. → coberto pelo helper escolhido (Task 2 usa um que já trata isso).

---

### Task 1: O dado das linhas

**Files:**
- Modify: `src/lib/insights-da-categoria.ts` (tipo `CorpoDoInsight` ramo `conferir`, e o bloco que monta o insight `a-conferir`)
- Test: `src/lib/insights-da-categoria.test.ts` (os dois casos "a conferir")

**Interfaces:**
- Produces: `{ tipo: "conferir"; linhas: { dataYmd: string; origem: Transaction["source"]; descricao: string; valor: number }[]; resto: number; total: number }` — o campo `dia` sai.

- [ ] **Step 1: Atualizar o teste** "a conferir: 1 lançamento sem resto; 5 mostram…" para: 5 lançamentos dão `linhas` com 3 itens (`d05`, `d04`, `d03`, nessa ordem) e `resto: 2`; a primeira linha é `{ dataYmd: "2026-11-05", origem: <o source do tx de teste>, descricao: "d05", valor: 10 }`. Renomear o título do teste para "…5 mostram 3 linhas, as mais recentes, e resto 2".
- [ ] **Step 2:** `npx vitest run src/lib/insights-da-categoria.test.ts` — FAIL.
- [ ] **Step 3:** No builder, `slice(0, 3)` e as linhas com `dataYmd: t.date.slice(0, 10)`, `origem: t.source`. Corrigir quem lê `linhas[].dia` (só `corpo-do-insight.tsx`; ali, deixar compilando até a Task 2 com o mínimo).
- [ ] **Step 4:** O teste e `npx tsc --noEmit` passam.
- [ ] **Step 5: Commit** `feat(insights): a linha do "para conferir" leva a data e a origem, até 3`.

### Task 2: A lista no alto, no formato das notificações

**Files:**
- Modify: `src/components/categories/detail/resumo/corpo-do-insight.tsx` (ramo `conferir`)
- Modify: `src/components/categories/detail/resumo/insights-da-categoria.tsx` (`canto` e o `mt-auto` do corpo)
- Create: `src/components/categories/detail/resumo/corpo-do-insight.test.ts`

**Interfaces:**
- Consumes: o tipo da Task 1.

- [ ] **Step 1: Teste novo** `corpo-do-insight.test.ts` com `renderToStaticMarkup(<CorpoDoInsight corpo={...} corDaSerie="red" numero="R$ 7" linha="" />)` (ou `createElement`, o arquivo é `.ts`):
  - 1 linha `{ dataYmd: "2026-11-25", origem: "apple_pay", descricao: "Estacionamento", valor: 7 }` → o texto contém `"Estacionamento"`, `"25 de nov · Apple Pay"` e `"R$ 7"`; o HTML contém `data-slot="item-media"`.
  - `origem: "app"` → contém `"25 de nov · pelo app"`.
  - `descricao: ""` → contém `"Sem descrição"`.
  - `resto: 2` → contém `"e mais 2"`.
  - Fonte de `corpo-do-insight.tsx`: contém `tone="info"` e `truncate`.
  - Fonte de `insights-da-categoria.tsx`: o `canto` não cita `"conferir"` (o canto desse insight é `null`), e o corpo do `conferir` não leva `mt-auto`.
- [ ] **Step 2:** `npx vitest run src/components/categories/detail/resumo` — FAIL.
- [ ] **Step 3:** No ramo `conferir`, um `ItemGroup` de `Item size="sm"` sem caixa (veja `src/components/layout/notification-row.tsx` para a forma: `ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription`), o mapa de ícones da Global Constraints, a legenda com o dia ("25 de nov": um helper de `src/lib/transaction-date.ts` ou o dia + `formatMonthShortPtBr` sem ponto) e a origem; "e mais N" embaixo, em `text-muted-foreground`. No carrossel, `canto` vira `null` no `conferir` e o invólucro do corpo só leva `mt-auto` fora dele (a sobra vai para antes do botão).
- [ ] **Step 4:** Os testes de `src/components/categories` e `src/lib/insights-da-categoria.test.ts`, `npx tsc --noEmit`, `npx eslint` dos três arquivos e `npm run ds:audit -- src/components/categories/detail/resumo` passam sem achado novo.
- [ ] **Step 5: Commit** `feat(categoria): o "para conferir" lista no alto, como as notificações`.
