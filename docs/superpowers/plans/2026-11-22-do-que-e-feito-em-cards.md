# "Do que é feito o mês" em cards — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O bloco vira três cartões: o resumo (frase, barra e legenda com os totais) e, embaixo, "O que você controla" e "Já decidido" lado a lado, com o rodapé dentro do segundo.

**Architecture:** Uma tarefa, só de interface, em `src/components/categories/detail/do-que-e-feito-o-mes.tsx` e no esqueleto da página. A conta e a frase não mudam.

**Tech Stack:** React 19, Tailwind v4 (container queries).

**Spec:** `docs/superpowers/specs/2026-11-22-do-que-e-feito-em-cards-design.md`. Mockup: `docs/design/painel/do-que-e-feito-cards.html` (opção A).

## Global Constraints
- Vale o `AGENTS.md` inteiro: tokens, peças do DS e nenhum componente em `src/app/`.
- Os três cartões são `CartaoDoGrafico` (`@/components/analise-do-mes/compartilhado`); o apoio vai em `apoio`.
- O vão entre os cartões é `gap-(--space-block)` (16px).
- O banco do dev é produção: no app, só leitura.
- Checks:
  - `npx tsc --noEmit`;
  - `npx eslint src/components/categories/detail`;
  - `npx vitest run src/lib/composicao-do-mes.test.ts src/components/analise-do-mes`;
  - `npm run ds:audit -- src/components/categories/detail`.
- Não faça push. Faça stage só dos seus arquivos (`CLAUDE.md` e `graphify-out/graph.json` são de outra sessão).
- Telas:
  - Renata: `/categories/411e7afa-7f98-485d-ad03-4ef2a6fbb35d?type=expense&month=2026-11`;
  - Carro: `/categories/fdc3a58a-7d80-4cc6-a0ee-a92148f53820?type=expense&month=2026-11`.

## Review Focus
1. Só variável, ou só fixo: um cartão de lista na largura toda; no resumo, sem barra e sem legenda.
2. Sem `ultimaTerminaYm` e com `proximoMes` 0: o cartão do fixo sem rodapé.
3. Coluna estreita (telefone, 375px): o resumo, depois o variável e depois o fixo, empilhados, sem estouro horizontal.
4. Receita: os títulos "Avulsas" e "Já decidido · entradas fixas", e o rodapé "A última entrada fixa acaba em".
5. Os dois cartões com a mesma altura, e o rodapé preso ao pé do cartão do fixo.

---

### Task 1: Os três cartões

**Files:**
- Modify: `src/components/categories/detail/do-que-e-feito-o-mes.tsx`
- Modify: `src/components/categories/detail/category-detail-skeleton.tsx` (`h-80` vira o resumo `h-36` e dois `h-56` em `md:grid-cols-[5fr_4fr]`)

- [ ] **Step 1: O componente devolve um `<div className="grid gap-(--space-block)">`.** Ele tem:
  - o resumo (`CartaoDoGrafico titulo="Do que é feito o mês"`), com a frase, a `ChartSplit` e a legenda dos dois totais (`ChartSwatch`, rótulo, `reaisInteiros` em `font-mono font-semibold`, "· N%" muted; `flex flex-wrap justify-between`);
  - um `@container` com a grade `grid gap-(--space-block) @xl:grid-cols-[5fr_4fr]`, que leva os dois `CartaoDoGrafico`:
    - o do variável, com `apoio="vs seu normal"`;
    - o do fixo, com `apoio="N ativas"` (de `fixo.itens.length`; com um só, "1 ativa"), as linhas de hoje e o rodapé dentro dele, preso ao pé.

  O que sai: `CabecalhoDaColuna` (apague se ficar sem uso) e o `Separator` e o rodapé comum. Com um lado só, o cartão leva `@xl:col-span-2`. Confira que o `CardContent` do `CartaoDoGrafico` já é `flex flex-1 flex-col`, para o `mt-auto` do rodapé funcionar e os cartões esticarem.
- [ ] **Step 2: O esqueleto**, conforme o spec.
- [ ] **Step 3: Navegador**, só leitura. Confira Renata e Carro no desktop e a 375px, comparando com a opção A do mockup.
- [ ] **Step 4:** Rode os checks e o `graphify update .`, e faça o commit `feat(categoria): "Do que é feito o mês" em três cartões`. Faça o stage também do spec, do plano e do mockup.
