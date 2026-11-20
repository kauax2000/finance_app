# Categoria clicável — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** os cartões de despesa e de receita mostram que abrem o detalhe. No desktop é um chevron que aparece com o cursor, mais o hover reforçado. No telefone, a faísca fica mais alta, com o botão fantasma "Ver lançamentos ›" por cima.

**Architecture:** a mudança fica só em `src/components/categories/expense-category-card.tsx` e `income-category-card.tsx`, incluindo o `CategoryCardSkeleton`. Nada em `src/components/ui/`.

**Tech Stack:** React 19, Tailwind v4, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-20-categoria-clicavel-design.md`

## Global Constraints

- **Chevron do desktop:** `ChevronRightIcon` de `@heroicons/react/16/solid`, `aria-hidden`, logo depois do nome, dentro da linha do título.
  - Classes: `text-muted-foreground opacity-0 transition-[opacity,translate,color] duration-(--duration-fast)`.
  - Com o cursor no cartão (`group-hover:`) e com o foco do teclado (`group-focus-within:`): `opacity-100 translate-x-0.5 text-foreground`.
  - `max-md:hidden`.
  - O `Card` já tem a classe `group`.
- **Hover reforçado (desktop):** no `Card`, mais um passo de fundo (`hover:bg-muted/40` ou equivalente em token) e a borda mais forte (`hover:border-foreground/20`), além da `shadow-md` que o `CardLink` já dá. Cada `hover:` leva o par `active:` (regra H do auditor).
- **Faísca no telefone:** `max-md:h-26 md:h-16`, mantendo `bleed`, `-mx-(--card-px) -mb-(--card-py) mt-auto w-auto`. O osso da faísca no esqueleto acompanha a mesma altura.
- **Botão fantasma do telefone:** fica dentro de um invólucro `relative` em volta da faísca, como um `<span aria-hidden>`. Ele **não** é um `<button>` nem um `<a>`, porque o cartão já é o link.
  - Classes: `pointer-events-none absolute inset-x-(--card-px) bottom-2.5 flex h-11 items-center justify-center gap-1.5 rounded-full text-sm font-medium text-foreground md:hidden`.
  - Com o cartão tocado (`group-active:bg-foreground/12`), mais `transition-colors`.
  - Texto: "Ver lançamentos". Depois dele, `ChevronRightIcon` 16/solid em `text-muted-foreground`.
- **O botão não pode bloquear o toque longo nem o link:** `pointer-events-none` deixa o toque passar ao `CardLink` esticado.
- **Nada sai:** valor, variação, previsto, barra, frase, faísca com média, ⋯, menu de contexto e `CardLink`.
- **Commits:** só os seus arquivos, com `git commit <caminhos>`. Outras sessões têm arquivos não commitados nesta árvore. Sem push, sem stash e sem reset. A mensagem termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **No telefone,** tocar no botão abre o detalhe da categoria, porque o toque passa ao link.
2. **Toque longo no telefone:** o menu de contexto continua abrindo.
3. **No desktop,** o ⋯ e o chevron não se atropelam na linha do título.
4. **Tab até o cartão:** o chevron aparece com o foco.
5. **Tema claro e escuro:** o fundo do toque fica legível sobre a faísca nos dois.

---

### Task 1: chevron, hover reforçado, faísca mais alta e botão fantasma

**Files:**
- Modify: `src/components/categories/expense-category-card.tsx`
- Modify: `src/components/categories/income-category-card.tsx`
- Test: `src/components/categories/expense-category-card.test.ts` e `income-category-card.test.ts`

- [ ] **Step 1: testes de fonte**, nos dois cartões:
  - contém `ChevronRightIcon`, `opacity-0`, `group-hover:opacity-100` e `max-md:hidden`;
  - contém "Ver lançamentos", `pointer-events-none`, `group-active:bg-foreground/12`, `md:hidden` e `h-11`;
  - a faísca tem `max-md:h-26` e `md:h-16`;
  - o osso, no expense, tem `max-md:h-26`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** implementar segundo as Global Constraints.
- [ ] **Step 4:** PASS. Rodar `npx vitest run src/components/categories`, `npx tsc --noEmit`, `npm run lint` e `npm run ds:audit -- src/components/categories`. Corrija o que o auditor acusar sem quebrar a regra.
- [ ] **Step 5:** `graphify update .` e commit `feat(categorias): o cartão mostra que abre, com o chevron no hover e o botão sobre a faísca no telefone`.
