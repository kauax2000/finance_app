# Design system completo — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deixar o `/designsystem` 100% completo e fiel ao código — todo o movimento catalogado com número e demonstração, toda página na forma fixa, todo token numa página de fundação, nenhuma afirmação desatualizada — e trancar isso com testes.

**Architecture:** Três testes de catraca entram primeiro, cada um com uma lista de pendências que espelha exatamente o que falta hoje; cada tarefa seguinte tira os seus itens da lista e preenche a documentação; a última tarefa apaga as listas e o teste fica estrito. O movimento vira dado (`docs/motion-catalog.ts`), lido pela página de Movimento e verificado pelo teste contra o código.

**Tech Stack:** Next.js (App Router, ver `node_modules/next/dist/docs/`), React, Tailwind v4, Vitest, `motion`, páginas do catálogo com `ds-doc.tsx` / `ds-kit.tsx` / `ds-frame.tsx`.

**Spec:** `docs/superpowers/specs/2026-10-20-design-system-completo-design.md` — o inventário de lacunas (seções A–D) é a lista de trabalho de cada tarefa. Leia a seção do seu componente antes de começar.

## Global Constraints

- **Execução num worktree** criado com `superpowers:using-git-worktrees` a partir de `finance-app-2.0`. Outra sessão comita `top-bar` no checkout principal; não toque no checkout principal até a Tarefa 18.
- **Nenhuma mudança de comportamento ou visual em `src/components/ui/`.** Lá só se editam comentários e JSDoc (Tarefa 16). `globals.css` não muda.
- **Todo número escrito numa página é lido no código** (arquivo:linha) antes de escrito. Afirmação não medida é falha mesmo com teste verde.
- **Conteúdo de produto realista** em português (carteiras, lançamentos, categorias); nada de `lorem ipsum` (`doc-pages.test.ts` reprova).
- **`Eixo`, `Interruptor`, `Interruptores`, `Controles` vêm de `../ds-doc`**; nenhuma página os redeclara.
- **Tokens apenas**: nada de `#hex`, `rgb()`, `bg-white`, `text-gray-*`, `p-[13px]` (`npm run ds:audit -- <arquivo>` limpo).
- **Componentes na versão padrão** nas demonstrações, salvo quando a demonstração é do eixo.
- **Ícones Heroicons** pela régua de tamanho (`size-4`↓ `16/solid`, `size-5` `20/solid`, `size-6`↑ `24/outline`).
- **Forma fixa** (`docs/design/COMPONENTE-NOVO.md` §4): `Usage` → `DocSection title="Na tela"` com `<Controles>` (eixos à esquerda, interruptores à direita) acima do mostrador → notas → `DocSection title="No telefone"` com `<IphoneFrame>` → comportamentos → `DocSection title="Esqueleto"` (só se o componente exporta `*Skeleton`) → `PropsTable`s. Modelo: `src/app/designsystem/docs/avatar-group.tsx`.
- **Toda tarefa termina verde**: `npx tsc --noEmit && npm run lint && npm run test:unit`.
- **Commits** em português, convencionais (`docs(ds): …`, `test(ds): …`), terminando com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Tema escuro**: toda demonstração nova lida no escuro sem sumir (tokens com par em `.dark`). Conferido na Tarefa 18 com `resize_window colorScheme: "dark"`.
2. **Telefone a 375px**: nenhuma página nova rola na horizontal; o `IphoneFrame` não estoura a coluna. Conferido na Tarefa 18 com `resize_window preset: "mobile"`.
3. **Movimento reduzido**: "Reproduzir" com `prefers-reduced-motion: reduce` mostra o estado final sem animar (as utilities já obedecem ao bloco global; demonstrações JS perguntam `matchMedia`). O jsdom não pinta CSS: o `Slider` da Tarefa 6 e o `Reproduzir` da Tarefa 5 não podem disparar animação JS própria; conferido no código na revisão de cada tarefa.
4. **Número do catálogo divergindo do código**: o teste de movimento compara o `numero` dos tokens com o valor em `globals.css` e o das molas com `lib/spring.ts` (Tarefas 1–3).
5. **Catraca desonesta**: uma pendência que já foi resolvida, ou uma falta nova fora da lista, reprova (o teste compara igualdade, não inclusão) — Tarefa 1.

---

### Task 1: Os três testes de catraca

