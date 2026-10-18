# Notificações: redesenho e revisão da lógica — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O painel de notificações vira a folha flutuante do app, agrupada por dia, com tom, filtro e ações; o cliente conta e atualiza certo e para de mandar notificação para si mesmo; o servidor ganha textos com contexto e deixa de errar nos filtros e na repetição — pronto para o dono publicar.

**Architecture:** Três peças novas no `Item` do design system (aprovadas). O painel (`src/components/layout/notifications-*`) compõe `Sheet` floating + a cromagem do `Dialog` + `Item`. A lógica pura (tom, href, contagem) mora em `src/lib/`; os textos do servidor saem de um módulo puro em `supabase/functions/_shared/`, testado com `deno test`.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, Supabase JS, Deno (edge functions), Vitest, `deno test`.

**Spec:** `docs/superpowers/specs/2026-10-17-notificacoes-redesign-design.md`

## Global Constraints

- **Nunca gravar no banco** (o de desenvolvimento é o de produção): nada de marcar, excluir ou limpar notificações reais para testar, e nenhum `supabase functions deploy`, `supabase db push`, `supabase link` nem chamada a funções remotas. Testes de servidor são `deno test` locais e puros.
- Em `src/components/ui/` só muda o `item.tsx` (Task 1, aprovada pelo dono). Nada em `globals.css`.
- Ícones `@heroicons/react/16/solid` dentro das linhas; tokens só (`warning-muted`, `destructive-muted`, `info-muted`, `muted` e as `-muted-foreground`).
- Textos e comentários em português, na densidade dos arquivos vizinhos.
- `npx tsc --noEmit && npm run lint && npm run test:unit` passam ao fim de cada tarefa; nas de servidor, também `npm run test:edge`.
- Commits com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Abrir o painel com mais de 100 notificações não pode baixar o número do sino. Teste na Task 3 (`unreadAfterOpen`).
2. Uma busca que falha mostra o erro com "Tentar de novo", nunca "Nenhuma notificação". Teste de fonte na Task 4.
3. Uma notificação criada às 22:30 em Brasília aparece no grupo do próprio dia, não no seguinte. Teste na Task 2 (`horaLocal`/agrupamento com fuso).
4. `metadata.href` com `\t`, `\n`, `\\` ou `//` não navega para fora. Teste na Task 2 e na Task 6.
5. Salvar um orçamento sem mudar o valor não rearma os alertas; mudar o valor rearma os três. Teste na Task 5.

---

### Task 1: As três peças novas do `Item` (design system)

**Files:**
- Modify: `src/components/ui/item.tsx`
- Modify: `src/app/designsystem/docs/item.tsx` (a página do `Item`), `AGENTS.md` (bullet do `Item`), `docs/design/HISTORICO-DESIGN-SYSTEM.md` (rodada 307)
- Test: `src/components/ui/item-versions.test.ts` (crie se não existir; siga o padrão dos `*-versions.test.ts` com `lerFonte`)

**Interfaces:**
- Produces (exportados de `@/components/ui/item`):
  - `ItemMedia` ganha `variant="tile"` e a prop `tone?: "neutral" | "info" | "warning" | "destructive"` (padrão `neutral`). O tile é um círculo (`rounded-full`) de 32 no `md`, 28 no `sm`, 40 no `lg` (pelo `group-data-[size=…]/item`, como a `image`), fundo `bg-muted` / `bg-info-muted` / `bg-warning-muted` / `bg-destructive-muted` e a tinta do ícone `text-muted-foreground` / `text-info-muted-foreground` / `text-warning-muted-foreground` / `text-destructive-muted-foreground`; ícone de 16. As classes por extenso (sem classe montada).
  - `ItemLink`: `React.ComponentProps<"button"> & { asChild?: boolean }`, `data-slot="item-link"`. É o alvo da linha: sem fundo nem borda, `text-start`, e um `after:absolute after:inset-0 after:content-['']` que cobre o `Item` (o `Item` com `ItemLink` filho ganha `relative`, por `has-[>[data-slot=item-link]]:relative` ou dentro do `ItemContent`), e o foco visível pinta o anel no `Item` (`has-[[data-slot=item-link]:focus-visible]:…` — use `focus-visible:` no `ItemLink` com o anel no `::after` se o `has-` não couber). As `ItemActions` de um `Item` com `ItemLink` sobem a `relative z-10`. Siga o `CardLink` de `card.tsx` como referência.
  - `ItemGroupLabel`: `React.ComponentProps<"div"> & { sticky?: boolean }`, `data-slot="item-group-label"`: rótulo em sobrancelha (`text-xs font-medium text-muted-foreground`, `px-3 py-1.5`); com `sticky`, `sticky top-0 z-10 bg-(--item-group-label-surface,var(--color-popover))`.
