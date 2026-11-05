# Recuperação de senha por link — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A recuperação de senha passa a usar o e-mail padrão do Supabase, com **link**: o app pede o e-mail, avisa que mandou o link, e o link abre `/reset-password` direto no passo da senha nova. O passo do código de seis dígitos sai.

**Architecture:** `PasswordRecoveryForm` (um componente, duas portas) perde o passo `code` e ganha o passo `sent` (aviso de e-mail enviado, com reenviar). A leitura do link sai para uma função pura em `src/lib/recovery-links.ts`, que também reconhece o link expirado (`error`/`error_code` no hash ou na query). O showcase do painel de marca troca a cena e o aviso do código pelos do link. As Jornadas registram a mudança.

**Tech Stack:** Next.js (App Router desta versão), React, `@supabase/supabase-js` v2 (fluxo implícito: o link volta com `#access_token=…&type=recovery`, ou `#error=access_denied&error_code=otp_expired` quando venceu), vitest.

**Spec:** pedido do dono em 05/11/2026, nesta conversa: "vamos usar o modelo do Supabase, ao invés de usar um externo pra isso. Organize o app para que ele receba o link, não o código." Motivo: o projeto novo (`sa-east-1`) só deixa editar modelos de e-mail com SMTP próprio, e o modelo padrão de "Reset password" manda `{{ .ConfirmationURL }}`.

## Global Constraints

- Design system do `AGENTS.md`; nada novo em `src/components/ui/` nem em `globals.css`.
- Todo estado do formulário devolve um `AuthShell` no mesmo lugar da árvore, com `scene` e `step` (regra do `AuthShell` no `AGENTS.md`).
- Textos em português, voz do app. Copy fixa:
  - passo `email`: título "Recuperar senha", descrição "Enviamos um link para o seu e-mail.", botão "Enviar link".
  - passo `sent`: `icon="mail"`, título "Confira seu e-mail", descrição "Enviamos um link para **{e-mail}**. Abra no mesmo aparelho para criar a senha nova.", `FieldDescription`/nota "O link vale por uma hora. Confira também o spam.", `ResendButton` com `label="Reenviar link"` e `successMessage="Link reenviado"`, botão `tertiary` "Usar outro e-mail".
  - link vencido: título "Link expirado", descrição "Este link de recuperação não vale mais. Peça um novo.", botão "Pedir novo link".
- `redirectTo` continua `${window.location.origin}${links.resetPath}` (com `next` seguro).
- Banco de dev = produção: nada de pedir recuperação de senha real na verificação sem o dono pedir.
- Commits só com os arquivos da tarefa (`git add <arquivos>`, nunca `-A`); `deno.lock` e `graphify-out/graph.json` sujos não são da tarefa; trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; depois de código, `graphify update .` (sem commitar `graph.json`). Não contornar `guarda-componentes`.

## Review Focus

1. Link vencido ou já usado (`#error=access_denied&error_code=otp_expired`) com a pessoa **já logada** em outra aba → a tela mostra "Link expirado", nunca o campo de senha. Teste na Task 1 (`lerLinkDeRecuperacao` com erro devolve `"erro"`, mesmo que exista sessão — o formulário checa o erro antes do `getSession`).
2. O cliente Supabase consome o hash antes do efeito (`detectSessionInUrl`) → sem token e sem erro no hash, vale a sessão existente (`getSession`). Teste na Task 1 (`"nada"`).
3. Erro na query em vez do hash (`?error=…&error_description=…`) → também "Link expirado". Teste na Task 1.
4. Reenviar no passo `sent` usa o mesmo e-mail e não volta ao passo `email`. Teste de fonte na Task 1.
5. Nenhum resto do código: `verifyOtp`, `InputOTP` e "código" somem do formulário e do showcase. Testes de fonte nas Tasks 1 e 2.

---

### Task 1: O formulário por link