**Files:**
- Create: `src/app/designsystem/motion-coverage.test.ts`
- Create: `src/app/designsystem/token-coverage.test.ts`
- Create: `src/app/designsystem/docs/motion-catalog.ts`
- Modify: `src/app/designsystem/doc-pages.test.ts`

**Interfaces:**
- Produces, em `docs/motion-catalog.ts`:
  ```ts
  export type Familia =
    | "tokens" | "sobreposicao" | "cascata" | "divulgacao" | "marca"
    | "laco" | "troca" | "mola" | "liquido" | "cabecalho" | "hook" | "local"
  export type Movimento = {
    nome: string              // exatamente como no código: "menu-morph", "MOLA", "--duration-fast", ".theme-reveal"
    tipo: "token" | "property" | "keyframes" | "utility" | "seletor" | "mola" | "curva" | "quadro" | "hook"
    familia: Familia
    onde: string              // caminho a partir da raiz: "src/app/globals.css", "src/lib/spring.ts"
    numero: string            // "380ms linear", "rigidez 300 · amortecimento 25"
    oQueFaz: string           // uma frase, português
    consumidores: string[]    // caminhos que contêm `nome` (ou a classe que o veste)
    reduzido: "para" | "encurta" | "segue" | "instantaneo"
  }
  export const MOVIMENTOS: readonly Movimento[] = []
  ```
- Produces, nos testes, três listas exportadas no topo de cada arquivo, que as tarefas seguintes encolhem:
  `PENDENTES_MOVIMENTO: string[]`, `PENDENTES_TOKENS: string[]`, `PENDENTES_FORMA: Record<string, Falta[]>` com `type Falta = "na-tela" | "controles" | "iphone" | "esqueleto"`.

- [ ] **Step 1: Escrever `motion-coverage.test.ts`**

  O conjunto exigido é a união de:
  - todo `@keyframes <nome>` de `globals.css`;
  - toda `@utility <nome>` cujo bloco (`blocoCss(css, "@utility <nome> {")`) contém `animation`, `transition` ou `@apply` com `animate-`;
  - todo `@property <nome>` menos `NAO_E_MOVIMENTO = ["--top-bar-bottom"]` (some outro só se o bloco do `@property` não é lido por nenhum `@keyframes` nem `transition` — confira e comente o motivo);
  - todo `--duration-*` e `--ease-*` declarado em `globals.css`;
  - todo `export const`/`export function` (valores, não tipos) de `src/lib/spring.ts`, `src/lib/liquid-move.ts`, `src/lib/header-morph.ts`, `src/lib/hide-on-scroll.ts`, mais `useMarcador`, `useAlturaAnimada`, `useCountUp`, `useBrandGlow`, `caixaDoAtivo`. `ATRAS`/`FRENTE` entram (são o lado do esticão).

  Testes:
  - `"todo movimento do código está no catálogo, menos as pendências"`: `faltam = exigidos − MOVIMENTOS.map(nome)`; `expect(faltam.sort()).toEqual([...PENDENTES_MOVIMENTO].sort())`.
  - `"cada entrada existe onde diz"`: para toda entrada, `lerFonte(onde)` contém `nome` (para `utility`, a string `@utility <nome>`; para `keyframes`, `@keyframes <nome>`).
  - `"cada consumidor usa o que o catálogo diz"`: todo caminho de `consumidores` existe e contém `nome` (ou, para `keyframes`, o nome de uma utility da mesma entrada; aceite a classe Tailwind `animate-[<nome>…]` também).
  - `"o número dos tokens é o do CSS"`: para `tipo === "token"`, o valor declarado em `:root` (ex.: `150ms`, `cubic-bezier(0.16, 1, 0.3, 1)`) aparece em `numero` — para `--ease-spring` basta `"linear("`.
  - `"o número das molas é o do spring.ts"`: para `MOLA`, `MOLA_PALCO`, `SEPARACAO`, `BALANCO`, `numero` contém `rigidez <stiffness> · amortecimento <damping>`; para `SAIDA`, `150ms`.
  - `"sem nome repetido"`.
  - `"a página lê o catálogo"`: `lerFonte("src/app/designsystem/docs/motion.tsx")` contém `MOVIMENTOS` (passa a valer na Tarefa 4 — até lá, `it.todo`).

  `PENDENTES_MOVIMENTO` nasce com **todos** os exigidos (o catálogo está vazio).

