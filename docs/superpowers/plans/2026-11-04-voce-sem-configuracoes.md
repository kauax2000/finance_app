# Você sem Configurações no celular — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No celular, a aba Você ganha os cartões de incentivo de Lançar pelo iPhone e da IA (que viram linhas depois de usados), Notificações vira linha, as três seções ganham rota própria e Configurações some do celular.

**Architecture:** Três rotas novas sob `/settings/` (cada uma a seção que já existe, sozinha). A navegação do telefone (`mobile-navigation.ts`) troca a linha Configurações por IAs conectadas e Notificações e trata as três rotas como telas de Você. Os cartões entram na página `/me` (o da IA acima de Conta) e no `NesteCelularGrupo` (o de Lançar pelo iPhone), decididos por hooks que leem as listas que já existem.

**Tech Stack:** Next.js (App Router desta versão — ler `node_modules/next/dist/docs/` antes de mexer em rota), React, TanStack Query, Supabase, vitest.

**Spec:** `docs/superpowers/specs/2026-11-04-voce-sem-configuracoes-design.md`

## Global Constraints

- "Celular" = `useIsMobile()` (abaixo de 768px). O desktop não muda: `/settings` segue com todas as seções.
- A funcionalidade se chama **Lançar pelo iPhone**. Nenhum título, cartão ou linha novo a chama só de "Siri".
- Design system do `AGENTS.md`: nada novo em `src/components/ui/` nem em `globals.css`; tudo é composição do que existe. Ícone de config/nav em `@heroicons/react/24/outline`; nas linhas renderizadas, `miniIconFor` (como as linhas de `/me` já fazem).
- Toda rota nova: `page.tsx` com `<AdiarMontagem fallback={<Loading />}>`, `loading.tsx` com esqueleto (`adiar-montagem.test.ts` cobra).
- O banco de dev é o de produção: nenhum teste nem verificação grava dados.
- Commits só com os arquivos da tarefa (`git add <arquivos>`), nunca `git add -A`; não rodar prettier em `src/components/account/`; não contornar o hook `guarda-componentes`.
- Cada commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Depois de mexer em código: `graphify update .` (sem custo).

## Review Focus

1. Leitura das IAs com erro ou carregando → a linha "IAs conectadas", nunca o cartão (que piscaria ou mentiria). Teste na Task 3.
2. `/settings` aberto no celular → vai a `/me` por `replace`, sem montar as seções do desktop por baixo. Teste na Task 2.
3. Desconectar a última IA / o último aparelho na página nova → a página mostra o vazio dela, e a volta a Você mostra o cartão (mesma chave de query, sem cache velho). Coberto pela chave compartilhada (Task 2) e conferido no navegador (Task 5).
4. Convidado (papel `guest`) → as três rotas continuam abertas a ele (`/settings` é `COM_SUBROTAS` em `rotas-do-convidado.ts`) e as linhas aparecem. Teste na Task 1.
5. iPhone pelo navegador → o cartão "Instale o app" aparece e a linha "Instalar o app" do grupo some; Android não vê cartão nenhum. Teste na Task 3.

---

### Task 1: A navegação do telefone

**Files:**
- Modify: `src/config/navigation.ts` (ROUTES, `APP_PAGE_TITLES`)
- Modify: `src/config/mobile-navigation.ts` (`todosOsGrupos`, `isVoceTabActive`, `voceBackHref`)
- Modify: `src/components/layout/notifications-panel-empty.tsx` (o href das preferências)
- Modify: `src/components/layout/notifications-panel.tsx:341` (usa o href)
- Test: `src/config/mobile-navigation.test.ts`

**Interfaces:**
- Produces:
  - `ROUTES.SETTINGS_LANCAR = "/settings/lancar-pelo-iphone"`, `ROUTES.SETTINGS_IAS = "/settings/ias"`, `ROUTES.SETTINGS_NOTIFICACOES = "/settings/notificacoes"`.
  - `APP_PAGE_TITLES` com `"Lançar pelo iPhone"`, `"IAs conectadas"`, `"Notificações"` para elas (o `TituloDaTela` lê por rota exata).
  - `export const ROTAS_DE_VOCE_EM_SETTINGS: readonly string[]` (as três), em `mobile-navigation.ts`.
  - `export function preferenciasDeNotificacaoHref(isMobile: boolean): string` em `notifications-panel-empty.tsx`: `ROUTES.SETTINGS_NOTIFICACOES` no celular, `` `${ROUTES.SETTINGS}#notificacoes` `` no desktop. Substitui a constante `NOTIFICATION_PREFERENCES_HREF` (remover; atualizar os dois usos, que leem `useIsMobile()`).
  - Grupo Conta de `getVoceGroups`: `[ACCOUNT, COFRE, SETTINGS_IAS, SETTINGS_NOTIFICACOES]` — **sem** `ROUTES.SETTINGS`. Itens: `{ href: SETTINGS_IAS, name: "IAs conectadas", icon: SparklesIcon }`, `{ href: SETTINGS_NOTIFICACOES, name: "Notificações", icon: BellIcon }` (24/outline). Se `miniIconFor` não tiver o par mini desses ícones, acrescentar na tabela dele.

