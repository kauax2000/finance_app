# Subpáginas: telas de notificação e transição padrão

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `Onde chega` e `Sobre o quê` viram telas de verdade, e toda subpágina do telefone entra e volta com a mesma transição, sem animar troca de aba.

**Architecture:** Uma função pura decide a direção comparando a rota de antes e a de agora pela cadeia do voltar. A casca envolve o conteúdo num `ViewTransition` do React, que recebe a classe da direção; quem chama nunca marca link nenhum. As duas telas são rotas sob `/settings`, com `AdiarMontagem`, `loading.tsx` e o gancho de preferências.

**Tech Stack:** Next.js 16.2.6 (`experimental.viewTransition`), React 19.2 `ViewTransition`, View Transitions API, Tailwind v4, Vitest.

**Spec:** Sem documento. Pedido do dono em 2026-11-02: "as transições entre páginas devem ser um padrão entre todas", "são subpáginas, não a dos menus", "se trocar do painel para transações, não são páginas diferentes, são lugares diferentes", "se eu estou dentro do você e entro em outra página [...] aí precisa de transição". As regras estão em Global Constraints.

## Global Constraints

- Subpágina é rota com voltar: a cadeia de `defaultMobileBackHref` (`src/components/layout/app-header.tsx`).
- **Troca de aba não anima.** Painel, Transações, Categorias e Você entre si: nada.
- Entrar: a tela nova vem da direita (100% a 0) sobre a velha, que recua até -30%. Voltar é o contrário. Duração `--duration-slow`, curva `--ease-out`.
- Só abaixo de `md` (`useIsMobile`). O desktop não muda.
- Movimento reduzido: troca na hora.
- A barra do topo e a de baixo ficam paradas, por cima do conteúdo que corre.
- Rotas: `/settings/notificacoes/canais` e `/settings/notificacoes/temas`. O voltar leva a `/settings#notificacoes`.
- Títulos das telas: `Onde chega`, `Sobre o quê`. Textos dos canais, temas e grupos ficam os de hoje.
- `src/components/ui/` não muda. `globals.css` muda só no bloco da transição, que o pedido do dono autoriza.
- Dev usa banco de produção: nunca ligar chave ao testar.
- Sem `git stash`. `git add` nomeia arquivos. Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sem push.

## Review Focus

1. Tocar numa aba estando numa subpágina (`/settings` para `/transactions`): nada anima (`Task 1`).
2. A montagem adiada, logo depois da troca, não repete a transição (`Task 3`).
3. O voltar leva à seção de Notificações, e não ao topo de Configurações (`Task 2`).
4. O convidado continua abrindo as duas telas, porque `/settings` vale com subrotas (`Task 2`).
5. Tema e troca de carteira, as outras View Transitions do app, seguem iguais (`Task 3`).

---

### Task 1: Direção da troca

**Files:**
- Create: `src/lib/direcao-da-tela.ts`
- Test: `src/lib/direcao-da-tela.test.ts`
- Modify: `src/components/layout/app-header.tsx` (exportar `defaultMobileBackHref`)

**Interfaces:**
- Produces:
  - `type DirecaoDaTela = "entra" | "volta"`
  - `direcaoDaTela(de: string, para: string, paiDe: (rota: string) => string | undefined): DirecaoDaTela | null`
  - `export function defaultMobileBackHref(pathname: string): string | undefined`

- [ ] **Step 1: Escrever o teste que falha**

```ts
const PAIS: Record<string, string> = {
    "/settings": "/me",
    "/settings/notificacoes/canais": "/settings#notificacoes",
    "/account": "/me",
    "/account/sessions": "/account",
    "/categories/x": "/categories?month=2026-11",
}
const pai = (r: string) => PAIS[r]

it("entra quando a tela nova é mais funda", () => {
    expect(direcaoDaTela("/me", "/settings", pai)).toBe("entra")
    expect(direcaoDaTela("/settings", "/settings/notificacoes/canais", pai)).toBe("entra")
    expect(direcaoDaTela("/dashboard", "/categories/x", pai)).toBe("entra")
})
it("volta quando a tela nova é um ancestral, com query ou hash no voltar", () => {
    expect(direcaoDaTela("/settings/notificacoes/canais", "/settings", pai)).toBe("volta")
    expect(direcaoDaTela("/account/sessions", "/me", pai)).toBe("volta")
    expect(direcaoDaTela("/categories/x", "/categories", pai)).toBe("volta")
})
it("aba não anima", () => {
    expect(direcaoDaTela("/dashboard", "/transactions", pai)).toBeNull()
    expect(direcaoDaTela("/me", "/categories", pai)).toBeNull()
})
it("sair de uma subpágina por outra aba não anima", () => {
    expect(direcaoDaTela("/settings", "/transactions", pai)).toBeNull()
})
it("subpáginas irmãs não animam", () => {
    expect(direcaoDaTela("/settings", "/account", pai)).toBeNull()
})
it("a mesma rota não anima", () => {
    expect(direcaoDaTela("/settings", "/settings", pai)).toBeNull()
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/direcao-da-tela.test.ts`
Expected: FAIL, módulo inexistente.