- [ ] **Step 2: Escrever `token-coverage.test.ts`**

  Tokens exigidos: toda propriedade declarada (`^\s*(--[\w-]+):`) dentro do bloco `:root,\n.light {` (`globals.css:196`) e do bloco `@theme static {` (`:185`). O `@theme inline` fica fora (é mapeamento do Tailwind). Casa: as oito páginas de fundação do `REGISTRY` (`category === "Foundations"`: brand, colors, iconography, layers, motion, shape-elevation, touch-safe-area, typography) mais `CASA_FORA_DA_FUNDACAO = { "--scroll-fade-": "scroll-area", "--space-": "container" }` (prefixo → slug).
  - `"todo token tem casa, menos as pendências"`: `faltam` (token não citado em nenhuma casa permitida) `toEqual(PENDENTES_TOKENS)` ordenado.
  - `PENDENTES_TOKENS` nasce com o que falta hoje (deve bater com a seção D do spec; diferença = confira à mão).

- [ ] **Step 3: Estender `doc-pages.test.ts`**

  Para cada `COMPONENTES` (não-fundação), calcule as faltas: `"na-tela"` se a página não tem `title="Na tela"`; `"controles"` sem `<Controles`; `"iphone"` sem `<IphoneFrame`; `"esqueleto"` se `lerFonte(entry.source)` tem `/export (function|const) \w*Skeleton\b/` e a página não tem `title="Esqueleto"`.
  - `"toda página na forma fixa, menos as pendências"`: o mapa das faltas (só slugs com falta) `toEqual(PENDENTES_FORMA)`.
  - `PENDENTES_FORMA` nasce com o estado de hoje (rode uma vez com `console.log` do mapa, cole, apague o log).

- [ ] **Step 4: Rodar e ver verde**

  Run: `npx vitest run src/app/designsystem`
  Expected: PASS (as listas espelham o estado atual). Tire um item qualquer de uma lista e confirme que FALHA; devolva.

- [ ] **Step 5: Commit**

  ```bash
  git add src/app/designsystem/motion-coverage.test.ts src/app/designsystem/token-coverage.test.ts src/app/designsystem/docs/motion-catalog.ts src/app/designsystem/doc-pages.test.ts
  git commit -m "test(ds): catraca de movimento, tokens e forma fixa das páginas"
  ```

---

### Task 2: Catálogo de movimento — o CSS

**Files:**
- Modify: `src/app/designsystem/docs/motion-catalog.ts`
- Modify: `src/app/designsystem/motion-coverage.test.ts` (tirar itens de `PENDENTES_MOVIMENTO`)

**Interfaces:**
- Consumes: `Movimento`, `Familia`, `MOVIMENTOS` (Tarefa 1).

- [ ] **Step 1: Tirar de `PENDENTES_MOVIMENTO` todos os itens CSS** (tokens, `@property`, `@keyframes`, `@utility`). Run `npx vitest run src/app/designsystem/motion-coverage.test.ts` → FAIL listando-os.
- [ ] **Step 2: Escrever as entradas** — uma por item, nas famílias da tabela A do spec (Tokens → `tokens`; Sobreposição → `sobreposicao`; Cascatas → `cascata`; Divulgação → `divulgacao`; Botão e marca → `marca`; Laços e estados → `laco`; Troca de tela → `troca`). Leia cada bloco em `globals.css` para o `numero` (duração, curva, atraso, passo da escada) e o `reduzido` (o bloco global em `:757` encurta transições e para animações de uma vez; `animate-spin`/`animate-pulse` seguem; a escada zera atraso em `:2003`). `consumidores` por `grep -rl "<nome>" src --include=*.tsx --include=*.ts`. Inclua também, como `tipo: "seletor"`, `.theme-reveal`, `.workspace-switch` e as transições do toast (`[data-sonner-toast]`), e o afundar do `Button` (`tipo: "curva"`, `nome: "afundar"`, se esse identificador existe em `button.tsx:145-168`; senão use o nome que existe lá). Corrija o erro do spec: `--duration-instant` só em `command.tsx`, `item.tsx` e no CSS de `workspace-switch`/`veil-out`.
- [ ] **Step 3: Rodar** `npx vitest run src/app/designsystem/motion-coverage.test.ts` → PASS.
- [ ] **Step 4: Commit** `docs(ds): o catálogo de movimento, parte CSS`