- [ ] **Step 1: Write the failing tests** em `item-versions.test.ts`:
  ```ts
  const CODIGO = lerFonte("src/components/ui/item.tsx")
  expect(CODIGO).toContain('tile:')
  for (const t of ["bg-info-muted", "bg-warning-muted", "bg-destructive-muted", "text-warning-muted-foreground"]) expect(CODIGO).toContain(t)
  expect(CODIGO).toContain('data-slot="item-link"')
  expect(CODIGO).toContain('data-slot="item-group-label"')
  expect(CODIGO).toContain("--item-group-label-surface")
  ```
  e um teste de render (`renderToStaticMarkup`, como `kbd-group.test.ts`): `ItemMedia variant="tile" tone="warning"` tem `data-variant="tile"` e a classe `bg-warning-muted`; `ItemGroupLabel sticky` tem `sticky`.
- [ ] **Step 2:** `npx vitest run src/components/ui/item-versions.test.ts` → FAIL.
- [ ] **Step 3: Implement** as três peças em `item.tsx` (exporte `ItemLink` e `ItemGroupLabel` no bloco `export {}`).
- [ ] **Step 4:** página do catálogo: um exemplo "Lista de avisos" com `ItemGroupLabel sticky`, três `Item` com `ItemMedia variant="tile"` em tons diferentes, `ItemLink` e uma `ItemActions` com um botão; linhas novas na `PropsTable`. `AGENTS.md`: no bullet do `Item`, "`ItemMedia variant="tile" tone`, `ItemLink` (a linha clicável com ações dentro, como o `CardLink`) e `ItemGroupLabel sticky`". Histórico: rodada 307 com o porquê (o painel de notificações) e o que foi medido. Rode `npm run ds:docs-map` se a página mudar de seções.
- [ ] **Step 5:** o teste → PASS; `npx tsc --noEmit && npm run lint && npm run test:unit` limpos (há testes do catálogo: `doc-pages.test.ts`).
- [ ] **Step 6: Commit** `feat(ds): o Item ganha o ladrilho de tom, o link esticado e o rótulo de grupo`.

### Task 2: A lógica pura das notificações

**Files:**
- Modify: `src/lib/notification-visuals.tsx`, `src/lib/notification-actions.ts`, `src/lib/notification-href.ts`, `src/lib/notifications.ts`
- Test: `src/lib/notification-visuals.test.ts` (novo), `src/lib/notification-href.test.ts` (existe), `src/lib/notification-actions.test.ts` (novo)

**Interfaces:**
- Produces:
  ```ts
  // notification-visuals.tsx
  export type NotificationTone = "neutral" | "info" | "warning" | "destructive"
  export function notificationTone(n: AppNotification): NotificationTone
  export function getNotificationIcon(n: AppNotification): ReactNode  // sem classe de cor: a tinta vem do ItemMedia tile
  // notifications.ts
  export async function markUnread(userId: string, workspaceId: string, id: string): Promise<void>
  /** A hora local "HH:mm" de um ISO. */
  export function horaLocal(iso: string): string
  ```
- [ ] **Step 1: Write the failing tests.**
  `notificationTone` (monte `AppNotification` mínimas):
  - `budget_threshold` com `threshold: "threshold_80_sent_at"` → `"warning"`; `"threshold_100_sent_at"` → `"destructive"`; `"threshold_over_sent_at"` → `"destructive"`; sem `threshold` → `"warning"`.
  - `cc_limit_warning` → `"warning"`; `cc_limit_reached`, `cc_limit_exceeded` → `"destructive"`; `cc_category_limit_crossed` → `"warning"`; `cc_invoice_closed`, `cc_invoice_closing_soon`, `cc_payment_due_soon` → `"info"`; `cc_payment_due_today` → `"warning"`.
  - `bill_reminder` com `offset_days: -1` → `"destructive"`; com `offset_days: 0` → `"warning"`; com `3` → `"info"`; sem o campo → `"warning"`.
  - `member_expense_created`, `invite_accepted`, `category_created`, desconhecido → `"neutral"`.
  `horaLocal`: com `process.env.TZ = "America/Sao_Paulo"` definido no topo do arquivo de teste (antes de criar datas), `horaLocal("2026-10-17T01:30:00.000Z")` → `"22:30"`.
  `getNotificationAction` (notification-actions.test.ts): `metadata.href` `"/\t/evil.com"`, `"/\n/evil.com"`, `"/\\evil.com"` e `"//evil.com"` → não usa o href (cai no destino do `kind` ou `null`); `"/categories/abc"` → usa. Em `notification-href.test.ts`, os mesmos quatro casos em `resolveNotificationHref` caem no fallback.
