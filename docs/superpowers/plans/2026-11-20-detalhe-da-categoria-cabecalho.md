# O mês sobe para o topo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** No desktop do detalhe da categoria, o resumo do mês vira uma faixa de largura inteira logo abaixo do `PageHeader`, sem o título "Este mês".

**Architecture:** Só arranjo e apresentação: `CategoryDetailLayout` move o slot `resumo` para cima da grade; `ResumoDoMes` ganha a forma `destaque`; o esqueleto acompanha.

**Tech Stack:** React 19, Tailwind v4, design system do projeto.

**Spec:** `docs/superpowers/specs/2026-11-20-detalhe-da-categoria-cabecalho-design.md`

## Global Constraints

- `AGENTS.md` vale todo; proibido mexer em `src/components/ui/`, `src/app/globals.css`, `src/app/designsystem/`, banco ou RPC.
- Telefone sem mudança visível.
- Antes do commit: `npm run ds:audit -- src/components/categories/detail`, `npx tsc --noEmit && npm run lint && npm run test:unit` verdes.

## Review Focus

1. Receita: legenda "recebidos em <mês>", sem barra, "Ainda vem" na linha.
2. Mês passado: legenda com o mês por extenso, sem traço do ritmo.
3. Sem limite e sem previsto: só valor, legenda e peso; nenhum " · " sobrando.
4. Coluna Lançamentos presa continua presa e começa alinhada à Comparação.

---

### Task 1: A faixa do mês no desktop

**Files:**
- Modify: `src/components/categories/detail/category-detail-layout.tsx`
- Modify: `src/components/categories/detail/resumo-do-mes.tsx`
- Modify: `src/components/categories/detail/category-detail-skeleton.tsx`
- Modify: `src/app/(app)/categories/[categoryId]/page-client.tsx` (passar `destaque={!isMobile}`)

**Interfaces:**
- `ResumoDoMes` ganha `destaque?: boolean` (padrão `false` = forma de hoje, usada no telefone).

- [ ] **Step 1:** Layout desktop: `<div className="flex min-w-0 flex-col gap-6">{resumo}<div className="grid grid-cols-5 items-start gap-6">…análise col-span-3 / lista col-span-2 sticky…</div></div>`.
- [ ] **Step 2:** `ResumoDoMes destaque`: sem `PageSectionHeader`; valor `MoneyDisplay size="3xl"` com a legenda ao lado na mesma linha de base (`"gastos em " + mês minúsculo` / `"recebidos em …"`, mês por `labelYearMonthPt` em minúscula; no mês corrente também o nome do mês); `Progress` como hoje, na largura da faixa; uma linha com as partes presentes juntas por " · " (frase do limite, aviso ou "Ainda vem", peso) em `Muted`, quebrando no estreito. A seção continua um `PageSection` com nome acessível (`aria-label` "Resumo de <mês>").
- [ ] **Step 3:** Esqueleto: no desktop, a faixa (valor, barra, linha) acima da grade; telefone igual.
- [ ] **Step 4:** Checks do Global Constraints verdes.
- [ ] **Step 5:** Commit `feat(categoria): o mês do detalhe sobe para o topo` (inclui spec e plano), `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
