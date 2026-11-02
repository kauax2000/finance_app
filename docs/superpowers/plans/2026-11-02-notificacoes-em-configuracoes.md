# Notificações de volta em Configurações

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Desfazer as telas `/settings/notificacoes/canais` e `/settings/notificacoes/temas`: as chaves delas moram na seção Notificações de Configurações, com o aviso em cima e sem "Ver histórico".

**Architecture:** As duas telas viram duas peças sem rota, `NotificacoesCanais` e `NotificacoesTemas`, que recebem `prefs` e `patch` da `NotificationPreferences`. As rotas, as constantes e o que só servia a elas somem.

**Tech Stack:** Next.js 16, React 19, Vitest.

**Spec:** Sem documento. Pedido do dono em 2026-11-02: as duas páginas se descriam, o conteúdo entra em Configurações, o aviso vai para cima das configurações de notificações, e o botão "Ver histórico" sai. No mockup comparado no navegador o dono escolheu a opção C.

## Global Constraints

- Layout C, de cima para baixo: título "Notificações" e o alcance; os avisos; subtítulo "Onde chega" e um cartão com as três chaves; subtítulo "Sobre o quê" e três cartões com rótulo (`CardToolbar variant="label"`): Carteira, Cartões e Rotina.
- Sem esse layout mudar entre desktop e telefone.
- Sem rotas novas e sem redirecionamento: as duas rotas só existem nesta branch, nunca publicada.
- Sem "Ver histórico". O sino segue abrindo as notificações.
- Os avisos ficam acima de "Onde chega", e nenhum leva botão de ação, porque as chaves estão logo abaixo.
- Textos das chaves, descrições e `pref-*` não mudam. `#notificacoes` segue como âncora.
- Sem `git stash`. `git add` nomeia arquivos. Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sem push. Dev usa banco de produção: nada se grava ao testar.

## Review Focus

1. Push: `pushBusy`, `pushMessage`, "Como instalar" e a folha `InstallPwaSheet` seguem funcionando dentro da seção (`Task 1`).
2. Sem carteira (`currentWorkspaceId` nulo): a seção mostra só o título, como hoje, sem chave (`Task 1`).
3. Falha ao carregar: o erro aparece em cima e nenhuma chave é desenhada com `prefs` nulo (`Task 1`).
4. `/settings#notificacoes`, do menu ⋯ do painel, rola até a seção mesmo com ela mais alta (`Task 1`).
5. Títulos: "Onde chega" e "Sobre o quê" são `<h3>` sob o `<h2>` Notificações (`Task 1`).

---

### Task 1: As chaves na seção, sem as rotas

**Files:**
- Rename: `src/components/settings/notificacoes-canais-tela.tsx` para `notificacoes-canais.tsx`
- Rename: `src/components/settings/notificacoes-temas-tela.tsx` para `notificacoes-temas.tsx`
- Modify: `src/components/settings/notification-preferences.tsx`
- Modify: `src/components/settings/settings-section.tsx`, `src/lib/notificacoes-resumo.ts`, `src/config/navigation.ts`, `src/components/layout/sidebar-app-shell.tsx`
- Delete: `src/app/(app)/settings/notificacoes/`, `src/components/settings/notificacoes-tela-skeleton.tsx`
- Rewrite: `src/components/settings/notificacoes-telas.test.ts`
- Modify: `src/components/settings/settings-page.test.ts`, `src/lib/notificacoes-resumo.test.ts`, `src/lib/direcao-da-tela.test.ts`, `src/lib/papeis/rotas-do-convidado.test.ts`, `src/lib/captura/a-conferir.test.ts`, `src/lib/insights/acoes.test.ts`

**Interfaces:**
- Produces: `NotificacoesCanais({ prefs, patch })` e `NotificacoesTemas({ prefs, patch })`, com os tipos do retorno de `useWorkspaceNotificationPrefs` (exporte um tipo se faltar). Cada uma devolve só a própria seção, sem `PageHeader`, sem `Muted` de alcance e sem estado de carregamento.

- [ ] **Step 1: Escrever o teste que falha**

Reescreva `notificacoes-telas.test.ts`, com `lerFonte`:

```ts
const secao = lerFonte("src/components/settings/notification-preferences.tsx")
const canais = lerFonte("src/components/settings/notificacoes-canais.tsx")
const temas = lerFonte("src/components/settings/notificacoes-temas.tsx")

it("as chaves moram na seção, sem rota própria", () => {
    expect(existsSync("src/app/(app)/settings/notificacoes")).toBe(false)
    expect(lerFonte("src/config/navigation.ts")).not.toContain("SETTINGS_NOTIFICACOES")
    expect(secao).toContain("<NotificacoesCanais")
    expect(secao).toContain("<NotificacoesTemas")
})
it("o layout C: dois subtítulos e três cartões de tema", () => {
    expect(canais).toContain(">Onde chega<")
    expect(temas).toContain(">Sobre o quê<")
    expect(temas).toContain('variant="label"')
    for (const grupo of ["Carteira", "Cartões", "Rotina"]) expect(temas).toContain(`titulo: "${grupo}"`)
})
it("o aviso vem antes das chaves, sem botão de ação", () => {
    expect(secao.indexOf("Este aparelho bloqueou os avisos.")).toBeLessThan(secao.indexOf("<NotificacoesCanais"))
    expect(secao.indexOf("Nenhum canal ligado.")).toBeLessThan(secao.indexOf("<NotificacoesCanais"))
    expect(secao).not.toContain("AlertAction")
    expect(secao).toContain('storageKey="push-bloqueado"')
})
it("sem Ver histórico, e o push segue na seção", () => {
    expect(secao).not.toContain("Ver histórico")
    expect(secao).not.toContain("useNotificationsUi")
    for (const t of ["pref-push", "InstallPwaSheet", "subscribeToPush", "Como instalar"]) expect(canais).toContain(t)
})
```

