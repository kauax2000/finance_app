# Notificações em resumo: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar a lista de dez chaves da seção Notificações de Configurações por duas linhas de resumo que abrem os ajustes, com saída para o push bloqueado.

**Architecture:** A seção continua dona do `useWorkspaceNotificationPrefs` e passa `prefs` e `patch` a dois diálogos novos. Um módulo puro calcula os textos de resumo. O banco e as Edge Functions não mudam.

**Tech Stack:** Next.js 16, React, Tailwind v4, Vitest. Design system em `src/components/ui/`, sem alteração nele.

**Spec:** Sem documento: a decisão do dono foi a opção B do mockup de 2026-11-02, com "Sobre o quê" dividido em grupos como na opção A. As regras estão em Global Constraints.

## Global Constraints

- Nada muda em `src/components/ui/` nem em `globals.css`. Toda peça vem do catálogo.
- Banco, `workspace-notification-prefs.ts` e Edge Functions ficam como estão. `notify_promotions` segue fora da tela.
- Superfícies: `Dialog surface="auto"` (diálogo no desktop, gaveta no telefone), como `carteira-divisao-dialog.tsx`, com `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogBody`. As chaves salvam ao tocar: sem rodapé e sem `FormSubmit`.
- Linhas do resumo: `SettingsLink`, com `Separator` entre elas, dentro de `Card padding="none"`.
- Ícones Heroicons, nenhum literal de cor, `pt-BR` em todo texto.
- Dev usa banco de produção: nunca ligar chave ao testar.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; sem push; `git add` nomeia arquivos.
- Textos exatos:
  - Linhas: `Onde chega`, `Sobre o quê`. `aria-label`: `Escolher onde os avisos chegam`, `Escolher sobre o que avisar`.
  - Canais: `Push neste aparelho`, `Email`, `No app`. Descrição de `No app`: `No sino do Finance.`
  - Grupos e temas: **Carteira** (`Despesas de outros membros`, `Orçamento`, `Contas a pagar`), **Cartões** (`Limite e categorias`, `Fatura e vencimento`), **Rotina** (`Itens a conferir` com `Às 20h.`, `Insights` com `No máximo 3 push por semana.`).
  - Bloqueio: alerta `Este aparelho bloqueou os avisos.`, ação `Como liberar`.
  - Sem canal: alerta `Nenhum canal ligado. Os avisos da carteira não vão chegar.`, ação `Escolher canais`.

## Review Focus

1. Salvar falha com o diálogo aberto: o erro aparece dentro do diálogo, e a chave volta (`Task 2`).
2. Todos os canais desligados: o resumo diz `Nenhum canal` e o alerta aparece; ele vence o alerta de bloqueio (`Task 3`).
3. Push bloqueado: a linha fica desligada e diz como liberar, no iPhone e fora dele (`Task 2`).
4. iPhone no Safari, sem o app instalado: a chave fica desligada, mas `Como instalar` abre a `InstallPwaSheet`. Hoje esse caminho está morto, porque a chave desabilitada não deixa chegar à mensagem (`Task 2`).
5. Fechar o diálogo com o push em andamento: `pending={pushBusy}` trava o fechamento (`Task 2`).

---

### Task 1: Resumo puro

**Files:**
- Create: `src/lib/notificacoes-resumo.ts`
- Test: `src/lib/notificacoes-resumo.test.ts`

**Interfaces:**
- Produces:
  - `TEMAS_DE_NOTIFICACAO: readonly TemaDeNotificacao[]`, as sete chaves
  - `type TemaDeNotificacao = "notify_transactions" | "notify_budget" | "notify_bills" | "notify_credit_cards" | "notify_credit_card_calendar" | "notify_review" | "notify_insights"`
  - `temaLigado(prefs: WorkspaceMemberNotificationPrefs, tema: TemaDeNotificacao): boolean`
  - `resumoDosCanais(prefs: WorkspaceMemberNotificationPrefs): string`
  - `resumoDosTemas(prefs: WorkspaceMemberNotificationPrefs): string`
  - `semCanal(prefs: WorkspaceMemberNotificationPrefs): boolean`

- [ ] **Step 1: Escrever o teste que falha**

