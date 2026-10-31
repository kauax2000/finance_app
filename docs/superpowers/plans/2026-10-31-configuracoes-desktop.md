# Configurações no desktop: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar a coluna longa de Configurações por um menu lateral de quatro seções, com os wireframes da tela convertidos ao design system.

**Architecture:** `SettingsPage` vira uma casca de `Tabs` vertical controlada pela URL (`?secao=`). Cada seção é um componente de `src/components/settings/`, composto só do catálogo. Os formulários dos wireframes mudam de arquivo e de pele, com a mesma lógica de gravação.

**Tech Stack:** Next.js 16, React, Tailwind v4, Radix via `src/components/ui/`, TanStack Query, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-31-configuracoes-desktop-design.md`

## Global Constraints

- Leia `AGENTS.md` e rode `graphify query "<pergunta>"` antes de ler código. Rode `npm run ds:catalog` antes de escrever tela.
- **Nenhuma alteração em `src/components/ui/`, `src/app/globals.css` ou `src/app/designsystem/`.** Se faltar peça, pare e relate.
- Sem `cva` nem componente em `src/app/`; sem cor, medida arbitrária ou `rounded-*` à mão; sem caixa alta à mão.
- Componentes na versão padrão: sem `variant`/`size` salvo o que este plano pede.
- Heroicons: `size-5` usa `20/solid`, `size-4` ou menos usa `16/solid`.
- **Não grave nada no banco ao testar: o dev usa produção.** Não rode a prévia para clicar em Salvar ou em chaves. A verificação visual é da Task 6.
- Copie textos do wireframe sem reescrever, salvo os indicados aqui.
- Não toque em `CLAUDE.md` nem em `.superpowers/`. Em `git add`, nomeie os arquivos. Não faça push.
- Toda mensagem de commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Depois de cada commit de código: `graphify update .` e commit de `graphify-out/` como `chore(graph): atualiza o grafo de configurações`.

## Review Focus

- `?secao=` desconhecido ou ausente abre Carteira, sem erro (teste na Task 1).
- "Configurar notificações" clicado já em `/settings` troca a seção: a página é controlada, sem `urlParam` (teste na Task 1).
- Quem não é dono não vê Editar, Divisão, Datas nem Excluir; dono de carteira pessoal não vê a linha de Sair ou excluir (teste na Task 2).
- `starts_on` `2026-03-01` aparece como 1º de março em qualquer fuso: nunca `new Date("YYYY-MM-DD")` (teste na Task 3).
- Trocar de carteira com a seção aberta recarrega os formulários e fecha os diálogos (`key` por carteira, teste na Task 3).

---

### Task 1: Casca com menu lateral e seção na URL

**Files:**
- Create: `src/components/settings/secoes.ts`
- Create: `src/components/settings/settings-page-skeleton.tsx`
- Create: `src/hooks/use-tela-larga.ts`
- Create: `src/app/(app)/settings/loading.tsx`
- Create: `src/components/settings/settings-page.test.ts`
- Modify: `src/app/(app)/settings/page-client.tsx`, `src/app/(app)/settings/page.tsx`, `src/app/(app)/settings/layout.tsx`
- Modify: `src/components/layout/notifications-panel-empty.tsx:20`, `src/components/layout/notifications-panel.test.ts:45`

**Interfaces:**
- Produces: `SECOES: readonly { id: SecaoId; label: string }[]`, com `SecaoId = "carteira" | "notificacoes" | "aparelho" | "ia"`, nesta ordem e com os rótulos Carteira, Notificações, Este aparelho, IA e privacidade.
- Produces: `secaoDaUrl(valor: string | null): SecaoId`.
- Produces: `useTelaLarga(): boolean`, verdadeiro com `(min-width: 64rem)`.

- [ ] **Step 1: Escreva os testes** em `settings-page.test.ts`: `secaoDaUrl("notificacoes")` é `"notificacoes"`; `secaoDaUrl(null)` e `secaoDaUrl("xyz")` são `"carteira"`; `lerFonte` de `page-client.tsx` contém `useSearchParams` e não contém `urlParam`; `NOTIFICATION_PREFERENCES_HREF` é `"/settings?secao=notificacoes"`. Troque o `#notificacoes` de `notifications-panel.test.ts:45` por `?secao=notificacoes`.
- [ ] **Step 2: Rode** `npx vitest run src/components/settings src/components/layout/notifications-panel.test.ts`. Esperado: FAIL.
- [ ] **Step 3: Implemente** `secoes.ts`, `useTelaLarga` (`useSyncExternalStore` sobre `matchMedia`, com `false` no servidor) e o novo `NOTIFICATION_PREFERENCES_HREF`.
- [ ] **Step 4: Reescreva `page-client.tsx`:** `Tabs` com `orientation` `vertical` se `useTelaLarga()`, senão `horizontal`; `value={secaoDaUrl(searchParams.get("secao"))}`; `onValueChange` chama `router.replace(\`${ROUTES.SETTINGS}?secao=${id}\`, { scroll: false })`. `TabsList` com `aria-label="Seções de Configurações"`, `scrollable` só na horizontal, `w-52 shrink-0` só na vertical. Um `TabsContent` por seção com `min-w-0 flex-1`. Mova os blocos atuais para as seções, sem redesenhar: Carteira (`WorkspaceAppearanceSettings`, `DatasDaCarteiraProjetoWireframe`, `ModoEPesosDaCarteiraWireframe`), Notificações (`NotificationPreferences`, `LembreteConferirWireframe`, `InsightsAvisoWireframe`), aparelho (`ThemeSettings`, `LancamentoSettings`, `PwaSettingsSection`), IA (`IaConfiguracoesWireframe`).
- [ ] **Step 5: Layout e carregamento:** `layout.tsx` com `<Container size="full" className="max-w-4xl">`. `SettingsPageSkeleton` com `SkeletonGroup`, a coluna de menu e dois cartões. `loading.tsx` e `page.tsx` no molde de `src/app/(app)/account/(raiz)/`, com `AdiarMontagem`.
- [ ] **Step 6: Rode** `npx vitest run src/components/settings src/components/layout src/app && npx tsc --noEmit`. Esperado: PASS, com `adiar-montagem.test.ts` verde.
- [ ] **Step 7: Commit** `feat(configuracoes): menu lateral e seção na URL`.

