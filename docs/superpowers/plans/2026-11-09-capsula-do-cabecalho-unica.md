# Cápsula do cabeçalho única — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No desktop, o realce da lupa e do sino colados vira um círculo dentro da pílula (como no telefone), e a `TopBarActionGroup` passa a ter uma forma só.

**Architecture:** Hoje há duas cápsulas em `src/components/ui/top-bar.tsx`. A `TopBarActionGroup` sem `morph` é um `ButtonGroup` com os botões direto dentro (cantos de dentro achatados, realce em meia pílula). Com `morph`, ela é a `CapsulaQueEstica`: um vidro só no grupo, cada botão numa caixa redonda com `REALCE_DO_VIDRO_NO_MIOLO` (realce em círculo). A unificação apaga o primeiro caminho, o `morph` e o `join` (`CAPSULA_COLA`): a `TopBarActionGroup` passa a ser sempre a `CapsulaQueEstica`. Com dois filhos fixos (lupa + sino no desktop), ela monta já como cápsula, sem animação (`g` nasce em 1).

**Tech Stack:** Next 16, React 19, Tailwind v4, Vitest (testes de fonte com `fonte()`/`CODIGO`).

**Spec:** o pedido do dono em 09/11/2026: "o hover do desktop desses ícones igual ao do mobile, onde há um círculo dentro dessa pílula, ao invés de metade da pílula […] unifique os componentes para que sejam um só".

## Global Constraints

- `src/components/ui/` exige autorização humana (AGENTS.md, invariante 6): o pedido do dono acima é essa autorização, só para a `TopBarActionGroup`.
- Nada de classe montada em tempo de execução, cor crua ou `rounded-[…]`.
- O `trailingKey` fica (identidade do segundo filho). Somem `morph`, `join` e `CAPSULA_COLA`.
- Os comentários existentes que não falam de `morph`/`join` ficam como estão.
- Depois do código: `npx tsc --noEmit && npm run lint && npm run test:unit` e `graphify update .`.

## Review Focus

- **Desktop, modo "Botão" ou janela entre `md` e `lg`:** lupa + sino numa cápsula de 36 de altura; o realce no cursor é um círculo de 36 em cada botão, nunca meia pílula.
- **A bolha de contagem do sino** (`top-bar-action-count`, `absolute`, `translate-x-1/3`) continua inteira, fora do recorte. Um `clipPath` só é escrito em voo, e no desktop não há voo, mas a caixa redonda do miolo não pode ter `overflow-hidden`.
- **Telefone:** a cápsula `[lupa | filtro]` estica e encolhe como hoje (nenhuma mudança de comportamento).
- **Trocar a busca entre "Barra" e "Botão"** em Configurações › Aparência monta ou desmonta o grupo inteiro, sem pular nem animar.
- **Tooltip da lupa no desktop** continua abrindo no cursor (o `TopBarSwapContext` só tira o vidro próprio do botão).

---

### Task 1: A `TopBarActionGroup` vira uma só

**Files:**
- Modify: `src/components/ui/top-bar.tsx` (`CAPSULA_COLA`, `TopBarActionGroup`, comentários de `TOP_BAR_PLATE` e da `CapsulaQueEstica` que citam `morph`)
- Modify: `src/components/layout/app-header.tsx:284` (tira `morph`)
- Modify: `src/app/laboratorio/cabecalho/page.tsx:106` (tira `morph`)
- Modify: `src/lib/spring.ts:42` (comentário: `TopBarActionGroup morph` → `TopBarActionGroup`)
- Test: `src/components/ui/top-bar-versions.test.ts`, `src/components/layout/app-header-morph.test.ts`, `src/components/members/carteira-no-topo.test.ts`

**Interfaces:**
- Produces: `TopBarActionGroup({ trailingKey?, className, ...ButtonGroupProps })`, que renderiza sempre `<CapsulaQueEstica trailingKey className={cn("*:before:hidden *:ml-0!", className)} {...props} />`. Sem `morph`, sem `join`, sem `data-join`.

- [ ] **Step 1: Reescrever os testes para a forma única**

Em `top-bar-versions.test.ts`:
- `it("TopBarActionGroup é o ButtonGroup com um anel só e sem divisor, e join diz de que lado cola")` vira `it("TopBarActionGroup é uma cápsula só: sempre o vidro que estica, sem morph nem join")`, com `peca` fatiada de `function TopBarActionGroup(` até `const TOP_BAR_SEARCH_PLATE`:
  ```ts
  expect(CODIGO).not.toContain("CAPSULA_COLA")
  expect(peca).not.toMatch(/\bmorph\b/)
  expect(peca).not.toContain("join")
  expect(peca).toContain("<CapsulaQueEstica")
  expect(peca).toContain('"*:before:hidden *:ml-0!"')
  // O realce é um círculo dentro da pílula, nos dois apontadores.
  expect(peca).toMatch(/data-slot="top-bar-action-lupa"[\s\S]{0,160}rounded-full[\s\S]{0,80}REALCE_DO_VIDRO_NO_MIOLO/)
  ```
