# Linha de filtros numa linha só — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a linha sobre a tabela de Transações fica fixa: abas à esquerda, filtros numa faixa que rola de lado, "+ Filtro"/"Limpar" e contagem fixos à direita; na largura estreita, duas linhas fixas.

**Architecture:** a `FilterBar` ganha `overflow="scroll"` (faixa de uma linha com dissolução de borda, ações e contagem fora da faixa, sem empilhar); a `TransacoesToolbar` passa a uma linha sem `flex-wrap`, com uma container query da própria linha que vira duas linhas abaixo de 40rem.

**Tech Stack:** Next 16, React 19, TypeScript, Tailwind v4 (container queries), motion, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-08-linha-de-filtros-design.md`

## Global Constraints

- Leia o `AGENTS.md` da raiz (FilterBar, Toolbar, "A dissolução", "Touch devices and hover", invariantes) antes de escrever.
- `src/components/ui/filter-bar.tsx` pode mudar (autorizado pelo dono ao escolher a opção B); componente alterado atualiza a página do catálogo (`src/app/designsystem/docs/filter-bar.tsx`) e o `filter-bar-versions.test.ts` na mesma mudança.
- Tokens e utilitários do sistema; nada de px literal (`w-[…px]`); nenhuma árvore duplicada (`md:hidden`/`hidden md:flex`, `isMobile` trocando componente).
- O comportamento da `FilterBar` com `overflow="wrap"` (padrão) não muda.
- Nada muda de caminho (não é mudança de jornada).
- Não rode prettier. Só `npx vitest run <arquivos>`, `npx tsc --noEmit`, `npx eslint <arquivos>`, `npm run ds:audit -- <arquivos>`.
- O banco de dev é produção: no navegador, só olhar; nunca salvar.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sem push. Não toque em `CLAUDE.md` nem `graphify-out/`.
- Exploração: com `graphify-out/graph.json`, rode `graphify query "<pergunta>"` antes do primeiro grep/leitura.

## Review Focus

1. Adicionar um filtro com a faixa cheia: o token novo aparece (a faixa rola até ele). → Task 1.
2. Largura estreita (40rem da linha): duas linhas, contagem na ponta da linha 2, nada em terceira linha. → Task 2.
3. Foco por teclado num token cortado: ele entra em vista e o anel de foco não some na dissolução. → Task 1 (verificação no navegador).
4. "Limpar" aparecendo/saindo (2+ filtros) não empurra a contagem para outra linha. → Task 1.
5. O popover de edição continua ancorado no token certo com a faixa rolada. → Task 1 (navegador).

---

### Task 1: `FilterBar overflow="scroll"`

**Files:**
- Modify: `src/components/ui/filter-bar.tsx` (props ~L515-560; linha ~L905-1050: `filter-bar-row`, grupo de ações ~L994, contagem ~L1036; `LINHA_TELEFONE` ~L412)
- Modify: `src/components/ui/filter-bar-versions.test.ts`
- Modify: `src/app/designsystem/docs/filter-bar.tsx`

**Interfaces:**
- Produces: prop `overflow?: "wrap" | "scroll"` (padrão `"wrap"`) em `FilterBar`; com `"scroll"` a raiz tem `data-overflow="scroll"`.

- [ ] **Step 1: Testes** (`describe("overflow scroll")`):
  - render com `overflow: "scroll"` e 3 filtros em `defaultValue`: o HTML tem `data-overflow="scroll"`; o `filter-bar-add` **não** está dentro do elemento `data-slot="filter-bar-row"` (o grupo de ações é irmão da faixa); a contagem (`data-slot="filter-bar-count"`) é irmã também.
  - fonte: com `"scroll"`, a faixa usa `flex-nowrap`, `overflow-x-auto` e `scrollFadeViewportXClassName` sem prefixo de container (vale em qualquer largura).
  - fonte: a regra `@max-md/filter-bar:flex-col` não se aplica quando `overflow === "scroll"` (a linha externa só empilha na forma `"wrap"`).
  - render sem `overflow`: igual a hoje — `filter-bar-add` continua dentro de `filter-bar-row` (regressão).
  - fonte: existe o efeito que rola a faixa até o fim quando o número de tokens cresce (procure `scrollTo`/`scrollIntoView` ligado à contagem de tokens).
- [ ] **Step 2:** `npx vitest run src/components/ui/filter-bar-versions.test.ts` → FAIL.
- [ ] **Step 3:** implemente:
  - com `"scroll"`, a fileira dos tokens (com E/OU no começo) vira a faixa: uma linha, rolagem X sem barra (`no-scrollbar`), dissolução X com `useScrollFade` (já instanciado como `dissolver`); a faixa tem `flex-1 min-w-0`.
  - o grupo "+ Filtro"/"Limpar" sai da faixa e vira irmão dela, `shrink-0`; a contagem continua irmã, `shrink-0`, `ms-auto` não é mais necessário (a faixa ocupa a sobra).
  - a linha externa não empilha: `@max-md/filter-bar:flex-col` só na forma `"wrap"`.
  - ao crescer o número de tokens completos, a faixa rola até o fim (`scrollTo({ left: scrollWidth, behavior })` com `behavior: "smooth"` exceto sob movimento reduzido — use o padrão do sistema para perguntar `matchMedia`).
  - os tokens na faixa não truncam (já é a regra da faixa no telefone; reuse `TOKEN_TELEFONE.scroll` sem o prefixo de container).
  - as animações de entrada/saída (`motion`, `layout`) continuam; `layoutScroll` já está na faixa.
- [ ] **Step 4:** catálogo: o exemplo da `FilterBar` ganha o eixo/interruptor "faixa" (`overflow="scroll"`) com 5 filtros, numa largura estreita para a rolagem aparecer; nota curta dizendo quando usar (linha com vizinhos fixos, altura que não pode mudar).
- [ ] **Step 5:** testes de `src/components/ui` e `src/app/designsystem` passam; `tsc`, `eslint`, `ds:audit -- src/components/ui/filter-bar.tsx` limpos.
- [ ] **Step 6:** commit `feat(filter-bar): forma em faixa, com ações e contagem fixas fora dela`.

### Task 2: A linha de Transações

**Files:**
- Modify: `src/components/transactions/transacoes-toolbar.tsx` (o `return` ~L53-84)
- Modify: `src/components/transactions/transacoes-toolbar.test.ts`

**Interfaces:**
- Consumes: `FilterBar overflow="scroll"` (Task 1).

- [ ] **Step 1: Testes** (fonte, `TOOLBAR` já existe no arquivo):
  - a `FilterBar` recebe `overflow="scroll"` e não recebe mais `mobile=`.
  - a raiz da linha é um container nomeado (`@container/…`) e **não** tem `flex-wrap`; a quebra para duas linhas usa a variante de container (`@max-…/…:`), não `max-md:`/`md:` de janela.
  - continua "uma árvore só" (o teste existente) e o ⋯ continua só na forma estreita.
- [ ] **Step 2:** `npx vitest run src/components/transactions/transacoes-toolbar.test.ts` → FAIL.
- [ ] **Step 3:** implemente:
  - largura com sobra: uma linha `flex items-center gap-2` — abas `shrink-0` (largura delas), a `FilterBar` `flex-1 min-w-0`.
  - abaixo de 40rem da própria linha (`@max-2xl/<nome>`; confira na escala do Tailwind v4 que `2xl` de container é 42rem e escolha o degrau de container mais próximo de 40rem — `@max-xl` é 36rem, `@max-2xl` é 42rem; use `@max-2xl` e registre a escolha num comentário de uma linha): duas linhas — 1) abas esticadas + ⋯; 2) a `FilterBar` em largura total. Grade (`grid`) ou `flex-wrap` controlado por `basis-full` só na variante de container; nada de `order` para reordenar o que o leitor de tela lê.
  - o ⋯ (Importar/Exportar) aparece só na forma estreita, pela mesma variante de container (hoje é `max-md:flex`).
  - o comentário do topo do `return` passa a descrever a forma nova.
- [ ] **Step 4:** navegador (só olhar): `http://localhost:3000/transactions` a 1280px, ~900px e 375px, com 0 e com 4+ filtros (adicione filtros pelo "+ Filtro" sem salvar nada; filtros são só estado de URL). Confira: nada troca de lugar, a contagem fica na linha, a faixa rola, o token novo aparece, o popover abre no token. Registre o que viu.
- [ ] **Step 5:** testes de `src/components/transactions` e `src/components/ui` passam; `tsc`, `eslint` limpos.
- [ ] **Step 6:** commit `fix(transacoes): linha de filtros fixa, sem quebrar`.
