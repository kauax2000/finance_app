# Animações do cabeçalho do telefone — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No telefone, os botões do cabeçalho trocam de tela como líquido (B) e a busca sem filtro abre com a lupa virando o campo e o × pingando dela (C).

**Architecture:** Cada rota declara o filtro do cabeçalho (`mobileHeaderFilterFor`), e o `AppHeader` desenha a forma pelo `pathname`, com a publicação da página preenchendo o resto. O movimento mora no design system: duas peças novas do `TopBar` (`TopBarActionSwap`, o vidro que fica e o miolo que troca; `TopBarActionGroup morph`, o filtro que pinga da lupa) e um ramo novo do `CommandDialog` (sem `closeOrigin` colado). Todo gesto é um progresso só, com uma função de quadro **pura** (testada em node) e um desenho que escreve só nos vidros e nos filhos deles.

**Tech Stack:** Next.js (App Router), React 19, `motion/react` (`animate`, `useReducedMotion`), Tailwind v4, vitest (ambiente `node`: só funções puras e leitura de fonte).

**Spec:** [`docs/superpowers/specs/2026-10-20-animacoes-do-header-design.md`](../specs/2026-10-20-animacoes-do-header-design.md). Protótipos de referência: [`docs/superpowers/specs/2026-10-20-animacoes-do-header/`](../specs/2026-10-20-animacoes-do-header/) (`prototipo-troca-de-tela.html`, função `formas` da variante `b`; `prototipo-busca-sem-filtro.html`, função `quadro` da variante `c`).

## Global Constraints

- Só o telefone (`max-md`). Do `md` para cima nada muda.
- Com `useReducedMotion()` verdadeiro: troca na hora, nenhum estilo inline sobra.
- Montar não anima: o primeiro render de cada peça desenha o estado final.
- Interromper segue do progresso atual até o novo destino (o padrão do `progresso` do `CommandDialog`).
- Nenhum `transform`, `filter`, `opacity` animado ou `clip-path` num **ancestral** de um vidro (`backdrop-filter`). Escreve-se nos vidros e nos filhos deles. No fim do gesto, nada inline.
- Molas: troca de tela na `MOLA` (300/25); busca abre na `SEPARACAO` (180/22) e fecha na `VOLTA_DA_PILULA` (260ms), todas de `src/lib/spring.ts` / `command.tsx`. Sem número de mola novo.
- `suave(x, [de, ate])` é o smoothstep que já existe em `command.tsx`; mova-o para `src/lib/header-morph.ts` e importe nos dois lugares (um só).
- Comentários em português, no tom dos arquivos vizinhos. Heroicons só. Zero cor ou medida crua em classe (tokens). Nenhum `cva` fora de `ui/`.
- `src/components/ui/`, `src/app/globals.css` e `src/app/designsystem/` pedem confirmação do harness: o pedido do dono cobre o que este plano descreve, e nada além.
- Verificação de cada tarefa: `npx tsc --noEmit && npm run lint && npm run test:unit`. Prévia: `preview_start {name: "dev-attach"}` (o `next dev` já roda em :3000 fora da sessão), a 375×812 (`resize_window preset: "mobile"`). O banco é o de produção: **não gravar dados** (só navegar e abrir a busca).
- Nada aqui é mudança de jornada: `docs/JORNADAS.md` e o Atlas não mudam.

## Review Focus

