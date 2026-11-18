# O filtro brota e a lista se refaz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Quando um link aplica um filtro em Transações (o "Ver os 19" do detalhe do lançamento, que fecha a gaveta e abre `/transactions?f=…`), a etiqueta do filtro brota onde ele aparece, e as linhas da lista esmaecem e voltam em cascata, de cima para baixo, já filtradas.

**Architecture:**
- **O caminho de hoje:** o link do `bloco-categoria.tsx` (`hrefDaLista`) passa pelo `useLinkQueFecha` do diálogo. A gaveta fecha, e a tela troca a URL. A lista e o filtro então mudam de uma vez.
- **O que muda, em duas peças:**
  1. **A etiqueta do filtro** que nasce depois da montagem (o filtro novo) entra com o gesto de brotar dos menus do app (`menu-morph`, ou o `field-bloom`/`popover-sprout` que já existem). A etiqueta que já estava lá ao montar não anima.
  2. **As linhas da lista** que chegam depois de uma troca de filtro (a lista do telefone, `GemeoDoTelefone`, e a tabela do computador) entram em cascata com a escada de atrasos do sistema (`@utility stagger-ladder`, `--stagger-base`/`--stagger-step`/`--stagger-cap`) e a subida de 4px (`@keyframes rise`). Só numa troca de filtro: carregar a primeira vez, rolar, paginar e o refetch em segundo plano não animam.

**Tech Stack:** React 19, Tailwind v4, vitest.

**Spec:** pedido do dono (18/11/2026), "melhore a animação de quando eu clico em ver os N…, que vai criar um filtro e voltar para a tela com esse filtro". Escolha dele: "Filtro brota, lista se refaz".

## Global Constraints

- **Movimento orgânico do app** (a memória "animação orgânica por padrão"): o brotar usa o `menu-morph` ou uma utility que já brota a partir dele, e nunca um fade ou escala simples inventados. A cascata usa a `stagger-ladder` e o `rise` que já existem.
- **Gatilho:** só quando a lista de filtros muda depois da montagem. A primeira renderização, a navegação por páginas, a ordenação e o refetch não animam.
- **Com movimento reduzido**, nada anima.
- **Sem keyframe novo:** use o que já existe. Se faltar uma utility, ela vai em `globals.css` depois de `no-scrollbar` (a regra do `glass.test.ts`).
- **Componentes:** se a mudança tocar `src/components/ui/` (`filter-bar.tsx`, `data-table.tsx`), isso vem desse pedido. Na mesma mudança: o bullet no `AGENTS.md` e a "Rodada 407 — o filtro brota e a lista se refaz" em `docs/design/HISTORICO-DESIGN-SYSTEM.md`.
- Sem prettier. Comentários em português. Nunca `git add graphify-out/graph.json` nem `CLAUDE.md`. Sem push. O commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Depois, `graphify update .`.
- Sem navegador no subagente: o banco é de produção. O controlador confere a tela.

## Review Focus

- **Trocar o filtro pela própria barra** (tirar ou pôr um filtro à mão): a lista também se refaz em cascata, porque é a mesma troca. Só a primeira carga fica parada.
- **Lista longa:** a cascata para no teto (`--stagger-cap`), e as linhas de baixo entram juntas.
- **Filtro que não muda o resultado:** a cascata acontece, e é aceitável.

---

### Task 1: O filtro novo brota e as linhas entram em cascata

**Files:**
- Investigar e modificar onde a etiqueta do filtro de Transações é desenhada: o `FilterBar` (`src/components/ui/filter-bar.tsx`) e, no telefone, o filtro do cabeçalho (`usePageChromeFilter`, `config/mobile-navigation.ts`).
- Modificar a lista: `src/components/ui/data-table.tsx` (`GemeoDoTelefone` e as linhas da tabela) ou o `src/components/transactions/transacoes-tabela.tsx`, o que for menor e reaproveitável.
- Testes de fonte ao lado (`filter-bar-versions.test.ts`, `data-table-agrupada.test.ts` ou um novo).

**Interfaces:**
- Produces: a decisão de "trocou o filtro" mora numa chave estável, que o implementador escolhe (por exemplo, `serializeFilters(filtros)`). A lista compara essa chave com a anterior para ligar a cascata uma vez, por exemplo com um `data-refaz` posto por um ciclo e tirado no `animationend` da última linha. Escreva o porquê num comentário.

- [ ] **Step 1: Testes que falham** (de fonte):
  - a etiqueta que nasce depois da montagem veste a utility de brotar, e a que nasce na montagem não;
  - as linhas da lista vestem `stagger-ladder` e `rise` só quando a chave do filtro muda;
  - existe o caminho de movimento reduzido.
- [ ] **Step 2: Rodar** os testes. Esperado: FALHA.
- [ ] **Step 3: Implementar** como na Architecture e nas Global Constraints.
- [ ] **Step 4: Rodar** `npx vitest run src/components src/app/designsystem`, `npx tsc --noEmit`, `npx eslint` nos arquivos tocados e `npm run ds:audit` neles. Esperado: PASSA.
- [ ] **Step 5: Commit** com `feat(transacoes): o filtro aplicado por link brota, e a lista se refaz em cascata`.
