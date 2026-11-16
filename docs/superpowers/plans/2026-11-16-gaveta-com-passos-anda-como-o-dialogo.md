# Gaveta com passos anda como o diálogo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No telefone, a troca do passo 1 para o 2 do Importar extrato anima como no desktop. A gaveta acompanha a altura de cada passo e anda na curva do diálogo do desktop. O conteúdo chega em escada e o título rola, como já acontece hoje.

**Architecture:**
1. **`DialogContent`, ramo da gaveta** (`src/components/ui/dialog.tsx` ~491): hoje veste `has-[[data-slot=dialog-steps]]:h-(--drawer-h)` sempre. Essa trava passa a valer só quando `layout === "fixed"`. No `layout="auto"`, a gaveta com passos mede o conteúdo, como o diálogo do desktop no `auto`, e o teto continua o da gaveta.
2. **`useAlturaQueAcompanha`** (`src/components/ui/drawer.tsx` ~390–428): a animação de altura usa a curva da "viagem longa" do desktop (`useAlturaAnimada`, `VIAGEM_LONGA`: `--duration-gentle` com `--ease-emphasized`), lida dos tokens no lugar de `300ms` e `cubic-bezier(0.16, 1, 0.3, 1)` cravados. O `Element.animate` não aceita `var()`, então leia os valores computados dos tokens no elemento (`getComputedStyle(el).getPropertyValue("--duration-gentle")` / `"--ease-emphasized"`) e converta a duração para ms. Se o token faltar, use os valores de hoje como reserva.

**Tech Stack:** React, vaul, Tailwind v4, vitest (testes de fonte).

**Spec (aprovado pelo dono em 16/11/2026):** "tem que ser igual" ao desktop. No desktop, a caixa anda (`--duration-gentle` com `--ease-emphasized`, sem quique), o conteúdo chega em escada (`ESCADA`) e o título rola (`TrocaSuave`). No telefone, a gaveta com passos no `layout="auto"` acompanha a altura de cada passo. A trava continua para `layout="fixed"` e tela cheia. Os tutoriais (`CaixaDoPasso`) não mudam.

## Global Constraints

- `ui/` e tokens: OK do dono dado neste pedido. Nenhum token novo.
- Movimento reduzido: sem animação de altura, como hoje (`reduzido`).
- Com o teclado aberto (`--drawer-teclado`), a altura não anima, como hoje.
- Atualizar os testes que trancam a trava antiga: `dialog-versions.test.ts` e `drawer-versions.test.ts`, se citarem a classe. Explique no teste por que a trava é só do `fixed`.
- **Outros que usam `DialogSteps`:** `categories-onboarding-wizard.tsx` e `security/DeleteAccountDialog.tsx`. Diga no relatório que `layout` cada um usa e se passam a acompanhar a altura no telefone. Não mude essas telas.
- Sem prettier. Nunca `git add graphify-out/graph.json` nem `CLAUDE.md`. Sem push. O commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- **Passo 2 maior que a tela:** a gaveta cresce até o teto (`--drawer-h`), e o corpo rola, sem a gaveta passar da área segura.
- **Primeira abertura:** abrir a gaveta não pode animar a altura de 0 até o conteúdo. O `anterior === 0` já evita isso; confira.
- **O "Ver todos"** (o `expandido`, `size="full"`, `layout="fixed"`) continua na tela cheia.
- **`DeleteAccountDialog` no telefone:** se ele usa `auto` com passos e passa a medir o conteúdo, a troca de passo dele também anima. Isso está ok, mas não pode quebrar.

---

### Task 1: A gaveta com passos acompanha a altura, na curva do desktop

**Files:**
- Modify: `src/components/ui/dialog.tsx` (o ramo `gaveta`)
- Modify: `src/components/ui/drawer.tsx` (`useAlturaQueAcompanha`)
- Test: `src/components/ui/dialog-versions.test.ts`, `src/components/ui/drawer-versions.test.ts`

- [ ] **Step 1: Teste que falha** (fonte, `semComentarios`):
  - em `dialog.tsx`, a classe `has-[[data-slot=dialog-steps]]:h-(--drawer-h)` só aparece condicionada a `layout === "fixed"`;
  - em `drawer.tsx`, `useAlturaQueAcompanha` lê `--duration-gentle` e `--ease-emphasized` e não tem mais `duration: 300` nem `cubic-bezier(0.16, 1, 0.3, 1)` cravados (a reserva pode existir como constante nomeada).
- [ ] **Step 2: Rodar.** Esperado: FALHA.
- [ ] **Step 3: Implementar** como na Architecture.
- [ ] **Step 4: Rodar** `npx vitest run src/components/ui/dialog src/components/ui/drawer src/components/transactions/importar` e `npx tsc --noEmit`. Esperado: PASSA.
- [ ] **Step 5: Commit** com `feat(drawer): a gaveta com passos acompanha a altura de cada passo, na curva do diálogo do desktop`.
