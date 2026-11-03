# Minha conta: redesign e fim de sessões e atividades — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/account` no layout B (tudo à vista), sem sessões ativas nem atividades, com os dois wireframes virando design system.

**Architecture:** primeiro sai o que é removido (front de sessões e de atividade), depois entram as duas seções novas em `src/components/account/`, por fim a página só compõe. Backend intacto.

**Tech Stack:** Next.js (versão própria, ler `node_modules/next/dist/docs/` se tocar em rota), React, TanStack Query, Supabase, Tailwind v4, Vitest (testes de fonte com `lerFonte`).

**Spec:** `docs/superpowers/specs/2026-11-02-minha-conta-redesign-design.md`. Leia antes de cada tarefa. O spec decide o desenho e os textos; este plano decide nomes, ordem e testes.

## Global Constraints

- **Não commite.** A pasta é dividida com outras sessões. Nada de `git add`, `stash`, `reset` nem troca de branch. A revisão lê `git diff` e `git status`.
- Antes da primeira leitura de código de cada tarefa, rode `graphify query "<pergunta>"`.
- **Banco de produção:** não crie, revogue nem desconecte nada ao conferir no navegador. Não publique Edge nem migração.
- Não rode `next dev`: ele já está em :3000.
- Sem mudança em `src/components/ui/` nem em `src/app/globals.css`. Falta real: pare e reporte.
- `src/app/designsystem/` só onde o plano manda.
- Versão padrão dos componentes: sem `variant`/`size` salvo onde o plano ou o `AGENTS.md` mandam. Par de ações: `primary` + `tertiary`.
- Comentários e textos em português, como o código ao redor.
- Nada de componente declarado em `src/app/` (invariante 1), nada de literal de cor ou medida (invariante 2).
- Saída de `git status` deve listar só arquivos desta tarefa, mais `.superpowers/`, o spec e o plano.

## Review Focus

- Fechar o diálogo do token novo por Esc, véu ou × antes de "Já guardei": o token some de vez, e reabrir mostra o formulário vazio, nunca o token velho.
- `currentWorkspaceId` nulo ou lista de carteiras vazia em "Novo aparelho": o envio mostra "Escolha a carteira padrão.", sem chamar a RPC.
- `listGrants` falhando (OAuth desligado no projeto): só a seção de IAs mostra erro, e a página segue inteira.
- `usePlano` carregando ou nulo: a linha Plano aparece sem valor quebrado, nunca "undefined".
- Nome, e-mail, nome de token e URL longos a 375px: truncam ou quebram, sem rolagem horizontal.

---

### Task 1: Tirar o front de sessões e de atividades

**Files:**
- Delete: `src/app/(app)/account/sessions/`, `src/app/(app)/account/activity/`, `src/components/account/sessions-page-skeleton.tsx`, `src/components/account/activity-page-skeleton.tsx`, `src/lib/sessions.ts`, `src/lib/sessions-once.test.ts`, `src/lib/activity.ts`, `src/lib/family.ts`
- Modify: `src/app/(app)/account/page-client.tsx` (só tirar as duas linhas de link), `src/config/navigation.ts`, `src/config/mobile-navigation.ts`, `src/components/layout/sidebar-app-shell.tsx`, `src/components/layout/app-search-sources.ts` (comentário), `src/components/providers.tsx`, `src/lib/edge-invoke.ts`, `src/components/security/ChangePasswordDialog.tsx`, `src/components/account/edit-profile-dialog.tsx`
- Test: `src/config/mobile-navigation.test.ts`, `src/lib/direcao-da-tela.test.ts`, `src/lib/papeis/rotas-do-convidado.test.ts`, `src/components/layout/app-command-palette.test.ts`, `src/app/(app)/me/me-page.test.ts`, `src/components/ui/toggle-group-versions.test.ts`, `src/components/ui/timeline-versions.test.ts`

**Interfaces:**
- Produces: `ROUTES` sem `ACCOUNT_SESSIONS`/`ACCOUNT_ACTIVITY`; `providers.tsx` sem nenhuma chamada a `lib/sessions`. **Enquanto a Tarefa 2 não sai, `setAuthSignOutReason` fica sem chamador e `lib/auth-signout-reason.ts` fica de pé.**

- [ ] **Step 1: Criar `src/components/account/conta.test.ts` com o teste que falha**