- [ ] **Step 2:** `npx vitest run src/lib/notification-visuals.test.ts src/lib/notification-actions.test.ts src/lib/notification-href.test.ts` → FAIL.
- [ ] **Step 3: Implement.** `notificationTone` usa `resolveAppNotificationKind` e `metadata.offset_days`. `getNotificationIcon` perde o `text-muted-foreground` fixo (o tile pinta). A checagem do href (as duas funções) recusa qualquer caractere de controle (`/[\u0000-\u001f\u007f]/`), `\` e o começo `//`. `markUnread`: o `update({ read_at: null })` com os mesmos filtros de `markRead`. `horaLocal`: `new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })`.
- [ ] **Step 4:** → PASS; gate limpo.
- [ ] **Step 5: Commit** `feat(notificacoes): o tom, a hora local, marcar como não lida e o href endurecido`.

### Task 3: O sino conta e se renova

**Files:**
- Modify: `src/components/layout/notification-bell-link.tsx`, `src/components/layout/notifications-ui-provider.tsx`
- Create: `src/lib/unread-count.ts`
- Test: `src/lib/unread-count.test.ts`, `src/components/layout/notification-bell-link.test.ts` (fonte)

**Interfaces:**
- Produces:
  ```ts
  // unread-count.ts — as regras puras do número do sino
  /** O sino nunca baixa por abrir o painel: o número exato do servidor vence o tamanho da lista. */
  export function unreadAfterOpen(serverCount: number, listUnread: number): number   // = serverCount
  export function unreadAfterDelta(current: number, delta: number): number          // nunca < 0
  export const BELL_POLL_MS = 60_000
  ```
  O provider continua expondo `adjustUnreadCount`, `setUnreadCount`, `invalidateUnreadBadge` e `badgeNonce`; o painel (Task 4) **não** chama mais `setUnreadCount(rows.filter(...).length)`.
- [ ] **Step 1: Write the failing tests.** `unreadAfterOpen(140, 100)` → `140`; `unreadAfterOpen(3, 3)` → `3`; `unreadAfterDelta(0, -1)` → `0`; `unreadAfterDelta(5, -2)` → `3`; `BELL_POLL_MS` → `60000`. Fonte do sino: contém `badgeNonce`, `BELL_POLL_MS`, `visibilityState` e uma guarda de sequência (`seq` ou `ref` de contagem comparada antes do `setUnreadCount`).
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3: Implement.** O sino: refaz a contagem quando `badgeNonce` muda, a cada `BELL_POLL_MS` com `document.visibilityState === "visible"` (um `setInterval` limpo no desmonte, que pula quando oculta), ao voltar à aba e ao trocar de carteira; cada resposta só vale se for a mais recente (sequência). `ponytail:` comentário com o teto (sondagem de 60s; o Realtime é o caminho de volta, parte C).
- [ ] **Step 4:** → PASS; gate limpo.
- [ ] **Step 5: Commit** `fix(notificacoes): o sino conta certo e se renova`.

### Task 4: O painel redesenhado

**Files:**
- Modify: `src/components/layout/notifications-sheet.tsx`, `src/components/layout/notifications-panel.tsx`, `src/components/layout/notifications-panel-empty.tsx`, `src/components/settings/notification-preferences.tsx` (só o `id="notificacoes"` na seção)
- Create (se o painel passar de ~300 linhas): `src/components/layout/notification-row.tsx`
- Test: `src/components/layout/notifications-panel.test.ts` (fonte)

