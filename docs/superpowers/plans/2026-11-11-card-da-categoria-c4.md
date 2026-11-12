# Card da categoria C4 — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O card da categoria na folha do lançamento (`BlocoCategoria`) passa a mostrar a C4: o valor do mês, a barra com a fatia deste lançamento acesa e a frase do quanto ele pesa.

**Architecture:** O `Progress` ganha a prop opcional `highlight` (uma faixa `[from, to]` na escala de `value`/`max`, pintada em `--progress-highlight`). Três funções puras novas em `src/lib/detalhe/blocos.ts` escrevem as frases. O `BlocoCategoria` monta os dois estados (com e sem orçamento) com elas.

**Tech Stack:** Next 16, React 19, Tailwind v4, Vitest (testes que leem a fonte e testes de funções puras).

**Spec:** a escolha do dono nesta sessão: a versão C4 de https://claude.ai/artifact/XK4bqnFAryQAgz3dGEmbcn (a primeira C4, sem as variações C4a–C4d). O dono autorizou a prop `highlight` no `Progress` (AskUserQuestion, 11/11/2026).

## Global Constraints

- Tokens só: nenhum `#hex`, `rgb()` ou cor da paleta do Tailwind. A cor da categoria entra pela utility `tile-vivid` com `--tile-color` (o mesmo jeito do chip de categoria em `transaction-detail-sheet.tsx`, que usa `tileColorFor(color) ?? "var(--muted-foreground)"`).
- Rótulos de botão em minúscula (o `Button` põe a maiúscula).
- `highlight` é opcional e não muda nada em quem não o passa.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sem push. `git add` só dos próprios arquivos (nunca `graphify-out/`).
- Depois de mexer no código: `graphify update .`.

## Review Focus

- `valor` deste lançamento maior que `gasto` (estorno no mês, ou o gasto do mês ainda sem a linha): a faixa começa em 0 e não sai da barra (`from` ≥ 0, `to` ≤ `max`).
- Gasto acima do orçamento: a barra estoura (`value > max`) e a faixa precisa ficar dentro do trilho (cortada em `max`).
- `gasto` = 0: a frase do peso não divide por zero nem diz "NaN%".
- Mês anterior sem gasto: nenhuma variação aparece (sem "Infinity%").
- Convidado: sem link para a categoria, sem "definir orçamento" (já é a regra hoje e fica).

---

### Task 1: `highlight` no `Progress`

**Files:**
- Modify: `src/components/ui/progress.tsx` (tipo `Base` e o ramo contínuo do render, junto do `progress-marker`)
- Modify: `src/app/designsystem/docs/progress.tsx` (um `DocNote` "highlight: a fatia acesa" ao lado do de `marker`, um exemplo e a linha na `PropsTable`)
- Test: `src/components/ui/progress-versions.test.ts`

**Interfaces:**
- Produces: `highlight?: { from: number; to: number }` em `ProgressProps` (todas as variantes do union). Desenha um `<span data-slot="progress-highlight" aria-hidden>` absoluto, `inset-y-0`, com `bg-(--progress-highlight,var(--primary-accent))`, `left = from/max·100%` e `width = (to − from)/max·100%`, com `from` e `to` limitados a `[0, max]`. Não desenha quando a largura ≤ 0, nem com `segments` ou `variant="brand"`. Fica antes da cesura e do `progress-marker` no DOM (o traço do ritmo pinta por cima).

- [ ] **Step 1: Teste que falha** em `progress-versions.test.ts`, no estilo dos testes que leem a fonte do arquivo:
  - `it("highlight: a fatia acesa, opcional e no trilho")`: a fonte de `progress.tsx` casa `/highlight\?: \{ from: number; to: number \}/`, contém `data-slot="progress-highlight"`, contém `--progress-highlight`, e o `progress-highlight` aparece antes de `progress-marker`.
  - A página `docs/progress.tsx` contém `highlight`.
- [ ] **Step 2:** `npx vitest run src/components/ui/progress-versions.test.ts` → FAIL.
- [ ] **Step 3:** Implementar a prop e a página de docs. No exemplo da página: `<Progress value={920} max={1000} bands={BUDGET_BANDS} marker={63} highlight={{ from: 700, to: 920 }} />`, com uma frase que diga para que serve ("a parte do total que é deste item: o lançamento dentro do mês da categoria") e que a cor vem de `--progress-highlight` (padrão `--primary-accent`).
- [ ] **Step 4:** `npx vitest run src/components/ui src/app/designsystem && npx tsc --noEmit` → PASS.
- [ ] **Step 5:** Commit `feat(progress): highlight, a fatia acesa do trilho`.

### Task 2: C4 no `BlocoCategoria`

**Files:**
- Modify: `src/lib/detalhe/blocos.ts` (três funções novas)
- Test: `src/lib/detalhe/blocos.test.ts`
- Modify: `src/components/transactions/detalhe/bloco-categoria.tsx`
- Test: `src/components/transactions/detalhe/blocos.test.ts` (as asserções que leem a fonte)
- Modify: `docs/JORNADAS.md`, `docs/atlas/template.html` e o gerado `docs/atlas/atlas-jornadas.html` (o link do card muda de destino)