```ts
import { existsSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

describe("sessões e atividades saíram do front", () => {
    it("as rotas e as bibliotecas não existem", () => {
        for (const c of [
            "src/app/(app)/account/sessions",
            "src/app/(app)/account/activity",
            "src/lib/sessions.ts",
            "src/lib/activity.ts",
            "src/lib/family.ts",
        ]) expect(existsSync(c)).toBe(false)
    })
    it("ninguém registra sessão nem grava atividade", () => {
        expect(lerFonte("src/components/providers.tsx")).not.toMatch(/createSession|validateCurrentSession|lib\/sessions/)
        expect(lerFonte("src/lib/edge-invoke.ts")).not.toContain("x-app-session-id")
        for (const f of ["src/components/security/ChangePasswordDialog.tsx", "src/components/account/edit-profile-dialog.tsx"])
            expect(lerFonte(f)).not.toContain("createActivity")
    })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components/account/conta.test.ts`
Expected: FAIL.

- [ ] **Step 3: Apagar e limpar**

Apague a lista de Delete. Em `navigation.ts`, tire as duas rotas, `isAccountSessionsPath`, `isAccountActivityPath` e os títulos (l. ~169-178). Em `mobile-navigation.ts`, o `case ROUTES.ACCOUNT` vira `isAccountHubPath(pathname)`, e o comentário da l. ~321 troca o exemplo por `/settings/aparencia`. Em `providers.tsx`, tire `createSession`, `sessionRegisteredRecently`, `validateCurrentSession`, `clearCurrentSession`, `sessaoRegistradaRef` e os blocos que dependem deles; **o `onAuthStateChange` e o caminho de sessão válida seguem**, e os dois pontos que chamavam `setAuthSignOutReason` (l. ~139-150 e ~179-195) somem com a validação. `signOut` segue com `supabase.auth.signOut()` sem `scope`. Em `edge-invoke.ts`, tire `getAppSessionIdHeader`, a constante e o uso. Em `page-client.tsx`, só as duas `<Link>` e os imports que sobrarem. No `createActivity` dos dois diálogos, tire a chamada e o que só existia para ela.

- [ ] **Step 4: Ajustar os testes**

`mobile-navigation.test.ts`: sem as rotas removidas (use `ROUTES.PLANS`, que `/me` também cobre, ou tire a expectativa). `direcao-da-tela.test.ts`: `/account/sessions` vira `/settings/aparencia`, com pai coerente. `rotas-do-convidado.test.ts`: troque por `/account`. `app-command-palette.test.ts`: tire `ACCOUNT_SESSIONS` e `ACCOUNT_ACTIVITY` da lista. `me-page.test.ts` l. ~74: confira a ordem `supabase.auth.signOut()` antes de `clearClientCaches()`. `toggle-group-versions.test.ts` e `timeline-versions.test.ts`: tire a leitura das páginas apagadas e mantenha o resto do teste; o comentário de medida (l. ~260) para de citar a rota.

- [ ] **Step 5: Conferir**

Run: `npx tsc --noEmit && npx vitest run src/components/account src/config src/lib/direcao-da-tela.test.ts src/lib/papeis src/components/layout src/components/ui/toggle-group-versions.test.ts src/components/ui/timeline-versions.test.ts "src/app/(app)/me"`
Expected: PASS. `tsc` só pode reclamar do que esta tarefa não toca se já reclamava antes.

### Task 2: Sessão expirada, vitrine do login, catálogo e textos de privacidade

**Files:**
- Delete: `src/lib/auth-signout-reason.ts`
- Modify: `src/components/layout/auth-guard.tsx`, `src/components/login-form.tsx`, `src/components/auth/showcase/{scenes.ts,scene-context.tsx,auth-showcase.tsx,palette-demo.tsx,phone-screens.tsx}`, `src/lib/scene-script.ts`, `src/app/designsystem/docs/{showcase,breadcrumb,empty-state,item,spinner,skeleton}.tsx`, `src/components/wireframe/{privacidade,cofre-aberto}-wireframe.tsx`
- Test: `src/components/auth/showcase/showcase.test.ts`, `src/lib/scene-script.test.ts`, `src/components/ui/breadcrumb-versions.test.ts`, testes que travem os textos de privacidade

- [ ] **Step 1: Somar ao `conta.test.ts` o teste que falha**

```ts
describe("o que dependia de sessão saiu", () => {
    it("sem sessão expirada", () => {
        expect(existsSync("src/lib/auth-signout-reason.ts")).toBe(false)
        expect(lerFonte("src/components/login-form.tsx")).not.toContain("session-expired")
        expect(lerFonte("src/components/auth/showcase/scenes.ts")).not.toMatch(/session-expired|palette-session/)
        expect(lerFonte("src/lib/scene-script.ts")).not.toContain("palette-session")
    })
    it("a privacidade não promete o que saiu", () => {
        expect(lerFonte("src/components/wireframe/privacidade-wireframe.tsx")).not.toContain("As sessões e os aparelhos conectados")
        expect(lerFonte("src/components/wireframe/cofre-aberto-wireframe.tsx")).not.toContain("mostrar onde a conta está aberta")
    })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components/account/conta.test.ts`