**Interfaces:**
- Consumes: Task 1 (`ItemMedia variant="tile" tone`, `ItemLink`, `ItemGroupLabel sticky`); Task 2 (`notificationTone`, `getNotificationIcon`, `markUnread`, `horaLocal`); Task 3 (o painel ajusta o sino só por `adjustUnreadCount`/`setUnreadCount(0)`); `groupByLocalDay`, `formatDayHeadingPtBr` de `@/lib/transaction-date`; `markAllRead`, `clearAllNotifications`, `deleteNotification`, `markRead`, `listNotifications` de `@/lib/notifications`; `useConfirmDialog`.
- [ ] **Step 1: Write the failing test** (`lerFonte` + `semComentarios` dos arquivos do painel e da folha juntos):
  ```ts
  expect(folha).toContain('variant="floating"')
  expect(folha).toContain('size="md"')
  expect(folha).not.toContain('variant="flush"')
  expect(folha).not.toMatch(/sr-only/)                     // o título é o do cabeçalho
  expect(painel).toContain("DialogHeaderRow")
  expect(painel).toContain("DialogBody")
  expect(painel).toContain("DialogCloseButton")
  expect(painel).toContain('variant="segmented"')
  expect(painel).toContain("groupByLocalDay(")
  expect(painel).toContain("ItemGroupLabel")
  expect(painel).toContain('variant="tile"')
  expect(painel).toContain("ItemLink")
  expect(painel).toContain("Marcar todas como lidas")
  expect(painel).toContain("Preferências de notificação")
  expect(painel).toContain("#notificacoes")
  expect(painel).toContain("Limpar todas")
  expect(painel).toContain("Marcar como não lida")
  expect(painel).toContain("Não deu para carregar as notificações.")
  expect(painel).toContain("Tentar de novo")
  expect(painel).toContain("Tudo lido")
  expect(painel).toContain("Mostrando as 100 mais recentes")
  expect(painel).not.toContain("formatRelativeTime")
  expect(painel).not.toMatch(/setUnreadCount\(\s*rows/)    // o sino não é sobrescrito pela lista
  expect(painel).not.toContain("toastPageFetchError")
  expect(lerFonte("src/components/settings/notification-preferences.tsx")).toContain('id="notificacoes"')
  ```
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3: Implement** a seção A do desenho, inteira:
  - Folha: `SheetContent side="right" variant="floating" size="md" fillMobileViewport={isMobile}`, sem `className` de geometria; `DialogCloseButton` último filho.
  - Cabeçalho: `DialogHeader` + `DialogHeaderRow` com `DialogTitle` "Notificações", o `Badge variant="soft" size="xs"` "N novas" (N = o número do sino) e, no `endAdornment`, o ⋯ (`Button tertiary icon-sm`, `aria-label="Mais ações"`) com o `DropdownMenu`: "Marcar todas como lidas" (`disabled` com 0; chama `markAllRead`, zera o sino e marca as linhas carregadas), "Preferências de notificação" (fecha e `router.push(\`${ROUTES.SETTINGS}#notificacoes\`)`), separador, "Limpar todas…" (`variant="destructive"`, `useConfirmDialog` com o texto de hoje).
  - Filtro: `ToggleGroup type="single" variant="segmented" size="sm"`, "Todas" e "Não lidas" com a contagem das não lidas carregadas; some sem notificação nenhuma.
  - Lista: `groupByLocalDay(lista, (n) => n.created_at)`; por grupo, `ItemGroupLabel sticky` com `formatDayHeadingPtBr(grupo.data)` e um `ItemGroup` das linhas. Linha: `Item size="md"` com `ItemMedia variant="tile" tone={notificationTone(n)}` + `getNotificationIcon(n)`; `ItemContent` com `ItemLink` (o clique: se tem destino, fecha e navega na hora e marca como lida em segundo plano; se não tem, só marca como lida) envolvendo `ItemTitle` (`font-semibold` não lida / `font-medium` lida) e `ItemDescription` (`line-clamp-2`); `ItemActions` com a hora (`horaLocal`), o `BadgeDot` se não lida, o botão de marcar lida/não lida (`Button tertiary icon-xs`, `CheckIcon`/`EnvelopeIcon`, com `Tooltip`; `pointer-coarse:hidden`, e no cursor só aparece no hover/foco da linha via `group-hover/item:opacity-100` com o par de foco) e o ⋯ (`DropdownMenu mobile="sheet"`: "Marcar como lida" ou "Marcar como não lida", e "Excluir" `destructive`, que tira a linha na hora — sem desfazer).
  - Estados: esqueleto (`SkeletonGroup` com linhas de círculo de 32 + duas linhas de texto); erro → `Alert tone="destructive" size="sm"` "Não deu para carregar as notificações." com `AlertAction` "Tentar de novo"; vazio → `NotificationsPanelEmpty variant="inbox-empty"` enxuto (sem a lista de tópicos; botão "Preferências de notificação" `tertiary`); "Não lidas" vazio → `EmptyStateIcon variant="done"`, "Tudo lido", botão "Ver todas"; com 100 carregadas, `Caption` "Mostrando as 100 mais recentes." no fim.
  - O sino: o painel só ajusta por delta (`adjustUnreadCount(-1)` ao ler/excluir não lida, `+1` ao desmarcar) e `setUnreadCount(0)` ao marcar todas e ao limpar; ao carregar a lista, não toca no sino. Quando o `badgeNonce` muda com o painel aberto, a lista recarrega.
