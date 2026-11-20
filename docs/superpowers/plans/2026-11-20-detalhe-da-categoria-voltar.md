# O voltar do detalhe da categoria no desktop — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** O ‹ do `PageHeader` antes do ladrilho, no desktop do detalhe da categoria.
**Spec:** `docs/superpowers/specs/2026-11-20-detalhe-da-categoria-voltar-design.md`

## Global Constraints
- Nada em `src/components/ui/`, `globals.css`, banco. Telefone sem mudança.
- `npx tsc --noEmit && npm run lint && npm run test:unit` e `npm run ds:audit -- "src/app/(app)/categories/[categoryId]"` verdes.

## Review Focus
1. Link direto (sem histórico interno) vai a `/categories?month=<mês aberto>`.
2. Trocar o mês na pílula e voltar: volta pelo histórico, não fica preso.

### Task 1: O voltar

**Files:** `src/app/(app)/categories/[categoryId]/page-client.tsx`; `docs/JORNADAS.md` §9; `docs/atlas/template.html` (+ `python3 docs/atlas/build.py`).

- [ ] **Step 1:** `<PageHeaderTitleRow back={`/categories?month=${yearMonth}`} backLabel="Voltar para Categorias" media={…}>`. Se a troca de mês da pílula usa `router.push`, conferir que o voltar pelo histórico não volta para o mês anterior em vez de Categorias; se voltar, passar `backHistory={false}` e registrar o porquê no relatório.
- [ ] **Step 2:** JORNADAS §9: aresta `detail -->|"‹ voltar, no desktop"| cats` (a existente diz "voltar, no telefone; no desktop, a lateral"; ajustar o rótulo); a linha "Detalhe" da tabela. Atlas: o passo "Detalhe" e a data da capa. Rodar o build.
- [ ] **Step 3:** Checks verdes; conferir no navegador (dev em :3000, sem gravar nada) a 1280px: o ‹ aparece e volta.
- [ ] **Step 4:** Commit `feat(categoria): o voltar do detalhe no desktop` com spec e plano.
