# Plano de implementação: a barra lateral do app flutua

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No desktop, a barra lateral do app troca `variant="sidebar"` (rente) por `variant="floating"` (a placa solta do design system), com a trava e a documentação acompanhando.

**Architecture:** O `Sidebar` (`src/components/ui/sidebar.tsx`) já implementa o `floating` inteiro: a calha, a `TopBar` transparente ao lado, o gatilho em pílula e o gatilho que viaja para dentro da placa recolhida. O app só troca o prop. Depois, o controlador mede a casca no navegador e só corrige no arquivo da tela o que estiver visivelmente errado. Por fim vêm o `AGENTS.md` e uma rodada nova no histórico.

**Tech Stack:** Next.js 16 (webpack), React, Tailwind v4, Radix, `motion`, Vitest (testes que leem a fonte via `src/test/fonte.ts`).

**Spec:** `docs/superpowers/specs/2026-10-13-sidebar-floating-design.md`

## Global Constraints

- A `TopBar` do app continua `position="auto" surface="scroll"`. **Não** passa para `variant="floating"`.
- A barra lateral continua `collapsible="icon"`, sem `peek`.
- Nada muda em `src/components/ui/*.tsx` além de `sidebar-versions.test.ts`, nem em `src/app/globals.css`. Se surgir a necessidade, **pare e pergunte ao dono** (invariante 6 do `AGENTS.md`).
- Os ajustes na tela ficam em `src/components/layout/`: token-first, zero literais (sem `#hex`, sem `p-[13px]`), e `npm run ds:audit` limpo nos arquivos tocados.
- O telefone fica fora do escopo. O app não abre a barra lateral abaixo de `md`.
- O banco do dev é o **Supabase de produção**: no navegador, só navegar e ler. Nada de salvar, editar ou excluir.
- O dev server já roda fora da sessão em :3000. Use `preview_start {name: "dev-attach"}` e **nunca** a configuração `dev` (ela tenta subir um segundo `next dev` e morre).
- Outra sessão commita em paralelo no mesmo repositório (`auth-showcase`). Commite **só os seus trechos**. Se `AGENTS.md` ou o histórico tiverem trechos alheios, monte o patch com `git diff <arquivo>`, edite-o e use `git apply --cached`. Nada de `git add` do arquivo inteiro nem `git add -A`.
- O commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Os textos de documentação são em português, no tom do `AGENTS.md`.

## Review Focus

1. **Recolhida em ícone:** o gatilho que entra na placa não sobrepõe o botão do `WorkspaceSwitcher` (o cabeçalho cresce para caber os dois), e o trilho continua com 48px mais a calha de 8px.
2. **Dicas com a barra recolhida:** o `Tooltip` de cada ícone abre à direita da placa, inteiro, sem ser cortado pelo anel ou pela borda dela.
3. **Menus ancorados na placa:** o menu do seletor de carteira e o do perfil abrem alinhados à placa, dentro da janela, nos dois estados.
4. **Rolagem:** depois de rolar, a `TopBar` vira vidro (`data-scrolled="true"`, com fundo) e o conteúdo não aparece através dela sem desfoque. A `Toolbar sticky` de listas continua assentando sob `--top-bar-bottom`.
5. **Janela estreita do desktop (800×900):** a calha da placa não cria rolagem horizontal (`scrollWidth <= clientWidth` no `documentElement`).

Os cinco são medidos na Tarefa 2.

---

### Tarefa 1: a trava exige o `floating`, e o app troca

**Files:**
- Modify: `src/components/ui/sidebar-versions.test.ts:130-134` (o caso "o que o app escrevia à mão é do componente, e o app fica rente"). O arquivo fica em `ui/`, e o harness pede confirmação. A edição já foi autorizada pelo dono na spec.
- Modify: `src/components/layout/app-sidebar.tsx:36`

**Interfaces:**
- Consumes: nada.
- Produces: `<Sidebar collapsible="icon" variant="floating">` em `app-sidebar.tsx`. A Tarefa 2 mede o resultado dessa troca.

