# Editar e selo no topo da Você — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No topo de `/me`, a foto abre o Editar perfil (lápis no canto) e, sob o e-mail, aparece o selo com "Membro desde …".

**Architecture:** A composição do `Seal` de Minha conta vira `SeloDeMembro`, usada nas duas páginas. `VoceAvatar` repassa `onEdit` ao `Avatar`. A página `/me` monta o `EditProfileDialog`.

**Tech Stack:** Next.js, React, vitest (testes de fonte com `@/test/fonte`).

**Spec:** `docs/superpowers/specs/2026-11-04-editar-e-selo-na-voce-design.md`

## Global Constraints

- Design system do `AGENTS.md`: nada novo em `src/components/ui/` nem em `globals.css`; o `Seal` é a peça de marca da tela; par de identidade sem `gap`.
- Minha conta não muda na tela.
- Banco de dev = produção: verificação sem salvar.
- Commits só com os arquivos da tarefa; sem prettier em `src/components/account/`; não contornar `guarda-componentes`; trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; depois de código, `graphify update .` (sem commitar `graph.json`).

## Review Focus

1. Conta sem `created_at` → sem a fileira do selo (nem texto "Membro desde undefined"). Teste na Task 1.
2. Perfil ainda carregando (círculo neutro do `VoceAvatar`) → a página já espera no esqueleto (`esperando`), então o lápis só aparece com o perfil. Conferir no código, Task 1.
3. O avatar `xs` da aba da barra não ganha lápis nem botão. Teste na Task 1.
4. Editar perfil aberto da Você → a seção Segurança e os diálogos filhos funcionam igual a Minha conta (o mesmo componente). Conferir a 375px.
5. Minha conta continua com o mesmo selo (mesmo `label` e `ring`). Teste na Task 1.

---

### Task 1: SeloDeMembro, o lápis da Você e o selo sob o e-mail

**Files:**
- Create: `src/components/account/selo-de-membro.tsx`
- Modify: `src/app/(app)/account/page-client.tsx` (usa `<SeloDeMembro desde={user.created_at} />` no lugar do `Seal` inline)
- Modify: `src/components/layout/voce-avatar.tsx`
- Modify: `src/app/(app)/me/page-client.tsx`
- Test: `src/app/(app)/me/me-page.test.ts`, `src/components/account/conta.test.ts`

**Interfaces:**
- Produces: `export function SeloDeMembro({ desde }: { desde: string })` — devolve o `Seal` com `label={\`Membro desde ${formatTransactionMonthYearPtBr(desde)}\`}`, `ring={\`MEMBRO DESDE · ${formatMonthShortPtBr(new Date(desde)).toUpperCase()} ${new Date(desde).getFullYear()} · FINANCE APP · \`}` e `icon={<AppLogo />}` (os valores de hoje em `account/page-client.tsx:81-84`).
- `VoceAvatar({ size, onEdit }: { size: "xs" | "xl"; onEdit?: () => void })` — repassa `onEdit` e `editLabel="Editar perfil"` ao `Avatar` só quando `size === "xl"`.

- [ ] **Step 1: Testes de fonte**
  - `conta.test.ts`: `account/page-client.tsx` contém `<SeloDeMembro desde={user.created_at} />` e não contém `<Seal`; `selo-de-membro.tsx` contém `MEMBRO DESDE · `, `· FINANCE APP · ` e `<AppLogo />`.
  - `me-page.test.ts`: `me/page-client.tsx` contém `<VoceAvatar size="xl" onEdit={` e `<EditProfileDialog`, e `user?.created_at ?` antes de `<SeloDeMembro`; ao lado do selo, `Membro desde ${formatTransactionMonthYearPtBr(`; `voce-avatar.tsx` só passa `onEdit` com `size === "xl"`. Atualizar a asserção atual `'<VoceAvatar size="xl" />'`.
- [ ] **Step 2:** `npx vitest run "src/app/(app)/me" src/components/account` → FAIL.
- [ ] **Step 3: Implementar.** Na `/me`, sob o par nome/e-mail (fora dele, porque o par não leva `gap`): `{user?.created_at ? <div className="flex items-center justify-center gap-2"><SeloDeMembro desde={user.created_at} /><Muted>Membro desde {formatTransactionMonthYearPtBr(user.created_at)}</Muted></div> : null}`. Estado `editarAberto` e `<EditProfileDialog open={editarAberto} onOpenChange={setEditarAberto} />` dentro do retorno da página.
- [ ] **Step 4:** `npx vitest run src`, `npx tsc --noEmit`, eslint nos arquivos, `npm run ds:audit -- src/components/account/selo-de-membro.tsx src/components/layout/voce-avatar.tsx "src/app/(app)/me"` → limpos.
- [ ] **Step 5: Commit** — `feat(voce): editar pela foto e o selo de membro no topo da Você`.

### Task 2: Jornadas

**Files:** `docs/JORNADAS.md` (a jornada da Você/`/me`: o Editar perfil também abre pela foto da Você; o selo sob o e-mail), `docs/atlas/template.html` (a mesma jornada, a data da capa), `python3 docs/atlas/build.py`; o parágrafo da página `/me` no `AGENTS.md` (bullet do `BottomBar`: "A página `/me` é a identidade centrada (avatar 56, nome, e-mail)") ganha o lápis e o selo.

- [ ] **Step 1:** Atualizar o fluxograma e a tabela; `%%{init}%%`; ids não reservados.
- [ ] **Step 2:** Espelhar no template; `build.py` → ok; `AGENTS.md`.
- [ ] **Step 3: Commit** — `docs(jornadas): editar e selo na Você` (com `atlas-jornadas.html`). A republicação é do controlador.