**Files:**
- Modify: `src/lib/recovery-links.ts` (nova função pura)
- Modify: `src/components/password-recovery-form.tsx`
- Modify: `src/app/(auth)/reset-password/page.tsx` (só o comentário do topo, que fala em "pode mandar link em vez de código")
- Test: `src/lib/recovery-links.test.ts` (criar se não existir; se existir, acrescentar o `describe`)
- Test: `src/components/password-recovery-form.test.ts` (novo, teste de fonte com `lerFonte`/`semComentarios` de `@/test/fonte`)

**Interfaces:**
- Produces: `export type LinkDeRecuperacao = { tipo: "erro" } | { tipo: "tokens"; accessToken: string; refreshToken: string } | { tipo: "nada" }` e `export function lerLinkDeRecuperacao(hash: string, search: string): LinkDeRecuperacao` em `src/lib/recovery-links.ts`. `hash` vem com ou sem `#`; `search` com ou sem `?`.
- Produces: a prop `entry` passa a ser `"request" | "link"` (padrão `"request"`; `/reset-password` segue com `entry="link"`).
- Produces: o `Step` do formulário passa a ser `"email" | "sent" | "password" | "done"`; a cena do passo `sent` é `"recovery.sent"` (a Task 2 a cria no showcase).

- [ ] **Step 1: Testes que falham**

```ts
// src/lib/recovery-links.test.ts
describe("lerLinkDeRecuperacao", () => {
    it("tokens no hash", () => {
        expect(lerLinkDeRecuperacao("#access_token=a&refresh_token=r&type=recovery", "")).toEqual({ tipo: "tokens", accessToken: "a", refreshToken: "r" })
    })
    it("link vencido no hash vale como erro, mesmo com token junto", () => {
        expect(lerLinkDeRecuperacao("#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid", "")).toEqual({ tipo: "erro" })
        expect(lerLinkDeRecuperacao("#access_token=a&error_code=otp_expired", "")).toEqual({ tipo: "erro" })
    })
    it("erro na query", () => {
        expect(lerLinkDeRecuperacao("", "?error=access_denied&error_description=x")).toEqual({ tipo: "erro" })
    })
    it("nada no endereço (o cliente já consumiu o hash)", () => {
        expect(lerLinkDeRecuperacao("", "?next=%2Fdashboard")).toEqual({ tipo: "nada" })
    })
    it("token sem refresh vira refresh vazio", () => {
        expect(lerLinkDeRecuperacao("access_token=a", "")).toEqual({ tipo: "tokens", accessToken: "a", refreshToken: "" })
    })
})
```

```ts
// src/components/password-recovery-form.test.ts — fonte sem comentários
it("não há mais código", () => {
    expect(FONTE).not.toMatch(/verifyOtp|InputOTP|OTP_LENGTH|"code"/)
})
it("o passo sent avisa o e-mail e reenvia o link", () => {
    expect(FONTE).toContain('scene="recovery.sent"')
    expect(FONTE).toContain('icon="mail"')
    expect(FONTE).toContain('label="Reenviar link"')
    expect(FONTE).toContain("Enviar link")
})
it("o link é lido por lerLinkDeRecuperacao, e o erro vence a sessão", () => {
    expect(FONTE).toContain("lerLinkDeRecuperacao(window.location.hash, window.location.search)")
    expect(FONTE.indexOf('tipo === "erro"')).toBeLessThan(FONTE.indexOf("getSession"))
})
it("vencido pede um link novo", () => {
    expect(FONTE).toContain("Pedir novo link")
})
```

