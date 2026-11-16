# Lista sem salto ao abrir Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ao abrir um editor de lista na gaveta do filtro (ex.: Cartão com uma opção), a gaveta vai direto para a altura certa. Hoje ela sobe até o teto e depois desce.

**Architecture:** A `CommandList` (`src/components/ui/command.tsx`) usa `var(--cmdk-list-height, var(--command-list-ceiling, var(--command-list-max-h)))` na altura. Até o cmdk publicar `--cmdk-list-height`, a lista mede o teto (55dvh na gaveta), e o `useAlturaQueAcompanha` do `Drawer` anima para cima e depois para baixo. Duas mudanças resolvem: (1) sem `data-medido`, a lista usa a altura natural (`h-auto`, limitada por `max-h`); (2) `medido` só liga quando a variável do cmdk existe no elemento.

**Tech Stack:** React, cmdk, Tailwind v4, vitest (testes de fonte).

**Spec:** pedido do dono em 16/11/2026: "quando vai abrir o cartão… primeiro expande para cima, depois vai para baixo". OK de `ui/` dado no pedido.

## Global Constraints

- Mudança só em `src/components/ui/command.tsx` e no teste dele. A peça é do sistema, e o ajuste vale para toda `CommandList` (paleta, `Combobox`, filtros).
- A transição de altura continua só depois da primeira medida (`data-medido`), como hoje.
- Sem prettier. Nunca `git add graphify-out/graph.json` nem `CLAUDE.md`. Sem push. O commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- **Nunca liga:** se o cmdk nunca publicar `--cmdk-list-height` (lista vazia), `medido` ainda precisa ligar depois de um limite de quadros, senão a transição nunca liga. Use um limite de cerca de 10 quadros.
- **Paleta no telefone:** a placa do `CommandDialog` não pode nascer menor e pular na primeira pintura. Com `h-auto`, ela nasce do tamanho do conteúdo, que é o mesmo da medida.
- **Desmontar:** desmontar no meio da espera não pode deixar `requestAnimationFrame` pendente.

---

### Task 1: CommandList nasce na altura natural

**Files:**
- Modify: `src/components/ui/command.tsx` (`CommandList`, ~linhas 1368–1425, e o cabeçalho de comentário logo acima)
- Test: `src/components/ui/command-versions.test.ts` (acrescentar; se o nome for outro, usar o teste de fonte do `command` que já existe)

- [ ] **Step 1: Teste que falha**

```ts
it("antes da medida a lista é da altura do conteúdo, não do teto (a gaveta não sobe e desce)", () => {
  const src = semComentarios(lerFonte("src/components/ui/command.tsx"), "tudo")
  expect(src).toContain("not-data-medido:h-auto")
  expect(src).toMatch(/getPropertyValue\("--cmdk-list-height"\)/)
})
```

- [ ] **Step 2: Rodar** o teste. Esperado: FALHA.
- [ ] **Step 3: Implementar.**
  - (a) Acrescentar a classe `not-data-medido:h-auto` depois do `h-[min(…)]`, para que ela vença. Confirmar no CSS servido que ela compila e ganha a disputa.
  - (b) Trocar os dois `requestAnimationFrame` encadeados por um laço de `requestAnimationFrame`. A cada quadro ele lê `--cmdk-list-height` no `style` do elemento da lista: o ref é o `fadeRef` de `useScrollFade`, então junte os dois refs com o `useComposedRefs` de `radix-ui/internal`, como o projeto manda. Ligue `medido` quando a variável existir ou quando passar do limite de 10 quadros, e cancele tudo ao desmontar.
  - (c) Atualizar o comentário do cabeçalho com o porquê: o salto da gaveta.
- [ ] **Step 4: Rodar** `npx vitest run src/components/ui/command` e `npx tsc --noEmit`. Esperado: PASSA.
- [ ] **Step 5: Commit** com `fix(command): a lista nasce na altura do conteúdo, e a gaveta do filtro não sobe e desce`.