1. **Navegar de novo no meio do gesto** (tocar Painel → Transações → Minha conta rápido): cada peça segue do quadro atual, sem salto, e termina no estado da última tela. → teste de fonte nas Tarefas 3 e 4 (a animação parte do progresso guardado) + conferência na prévia na Tarefa 5.
2. **Abrir a busca com o filtro ainda pingando**: o `CommandDialog` decide "colado" pelas caixas de **layout** (`offsetLeft`/`offsetWidth`), não pelas pintadas, e não herda um `transform` em voo. → teste de fonte na Tarefa 6.
3. **Mesma rota, filtro que liga e desliga** (`/categories`, aba Despesas ↔ Receitas, `enabled: filterType === "expense"`): a publicação `null` vence a declaração e a cápsula reabsorve o filtro. → teste puro na Tarefa 1 (`filtroDoCabecalho`).
4. **Tocar o filtro antes de a página publicar**: o botão declarado existe e não faz nada (sem erro, sem folha vazia). → teste puro na Tarefa 1 + caso na Tarefa 5.
5. **Desktop com a árvore do telefone escondida** (`hidden max-md:contents`): as peças não animam nem medem caixa de 0; nada quebra ao redimensionar através de 768px. → guarda "só anima com caixa" testada por fonte nas Tarefas 3 e 4.

---

### Task 1: O filtro do cabeçalho pela rota

**Files:**
- Modify: `src/config/mobile-navigation.ts` (ao fim)
- Modify: `src/components/layout/page-chrome-provider.tsx`
- Test: `src/config/mobile-navigation.test.ts`, Create: `src/components/layout/page-chrome-filter.test.ts`

**Interfaces:**
- Produces:
  - `export type MobileHeaderFilterIcon = "month" | "filter"`
  - `export function mobileHeaderFilterFor(pathname: string): MobileHeaderFilterIcon | null` — `/dashboard`, `/categories` e `/categories/<id>` (não `/categories/new`) → `"month"`; `/transactions`, `/bills` → `"filter"`; o resto → `null`.
  - `export function filtroDoCabecalho(declarado: MobileHeaderFilterIcon | null, publicado: PageChromeFilter | null | undefined): PageChromeFilter | null` (em `page-chrome-provider.tsx`): `publicado !== undefined` → `publicado` (vence, inclusive `null`); senão, com `declarado`, um filtro inerte `{ label: "Filtros" | "Mês", active: false, disabled: true, icon: declarado }`; senão `null`.
  - `export function usePageChromeFilterFor(pathname: string): PageChromeFilter | null | undefined` — `undefined` enquanto a página de `pathname` não falou.
  - `usePageChromeFilter(filter, enabled)` passa a publicar **sempre** com o `pathname` (de `usePathname()`): `enabled` falso publica `{ pathname, filter: null }`; a limpeza ao desmontar publica `{ pathname: <o da montagem>, filter: null }`. O estado do provider vira `{ pathname: string; filter: PageChromeFilter | null } | null`. `usePageChromeFilterState` sai (o único consumidor é o `AppHeader`, que passa ao `usePageChromeFilterFor` na Tarefa 5).

- [ ] **Step 1: Testes que falham**

Em `mobile-navigation.test.ts`, `describe("o filtro do cabeçalho pela rota")`:
```ts
expect(mobileHeaderFilterFor(ROUTES.DASHBOARD)).toBe("month")
expect(mobileHeaderFilterFor(ROUTES.DASHBOARD_CATEGORIES)).toBe("month")
expect(mobileHeaderFilterFor(`${ROUTES.DASHBOARD_CATEGORIES}/abc`)).toBe("month")
expect(mobileHeaderFilterFor(`${ROUTES.DASHBOARD_CATEGORIES}/new`)).toBeNull()
expect(mobileHeaderFilterFor(ROUTES.TRANSACTIONS)).toBe("filter")
expect(mobileHeaderFilterFor(ROUTES.BILLS)).toBe("filter")
expect(mobileHeaderFilterFor(ROUTES.ACCOUNT)).toBeNull()
```
E `it("a tabela concorda com as telas que publicam filtro")`: varre `src/app/(app)/**/page-client.tsx` (`arquivosTsx` de `src/test/fonte.ts`), toma os que contêm `useMonthInHeader(` (→ `"month"`), `<BillsToolbar` (→ `"filter"`) ou `<TransactionsToolbar` sem `headerFilter={false}` (→ `"filter"`); converte o caminho em rota (tira `src/app/(app)`, `/page-client.tsx`, grupos `(…)`, e `[x]` vira `abc`) e espera `mobileHeaderFilterFor(rota)` igual ao ícone. Se um arquivo tiver `useMonthInHeader(` **e** `<TransactionsToolbar` sem `headerFilter={false}`, o teste falha (dois filtros numa tela).