### Task 2: Seção Carteira

**Files:**
- Create: `src/components/settings/settings-section.tsx`
- Modify: `src/components/settings/workspace-appearance-settings.tsx`
- Modify: `src/app/(app)/settings/page-client.tsx`
- Test: `src/components/settings/settings-page.test.ts`

**Interfaces:**
- Produces: `SettingsSection({ titulo: string, alcance: string, actions?: ReactNode, children })`, que monta `PageSection`, `PageSectionHeader actions`, `PageSectionTitle` e `PageSectionDescription`. As quatro seções a usam, e `WorkspaceAppearanceSettings` passa a ser dona do cabeçalho da seção Carteira, recebendo os formulários por `children`.

- [ ] **Step 1: Teste de fonte** em `settings-page.test.ts`: `workspace-appearance-settings.tsx` não contém `EllipsisVerticalIcon` nem `DropdownMenu`; contém `Editar`, `Sair da carteira`, `Excluir carteira`.
- [ ] **Step 2: Rode** e veja FAIL.
- [ ] **Step 3: Crie `SettingsSection`.** Alcance: `Vale para ${currentWorkspace.name}.`
- [ ] **Step 4: Refaça a identidade:** apague os dois `*OverflowMenu`. Dono: `Button variant="secondary"` "Editar" chamando `openEdit`. Não dono: mantém o `CardNote`. Unifique os dois ramos repetidos do JSX.
- [ ] **Step 5: Linha final**, depois de `children`, num `Card padding="none"`: título e descrição à esquerda, `Button variant="destructive"` à direita. `canDeleteProject`: "Excluir carteira", descrição "Apaga a carteira e tudo que há nela."; `!owner`: "Sair da carteira", descrição "Você perde o acesso a esta carteira."; dono de carteira pessoal: sem linha.
- [ ] **Step 6: Sem carteira:** `EmptyState` com o texto atual de "Nenhuma carteira disponível".
- [ ] **Step 7: Rode** testes e `npx tsc --noEmit`. Esperado: PASS.
- [ ] **Step 8: Commit** `feat(configuracoes): seção Carteira com Editar à vista`.

### Task 3: Divisão e Datas no design system

**Files:**
- Create: `src/lib/divisao/use-adultos.ts`
- Create: `src/components/settings/carteira-divisao-form.tsx`
- Create: `src/components/settings/carteira-projeto-form.tsx`
- Create: `src/components/settings/carteira-forms.test.ts`
- Modify: `src/components/wireframe/divisao-wireframe.tsx`, `src/components/wireframe/projetos-wireframe.tsx`
- Modify: `src/components/workspace/project-form-dialog.tsx:135`, `src/app/(app)/settings/page-client.tsx`