**Interfaces:**
- Consumes: `highlight` da Task 1; `statCardDelta(current, previous, better)` de `@/components/ui/stat-card`.
- Produces, em `src/lib/detalhe/blocos.ts`:
  - `fatiaDoLancamento(gasto: number, valor: number): { from: number; to: number }`, que devolve `{ from: Math.max(0, gasto - valor), to: Math.max(0, gasto) }`.
  - `rotuloDoPeso(valor: number, gasto: number, quantos: number): string`
  - `rotuloDaVariacao(atual: number, anterior: number, mesAnterior: string, ateODia: number | null): { texto: string; bom: boolean } | null`

- [ ] **Step 1: Testes que falham** em `src/lib/detalhe/blocos.test.ts` (compare os textos normalizando o espaço do `currencyBRL`, como os testes vizinhos):
  - `fatiaDoLancamento(920, 220)` → `{ from: 700, to: 920 }`; `fatiaDoLancamento(30.2, 50)` → `{ from: 0, to: 30.2 }`.
  - `rotuloDoPeso(30.2, 30.2, 1)` → `"este lançamento é o único do mês"`.
  - `rotuloDoPeso(220, 920, 9)` → `"este lançamento: R$ 220,00 (24% do mês)"`.
  - `rotuloDoPeso(10, 0, 3)` → `"este lançamento: R$ 10,00"` (sem porcentagem quando `gasto` ≤ 0).
  - `rotuloDaVariacao(30.2, 57.6, "setembro", null)` → `{ texto: "−48% que setembro", bom: true }` (sinal de menos U+2212).
  - `rotuloDaVariacao(142, 118, "outubro", 11)` → `{ texto: "+20% que outubro até dia 11", bom: false }`.
  - `rotuloDaVariacao(10, 0, "outubro", null)` → `null`; `rotuloDaVariacao(10, 10, "outubro", null)` → `null`.
- [ ] **Step 2:** `npx vitest run src/lib/detalhe` → FAIL.
- [ ] **Step 3:** Implementar as três funções. `rotuloDaVariacao` usa `statCardDelta(atual, anterior, "down")` e só devolve texto no `kind: "variou"`, com a porcentagem arredondada ao inteiro.
- [ ] **Step 4:** Reescrever o render do `BlocoCategoria` (os dados e a fatia da manchete não mudam):
  - **Link do topo:** com `quantos` > 1, o de hoje (`rotuloVerOs`, lista filtrada). Com 1, `{ href: categoryDetailPath(categoryId, { month: ym }), label: "ver a categoria" }`, e `null` para convidado. Com 0, `null`.
  - **Cor da categoria:** `const cor = tileColorFor(bundle.category?.color ?? t.category?.color) ?? "var(--muted-foreground)"`, aplicada no `Progress` com `className="tile-vivid [--progress-highlight:var(--tile-surface)]"` e `style={{ "--tile-color": cor } as CSSProperties}`. O ponto da frase é um `<span aria-hidden className="tile-vivid inline-block size-2 rounded-full bg-(--tile-surface)">`, com o mesmo `style`.
  - **Com orçamento:** `MoneyDisplay value={gasto} size="lg"` e, na mesma linha, `<Muted>de <MoneyDisplay value={orcamento} /></Muted>`. Depois o `Progress` de hoje (`bands`, `marker`, `aria-label`) com `highlight={fatiaDoLancamento(gasto, Number(t.amount))}`. Embaixo, uma `Caption`: o ponto, `rotuloDoPeso(...)`, `" · "` e `rotuloDoResto(...)`.
  - **Sem orçamento:** `MoneyDisplay value={gasto} size="lg"` e, na mesma linha, um `Badge variant="soft" size="sm"` com o `texto` de `rotuloDaVariacao` e `tone={bom ? "success" : "warning"}`. O `atual` é `lancado` no mês corrente e `gasto` num mês passado; o `anterior` é o `anteriorTotal` de hoje; `ateODia` é `hoje.getDate()` no mês corrente e `null` num mês passado. A `Caption` de comparação de hoje sai. Depois um `Progress value={gasto} max={gasto}` (sem `bands`; ele desenha só a faixa quando `gasto` ≤ 0) com o mesmo `highlight` e `aria-label={`Este lançamento no mês de ${nome}`}`. Embaixo, a `Caption` com o ponto e o `rotuloDoPeso`. Para quem não é convidado, `<Button variant="secondary" size="sm" asChild className="justify-self-start"><Link …>definir orçamento</Link></Button>`.
- [ ] **Step 5:** Atualizar `src/components/transactions/detalhe/blocos.test.ts`. A asserção `anteriorTotal > 0` continua valendo. Somar `it("categoria: C4, a fatia do lançamento e o peso")`, que procura na fonte `highlight={fatiaDoLancamento(`, `rotuloDoPeso(`, `rotuloDaVariacao(`, `"ver a categoria"` e `variant="secondary"`.
- [ ] **Step 6:** Jornada. Em `docs/JORNADAS.md`, na jornada do detalhe do lançamento, o link do card de categoria com uma despesa só passa a levar ao detalhe da categoria (era a lista com o próprio lançamento). Espelhar em `docs/atlas/template.html` e rodar `python3 docs/atlas/build.py`.
- [ ] **Step 7:** `npx tsc --noEmit && npm run lint && npx vitest run src/lib/detalhe src/components/transactions src/components/ui` → PASS. Rodar também `npm run ds:audit -- src/components/transactions/detalhe/bloco-categoria.tsx`, sem violação nova.
- [ ] **Step 8:** Commit `feat(detalhe): card da categoria C4, a fatia do lançamento no mês`.
