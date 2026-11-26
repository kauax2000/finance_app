# Topo da categoria no telefone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Abaixo de 768px, o detalhe da categoria abre com o topo centralizado da gaveta (ladrilho, nome, valor do mês, legenda), que sobe para a barra com ladrilho, nome e valor curto ao rolar; o ⋯ vai para a cápsula da barra.

**Architecture:** O `PageHeader` ganha `phone="hero"` e a peça `PageHeaderHero` (só no telefone). A subida reaproveita o `collapse` (`useTituloQueSobe` → `publishPageTitle` → `TopBarTitle pageTitle`), e a loja `PageTitleDock` passa a levar `form: "hero"` e `trailing` (texto), que o `TopBarPageTitle` mostra também no telefone. O ⋯ chega à barra por um slot novo do `page-chrome-provider` (`usePageChromeMenu`), desenhado junto do calendário no segundo miolo da `CapsulaQueEstica`.

**Tech Stack:** Next 16, React 19.2, TypeScript, Tailwind v4, Vitest (testes de fonte com `@/test/fonte` e de render com `renderToStaticMarkup`).

**Spec:** `docs/superpowers/specs/2026-11-26-topo-da-categoria-no-telefone-design.md`

## Global Constraints

- Desktop (`md` para cima) não muda: o `PageHeader` à esquerda e a faixa do mês ficam como estão.
- Nenhum `#hex`, `rgb()`, valor arbitrário de cor ou de raio; raio pelo degrau da escala; tokens com par escuro.
- O ladrilho do topo é `ColorTile size="2xl"` (44), o da gaveta (`transaction-detail-sheet.tsx`).
- O valor curto da barra é texto sem centavos no formato de `reaisInteiros` (`regua-do-mes-contas.ts`), ex.: "R$ 4.114".
- `trailing` na loja é `string`; `media` segue nó memorizado por quem publica (a loja compara por identidade).
- A subida acontece quando o **nome** passa sob a barra (o gatilho do `collapse` de hoje).
- Componente/prop nova entra completa (invariante 8 do AGENTS.md): `registry.ts`, página `src/app/designsystem/docs/page-header.tsx`, teste em `src/components/ui/page-header-versions.test.ts`, `npm run ds:docs-map`, bullet no `AGENTS.md` (seção `PageHeader`) e uma rodada em `docs/design/HISTORICO-DESIGN-SYSTEM.md`.
- Toque: tudo na barra mede 44; a cápsula com três itens usa os mesmos botões da de dois.
- Estilo: 2 espaços em `src/components/ui/` (como o arquivo), 4 espaços nos demais que já usam 4; sem ponto e vírgula; comentários em português que dizem o porquê.
- Nunca `git add` de `CLAUDE.md`, `graphify-out/graph.json` ou `docs/design/painel/*`. Depois de mudar código, `graphify update .`. Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Não empurrar.

## Review Focus

1. Nome longo de categoria na barra rolada: corta com "…" e a lupa/calendário/⋯ ficam inteiros. → teste de render na Task 1 (classe `truncate` no nome, `shrink-0` no ladrilho e no valor).
2. Categoria sem lançamento no mês (lançado 0) e mês sem análise (`analise` nula): o topo mostra "R$ 0,00" e só "Gasto em <mês>", sem a frase de comparação. → teste da Task 3.
3. Receita (tipo `income`): a legenda diz "Recebido em <mês>", e o valor segue o tom de receita do resto da tela. → teste da Task 3.
4. Barra de uma tela sem hero (Transações, Cartões): continua só com o texto do título ao rolar, sem ladrilho. → teste da Task 1.
5. Sair da tela com o topo já na barra: a barra limpa ladrilho, valor e ⋯ (nada vaza para a próxima tela). → testes das Tasks 1 e 2 (publicação `null` na desmontagem).

---

### Task 1: O `PageHeader` hero e a barra que o recebe (design system)

**Files:**
- Modify: `src/hooks/use-page-title-dock.ts` (tipo `PageTitleDock`, `mesmoTitulo`)
- Modify: `src/components/ui/page-header.tsx` (`PageHeader`, `PageHeaderTitleRow`, `useTituloQueSobe`, nova `PageHeaderHero`, export)
- Modify: `src/components/ui/top-bar.tsx` (`TopBarPageTitle`)
- Modify: `src/app/designsystem/registry.ts`, `src/app/designsystem/docs/page-header.tsx`, `AGENTS.md`, `docs/design/HISTORICO-DESIGN-SYSTEM.md`
- Test: `src/components/ui/page-header-versions.test.ts`