- O teste do telefone (linha ~347) passa a casar `/<TopBarActionGroup\s+trailingKey=\{filtro\?\.icon\}>\s*\{lupa\(true\)\}\s*\{filtroNoCabecalho\}/`.
- `describe("TopBarActionGroup morph")` vira `describe("TopBarActionGroup")`; no primeiro `it` a lista vira `["trailingKey", "quadroDoVidroQueEstica(", "BALANCO"]`; no último, `expect(pagina).toMatch(/<TopBarActionGroup[^>]*\btrailingKey=/)` no lugar do `\bmorph\b`.
- O teste do desktop (linha ~338) fica como está: `<TopBarActionGroup>` sem props continua válido.

Em `app-header-morph.test.ts:17` e `carteira-no-topo.test.ts:49`: tirar `morph\s+` / `morph ` do regex.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components/ui/top-bar-versions.test.ts src/components/layout/app-header-morph.test.ts src/components/members/carteira-no-topo.test.ts`
Expected: FAIL (`CAPSULA_COLA` ainda existe, `morph` ainda no cabeçalho).

- [ ] **Step 3: Implementar**

- Apagar `CAPSULA_COLA` e o caminho `ButtonGroup` da `TopBarActionGroup`; ela devolve sempre a `CapsulaQueEstica` (assinatura em Interfaces). Reescrever o JSDoc dela: uma cápsula só, um ou dois filhos, o realce em círculo dentro da pílula nos dois apontadores, `trailingKey` como hoje.
- `app-header.tsx` e `laboratorio/cabecalho/page.tsx`: `<TopBarActionGroup trailingKey=…>`.
- Comentários que dizem "`TopBarActionGroup morph`" (em `top-bar.tsx` e `spring.ts`) passam a dizer "`TopBarActionGroup`".

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/components/ui/top-bar-versions.test.ts src/components/layout/app-header-morph.test.ts src/components/members/carteira-no-topo.test.ts && npx tsc --noEmit`
Expected: PASS, sem erro de tipo (nenhum chamador passa `morph` nem `join`).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/top-bar.tsx src/components/layout/app-header.tsx src/app/laboratorio/cabecalho/page.tsx src/lib/spring.ts src/components/ui/top-bar-versions.test.ts src/components/layout/app-header-morph.test.ts src/components/members/carteira-no-topo.test.ts
git commit -m "feat(top-bar): a cápsula do cabeçalho é uma só, com o realce em círculo também no desktop"
```

### Task 2: Catálogo e AGENTS.md

**Files:**
- Modify: `src/app/designsystem/docs/top-bar.tsx` (linhas ~322, ~459–491, ~558)
- Modify: `AGENTS.md:1701` (bullet da `TopBarActionGroup`)
- Modify: `docs/design/HISTORICO-DESIGN-SYSTEM.md` (uma rodada nova no fim)

**Interfaces:**
- Consumes: `TopBarActionGroup({ trailingKey? })` da Task 1.

- [ ] **Step 1: Página do catálogo**

Tirar `morph` do demo (linha ~322) e do `code` (linha ~482). A descrição da linha ~459 passa a dizer que a cápsula é um vidro só, com cada ação num círculo e o realce em círculo dentro dela, igual no telefone e no desktop (tirar "os cantos de dentro achatados" e "No telefone os botões voltam a ser círculos soltos"). A da linha ~481 tira "Com morph,". Na `PropsTable` (linha ~558), `type` vira `"ComponentProps<typeof ButtonGroup> & { trailingKey? }"` e a descrição cai `join` e `morph`.

- [ ] **Step 2: AGENTS.md e histórico**

No bullet da `TopBarActionGroup` (`AGENTS.md:1701`): trocar "o `ButtonGroup` sem divisor, com o anel no grupo; `join` — `always`, `desktop`, `phone` — diz de que lado da quebra cola, quando um botão só existe num lado" e "**`morph`** + `trailingKey`" por: uma cápsula só, um vidro no grupo, e cada ação num círculo com o realce em círculo nos dois apontadores (09/11/2026); `trailingKey` troca o segundo filho. O resto do bullet (o vidro que estica, o `BALANCO`, as rodadas 349 e 351) fica. No histórico, uma rodada curta: o pedido, o que saiu (`morph`, `join`, `CAPSULA_COLA`) e o porquê (meia pílula no desktop).

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit && npm run lint && npm run test:unit`
Expected: PASS (inclui `doc-pages.test.ts` e `top-bar-versions.test.ts`).

- [ ] **Step 4: Commit**

```bash
git add src/app/designsystem/docs/top-bar.tsx AGENTS.md docs/design/HISTORICO-DESIGN-SYSTEM.md
git commit -m "docs(top-bar): a cápsula única no catálogo e no AGENTS"
```

### Verificação final (no orquestrador)

No navegador do app, a 1280px com a busca em "Botão" e a 1000px em "Barra": passar o cursor na lupa e no sino e conferir o círculo de realce. A 375px, conferir a cápsula `[lupa | filtro]` ao trocar de tela. Depois, `graphify update .`.
