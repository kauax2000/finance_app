# Header por trás da barra lateral — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No desktop, a barra do topo do app corre a tela inteira por baixo da `Sidebar floating`, e a busca é o `TopBarSearch` do catálogo, com brilho, centrada.

**Architecture:** O `SidebarProvider` publica a folga da barra em `--sidebar-gap`; o `SidebarInset` (ao lado do `floating`, não redimensionável) vira contexto de empilhamento e reposiciona o `TopBar` filho direto — margem negativa da folga, `padding` que a devolve. O `AppHeader` passa a três colunas no `lg`: título · busca centrada · sino.

**Tech Stack:** Next.js (App Router), React 19, Tailwind v4, Vitest (testes de fonte com `lerFonte`).

**Spec:** `docs/superpowers/specs/2026-10-16-header-por-tras-da-barra-design.md`

## Global Constraints

- Tokens e utilitários do sistema só; nada de `#hex`, `100vw`, `rounded-[…]` nem número de camada novo.
- `src/components/ui/` exige autorização: o dono autorizou esta mudança em `sidebar.tsx`. Nenhum outro arquivo de `ui/` muda.
- O `TopBar` (`src/components/ui/top-bar.tsx`) não muda.
- Altura da barra: 48 (`size="sm"`, o padrão). Busca: `collapse="lg"`, `glow`, coluna `max-w-sm` (384px). Texto: `Buscar telas e ações…`.
- O telefone (abaixo de `md`) não muda: título, recorte de tempo, lupa, sino, nessa ordem e a 4px entre os três da direita.
- Comentários e textos em português, no estilo do arquivo vizinho.
- Antes de cada commit: `npx tsc --noEmit && npm run lint && npm run test:unit` verdes.
- Não adicionar ao commit `src/app/designsystem/docs/showcase.tsx` nem `docs/superpowers/plans/2026-10-16-parcelas-no-telefone.md` (trabalho alheio na árvore).
- Dev server: o do dono em :3000 (`preview_start` com `dev-attach`). O banco é o de produção: não gravar dados.

## Review Focus

1. **Recolher e abrir a barra (⌘B ou a alça da borda)**: o título da barra anda junto com a página, sem salto — `margin`/`padding` transicionam na curva da folga. (Task 1, passo de verificação ao vivo.)
2. **Espiar a barra recolhida** (passar o mouse no trilho): a folga fica a do trilho (a placa abre por cima), e o título não anda. (Task 1, asserção do `data-peek` + verificação.)
3. **Barra de seleção do `DataTable`** (Transações, marcar linhas) a 1024px: com o `isolate`, ela fica abaixo da placa onde as duas se cruzam — conferir que não se cruzam. (Task 1, verificação ao vivo.)
4. **Faixa offline** (`OfflineBanner`, montada fora do `SidebarInset`): continua por cima da barra e da placa. (Task 1, asserção de que o `isolate` está só no `SidebarInset`.)
5. **Prévias do catálogo** com `SidebarProvider` numa caixa (`/designsystem/sidebar`, `/designsystem/top-bar`): a barra não escapa da prévia. (Task 3, verificação ao vivo.)

---

### Task 1: `Sidebar` — a barra do topo passa por trás da placa

**Files:**
- Modify: `src/components/ui/sidebar.tsx` (o `casca.className` do `SidebarProvider`, ~linha 268; as constantes antes de `SidebarInset`, ~linhas 872–896; o ramo não redimensionável de `SidebarInset`, ~linhas 950–965)
- Test: `src/components/ui/sidebar-versions.test.ts`

**Interfaces:**
- Produces: a variável CSS `--sidebar-gap` no `[data-slot=sidebar-wrapper]` (só a partir de `md`), e o contrato "um `[data-slot=top-bar]` filho direto do `SidebarInset`, ao lado de `floating`, ocupa da borda esquerda da janela à direita, com o conteúdo na coluna". Task 2 depende disso só visualmente.

- [ ] **Step 1: Write the failing test** — em `sidebar-versions.test.ts`, dentro de `describe("as versões do Sidebar")`:

```ts
it("ao lado do floating, a barra do topo passa por trás da placa", () => {
  // A folga é variável do invólucro, nos três estados e espiando.
  expect(CODIGO).toContain("md:[--sidebar-gap:var(--sidebar-width)]")
  expect(CODIGO).toContain("md:has-[[data-slot=sidebar][data-collapsible=offcanvas]]:[--sidebar-gap:0px]")
  expect(CODIGO).toContain(
    "md:has-[[data-slot=sidebar][data-collapsible=icon]]:[--sidebar-gap:calc(var(--sidebar-width-icon)+(--spacing(4)))]"
  )
  expect(CODIGO).toContain(
    "md:has-[[data-slot=sidebar][data-peek]]:[--sidebar-gap:calc(var(--sidebar-width-icon)+(--spacing(4)))]"
  )
  // A barra recua pela folga e a devolve como padding, na curva da folga.
  const F = "md:group-has-[[data-slot=sidebar][data-variant=floating]]/sidebar-wrapper:"
  expect(CODIGO).toContain(F + "isolate")
  expect(CODIGO).toContain(F + "[&>[data-slot=top-bar]]:-ms-(--sidebar-gap)")
  expect(CODIGO).toContain(F + "[&>[data-slot=top-bar]]:w-auto")
  expect(CODIGO).toContain(F + "[&>[data-slot=top-bar]]:ps-[calc(var(--sidebar-gap)+--spacing(4))]")
  expect(CODIGO).toContain(
    F + "[&>[data-slot=top-bar]]:transition-[background-color,border-color,translate,margin,padding]"
  )
  // Uma vez só (o ramo não redimensionável): no redimensionável o painel recorta.
  expect([...CODIGO.matchAll(/SIDEBAR_INSET_BEHIND,/g)]).toHaveLength(1)
  // Sem `100vw`: nas prévias do catálogo `vw` é a janela, não a caixa.
  expect(CODIGO).not.toContain("100vw")
})
```

E ajuste o teste "17. o fio do cabeçalho é da variante, e não da tela": mantenha as três asserções e acrescente `expect([...CODIGO.matchAll(/SIDEBAR_INSET_RULE,/g)]).toHaveLength(1)` (só o redimensionável zera o fio).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ui/sidebar-versions.test.ts`
Expected: FAIL nas asserções novas (`--sidebar-gap` não existe; `SIDEBAR_INSET_RULE,` aparece 2 vezes).

- [ ] **Step 3: Implement**

  - No `className` da `casca` do `SidebarProvider`, acrescente as quatro classes `md:[--sidebar-gap:…]` exatamente como no teste (comentário: a folga que a barra reserva, para quem passa por trás dela; espiando, a do trilho, porque a placa abre por cima). Confirme que `data-collapsible` e `data-peek` estão no mesmo nó que `data-slot="sidebar"` (estão, ~linha 568).
  - Nova constante `SIDEBAR_INSET_BEHIND` (string, ao lado de `SIDEBAR_INSET_BAR`) com as cinco classes `F + …` do teste. A duração e a curva já são as da folga no próprio `TopBar` (`--duration-slow`, `--ease-emphasized`); só a lista de propriedades ganha `margin,padding`. Comentário: por que `isolate` (a placa em `--z-sticky` fica acima da barra, que vem depois no DOM com a mesma camada; a barra segue acima do conteúdo dentro do `main`), por que o fio volta (corre por baixo da placa até a borda, não fica pendurado), e por que não `100vw`.
  - No ramo **não redimensionável** de `SidebarInset`: troque `SIDEBAR_INSET_RULE,` por `SIDEBAR_INSET_BEHIND,`. O ramo redimensionável fica como está.
  - Atualize o comentário de `SIDEBAR_INSET_RULE` (agora só o redimensionável zera o fio) e o de `SIDEBAR_INSET_BAR` (em repouso transparente; rolada, o vidro corre por baixo da placa).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/ui/sidebar-versions.test.ts src/components/ui/top-bar-versions.test.ts`
Expected: PASS.

