# Configurações em página única: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar a casca de abas por uma coluna única e densa, com os comandos rápidos primeiro e os wireframes da tela no design system.

**Architecture:** `SettingsPage` monta quatro seções em sequência. Cada seção é um componente de `src/components/settings/`, composto só do catálogo, sobre `SettingsSection` e `SettingsRow`. Divisão e Datas viram formulários em diálogo, com a mesma gravação.

**Tech Stack:** Next.js 16, React, Tailwind v4, Radix via `src/components/ui/`, TanStack Query, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-31-configuracoes-desktop-design.md`

**Ponto de partida:** a branch já tem a casca com `Tabs` (0e41a7bf) e a seção Carteira com `SettingsSection` (5c60c00e). A Task 1 desfaz as abas.

## Global Constraints

- Leia `AGENTS.md` e rode `graphify query "<pergunta>"` antes de ler código. Rode `npm run ds:catalog` antes de escrever tela.
- **Nenhuma alteração em `src/components/ui/`, `src/app/globals.css` ou `src/app/designsystem/`.** Se faltar peça, pare e relate.
- Sem `cva` nem componente em `src/app/`; sem cor, medida arbitrária ou `rounded-*` à mão; sem caixa alta à mão.
- Componentes na versão padrão: sem `variant`/`size` salvo o que este plano pede.
- Heroicons: `size-5` usa `20/solid`, `size-4` ou menos usa `16/solid`.
- **Não grave nada no banco ao testar: o dev usa produção.** A verificação visual é da Task 5.
- Copie textos do wireframe sem reescrever, salvo os indicados aqui.
- Não toque em `CLAUDE.md`, `.superpowers/` nem `graphify-out/`. Em `git add`, nomeie os arquivos. Não faça push.
- Toda mensagem de commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- `/settings#notificacoes` vindo de outra rota rola até a seção, apesar do `AdiarMontagem` (teste na Task 1; medição na Task 5).
- Hash inexistente na URL não quebra a página (teste na Task 1).
- Quem não é dono não vê Editar, Divisão, Datas nem Excluir; dono de carteira pessoal não vê a última linha (teste na Task 4).
- `starts_on` `2026-03-01` aparece como 1º de março em qualquer fuso: nunca `new Date("YYYY-MM-DD")` (teste na Task 4).
- Trocar de carteira com um diálogo aberto o fecha (teste na Task 4).

---

### Task 1: Tirar as abas

**Files:**
- Delete: `src/components/settings/secoes.ts`, `src/hooks/use-tela-larga.ts`
- Modify: `src/app/(app)/settings/page-client.tsx`, `src/app/(app)/settings/layout.tsx`
- Modify: `src/components/settings/settings-page-skeleton.tsx`, `src/components/settings/settings-section.tsx`, `src/components/settings/settings-page.test.ts`
- Modify: `src/components/layout/notifications-panel-empty.tsx:20`, `src/components/layout/notifications-panel.test.ts:45`
- Modify: `src/components/settings/notification-preferences.tsx` (só `scroll-mt`)

**Interfaces:**
- Produces: `SettingsSection({ id?: string, titulo, alcance, actions?, children })`.
- Produces: `SettingsRow({ titulo: ReactNode, descricao?: ReactNode, children?: ReactNode })`, a linha com texto à esquerda e controle à direita: `flex min-w-0 items-center justify-between gap-3 px-4 py-3`, título `text-sm font-medium`, descrição `Caption` ou `text-xs text-muted-foreground`.
- Produces: `rolarAteAncora(hash: string, doc: Document): void` em `settings-section.tsx`: acha `doc.getElementById(hash.slice(1))` e chama `scrollIntoView()`; sem elemento ou hash vazio, nada.

