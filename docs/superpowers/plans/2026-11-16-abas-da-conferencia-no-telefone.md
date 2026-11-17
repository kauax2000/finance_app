# Abas da conferência no telefone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No telefone, as abas da conferência do Importar cabem em 375px e ficam fixas no topo: três abas (Todos, Saídas, Entradas) e as pendências (Já existem, Sem categoria, Sugeridas) como pílulas de aviso abaixo, que filtram ao tocar. As duas fileiras moram no cabeçalho da gaveta, que não rola.

**Architecture:** `conferir-importacao.tsx` (C) e `importar-extrato-dialog.tsx` (D).
- **Fixo no topo (pedido do dono, 16/11):** no telefone, as abas, as pílulas e a linha da busca que o "Buscar" do ⋯ abre saem do corpo e vão para o `DialogHeader` de D, depois do `DialogSteps`, só quando `comMenu` (telefone + passo Conferir).
- O cabeçalho já é fixo e translúcido, e o corpo rola por trás dele, porque `--dialog-header-h` é medido sozinho. Por isso nada de `sticky` à mão.
- Extraia de C um componente exportado `FiltrosDaConferencia({ imp, conf, travado })` com as abas, as pílulas e, no telefone, a linha da busca (a `BuscaQueAbre`/`buscaNaTela` de hoje). C o usa no desktop (no lugar de hoje) e não o renderiza no telefone. D o renderiza no cabeçalho no telefone. O estado da busca já mora em `conf` (`useConferencia`); se algum estado da busca ainda for local de C, suba-o para `useConferencia`.
- Mantém-se: O estado continua um só, `imp.filtro` (`FiltroConferencia`). No telefone (`celular`), o `TabsList` recebe só os `FILTROS` sem `so_com_linhas` (os três de tipo), com `stretch` e sem `scrollable`. Logo abaixo, uma fileira de pílulas: um `Toggle variant="chip"` por filtro de pendência que hoje apareceria (a mesma condição do `.filter(...)` atual). `pressed = imp.filtro === f.valor`. Tocar liga (`imp.setFiltro(f.valor)`), e tocar de novo desliga (`imp.setFiltro("todos")`). Com uma pílula ligada, o `Tabs` recebe `value={imp.filtro}`, e nenhuma aba acende. O desktop não muda.

**Tech Stack:** React, Tailwind v4, vitest (testes de fonte).

**Spec (aprovado pelo dono em 16/11/2026, opção A):** "Tipo + pílulas". As três abas fixas sempre cabem. As pendências viram pílulas de aviso que filtram ao tocar e desligam ao tocar de novo. A pílula diz a contagem e o nome ("15 sem categoria", "2 já existem"). A da IA leva o ✦ (`SparklesIcon`) e, enquanto a IA lê, o `Spinner` no lugar da contagem, como a aba faz hoje.

## Global Constraints

- Só no telefone (`celular`). O desktop fica idêntico, com todas as abas no `TabsList` como hoje.
- Só peças do design system. Rode `npm run ds:catalog` para confirmar as variantes do `Toggle` (`chip`) e do `Badge` (`tone="warning"`). **Nada novo em `src/components/ui/`**: se faltar uma variante (por exemplo, a pílula em tom de aviso), use o que existe (`Toggle variant="chip"` com o `Badge size="xs" tone="warning"` da contagem dentro, como a aba faz hoje) e relate no report.
- Ícones Heroicons pela régua de tamanho (`16/solid` dentro de chip).
- Rótulos das pílulas: `${n} sem categoria`, `${n} já existem` e `${n} sugeridas`, com `numberBR`. O nome acessível é o mesmo texto.
- A troca de filtro continua remontando a lista em escada (o `key={imp.filtro}` que já existe).
- Sem prettier. Nunca `git add graphify-out/graph.json` nem `CLAUDE.md`. Sem push. O commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Comentários em português.
- **Não abra o Importar no app real além da conferência**, nunca clique em "Importar N lançamentos" (o banco é de produção). Sem navegador no subagente.

## Review Focus

- **A pendência zera com a pílula ligada** (por exemplo, a pessoa categoriza a última "sem categoria"): a pílula continua à vista enquanto ligada (a condição `imp.filtro === f.valor` que já existe), e tocar nela volta para Todos.
- **Nenhuma pendência:** a fileira de pílulas não aparece, sem deixar espaço vazio.
- **Leitor de tela:** o `Toggle` diz `aria-pressed`, e o `TabsList` sem aba ativa continua navegável.
- **Cabeçalho que cresce com a busca aberta:** o corpo continua começando abaixo do cabeçalho, porque `--dialog-header-h` é remedido. A primeira linha da lista não pode ficar escondida.
- **Ver todos no desktop:** a linha das abas larga (busca, Ver menos, Ações) não muda.

---

### Task 1: Abas de tipo e pílulas de pendência no telefone

**Files:**
- Modify: `src/components/transactions/importar/conferir-importacao.tsx` (os `FILTROS` ~105, o `Tabs` ~860–890, a linha da busca do telefone logo abaixo)
- Modify: `src/components/transactions/importar/importar-extrato-dialog.tsx` (o `DialogHeader` ~223–278)
- Test: `src/components/transactions/importar/importar-extrato-dialog.test.ts`

- [ ] **Step 1: Teste de fonte que falha** (`semComentarios`), num `describe("no telefone, abas de tipo e pílulas de pendência")`:
  - o `TabsList` filtra pelo telefone: contém `celular ? !f.so_com_linhas :` (ou expressão equivalente nomeada; fixe a forma no teste);
  - existe `<Toggle` com `variant="chip"` e `pressed={imp.filtro === f.valor}`;
  - o toque desliga para Todos: casa `/imp\.setFiltro\(imp\.filtro === f\.valor \? "todos" : f\.valor\)/`;
  - os rótulos: contém `sem categoria`, `já existem` e `sugeridas` em minúscula na pílula;
  - fixo no topo: `conferir` exporta `function FiltrosDaConferencia(`; o `dialogo` casa `/<DialogSteps[\s\S]*?\{comMenu \? <FiltrosDaConferencia/` dentro do `<DialogHeader>` (antes de `</DialogHeader>`); e no `conferir` o uso no corpo é condicionado a `!celular`.
  - Ajuste as asserções antigas do `scrollable={celular}` para a forma nova, e mantenha as do desktop.
- [ ] **Step 2: Rodar** `npx vitest run src/components/transactions/importar`. Esperado: FALHA.
- [ ] **Step 3: Implementar** como na Architecture. Dê aos filtros de pendência um campo de rótulo curto, `curto`, com os valores `"sem categoria"`, `"já existem"` e `"sugeridas"`, em vez de derivar com `toLowerCase`. A fileira é `flex flex-wrap gap-2`, só no telefone e só com pílula para mostrar. `TabsList` no telefone: `stretch`, sem `scrollable`.
- [ ] **Step 4: Rodar** `npx vitest run src/components/transactions/importar`, `npx tsc --noEmit`, `npx eslint src/components/transactions/importar` e `npm run ds:audit -- src/components/transactions/importar/conferir-importacao.tsx`. Esperado: PASSA, sem violação nova.
- [ ] **Step 5: Commit** com `feat(importar): no telefone, três abas de tipo e as pendências em pílulas que filtram`.