Expected: FAIL nos dois.

- [ ] **Step 3: Remover o caminho**

`auth-guard.tsx` deixa de ler o motivo e não anexa `reason=`. Tire a mensagem do `login-form.tsx`, a cena `login.session-expired`, o chip `session-expired`, o roteiro `palette-session`, e os ramos deles, com o que sobrar sem uso. Se um tipo ou teste enumera cenas, acompanhe. No `palette-demo.tsx`, tire as linhas "Sessões ativas" e "sessões encerradas", deixando o grupo Segurança coerente. **`phone-screens.tsx` l. ~195:** leia o contexto. Se a frase prometer encerrar sessões ao redefinir a senha, tire o que for falso.

- [ ] **Step 4: Catálogo**

`docs/showcase.tsx`: tire a entrada da cena. `docs/breadcrumb.tsx`: "Minha conta › Sessões ativas" vira "Configurações › Aparência"; `breadcrumb-versions.test.ts` troca "Sessões" por "Aparência". `empty-state`, `item`, `spinner`, `skeleton`: o exemplo ou a contagem que cite sessões troca por outro assunto real do app, sem inventar número. Rode `npm run ds:docs-map` só se ele mudar algo mapeado.

- [ ] **Step 5: Privacidade**

Leia o que `workspace-invites-create`, `-accept` e `-resend` gravam em `user_activity_logs` (sem editar). Em `privacidade-wireframe.tsx`: saia a linha das sessões, e o registro de atividade diga só o que os convites gravam. Em `cofre-aberto-wireframe.tsx`: a linha vira "Registro de convites da carteira" com o que de fato se guarda, Quem vê e finalidade "Limitar o envio de convites". Se houver data de atualização na Política, atualize para 2 de novembro de 2026. `grep` por testes que travem as frases antigas.

- [ ] **Step 6: Conferir**

Run: `npx tsc --noEmit && npx vitest run src/components/account src/components/auth src/lib/scene-script.test.ts src/components/ui/breadcrumb-versions.test.ts src/components/wireframe src/app/designsystem`
Expected: PASS.

### Task 3: Seção do Atalho

**Files:**
- Create: `src/components/account/campo-de-copiar.tsx`, `src/components/account/atalho-secao.tsx`, `src/components/account/novo-aparelho-dialog.tsx`, `src/components/account/como-configurar-dialog.tsx`
- Modify: `src/components/settings/settings-section.tsx`, `src/components/wireframe/wireframe.test.ts`, `docs/captura/atalho-iphone.md`
- Test: `src/components/account/conta.test.ts`

**Interfaces:**
- Produces:
  - `CampoDeCopiar({ rotulo: string, valor: string }): JSX` — `InputGroup` + `InputGroupInput readOnly` + `InputGroupButton`, confirma no botão e mostra "Não foi possível copiar. Selecione o texto e copie." na recusa.
  - `AtalhoSecao(): JSX` e `mensagemDoErroDeToken(erro: { code?: string; message?: string }): string`, ambos em `atalho-secao.tsx`.
  - `SettingsLink` aceita `valor?: string` e `href?: string` (com `href`, `Item asChild` com `Link`; sem ele, o `<button>` de hoje com `onClick`).

- [ ] **Step 1: Mover os testes de token para o novo arquivo, apontando para `atalho-secao.tsx` + `novo-aparelho-dialog.tsx`**

Tire de `wireframe.test.ts` "tokens: cria, revoga…", "tokens: o token vive só…", "tokens: os erros…" e "a conta mostra o wireframe". Em `conta.test.ts`, os mesmos casos, somando `fonte` de `como-configurar-dialog.tsx` ao exigir `/functions/v1/capture` e a URL do guia, e mais:

```ts
it("o token novo vive no diálogo, e fechar o descarta", () => {
    const d = lerFonte("src/components/account/novo-aparelho-dialog.tsx")
    expect(d).toContain("Guarde agora: ele não aparece de novo.")
    expect(d).toContain("Escolha a carteira padrão.")
    expect(d).toMatch(/setTokenNovo\(null\)/)
    expect(d).not.toMatch(/localStorage|sessionStorage|console\./)
})
it("só tokens ativos, e revogar pede confirmação de verdade", () => {
    const f = lerFonte("src/components/account/atalho-secao.tsx")
    expect(f).toContain("revoked_at")
    expect(f).toContain("AlertDialog")
    expect(f).not.toContain("window.confirm")
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components/account/conta.test.ts src/components/wireframe/wireframe.test.ts`
Expected: FAIL por arquivo inexistente.