**Interfaces:**
- Produces:
  - `PageTitleDock = { text: string; docked: boolean; back?: ReactNode; media?: ReactNode; trailing?: string; form?: "hero" } | null`; `mesmoTitulo` compara também `trailing` e `form`.
  - `PageHeader` prop `phone?: "default" | "hero"` (padrão `"default"`); com `"hero"` o `<header>` leva `data-phone="hero"`.
  - `PageHeaderTitleRow` em `phone="hero"`, abaixo do `md`: coluna centrada (`max-md:flex-col max-md:items-center max-md:text-center`), a `media` acima do nome e no degrau `2xl` (a peça força o tamanho no telefone pelo slot `page-header-media`), o `back` escondido (`max-md:hidden`). `PageHeaderActions` some abaixo do `md` quando o pai é hero.
  - `PageHeaderHero({ trailing, className, children }: React.ComponentProps<"div"> & { trailing?: string })`, `data-slot="page-header-hero"`, `md:hidden`, centrada; `trailing` é o valor curto que sobe à barra. Exportada de `@/components/ui/page-header`.
  - `useTituloQueSobe` publica `form: "hero"` e o `trailing` da `PageHeaderHero` (lido por contexto) quando o pai é hero.
  - `TopBarPageTitle`: com `dock.form === "hero"`, o lado que sobe mostra **também no telefone** `[media 24] nome [trailing]` (`flex items-center gap-2`, nome `min-w-0 truncate`, media e trailing `shrink-0`, trailing em `text-muted-foreground`). Sem `form`, nada muda.

- [ ] **Step 1: Escrever os testes que falham** em `src/components/ui/page-header-versions.test.ts` (novo `describe("PageHeader phone=hero (26/11/2026)")`):
  - render (`renderToStaticMarkup`) de `<PageHeader phone="hero"><PageHeaderTitleRow media={<span data-x="tile" />}><PageHeaderTitle>Carro</PageHeaderTitle></PageHeaderTitleRow><PageHeaderHero trailing="R$ 4.114">R$ 4.114,39</PageHeaderHero></PageHeader>` contém `data-phone="hero"`, `data-slot="page-header-hero"` com `md:hidden`, e a linha do título com `max-md:flex-col`;
  - `<PageHeader>` sem `phone` não contém `data-phone`;
  - `mesmoTitulo({text:"a",docked:true,trailing:"R$ 1"}, {text:"a",docked:true,trailing:"R$ 2"})` é `false`, e com `form` diferente também `false`;
  - fonte de `top-bar.tsx`: o ramo de `form === "hero"` contém `truncate` no nome e `shrink-0` na mídia e no `trailing`, e o ramo antigo mantém `max-md:hidden` na mídia (Review Focus 1 e 4);
  - fonte de `page-header.tsx`: o `useTituloQueSobe` publica `form` e `trailing` e, no retorno do efeito, `publishPageTitle(doc, null)` (Review Focus 5).
- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run src/components/ui/page-header-versions.test.ts` → FAIL (`phone`/`PageHeaderHero` inexistentes).
- [ ] **Step 3: Implementar** as interfaces acima nos três arquivos. O título no hero do telefone usa o corpo do título da folha (`DialogTitle` da gaveta), não a serifa grande do `collapse`: sob `data-phone=hero`, `max-md:` troca a fonte do `PageHeaderTitle` para `font-heading` com o tamanho do `DialogTitle` (ver `dialog.tsx`).
- [ ] **Step 4: Documentar** — página do `PageHeader` no catálogo ganha a forma hero no `IphoneFrame` (seguindo a forma fixa de `docs/design/COMPONENTE-NOVO.md`), `registry.ts` lista `PageHeaderHero`, `npm run ds:docs-map`, bullet no `AGENTS.md` dentro do item **`PageHeader`** ("`phone="hero"`: abaixo do `md` o topo centrado da gaveta, …"), rodada no histórico.
- [ ] **Step 5: Verificar** — `npx vitest run src/components/ui src/app/designsystem && npx eslint src/components/ui/page-header.tsx src/components/ui/top-bar.tsx src/hooks/use-page-title-dock.ts && npm run ds:audit -- src/components/ui/page-header.tsx src/components/ui/top-bar.tsx` → tudo verde.
- [ ] **Step 6: Commit** — `feat(page-header): a forma hero do telefone, que sobe à barra com ladrilho e valor`.

---

### Task 2: O ⋯ da tela na cápsula da barra, e o título em texto calado sob um hero

**Files:**
- Modify: `src/components/layout/page-chrome-provider.tsx` (slot do menu)
- Modify: `src/components/layout/app-header.tsx` (segundo miolo da cápsula)
- Modify: `src/components/layout/titulo-da-tela.tsx`
- Test: `src/components/layout/page-chrome-menu.test.ts` (novo), `src/components/layout/titulo-da-tela.test.ts`

**Interfaces:**
- Consumes: `data-phone="hero"` da Task 1.
- Produces:
  - `usePageChromeMenu(menu: React.ReactNode | null, enabled?: boolean): void` — publica o nó (memorizado por quem chama) e limpa com `null` ao desmontar; `usePageChromeMenuState(): React.ReactNode | null` para o cabeçalho ler.
  - No `app-header.tsx`, o segundo filho do `TopBarActionGroup` do telefone passa a ser, quando há menu publicado, `<span className="flex">{filtroNoCabecalho}{menu}</span>` (com filtro) ou só o `menu` (sem filtro); sem menu, igual a hoje. O `trailingKey` não muda (o ⋯ nasce parado, sem o gesto).
  - `TituloDaTela`: no telefone, não publica quando existe `[data-slot="page-header"][data-phone="hero"]` no documento (verificado no efeito e a cada rolagem).

- [ ] **Step 1: Testes que falham**:
  - `page-chrome-menu.test.ts` (fonte): o provider exporta `usePageChromeMenu` e `usePageChromeMenuState`; o efeito publica `null` no retorno; o `app-header.tsx` lê `usePageChromeMenuState()` e o põe dentro do `TopBarActionGroup` do `phone`, depois de `filtroNoCabecalho`.
  - `titulo-da-tela.test.ts`: a fonte contém o seletor `[data-slot="page-header"][data-phone="hero"]` numa guarda antes de `publishPageTitle(document, { text: titulo`.
- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run src/components/layout/page-chrome-menu.test.ts src/components/layout/titulo-da-tela.test.ts` → FAIL.
- [ ] **Step 3: Implementar**, no molde do `usePageChromeFilter` (mesmo provider, mesmo padrão de limpeza).
- [ ] **Step 4: Verificar** — `npx vitest run src/components/layout && npx eslint src/components/layout/page-chrome-provider.tsx src/components/layout/app-header.tsx src/components/layout/titulo-da-tela.tsx` → verde.
- [ ] **Step 5: Commit** — `feat(cabecalho): o ⋯ da tela na cápsula do telefone, e o título calado sob um hero`.

---

### Task 3: O detalhe da categoria adota o topo

**Files:**
- Modify: `src/app/(app)/categories/[categoryId]/page-client.tsx` (~linhas 700–760: o `PageHeader` e o `resumo`)
- Modify: `src/components/categories/detail/resumo-do-mes.tsx` (o ramo do telefone)
- Create: `src/components/categories/detail/topo-da-categoria.tsx`
- Test: `src/components/categories/detail/topo-da-categoria.test.ts`

**Interfaces:**
- Consumes: `PageHeader phone="hero"`, `PageHeaderHero` (Task 1); `usePageChromeMenu` (Task 2); `fraseDaComparacao`, `nomeDoMes`, `reaisInteiros` (`regua-do-mes-contas.ts`).
- Produces: `TopoDaCategoria({ tipo, yearMonth, lancado, comparacao }: { tipo: TipoDaCategoria; yearMonth: string; lancado: number; comparacao: Comparacao | null }): JSX.Element` — o conteúdo da `PageHeaderHero`: `MoneyDisplay size="3xl"` do `lancado` e a `Caption` "`Gasto|Recebido` em <mês>" seguida, com `comparacao`, de " · " e a frase (seta e percentual no tom de `frase.bom`, como a `ReguaDoMes`). Também exporta `valorCurto(lancado: number): string` = `reaisInteiros(lancado)`.

- [ ] **Step 1: Testes que falham** (`topo-da-categoria.test.ts`, render):
  - despesa, `lancado: 4114.39`, `comparacao` com frase: contém "R$ 4.114,39", "Gasto em novembro" e a frase;
  - `lancado: 0`, `comparacao: null`: contém "R$ 0,00" e "Gasto em", e **não** contém " · " (Review Focus 2);
  - receita: contém "Recebido em" (Review Focus 3);
  - `valorCurto(4114.39) === "R$ 4.114"`;
  - fonte do `page-client.tsx`: o `PageHeader collapse` não está mais atrás de `isMobile ? null`, leva `phone="hero"` e tem `<PageHeaderHero trailing={valorCurto(`; o ⋯ é publicado com `usePageChromeMenu(` e o `ResumoDoMes` não recebe mais `acoes`.
  - fonte do `resumo-do-mes.tsx`: o ramo do telefone não tem `PageSectionTitle` com "Este mês" nem `MoneyDisplay` do valor; mantém `LinhaDoFechamento` e a barra.
- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run src/components/categories/detail/topo-da-categoria.test.ts` → FAIL.
- [ ] **Step 3: Implementar.** No `page-client.tsx`: o `PageHeader` sempre desenhado, com `phone="hero"`; o ladrilho do `media` como hoje (a peça muda o tamanho no telefone); dentro, `<PageHeaderHero trailing={valorCurto(mes.lancado)}><TopoDaCategoria … comparacao={analise?.comparacao ?? null} /></PageHeaderHero>`; `usePageChromeMenu(isMobile ? abrirMenu : null)` com `abrirMenu` memorizado; o `ResumoDoMes` do telefone sem `acoes`. No `resumo-do-mes.tsx`, o ramo não-`destaque` perde o cabeçalho "Este mês" e o bloco `Caption`+`MoneyDisplay`, e mantém o fechamento, a barra, as frases e o selo do peso. A prop `acoes` sai (e o comentário dela).
- [ ] **Step 4: Verificar** — `npx vitest run src/components/categories src/app && npx tsc --noEmit && npx eslint src/components/categories/detail src/app/\(app\)/categories && npm run ds:audit -- src/app/\(app\)/categories/\[categoryId\]/page-client.tsx src/components/categories/detail` → verde (os erros de `.webp/.png` do `tsc`, se houver num worktree, não contam).
- [ ] **Step 5: Commit** — `feat(categoria): no telefone o detalhe abre com o topo da gaveta, que sobe à barra`.

---

### Task 4: O esqueleto do telefone com o topo

**Files:**
- Modify: `src/components/categories/detail/category-detail-skeleton.tsx` (o bloco da faixa do mês)
- Test: `src/components/categories/detail/category-detail-skeleton.test.ts` (novo)

**Interfaces:**
- Consumes: nada novo.

- [ ] **Step 1: Teste que falha** (fonte): o esqueleto tem, só no telefone (`md:hidden`), um topo centrado com `Skeleton shape="tile" size="2xl"`, um osso do nome, um do valor (`h-10`) e um da legenda; e não tem mais o osso do título "Este mês" (`h-4 w-20`) nem o círculo do ⋯ no telefone.
- [ ] **Step 2: Ver falhar** — `npx vitest run src/components/categories/detail/category-detail-skeleton.test.ts` → FAIL.
- [ ] **Step 3: Implementar**: no telefone, o topo centrado acima do "Deve fechar" e da barra; o desktop não muda (`PageHeaderSkeleton` e a faixa).
- [ ] **Step 4: Verificar** — `npx vitest run src/components/categories && npm run ds:audit -- src/components/categories/detail/category-detail-skeleton.tsx` → verde.
- [ ] **Step 5: Commit** — `fix(esqueletos): o detalhe da categoria no telefone espera com o topo`.

---

### Task 5: Conferir no navegador (controlador)

- [ ] `graphify update .`. Em `localhost:3000`, a 375px: abrir `/categories/<id>?type=expense&month=2026-11` (Carro), conferir o topo centrado (ladrilho 44, nome, valor, legenda), rolar até o nome passar sob a barra e ver `[ladrilho] Carro R$ 4.114` no centro e `[⌕|▦|⋯]` à direita; o ⋯ abre Editar/Excluir; voltar ao topo desce o título. Uma receita e uma categoria de nome longo. A 1280px: o desktop igual ao de antes. Transações a 375px: a barra rolada só com texto.
