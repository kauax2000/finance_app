# Rodapé translúcido Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O corpo de uma gaveta ou de um diálogo de altura fixa rola por trás do rodapé, como já rola por trás do cabeçalho translúcido. O rodapé fica com a mesma placa e o mesmo degradê, só que virados para cima.

**Architecture:** O espelho do cabeçalho em três peças.
- **A medida.** Em `src/components/ui/dialog.tsx`, o `DialogFooter` ganha `translucent` (padrão `true`). Com ele ligado, mede a própria altura e a publica no pai como `--dialog-footer-h`, como `useAlturaDoCabecalho` faz com `--dialog-header-h`. Generalize o hook, por exemplo `useAlturaPublicada(nome, ligado)`; não duplique.
- **A pintura.** Em `src/app/globals.css`, uma `@utility dialog-footer-translucent` espelha a `dialog-header-translucent`:
  - mesma condição (`[data-layout="fixed"]`, rodapé logo depois do `DialogBody`: irmão, ou os dois dentro do mesmo `form`);
  - o `::before` é a placa (`--dialog-footer-tint`, o fundo a 95%, e `var(--background)` com `prefers-reduced-transparency`);
  - o `::after` é o degradê de 56px (`--dialog-footer-fade-h: calc(var(--spacing) * 14)`), com as mesmas paradas do cabeçalho invertidas: sobe de `bottom: 100%`, cheio embaixo e transparente em cima;
  - o corpo que o precede ganha `margin-bottom: calc(var(--dialog-footer-h, 0px) * -1)`, `padding-bottom: calc(var(--dialog-footer-h, 0px) + var(--dialog-body-pb, calc(var(--spacing) * 4)))`, `scroll-padding-block-end` e `--scroll-fade-bottom-max: 0px`;
  - o rodapé leva `position: relative; z-index: 10`.
- **O degradê com a rolagem.** O degradê aparece enquanto há conteúdo por baixo e some nos últimos 24px da rolagem. É o inverso do cabeçalho, que acende nos primeiros 24px. Use a mesma linha do tempo `--dialog-body-scroll` dentro de `@supports (animation-timeline: scroll())`. Sem suporte, o degradê fica sempre à vista.
- O `DialogFooter` em layout `auto`, ou sem corpo antes dele, não muda.

**Tech Stack:** React, Tailwind v4 (`@utility`), CSS scroll-driven animations, vitest (testes de fonte com `lerFonte`/`semComentarios`/`blocoCss` de `@/test/fonte`).

**Spec:** aprovado pelo dono em 17/11/2026:
- o rodapé translúcido, espelho do cabeçalho, com a mesma placa a 95% sem desfoque e o mesmo degradê de 56px, subindo;
- ligado por padrão, com `translucent={false}` de saída;
- nas mesmas superfícies do cabeçalho;
- a regra vai para o `AGENTS.md`: o que fica preso na borda de uma área que rola (cabeçalho, rodapé) deixa o conteúdo passar por trás, com a placa a 95% e o degradê de 56px, sem desfoque. O vidro com desfoque foi recusado.

## Global Constraints

- `src/components/ui/` e `src/app/globals.css` estão autorizados pelo dono (17/11/2026).
- `@utility` nova mora depois de `no-scrollbar`. A `dialog-header-translucent` já mora lá: ponha a nova logo depois dela. `glass.test.ts` reprova `@utility` na faixa de `glass-control` até `no-scrollbar`.
- Nada de `backdrop-filter`. Os tokens têm par escuro (o `--background` já tem).
- Na mesma mudança:
  - o bullet do `Dialog` em `AGENTS.md` (o que fala do `DialogHeader` translúcido) ganha o rodapé, e a regra geral entra em "Tokens e theme" ou perto do bullet do cabeçalho translúcido;
  - a página `src/app/designsystem/docs/dialog.tsx` ganha uma frase;
  - `docs/design/HISTORICO-DESIGN-SYSTEM.md` ganha a "Rodada 382 — o rodapé translúcido";
  - um teste novo em `src/components/ui/dialog-footer-translucent.test.ts`, no molde de `dialog-header-translucent.test.ts`.
- Sem prettier. Comentários em português. Nunca `git add graphify-out/graph.json` nem `CLAUDE.md`. Sem push. O commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Depois, `graphify update .`.
- Sem navegador no subagente: o banco é de produção. O controlador confere a tela.

## Review Focus

- **Última linha alcançável:** com a lista rolada até o fim, a última linha fica inteira acima da placa do rodapé, porque o recuo de baixo soma a altura medida.
- **O rodapé que muda de altura** (no Importar, o Total sobe acima do botão; um erro aparece; o Voltar some no telefone): a medida acompanha pelo `ResizeObserver`, e o corpo não pula.
- **Teclado do iOS na gaveta** (`rolarSobOTeclado`): o foco que rola o campo para cima do teclado continua valendo. O `scroll-padding-block-end` conta o rodapé.
- **Gaveta com o rodapé dentro de um `form`** (o Importar: o `form` embrulha o `DialogBody` e o `DialogFooter`): a regra casa os dois irmãos dentro do `form`.
- **Diálogo `layout="auto"`** (o desktop comum): nada muda, porque a regra exige `[data-layout="fixed"]`.

---

### Task 1: O DialogFooter translúcido

**Files:**
- Modify: `src/components/ui/dialog.tsx`: o hook de medida, o `DialogFooter` (~linha 843) e o `DialogHeader`, que passa a usar o hook generalizado
- Modify: `src/app/globals.css`: a `@utility dialog-footer-translucent`, logo depois da do cabeçalho
- Modify: `AGENTS.md`, `src/app/designsystem/docs/dialog.tsx`, `docs/design/HISTORICO-DESIGN-SYSTEM.md`
- Create: `src/components/ui/dialog-footer-translucent.test.ts`

- [x] **Step 1: Teste de fonte que falha** (`dialog-footer-translucent.test.ts`):
  - o `dialog.tsx` declara `translucent = true` no `DialogFooter`, publica `--dialog-footer-h` e aplica `translucent && "dialog-footer-translucent"`;
  - o bloco `@utility dialog-footer-translucent` do `globals.css` contém `--dialog-footer-tint: color-mix(in oklab, var(--background) 95%, transparent)`, `--dialog-footer-fade-h: calc(var(--spacing) * 14)`, `margin-bottom: calc(var(--dialog-footer-h, 0px) * -1)`, `--scroll-fade-bottom-max: 0px` e `bottom: 100%`;
  - o bloco não contém `backdrop-filter`;
  - o `@utility dialog-footer-translucent` vem depois do `@utility dialog-header-translucent`.
- [x] **Step 2: Rodar** `npx vitest run src/components/ui/dialog-footer-translucent.test.ts`. Esperado: FALHA.
- [x] **Step 3: Implementar** como na Architecture, e depois a documentação.
- [x] **Step 4: Rodar** `npx vitest run src/components src/app/designsystem`, `npx tsc --noEmit`, `npx eslint src/components/ui/dialog.tsx` e `npm run ds:audit -- src/components/ui/dialog.tsx`. Esperado: PASSA.
- [x] **Step 5: Commit** com `feat(dialog): o corpo rola por trás do rodapé, como por trás do cabeçalho`.