Em `page-chrome-filter.test.ts`:
```ts
const pub = { label: "Filtros", active: true, icon: "filter" as const }
expect(filtroDoCabecalho("month", undefined)).toEqual({ label: "Mês", active: false, disabled: true, icon: "month" })
expect(filtroDoCabecalho("filter", undefined)).toEqual({ label: "Filtros", active: false, disabled: true, icon: "filter" })
expect(filtroDoCabecalho("month", null)).toBeNull()          // a aba Receitas desliga
expect(filtroDoCabecalho("month", pub)).toBe(pub)            // a publicação vence
expect(filtroDoCabecalho(null, pub)).toBe(pub)
expect(filtroDoCabecalho(null, undefined)).toBeNull()
```
O filtro inerte não tem `onOpen` nem `popover` (`expect(...).not.toHaveProperty("onOpen")`).

- [ ] **Step 2:** `npx vitest run src/config/mobile-navigation.test.ts src/components/layout/page-chrome-filter.test.ts` → FAIL (funções inexistentes).
- [ ] **Step 3:** Implementar `mobileHeaderFilterFor` (com `ROUTES` de `@/config/navigation`), `filtroDoCabecalho`, o estado `{ pathname, filter }` e `usePageChromeFilterFor`. O comentário do tipo explica por que a rota declara (o filtro chega até ~700ms depois, atrás do `AdiarMontagem`).
- [ ] **Step 4:** Mesma linha do Step 2 → PASS; depois a verificação global (o `tsc` acusa o `AppHeader`, que ainda usa `usePageChromeFilterState`: troque ali, nesta tarefa, por `filtroDoCabecalho(mobileHeaderFilterFor(pathname), usePageChromeFilterFor(pathname))`, sem mexer em mais nada do cabeçalho).
- [ ] **Step 5:** Commit `feat(header): o filtro do cabeçalho do telefone se declara pela rota`.

### Task 2: As funções de quadro da troca de tela

**Files:**
- Create: `src/lib/header-morph.ts`
- Modify: `src/components/ui/command.tsx` (o `suave` passa a vir daqui)
- Test: Create `src/lib/header-morph.test.ts`

**Interfaces:**
- Produces:
  - `export const suave: (x: number, faixa: readonly [number, number]) => number` (o mesmo de hoje).
  - `export type IconeEmVoo = { opacidade: number; escala: number; desfoque: number }`
  - `export function quadroDaTroca(p: number, afundar: boolean): { escala: number; sai: IconeEmVoo; entra: IconeEmVoo }` — `s = suave(p, [0, 0.55])`: `sai = { 1 − s, 1 − 0,3·s, 4·s }`; `e = suave(p, [0.2, 0.8])`: `entra = { e, 0,7 + 0,3·e, 4·(1 − e) }`; `escala = afundar ? 1 − 0,14·sen(π·clamp(p, 0, 1)) : 1`.
  - `export function quadroDaGotaDoFiltro(g: number): { lupaDx: number; gota: { cx: number; r: number }; cintura: number; icone: IconeEmVoo }` — coordenadas na caixa final da cápsula (lupa `[0, 44]`, filtro `[44, 88]`), R = 22: `lupaDx = 44·(1 − min(max(g, 0), 1,05))`; `r = 22·(0,3 + 0,7·suave(g, [0, 0.7]))`; `cx = lerp(lupaDx + 24, 66, suave(g, [0, 0.8]))`; `cintura = suave(g, [0.55, 1])`; `icone` com `o = suave(g, [0.4, 0.95])`: `{ o, 0,7 + 0,3·o, 4·(1 − o) }`. Exportar também `GOTA_R = 22` e `GOTA_H = 44`.