- [ ] **Step 1: Escreva o teste que falha**

Em `src/components/ui/sidebar-versions.test.ts`, troque o título e a asserção do app:

```ts
  it("o que o app escrevia à mão é do componente, e o app flutua", () => {
    expect(CODIGO).toContain("[interpolate-size:allow-keywords] group-data-[collapsible=icon]:h-12")
    expect(CODIGO).toContain('"h-12 p-2 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0!"')
    const app = lerFonte("src/components/layout/app-sidebar.tsx")
    expect(app).toContain('<Sidebar collapsible="icon" variant="floating">')
    expect(app).not.toContain('variant="sidebar"')
    expect(app).not.toContain("group-data-[collapsible=icon]:overflow-y-auto")
```

As linhas seguintes do caso (`workspace-switcher`, `perfil`) ficam como estão.

- [ ] **Step 2: Rode e confira que falha**

Run: `npx vitest run src/components/ui/sidebar-versions.test.ts`
Expected: FAIL em "o app flutua", porque a fonte ainda contém `variant="sidebar"`.

- [ ] **Step 3: A troca**

Em `src/components/layout/app-sidebar.tsx`, linha 36:

```tsx
        <Sidebar collapsible="icon" variant="floating">
```

- [ ] **Step 4: Rode e confira que passa**

Run: `npx vitest run src/components/ui/sidebar-versions.test.ts`
Expected: PASS.

- [ ] **Step 5: A bateria inteira**

Run: `npx tsc --noEmit && npm run lint && npm run test:unit && npm run ds:audit -- src/components/layout/app-sidebar.tsx`
Expected: tudo verde e o auditor sem achados. Se algum outro teste falhar, confira com `git status` e `git log -3` se a falha está num arquivo da outra sessão (`src/components/auth/showcase/`). Se estiver, registre no relatório e não mexa nele.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/sidebar-versions.test.ts src/components/layout/app-sidebar.tsx
git commit -m "feat(sidebar): a barra lateral do app flutua — variant=\"floating\" e a trava que a exige

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 2: a conferência no navegador (executada pelo controlador)

Esta tarefa usa o painel do navegador (`mcp__Claude_Browser__*`), que só a sessão principal tem. **O controlador a executa, não um subagente.** O painel precisa estar **visível** para capturar: se a captura der "Browser pane is not displayed", peça ao dono que mostre o painel.

**Files:**
- Modify (só se uma medida reprovar): `src/components/layout/app-header.tsx`, `src/components/layout/sidebar-app-shell.tsx`, `src/components/layout/workspace-switcher.tsx`, `src/components/layout/sidebar-user-profile.tsx` ou `src/components/layout/quick-actions.tsx`.

**Interfaces:**
- Consumes: a troca da Tarefa 1.
- Produces: uma tabela de medidas (estado × tema × medida → valor, passou ou não), que a Tarefa 3 cita no histórico.

- [ ] **Step 1: Abra o app**

`preview_start {name: "dev-attach"}`, depois `resize_window {width: 1440, height: 900}` e `navigate` para `http://localhost:3000/dashboard`. Garanta a barra **aberta**: se `document.querySelector('[data-slot=sidebar]').dataset.state` for `"collapsed"`, pressione `cmd+b`.

- [ ] **Step 2: Meça a casca aberta**

Rode no `javascript_tool`:

```js
(() => {
  const q = (s) => document.querySelector(s)
  const box = (el) => el && el.getBoundingClientRect()
  const sb = q('[data-slot=sidebar]')
  const inner = box(q('[data-slot=sidebar-inner]'))
  const trig = box(q('[data-slot=top-bar] [data-slot=sidebar-trigger]'))
  const bar = q('[data-slot=top-bar]')
  const barCs = bar && getComputedStyle(bar)
  const innerCs = getComputedStyle(q('[data-slot=sidebar-inner]'))
  return {
    variant: sb.dataset.variant,
    state: sb.dataset.state,
    calhaEsquerda: inner.left,
    calhaTopo: inner.top,
    calhaBase: innerHeight - inner.bottom,
    larguraPlaca: inner.width,
    raio: innerCs.borderTopLeftRadius,
    sombra: innerCs.boxShadow !== 'none',
    gatilhoAPlaca: trig ? trig.left - inner.right : null,
    topBarFundo: barCs.backgroundColor,
    topBarFio: barCs.borderBottomWidth,
    topBarRolada: bar.dataset.scrolled,
    rolagemHorizontal: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }
})()
```

