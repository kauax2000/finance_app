# Mostradores do carrossel de insights: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** no carrossel de insights, o ponto ativo vira pílula e a seta sem destino apaga a 30%.

**Architecture:** a pílula liga a variant `pill`, que já existe no `CarouselDots`. A seta apagada é uma mudança de uma linha no `CarouselControl`, em `carousel.tsx`, trancada por teste. O vão entre os pontos (item 3 do spec) o controlador mede no navegador depois. Se for preciso, vira uma tarefa nova.

**Tech Stack:** React 19, Tailwind v4, vitest.

**Spec:** `docs/superpowers/specs/2026-11-24-mostradores-do-carrossel-design.md`

## Global Constraints

- A seta `tertiary` desabilitada, fora da sobreposição, fica a 30% (`disabled:opacity-30`), visível e no lugar.
- O `disabled:invisible` da sobreposição `inside` não muda.
- Só peças do design system. Nenhum `rounded-*` ou valor arbitrário na tela.
- Não fazer push. Não fazer stage de `CLAUDE.md` nem de `graphify-out/graph.json`. Nada de `git stash` nem de `prettier --write` em arquivo inteiro.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- O carrossel com setas sobre a foto (`placement` padrão, `appearance` glass ou solid) continua a 30% e não muda. Teste no Step 1.
- `controls="inside"` com `tertiary` continua `invisible` quando desabilitado. Teste no Step 1.

---

### Task 1: pílula ativa e seta apagada

**Files:**
- Modify: `src/components/ui/carousel.tsx` (o `CarouselControl`, ~linha 1035: a regra `appearance !== "tertiary" && "disabled:opacity-30"`)
- Modify: `src/components/categories/detail/resumo/insights-da-categoria.tsx` (~linha 98: `<CarouselDots />`)
- Test: `src/components/ui/carousel-versions.test.ts`

- [ ] **Step 1:** Em `carousel-versions.test.ts`, crie o teste "a seta tertiary na barra apaga a 30% quando não tem para onde ir". Ele renderiza (no molde dos testes vizinhos) um `CarouselPrevious placement="inline"` desabilitado, com `appearance` tertiary, e confere a classe `disabled:opacity-30`.
  - Ele também confere que `controls="inside"` sobreposto com tertiary ainda tem `disabled:invisible`.
  - E que o glass continua com `disabled:opacity-30`.
- [ ] **Step 2:** `npx vitest run src/components/ui/carousel-versions.test.ts`. Esperado: FAIL no caso inline.
- [ ] **Step 3:** Em `carousel.tsx`, a regra de opacidade passa a valer para todo controle que não está sobreposto em `inside` com tertiary. Ou seja:
  - aparências não tertiary, em qualquer lugar;
  - e tertiary fora da sobreposição (`!sobreposta`).

  Atualize o comentário. Em `insights-da-categoria.tsx`, troque para `<CarouselDots variant="pill" />`.
- [ ] **Step 4:** `npx vitest run src/components/ui/carousel-versions.test.ts src/components/categories && npx tsc --noEmit && npx eslint src/components/ui/carousel.tsx src/components/categories/detail/resumo/insights-da-categoria.tsx`. Esperado: verde.
- [ ] **Step 5:** Se a página do `Carousel` no catálogo (`src/app/designsystem/docs/`) descreve o desabilitado das setas, atualize a frase. Atualize também o bullet do `Carousel` no `AGENTS.md` se ele falar disso.
- [ ] **Step 6:** Commit: `feat(ds): seta da barra do carrossel apaga sem destino; insights com a pílula ativa`.