- [ ] **Step 1: Testes que falham** (`header-morph.test.ts`):
```ts
expect(quadroDaTroca(0, true)).toEqual({ escala: 1, sai: { opacidade: 1, escala: 1, desfoque: 0 }, entra: { opacidade: 0, escala: 0.7, desfoque: 4 } })
expect(quadroDaTroca(0.5, true).escala).toBeCloseTo(0.86, 6)
expect(quadroDaTroca(0.5, false).escala).toBe(1)
const fim = quadroDaTroca(1, true)
expect(fim.escala).toBeCloseTo(1, 9); expect(fim.sai.opacidade).toBe(0); expect(fim.entra).toEqual({ opacidade: 1, escala: 1, desfoque: 0 })
expect(quadroDaTroca(1.03, true).escala).toBeCloseTo(1, 9)   // o passe da mola não afunda de novo
const g0 = quadroDaGotaDoFiltro(0)
expect(g0.lupaDx).toBe(44); expect(g0.gota.r).toBeCloseTo(6.6, 6); expect(g0.gota.cx).toBe(68); expect(g0.cintura).toBe(0); expect(g0.icone.opacidade).toBe(0)
const g1 = quadroDaGotaDoFiltro(1)
expect(g1.lupaDx).toBe(0); expect(g1.gota).toEqual({ cx: 66, r: 22 }); expect(g1.cintura).toBe(1); expect(g1.icone.opacidade).toBe(1)
```
E `it("a gota nunca passa da borda direita da cápsula, e a lupa só anda para a esquerda")`: para `g` de 0 a 1,05 em passos de 0,01, `gota.cx + gota.r <= 88 + 1e-9` e `lupaDx` não cresce.
E `it("o suave é um só")`: `semComentarios(lerFonte("src/components/ui/command.tsx"))` não contém `const suave =`, e contém `from "@/lib/header-morph"`.
- [ ] **Step 2:** `npx vitest run src/lib/header-morph.test.ts` → FAIL.
- [ ] **Step 3:** Implementar; `command.tsx` importa `suave` (as constantes `PINCA` etc. continuam lá).
- [ ] **Step 4:** Mesma linha → PASS; `npx vitest run src/components/ui/command-versions.test.ts` → PASS (o `quadroDasBolhas` não mudou de comportamento).
- [ ] **Step 5:** Commit `feat(header-morph): os quadros puros da troca de tela`.

### Task 3: `TopBarActionSwap` — o vidro que fica, o miolo que troca

**Files:**
- Modify: `src/components/ui/top-bar.tsx`, `src/components/ui/page-header.tsx` (só se o `PageHeaderBack` precisar ler o contexto), `src/app/designsystem/docs/top-bar.tsx`, `src/app/designsystem/registry.ts` (a lista de peças do `entry("top-bar", …)`)
- Test: `src/components/ui/top-bar-versions.test.ts`

**Interfaces:**
- Consumes: `quadroDaTroca` (Tarefa 2), `MOLA`.
- Produces: `TopBarActionSwap({ swapKey: string; className?: string; children: React.ReactNode })`, exportado de `top-bar.tsx`. Ele **é** o vidro: um `span` `data-slot="top-bar-action-swap"` com o `TOP_BAR_PLATE`, `size-11`, `rounded-full`, `relative`, e o filho dentro. Um `TopBarAction` ou um `PageHeaderBack` filho **não** desenha o próprio vidro (o `TopBarAction` lê um contexto `TopBarSwapContext` e ignora `plate`; quem passa `topBarPlateClassName` ao voltar para de passar na Tarefa 5). Quando `swapKey` muda (nunca na montagem), o filho que sai fica montado por cima, `aria-hidden`, `inert` e `pointer-events-none`, até o gesto acabar; o que entra já é o interativo e recebe o foco se o que saiu o tinha. Um progresso `p` de 0 a 1 na `MOLA` escreve `quadroDaTroca(p, true)`: `escala` no `span` (o próprio vidro, `transform: scale()`), `sai`/`entra` em `opacity`, `scale` e `filter: blur()` dos dois miolos (filhos do vidro). No fim, nada inline e o miolo velho desmonta. Uma troca nova no meio parte do `p` atual guardado num ref (o miolo velho que está saindo é trocado pelo que estava entrando). Sem caixa (`offsetWidth === 0`, a árvore do telefone escondida) ou com movimento reduzido: troca na hora.

