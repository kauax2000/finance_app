# Alterar senha e Excluir conta no Editar perfil — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O Editar perfil ganha a seção "Segurança" (Alterar senha, Excluir conta), e as duas ações saem da página Minha conta.

**Architecture:** O `EditProfileDialog` passa a dono do estado e da montagem do `ChangePasswordDialog` e do `DeleteAccountDialog` (que não mudam), abertos por cima dele a partir de duas linhas de um `Card` de `Item`. A página `/account` perde a linha Senha, o botão Excluir conta e esses dois diálogos.

**Tech Stack:** Next.js, React, vitest (testes de fonte com `@/test/fonte`).

**Spec:** `docs/superpowers/specs/2026-11-04-senha-e-excluir-no-editar-perfil-design.md`

## Global Constraints

- Design system do `AGENTS.md`: nada novo em `src/components/ui/` nem em `globals.css`; composição de `Card padding="none"`, `ItemGroup variant="divided"`, `Item variant="flush" interactive asChild` + `<button type="button">`, `ItemChevron`, título por `PageSection size="sm"` + `PageSectionHeader`/`PageSectionTitle` (como os grupos de `/me`). Sem cor crua: o vermelho é `text-destructive`.
- As linhas são `type="button"`; o Enter do formulário continua salvando o perfil.
- Banco de dev = produção: nada de salvar perfil, trocar senha ou excluir conta em verificação.
- Commits só com os arquivos da tarefa; sem prettier em `src/components/account/`; não contornar o hook `guarda-componentes`; mensagem termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; depois de código, `graphify update .` (sem commitar `graph.json`).

## Review Focus

1. Enter num campo do Editar perfil → salva o perfil, não abre senha/excluir. Teste de fonte na Task 1 (`type="button"` nas duas linhas).
2. Abrir Alterar senha e fechar → volta ao Editar perfil aberto, com o que a pessoa digitou. Coberto pela montagem dentro do diálogo (Task 1); conferido no navegador.
3. Perfil salvando (`saving`) → as duas linhas desabilitadas. Teste na Task 1.
4. Telefone (gaveta) → a seção aparece igual e o diálogo filho empilha. Conferido no navegador a 375px.
5. Página `/account` sem caminho perdido → Senha e Excluir conta só no Editar perfil, que abre pela foto (`onEdit`). Teste na Task 1.

---

### Task 1: A seção Segurança e a página sem as duas ações

**Files:**
- Modify: `src/components/account/edit-profile-dialog.tsx` (a seção abaixo do e-mail/senha atual, antes dos alertas; estado `senhaAberta`, `excluirAberto`; monta `ChangePasswordDialog` e `DeleteAccountDialog` de `@/components/security`)
- Modify: `src/app/(app)/account/page-client.tsx` (sai a linha `Senha`, a seção vira `titulo="Plano"`, sai o botão `Excluir conta`, saem os estados `changePasswordOpen`/`deleteAccountOpen` e a montagem dos dois diálogos)
- Test: `src/components/account/conta.test.ts` (atualizar o que citar a linha Senha ou o botão Excluir conta da página)

**Interfaces:**
- Consumes: `ChangePasswordDialog({ open, onOpenChange })`, `DeleteAccountDialog({ open, onOpenChange })` (já existem, sem mudança).

- [ ] **Step 1: Testes de fonte** em `conta.test.ts` (`lerFonte`/`semComentarios`):
  - `edit-profile-dialog.tsx` contém `>Segurança<`, `>Alterar senha<`, `>Excluir conta<`, `<ChangePasswordDialog` e `<DeleteAccountDialog`; o título "Excluir conta" vem com `text-destructive`; as duas linhas são `<button type="button"` com `disabled={saving}`; a seção vem depois de `id="edit-email"` e antes de `{errorMessage &&`.
  - `account/page-client.tsx` não contém `titulo="Senha"`, `ChangePasswordDialog`, `DeleteAccountDialog` nem `Excluir conta`; contém `titulo="Plano"` e o botão `Sair`.
- [ ] **Step 2:** `npx vitest run src/components/account/conta.test.ts` → FAIL.
- [ ] **Step 3: Implementar.** Os diálogos filhos ficam **fora** do `<Dialog>` do Editar perfil no JSX (irmãos, num fragmento), para não herdarem o `pending`/`CustomForm` dele; o Radix e o `vaul` empilham (`AGENTS.md`: gaveta dentro de gaveta vira `NestedRoot`). Ícones opcionais: `KeyIcon` e `TrashIcon` de `@heroicons/react/20/solid`, `size-5`, como as linhas de `/me`.
- [ ] **Step 4:** `npx vitest run src`, `npx tsc --noEmit`, eslint nos arquivos, `npm run ds:audit -- src/components/account/edit-profile-dialog.tsx "src/app/(app)/account/page-client.tsx"` → limpos.
- [ ] **Step 5: Commit** — `feat(conta): alterar senha e excluir conta no Editar perfil`.

### Task 2: Jornadas

**Files:** `docs/JORNADAS.md` (Minha conta: arestas `account -->|"Senha: Alterar"|` ~1241 e `account -->|"Excluir conta"|` ~1251 passam a sair do Editar perfil; linha "Tela" ~1319), `docs/atlas/template.html` (a mesma jornada e a data da capa), `python3 docs/atlas/build.py`.

- [ ] **Step 1:** Atualizar as arestas e a tabela; `%%{init}%%` em todo bloco; ids não reservados.
- [ ] **Step 2:** Espelhar no template; `python3 docs/atlas/build.py` → ok.
- [ ] **Step 3: Commit** — `docs(jornadas): senha e excluir conta no Editar perfil` (com `atlas-jornadas.html`). A republicação é do controlador.