- [ ] **Step 3: Implementar**

Traga a lógica de `captura-tokens-wireframe.tsx` (query `["capture_tokens", user?.id]`, `COLUNAS`, `GUIA`, RPCs, mensagens), sem apagar o wireframe ainda. Layout, títulos e estados: seção 4 de "A tela" e "Atalho (tokens)" do spec. A lista filtra `revoked_at == null`. Linha: `Item`, com `Muted` "Carteira · último uso `formatDateTimeShortPtBr`" ou "nunca usado". `NovoAparelhoDialog({ open, onOpenChange, aoCriar }: { open: boolean; onOpenChange: (v: boolean) => void; aoCriar: () => void })`, com `Dialog surface="auto"`; ao fechar, zere `tokenNovo`, nome e erro. Formulário com `Form`, `FormInput`, `FormField` + `Select`, `FormError`, `FormCancel`, `FormSubmit`. A etapa do token usa `CampoDeCopiar` para o token e para o endereço, e "Já guardei" fecha. `ComoConfigurarDialog({ open, onOpenChange })` traz o endereço e o link `GUIA`, em nova aba. O guia passa a dizer "Minha conta › Lançar sem abrir o app › Como configurar".

- [ ] **Step 4: Conferir**

Run: `npx tsc --noEmit && npx vitest run src/components/account src/components/wireframe src/components/settings`
Expected: PASS. `form-submit-owner.test.ts` também: `npx vitest run form-submit-owner`.

### Task 4: Seção das IAs

**Files:**
- Create: `src/components/account/ias-secao.tsx`, `src/components/account/conectar-ia-dialog.tsx`
- Test: `src/components/account/conta.test.ts`

**Interfaces:**
- Consumes: `CampoDeCopiar` (Tarefa 3).
- Produces: `IasSecao(): JSX`, `urlDoMcp(supabaseUrl: string): string`, em `ias-secao.tsx`.

- [ ] **Step 1: Teste que falha**

```ts
describe("IAs conectadas", () => {
    it("monta a URL com ou sem barra", async () => {
        const { urlDoMcp } = await import("./ias-secao")
        expect(urlDoMcp("https://x.supabase.co/")).toBe("https://x.supabase.co/functions/v1/mcp")
        expect(urlDoMcp("https://x.supabase.co")).toBe("https://x.supabase.co/functions/v1/mcp")
    })
    it("lista, confirma de verdade e mostra o erro sem derrubar a tela", () => {
        const f = lerFonte("src/components/account/ias-secao.tsx")
        expect(f).toContain("listGrants")
        expect(f).toContain("revokeGrant")
        expect(f).toContain("Não foi possível carregar as conexões.")
        expect(f).not.toContain("window.confirm")
    })
    it("as três instruções", () => {
        const d = lerFonte("src/components/account/conectar-ia-dialog.tsx")
        for (const t of ["Claude", "ChatGPT", "claude mcp add --transport http finance-app"]) expect(d).toContain(t)
    })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components/account/conta.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Traga a lógica de `ias-conectadas-wireframe.tsx` (query `["oauth_grants", user?.id]`, `retry: false`). Layout e estados: seção 5 de "A tela" e "IAs conectadas" do spec. "Conectar" abre `ConectarIaDialog({ open, onOpenChange })`. Desconectar usa `AlertDialog` com `pending` e `AlertDialogError`, com a frase "Ela perde o acesso na hora." Se `urlDoMcp` for importado por um teste antes de a env existir, a função segue pura.

- [ ] **Step 4: Conferir**

Run: `npx tsc --noEmit && npx vitest run src/components/account`
Expected: PASS.

### Task 5: A página

**Files:**
- Modify: `src/app/(app)/account/page-client.tsx`, `src/components/account/account-page-skeleton.tsx`
- Delete: `src/components/wireframe/captura-tokens-wireframe.tsx`, `src/components/wireframe/ias-conectadas-wireframe.tsx`
- Test: `src/components/account/conta.test.ts`, `src/components/wireframe/wireframe.test.ts`

**Interfaces:**
- Consumes: `AtalhoSecao`, `IasSecao`, `SettingsSection`, `SettingsLink`.

- [ ] **Step 1: Teste que falha**

```ts
describe("a página Minha conta", () => {
    const p = () => lerFonte("src/app/(app)/account/page-client.tsx")
    it("compõe as seções, nesta ordem, sem wireframe nem menu ⋯", () => {
        const f = p()
        const ordem = ["Acesso e plano", "<AtalhoSecao", "<IasSecao", "Privacidade", "Sair", "Excluir conta"].map((t) => f.indexOf(t))
        expect(ordem.every((n) => n >= 0)).toBe(true)
        expect([...ordem].sort((a, b) => a - b)).toEqual(ordem)
        expect(f).not.toMatch(/Wireframe|DropdownMenu|md:hidden/)
    })
    it("o plano usa o título do resumo e aguenta a espera", () => {
        expect(p()).toContain("resumoDoPlano(plano, new Date(), null).titulo")
        expect(p()).toMatch(/plano \?/)
    })
    it("mantém o título do desktop como Configurações", () => {
        expect(p()).toContain("<PageHeader collapse>")
        expect(p()).toContain('aria-hidden="true"')
    })
})
```

Mantenha em `wireframe.test.ts` "Minha conta leva à política de privacidade".

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components/account/conta.test.ts`
Expected: FAIL.

