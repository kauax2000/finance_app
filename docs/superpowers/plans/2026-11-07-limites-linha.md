# Linha de Limites com avatar e situação — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A linha de cada pessoa em Limites (Membros) ganha o avatar, a situação em palavras e a porcentagem à direita, mantendo a barra de hoje.

**Architecture:** Só `src/components/members/`. O avatar da lista de Pessoas sai para uma peça exportada (`AvatarDoMembro`) e as duas seções a usam. `LimitesSecao` passa a receber os membros (com perfil) em vez de `{ user_id, nome }`. A conta da situação é uma função pura em `src/lib/limites/limites.ts`.

**Tech Stack:** Next.js, React, design system do projeto (`Item`, `Avatar`, `Progress`), vitest.

**Spec:** pedido do dono em 07/11/2026 ("melhore o design layout e usabilidade dessa sessão"), opção **A** do mockup `public/_mockups/limites.html`, com a ressalva dele: "Eu gostava de como estava a linha antes que mostrava onde era 80% que passou" — **a barra fica como está** (`Progress bands={[80, 100]}`, a marca dos 80% e a pastilha do excesso).

## Global Constraints

- Design system do `AGENTS.md`: nada novo em `src/components/ui/` nem em `globals.css`; nenhuma cor crua; tom por token (`text-destructive`, `text-warning`, `text-muted-foreground`).
- A barra não muda: `Progress value={pct} bands={[80, 100]} size="sm"` com o mesmo `aria-label`.
- Copy fixa:
  - sem limite: `"{gasto} no mês · sem limite"`; para o dono, a linha mostra à direita o texto `Definir` (não é botão à parte: a linha inteira continua abrindo o diálogo).
  - até 100%: `"Sobram {resto} · limite {limite}"`.
  - acima de 100%: `"Passou {excesso} · limite {limite}"`, a parte "Passou {excesso}" em `text-destructive`.
  - à direita, com limite: a porcentagem inteira (`"221%"`, `nums`), `text-destructive` a partir de 100, `text-warning` a partir de 80, senão `text-foreground`.
- O diálogo de edição, o `ItemChevron` (só para o dono) e o estado `indisponivel` não mudam.
- Banco de dev = produção: não gravar nem remover limite ao testar.
- Commit só dos arquivos da tarefa (`git add <arquivos>`, nunca `-A`); trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; sem `git stash`; `graph.json` fora do commit.

## Review Focus

1. Gasto exatamente igual ao limite → "Sobram R$ 0,00", 100% em `text-destructive`. Teste da função pura.
2. Limite em reais com centavos e gasto em centavos → o resto e o excesso sem erro de arredondamento (contas em centavos inteiros). Teste da função pura.
3. Pessoa sem perfil (diretório falhou) → o avatar cai nas iniciais de "Membro", sem quebrar. Coberto por `AvatarDoMembro` usar o mesmo fallback de `memberDisplayName`.
4. Quem não é dono → sem chevron e sem "Definir". Teste de fonte.

---

### Task 1: A linha nova

**Files:**
- Modify: `src/lib/limites/limites.ts` (+ `src/lib/limites/limites.test.ts` se existir; senão criar)
- Modify: `src/components/members/pessoas-secao.tsx` (exportar `AvatarDoMembro`, usado na própria lista)
- Modify: `src/components/members/limites-secao.tsx`
- Modify: `src/app/(app)/members/page-client.tsx` (passa `pessoas={members}`)
- Test: `src/components/members/limites-secao.test.ts`, `src/components/members/membros.test.ts`

**Interfaces:**
- Produces: `export function situacaoDoLimite(gastoCentavos: number, limiteReais: number): { pct: number; tipo: "sobra" | "passou"; valorCentavos: number }` em `limites.ts` — `pct = round(gasto / limite × 100)`; `passou` quando `gasto > limite` (valor = excesso), senão `sobra` (valor = limite − gasto, ≥ 0).
- Produces: `export function AvatarDoMembro({ member, size }: { member: MemberWithProfile; size?: "sm" })` em `pessoas-secao.tsx`, com o mesmo desenho de hoje (foto ou iniciais no tom de `identityToneFor`).
- `LimitesSecao` prop `pessoas: MemberWithProfile[]` (o nome vem de `memberDisplayName`).

- [ ] **Step 1: Testes que falham** — `situacaoDoLimite(221243, 1000)` → `{ pct: 221, tipo: "passou", valorCentavos: 121243 }`; `situacaoDoLimite(142866, 5000)` → `{ pct: 29, tipo: "sobra", valorCentavos: 357134 }`; `situacaoDoLimite(100000, 1000)` → `{ pct: 100, tipo: "sobra", valorCentavos: 0 }`. Fonte de `limites-secao.tsx`: contém `<AvatarDoMembro`, `"Passou "`, `"Sobram "`, `"sem limite"`, `Definir`, `bands={[80, 100]}`, `text-destructive`, `text-warning`; `Definir` e `<ItemChevron` só dentro do ramo `podeEditar`. Fonte de `pessoas-secao.tsx`: exporta `AvatarDoMembro` e a lista o usa.
- [ ] **Step 2:** `npx vitest run src/lib/limites src/components/members` → FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4:** testes passam; `npx tsc --noEmit`; `npx eslint src/components/members src/lib/limites "src/app/(app)/members"`; `npm run ds:audit -- src/components/members` sem violação nova; abrir `/members` em `http://localhost:3000` (o dono já está logado) e conferir as duas linhas sem gravar nada.
- [ ] **Step 5: Commit** — `feat(membros): a linha de Limites com avatar, situação e porcentagem`.
