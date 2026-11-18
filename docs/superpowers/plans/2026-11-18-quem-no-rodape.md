# Quem no rodapé, quem pagou no topo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No detalhe do lançamento, o bloco solto de Recorrência, Assinatura, Projeto e Quem sai. Os três primeiros viram etiquetas no topo, quem pagou vai para a linha da data, e quem lançou vai para o rodapé de origem.

**Architecture:**
- `transaction-detail-sheet.tsx`: o `DescriptionList` solto sai. A fileira de `Badge` ganha recorrência, assinatura e projeto; a `Caption` da data ganha "· pago por [foto] Nome". O `RodapeDaOrigem` passa a receber quem lançou.
- `detalhe/rodape-da-origem.tsx`: com `autor`, troca a nota de origem por "[foto] Nome lançou pelo app · data".
- Uma regra pura nova em `detalhe-regras.ts` monta o verbo.

**Tech Stack:** React 19, Tailwind v4, vitest.

**Spec:** `docs/superpowers/specs/2026-11-18-quem-no-rodape-design.md`

## Global Constraints

- Só peças do design system (`Badge`, `Avatar`, `AvatarFallback`, `Caption`). Nada novo em `src/components/ui/`.
- A foto da pessoa usa a mesma composição do `QuemLancou` de `src/components/transactions/transacoes-tabela.tsx` (foto, ou iniciais no tom de `identityToneFor`), no degrau `xs`.
- Quem pagou só aparece em despesa, numa carteira com duas pessoas ou mais. Quem lançou só aparece numa carteira com duas pessoas ou mais. Fora disso, o topo e o rodapé ficam como hoje.
- Sem repetição: quem pagou nunca aparece no rodapé, e quem lançou nunca aparece no topo.
- Os links de Assinatura e de Projeto mantêm os destinos de hoje (`${subscriptionsHref}?sub=…` e `projetoDetailPath(t.project_id)`). No dedo, o alvo de toque mede 44.
- Sem prettier. Comentários em português. Nunca `git add graphify-out/graph.json` nem `CLAUDE.md`. Sem push. O commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Depois, `graphify update .`.
- Sem navegador no subagente: o banco é de produção.

## Review Focus

- **Receita:** sem "pago por".
- **Carteira de uma pessoa:** nem "pago por" nem nome no rodapé; o rodapé fica como hoje.
- **Membro que saiu da carteira** (o id não está em `membros`): sem nome e sem foto, e a linha não quebra.
- **Lançamento sem recorrência, assinatura nem projeto:** a fileira de etiquetas fica como hoje.

---

### Task 1: Etiquetas no topo, quem pagou na data, quem lançou no rodapé

**Files:**
- Modify: `src/components/transactions/transaction-detail-sheet.tsx` (a fileira de `Badge` ~linha 455, a `Caption` da data ~linha 448, o `DescriptionList` ~linha 530 e o `RodapeDaOrigem` ~linha 580)
- Modify: `src/components/transactions/detalhe/rodape-da-origem.tsx`
- Modify: `src/components/transactions/detalhe-regras.ts` (sai `linhaDeQuem`, se ficar sem uso; entra `notaComAutor`)
- Test: `src/components/transactions/transaction-detail-sheet.test.ts` e o teste de `detalhe-regras`

**Interfaces:**
- Produces:
  - `export function notaComAutor(source: Transaction["source"], autor: string): string`: `"Kauã lançou pelo app"`, `"Kauã lançou pela Planilha"`, com a mesma tabela de origem de `notaDaOrigem` (`ROTULO_DA_ORIGEM`, `FEMININAS`);
  - `RodapeDaOrigem` ganha `autor?: { nome: string; foto: React.ReactNode } | null`.

- [ ] **Step 1: Testes que falham**
  - `notaComAutor("app", "Kauã")` é `"Kauã lançou pelo app"`; para uma origem feminina, `"… lançou pela …"`, conferindo contra o mesmo `ROTULO_DA_ORIGEM`.
  - Na fonte do detalhe:
    - não contém `<DescriptionTerm>Quem</DescriptionTerm>` nem `<DescriptionTerm>Recorrência</DescriptionTerm>`;
    - contém `pago por`;
    - passa `autor=` ao `RodapeDaOrigem`;
    - na fileira de `Badge`, contém `rotuloDaRecorrencia(`, `projetoDetailPath(` e `?sub=`.
  - Ajuste as asserções existentes que citam o `DescriptionList` ou `linhaDeQuem`.
- [ ] **Step 2: Rodar** `npx vitest run src/components/transactions`. Esperado: FALHA.
- [ ] **Step 3: Implementar**
  - **Etiquetas:**
    - recorrência: `Badge size="md" tone="neutral"` com `ArrowPathRoundedSquareIcon` (16/solid);
    - assinatura e projeto: `Badge` com ícone (`CreditCardIcon` e `FolderIcon`, 16/solid) envolto num `Link`. Use `Badge asChild` se o `Badge` aceitar; senão, o `Link` por fora, com o anel de foco do sistema.
  - **Data:** depois de `quandoExato`, ` · pago por ` com a foto e o nome, `inline-flex items-center gap-1`.
  - **Rodapé:** com `autor`, a primeira `Caption` vira foto + `notaComAutor(t.source, autor.nome)` + ` · ` + momento.
- [ ] **Step 4: Rodar** `npx vitest run src/components/transactions`, `npx tsc --noEmit`, `npx eslint` nos arquivos tocados e `npm run ds:audit -- src/components/transactions/transaction-detail-sheet.tsx src/components/transactions/detalhe/rodape-da-origem.tsx`. Esperado: PASSA.
- [ ] **Step 5: Commit** com `feat(detalhe): quem pagou vai para a linha da data, quem lançou para o rodapé, e recorrência, assinatura e projeto viram etiquetas`.