- [ ] **Step 1: Reescreva os testes:** apague de `settings-page.test.ts` o que cita `secoes`, `SECOES`, `secaoDaUrl`, `useSearchParams`. Acrescente: `page-client.tsx` não contém `Tabs`, `useSearchParams` nem `useTelaLarga`; contém `rolarAteAncora`; `NOTIFICATION_PREFERENCES_HREF` é `"/settings#notificacoes"`; `rolarAteAncora("#x", doc)` chama `scrollIntoView` do elemento `x`; `rolarAteAncora("#nao-existe", doc)` e `rolarAteAncora("", doc)` não lançam. Volte `notifications-panel.test.ts:45` para `#notificacoes`.
- [ ] **Step 2: Rode** `npx vitest run src/components/settings src/components/layout/notifications-panel.test.ts` e guarde o FAIL no relatório.
- [ ] **Step 3: `page-client.tsx`:** sem `Tabs`; `<div className="min-w-0 space-y-5">` com, nesta ordem: `ThemeSettings`, `LancamentoSettings`, `PwaSettingsSection`, `NotificationPreferences`, `LembreteConferirWireframe`, `InsightsAvisoWireframe`, `WorkspaceAppearanceSettings` com os dois wireframes em `children`, `IaConfiguracoesWireframe`. Um `useEffect` de montagem chama `rolarAteAncora(window.location.hash, document)`.
- [ ] **Step 4: Apague** `secoes.ts` e `use-tela-larga.ts`. `layout.tsx` volta ao `<Container>` padrão. O esqueleto vira uma coluna, sem o menu. `NOTIFICATION_PREFERENCES_HREF` volta a `` `${ROUTES.SETTINGS}#notificacoes` ``. `id="notificacoes"` ganha `scroll-mt-(--top-bar-bottom)` ou o equivalente que a `PageSection` aceitar.
- [ ] **Step 5: Crie** `SettingsRow` e `rolarAteAncora`, e o `id` em `SettingsSection`.
- [ ] **Step 6: Rode** `npx vitest run src/components/settings src/components/layout src/app && npx tsc --noEmit`. Esperado: PASS.
- [ ] **Step 7: Commit** `refactor(configuracoes): página única no lugar das abas`.

### Task 2: Este aparelho e IA e privacidade

**Files:**
- Create: `src/components/settings/ia-privacidade-settings.tsx`
- Modify: `src/components/settings/theme-settings.tsx`, `src/app/(app)/settings/page-client.tsx`, `src/components/settings/settings-page.test.ts`
- Delete: `src/components/settings/lancamento-settings.tsx`, `src/components/pwa/pwa-settings-section.tsx`, `src/components/wireframe/ia-configuracoes-wireframe.tsx`

**Interfaces:**
- Consumes: `SettingsSection`, `SettingsRow` da Task 1.
- Produces: `IaPrivacidadeSettings()`.

- [ ] **Step 1: Teste de fonte:** `page-client.tsx` não contém `LancamentoSettings`, `PwaSettingsSection` nem `IaConfiguracoesWireframe`; `theme-settings.tsx` contém `useLancamentoInteligente`, `SyncStatusChip`, `InstallPwaSheet` e `Só no celular.`, e `Vale só neste aparelho` aparece só uma vez; `ia-privacidade-settings.tsx` contém `ROUTES.PRIVACY`, `Groq e Cloudflare`, `30 chamadas`.
- [ ] **Step 2: Rode** e guarde o FAIL.
- [ ] **Step 3: `ThemeSettings`:** `SettingsSection titulo="Este aparelho" alcance="Vale só neste aparelho."`, um `Card padding="none"` com linhas separadas por `Separator`: Tema, Busca no cabeçalho (mantém `max-lg:hidden`; descrição sem "Vale só neste aparelho"), Lançamento inteligente (`FormSwitch` plano, `description="Só no celular."`), App no celular.
- [ ] **Step 4: Linha App no celular:** leve de `PwaSettingsSection` as três condições e os textos. iPhone fora do modo app: `Button variant="secondary"` "Como instalar", abrindo `InstallPwaSheet`. Instalado e nos demais: o texto atual como descrição, sem botão. `SyncStatusChip` e o aviso de sem conexão ficam na descrição.
- [ ] **Step 5: `IaPrivacidadeSettings`:** `SettingsSection titulo="IA e privacidade" alcance="Vale para toda a sua conta."`, `Card padding="none"`, linha com título "Groq e Cloudflare leem o que você manda, sem treinar com seus dados" e descrição "Até 30 chamadas por dia (frase, foto do recibo e fatura; uma fatura longa gasta várias). Tudo que a IA preenche fica a conferir."; linha com `<Button variant="link" asChild><Link href={ROUTES.PRIVACY}>Política de privacidade</Link></Button>`.
- [ ] **Step 6: Religue** a page-client e apague os três arquivos. Confira antes por `grep` que nada mais os importa.
- [ ] **Step 7: Rode** testes e `npx tsc --noEmit`. Esperado: PASS.
- [ ] **Step 8: Commit** `feat(configuracoes): seções Este aparelho e IA em linhas`.