- [ ] **Step 1: Testes de fonte que falham** (`describe("TopBarActionSwap")` em `top-bar-versions.test.ts`, lendo `CODIGO`): a função existe e é exportada; o bloco dela contém `quadroDaTroca(`, `MOLA`, `useReducedMotion`, `inert`, `aria-hidden`, `offsetWidth` (a guarda de caixa) e um `useRef` do progresso usado como ponto de partida do `animate(` (`/animate\(\s*\w+\.current/`); e **não** contém `useEffect(` com `swapKey` que anime na montagem — exija um ref "já montou" (`/montou|primeiro/`). O `TopBarAction` contém `TopBarSwapContext`.
- [ ] **Step 2:** `npx vitest run src/components/ui/top-bar-versions.test.ts` → FAIL.
- [ ] **Step 3:** Implementar a peça e o contexto. O alvo de toque segue 44 (o filho já é `max-md:size-11`). A contagem do sino (`top-bar-action-count`) sai junto com o miolo do sino.
- [ ] **Step 4:** Página do catálogo: em `docs/top-bar.tsx`, uma seção "Troca no mesmo vidro" com um `Preview` que alterna sino ↔ voltar por um botão (`Toggle` fantasma nos `Controles`, como as outras seções) e o código de uso; nota de que montar não anima e de que movimento reduzido troca na hora. Atualizar a lista de peças no `registry.ts` e rodar `npm run ds:docs-map`.
- [ ] **Step 5:** Mesma linha do Step 2 → PASS; verificação global; na prévia em `/designsystem/top-bar` a 375px, alternar e conferir com câmera lenta (`document.getAnimations` não serve: é `animate` de número; use screenshots em sequência) o afundar e a troca do ícone.
- [ ] **Step 6:** Commit `feat(top-bar): TopBarActionSwap, o vidro que fica e o miolo que troca`.

### Task 4: `TopBarActionGroup morph` — o filtro pinga da lupa

**Files:**
- Modify: `src/components/ui/top-bar.tsx`, `src/app/designsystem/docs/top-bar.tsx`
- Test: `src/components/ui/top-bar-versions.test.ts`

**Interfaces:**
- Consumes: `quadroDaGotaDoFiltro`, `quadroDaTroca`, `GOTA_R` (Tarefa 2), `MOLA`.
- Produces: `TopBarActionGroup` ganha `morph?: boolean` e, com ele, aceita **um ou dois** filhos e `trailingKey?: string` (a identidade do segundo: `"month"`/`"filter"`, ou ausente sem ele). Com um filho, é o círculo do primeiro; com dois, a cápsula de hoje. Sem `morph`, nada muda.
  - **Entrar** (o segundo aparece): `g` de 0 a 1 na `MOLA`, `quadroDaGotaDoFiltro(g)` escrito nos dois vidros: a lupa (o primeiro) `translateX(lupaDx)`; o segundo é a gota — o próprio vidro dele em `translate`/`scale` até `cx`/`r`, recortado onde cairia dentro da lupa (vidro sobre vidro não pinta), com a cintura feita pelos cantos de dentro dos dois (a técnica da `emenda` de `desenharBolhas`: raio `R` com a gota solta, 0 com `cintura` 1, a costura num pixel do aparelho). O anel do grupo some no voo e a silhueta vem da tinta do voo (o `TINTA_DO_VOO` do `command.tsx`, exportado e reusado). O ícone do segundo usa `icone`.
  - **Sair** (o segundo some): o grupo segura o segundo montado (`inert`, `aria-hidden`) e roda `g` de 1 a 0; ao fim desmonta.
  - **Trocar o segundo** (`trailingKey` muda com os dois presentes): sem mexer na forma, o miolo do segundo troca por `quadroDaTroca(p, false)`, como o `TopBarActionSwap` (pode reusar a peça por dentro).
  - Interromper parte do `g` guardado; montar não anima; sem caixa ou com movimento reduzido, na hora; no fim, nada inline.

