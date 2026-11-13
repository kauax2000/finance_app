# Fade do cabeçalho só ao rolar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O degradê de 56px abaixo do cabeçalho translúcido das folhas fica invisível com o corpo no topo e aparece ao rolar, para não escurecer o topo do ícone (decisão do dono, 13/11/2026, opção A).

**Architecture:** CSS puro em `@utility dialog-header-translucent` (`src/app/globals.css`): o `DialogBody` nomeia a própria rolagem (`scroll-timeline`), o ancestral `[data-layout="fixed"]` publica o nome (`timeline-scope`), e o `::after` do cabeçalho anima a opacidade de 0 a 1 nos primeiros 24px de rolagem (`animation-timeline`). Tudo dentro de `@supports (animation-timeline: scroll())`; sem suporte, o degradê fica sempre visível como hoje.

**Tech Stack:** Tailwind v4 (`@utility`, nesting), Vitest lendo o CSS.

**Spec:** este plano (mudança pequena; o porquê e a escolha estão no Goal). O cabeçalho translúcido está descrito no `AGENTS.md` (Superfícies modais → `Dialog`).

## Global Constraints

- O nome da linha do tempo é `--dialog-body-scroll`; o keyframe é `dialog-header-fade-in`; a faixa é `animation-range: 0 24px`.
- A regra mora dentro de `@utility dialog-header-translucent` (o seletor de corpo já cobre irmão, `form >` e a descrição `sr-only` no meio); o `@keyframes` vai no fim do `globals.css`, fora da faixa `glass-control`…`no-scrollbar` (`glass.test.ts`).
- Movimento reduzido não muda nada aqui (é opacidade ligada à rolagem, não animação no tempo).
- Nenhuma mudança em `src/components/ui/*.tsx`. `globals.css` é autorizado pelo dono para esta mudança.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; `git add` só dos arquivos da tarefa; nunca `graphify-out/graph.json`; sem push; `graphify update .` depois.

## Review Focus

- Navegador sem `animation-timeline` (Firefox): o degradê continua visível sempre, sem sumir de vez.
- Folha com o corpo dentro de `form` (formulário de lançamento): a linha do tempo precisa chegar ao `::after` do cabeçalho irmão do `form`.
- Painel de notificações (`translucent={false}`): nada muda nele.
- Corpo que não rola (conteúdo curto): o degradê fica invisível (rolagem 0).

---

### Task 1: o degradê liga com a rolagem

**Files:**
- Modify: `src/app/globals.css` (`@utility dialog-header-translucent` e um `@keyframes` no fim)
- Test: `src/components/ui/dialog-header-translucent.test.ts`

- [ ] **Step 1: Teste que falha** (no mesmo `describe`, usando o `blocoCss(CSS, "@utility dialog-header-translucent")` já usado ali)

```ts
it("o degradê só aparece ao rolar: invisível no topo, liga nos primeiros 24px", () => {
  const u = blocoCss(CSS, "@utility dialog-header-translucent")
  expect(u).toContain("@supports (animation-timeline: scroll())")
  expect(u).toContain("timeline-scope: --dialog-body-scroll")
  expect(u).toContain("scroll-timeline: --dialog-body-scroll block")
  expect(u).toContain("animation-timeline: --dialog-body-scroll")
  expect(u).toContain("animation-range: 0 24px")
  expect(CSS).toMatch(/@keyframes dialog-header-fade-in \{\s*from \{\s*opacity: 0;?\s*\}/)
})
```

- [ ] **Step 2:** `npx vitest run src/components/ui/dialog-header-translucent.test.ts` — falha.

- [ ] **Step 3: Implementar.** Dentro do bloco do cabeçalho na utility: um `@supports (animation-timeline: scroll())` com (a) o `::after` ganhando `animation: dialog-header-fade-in linear both; animation-timeline: --dialog-body-scroll; animation-range: 0 24px;`, (b) os seletores de corpo já existentes ganhando `scroll-timeline: --dialog-body-scroll block;`, e (c) o ancestral comum publicando o nome: `[data-layout="fixed"]:has(&) { timeline-scope: --dialog-body-scroll; }` (aninhado; se o Tailwind não aceitar o `&` dentro do `:has`, escreva a regra fora da utility, no fim do arquivo, como `[data-layout="fixed"]:has(> [data-translucent]), [data-layout="fixed"]:has([data-translucent])` — diga no relatório qual forma usou e por quê). `@keyframes dialog-header-fade-in { from { opacity: 0 } to { opacity: 1 } }` no fim do arquivo.

- [ ] **Step 4:** o teste passa; `npx vitest run src/components/ui` limpo (inclui `glass.test.ts`); confira que a regra chega ao CSS servido: `grep -rl "dialog-header-fade-in" .next/dev/static/chunks/ | head -1` acha um arquivo (se não achar, `touch src/app/globals.css` e espere a recompilação).

- [ ] **Step 5: Commit** `fix(dialog): o degradê do cabeçalho translúcido só aparece ao rolar`.
