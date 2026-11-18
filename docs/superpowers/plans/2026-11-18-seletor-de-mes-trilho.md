# Seletor de mês no trilho das abas — plano

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** o seletor de mês (`‹ Novembro de 2026 ›`) veste o mesmo trilho de Despesas | Receitas, por uma variant nova do design system, `ButtonGroup variant="rail"`.

**Decisões do dono (18/11/2026):**
- a opção **1** dos mockups ("o mesmo trilho das abas");
- autorizou mexer em `src/components/ui/button-group.tsx` para criar a variant `rail`.

**Spec de origem:** `docs/superpowers/specs/2026-11-18-barra-categorias-design.md` (seção A). Este plano troca só a pele da cápsula. O comportamento continua: "Voltar a este mês" só fora do mês atual, `currentYm` e o popover com a `MonthGrid`.

## Global Constraints

- **O trilho é o do Tabs `floating`, medido no `tabs.tsx`, e não reinventado:**
  - `rounded-full bg-popover ring-1 ring-foreground/10`;
  - recuo `p-0.5`, `gap-0.5`;
  - 36 no mouse (`h-9`) e 44 no dedo (`pointer-coarse:h-11`);
  - as peças de dentro com 32 de altura, a mesma regra dos gatilhos do `TabsList` (inclusive o alvo de 44 no dedo pelo `::after`, como as abas fazem).
- **No `rail` os botões de dentro são redondos e sem fundo** (o terciário): cada um é um círculo ou uma pílula inteira, sem cantos achatados, sem emenda, sem filete divisor e sem margem negativa. Realce de passagem como o do `tertiary`.
- **Sem `variant`, o `ButtonGroup` fica idêntico ao de hoje.**
- **Componente novo ou variant entra completo** (AGENTS.md, invariante 8, e `docs/design/COMPONENTE-NOVO.md`):
  - a página `src/app/designsystem/docs/button-group.tsx` ganha o eixo `rail` na forma fixa da página;
  - o `registry.ts` é atualizado se listar variants;
  - roda `npm run ds:docs-map`;
  - um teste em `src/components/ui/button-group-versions.test.ts` (crie, se não existir) tranca a pele do trilho;
  - o bullet do `ButtonGroup` no `AGENTS.md` ganha uma linha sobre o `rail`.
- **Tokens apenas**, com o mesmo par escuro que o `Tabs` já usa.

## Task 1: `ButtonGroup variant="rail"` e o seletor de mês nele

**Files:**
- Modify: `src/components/ui/button-group.tsx`
- Modify: `src/components/categories/categories-toolbar.tsx` (o `ButtonGroup` de `MonthNavArrowControls`: `variant="rail"`; os três botões de dentro deixam de ser `outline`)
- Modify: `src/app/designsystem/docs/button-group.tsx`, `src/app/designsystem/registry.ts` (se aplicável), `AGENTS.md` (bullet do ButtonGroup)
- Test: `src/components/ui/button-group-versions.test.ts`, `src/components/categories/month-nav.test.ts`

- [ ] **Step 1: Escrever os testes que falham**
  - `button-group-versions.test.ts`: `ButtonGroup variant="rail"` tem as classes do trilho (`bg-popover`, `ring-foreground/10`, `rounded-full`, `p-0.5`). Sem `variant`, essas classes não aparecem, e as regras de emenda de hoje continuam.
  - `month-nav.test.ts`: o `ButtonGroup` do seletor tem `variant="rail"`, e nenhum dos três botões dentro dele é `variant="outline"`.
- [ ] **Step 2: Rodar e ver falhar**: `npx vitest run src/components/ui/button-group-versions.test.ts src/components/categories/month-nav.test.ts`
- [ ] **Step 3: Implementar** a variant, a troca no seletor, a página do catálogo, `ds:docs-map` e o bullet do AGENTS.
- [ ] **Step 4: Conferir**: `npx tsc --noEmit && npm run lint && npm run test:unit && npm run ds:audit -- src/components/ui/button-group.tsx src/components/categories/categories-toolbar.tsx`. Esperado: sem erro novo.
- [ ] **Step 5: Commit**: `feat(ds): ButtonGroup rail, o trilho das abas; o seletor de mês o veste`