- [ ] **Step 3: Implementar em `src/lib/direcao-da-tela.ts`**

A cadeia sobe por `paiDe`, cortando `?` e `#` de cada pai (`split(/[?#]/)[0]`), com teto de 8 degraus. `volta` se `para` está na cadeia de `de`. `entra` se a cadeia de `para` é mais longa que a de `de`. Nos outros casos, `null`.

- [ ] **Step 4: Exportar `defaultMobileBackHref` em `app-header.tsx`, rodar e ver passar**

Run: `npx vitest run src/lib/direcao-da-tela.test.ts src/components/layout/app-header-voce.test.ts && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/direcao-da-tela.ts src/lib/direcao-da-tela.test.ts src/components/layout/app-header.tsx
git commit -m "feat(layout): direção da troca de tela"
```

### Task 2: As duas telas

**Files:**
- Create: `src/app/(app)/settings/notificacoes/canais/{page.tsx,page-client.tsx,loading.tsx}`
- Create: `src/app/(app)/settings/notificacoes/temas/{page.tsx,page-client.tsx,loading.tsx}`
- Create: `src/components/settings/notificacoes-tela-skeleton.tsx`
- Rename: `notificacoes-canais-dialog.tsx` para `notificacoes-canais-tela.tsx`; `notificacoes-temas-dialog.tsx` para `notificacoes-temas-tela.tsx` (em `src/components/settings/`)
- Rename: `notificacoes-dialogs.test.ts` para `notificacoes-telas.test.ts`
- Modify: `src/components/settings/notification-preferences.tsx`, `src/components/settings/settings-section.tsx`, `src/config/navigation.ts`, `src/components/layout/sidebar-app-shell.tsx`, `src/components/settings/settings-page.test.ts`, os testes que leem os diálogos (`src/lib/insights/acoes.test.ts`, `src/lib/captura/a-conferir.test.ts`)

**Interfaces:**
- Produces:
  - `ROUTES.SETTINGS_NOTIFICACOES_CANAIS = "/settings/notificacoes/canais"`, `ROUTES.SETTINGS_NOTIFICACOES_TEMAS = "/settings/notificacoes/temas"`
  - `NotificacoesCanaisTela()` e `NotificacoesTemasTela()`, sem props, cada uma com o próprio `useWorkspaceNotificationPrefs`
  - `SettingsLink` aceita `href: string` no lugar de `onClick`

- [ ] **Step 1: Escrever o teste que falha**

Em `notificacoes-telas.test.ts`, por fonte, e em `src/lib/papeis/rotas-do-convidado.test.ts` (ou o arquivo de teste vizinho):