- [ ] **Step 1: Atualizar os testes**

Em `mobile-navigation.test.ts`, trocar as asserções que citam Configurações:

```ts
it("dois grupos: a carteira e a conta, sem Planos nem Configurações, com IAs conectadas e Notificações por último", () => {
    const [, conta] = getVoceGroups([], "owner")
    expect(hrefs(conta)).toEqual([ROUTES.ACCOUNT, ROUTES.COFRE, ROUTES.SETTINGS_IAS, ROUTES.SETTINGS_NOTIFICACOES])
})
it("as três telas de configuração do telefone acendem Você e voltam a ela", () => {
    for (const r of [ROUTES.SETTINGS_LANCAR, ROUTES.SETTINGS_IAS, ROUTES.SETTINGS_NOTIFICACOES]) {
        expect(isVoceTabActive(r, [])).toBe(true)
        expect(voceBackHref(r)).toBe(ROUTES.ME)
    }
    expect(voceBackHref(`${ROUTES.SETTINGS}/aparencia`)).toBeUndefined()
})
it("o convidado vê IAs conectadas e Notificações", () => {
    const [, conta] = getVoceGroups([], "guest")
    expect(hrefs(conta)).toEqual(expect.arrayContaining([ROUTES.SETTINGS_IAS, ROUTES.SETTINGS_NOTIFICACOES]))
})
```

Remover a linha `expect(voceBackHref(ROUTES.SETTINGS)).toBe(ROUTES.ME)`. Num teste novo de `notifications-panel-empty`: `preferenciasDeNotificacaoHref(true) === "/settings/notificacoes"` e `preferenciasDeNotificacaoHref(false) === "/settings#notificacoes"`.

- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run src/config/mobile-navigation.test.ts` → FAIL (`SETTINGS_IAS` indefinido).
- [ ] **Step 3: Implementar** as interfaces acima. `voceBackHref` e `isVoceTabActive` aceitam `ROTAS_DE_VOCE_EM_SETTINGS` explicitamente, além do que os grupos listam. Conferir quem mais usa o grupo Conta ou `ROUTES.SETTINGS` no telefone (`grep -rn "ROUTES.SETTINGS" src`): o desktop (barra lateral, menu do usuário) segue com Configurações.
- [ ] **Step 4: Rodar** — `npx vitest run src/config src/components/layout` → PASS; `npx tsc --noEmit` limpo.
- [ ] **Step 5: Commit** — `feat(voce): IAs conectadas e Notificações no lugar de Configurações no telefone`.

---

### Task 2: As três rotas e a leitura compartilhada das IAs

**Files:**
- Create: `src/hooks/use-ias-conectadas.ts`
- Modify: `src/components/account/ias-secao.tsx` (usa o hook)
- Create: `src/app/(app)/settings/lancar-pelo-iphone/{page.tsx,page-client.tsx,loading.tsx}`
- Create: `src/app/(app)/settings/ias/{page.tsx,page-client.tsx,loading.tsx}`
- Create: `src/app/(app)/settings/notificacoes/{page.tsx,page-client.tsx,loading.tsx}`
- Modify: `src/app/(app)/settings/(raiz)/page-client.tsx` (celular → `/me`)
- Test: `src/app/(app)/settings/settings-rotas.test.ts`

**Interfaces:**
- Consumes: `ROUTES.SETTINGS_*` (Task 1).
- Produces: `export function useIasConectadas(): UseQueryResult<Grant[]>` — a mesma query que hoje está dentro de `IasSecao` (chave `["oauth_grants", user?.id]`, `enabled: Boolean(user)`, `retry: false`, `meta: { errorToast: false }`, `supabase.auth.oauth.listGrants()`). Exportar também `chaveDasIas(uid?: string)` para o `invalidateQueries` da `IasSecao`. `Grant` = o tipo que `listGrants` devolve (inferido).

- [ ] **Step 1: Teste de fonte** (`settings-rotas.test.ts`, com `lerFonte`/`semComentarios` de `@/test/fonte`):
  - cada uma das três `page.tsx` contém `<AdiarMontagem fallback={<Loading />}>`;
  - `lancar-pelo-iphone/page-client.tsx` contém `<AtalhoSecao />`; `ias/page-client.tsx` contém `<IasSecao />`; `notificacoes/page-client.tsx` contém `<NotificationPreferences />`;
  - cada `page-client` mostra o `PageHeader collapse` só fora do celular (como `(raiz)/page-client.tsx`), com o título da rota;
  - `(raiz)/page-client.tsx` contém `router.replace(ROUTES.ME)` e não monta as seções quando `isMobile`;
  - `ias-secao.tsx` contém `useIasConectadas()` e não contém `listGrants`.
- [ ] **Step 2: Rodar e ver falhar.**
- [ ] **Step 3: Implementar.** As páginas seguem o molde de `(raiz)/page.tsx` e `page-client.tsx`; `loading.tsx` reusa `SettingsPageSkeleton`. O `(raiz)/page-client.tsx` faz, no celular, `useEffect(() => { if (isMobile) router.replace(ROUTES.ME) }, [isMobile, router])` e devolve `null` (nada pisca por baixo). O `AtalhoSecao` nas páginas não é filtrado por aparelho (spec, resposta 5).
- [ ] **Step 4: Rodar** — `npx vitest run src/app/\(app\)/settings src/components/account` e `npx tsc --noEmit` → PASS.
- [ ] **Step 5: Commit** — `feat(configuracoes): Lançar pelo iPhone, IAs e Notificações em rotas próprias`.

---

### Task 3: Os cartões e as linhas na aba Você

**Files:**
- Create: `src/components/account/lancar-pelo-iphone-vazio.tsx` (o vazio que hoje está inline no `AtalhoSecao`)
- Modify: `src/components/account/atalho-secao.tsx` (usa o vazio extraído)
- Create: `src/components/me/estado-na-voce.ts` (as regras puras) + `estado-na-voce.test.ts`
- Create: `src/components/me/cartao-da-ia.tsx`, `src/components/me/cartao-de-lancar.tsx`
- Modify: `src/components/settings/neste-celular-grupo.tsx`
- Modify: `src/app/(app)/me/page-client.tsx`
- Test: `src/app/(app)/me/me-page.test.ts`

**Interfaces:**
- Consumes: `useIasConectadas` (Task 2), `useAparelhosDeCaptura` (já existe, `src/components/account/aparelhos-de-captura.ts`), `useAparelhoDeLancar`, `ROUTES.SETTINGS_*`.
- Produces:
  - `export function LancarPeloIphoneVazio({ onConectar }: { onConectar: () => void })` — o `EmptyState` atual do `AtalhoSecao` (`JanelaDoAparelho`, "Lance gastos sem abrir o app", a descrição com Siri, Botão de Ação e toque, "Conectar o iPhone"), sem mudar o texto.
  - Em `estado-na-voce.ts`:
    ```ts
    type Lista = { carregando: boolean; erro: boolean; quantos: number }
    export function iaNaVoce(l: Lista): "cartao" | "linha"           // cartao só se !carregando && !erro && quantos === 0
    export function lancarNaVoce(aparelho: AparelhoDeLancar, l: Lista): "cartao" | "linha" | "convite" | null
    //   "iphone-instalado": cartao só se !carregando && !erro && quantos === 0, senão linha
    //   "navegador-iphone": convite; qualquer outro: null
    export function descricaoDaLista(nomes: string[], plural: string): string | undefined
    //   [] → undefined; [a] → a; [a,b] → "a, b"; 3+ → `${n} ${plural}`
    ```
  - `CartaoDaIa()` — `Card` com `IasVazio` e o `ConectarIaDialog` que ele abre.
  - `CartaoDeLancar()` — `Card` com `LancarPeloIphoneVazio` e o `GuiaDoAtalho` (com `aoCriar` dando `refetch` na lista de aparelhos e `nomesEmUso`).

- [ ] **Step 1: Testes das regras** (`estado-na-voce.test.ts`):
  - `iaNaVoce({carregando:true,erro:false,quantos:0})` → `"linha"`; `{erro:true}` → `"linha"`; `{quantos:0}` carregado → `"cartao"`; `{quantos:2}` → `"linha"`.
  - `lancarNaVoce("iphone-instalado", vazio carregado)` → `"cartao"`; carregando → `"linha"`; com 1 → `"linha"`; `"navegador-iphone"` → `"convite"`; `"navegador-android"`, `"android-instalado"`, `"computador"`, `"sabendo"` → `null`.
  - `descricaoDaLista([], "IAs")` → `undefined`; `(["Claude"])` → `"Claude"`; `(["Claude","ChatGPT"])` → `"Claude, ChatGPT"`; três nomes → `"3 IAs"`.
- [ ] **Step 2: Teste de fonte** em `me-page.test.ts`:
  - `page-client.tsx` contém `<CartaoDaIa />` e só o mostra quando `iaNaVoce(...) === "cartao"`, escondendo a linha `ROUTES.SETTINGS_IAS` nesse caso;
  - `neste-celular-grupo.tsx` contém `<CartaoDeLancar />` e `<ConviteDeInstalar />` **antes** do `<Card padding="none">` do grupo, e a linha com `href={ROUTES.SETTINGS_LANCAR}`;
  - com `"convite"`, a linha "Instalar o app" não é renderizada (procurar o condicional);
  - nenhum dos arquivos novos contém a palavra `Siri` num título (`ItemTitle`/`EmptyStateTitle`).
- [ ] **Step 3: Rodar e ver falhar.**
- [ ] **Step 4: Implementar.**
  - **IA em Conta:** no `page-client` de `/me`, para o grupo `conta`, se `iaNaVoce` der `"cartao"`, renderizar `<CartaoDaIa />` entre o `PageSectionHeader` e o `Card` do grupo, e filtrar o item `SETTINGS_IAS`. Com `"linha"`, a linha de IAs ganha `ItemDescription` = `descricaoDaLista(grants.map(g => g.client.name), "IAs")`.
  - **Lançar em Neste celular:** dentro de `NesteCelularGrupo`, entre o cabeçalho e o `Card`: `"cartao"` → `<CartaoDeLancar />`; `"convite"` → `<ConviteDeInstalar />` (e a linha "Instalar o app" sai). `"linha"` → um `Item variant="flush" interactive asChild className="min-h-12"` com `<Link href={ROUTES.SETTINGS_LANCAR}>`, ícone `DevicePhoneMobileIcon` (20/solid, `size-5`), título "Lançar pelo iPhone", descrição `descricaoDaLista(ativos.map(t => t.name), "aparelhos")` (`ativos` de `useAparelhosDeCaptura()`; a contagem é `ativos.length`, carregando é `isPending`), `ItemChevron` — logo depois da linha do Tema.
  - Os cartões ficam com o respiro do grupo (`PageSection` já dá o `gap`); sem `variant`/`size` além do padrão.
- [ ] **Step 5: Rodar** — `npx vitest run src/components/me src/app/\(app\)/me src/components/account src/components/settings`, `npx tsc --noEmit`, `npm run lint`, `npm run ds:audit -- src/components/me src/components/settings/neste-celular-grupo.tsx src/app/\(app\)/me` → limpos.
- [ ] **Step 6: Commit** — `feat(voce): os cartões de Lançar pelo iPhone e da IA, e as linhas depois de usados`.

---

### Task 4: Jornadas e regras do projeto

**Files:**
- Modify: `docs/JORNADAS.md` (fluxograma de Configurações/Você: as três rotas, Configurações fora do celular, os cartões; tabela de regras; mapa geral se a ponte mudou)
- Modify: `docs/atlas/template.html` (a mesma jornada, data e contagens da capa)
- Modify: `AGENTS.md` (o parágrafo da página `/me` em `BottomBar`: Conta = Minha conta, Cofre aberto, IAs conectadas, Notificações, Sair; os cartões de incentivo; Configurações não existe no telefone)
- Run: `python3 docs/atlas/build.py`

- [ ] **Step 1:** Ler a seção da jornada em `docs/JORNADAS.md` (nós `settings`, `iphInst`, `conviteIph`, `notif`, `connAi`) e atualizar para: no celular `/settings` → `/me`; Você › Neste celular com o cartão/linha de Lançar pelo iPhone; Você › Conta com o cartão/linha de IAs e a linha de Notificações; as três rotas novas e o voltar a Você; o painel de notificações levando a `/settings/notificacoes` no celular. Ids de nó não podem ser palavras reservadas do Mermaid; `%%{init}%%` em todo bloco.
- [ ] **Step 2:** Espelhar em `docs/atlas/template.html`.
- [ ] **Step 3:** `python3 docs/atlas/build.py` → gera `docs/atlas/atlas-jornadas.html` sem erro.
- [ ] **Step 4: Commit** — `docs(jornadas): Você sem Configurações no celular` (com `docs/atlas/atlas-jornadas.html`). A republicação do Atlas é do controlador (ferramenta de Artifact), não do implementador.

---

### Task 5: Verificação no navegador (controlador)

- [ ] `graphify update .`; `npx tsc --noEmit && npm run lint && npm run test:unit`.
- [ ] No painel do navegador a 375px (dev server externo em :3000, conta já logada; **sem gravar dados**): `/me` mostra os grupos com as linhas certas para a conta real; `/settings/ias`, `/settings/notificacoes` e `/settings/lancar-pelo-iphone` abrem com voltar a Você e a aba Você acesa; `/settings` vai a `/me`. Desktop (1280px): `/settings` igual a antes.
- [ ] Republicar o Atlas no mesmo URL.