- [ ] **Step 2:** `npx vitest run src/lib/recovery-links.test.ts src/components/password-recovery-form.test.ts` → FAIL.
- [ ] **Step 3: Implementar.**
  - `lerLinkDeRecuperacao`: junta os parâmetros do hash e da query; `error` ou `error_code` em qualquer um → `{ tipo: "erro" }`; senão `access_token` → `tokens`; senão `nada`.
  - Formulário: o efeito da porta do link chama `lerLinkDeRecuperacao(window.location.hash, window.location.search)`; `erro` → `setLinkValid(false)`; `tokens` → `setSession`; `nada` → `getSession`. `sendCode` vira `sendLink` e vai ao passo `sent`; `verifyCode`, `code`, `OTP_LENGTH` e os imports de `InputOTP`/`REGEXP_ONLY_DIGITS` saem; `requestCode` vira `requestLink`. O passo `sent` segue a copy fixa das Global Constraints, com `step="sent"`. O comentário do topo do componente é reescrito: uma porta pede o link (`/forgot-password`), a outra o recebe (`/reset-password`); o Supabase manda o e-mail padrão com `{{ .ConfirmationURL }}`. O comentário do `savePassword` fala em "sessão criada pelo link", não pelo `verifyOtp`.
- [ ] **Step 4:** os dois testes passam; `npx tsc --noEmit`; `npx eslint` nos arquivos; `npm run ds:audit -- src/components/password-recovery-form.tsx` sem violação nova.
- [ ] **Step 5: Commit** — `feat(auth): recuperação de senha por link, sem código`.

### Task 2: O showcase da recuperação fala em link

**Files:**
- Modify: `src/components/auth/showcase/scenes.ts` (`"recovery.code"` → `"recovery.sent"`; overlay `"notice-code"` → `"notice-link"`, no tipo `SceneOverlay` e na cena)
- Modify: `src/components/auth/showcase/scene-context.tsx` (o tipo da cena)
- Modify: `src/components/auth/showcase/auth-showcase.tsx` (`AVISOS["notice-link"]`: `icon={EnvelopeIcon}`, `color={cor("violeta")}`, `app="Mail"`, `title="Seu link de acesso chegou"`, `description="Toque no link para criar a senha nova."`; `notice-expired` com `description="Peça um novo link."`; `KeyIcon` sai do import se ficar sem uso)
- Modify: `src/app/designsystem/docs/showcase.tsx` (a lista de cenas)
- Test: `src/components/auth/showcase/showcase.test.ts` (as três asserções de `recovery.code` passam a `recovery.sent` com `overlay: "notice-link"`; mais uma: o fonte de `auth-showcase.tsx` não contém `notice-code` nem "6 dígitos")

**Interfaces:**
- Consumes: a cena `"recovery.sent"` usada pela Task 1.

- [ ] Teste → FAIL → implementar → `npx vitest run src/components/auth src/app/designsystem`, `npx tsc --noEmit`, eslint → PASS.
- [ ] **Commit** — `feat(auth): o showcase da recuperação mostra o link`.

### Task 3: Jornadas e Atlas

**Files:** `docs/JORNADAS.md` (o fluxograma da recuperação: tirar o nó do código e o `verifyOtp`; `forgot` → "Enviar link" → "Confira seu e-mail" → link → `/reset-password` → senha → login; a tabela de regras técnicas, linhas "Recuperação", "`next` na recuperação" e "Reenviar"; "Pedir novo código" vira "Pedir novo link"), `docs/atlas/template.html` (o mesmo na jornada, data e contagens da capa), `python3 docs/atlas/build.py`.

- [ ] Atualizar, gerar e commitar `docs(jornadas): recuperação de senha por link` (com `atlas-jornadas.html`). A republicação do Atlas é do controlador.

### Fora das tarefas (controlador, no painel do Supabase)

- Projeto novo (`gexvgoknthcvdnqtdukq`), **Authentication › URL Configuration › Redirect URLs**: trocar `http://localhost:3000/reset-password` por `http://localhost:3000/**`, porque o `redirectTo` leva `?next=…` e a lista casa por padrão. O domínio de produção entra quando o dono disser qual é.
- O modelo de e-mail "Reset password" do projeto novo fica o padrão do Supabase (link). Nada a editar.