```ts
it("as rotas têm título e voltam à seção", () => {
    expect(APP_SUB_PAGE_TITLES[ROUTES.SETTINGS_NOTIFICACOES_CANAIS]).toEqual({ parent: `${ROUTES.SETTINGS}#notificacoes`, parentTitle: "Configurações", title: "Onde chega" })
    expect(APP_SUB_PAGE_TITLES[ROUTES.SETTINGS_NOTIFICACOES_TEMAS]).toEqual({ parent: `${ROUTES.SETTINGS}#notificacoes`, parentTitle: "Configurações", title: "Sobre o quê" })
})
it("as telas não são diálogos", () => {
    for (const f of [CANAIS, TEMAS]) {
        expect(f).not.toContain("<Dialog")
        expect(f).toContain("useWorkspaceNotificationPrefs()")
        expect(f).toContain('<Alert tone="destructive" size="sm">')
    }
})
it("o convidado abre as duas telas", () => {
    expect(rotaPermitidaAoConvidado(ROUTES.SETTINGS_NOTIFICACOES_CANAIS)).toBe(true)
    expect(rotaPermitidaAoConvidado(ROUTES.SETTINGS_NOTIFICACOES_TEMAS)).toBe(true)
})
```

Mantenha as asserções de texto de `notificacoes-dialogs.test.ts`, menos as de `surface`, `layout` e `abrirInstalacao`. Em `settings-page.test.ts`, troque o que cita os diálogos por `href={ROUTES.SETTINGS_NOTIFICACOES_CANAIS}` e `href={ROUTES.SETTINGS_NOTIFICACOES_TEMAS}`, e proíba `Dialog` no arquivo da seção.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components/settings src/lib/papeis`
Expected: FAIL.

- [ ] **Step 3: Implementar**

- `navigation.ts`: as duas rotas e as duas entradas em `APP_SUB_PAGE_TITLES`, com o `parent` do teste.
- `sidebar-app-shell.tsx`: as duas rotas em `ROTAS_DO_APP`.
- `SettingsLink`: com `href`, `Item variant="flush" interactive asChild` envolve um `Link`, como as linhas de `/me`. O `onClick` segue valendo para os outros usos.
- `notification-preferences.tsx`: as duas linhas com `href`, e `AlertAction asChild` com `Link` nos dois alertas. Saem `canaisOpen`, `temasOpen` e os diálogos.
- Telas: a árvore de cada uma é `<div className="min-w-0 space-y-4">`, com `Muted` `Vale para você em {currentWorkspace.name}.`, o `Alert` de erro e os cartões de hoje. `InstallPwaSheet` fica na tela de canais, e `Como instalar` só abre a folha: sai `abrirInstalacao`. Fora do telefone a tela abre com `PageHeader collapse` e `PageHeaderTitleRow back={`${ROUTES.SETTINGS}#notificacoes`}`, como Configurações faz com `isMobile`.
- Rotas: `page.tsx` no molde de `src/app/(app)/settings/page.tsx`, com `AdiarMontagem`. `loading.tsx` devolve `NotificacoesTelaSkeleton`, de uma coluna com `SkeletonGroup`, `Card padding="none"` e `linhas: number` como prop (`3` em canais, `7` em temas).
- Enquanto `prefs` não chegam, a tela devolve o mesmo esqueleto.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx tsc --noEmit && npx eslint src/components/settings src/config && npx vitest run && npm run ds:audit -- src/components/settings`
Expected: tudo passa.

- [ ] **Step 5: Commit**

Nomeie os arquivos criados, renomeados e alterados, com a mensagem `feat(settings): Onde chega e Sobre o quê viram telas`.

### Task 3: Transição padrão de subpágina

**Files:**
- Create: `src/components/layout/transicao-de-subpagina.tsx`
- Test: `src/components/layout/transicao-de-subpagina.test.ts`
- Modify: `next.config.ts`, `src/components/layout/sidebar-app-shell.tsx`, `src/app/globals.css`
- Modify: `AGENTS.md`, `docs/design/HISTORICO-DESIGN-SYSTEM.md`, `docs/JORNADAS.md`, `docs/atlas/template.html`, `docs/atlas/atlas-jornadas.html`

**Interfaces:**
- Consumes: `direcaoDaTela`, `defaultMobileBackHref` (Task 1).
- Produces: `TransicaoDeSubpagina({ pathname, children }: { pathname: string; children: React.ReactElement })`

- [ ] **Step 1: Escrever o teste que falha**

```ts
const T = semComentarios(lerFonte("src/components/layout/transicao-de-subpagina.tsx"))
const CASCA = semComentarios(lerFonte("src/components/layout/sidebar-app-shell.tsx"))
const CSS = lerFonte("src/app/globals.css")