**Interfaces:**
- Produces: `chaves` e `useAdultos(workspaceId: string)` em `lib/divisao/use-adultos.ts`, movidos sem mudança; `divisao-wireframe.tsx` passa a importá-los.
- Produces: `CarteiraDivisaoForm()`, mesma guarda de `ModoEPesosDaCarteiraWireframe`.
- Produces: `CarteiraProjetoForm({ workspace?: Workspace, onSalvo?: () => void, moldura?: boolean })`, com `moldura` `true` por padrão, mesma guarda e `key={alvo.id}` de `DatasDaCarteiraProjetoWireframe`.
- Produces: `ymdParaData(ymd: string): Date | undefined` em `carteira-projeto-form.tsx`, exportado para teste. Use o helper de `lib/transaction-date` se existir.

- [ ] **Step 1: Testes:** `ymdParaData("2026-03-01")` tem `getDate() === 1` e `getMonth() === 2`; `ymdParaData("")` é `undefined`; a fonte dos dois formulários contém `key=` por carteira, `FormSubmit` e `variant="secondary"`, e não contém `WireframeBox`, `<input` nem `new Date(inicio`.
- [ ] **Step 2: Rode** e veja FAIL.
- [ ] **Step 3: Mova** `chaves` e `useAdultos`.
- [ ] **Step 4: `CarteiraDivisaoForm`:** leve `ModoEPesos`, `FormularioDoModo` e `onSubmit` sem mudar a lógica. `Card` com `CardHeader` e `CardTitle` "Divisão". `Form`, `FormRadioGroup` com "Pote único" e "Dividida" e os textos do wireframe, `FormInput` por adulto com `inputMode="decimal"`, `FormSubmit variant="secondary"` "Salvar divisão". Aviso de sucesso por `toast` de `@/lib/toast`, erro por `FormError`. "Ainda não disponível" e carregando viram uma linha `Muted` dentro do cartão.
- [ ] **Step 5: `CarteiraProjetoForm`:** leve `FormularioDaCarteiraProjeto`. `Card` "Datas e orçamento", `FormField` + `DatePicker` nas datas, convertendo com `ymdParaData` e `localYmdFromDate`, `FormInput money` com o orçamento em string, `FormSubmit variant="secondary"` "Salvar datas e orçamento". Datas com o rótulo do wireframe e `optional`.
- [ ] **Step 6: Religue:** page-client passa os dois como `children` de `WorkspaceAppearanceSettings`; `project-form-dialog.tsx` usa `CarteiraProjetoForm`. Apague `DatasDaCarteiraProjetoWireframe`, `FormularioDaCarteiraProjeto`, `ModoEPesosDaCarteiraWireframe`, `ModoEPesos`, `FormularioDoModo` e os imports que sobrarem. Dentro do diálogo, o `Card` não entra: `CarteiraProjetoForm` aceita `moldura={false}`, e o diálogo usa isso.
- [ ] **Step 7: Rode** `npx vitest run src/components && npx tsc --noEmit`. Atualize o `wireframe.test.ts` se ele citar o que saiu. Esperado: PASS.
- [ ] **Step 8: Commit** `feat(configuracoes): divisão e datas da carteira no design system`.

### Task 4: Seção Notificações

**Files:**
- Modify: `src/components/settings/notification-preferences.tsx`
- Modify: `src/components/wireframe/insights-wireframe.tsx`
- Delete: `src/components/wireframe/a-conferir-lembrete-wireframe.tsx`
- Modify: `src/app/(app)/settings/page-client.tsx`
- Test: `src/components/settings/settings-page.test.ts`

**Interfaces:**
- Consumes: `SettingsSection` da Task 2.

- [ ] **Step 1: Teste de fonte:** `notification-preferences.tsx` contém `notify_review`, `notify_insights`, `Como avisar`, `Sobre o quê`, `Desligar remove este aparelho de todas as carteiras.`; não contém `uppercase`, `variant="card"`, `id="notificacoes"`, `border-dashed`.
- [ ] **Step 2: Rode** e veja FAIL.
- [ ] **Step 3: Reestruture:** `SettingsSection` com alcance `Vale para você em ${nome}.` e `actions` com `Button variant="tertiary"` "Ver histórico", sem `size` nem classes. Dois `Card padding="none"`, com `CardToolbar variant="title"`, e linhas `FormSwitch` planas, separadas por `Separator`, sem `ul`/`li`. Atualize o esqueleto. Apague `PrefSubheaderBar` e o `withTopBorder`.
- [ ] **Step 4: Acrescente em "Sobre o quê":** `notify_review` com label "Lembrete de itens a conferir" e descrição "Às 20h, quando houver itens a conferir."; `notify_insights` com label "Insights" e descrição "O que o app notou na carteira. No máximo 3 push por semana; o resto fica no Painel.". Os dois com `prefs?.x !== false`.
- [ ] **Step 5: Push:** a descrição padrão termina com "Desligar remove este aparelho de todas as carteiras."
- [ ] **Step 6: Apague** o arquivo do lembrete e `InsightsAvisoWireframe`, e tire os imports da page-client.
- [ ] **Step 7: Rode** testes e `npx tsc --noEmit`. Esperado: PASS.
- [ ] **Step 8: Commit** `feat(configuracoes): notificações reunidas numa seção`.

