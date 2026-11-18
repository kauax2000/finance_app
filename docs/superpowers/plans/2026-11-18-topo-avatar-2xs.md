# Topo do lançamento com avatar de 16px Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No topo do detalhe do lançamento, a linha da data fica "Ontem · ter, 17 de nov · [avatar de 16px]", sem o texto "pago por". O `Avatar` ganha o degrau `2xs` (16px).

**Architecture:** um degrau novo no `avatarVariants` (`src/components/ui/avatar.tsx`), registrado como componente do sistema. A linha da data do `transaction-detail-sheet.tsx` usa o `FotoDoMembro` nesse degrau.

**Tech Stack:** React 19, Tailwind v4, vitest.

**Spec:** escolha do dono (18/11/2026): a opção T2 do artefato "Topo do lançamento" (https://claude.ai/artifact/6wbKk1mJffyAwgdAXwrbss), mais o degrau novo de 16px no `Avatar`, aprovado na mesma data. Na T2, o avatar desce para 16px (a altura da letra) e o "pago por" sai da linha. O nome continua no nome acessível ("Pago por Kauã Leandro") e na dica.

## Global Constraints

- `src/components/ui/avatar.tsx` está autorizado pelo dono para este degrau.
- O degrau novo: `2xs: "size-4 …"`, 16px, com as iniciais num corpo que caiba. Use `text-[0.5rem] leading-none` e registre a exceção nomeada, com o motivo, em `ARBITRARY_VALUE_EXCEPTIONS` (`.claude/skills/design-system-guard/scripts/audit.mjs`), como as outras.
- O comentário da escala no topo do `avatarVariants` passa a citar o 16.
- O `2xs` não ganha o canto (`badge`) nem o `onEdit`: em 16px o canto não cabe. Se o `Avatar` aceitar `badge` ou `onEdit` com `size="2xs"`, eles não renderizam.
- Na mesma mudança:
  - a página do catálogo do `Avatar` (`src/app/designsystem/docs/avatar.tsx`) mostra o `2xs` na escala;
  - o bullet do `Avatar` no `AGENTS.md` cita o `2xs`;
  - em `docs/design/HISTORICO-DESIGN-SYSTEM.md`, a "Rodada 405 — o avatar de 16px";
  - se `src/components/ui/escadas.test.ts` tiver a escada do avatar, ela ganha o 16.
- No detalhe: `FotoDoMembro` ganha a prop `size?: "2xs" | "xs"` (padrão `"xs"`); o topo usa `"2xs"`. O texto `" · pago por "` vira `" · "`. O `role="img"`, o `aria-label="Pago por …"` e a `Tooltip` ficam.
- Sem prettier. Comentários em português. Nunca `git add graphify-out/graph.json` nem `CLAUDE.md`. Sem push. O commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Depois, `graphify update .`.
- Sem navegador no subagente: o banco é de produção.

## Review Focus

- **Foto de verdade (`AvatarImage`) em 16px:** cobre o círculo, sem distorcer.
- **`AvatarGroup`:** se ele deriva tamanhos do `avatarVariants`, ou não aceita o `2xs`, ou o aceita com o anel certo.

---

### Task 1: O degrau 2xs e o topo do lançamento

**Files:**
- Modify: `src/components/ui/avatar.tsx`, `src/app/designsystem/docs/avatar.tsx`, `.claude/skills/design-system-guard/scripts/audit.mjs` (exceção), `AGENTS.md`, `docs/design/HISTORICO-DESIGN-SYSTEM.md`
- Modify: `src/components/transactions/foto-do-membro.tsx` e `src/components/transactions/transaction-detail-sheet.tsx` (~linha 453)
- Test: `src/components/ui/avatar-badge-versions.test.ts` (ou um `avatar-versions.test.ts` novo) e `src/components/transactions/transaction-detail-sheet.test.ts`

- [ ] **Step 1: Testes que falham**
  - a fonte do `avatar.tsx` contém `2xs: "size-4`;
  - renderizar `<Avatar size="2xs">` dá `data-size="2xs"` e a classe `size-4`;
  - a fonte do detalhe não contém `pago por "` como texto visível, e passa `size="2xs"` ao `FotoDoMembro` na linha da data.
- [ ] **Step 2: Rodar** `npx vitest run src/components/ui/avatar src/components/transactions`. Esperado: FALHA.
- [ ] **Step 3: Implementar** como nas Global Constraints.
- [ ] **Step 4: Rodar** `npx vitest run src/components src/app/designsystem`, `npx tsc --noEmit`, `npx eslint` nos arquivos tocados e `npm run ds:audit -- src/components/ui/avatar.tsx src/components/transactions/transaction-detail-sheet.tsx`. Esperado: PASSA.
- [ ] **Step 5: Commit** com `feat(avatar): degrau 2xs de 16px; o topo do lançamento mostra só o avatar de quem pagou, do tamanho do texto`.
