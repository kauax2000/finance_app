# Rodapé do lançamento em frases curtas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O rodapé do detalhe do lançamento fica centralizado e diz tudo, em frases curtas: quem pagou, quem lançou e por onde, quando e se foi editado.

**Architecture:**
- `RodapeDaOrigem` (`src/components/transactions/detalhe/rodape-da-origem.tsx`) ganha `pagou`, ao lado do `autor` que já recebe, e passa a montar as linhas.
- As frases saem de uma regra pura nova em `detalhe-regras.ts`.
- O detalhe (`transaction-detail-sheet.tsx`) passa quem pagou ao rodapé. O topo continua com o avatar de quem pagou.

**Tech Stack:** React 19, Tailwind v4, vitest.

**Spec:** escolha do dono (18/11/2026), a opção R1 do artefato "Rodapé do lançamento" (https://claude.ai/artifact/QqKHQEXVN9RGxLbn84BYwf). Pedido dele: centralizar todo o conteúdo e trazer todas as informações no rodapé, mesmo as que já aparecem no topo.

## Global Constraints

- Tudo centralizado (`text-center`, linhas `justify-center`), em `Caption`. O nome da pessoa fica em `text-foreground font-medium`, e o resto em `text-muted-foreground`.
- O avatar é o `FotoDoMembro size="2xs"` (16px), o mesmo do topo. O texto da linha fica no centro vertical dele (`items-center`).
- As linhas:
  - mesma pessoa pagou e lançou (despesa, carteira de 2+): `[foto] Kauã Leandro pagou e lançou pelo app`;
  - pessoas diferentes: `[foto] Renata pagou`, e embaixo `[foto] Kauã Leandro lançou pelo app`;
  - receita, ou despesa sem pagador conhecido: só `[foto] Kauã Leandro lançou pelo app`;
  - carteira de uma pessoa, ou autor desconhecido: a nota de hoje, com o ícone da origem (`Lançado pelo app`);
  - "pelo app", "pela Planilha" etc. vêm da mesma tabela de `notaDaOrigem`/`notaComAutor`;
  - a última linha é sempre o quando: `Ontem, 18:06`, mais ` · editado hoje, 9:12` quando houve edição. É a mesma informação de hoje (`momentoDoRegistro`, `linhaDaEdicao`), numa linha só, com a primeira letra maiúscula e o "editado" minúsculo.
- O topo não muda: o avatar de quem pagou continua lá. A repetição é pedido do dono.
- No computador o painel é a mesma folha (448px), e as linhas são as mesmas.
- Sem prettier. Comentários em português. Nunca `git add graphify-out/graph.json` nem `CLAUDE.md`. Sem push. O commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Depois, `graphify update .`.
- Sem navegador no subagente: o banco é de produção.

## Review Focus

- **Lançamento nunca editado:** a linha do quando fica só com `Ontem, 18:06`, sem `·` sobrando.
- **Nome longo:** a linha quebra centralizada, e o avatar não se separa do nome.
- **Lançamento sem `created_at`** (`momento` nulo): a linha do quando some, sem linha vazia.

---

### Task 1: As frases do rodapé

**Files:**
- Modify: `src/components/transactions/detalhe-regras.ts`, `src/components/transactions/detalhe/rodape-da-origem.tsx`, `src/components/transactions/transaction-detail-sheet.tsx`
- Test: o teste de `detalhe-regras`, `src/components/transactions/transaction-detail-sheet.test.ts` e um teste de render do rodapé (novo ou existente)

**Interfaces:**
- Produces:
  - `export function linhaDoQuando(criado: string | null | undefined, editado: string | null | undefined): string | null` em `detalhe-regras.ts`: `"Ontem, 18:06"`, `"Ontem, 18:06 · editado hoje, 9:12"` ou `null`. Compõe `momentoDoRegistro` e `linhaDaEdicao`; leia as duas para acertar as maiúsculas.
  - `RodapeDaOrigem` ganha `pagou?: { nome: string; foto: React.ReactNode } | null`.

- [ ] **Step 1: Testes que falham**
  - `linhaDoQuando`: com edição, sem edição e sem `created_at`, com os formatos acima, a partir de datas fixas com hora conhecida no fuso do teste (veja como os testes de `momentoDoRegistro` fixam o tempo).
  - Renderizando o rodapé:
    - mesma pessoa: o texto contém `pagou e lançou pelo app`, e há um só avatar;
    - pessoas diferentes: `Renata` e `pagou` numa linha, `lançou pelo app` na outra, com dois avatares;
    - sem autor: a nota de hoje.
  - A fonte do detalhe passa `pagou=` ao `RodapeDaOrigem`.
- [ ] **Step 2: Rodar** `npx vitest run src/components/transactions`. Esperado: FALHA.
- [ ] **Step 3: Implementar** como nas Global Constraints.
- [ ] **Step 4: Rodar** `npx vitest run src/components/transactions`, `npx tsc --noEmit`, `npx eslint` nos arquivos tocados e `npm run ds:audit -- src/components/transactions/detalhe/rodape-da-origem.tsx`. Esperado: PASSA.
- [ ] **Step 5: Commit** com `feat(detalhe): o rodapé centralizado diz quem pagou, quem lançou e por onde, e quando, em frases curtas`.