- [ ] **Step 3: Reescrever**

Forma do cabeçalho: a de `settings/(raiz)/page-client.tsx`, com `space-y-8` e `space-y-5`. Identidade: `Avatar` como hoje (tom por `identityToneFor`), nome e e-mail com `truncate`, "Membro desde" com `formatDateLongPtBr`, em par sem `gap`. Botão "Editar perfil" `variant="secondary"` (sozinho). Linhas: `SettingsLink` (E-mail → `setEditDialogOpen(true)`; Senha → `setChangePasswordOpen(true)`; Plano → `href={ROUTES.PLANS}`, `valor={plano ? resumoDoPlano(plano, new Date(), null).titulo : undefined}`; Política → `href={ROUTES.PRIVACY}`). Fim da página: "Sair" `tertiary` à esquerda, com o `signOut` e `toastError` de hoje, e "Excluir conta" `tertiary` com `text-destructive` à direita, em `flex justify-between`. Os três diálogos seguem montados. Apague os dois wireframes.

- [ ] **Step 4: Reescrever `AccountPageSkeleton`**

Mesma coluna: `PageHeaderSkeleton` só no desktop, identidade, e cartões com `Skeleton` na forma das linhas, em `SkeletonGroup label="Carregando informações da conta…" delay`. Confira a regra do esqueleto no telefone: sem título grande.

- [ ] **Step 5: Conferir**

Run: `npx tsc --noEmit && npm run lint && npm run ds:audit -- "src/app/(app)/account" src/components/account && npx vitest run src/components/account src/components/wireframe`
Expected: PASS, sem violação nova do auditor nesses caminhos.

### Task 6: Jornadas e Atlas

**Files:**
- Modify: `docs/JORNADAS.md`, `docs/atlas/template.html`, `AGENTS.md` (só se citar o que saiu)
- Generated: `docs/atlas/atlas-jornadas.html`

- [ ] **Step 1: `JORNADAS.md`**

Seção 10: novo fluxograma, sem sessões, atividades, `log` e `activity-logs`, sem "⋯" e sem "WIREFRAME"; a regra de tokens e a de IAs apontam para `src/components/account/`; "Sair é global" e o que acontece nos outros aparelhos. Seção 1: tire o motivo de saída (~221, ~267-268, ~289) e a checagem "ao abrir o app". Corrija ~483, ~1249 e ~2089, e a lacuna 3 (~2103) sai, sem renumerar se outros pontos a citarem. Na seção de lacunas, registre a pendência da subida à `main`, com as três ações do spec. `%%{init}%%` em todo bloco.

- [ ] **Step 2: `docs/atlas/template.html`**

"Como funciona" da jornada 10, "Termina em" (~814, tire "sessões encerradas"), o apêndice de rotas (~1505-1506), o de Edges, as lacunas, a data (2 de novembro de 2026) e as contagens da capa.

- [ ] **Step 3: Gerar**

Run: `python3 docs/atlas/build.py`
Expected: sem erro. `grep -c "account/sessions" docs/atlas/atlas-jornadas.html docs/JORNADAS.md` dá 0 nos dois, salvo a pendência, que não cita a rota.

---

Quem coordena faz o resto, fora das tarefas: conferência no navegador a 375px e no desktop, `npm run test:unit`, `graphify update .` e a republicação do Atlas.