---

### Task 3: Catálogo de movimento — o JS

**Files:**
- Modify: `src/app/designsystem/docs/motion-catalog.ts`
- Modify: `src/app/designsystem/motion-coverage.test.ts`

- [ ] **Step 1: Tirar de `PENDENTES_MOVIMENTO` os itens JS** → FAIL. Depois disso a lista deve estar vazia.
- [ ] **Step 2: Escrever as entradas** das famílias `mola` (`spring.ts`, com `numero` "rigidez X · amortecimento Y" e o tempo de assentar quando o comentário do arquivo o diz), `liquido` (`liquid-move.ts`, `marcador.ts`, `use-marcador.ts`), `cabecalho` (`header-morph.ts`; e, como entradas extras de `onde: "src/components/ui/command.tsx"`, `quadroDasBolhas`, `quadroDaGota`, `VOLTA_DA_PILULA` com 320ms e os tempos 460/260ms da placa e 460ms da casca lidos no arquivo), `hook` (`useAlturaAnimada`, `useCountUp` com `CONTAGEM_ENTRADA`/`_TROCA` de `stat-card.tsx:177`, `useBrandGlow` com `GLOW_DURACAO` 2s, `proximoEscondido`, `alvoDaRolagem`) e `local` (as molas locais da tabela A, cada uma com `onde` no próprio arquivo e `oQueFaz` dizendo que é local e duplicada quando for o caso).
- [ ] **Step 3: Rodar** → PASS.
- [ ] **Step 4: Commit** `docs(ds): o catálogo de movimento, parte JS`

---

### Task 4: A página de Movimento lida do catálogo

**Files:**
- Modify: `src/app/designsystem/docs/motion.tsx`
- Modify: `src/app/designsystem/motion-coverage.test.ts` (o `it.todo` "a página lê o catálogo" vira `it`)

**Interfaces:**
- Consumes: `MOVIMENTOS`, `Familia`.
- Produces: `function CurvaDaMola({ stiffness, damping }: { stiffness: number; damping: number })` local à página — amostra a mola (massa 1) e desenha como o `traco()` que já existe desenha as `--ease-*`.

- [ ] **Step 1: Trocar o `it.todo` por `it`** → FAIL.
- [ ] **Step 2: Reescrever a página**: `Usage` (contagem real: `MOVIMENTOS.length`, famílias) → "Os tokens" (o que já existe, agora com `--duration-gentle` e `--ease-in-out`, e os chips de consumidor vindos de `consumidores`) → "As molas" (uma `Spec` por mola de `spring.ts`, com `CurvaDaMola` e o número) → uma `DocSection` por família, na ordem sobreposição, cascata, divulgação, marca, laço, troca, líquido, cabeçalho, hook, local, cada uma com uma `SpecList` de `SpecRow` (nome em `Code`, número, o que faz, consumidores em `SpecChips`) → "Movimento reduzido" como tabela derivada de `reduzido` (o que para, encurta, segue, fica instantâneo) → as quatro `DocNote` que já existem.
- [ ] **Step 3: Rodar** `npx vitest run src/app/designsystem` → PASS; `npm run ds:audit -- src/app/designsystem/docs/motion.tsx` limpo.
- [ ] **Step 4: Commit** `docs(ds): a página de Movimento lê o catálogo inteiro`

---

### Task 5: Demonstrações vivas por família

**Files:**
- Modify: `src/app/designsystem/docs/motion.tsx`
- Create: `src/app/designsystem/docs/motion-demos.tsx` (as demonstrações, para a página não passar de ~600 linhas)
- Create: `src/app/designsystem/docs/motion-demos.test.tsx`

**Interfaces:**
- Produces: `export function Reproduzir({ children }: { children: (chave: number) => React.ReactNode })` — um `Button` "reproduzir" que incrementa a chave e remonta o filho por `key`; e uma demonstração por família, exportada como `DemoSobreposicao`, `DemoCascata`, `DemoDivulgacao`, `DemoMarca`, `DemoLaco`, `DemoTroca`, `DemoLiquido`.