- [ ] **Step 4:** → PASS; gate limpo; `npm run ds:audit -- src/components/layout/notifications-panel.tsx src/components/layout/notifications-sheet.tsx` sem achados novos.
- [ ] **Step 5: Commit** `feat(notificacoes): o painel flutuante, agrupado por dia, com tom, filtro e ações`.

### Task 5: Os disparos no cliente

**Files:**
- Modify: `src/app/(app)/categories/page-client.tsx` (~484), `src/components/categories/category-create-dialog.tsx` (~165), `src/components/categories/categories-onboarding-wizard.tsx` (~369), `src/lib/transaction-detail-sheet-mutations.ts` (~76-90), `src/components/transactions/transaction-form-persistence.ts` (~53), `src/lib/category-budget-ops.ts`, e quem chama `upsertCategoryBudget` (passa o valor anterior)
- Test: `src/lib/category-budget-ops.test.ts` (novo), `src/lib/notification-producers.test.ts` (novo, fonte)

**Interfaces:**
- Produces: `buildBudgetRow` exportado; `CategoryBudgetUpsertInput` ganha `previousAmount?: number | null`.
- [ ] **Step 1: Write the failing tests.**
  `buildBudgetRow({ …, amount: 500, previousAmount: 400 })` contém `threshold_80_sent_at: null`, `threshold_100_sent_at: null`, `threshold_over_sent_at: null`; com `previousAmount: 500` e com `previousAmount` ausente, não contém as chaves.
  Fonte: nenhum dos três arquivos de categoria contém `"dispatch-notifications"`; `transaction-detail-sheet-mutations.ts` chama `evaluate-budgets` também no ramo `editing` (a contagem de `"evaluate-budgets"` no arquivo é ≥ 2); `transaction-form-persistence.ts` contém `scheduleEvaluateCreditCardAlerts(`.
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3: Implement.** Tire as três chamadas `dispatch-notifications` de categoria criada (e os imports órfãos). No `editing`, a despesa online chama `evaluate-budgets` com o mesmo corpo da criação. Na compra parcelada, `scheduleEvaluateCreditCardAlerts({ workspaceId, type: "expense", paymentMethod: payload.paymentMethod, paymentCreditCardId: payload.paymentCreditCardId, categoryId: payload.categoryId, dateIso: \`${payload.firstBillingYmd}T12:00:00.000Z\` })`. Em `buildBudgetRow`, os três nulos quando `previousAmount != null && previousAmount !== amount`; quem salva um orçamento existente passa o `amount` anterior que já tem em mãos (procure `upsertCategoryBudget(`).
- [ ] **Step 4:** → PASS; gate limpo.
- [ ] **Step 5: Commit** `fix(notificacoes): sem aviso para si mesmo, alertas na edição e na parcelada, e o orçamento que rearma`.

### Task 6: Os textos e as regras do servidor

**Files:**
- Create: `supabase/functions/_shared/notification-copy.ts`, `supabase/functions/_shared/notification-copy.test.ts`, `supabase/functions/_shared/notification-schedule.ts`, `supabase/functions/_shared/notification-schedule.test.ts`
- Modify: `supabase/functions/_shared/notification-types.ts` (href), `supabase/functions/_shared/deliver-notification.ts` (opção do filtro), `supabase/functions/evaluate-budgets/index.ts`, `supabase/functions/evaluate-credit-card-alerts/index.ts`, `supabase/functions/credit-card-calendar-alerts/index.ts`, `supabase/functions/evaluate-bills-reminders/index.ts`, `supabase/functions/dispatch-notifications/index.ts`, `NOTIFICATION_DEPLOYMENT.md`, `src/components/settings/notification-preferences.tsx` (some o interruptor "Promoções")