Expected: `variant: "floating"`, `state: "expanded"`, `calhaEsquerda`, `calhaTopo` e `calhaBase` iguais a 8, `larguraPlaca` 248 (16rem menos a calha de 8), `raio: "28px"`, `sombra: true`, `gatilhoAPlaca` igual a 8, `topBarFundo` transparente (`rgba(0, 0, 0, 0)`), `topBarFio: "0px"`, `rolagemHorizontal: false`. Se `larguraPlaca` der outro valor e o resto passar, anote o valor real: a medida é do componente, não da tela.

Se `gatilhoAPlaca` **não** for 8, o `className="-ml-2"` de `app-header.tsx` está vencendo o `-ml-4` do componente. Tire o `className` do `<SidebarTrigger />`, recarregue e meça de novo, aberta (Step 2) e recolhida (Step 4). Se o recolhido desalinhar sem ele, pare e leve as duas medidas ao dono.

- [ ] **Step 3: Capture a casca aberta, no claro e no escuro**

`computer {action: "screenshot"}` no claro. Depois `resize_window {colorScheme: "dark"}`, recarregue e capture de novo. Olhe:
- a placa separada da página pelo anel e pela sombra;
- o "+ Adicionar", o seletor de carteira e o perfil dentro da placa, sem corte;
- a pílula do ativo dentro da placa.

Volte a `colorScheme: "light"`.

- [ ] **Step 4: Recolha e meça (Review Focus 1 e 2)**

`computer {action: "key", text: "cmd+b"}` e espere 1s. Rode:

```js
(() => {
  const q = (s) => document.querySelector(s)
  const box = (el) => el && el.getBoundingClientRect()
  const inner = box(q('[data-slot=sidebar-inner]'))
  const header = box(q('[data-slot=sidebar-inner] [data-slot=sidebar-header]'))
  const trigIn = box(q('[data-slot=sidebar-inner] [data-slot=sidebar-trigger]'))
  const ws = box(q('[data-slot=sidebar-header] [data-slot=sidebar-menu-button]'))
  const overlap = trigIn && ws
    ? !(trigIn.bottom <= ws.top || trigIn.top >= ws.bottom || trigIn.right <= ws.left || trigIn.left >= ws.right)
    : null
  return {
    state: q('[data-slot=sidebar]').dataset.state,
    larguraPlaca: inner.width,
    calhaEsquerda: inner.left,
    gatilhoDentro: !!trigIn,
    gatilhoNoTopo: !!q('[data-slot=top-bar] [data-slot=sidebar-trigger]'),
    gatilhoSobreCarteira: overlap,
    cabecalhoContemGatilho: trigIn && header ? trigIn.bottom <= header.bottom + 0.5 : null,
  }
})()
```

Expected: `state: "collapsed"`, `larguraPlaca` 48, `calhaEsquerda` 8, `gatilhoDentro: true`, `gatilhoSobreCarteira: false`, `cabecalhoContemGatilho: true`. `gatilhoNoTopo` pode ser `true` enquanto a vaga encolhe, mas não pode haver dois gatilhos visíveis.

Depois, `computer {action: "hover"}` sobre o terceiro ícone do menu (pegue o `ref` com `find "Transações"` ou pelo primeiro `[data-slot=sidebar-menu-button]` do grupo) e espere 1s. Confira com:

```js
(() => {
  const tip = document.querySelector('[data-slot=tooltip-content]')
  const inner = document.querySelector('[data-slot=sidebar-inner]').getBoundingClientRect()
  if (!tip) return { dica: false }
  const t = tip.getBoundingClientRect()
  return { dica: true, aDireita: t.left >= inner.right, inteira: t.left >= 0 && t.right <= innerWidth && t.top >= 0 && t.bottom <= innerHeight }
})()
```

Expected: `dica: true`, `aDireita: true`, `inteira: true`. Capture a tela recolhida (claro).

- [ ] **Step 5: Menus ancorados (Review Focus 3)**

Ainda recolhida, clique no botão do seletor de carteira (`find "carteira"` ou o `[data-slot=sidebar-header] [data-slot=sidebar-menu-button]`), espere 500ms e rode:

```js
(() => {
  const m = document.querySelector('[data-slot=dropdown-menu-content], [role=menu]')
  if (!m) return { menu: false }
  const r = m.getBoundingClientRect()
  return { menu: true, inteiro: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight, left: r.left }
})()
```

Expected: `menu: true`, `inteiro: true`. Feche com `Escape`. Repita com o botão do perfil (`[data-slot=sidebar-footer] [data-slot=sidebar-menu-button]`). **Não clique em nenhum item dos menus.** Reabra a barra com `cmd+b` e repita os dois menus aberta.

- [ ] **Step 6: Rolagem (Review Focus 4)**

Com a barra aberta, rode `document.scrollingElement.scrollTo(0, 600)` (se a página rolar dentro do `sidebar-inset`, role o elemento rolável de lá). Espere 500ms e rode:

```js
(() => {
  const bar = document.querySelector('[data-slot=top-bar]')
  const cs = getComputedStyle(bar)
  return { rolada: bar.dataset.scrolled, fundo: cs.backgroundColor, desfoque: cs.backdropFilter, base: getComputedStyle(document.documentElement).getPropertyValue('--top-bar-bottom') }
})()
```

Expected: `rolada: "true"`, `fundo` diferente de `rgba(0, 0, 0, 0)` ou `desfoque` diferente de `none`, e `--top-bar-bottom` igual ao de antes da troca (48px no desktop). Capture a tela rolada. Depois navegue para `/transactions` e confira que a `Toolbar sticky`, rolada, assenta sob a barra (`top` da `[data-slot=toolbar]` igual a `--top-bar-bottom`).

- [ ] **Step 7: Janela estreita (Review Focus 5)**

`resize_window {width: 800, height: 900}`, recarregue `/dashboard` e rode:

```js
({ rolagemHorizontal: document.documentElement.scrollWidth > document.documentElement.clientWidth, variant: document.querySelector('[data-slot=sidebar]').dataset.variant })
```

Expected: `rolagemHorizontal: false`, `variant: "floating"`. Capture. Volte com `resize_window {preset: "desktop"}`.

- [ ] **Step 8: Correções, se houver**

Para cada medida que reprovou: leia o arquivo de `src/components/layout/` responsável, corrija com token ou utilitário do sistema, rode `npm run ds:audit -- <arquivo>` e meça o passo de novo. Se a correção exigir mudar `src/components/ui/` ou `globals.css`, **pare** e leve ao dono a proposta com a medida que reprovou e as telas que consomem o componente.

Se houve correção:

Run: `npx tsc --noEmit && npm run lint && npm run test:unit`
Expected: verde.