- [ ] **Step 1: Teste** em `motion-demos.test.tsx`: renderiza `<Reproduzir>{(k) => <span data-k={k} />}</Reproduzir>`, clica o botão, espera `data-k="1"`. Segundo teste: o arquivo `motion.tsx` usa as sete `Demo*`. Run → FAIL.
- [ ] **Step 2: Implementar** usando o componente real quando existe (`DropdownMenu` aberto para a sobreposição, `Accordion` para a divulgação, `Tabs` para o líquido, `ThemeToggle` para a troca, `Button variant="brand"`/`brandColorful`/`brandOutline` e `AnnouncementBar variant="brand"` para a marca, `Skeleton`/`Spinner`/`TopBarProgress` para o laço, `Item`s numa lista com `table-reveal` para a cascata). Nada de animação nova: só as utilities e componentes do catálogo. Com movimento reduzido, as próprias utilities mostram o estado final.
- [ ] **Step 3: Rodar** `npx vitest run src/app/designsystem` → PASS; `ds:audit` nos dois arquivos limpo.
- [ ] **Step 4: Commit** `docs(ds): demonstrações vivas de cada família de movimento`

---

### Task 6: O cabeçalho e a busca do telefone em câmera lenta

**Files:**
- Modify: `src/app/designsystem/docs/motion-demos.tsx`, `src/app/designsystem/docs/motion.tsx`

**Interfaces:**
- Consumes: `quadroDaTroca(p: number, afundar: boolean)`, `quadroDoVidroQueEstica(g: number)`, `VIDRO_R`, `VIDRO_H` de `@/lib/header-morph`.
- Produces: `export function DemoCabecalho()`.

- [ ] **Step 1: Teste** (em `motion-demos.test.tsx`): renderiza `DemoCabecalho`, muda o `Slider` para 0,5 e confere que o estilo inline do vidro mudou em relação a 0. Run → FAIL.
- [ ] **Step 2: Implementar**: dentro de um `IphoneFrame`, um vidro desenhado com `TopBarAction plate` e o progresso controlado por um `Slider` (0–1) que aplica o quadro de `quadroDaTroca` e de `quadroDoVidroQueEstica` (a mesma escrita que `top-bar.tsx` faz). Para a separação em bolhas e a gota (funções locais de `command.tsx`, não exportadas), use o `CommandDialog` real aberto pela lupa dentro do `IphoneFrame`, com `Reproduzir`. **Não exporte nada novo de `ui/`.**
- [ ] **Step 3: Rodar** → PASS.
- [ ] **Step 4: Commit** `docs(ds): o cabeçalho e a busca do telefone em câmera lenta`

---

### Task 7: Tokens nas páginas de fundação

**Files:**
- Modify: `docs/colors.tsx`, `docs/brand.tsx`, `docs/shape-elevation.tsx`, `docs/touch-safe-area.tsx`, `docs/typography.tsx`, `docs/container.tsx`, `docs/scroll-area.tsx` (todos em `src/app/designsystem/`)
- Modify: `src/app/designsystem/token-coverage.test.ts` (`PENDENTES_TOKENS` → `[]`)

- [ ] **Step 1: Esvaziar `PENDENTES_TOKENS`** → FAIL listando a seção D do spec.
- [ ] **Step 2: Documentar** cada token da seção D na página indicada, com `TokenTile`/`TokenGrid` (cor) ou `SpecRow` (medida), dizendo quem o veste. `--radius-xl…4xl`: nota de que são da escada do Tailwind e que `ui/` não os veste (`radius-roles.test.ts`). `--top-bar-bottom` e `--bottom-bar-offset`: como são publicados (`globals.css:555-572` e o da barra de baixo). A família `--glass-*` e `--mobile-glass-*`: a receita do vidro em `lib/glass-classes.ts`. `--scroll-fade-*` em `scroll-area` com os invariantes da dissolução (AGENTS "A dissolução").
- [ ] **Step 3: Rodar** `npx vitest run src/app/designsystem` → PASS; `ds:audit` nas páginas tocadas limpo.
- [ ] **Step 4: Commit** `docs(ds): todo token de globals.css numa página de fundação`

---

### Tasks 8–15: Páginas de componente — afirmações e forma fixa

Todas seguem o mesmo ciclo; cada uma cobre um lote de páginas em `src/app/designsystem/docs/`. Para cada página do lote:
1. leia a seção B do spec para ela e corrija cada afirmação **depois de ler o código citado**;
2. complete as faltas da forma fixa (`PENDENTES_FORMA[slug]`);
3. acrescente as linhas de `PropsTable` e as demonstrações que a seção B lista como faltando.