- [ ] **Step 1: Testes de fonte que falham** (`describe("TopBarActionGroup morph")`): o bloco do `TopBarActionGroup` contém `morph`, `trailingKey`, `quadroDaGotaDoFiltro(`, `inert`, `offsetWidth`, `useReducedMotion`, e o `animate(` parte de um ref (`/animate\(\s*\w+\.current/`); o `TINTA_DO_VOO` é importado de `command.tsx` ou de `header-morph.ts`, nunca redeclarado (`top-bar.tsx` não contém `TINTA_DO_VOO =`). E a regra de sempre: o bloco não escreve `transform`/`clipPath` no `data-slot="top-bar-action-group"` (só nos filhos): `not.toMatch(/grupo\w*\.style\.(transform|clipPath|filter)/)` — nomeie o ref do grupo com `grupo`.
- [ ] **Step 2:** `npx vitest run src/components/ui/top-bar-versions.test.ts` → FAIL.
- [ ] **Step 3:** Implementar. A ordem continua `[lupa | filtro]`, e a ponta direita da cápsula fica parada (é o mesmo pixel da lupa sozinha).
- [ ] **Step 4:** Catálogo: na seção do `TopBarActionGroup` de `docs/top-bar.tsx`, um `Preview` com `morph` e três estados (só a lupa, lupa + mês, lupa + ajustes) nos `Controles`; nota curta: "o filtro pinga do flanco da lupa e a cintura se enche; ao sair, afina e é reabsorvido".
- [ ] **Step 5:** Mesma linha do Step 2 → PASS; verificação global; prévia em `/designsystem/top-bar` a 375px: screenshots em g ≈ 0,25 / 0,5 / 0,75 / 1 (câmera lenta: um `?lento` só no catálogo não; use o `Preview` e tire em sequência) e compare com a variante B de `prototipo-troca-de-tela.html` aberta lado a lado (o arquivo funciona sozinho no navegador, sem o servidor do brainstorming; o botão "Gostei deste" não faz nada fora dele).
- [ ] **Step 6:** Commit `feat(top-bar): o filtro pinga da lupa na cápsula (morph)`.

### Task 5: O `AppHeader` consome as peças

**Files:**
- Modify: `src/components/layout/app-header.tsx`
- Test: Modify `src/components/layout/app-header-voce.test.ts` (ou crie `app-header-morph.test.ts`)

**Interfaces:**
- Consumes: `filtroDoCabecalho`, `mobileHeaderFilterFor`, `usePageChromeFilterFor` (Tarefa 1); `TopBarActionSwap` (Tarefa 3); `TopBarActionGroup morph trailingKey` (Tarefa 4).