```bash
git add <só os arquivos de src/components/layout/ corrigidos>
git commit -m "fix(layout): <o que a medida pediu> ao lado da barra flutuante

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Sem correção, nada é commitado nesta tarefa.

- [ ] **Step 9: Mostre as capturas ao dono**

Envie as capturas (aberta claro e escuro, recolhida, rolada, 800px) com `SendUserFile`, junto com a tabela de medidas.

---

### Tarefa 3: `AGENTS.md` e a rodada no histórico

**Files:**
- Modify: `AGENTS.md:1290-1294` (o bullet do `Sidebar` em "Listas, tabelas e navegação")
- Modify: `docs/design/HISTORICO-DESIGN-SYSTEM.md` (rodada nova no fim do arquivo)

**Interfaces:**
- Consumes: a tabela de medidas e as correções da Tarefa 2.
- Produces: nada que o código consuma.

- [ ] **Step 1: O número da rodada**

Run: `grep -n "^### Rodada" docs/design/HISTORICO-DESIGN-SYSTEM.md | tail -1`
Use o número seguinte ao último: hoje a última é a 260, então esta é a 261. Rode também `git status --short AGENTS.md docs/design/HISTORICO-DESIGN-SYSTEM.md` e anote se já há trechos alheios.

- [ ] **Step 2: O `AGENTS.md`**

Troque o começo do bullet:

```md
- **`Sidebar`**: sempre à esquerda; `variant` `floating` (o padrão e a do
  app desde a rodada 261, **sem vidro**), `sidebar` (a rente), `inset`,
  `plain` (a do catálogo, com
  `collapsible="none"`). A pílula do ativo é `layoutId`; `peek`. **Nenhuma tela
```

O resto do bullet fica igual.

- [ ] **Step 3: A rodada no histórico**

Acrescente no fim de `docs/design/HISTORICO-DESIGN-SYSTEM.md`, com uma linha em branco antes:

```md
### Rodada 261 — `Sidebar`: o app flutua

**O pedido.** O dono pediu a barra lateral do app no `floating`, principalmente
no desktop. Desde a rodada 221 o `floating` é o padrão do componente, mas o app
tinha ficado rente (`variant="sidebar"`) por decisão dele. A decisão se inverte.

**As decisões.**
- **A barra do topo é a que o DS prevê ao lado do `floating`**: larga, sem
  fundo em repouso e vidro ao rolar. A `TopBar variant="floating"` foi
  oferecida e recusada.
- **Recolhida, em ícones, como antes** (`collapsible="icon"`, sem `peek`): o
  gatilho entra na placa, sob o seletor de carteira.

**O que mudou.** Um prop no `app-sidebar.tsx`. A calha, a barra do topo
transparente, o fio a zero, o gatilho em pílula e a viagem dele para dentro da
placa já eram do componente. `sidebar-versions.test.ts` passou a exigir o
`floating` no app.

**Medido** em 1440×900, aberta e recolhida, nos dois temas, mais 800×900:
<a tabela da Tarefa 2 em frases — calha, gatilho a 8px da placa, trilho de 48,
dica à direita e inteira, menus dentro da janela, vidro ao rolar, sem rolagem
horizontal — e cada correção feita em `layout/`, com o motivo. Se não houve
correção, diga "nenhuma correção na tela".>

**Fora.** O telefone, que não abre a barra lateral (a navegação é a
`BottomBar`), a cor da placa e o `peek`.
```

O parágrafo "Medido" é escrito com os números reais da Tarefa 2. O texto entre `< >` não pode ficar no arquivo.

- [ ] **Step 4: Confira que nada quebrou**

Run: `npm run test:unit`
Expected: verde. Alguns testes leem o `AGENTS.md`, por isso a bateria roda de novo.

- [ ] **Step 5: Commit só dos seus trechos**

Se o Step 1 não achou trechos alheios:

```bash
git add AGENTS.md docs/design/HISTORICO-DESIGN-SYSTEM.md
```

Se achou, para cada arquivo (`$SCRATCHPAD` é o diretório de rascunho da sessão):

```bash
git diff AGENTS.md > "$SCRATCHPAD/agents.patch"   # edite o patch e deixe só os seus hunks
git apply --cached "$SCRATCHPAD/agents.patch"
```

Confira com `git diff --cached` que só os seus trechos estão no índice. Depois:

```bash
git commit -m "docs(design-system): a rodada 261 — o app veste o Sidebar floating

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Depois das tarefas

Uma revisão final de todo o branch, com a spec ao lado, e a conferência de que `docs/JORNADAS.md` e o Atlas não precisam mudar (nenhuma rota, destino ou passo mudou).
