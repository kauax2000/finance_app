# A gaveta de trás recua Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No telefone, quando uma gaveta abre por cima de outra, a de trás encolhe e sobe um pouco, como as folhas empilhadas do iOS. Quando a da frente fecha, a de trás volta.

**Architecture:**
- **A causa.** O `Drawer` já vira `DrawerPrimitive.NestedRoot` dentro de outra gaveta (`src/components/ui/drawer.tsx`, ~linha 289). No vaul 1.1.2, porém, o `NestedRoot` só avisa a gaveta de trás (`onNestedOpenChange`) quando o próprio vaul muda o `open`. O `useControllableState` não chama `onOpenChange` quando o `open` controlado muda por prop. As nossas gavetas abrem e fecham sempre por `open` controlado, então a de trás nunca recua. Pior: se a da frente fecha por prop, a de trás que já recuou pelo arraste não volta.
- **A correção mora no nosso `Drawer`.**
  - O `DrawerRaiz` de `superficie: "gaveta"` ganha `recuar(aberta: boolean)`.
  - O `DrawerContent` da gaveta registra o próprio nó numa ref da raiz (`registrarConteudo`).
  - `recuar(true)` escreve no nó o transform de recuo do vaul. `recuar(false)` volta o transform e, depois de 500ms, tira a transição, como o vaul faz em `onNestedOpenChange` (`node_modules/vaul/dist/index.mjs`, ~linha 1290).
  - O `Drawer` aninhado (o que tem `pai?.superficie === "gaveta"`) chama `pai.recuar(open)` num efeito quando o `open` muda, e `pai.recuar(false)` ao desmontar aberto.
- **O arraste continua com o vaul.** O `NestedRoot` já repassa `onNestedDrag` e `onNestedRelease` à de trás. Só a abertura e o fechamento por prop são nossos.
- **Para a de trás aparecer.** As duas gavetas altas têm o topo no mesmo lugar (`--drawer-h`), e a da frente cobriria a de trás inteira. A gaveta aninhada mede `--drawer-h` menos 12px (`--drawer-recuo: calc(var(--spacing) * 3)`), e o topo da de trás aparece acima dela.

**Tech Stack:** React 19, vaul 1.1.2, Tailwind v4, vitest (testes de fonte com `lerFonte`/`semComentarios` de `@/test/fonte`).

**Spec:** pedido do dono em 17/11/2026: "o efeito do iOS de quando um drawer abre em cima do outro: o de trás vai levemente para trás". Os valores são os do vaul, para o arraste e a abertura darem o mesmo resultado:
- recuo: `scale((innerWidth - 16) / innerWidth) translate3d(0, -16px, 0)`;
- transição: `transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)` (`TRANSITIONS` do vaul);
- volta: `translate3d(0, 0, 0)` com a mesma transição e, depois de 500ms, `transition: none`.

## Global Constraints

- `src/components/ui/` está autorizado pelo dono para esta mudança (17/11/2026).
- Só no `Drawer` (telefone). O `Sheet` do desktop já recua por `data-coberta` e não muda.
- Movimento reduzido (`prefers-reduced-motion: reduce`): o recuo acontece sem transição.
- Sem prettier. Comentários em português. Nunca `git add graphify-out/graph.json` nem `CLAUDE.md`. Sem push. O commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Depois, `graphify update .`.
- Na mesma mudança:
  - o bullet do `Drawer` no `AGENTS.md` (o que diz "Gaveta dentro de gaveta vira `NestedRoot` sozinha") ganha uma frase;
  - `docs/design/HISTORICO-DESIGN-SYSTEM.md` ganha a "Rodada 392 — a gaveta de trás recua".
- Sem navegador no subagente: o banco é de produção. O controlador confere a tela.

## Review Focus

- **A da frente fecha por prop** (escolher a categoria fecha a gaveta pelo estado da tela): a de trás volta ao normal, sem ficar encolhida.
- **A da frente desmonta aberta** (a tela troca de passo com ela aberta): o efeito de limpeza devolve a de trás.
- **Arrastar a da frente para baixo:** o vaul segue escalando a de trás pelo arraste. A nossa escrita não briga com a dele: só escrevemos quando o `open` muda.
- **Gaveta sem gaveta por baixo** (a raiz): nada muda; `recuar` só é chamado por quem tem `pai` gaveta.
- **A de trás com o teclado do iOS** (`rolarSobOTeclado`): continua mexendo só no meio da gaveta, não no transform do conteúdo.

---

### Task 1: O recuo da gaveta de trás

**Files:**
- Modify: `src/components/ui/drawer.tsx`: o tipo `DrawerRaiz` (~linha 210), o `Drawer` (~linha 230), o `DrawerContent` (~linha 646) e as classes da altura (~linha 153)
- Modify: `AGENTS.md`, `docs/design/HISTORICO-DESIGN-SYSTEM.md`
- Test: `src/components/ui/drawer-versions.test.ts`

**Interfaces:**
- Produces:
  - `DrawerRaiz` (gaveta) ganha `recuar: (aberta: boolean) => void` e `registrarConteudo: (no: HTMLDivElement | null) => void`
  - `function transformDoRecuo(aberta: boolean, largura: number): string`, exportada do `drawer.tsx`; devolve `scale(${(largura - 16) / largura}) translate3d(0, -16px, 0)` aberta, e `translate3d(0, 0, 0)` fechada.

- [ ] **Step 1: Testes que falham** em `drawer-versions.test.ts`, num `describe("a gaveta de trás recua quando outra abre por cima")`:
  - `transformDoRecuo(true, 400)` é `"scale(0.96) translate3d(0, -16px, 0)"`, e `transformDoRecuo(false, 400)` é `"translate3d(0, 0, 0)"`;
  - a fonte do `drawer.tsx` (`semComentarios`) contém `pai.recuar(`, `registrarConteudo` e `cubic-bezier(0.32, 0.72, 0, 1)`;
  - a fonte contém `--drawer-recuo` e, na gaveta aninhada, a altura descontada dele.
- [ ] **Step 2: Rodar** `npx vitest run src/components/ui/drawer-versions.test.ts`. Esperado: FALHA.
- [ ] **Step 3: Implementar** como na Architecture:
  - o efeito do `Drawer` aninhado depende só de `open` e `pai`;
  - o `DrawerContent` publica `data-aninhada` quando a raiz dele é aninhada, e é por esse atributo que a altura desconta `--drawer-recuo`;
  - com movimento reduzido (`matchMedia("(prefers-reduced-motion: reduce)")`), a transição é `none`;
  - por fim, a documentação.
- [ ] **Step 4: Rodar** `npx vitest run src/components src/app/designsystem`, `npx tsc --noEmit`, `npx eslint src/components/ui/drawer.tsx` e `npm run ds:audit -- src/components/ui/drawer.tsx`. Esperado: PASSA.
- [ ] **Step 5: Commit** com `feat(drawer): a gaveta de trás encolhe e sobe quando outra abre por cima, como no iOS`.