```ts
const base = { notify_email: true, notify_in_app: true, notify_push: false, notify_transactions: true, notify_budget: true, notify_bills: true, notify_credit_cards: true, notify_credit_card_calendar: true, notify_review: true, notify_insights: true } as WorkspaceMemberNotificationPrefs

it("resume os canais ligados", () => {
    expect(resumoDosCanais(base)).toBe("Email e app")
    expect(resumoDosCanais({ ...base, notify_push: true })).toBe("Push, email e app")
    expect(resumoDosCanais({ ...base, notify_email: false })).toBe("App")
    expect(resumoDosCanais({ ...base, notify_email: false, notify_in_app: false })).toBe("Nenhum canal")
})
it("conta os temas ligados", () => {
    expect(resumoDosTemas(base)).toBe("7 de 7 temas")
    expect(resumoDosTemas({ ...base, notify_review: false })).toBe("6 de 7 temas")
    expect(resumoDosTemas(Object.fromEntries(Object.entries(base).map(([k]) => [k, false])) as WorkspaceMemberNotificationPrefs)).toBe("Nenhum tema")
})
it("lê os temas com o padrão de hoje: dois pedem true, os outros só caem com false", () => {
    expect(temaLigado({ ...base, notify_bills: null as never }, "notify_bills")).toBe(true)
    expect(temaLigado({ ...base, notify_budget: null as never }, "notify_budget")).toBe(false)
})
it("sem canal é os três desligados", () => {
    expect(semCanal({ ...base, notify_email: false, notify_in_app: false })).toBe(true)
    expect(semCanal(base)).toBe(false)
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/notificacoes-resumo.test.ts`
Expected: FAIL, módulo inexistente.

- [ ] **Step 3: Implementar em `src/lib/notificacoes-resumo.ts`**

`temaLigado` usa `!!` em `notify_transactions` e `notify_budget`, e `!== false` nos outros, o mesmo que `isTypeAllowedForPrefs`. `resumoDosCanais` junta com `new Intl.ListFormat("pt-BR", { type: "conjunction" })` e põe a inicial em maiúscula.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/lib/notificacoes-resumo.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/notificacoes-resumo.ts src/lib/notificacoes-resumo.test.ts
git commit -m "feat(settings): resumo dos canais e temas de notificação"
```

### Task 2: Diálogos de canais e temas

**Files:**
- Create: `src/components/settings/notificacoes-canais-dialog.tsx`
- Create: `src/components/settings/notificacoes-temas-dialog.tsx`
- Test: `src/components/settings/notificacoes-dialogs.test.ts`

**Interfaces:**
- Consumes: `TemaDeNotificacao`, `temaLigado` (Task 1); `WorkspaceMemberNotificationPrefs`, `WorkspaceNotificationPrefsPatch` de `@/lib/workspace-notification-prefs`.
- Produces, com `type Props = { open: boolean; onOpenChange: (open: boolean) => void; prefs: WorkspaceMemberNotificationPrefs; patch: (p: WorkspaceNotificationPrefsPatch) => Promise<void>; disabled: boolean; error: string | null }`:
  - `NotificacoesCanaisDialog(props: Props)`
  - `NotificacoesTemasDialog(props: Props)`

- [ ] **Step 1: Escrever o teste que falha**

Teste de fonte, no estilo de `settings-page.test.ts`, com `lerFonte`:

```ts
const CANAIS = lerFonte("src/components/settings/notificacoes-canais-dialog.tsx")
const TEMAS = lerFonte("src/components/settings/notificacoes-temas-dialog.tsx")