**Interfaces:**
- Produces:
  ```ts
  // notification-copy.ts (Deno; sem dependências; dinheiro em pt-BR com "R$ 1.234,56")
  export type Copy = { title: string; body: string }
  export function budgetCopy(a: { categoria: string; mes: string; gasto: number; limite: number; nivel: "80" | "100" | "over" }): Copy
  export function cardLimitCopy(a: { cartao: string; usado: number; limite: number }): Copy
  export function invoiceCopy(a: { cartao: string; evento: "closed" | "closing_soon" | "due_soon" | "due_today"; valor: number; data: string; dias?: number }): Copy | null  // null = não envia (valor 0)
  export function billCopy(a: { conta: string; valor: number | null; data: string; dias: number }): Copy  // dias < 0 = atrasada
  // notification-schedule.ts
  /** Conta atrasada: avisa no 1º dia de atraso e a cada 7 dias depois. */
  export function shouldSendOverdue(diasDeAtraso: number): boolean
  /** "Em breve" tolera um dia perdido: alvo 3 vale para 3 e 2. */
  export function withinReminderWindow(diasAte: number, alvo: number): boolean
  /** A chave de deduplicação da conta atrasada muda a cada janela de 7 dias. */
  export function overdueDedupeBucket(diasDeAtraso: number): number
  ```
- [ ] **Step 1: Write the failing tests** (`deno test`, `assertEquals` de `jsr:@std/assert` ou o que os testes de `_shared` já importam):
  ```ts
  assertEquals(budgetCopy({ categoria: "Mercado", mes: "outubro", gasto: 850, limite: 1000, nivel: "80" }),
    { title: "Mercado: 85% do orçamento de outubro", body: "R$ 850,00 de R$ 1.000,00 — restam R$ 150,00." })
  assertEquals(budgetCopy({ categoria: "Mercado", mes: "outubro", gasto: 1000, limite: 1000, nivel: "100" }),
    { title: "Mercado: orçamento de outubro esgotado", body: "R$ 1.000,00 de R$ 1.000,00." })
  assertEquals(budgetCopy({ categoria: "Mercado", mes: "outubro", gasto: 1260, limite: 1000, nivel: "over" }),
    { title: "Mercado: orçamento de outubro estourado", body: "R$ 1.260,00 de R$ 1.000,00 (126%) — R$ 260,00 acima." })
  assertEquals(cardLimitCopy({ cartao: "Nubank ··1234", usado: 4500, limite: 5000 }),
    { title: "Nubank ··1234: 90% do limite", body: "R$ 4.500,00 de R$ 5.000,00; disponível R$ 500,00." })
  assertEquals(invoiceCopy({ cartao: "Nubank", evento: "closed", valor: 0, data: "10/11" }), null)
  assertEquals(invoiceCopy({ cartao: "Nubank", evento: "closed", valor: 1234.5, data: "10/11" }),
    { title: "Fatura do Nubank fechou", body: "Total R$ 1.234,50, vence em 10/11." })
  assertEquals(invoiceCopy({ cartao: "Nubank", evento: "due_today", valor: 300, data: "10/11" }),
    { title: "Fatura do Nubank vence hoje", body: "R$ 300,00 — vencimento 10/11." })
  assertEquals(billCopy({ conta: "Luz", valor: 180, data: "20/10", dias: 3 }), { title: "Luz vence em 3 dias", body: "R$ 180,00 em 20/10." })
  assertEquals(billCopy({ conta: "Luz", valor: 180, data: "20/10", dias: 0 }).title, "Luz vence hoje")
  assertEquals(billCopy({ conta: "Luz", valor: 180, data: "20/10", dias: -2 }),
    { title: "Luz está atrasada", body: "Vencia em 20/10 (R$ 180,00). Registre o pagamento." })
  assertEquals([1, 2, 7, 8, 15].map(shouldSendOverdue), [true, false, false, true, true])
  assertEquals([withinReminderWindow(3, 3), withinReminderWindow(2, 3), withinReminderWindow(1, 3)], [true, true, false])
  assertEquals([1, 7, 8, 14, 15].map(overdueDedupeBucket), [0, 0, 1, 1, 2])
  ```
  Em `notification-types.ts` (há teste em `_shared`? se não, crie `notification-types.test.ts`): `resolveNotificationHref({ href: "/\\evil.com" })`, `{ href: "/\t/evil.com" }` e `{ href: "//evil.com" }` caem no fallback.