it("a casca envolve o conteúdo, e quem chama não marca link", () => {
    expect(CASCA).toMatch(/<TransicaoDeSubpagina pathname=\{pathname\}>\s+<div data-workspace-content/)
    expect(lerFonte("next.config.ts")).toContain("viewTransition: true")
})
it("só o telefone anima, e a classe dura uma troca", () => {
    expect(T).toContain('default="none"')
    expect(T).toContain("isMobile ? direcaoDaTela(")
    expect(T).toMatch(/useEffect\([\s\S]+setDirecao\(null\)/)
})
it("as barras ficam paradas, menos nas outras transições do app", () => {
    expect(CSS).toContain('html:not(.theme-reveal, .workspace-switch) [data-slot="top-bar"]')
    expect(CSS).toContain('html:not(.theme-reveal, .workspace-switch) [data-slot="bottom-bar"]')
})
it("as duas direções e o movimento reduzido estão no CSS", () => {
    for (const t of ["::view-transition-old(.subpagina-entra)", "::view-transition-new(.subpagina-entra)", "::view-transition-old(.subpagina-volta)", "::view-transition-new(.subpagina-volta)"]) expect(CSS).toContain(t)
    expect(CSS).toMatch(/prefers-reduced-motion: reduce\)[\s\S]{0,300}subpagina/)
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components/layout/transicao-de-subpagina.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar `TransicaoDeSubpagina`**

```tsx
const [atual, setAtual] = useState(pathname)
const [direcao, setDirecao] = useState<DirecaoDaTela | null>(null)
if (pathname !== atual) {
    setAtual(pathname)
    setDirecao(isMobile ? direcaoDaTela(atual, pathname, defaultMobileBackHref) : null)
}
// Limpa depois da troca: a montagem adiada é outra transição e não pode repetir o gesto.
useEffect(() => {
    if (direcao) setDirecao(null)
}, [direcao])
return <ViewTransition default="none" update={direcao ? `subpagina-${direcao}` : "none"}>{children}</ViewTransition>
```

`ViewTransition` vem de `react`, com `/// <reference types="react/canary" />` no topo do arquivo. Comente com `shortcut:` o limite conhecido: o gesto de voltar do Safari, fora do app instalado, soma a própria animação à daqui.

- [ ] **Step 4: Ligar a casca e o Next**

Em `sidebar-app-shell.tsx`, a `div data-workspace-content` fica dentro de `<TransicaoDeSubpagina pathname={pathname}>`. Em `next.config.ts`, `experimental: { viewTransition: true }`.

- [ ] **Step 5: Escrever o CSS em `globals.css`, depois do bloco `.workspace-switch`**

Abaixo de `48rem`, `html:not(.theme-reveal, .workspace-switch) [data-slot="top-bar"]` e `[data-slot="bottom-bar"]` recebem `view-transition-name` `barra-do-topo` e `barra-de-baixo`. Para os dois nomes, `::view-transition-group` com `animation: none; z-index: 100`, `::view-transition-old` com `display: none` e `::view-transition-new` com `animation: none`. O grupo do conteúdo, por `::view-transition-group(.subpagina-entra)` e `(.subpagina-volta)`, tem `animation: none`. A raiz não esmaece nas duas classes. `@keyframes` nomeados `subpagina-direita` (de `translate: 100% 0`), `subpagina-esquerda` (a `translate: -30% 0`) e o par inverso, em `--duration-slow` e `--ease-out`, com o `::view-transition-new(.subpagina-entra)` por cima na entrada e o `::view-transition-old(.subpagina-volta)` por cima na volta. Em `prefers-reduced-motion: reduce`, os quatro seletores com `animation: none`.

- [ ] **Step 6: Rodar e ver passar**

Run: `npx tsc --noEmit && npm run lint && npx vitest run && npm run ds:audit -- src/components/layout`
Expected: tudo passa, sem aviso novo.

- [ ] **Step 7: Atualizar a documentação**

`AGENTS.md`: uma linha na regra do `TituloDaTela` dizendo que a transição é da casca (`TransicaoDeSubpagina`), só de subpágina e só no telefone, e que nenhuma tela marca link. `HISTORICO-DESIGN-SYSTEM.md`: rodada 358. `docs/JORNADAS.md` e `docs/atlas/template.html`: `Onde chega` e `Sobre o quê` são rotas, com o voltar a `/settings#notificacoes`, na tabela de rotas e no fluxo de notificações, e a data da capa. Rode `python3 docs/atlas/build.py`. Quem controla republica o Atlas.

- [ ] **Step 8: Commit**

Nomeie os arquivos, com a mensagem `feat(layout): transição padrão de subpágina`.