### Task 3: Notificações num cartão só

**Files:**
- Modify: `src/components/settings/notification-preferences.tsx`, `src/components/wireframe/insights-wireframe.tsx`, `src/app/(app)/settings/page-client.tsx`, `src/components/settings/settings-page.test.ts`
- Delete: `src/components/wireframe/a-conferir-lembrete-wireframe.tsx`

**Interfaces:**
- Consumes: `SettingsSection` com `id`.

- [ ] **Step 1: Teste de fonte:** `notification-preferences.tsx` contém `id="notificacoes"`, `notify_review`, `notify_insights`, `Como avisar`, `Sobre o quê`, `Às 20h.`, `No máximo 3 push por semana.`, `Desligar remove este aparelho de todas as carteiras.`; não contém `uppercase`, `variant="card"`, `border-dashed`, `h-8`.
- [ ] **Step 2: Rode** e guarde o FAIL.
- [ ] **Step 3: Reestruture:** `SettingsSection id="notificacoes" titulo="Notificações" alcance={`Vale para você em ${nome}.`}` e `actions` com `Button variant="tertiary"` "Ver histórico", sem `size` nem classes. Sem carteira, alcance "Selecione uma carteira.". Um `Card padding="none"` com duas `CardToolbar` (variante `label`), "Como avisar" e "Sobre o quê". Linhas `FormSwitch` planas com recuo `px-4 py-3` e `Separator`, sem `ul`/`li`. Apague `PrefSubheaderBar`. Esqueleto no mesmo desenho.
- [ ] **Step 4: Textos:** só push, lembrete e insights levam descrição, além de bloqueado e sem suporte em push. Rótulos atuais, com "Lembrete de itens a conferir" e "Insights" novos. Ambos `prefs?.x !== false`, pelo mesmo `patch` e `disabled`.
- [ ] **Step 5: Apague** o wireframe do lembrete e `InsightsAvisoWireframe`, e tire os imports da page-client.
- [ ] **Step 6: Rode** `npx vitest run src/components && npx tsc --noEmit`. Esperado: PASS.
- [ ] **Step 7: Commit** `feat(configuracoes): notificações num cartão só`.

### Task 4: Carteira em linhas, com Divisão e Datas em diálogo

**Files:**
- Create: `src/lib/divisao/use-adultos.ts`
- Create: `src/components/settings/carteira-divisao-dialog.tsx`, `src/components/settings/carteira-projeto-form.tsx`, `src/components/settings/carteira-forms.test.ts`
- Modify: `src/components/settings/workspace-appearance-settings.tsx`, `src/components/wireframe/divisao-wireframe.tsx`, `src/components/wireframe/projetos-wireframe.tsx`, `src/components/workspace/project-form-dialog.tsx:135`, `src/app/(app)/settings/page-client.tsx`, `src/components/settings/settings-page.test.ts`

**Interfaces:**
- Consumes: `SettingsSection`, `SettingsRow`.
- Produces: `chaves` e `useAdultos(workspaceId: string)` em `lib/divisao/use-adultos.ts`, movidos sem mudança; `divisao-wireframe.tsx` os importa.
- Produces: `CarteiraDivisaoDialog({ open: boolean, onOpenChange: (open: boolean) => void, workspace: Workspace | null })`.
- Produces: `CarteiraProjetoForm({ workspace: Workspace, onSalvo: () => void, onCancelar: () => void, cancelarLabel: string })`, que renderiza `DialogBody` e `DialogFooter` dentro de um `Form`, com `key={workspace.id}` em quem o monta.
- Produces: `ymdParaData(ymd: string): Date | undefined` e `resumoDoCalendario(w: Pick<Workspace, "starts_on" | "ends_on" | "budget_total">): string` em `carteira-projeto-form.tsx`, exportados para teste. Use helpers de `lib/transaction-date` se existirem.