Steps de cada tarefa:
- [ ] **Step 1:** apagar do `PENDENTES_FORMA` as entradas dos slugs do lote. Run `npx vitest run src/app/designsystem/doc-pages.test.ts` → FAIL com os slugs do lote.
- [ ] **Step 2:** editar as páginas do lote como acima.
- [ ] **Step 3:** `grep -n "40" <páginas do lote>` e conferir que nenhum "40" restante fala de piso de toque (o piso é 44; `pointer-coarse:` vale também abaixo de 48rem).
- [ ] **Step 4:** `npx vitest run src/app/designsystem && npx tsc --noEmit && npm run lint` → PASS; `npm run ds:audit -- <cada página>` limpo.
- [ ] **Step 5:** commit `docs(ds): <lote> na forma fixa e fiel ao código`.

| Task | Lote (slugs) |
|---|---|
| 8 | input, input-group, input-otp, field, label, textarea, select, search-input, combobox, form |
| 9 | button, button-group, checkbox, radio, radio-group, switch, toggle, toggle-group, slider, histogram-slider |
| 10 | dropdown-menu, context-menu, menubar, navigation-menu, popover, hover-card, tooltip |
| 11 | dialog, alert-dialog, sheet, drawer, command |
| 12 | card, stat-card, alert, announcement-bar, badge, empty-state, progress, skeleton |
| 13 | avatar, color-tile, code, kbd, kbd-group, money-display, spinner, separator |
| 14 | item, description-list, table, data-table, pagination, breadcrumb, tabs, timeline, accordion, collapsible, calendar, date-picker, stepper |
| 15 | bottom-bar, sidebar, toolbar, sonner, scroll-area, resizable, theme-toggle, container, carousel, chart, filter-bar, onboarding, page-section, page-header, showcase, device-frame |

Notas por lote:
- **9**: `button` ganha o afundar (WAAPI 260ms), o anel interno do primário (`--primary-hover-ring`), o realce a 50% e `ButtonSizeContext`.
- **10**: as escalas do toque vêm de `src/lib/menu-classes.ts` (linha 44, texto 16, ícone 20, teto 384, `MENU_ROW_GAP` 4); a largura do `DropdownMenu`/`ContextMenu` no toque é +32 por degrau (208…256). O "No telefone" do `dropdown-menu` mostra o ⋯ abrindo **menu** na escala do toque; `mobile="sheet"` vira nota ("existe; só o chip de status da fatura usa").
- **11**: o `IphoneFrame` do `command` mostra a barra nascendo da lupa (pode reutilizar o que a Tarefa 6 montou, importando de `motion-demos.tsx`).
- **14**: `data-table` ganha a seção Esqueleto e as peças `DataTableFacetFilter`, `DataTableSelectionBar`, `DataTableViewOptions`, `TablePanel` com `TablePanelToolbar variant="title"`. `breadcrumb` deixa de dizer que é a barra do app.
- **15**: `bottom-bar` e `toolbar` renomeiam a seção "A barra" para "Na tela". `sidebar` mostra `SidebarProvider toggle` (o app usa `header`). `page-header`, `page-section`, `filter-bar`, `onboarding`, `showcase`, `device-frame` só corrigem afirmações (já têm a forma).

---

### Task 16: Comentários desatualizados em `src/components/ui/`

**Files:**
- Modify (só comentários/JSDoc): `drawer.tsx:113`, `form.tsx:951`, `button-group.tsx:~36`, `command.tsx:1059`, `search-input.tsx:76`, `toolbar.tsx:29,126`, `top-bar.tsx:52,481`, `bottom-bar.tsx:~25` — todos em `src/components/ui/`.

- [ ] **Step 1:** `TOOLBAR_CONTROL_HEIGHTS.coarse = 40` (`toolbar.tsx:41`): `grep -rn "TOOLBAR_CONTROL_HEIGHTS" src`. Se só testes e docs leem, corrija para 44 e rode os testes. **Se alimenta layout ou estilo, pare e reporte (BLOCKED)** — vira pergunta ao dono.
- [ ] **Step 2:** corrigir os comentários para o que o código faz hoje (44 no toque; `--bottom-bar-surface`, anel 15%, tecla `--bottom-bar-marker`; `repositionInputs` padrão `false`; `TopBar sm` 56; `FormPickerPopoverTrigger` padrão `lg` com 44 no telefone).
- [ ] **Step 3:** `git diff --stat` mostra só os arquivos acima; `git diff -U0 | grep '^[+-]' | grep -v '^[+-]\s*\(//\|\*\|/\*\)'` vazio (só comentário mudou), salvo a constante do Step 1. `npx tsc --noEmit && npm run lint && npm run test:unit` → PASS.
- [ ] **Step 4:** commit `docs(ui): comentários fiéis ao toque de 44 e às tintas de hoje`