- [ ] **Step 2:** `npm run test:edge` → FAIL.
- [ ] **Step 3: Implement** a seção C do desenho:
  - Os dois módulos puros; o dinheiro formatado sem `Intl` dependente de locale do runtime (escreva o formatador `R$ 1.234,56` à mão, testado).
  - `evaluate-budgets`: título e corpo de `budgetCopy` (o nível pelo limiar disparado; `mes` por extenso em pt-BR; o `href` com `?month=AAAA-MM` só se `src/app/(app)/categories/[id]` ler `month` — confira; senão, sem ele).
  - `evaluate-credit-card-alerts`: o "usado" soma as faturas em aberto (a atual e as anteriores não pagas) do cartão; textos de `cardLimitCopy`.
  - `credit-card-calendar-alerts`: textos de `invoiceCopy` (não envia com `null`); fecha/vence "em breve" com `withinReminderWindow`, deduplicado pelo ciclo; o título "fechou" nunca sobre o corpo "fecha hoje"; não envia "vence" com a fatura paga; entrega com a opção que pula o filtro `notify_credit_cards` (só `notify_credit_card_calendar` vale).
  - `deliver-notification.ts`: a opção (por exemplo `skipTypePref: true`) que o calendário passa.
  - `evaluate-bills-reminders`: textos de `billCopy`; a atrasada só sai quando `shouldSendOverdue(dias)`, com a chave de deduplicação pelo `overdueDedupeBucket` em vez do `sent_on`.
  - `dispatch-notifications`: só aceita `type: "system"` e `kind` numa lista fechada (vazia hoje; responda 400 para o resto).
  - `notification-types.ts`: o `href` recusa caracteres de controle, `\` e `//`, como o cliente (Task 2).
  - Preferências: o interruptor "Promoções" some (nada envia promoção); o campo continua no banco.
  - `NOTIFICATION_DEPLOYMENT.md`: a seção "Publicar a revisão de 2026-10-17" com a lista de funções a publicar (`evaluate-budgets`, `evaluate-credit-card-alerts`, `credit-card-calendar-alerts`, `evaluate-bills-reminders`, `dispatch-notifications`, e o `_shared` que todas usam), os comandos (`supabase functions deploy <nome>`) e o SQL de `cron.schedule` dos dois crons (calendário do cartão e contas) com o lugar da chave de serviço marcado `<SERVICE_ROLE_KEY>`; corrija a referência à migração que não existe mais.
- [ ] **Step 4:** `npm run test:edge` → PASS; `deno check` das funções mexidas (`deno check supabase/functions/<nome>/index.ts`) sem erro; gate do app limpo.
- [ ] **Step 5: Commit** `feat(notificacoes): textos com contexto e regras de disparo no servidor (para publicar)`.

### Task 7: Jornadas e Atlas

**Files:**
- Modify: `docs/JORNADAS.md` (a seção das notificações, ~350-360, e a tabela de regras), `docs/atlas/template.html` (o item das notificações), gerar `docs/atlas/atlas-jornadas.html`

- [ ] **Step 1:** No `JORNADAS.md`: o painel flutuante agrupado por dia; o ⋯ do cabeçalho (Marcar todas como lidas, Preferências de notificação → `/settings#notificacoes`, Limpar todas com confirmação); o filtro Todas/Não lidas; a linha sem destino só marca como lida (corrija o "/dashboard" e a "engrenagem" que não existiam); marcar como não lida; o sino exato, sondado a cada 60s; categoria criada não notifica mais; e uma nota "servidor revisado, aguardando publicação" com os pontos de C. Mermaid com `%%{init}%%` e ids que não sejam palavra reservada.
- [ ] **Step 2:** O mesmo no `template.html`, em linguagem de pessoa; a data da capa 17 de outubro de 2026.
- [ ] **Step 3:** `python3 docs/atlas/build.py` sem erro. Nenhum `*` dentro de `var()`/`[...]` nos docs.
- [ ] **Step 4: Commit** `docs: as notificações nas jornadas e no Atlas`. (A republicação do Atlas é do controlador.)