Em `settings-page.test.ts`, troque a lista de textos do teste de Notificações pelas novas e tire `"FormSwitch"` e `"Dialog"` da lista de fora, que não valem mais em `notification-preferences.tsx`, conforme o que ele importar.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components/settings/notificacoes-telas.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

- Use `git mv` nos dois arquivos. Tire `PageHeader`, `Muted`, o `topo`, o `if (loading)` e o bloco `!prefs || !currentWorkspace`, o `useWorkspace` e o `useIsMobile`.
- Cada peça é uma `PageSection size="sm"` aninhada, com `PageSectionHeader` e `PageSectionTitle`: a profundidade dá o `<h3>`. Em `NotificacoesTemas`, os três cartões ficam num `div` com o mesmo `space-y` da seção.
- `NotificationPreferences`, nesta ordem: alerta de erro (`tone="destructive"`, fora do cartão), `semCanal(prefs)` ou push `denied`, as duas peças. Os avisos seguem com `tone="warning" size="sm"`, sem `AlertActions`. Mantenha o `storageKey="push-bloqueado"`.
- O `error` que hoje mora nas telas sai delas: a seção é a dona dele.
- Esqueleto: a `NotificationPreferencesSkeleton` desenha dois `Card padding="none"`, com 3 e 7 linhas de chave, levando para `notification-preferences.tsx` a linha de `NotificacoesTelaSkeleton`. O arquivo antigo some.
- `notificacoes-resumo.ts`: saem `resumoDosCanais` e `resumoDosTemas`, e os testes deles; ficam `semCanal`, `temaLigado` e `TemaDeNotificacao`.
- `SettingsLink`: com `workspace-appearance-settings.tsx` usando só `onClick`, saia o ramo `href` e o import de `Link`; se alguém ainda passar `href`, deixe como está.
- `navigation.ts`: saem as duas constantes e as duas entradas de título. `sidebar-app-shell.tsx`: saem as duas linhas 51 e 52.
- `direcao-da-tela.test.ts`: troque o fixture por `/account/sessions`, com pai `/account`. `rotas-do-convidado.test.ts`: tire as duas linhas. `a-conferir.test.ts` e `acoes.test.ts`: aponte para `notificacoes-temas.tsx`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx tsc --noEmit && npm run lint && npx vitest run && npm run ds:audit -- src/components/settings`
Expected: `tsc` limpo, lint sem erro novo, testes passando, auditor sem achado novo. Apague `.next/types` se o `tsc` citar rota velha. Rode `graphify update .`.

- [ ] **Step 5: Commit**

Nomeie os arquivos, com `graphify-out`. Mensagem: `refactor(settings): as chaves de notificação voltam à seção`.

### Task 2: Jornada e Atlas

**Files:**
- Modify: `docs/JORNADAS.md`, `docs/atlas/template.html`, `docs/atlas/atlas-jornadas.html` (por `python3 docs/atlas/build.py`)

**Interfaces:**
- Consumes: as rotas removidas e os avisos sem ação (Task 1).

- [ ] **Step 1: `docs/JORNADAS.md`**

Na seção 2: no fluxograma, o nó `notif` vira "Notificações: as chaves à vista" e saem `canais`, `temas` e as quatro arestas deles, com a seta do alerta. A linha "Onde chega e Sobre o quê (2/nov/2026)" da tabela de regras passa a dizer que as chaves moram na seção, com o aviso em cima e sem ação, e que cada chave salva ao tocar.

- [ ] **Step 2: `docs/atlas/template.html`**

Reescreva o trecho de Notificações em "Configurar", tire as duas linhas das rotas do apêndice, ajuste a linha de `/settings`, a linha de `/settings` no painel de Notificações se citar a rota, e ponha na frente da data da capa: `2 nov 2026 · as notificações voltaram para dentro de Configurações;`. A contagem de fluxogramas não muda.

- [ ] **Step 3: Gerar e conferir**

Run: `python3 docs/atlas/build.py && grep -c "settings/notificacoes" docs/atlas/template.html docs/JORNADAS.md`
Expected: `ok` e 0 nos dois arquivos.

- [ ] **Step 4: Commit**

Nomeie os arquivos. Mensagem: `docs: notificações em Configurações na jornada e no Atlas`.