- [ ] **Step 5: Verificar ao vivo** — `preview_start` `dev-attach`, `/dashboard`, `resize_window` 1440×900:
  - em repouso: `getComputedStyle` do `[data-slot=top-bar]` — `margin-inline-start` = −256px, `padding-inline-start` = 272px, `getBoundingClientRect().left` = 0; a placa (`[data-slot=sidebar-container]`) por cima (`elementFromPoint(100, 24)` dentro dela);
  - rolar 300px: `data-scrolled="true"`, `border-bottom-width` 1px, o vidro visível à esquerda da placa entre ela e a borda (screenshot);
  - recolher (⌘B): margem −64 / padding 80, e o título não salta (screenshot no meio da transição ou leitura em 150ms); espiar o trilho: margem continua −64;
  - Transações, marcar 3 linhas a 1024×768: a barra de seleção não cruza a placa;
  - `/dashboard` a 375×812: nada mudou (a barra `fixed` do telefone, sem margem).

- [ ] **Step 6: Commit**

```bash
npx tsc --noEmit && npm run lint && npm run test:unit
git add src/components/ui/sidebar.tsx src/components/ui/sidebar-versions.test.ts docs/superpowers/specs/2026-10-16-header-por-tras-da-barra-design.md docs/superpowers/plans/2026-10-16-header-por-tras-da-barra.md
git commit -m "feat(ds): a barra do topo passa por trás da placa flutuante"
```

---

### Task 2: `AppHeader` — a busca do catálogo no centro

**Files:**
- Modify: `src/components/layout/app-header.tsx` (o JSX de `AppHeader`, ~linhas 92–135)
- Test: `src/components/ui/top-bar-versions.test.ts` (o `it("a barra do app usa as peças, numa árvore só")`)

**Interfaces:**
- Consumes: `TopBarSearch` (`onOpen`, `placeholder`, `collapse`, `glow`, `listen`, `slash`), `TopBarContent`, `TopBarActions` de `@/components/ui/top-bar`; a barra por trás da Task 1.

- [ ] **Step 1: Write the failing test** — no `it("a barra do app usa as peças, numa árvore só")`, acrescente:

```ts
// A busca é a do catálogo, centrada: uma vez só, ícone abaixo de lg, com brilho.
expect([...app.matchAll(/<TopBarSearch/g)]).toHaveLength(1)
expect(app).toContain('collapse="lg"')
expect(app).toMatch(/<TopBarSearch[\s\S]*?\bglow\b[\s\S]*?\/>/)
expect(app).toContain('placeholder="Buscar telas e ações…"')
expect(app).toContain("lg:w-full lg:max-w-sm lg:justify-center")
expect(app).toContain("lg:flex-1 lg:basis-0 lg:justify-end")
expect(app).not.toContain('className="w-56"')
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ui/top-bar-versions.test.ts`
Expected: FAIL (`collapse="lg"` não existe; `w-56` existe).

