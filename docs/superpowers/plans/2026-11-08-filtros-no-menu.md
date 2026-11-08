# Filtros que não cabem vão para um menu — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a `FilterBar` troca a faixa que rola por `overflow="menu"`: os tokens que não cabem saem para um botão "+N" com dropdown; a Transações usa e empilha em `@max-3xl`.

**Architecture:** medir os tokens e decidir quem sai com `quemSai` (`lib/overflow`), como o `Toolbar` faz; o menu é o `OverflowMenu` (`lib/overflow-menu`) com rótulo visível opcional; escolher uma linha abre o editor do filtro ancorado no "+N".

**Tech Stack:** Next 16, React 19, TypeScript, Tailwind v4, motion, Radix DropdownMenu, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-08-filtros-no-menu-design.md`

## Global Constraints

- Leia o `AGENTS.md` da raiz (FilterBar, DropdownMenu, Toolbar, invariantes, Touch devices) antes de escrever.
- `src/components/ui/filter-bar.tsx` pode mudar (pedido do dono); página do catálogo (`src/app/designsystem/docs/filter-bar.tsx`), `filter-bar-versions.test.ts` e o bullet da `FilterBar` no `AGENTS.md` mudam na mesma mudança.
- `overflow="wrap"` (padrão) não muda em nada.
- Tokens; sem px literal; uma árvore só; Heroicons pela régua do tamanho.
- Não rode prettier. Só `npx vitest run <arquivos>`, `npx tsc --noEmit`, `npx eslint <arquivos>`, `npm run ds:audit -- <arquivos>`.
- Banco de dev é produção: no navegador, só olhar (filtros são só estado de URL; nunca salvar lançamento).
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sem push. Não toque em `CLAUDE.md` nem `graphify-out/`.
- Exploração: com `graphify-out/graph.json`, rode `graphify query "<pergunta>"` antes do primeiro grep/leitura.

## Review Focus

1. Adicionar um filtro com a linha cheia: o token novo fica visível enquanto o editor está aberto; ao fechar, se não couber, entra no "+N" e N aumenta. → Task 1.
2. Remover pelo editor aberto a partir do menu: o "+N" diminui ou some, sem o editor ficar órfão. → Task 1.
3. Redimensionar a janela: tokens entram e saem do menu sem pular de linha nem oscilar (sem laço de medição). → Task 1 (navegador).
4. Teclado: setas percorrem tokens visíveis, "+N", "+ Filtro", "Limpar"; nenhum token escondido recebe foco. → Task 1.
5. 375px e ~1000px com 5 filtros: uma linha de filtros, contagem na ponta. → Task 2 (navegador).

---

### Task 1: `FilterBar overflow="menu"`

**Files:**
- Modify: `src/components/ui/filter-bar.tsx` (prop `overflow` ~L525-570; faixa ~L1000-1070; ações; contagem)
- Modify: `src/lib/overflow-menu.tsx` (rótulo visível opcional no gatilho)
- Modify: `src/components/ui/filter-bar-versions.test.ts`
- Modify: `src/app/designsystem/docs/filter-bar.tsx`
- Modify: `AGENTS.md` (só o bullet **`FilterBar`**)

**Interfaces:**
- Produces: `overflow?: "wrap" | "menu"` na `FilterBar` (o valor `"scroll"` deixa de existir; a raiz tem `data-overflow="menu"`). `OverflowMenu` ganha `trigger?: React.ReactNode` (conteúdo visível do gatilho; sem ele, o ⋯ de hoje) e `triggerClassName?: string`.

- [ ] **Step 1: Testes**:
  - fonte: `overflow` aceita `"wrap" | "menu"`; não há mais `"scroll"`, `scrollTo` da faixa nem `overflow-x-auto` na forma nova.
  - fonte: a forma `"menu"` importa `quemSai` de `@/lib/overflow` e `OverflowMenu` de `@/lib/overflow-menu`, mede com `ResizeObserver`, e os tokens que saem recebem o atributo `hidden`.
  - função pura exportada para teste: `export function tokensQueSaem(larguras: number[], cabe: number, opts: { fixo?: number; reserva: number; gap: number }): number[]` — delega a `quemSai(…, { ponta: "fim", fixos })`. Casos: `[100,100,100]`, cabe 250, reserva 40, gap 6 → `[1, 2]`; com `fixo: 2` → `[0, 1]` (o fixo nunca sai; saem do fim, pulando o fixo); tudo cabe → `[]`.
  - render com `overflow: "menu"` e 3 filtros: `data-overflow="menu"`; a linha tem `flex-nowrap` e `overflow-hidden` (nada rola); o "+ Filtro" e a contagem continuam fora da fileira dos tokens.
  - `OverflowMenu` com `trigger="+2"`: o gatilho mostra "+2", mantém `aria-label` e `data-overflow-more`; sem `trigger`, continua o ⋯ (regressão para `Tabs`/`Toolbar`).
  - o rótulo das linhas do menu é o do token (`Categoria é Mercado`), e o nome acessível do gatilho é "Mais N filtros" (singular "Mais 1 filtro").
  - as regras da barra estreita do `"scroll"` (contagem só com número, "Limpar" em ×) valem para `"menu"`.
- [ ] **Step 2:** rode `npx vitest run src/components/ui/filter-bar-versions.test.ts` → FAIL.
- [ ] **Step 3:** implemente: troque a forma faixa pela forma menu; meça as larguras dos tokens visíveis + guardadas (os escondidos guardam a última largura medida, como o `Toolbar`), `cabe` = largura da fileira; o fixo = o token com o editor aberto (`aberto?.tipo === "valor"`); o "+N" vai logo depois do último token visível; escolher uma linha chama o mesmo `abrirValor` do token, ancorado no "+N" (o popover já ancora por ref/`virtualRef`). Sem laço: só remeça em mudança de tamanho ou de lista.
- [ ] **Step 4:** catálogo: o eixo "faixa" vira "menu", com 6 filtros numa largura estreita; nota de quando usar. `AGENTS.md`: a frase da faixa vira a do menu (quem sai, o "+N", editar pelo menu).
- [ ] **Step 5:** testes de `src/components/ui`, `src/app/designsystem` e `src/lib` passam; `tsc`, `eslint`, `ds:audit -- src/components/ui/filter-bar.tsx` limpos. Olhe `/designsystem/filter-bar` no navegador (só olhar).
- [ ] **Step 6:** commit `feat(filter-bar): filtros que não cabem vão para o menu +N`.

### Task 2: Transações com o menu

**Files:**
- Modify: `src/components/transactions/transacoes-toolbar.tsx`
- Modify: `src/components/transactions/transacoes-toolbar.test.ts`

**Interfaces:**
- Consumes: `FilterBar overflow="menu"` (Task 1).

- [ ] **Step 1: Testes**: a `FilterBar` recebe `overflow="menu"`; o corte para duas linhas usa `@max-3xl/transacoes` (não `@max-2xl`); o comentário diz por quê (abaixo de 48rem a barra fica <28rem ao lado das abas).
- [ ] **Step 2:** rode → FAIL.
- [ ] **Step 3:** implemente as duas trocas.
- [ ] **Step 4:** navegador (só olhar; filtros por URL, ex. `?f=conferir%3Ais`, ou pelo "+ Filtro" sem salvar nada) a 1400, ~1000, ~800 e 375px com 0, 2 e 6 filtros: uma linha de filtros, "+N" com a contagem certa, menu lista os escondidos, escolher abre o editor, contagem na ponta. Volte o viewport para desktop.
- [ ] **Step 5:** testes de `src/components/transactions` e `src/components/ui` passam; `tsc`, `eslint` limpos.
- [ ] **Step 6:** commit `fix(transacoes): filtros que não cabem no menu, linha empilha a 48rem`.