- [ ] **Step 1: Testes:** `ymdParaData("2026-03-01")` tem `getDate() === 1` e `getMonth() === 2`; `ymdParaData("")` é `undefined`; `resumoDoCalendario` sem nada é `"Sem datas"`, com orçamento contém `R$`; a fonte dos formulários contém `FormSubmit`, e não contém `WireframeBox` nem `<input`; `workspace-appearance-settings.tsx` não recebe mais `children`, abre os dois diálogos por `Alterar` e tem efeito de troca de carteira que fecha todos; `Editar` e `Alterar` ficam sob `owner`, Divisão sob não pessoal, Datas sob `purpose === "project"`; `canDeleteProject ?` e `!owner ?` terminam em `null`. Atualize os testes da Task 2 anterior (5c60c00e) que cobram `children`.
- [ ] **Step 2: Rode** e guarde o FAIL.
- [ ] **Step 3: Mova** `chaves` e `useAdultos`.
- [ ] **Step 4: `CarteiraDivisaoDialog`:** leve `ModoEPesos`, `FormularioDoModo` e `onSubmit` sem mudar a lógica. `Dialog` com `DialogHeader`/`DialogTitle` "Divisão", `Form`, `FormRadioGroup` com "Pote único" e "Dividida" e os textos do wireframe, `FormInput` por adulto com `inputMode="decimal"`, `FormCancel`, `FormSubmit` "Salvar". Sucesso: `toast` de `@/lib/toast` e fecha. Erro: `FormError`.
- [ ] **Step 5: `CarteiraProjetoForm`:** leve `FormularioDaCarteiraProjeto`. `FormField` + `DatePicker` nas datas com `optional`, convertendo com `ymdParaData` e `localYmdFromDate`, `FormInput money` em string, `FormCancel` com `cancelarLabel`, `FormSubmit` "Salvar".
- [ ] **Step 6: Linhas da Carteira:** um `Card padding="none"`: identidade com `WorkspaceBrandMark` e `Button variant="secondary"` "Editar" na linha, sem `actions` na seção; nota "Só o dono pode alterar nome, ícone e cor." para não dono; `SettingsRow` Divisão, descrição `Pote único`, `Dividida` ou `Ainda não disponível` (sem botão), `Button variant="secondary"` "Alterar"; `SettingsRow` Datas e orçamento, descrição `resumoDoCalendario`; última linha com `Button variant="destructive"`, "Excluir" ou "Sair". Alcance: `Vale para todos em ${nome}.`. O efeito de troca de carteira fecha também os dois diálogos novos.
- [ ] **Step 7: Religue:** page-client sem wireframes; `project-form-dialog.tsx` usa `CarteiraProjetoForm` com `cancelarLabel="Agora não"`. Apague `DatasDaCarteiraProjetoWireframe`, `FormularioDaCarteiraProjeto`, `ModoEPesosDaCarteiraWireframe`, `ModoEPesos`, `FormularioDoModo` e os imports que sobrarem.
- [ ] **Step 8: Rode** `npx vitest run src/components && npx tsc --noEmit && npm run lint`. Atualize `wireframe.test.ts` se ele citar o que saiu. Esperado: PASS.
- [ ] **Step 9: Commit** `feat(configuracoes): carteira em linhas, com divisão e datas em diálogo`.

### Task 5: Jornada, auditoria e verificação (sessão principal)

**Files:**
- Modify: `docs/JORNADAS.md`, `docs/atlas/template.html`, `docs/atlas/atlas-jornadas.html`

- [ ] **Step 1: `docs/JORNADAS.md`:** fluxograma de `/settings` com Editar, Alterar (Divisão, Datas) em diálogo, Sair ou excluir, IA sem o rótulo de wireframe. `/settings#notificacoes` fica.
- [ ] **Step 2:** `docs/atlas/template.html`, data da capa e `python3 docs/atlas/build.py`.
- [ ] **Step 3:** `npm run ds:audit -- src/components/settings "src/app/(app)/settings"` sem violação nova.
- [ ] **Step 4:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run build` verdes.
- [ ] **Step 5: Prévia** `dev-attach`, 1280px e 1024px, claro e escuro, e 375px: medir a altura (alvo ~1.250px), `/settings#notificacoes` vindo de outra rota, "Configurar notificações" já em `/settings`, abrir Editar e cancelar. Sem clicar em Salvar nem em chave que grave.
- [ ] **Step 6:** `graphify update .`, commits `docs(jornadas): configurações em página única` e `chore(graph): atualiza o grafo de configurações`.
- [ ] **Step 7:** republique o Atlas em https://claude.ai/artifact/1N43LFYP1YSVsWaRMaNTRL.