- [ ] **Step 1: Teste de fonte que falha:** o `app-header.tsx` contém `<TopBarActionSwap swapKey={mobileBackHref ? "voltar" : "sino"}>` (ou equivalente com as duas chaves), `<TopBarActionGroup morph` com `trailingKey`, e não contém mais `topBarPlateClassName` nem o ternário `filtroNoCabecalho ? (<TopBarActionGroup>` (a lupa sozinha fora do grupo). O `inset-x-28`/`inset-x-16` do título continua lendo o filtro efetivo.
- [ ] **Step 2:** `npx vitest run src/components/layout/` → FAIL.
- [ ] **Step 3:** A ponta esquerda do `phone` vira `TopBarActionSwap` em volta do voltar ou do sino; a direita, sempre `<TopBarActionGroup morph trailingKey={filtro?.icon ?? undefined}>{lupa(true)}{filtroNoCabecalho}</TopBarActionGroup>`. O filtro inerte (declarado, sem publicação) é um `TopBarAction` `disabled`: tocar não abre nada. O `filtroRef` continua no botão do filtro (origem do × da busca).
- [ ] **Step 4:** Verificação global → PASS. Prévia `dev-attach` a 375px, logado (se a prévia não tiver sessão, diga isso no relatório e faça só o catálogo): Painel → Transações (cápsula fica, ícone troca), Transações → Minha conta pelo Você (sino → voltar, filtro reabsorvido), Minha conta → Categoria e voltar; tocar rápido duas telas seguidas (Review Focus 1); na aba Receitas de Categorias o filtro sai (Review Focus 3); recarregar o Painel não anima nada. `read_console_messages onlyErrors` vazio.
- [ ] **Step 5:** Commit `feat(header): o cabeçalho do telefone troca de tela como líquido`.

### Task 6: A busca sem filtro — a lupa vira o campo, o × pinga dela

**Files:**
- Modify: `src/components/ui/command.tsx` (o ramo de `CommandDialog` sem `colado`), `src/app/designsystem/docs/command.tsx` (as duas descrições que dizem "a pílula brota do flanco dela")
- Test: `src/components/ui/command-versions.test.ts`

**Interfaces:**
- Consumes: `suave` (Tarefa 2), `SEPARACAO`, `VOLTA_DA_PILULA`.
- Produces: `export function quadroDaGota(m: { lupa: Caixa; pilula: Caixa; x: Caixa; dpr: number }, p: number): { esquerda: number; direita: number; gota: { cx: number; r: number }; vao: number; lupaX: number; lupaTroca: number; icone: number; conteudo: number }` (exportada junto do `quadroDasBolhas` no bloco de exports do fim), em coordenadas de tela, R = `pilula.height / 2`:
  - `esquerda = lerp(lupa.left, pilula.left, min(p / 0.7, 1) + max(0, p − 1))` (o protótipo usava `min(p / 0.7, 1.02)`, que repousava 6px além da calha; o passe vem só da mola)
  - `direita = lerp(lupa.right, pilula.right, suave(p, [0.15, 0.75]))`
  - `g = suave(p, [0.45, 1])`; `r = R·min(1, 0.35 + g)`; `cx = lerp(direita − R, x.left + R, g)`
  - `vao = max(0, (cx − r) − direita)`; `lupaX = esquerda + R`; `lupaTroca = suave(p, [0.5, 0.8])`; `icone = suave(p, [0.7, 1])`; `conteudo = suave(p, [0.55, 0.85])`
  - O ramo `!colado` do efeito do `CommandDialog` usa `quadroDaGota` e um `desenharGota(...)` novo no lugar do `broto` do `quadroDasBolhas`: a pílula anda por `translateX(direita − pilula.right)` e recorta da esquerda até `esquerda`; o fantasma da lupa (`command-search-origin`, que hoje só o caso colado usa) anda com `lupaX` e esmaece por `lupaTroca`; o × é a gota (`translate`/`scale` até `cx`/`r`), recortado onde cairia dentro da pílula, com a cintura pelos cantos de dentro (a mesma técnica da `emenda`); o X acende por `icone`; o fantasma do × (`command-search-cancel-origin`) fica vazio. A placa despausa quando `vao > 0`. Fechar é o mesmo quadro de `progresso.current` a 0 na `VOLTA_DA_PILULA`. O caso `colado` não muda uma linha.
  - Do `quadroDasBolhas`, o `broto` e o `emenda0` saem (o caso sozinho não passa mais por ele); o teste `sozinha` e os laços `for (const m of [capsula, sozinha])` passam a só `capsula`.

