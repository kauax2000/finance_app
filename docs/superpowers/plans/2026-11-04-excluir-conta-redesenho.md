# Excluir conta: redesenho — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O `DeleteAccountDialog` vira dois passos enxutos: aviso calmo com "exporte antes", e confirmação só com a senha.

**Architecture:** A exportação sai do wireframe do Cofre para `src/lib/cofre/baixar.ts` (`baixarExportacao`), usada pelo Cofre e pelo diálogo. O diálogo troca o corpo do passo 1 e do passo 2; a busca das carteiras compartilhadas, o `deleteAccount(password)` e o sucesso não mudam.

**Tech Stack:** Next.js, React, vitest.

**Spec:** `docs/superpowers/specs/2026-11-04-excluir-conta-redesenho-design.md`

## Global Constraints

- Design system do `AGENTS.md`: composição de `Card padding="none"`, `ItemGroup variant="divided"`, `Item`, `Alert tone="warning"`, `Button`, `DialogMedia`; nada novo em `ui/` nem em `globals.css`; sem cor crua.
- Rodapé: Cancelar `tertiary` + Continuar `primary` no passo 1; Voltar (`start`) + `FormSubmit variant="destructive"` no passo 2.
- Banco de dev = produção: **nunca** confirmar a exclusão em teste ou verificação.
- Commits só com os arquivos da tarefa; sem prettier em `src/components/account/`; não contornar `guarda-componentes`; trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; depois de código, `graphify update .` (sem commitar `graph.json`).

## Review Focus

1. Exportar falha (rede) → mensagem no cartão, o diálogo continua aberto e o Continuar funciona. Teste de fonte na Task 2 (o texto do erro e o `try/catch` em `baixarExportacao`).
2. Clicar Exportar duas vezes → o botão fica `pending` e não dispara outra. Teste de fonte na Task 2 (`pending={exportando}`).
3. Sem carteira compartilhada → nada amarelo. Teste na Task 2 (o `Alert` dentro de `sharedOwned.length > 0`).
4. Passo 2 sem senha → "Excluir conta" desabilitado; Enter não envia. Teste na Task 2 (`disabled={!password}`).
5. Cofre aberto continua exportando igual. Teste na Task 1.

---

### Task 1: `baixarExportacao`

**Files:**
- Create: `src/lib/cofre/baixar.ts`
- Modify: `src/components/wireframe/cofre-aberto-wireframe.tsx` (usa a função; mantém o estado `exportando`/`erro` e o texto de erro dele)
- Test: `src/lib/cofre/baixar.test.ts`

**Interfaces:**
- Produces: `export async function baixarExportacao(carteiras: Array<{ id: string; name: string }>): Promise<void>` — chama `exportarTudo`, cria a URL do `Blob`, anexa um `<a download="finance-app-${localYmdFromDate(new Date())}.zip">` ao `body`, clica, remove, e revoga a URL depois de 60s (o comentário do Safari do iOS vai junto). Propaga o erro (quem chama mostra a mensagem).

- [ ] **Step 1: Teste** (vitest com `vi.mock("@/lib/cofre/exportar")`, `URL.createObjectURL`/`revokeObjectURL` espionados, timers falsos): `baixarExportacao([{id:"w",name:"W"}])` chama `exportarTudo` com a lista, cria um `<a>` com `download` terminando em `.zip` e chama `click`; após 60_000ms, `revokeObjectURL` foi chamado; se `exportarTudo` rejeita, a promessa rejeita. Ambiente: o do projeto para testes com DOM (ver outros `*.test.ts` que usam `document`; se não houver jsdom, teste de fonte que confere `download =`, `revokeObjectURL` e `60_000` no arquivo).
- [ ] **Step 2:** rodar → FAIL. **Step 3:** implementar e trocar o corpo do Cofre por `await baixarExportacao(...)`. **Step 4:** `npx vitest run src/lib/cofre src/components/wireframe` e `npx tsc --noEmit` → PASS.
- [ ] **Step 5: Commit** — `refactor(cofre): a exportação vira baixarExportacao`.

### Task 2: O diálogo redesenhado

**Files:**
- Modify: `src/components/security/DeleteAccountDialog.tsx`
- Test: `src/components/account/conta.test.ts` (ou o teste que já lê o diálogo: `grep -rl DeleteAccountDialog src --include="*.test.ts"`)

**Interfaces:**
- Consumes: `baixarExportacao` (Task 1); `useWorkspace().workspaces` para a lista de carteiras.

- [ ] **Step 1: Testes de fonte** no arquivo do diálogo:
  - passo 1: não contém `Atenção` nem `variant="outline"` nas linhas; contém `>O que será apagado<`, `Todos os lançamentos`, `Carteiras e categorias`, `Perfil e preferências`, `BanknotesIcon`, `WalletIcon`, `UserCircleIcon`; o aviso das carteiras é `Alert tone="warning"` dentro de `sharedOwned.length > 0`; contém `Quer guardar uma cópia antes?`, `Exportar meus dados`, `pending={exportando}`, `baixarExportacao(` e `Não foi possível exportar agora. Tente novamente.`; a descrição contém `Passo 1 de 2 · Não dá para desfazer.`; o título não leva `text-destructive`.
  - passo 2: não contém `confirm-email` nem `confirmEmail`; contém `Confirme com sua senha`, `Passo 2 de 2 · Sua conta e os dados acima serão apagados.`, `id="delete-password"` e `disabled={!password}`.
- [ ] **Step 2:** rodar → FAIL.
- [ ] **Step 3: Implementar** pelo spec. `handleDelete` deixa de conferir e-mail (só `if (!password)`); `resetState` limpa o estado da exportação. O texto da carteira: `<strong>{w.name}</strong> some para {plural(i.other_members, "outro membro", "outros membros")} · {plural(i.transactions, "lançamento", "lançamentos")}`; contando, "Contando…".
- [ ] **Step 4:** `npx vitest run src`, `npx tsc --noEmit`, eslint, `npm run ds:audit -- src/components/security/DeleteAccountDialog.tsx` → limpos.
- [ ] **Step 5: Commit** — `feat(conta): excluir conta em dois passos enxutos, com exportar antes`.

### Task 3: Jornadas

**Files:** `docs/JORNADAS.md` (Minha conta: nós `warn`/`confirmDel` — o passo 1 com exportar, o passo 2 só com a senha; Cofre aberto, se cita o diálogo), `docs/atlas/template.html` (o mesmo, a data da capa), `python3 docs/atlas/build.py`.

- [ ] Atualizar, gerar e commitar `docs(jornadas): excluir conta redesenhado` (com `atlas-jornadas.html`). A republicação é do controlador.