---

### Task 17: `top-bar`, por último

**Files:**
- Modify: `src/app/designsystem/docs/top-bar.tsx`, `src/app/designsystem/doc-pages.test.ts`

- [ ] **Step 1:** trazer ao worktree o que a outra sessão comitou: `git fetch` não serve (mesmo repositório) — `git merge finance-app-2.0` dentro do branch do worktree. Releia `git log --oneline <base-do-worktree>..finance-app-2.0 -- src/components/ui/top-bar.tsx src/lib/header-morph.ts` e acrescente à lista de trabalho o que mudou.
- [ ] **Step 2:** apagar `top-bar` de `PENDENTES_FORMA` (se estiver) → FAIL ou PASS conforme o mapa.
- [ ] **Step 3:** corrigir as afirmações da seção B (`join="always"` cola também no telefone; o filtro não escala desde `ecc6d99`; tirar "Um primeiro desenho") e trocar o `DemoTelefone` pelo cabeçalho real do app: `surface="edge"` + `TopBarAction plate` + `TopBarActionSwap` (sino ↔ voltar) + `TopBarActionGroup morph` `[lupa | filtro]`, com o `plate` na tinta da `BottomBar` (`--bottom-bar-surface`, anel 15%). Demonstrar `join="desktop"|"phone"`, `TopBarSearch plate glow collapse="lg"`, `TopBarTitle pageTitle`, a bolha da contagem e as três camadas do `edge` (4, 12, 24px).
- [ ] **Step 4:** `npx vitest run src/app/designsystem && npx tsc --noEmit && npm run lint` → PASS; `ds:audit` limpo.
- [ ] **Step 5:** commit `docs(ds): a TopBar mostra o cabeçalho do telefone de verdade`

---

### Task 18: Catraca estrita, AGENTS, histórico e conferência visual

**Files:**
- Modify: `motion-coverage.test.ts`, `token-coverage.test.ts`, `doc-pages.test.ts` (apagar as listas de pendência e compará-las com vazio direto: `expect(faltam).toEqual([])`)
- Modify: `AGENTS.md`, `docs/design/HISTORICO-DESIGN-SYSTEM.md`

- [ ] **Step 1:** apagar `PENDENTES_*`; os testes passam a exigir zero. Run `npx vitest run src/app/designsystem` → PASS.
- [ ] **Step 2:** `AGENTS.md`: corrigir `:816` (`FormPickerPopoverTrigger` é `lg`), `:1461` (o `Breadcrumb` não é a barra do app hoje); na seção "Design system", um bullet dizendo que o movimento vive em `docs/motion-catalog.ts` e que `motion-coverage.test.ts`, `token-coverage.test.ts` e `doc-pages.test.ts` trancam movimento, tokens e forma — animação nova entra no catálogo na mesma mudança.
- [ ] **Step 3:** `HISTORICO-DESIGN-SYSTEM.md`: "Rodada 353 — o catálogo completo", no formato das rodadas 349–352 (o que foi medido, o que estava errado, o que se decidiu, e a proposta de juntar as molas locais duplicadas em `lib/spring.ts`).
- [ ] **Step 4:** `npx tsc --noEmit && npm run lint && npm run test:unit` → PASS; `npm run ds:docs-map` sem diff.
- [ ] **Step 5:** commit `docs(ds): catraca estrita e rodada 353`
- [ ] **Step 6:** integrar com `superpowers:finishing-a-development-branch` (merge no `finance-app-2.0`). Depois, com o dev server externo em :3000 (`preview_start` com `dev-attach`), abrir `/designsystem/motion`, `/designsystem/top-bar`, `/designsystem/bottom-bar`, `/designsystem/dropdown-menu`: sem erro no console, legível em `colorScheme: "dark"`, sem rolagem horizontal em `preset: "mobile"`; screenshot de cada uma para o dono.
