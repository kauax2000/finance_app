# Altura num movimento só — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** quando algo abre dentro de uma caixa que anima a altura (o `Dialog` com `useAlturaAnimada`), o movimento é um só: a caixa acompanha o filho, sem uma segunda mola depois.

**Architecture:** o `useAlturaAnimada` já pula a própria animação quando um filho marca `data-altura-em-voo`, mas só `impacto-da-parcela.tsx` marca. O `Collapsible` e o `Accordion` animam a altura por keyframes (`collapsible-down/up`, `accordion-down/up`), e o diálogo, sem saber, abre a mola dele por cima — o recibo da importação abre em duas etapas. O hook passa a reconhecer esses filhos sozinho: no `ResizeObserver`, pergunta ao navegador `el.getAnimations({ subtree: true })` se há uma `CSSAnimation` de altura (`animaAAltura(animationName)`) rodando num filho; havendo, a caixa não anima e só segue a altura do conteúdo, que o filho já leva junto. Sem contador de eventos, nada trava.

**Tech Stack:** React 19, TypeScript, Vitest.

**Spec:** pedido do dono (09/11/2026): "Tudo tem que ser um movimento conjunto em todos os lugares que isso acontecer." Caso reproduzido: o resumo recolhido (`Collapsible`) do Importar extrato, dentro do `Dialog`.

## Global Constraints

- `src/hooks/` não é `src/components/ui/`: pode mudar sem autorização; `dialog.tsx` não muda.
- Movimento reduzido continua trocando na hora.
- O `data-altura-em-voo` manual continua valendo (o `impacto-da-parcela` usa).
- Não rode prettier. Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sem push. Não toque em `CLAUDE.md` nem `graphify-out/`.
- Verificação: `npx vitest run src/hooks src/components/ui/dialog-versions.test.ts`, `npx tsc --noEmit`, `npx eslint src/hooks`.

## Review Focus

1. Animação de outro nome num filho (`rise`, `menu-content-in`): não conta como altura.
2. A própria caixa animando (o `zoom-in` de abrir o diálogo): só conta animação de filho (`a.effect.target !== el`).
3. Animação de altura já terminada (`playState` `finished`) ou pausada: não conta; só `running`.
4. Navegador sem `getAnimations` (jsdom): o hook cai no comportamento de hoje, sem quebrar.
5. O `data-altura-em-voo` manual continua valendo junto.

---

### Task 1: O hook reconhece filhos que animam a altura

**Files:**
- Modify: `src/hooks/use-altura-animada.ts`
- Test: `src/hooks/use-altura-animada.test.ts` (novo)

**Interfaces — Produces:**
```ts
/** Os keyframes que animam a altura de um filho (Collapsible, Accordion). */
export function animaAAltura(animationName: string): boolean
```

- [ ] **Step 1: teste que falha** — `animaAAltura`: `true` para `"collapsible-down"`, `"collapsible-up"`, `"accordion-down"`, `"accordion-up"`; `false` para `"rise"`, `"menu-content-in"`, `"zoom-in"`, `""`. E um teste de fonte (`lerFonte`/`semComentarios` de `src/test/fonte.ts`): o `ResizeObserver` do hook chama `getAnimations?.({ subtree: true })`, filtra `CSSAnimation` com `animaAAltura`, `playState === "running"` e alvo diferente de `el`, e retorna sem animar quando acha (depois de atualizar `ultima`, como o `[data-altura-em-voo]`).
- [ ] **Step 2:** `npx vitest run src/hooks/use-altura-animada.test.ts` → FAIL (`animaAAltura` não existe).
- [ ] **Step 3:** implementar `animaAAltura` (regex `^(accordion|collapsible)-(down|up)$`) e a função local `filhoEmVoo(el)` usada no `ResizeObserver`, ao lado do `[data-altura-em-voo]`. Comentário de uma linha com o porquê (duas molas da mesma altura saíam em duas etapas).
- [ ] **Step 4:** testes passam; `npx tsc --noEmit`; `npx eslint src/hooks`; `npx vitest run src/components/ui/dialog-versions.test.ts src/components/ui/drawer-versions.test.ts src/components/transactions/lancamento-inteligente.test.ts`.
- [ ] **Step 5:** commit `fix(dialog): a altura acompanha o Collapsible e o Accordion de dentro, num movimento só`.

### Task 2: Conferir no navegador (controlador)

- [ ] `http://localhost:3000/transactions`, Importar extrato com `teste-importacao-grande.csv` (só ler; **nunca clicar Importar** — o banco é produção): abrir e fechar o "Saldo" e conferir, por amostragem da altura do diálogo a cada quadro (`requestAnimationFrame`), que a altura cresce de forma contínua até o fim, sem patamar no meio.