it("as duas superfícies são o diálogo que vira gaveta, e mostram o erro de salvar", () => {
    for (const f of [CANAIS, TEMAS]) {
        expect(f).toContain('surface="auto"')
        expect(f).toContain('<Alert tone="destructive" size="sm">')
    }
})
it("os temas vêm em três grupos, com os nomes novos", () => {
    for (const t of ["Carteira", "Cartões", "Rotina", "Despesas de outros membros", "Orçamento", "Contas a pagar", "Limite e categorias", "Fatura e vencimento", "Itens a conferir", "Às 20h.", "Insights", "No máximo 3 push por semana."]) expect(TEMAS).toContain(t)
    expect(TEMAS).toContain("temaLigado(prefs, ")
})
it("o push mantém o tratamento de hoje, trava o fechamento e tem saída", () => {
    for (const t of ["Push neste aparelho", "No sino do Finance.", "subscribeToPush", "unsubscribeFromPush", "pending={pushBusy}", "Desligar remove este aparelho de todas as carteiras.", "Não disponível neste navegador", "InstallPwaSheet", "Como instalar", "isIos && !isStandalone", "Ajustes", "configurações do site"]) expect(CANAIS).toContain(t)
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components/settings/notificacoes-dialogs.test.ts`
Expected: FAIL, arquivos inexistentes.

- [ ] **Step 3: Implementar `NotificacoesTemasDialog`**

`Dialog surface="auto"`, título `Sobre o quê`, sem descrição. No `DialogBody`, o `Alert` de erro quando `error`, depois um `Card padding="none"` por grupo. Cada um abre com `CardToolbar variant="label"` e tem `FormSwitch` em `<div className="px-4 py-3">`, com `Separator` entre linhas, como a seção faz hoje. Os grupos são uma tabela no topo do arquivo, com `tema`, `label` e `description?`. `onCheckedChange` chama `void patch({ [tema]: checked })`.

- [ ] **Step 4: Implementar `NotificacoesCanaisDialog`**

Título `Onde chega`, um `Card padding="none"` com as três chaves e o mesmo `Alert` de erro. Mova para cá de `notification-preferences.tsx`, sem mudar a lógica: `handlePushToggle`, `pushBusy`, `pushMessage`, `installPwaOpen`, `useDisplayMode`, `useIsIos`, `getPushSupportState`, `isPushSupported` e a `InstallPwaSheet`. Diferenças:

- `Dialog pending={pushBusy}`.
- Com `isIos && !isStandalone`, a descrição do push é `No iPhone, o push pede o app instalado.`, e o `Button variant="link"` `Como instalar` fica sempre à vista abaixo da linha, e não só com `pushMessage`.
- Com `pushSupport === "denied"`, a descrição é `Abra Ajustes › Notificações › Finance e permita os avisos.` no iPhone, e `Abra as configurações do site no navegador e permita as notificações.` fora dele.

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run src/components/settings/notificacoes-dialogs.test.ts && npx tsc --noEmit`
Expected: PASS, sem erro de tipo.

- [ ] **Step 6: Commit**

```bash
git add src/components/settings/notificacoes-canais-dialog.tsx src/components/settings/notificacoes-temas-dialog.tsx src/components/settings/notificacoes-dialogs.test.ts
git commit -m "feat(settings): diálogos de canais e temas de notificação"
```

### Task 3: A seção vira resumo

**Files:**
- Modify: `src/components/settings/notification-preferences.tsx`
- Modify: `src/components/settings/settings-page.test.ts:113-117`
- Modify: `docs/JORNADAS.md`, `docs/atlas/template.html`, `docs/atlas/atlas-jornadas.html`

**Interfaces:**
- Consumes: `NotificacoesCanaisDialog`, `NotificacoesTemasDialog` (Task 2); `resumoDosCanais`, `resumoDosTemas`, `semCanal` (Task 1).

- [ ] **Step 1: Trocar o teste de `settings-page.test.ts`**

```ts
it("Notificações: duas linhas de resumo que abrem os ajustes, com saída para o push bloqueado", () => {
    const f = lerFonte("src/components/settings/notification-preferences.tsx")
    for (const texto of ['id="notificacoes"', "Ver histórico", "Onde chega", "Sobre o quê", "resumoDosCanais(prefs)", "resumoDosTemas(prefs)", "<NotificacoesCanaisDialog", "<NotificacoesTemasDialog", "Este aparelho bloqueou os avisos.", "Como liberar", "Nenhum canal ligado. Os avisos da carteira não vão chegar.", "Escolher canais"]) expect(f).toContain(texto)
    for (const fora of ["FormSwitch", "subscribeToPush", "CardToolbar"]) expect(f).not.toContain(fora)
    expect(f).toMatch(/semCanal\(prefs\) \?[\s\S]+: getPushSupportState\(\) === "denied"/)
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components/settings/settings-page.test.ts`
Expected: FAIL.

- [ ] **Step 3: Reescrever `NotificationPreferences`**

Mantém `SettingsSection`, `Ver histórico`, o esqueleto (agora duas `PrefRowSkeleton` separadas por `Separator`) e o `Alert` de erro no cartão. Com `prefs`, o cartão tem dois `SettingsLink`. Abaixo dele, um único `Alert tone="warning" size="sm"`: `semCanal(prefs)` vence `getPushSupportState() === "denied"`, e os dois têm `AlertTitle` e `AlertActions placement="inline"` com um `AlertAction` que abre o diálogo de canais. Estado: `canaisOpen` e `temasOpen`. Os dois diálogos ficam fora do `Card`, e só montam com `prefs`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx tsc --noEmit && npm run lint && npx vitest run && npm run ds:audit -- src/components/settings`
Expected: tudo passa, sem aviso novo.

- [ ] **Step 5: Atualizar a jornada**

Em `docs/JORNADAS.md`, no fluxo de `settings --> notif`, e em `docs/atlas/template.html`, diga que a seção abre `Onde chega` e `Sobre o quê` em diálogos. Atualize a data da capa e rode `python3 docs/atlas/build.py`. Quem controla republica o Atlas.

- [ ] **Step 6: Commit**

```bash
git add src/components/settings/notification-preferences.tsx src/components/settings/settings-page.test.ts docs/JORNADAS.md docs/atlas/template.html docs/atlas/atlas-jornadas.html
git commit -m "feat(settings): notificações em duas linhas de resumo"
```