### Task 5: Este aparelho e IA e privacidade

**Files:**
- Create: `src/components/settings/ia-privacidade-settings.tsx`
- Modify: `src/components/settings/theme-settings.tsx`, `src/components/pwa/pwa-settings-section.tsx`, `src/app/(app)/settings/page-client.tsx`
- Delete: `src/components/settings/lancamento-settings.tsx`, `src/components/wireframe/ia-configuracoes-wireframe.tsx`
- Test: `src/components/settings/settings-page.test.ts`

**Interfaces:**
- Consumes: `SettingsSection` da Task 2.
- Produces: `IaPrivacidadeSettings()`.

- [ ] **Step 1: Teste de fonte:** `page-client.tsx` não contém `wireframe`; `theme-settings.tsx` não contém `Vale só neste aparelho` e contém `useLancamentoInteligente`; `ia-privacidade-settings.tsx` contém `ROUTES.PRIVACY`, `Groq e Cloudflare`, `30 chamadas`.
- [ ] **Step 2: Rode** e veja FAIL.
- [ ] **Step 3: `ThemeSettings`** vira a seção: `SettingsSection titulo="Este aparelho" alcance="Vale só neste aparelho."`, um `Card padding="none"` com Tema, Busca no cabeçalho (mantém `max-lg:hidden`) e a linha de Lançamento inteligente. Apague `lancamento-settings.tsx`. Renderize `<PwaSettingsSection />` depois do cartão.
- [ ] **Step 4: `PwaSettingsSection`:** no mesmo idioma de linha, título "App no celular" e `P`/`Muted` sem `text-sm` à mão. Textos, botão de instalar e `SyncStatusChip` ficam.
- [ ] **Step 5: `IaPrivacidadeSettings`:** `SettingsSection titulo="IA e privacidade" alcance="Vale para toda a sua conta."`, `Card` com `DescriptionList`: "Quem lê": "Groq e Cloudflare, grátis, sem treino"; "Limite": "Até 30 chamadas por dia (frase, foto do recibo e fatura; uma fatura longa gasta várias)."; "Conferência": "Tudo que a IA preenche fica a conferir." Depois `<Button variant="link" asChild><Link href={ROUTES.PRIVACY}>Política de privacidade</Link></Button>`.
- [ ] **Step 6: Apague** o wireframe e religue a page-client.
- [ ] **Step 7: Rode** testes, `npx tsc --noEmit`, `npm run lint`. Esperado: PASS.
- [ ] **Step 8: Commit** `feat(configuracoes): seções Este aparelho e IA`.

### Task 6: Jornada, auditoria e verificação

**Files:**
- Modify: `docs/JORNADAS.md` (linhas 314-324, 386, 457, 484), `docs/atlas/template.html:551` e capa, `docs/atlas/atlas-jornadas.html`

- [ ] **Step 1: Atualize `docs/JORNADAS.md`:** fluxograma de `/settings` com as quatro seções e `?secao=`, Editar à vista, Sair ou excluir, IA sem o rótulo de wireframe. `/settings#notificacoes` vira `/settings?secao=notificacoes`, e a tabela deixa de dizer que a seção tem `id`.
- [ ] **Step 2: Atualize** `docs/atlas/template.html`, a data da capa e rode `python3 docs/atlas/build.py`.
- [ ] **Step 3: Rode** `npm run ds:audit -- src/components/settings "src/app/(app)/settings"` e corrija o local. Esperado: sem violação nova.
- [ ] **Step 4: Rode** `npx tsc --noEmit && npm run lint && npm run test:unit`. Esperado: tudo verde.
- [ ] **Step 5: Commit** `docs(jornadas): configurações em seções`.
- [ ] **Step 6: Verificação na prévia (sessão principal, não subagente):** `dev-attach`, 1280px, 1075px e 1024px em claro e escuro, 900px e 375px: trocar de seção, recarregar com `?secao=notificacoes`, abrir Editar e cancelar, abrir "Configurar notificações" já em `/settings`, ler o console. Sem clicar em Salvar nem em chave que grave.
- [ ] **Step 7: Republique o Atlas (sessão principal)** com a ferramenta Artifact em https://claude.ai/artifact/1N43LFYP1YSVsWaRMaNTRL.