- [ ] **Step 1: Testes que falham** (`describe("sem filtro: a lupa vira o campo e o × pinga dela")`, com as caixas do teste atual: `lupa = caixa(315, 359)`, `pilula = caixa(16, 307)`, `x = caixa(315, 359)`):
```ts
const m = { lupa: caixa(315, 359), pilula, x, dpr: 3 }
const f0 = quadroDaGota(m, 0)
expect(f0.esquerda).toBe(315); expect(f0.direita).toBe(359)
expect(f0.gota.r).toBeCloseTo(7.7, 6); expect(f0.gota.cx).toBe(337)
expect(f0.vao).toBe(0); expect(f0.icone).toBe(0); expect(f0.conteudo).toBe(0)
const f1 = quadroDaGota(m, 1)
expect(f1.esquerda).toBe(16); expect(f1.direita).toBe(307)
expect(f1.gota).toEqual({ cx: 337, r: 22 }); expect(f1.vao).toBe(8)
expect(f1.icone).toBe(1); expect(f1.conteudo).toBe(1)
```
`it("a gota nunca passa do lugar do ×, e o vão só abre")`: `p` de 0 a 1,05 por 0,01 → `gota.cx + gota.r <= x.right + 0.5`, `vao` não decresce, `esquerda` não cresce. `it("na SEPARACAO repousa em até 700ms")` com o gerador `spring` do `motion`, como o teste existente. E de fonte (Review Focus 2): no bloco do efeito, a decisão `colado` usa caixas de layout (`offsetLeft` e `offsetWidth` do filtro e da lupa, ou um `getBoundingClientRect` com o `transform` zerado antes), não o retângulo pintado em voo.
- [ ] **Step 2:** `npx vitest run src/components/ui/command-versions.test.ts` → FAIL.
- [ ] **Step 3:** Implementar; atualizar o comentário do `closeOrigin` e o do efeito ("sem filtro, o círculo da lupa vira o campo e o × pinga da ponta dele").
- [ ] **Step 4:** Mesma linha → PASS (incluindo os testes antigos do caso `capsula`); verificação global; prévia a 375px numa tela sem filtro (Minha conta, ou `/designsystem/command` com a janela estreita e uma origem): screenshots em p ≈ 0,25 / 0,5 / 0,75 / 1 comparados com a variante C de `prototipo-busca-sem-filtro.html`; abrir e fechar no meio; numa tela com filtro, conferir que a divisão em duas bolhas segue igual.
- [ ] **Step 5:** Commit `feat(busca): sem filtro, a lupa vira o campo e o × pinga dela`.

### Task 7: O registro na mesma mudança

**Files:**
- Modify: `AGENTS.md`, `docs/design/HISTORICO-DESIGN-SYSTEM.md`

- [ ] **Step 1:** `AGENTS.md`: no bullet do `Command`, trocar "sem filtro colado, a lupa vira o × e a pílula brota do flanco dela" por "sem filtro colado, o círculo da lupa vira o campo e o × pinga da ponta dele, na mesma mola (`quadroDaGota`)"; no bullet do `TopBar`, citar `TopBarActionSwap` (o vidro fica, o miolo troca; o sino ↔ voltar) e `TopBarActionGroup morph` (o filtro pinga da lupa), e que a forma do cabeçalho do telefone vem de `mobileHeaderFilterFor` (a rota declara o filtro; a publicação da página vence).
- [ ] **Step 2:** `HISTORICO-DESIGN-SYSTEM.md`: `### Rodada 349 — o cabeçalho do telefone troca de tela como líquido`, depois da 348, no formato das vizinhas: o pedido, as variantes comparadas (A/B/C em cada gesto), o escolhido, a decisão da rota declarar o filtro (o atraso de ~700ms do `AdiarMontagem`), e o que foi medido nas prévias.
- [ ] **Step 3:** `npx tsc --noEmit && npm run lint && npm run test:unit` → PASS; `npm run ds:audit -- src/components/layout/app-header.tsx src/components/ui/top-bar.tsx` sem violação nova.
- [ ] **Step 4:** Commit `docs(header): AGENTS e rodada 349 das animações do cabeçalho`.