- [ ] **Step 3: Implement** — a árvore do `AppHeader` passa a ser, de `TopBarContent` em diante:
  1. `TopBarContent` como está (título/trilha; no telefone o `TopBarTitle`) — ele já é `flex-1` (base 0) e faz o par da esquerda.
  2. Um `<div className="flex shrink-0 items-center gap-1 max-lg:-me-1 lg:w-full lg:max-w-sm lg:justify-center">` com, nesta ordem, o `<span className="contents md:hidden">{chromeSlot?.dateFilter}</span>` (que sai de `TopBarActions`) e o `<TopBarSearch onOpen={openSearch} listen={false} slash={false} collapse="lg" glow placeholder="Buscar telas e ações…" />` (sem `className`). O `-me-1` abaixo de `lg` devolve os 4px que a lupa tinha do sino; o comentário diz isso e por que o recorte de tempo mora aqui (a ordem do telefone fica: recorte, lupa, sino).
  3. `<TopBarActions className="lg:flex-1 lg:basis-0 lg:justify-end">` só com o `NotificationBellLink`.
  Atualize o JSDoc de `AppHeader` (a barra corre por trás da placa no desktop; no `lg` três colunas de peso igual, a busca no meio).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/ui/top-bar-versions.test.ts src/components/ui/search-field.test.ts && npm run ds:audit -- src/components/layout/app-header.tsx`
Expected: PASS, e o auditor sem violação nova.

- [ ] **Step 5: Verificar ao vivo** (`dev-attach`):
  - 1440×900 `/dashboard`: centro da pílula (`[data-slot=top-bar-search]` visível) a ±2px do centro da área entre a placa (x=256) e a borda direita, com 384 de largura; o brilho acende com o mouse perto; clicar abre a paleta; ⌘K abre a paleta;
  - 1024×768: pílula ainda centrada e o título da trilha sem cortar em `/transactions`;
  - 900×700: lupa em vez da pílula, encostada ao sino a 4px;
  - 375×812: título, recorte de tempo (no painel), lupa, sino — screenshot comparando com o `git stash` de antes se houver dúvida;
  - tema escuro e claro (`resize_window colorScheme`), rolado e em repouso: screenshots.

- [ ] **Step 6: Commit**

```bash
npx tsc --noEmit && npm run lint && npm run test:unit
git add src/components/layout/app-header.tsx src/components/ui/top-bar-versions.test.ts
git commit -m "feat(header): a busca do catálogo no centro da barra"
```

---

### Task 3: Documentação — catálogo, AGENTS e histórico

**Files:**
- Modify: `src/app/designsystem/docs/top-bar.tsx:365` (a nota do fio)
- Modify: `src/app/designsystem/docs/sidebar.tsx` (a nota do `floating` que fala da barra do topo; `grep -n "barra do topo\|TopBar" ` para achar)
- Modify: `AGENTS.md` (o bullet **`Sidebar`** em "Listas, tabelas e navegação" e o **`TopBar`**)
- Modify: `docs/design/HISTORICO-DESIGN-SYSTEM.md` (rodada nova no fim)

- [ ] **Step 1: Escrever**
  - `top-bar.tsx:365`: o fio lê `--sidebar-inset-rule`, que só a lateral `floating` **redimensionável** zera; ao lado da `floating` comum a barra corre por baixo da placa até a borda da tela, e o fio vai junto.
  - `sidebar.tsx` (doc): uma frase na nota do `floating` — a barra do topo filha do `SidebarInset` passa por trás da placa (`--sidebar-gap`, `isolate`), em repouso transparente, rolada com vidro e fio de ponta a ponta.
  - `AGENTS.md`, bullet `Sidebar`: "Ao lado do `floating`, o `TopBar` filho do `SidebarInset` **passa por trás da placa**: o invólucro publica `--sidebar-gap` (aberta, trilho, espiando, offcanvas) e o `SidebarInset` é `isolate`; nenhuma tela escreve a margem nem o recuo. No redimensionável não passa (o painel recorta) e o fio fica a 0." Bullet `TopBar`: "No app a busca é o `TopBarSearch` com `glow` e `collapse=\"lg\"`, centrada numa coluna `max-w-sm` entre pontas de peso igual."
  - `HISTORICO`: `### Rodada 289 — a barra do topo passa por trás da placa, e a busca vai ao centro`, no formato das rodadas 261 e 288: o pedido, as decisões (as da spec, ditas como do Claude a pedido do dono), o que mudou, **o que foi medido** (os números das verificações das Tasks 1 e 2, não estimados) e o que ficou fora.

- [ ] **Step 2: Verificar ao vivo** — `/designsystem/sidebar` e `/designsystem/top-bar` a 1440×900: as prévias com `SidebarProvider` não deixam a barra escapar da caixa (screenshot de cada); `npx vitest run src/app/designsystem` verde.

- [ ] **Step 3: Commit**

```bash
npx tsc --noEmit && npm run lint && npm run test:unit
git add src/app/designsystem/docs/top-bar.tsx src/app/designsystem/docs/sidebar.tsx AGENTS.md docs/design/HISTORICO-DESIGN-SYSTEM.md
git commit -m "docs(ds): rodada 289 — a barra do topo por trás da placa"
```
