# Redesign da tela de Membros — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/members` vira o layout A escolhido pelo dono: o botão "Convidar pessoa" no topo (abre o diálogo de convite), e as seções Pessoas, Convites pendentes e Limites em listas `Card` + `ItemGroup`; trocar papel e remover moram no ⋯ de cada pessoa; os três wireframes do Bloco 7 da tela viram design system.

**Architecture:** O `page-client.tsx` (1106 linhas) fica com a carga e os handlers que já tem; a marcação sai para três componentes em `src/components/members/` (`PessoasSecao`, `ConvitesPendentesSecao`, `LimitesSecao`). O formulário de convite e o link saem da página: o botão abre uma instância local do `WorkspaceInviteDialog` (que já faz e-mail, link e papel), e a página recarrega ao fechá-lo. O `PapelDoConviteWireframe` do diálogo vira `PapelDoConvite` (DS).

**Tech Stack:** Next.js (App Router desta versão), React, Supabase, vitest.

**Spec:** sem documento; as decisões estão neste plano (o dono pulou as perguntas e escolheu o layout A entre três mockups no navegador, 4/nov/2026). A referência visual são as telas revisadas nesta rodada: a página Você (`src/app/(app)/me/page-client.tsx`), `/settings/lancar-pelo-iphone` (`src/components/account/atalho-secao.tsx`).

## Global Constraints

- Design system do `AGENTS.md`; **nada novo em `src/components/ui/` nem em `globals.css`** (sem ok do dono). Não contornar o hook `guarda-componentes`.
- Listas: `Card padding="none"` + `ItemGroup variant="divided"` + `Item variant="flush"` (`className="min-h-12"` nas linhas tocáveis, ícones de 20 em `20/solid`, título `pointer-coarse:text-base`), como a Você. Seções: `PageSection size="sm"` + `PageSectionHeader` + `PageSectionTitle`.
- Ações de linha: `DropdownMenu` com gatilho `Button variant="tertiary" size="icon-md"` + `EllipsisHorizontalIcon` sem tamanho, `aria-label="Mais opções para <nome>"` (como `atalho-secao.tsx`).
- Telefone: o título grande é da casca (`TituloDaTela`); a página não escreve o seu. Desktop: `PageHeader collapse` com `PageHeaderTitle asChild` + `<p aria-hidden="true">`.
- Banco de dev = produção: na verificação **não** convidar, trocar papel, remover, reenviar, cancelar nem salvar limite.
- Commits só com os arquivos da tarefa (`git add <arquivos>`, nunca `-A`; `deno.lock` e `graphify-out/graph.json` sujos não são da tarefa); trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; sem push.
- Textos em português, como o app escreve hoje ("Dono", "Membro", "Convidado" vêm de `rotuloDoPapel`).

## Review Focus

1. Quem não é dono (membro, convidado) → não vê "Convidar pessoa", nem ⋯ nas pessoas, nem ⋯ nos convites; vê as listas. Teste de fonte na Task 3.
2. O dono na própria linha e na linha de outro dono → sem ⋯ (não se remove nem troca o próprio papel). Teste na Task 3.
3. Fechar o diálogo de convite depois de convidar → a lista de pendentes atualiza sem recarregar a página. Teste de fonte na Task 3 (`onOpenChange` que recarrega ao fechar).
4. Limites indisponíveis no banco (a leitura falha) → a seção mostra "Os limites ainda não estão disponíveis nesta carteira." e nada quebra. Teste na Task 2.
5. Convidado menor de idade → o envio continua exigindo o consentimento (o `montarConvite` recusa sem ele). Teste na Task 1.

---

### Task 1: `PapelDoConvite` no design system

**Files:**
- Create: `src/components/members/papel-do-convite.tsx`
- Modify: `src/components/members/workspace-invite-dialog.tsx` (troca `PapelDoConviteWireframe` por `PapelDoConvite`)
- Modify: `src/components/wireframe/papeis-wireframe.tsx` (sai `PapelDoConviteWireframe`; `PapelDoConvite`/`PAPEL_DO_CONVITE_INICIAL` mudam para o arquivo novo, e quem os importava passa a importar de lá)
- Test: `src/components/members/papel-do-convite.test.ts` (novo)

**Interfaces:**
- Produces: `export type PapelDoConvite = { role: "member" | "guest"; menor: boolean; consentimento: boolean }`, `export const PAPEL_DO_CONVITE_INICIAL`, `export function PapelDoConvite({ valor, onChange, disabled }: { valor: PapelDoConvite; onChange: (v: PapelDoConvite) => void; disabled?: boolean })`.

- [ ] **Step 1: Teste** (fonte, com `lerFonte`/`semComentarios` de `src/test/fonte.ts`): o arquivo usa `RadioGroup` com dois itens de valor `member` e `guest`, rótulos "Membro" e "Convidado" com as descrições "Vê e lança tudo da casa" e "Lança e vê só o que é dele"; `Checkbox` "É menor de idade" só com `guest`; o segundo `Checkbox` "Sou o responsável legal e autorizo o uso do app (LGPD, art. 14)." só com `menor`; marcar menor zera `consentimento`; a nota "O link de convite é sempre de membro." fica; não importa nada de `@/components/wireframe`. E `workspace-invite-dialog.tsx` contém `<PapelDoConvite` e não contém `PapelDoConviteWireframe`. Mais um teste de `montarConvite` (de `@/lib/papeis/papeis`) com `{ role: "guest", menor: true, consentimento: false }` → recusa (Review Focus 5).
- [ ] **Step 2:** rodar → FAIL. **Step 3:** implementar com `RadioGroup` (`variant="card"`, `description`) e `Checkbox` + `Field`/`FieldLabel` do DS. **Step 4:** `npx vitest run src`, `npx tsc --noEmit`, `npx eslint <arquivos>` → PASS.
- [ ] **Step 5: Commit** — `feat(membros): o papel do convite sai do wireframe para o design system`.

### Task 2: `LimitesSecao` no design system

**Files:**
- Create: `src/components/members/limites-secao.tsx`
- Delete: `src/components/wireframe/limites-wireframe.tsx` (se nada mais importar)
- Test: `src/components/members/limites-secao.test.ts` (novo)

**Interfaces:**
- Consumes: de `@/lib/limites/limites` o que o wireframe usa hoje (`linhasDosLimites`, `gravarLimite`, `removerLimite`, `lerLimiteDigitado`, os tipos) — mesma carga e mesma detecção de indisponível.
- Produces: `export function LimitesSecao({ workspaceId, pessoas, podeEditar }: { workspaceId: string | null; pessoas: { user_id: string; nome: string }[]; podeEditar: boolean })` — a seção inteira (`PageSection size="sm"`, título "Limites", descrição "Limite mensal de gasto de cada pessoa. Avisa em 80% e em 100%, à pessoa e ao dono.").

- [ ] **Step 1: Teste** (fonte): a seção usa `PageSection`, `Card padding="none"`, `ItemGroup variant="divided"`; cada pessoa é uma `Item` com o nome e, abaixo, "R$ x no mês, sem limite" ou "R$ x de R$ y" (via `currencyBRL`) e um `Progress` com `bands={[80, 100]}` quando há limite; indisponível mostra exatamente "Os limites ainda não estão disponíveis nesta carteira." (Review Focus 4); carregando é `Skeleton`, não texto; com `podeEditar`, a linha abre um `Dialog surface="auto"` "Limite de <nome>" com `Form` + `FormInput money` + `FormSubmit` "Salvar" e, com limite existente, `FormCancel`/ação "Remover limite"; o erro de valor é "Informe um valor maior que zero, até R$ 9.999.999.999,99."; não importa `@/components/wireframe`.
- [ ] **Step 2:** FAIL. **Step 3:** implementar portando a lógica do wireframe. **Step 4:** vitest, tsc, eslint, `npm run ds:audit -- src/components/members/limites-secao.tsx` → PASS.
- [ ] **Step 5: Commit** — `feat(membros): os limites por pessoa saem do wireframe para o design system`.

### Task 3: A página no layout A

**Files:**
- Create: `src/components/members/pessoas-secao.tsx`, `src/components/members/convites-pendentes-secao.tsx`
- Modify: `src/app/(app)/members/page-client.tsx` (sai o formulário de convite, o link e a marcação das listas; ficam carga e handlers; entra o botão e as três seções)
- Modify: `src/components/wireframe/papeis-wireframe.tsx` (sai `TrocarPapelWireframe`; se o arquivo esvaziar, ele sai)
- Modify: `src/lib/papeis/papeis.test.ts:89-105` (as asserções do `TrocarPapelWireframe` passam a cobrar o ⋯)
- Test: `src/components/members/membros.test.ts` (novo)

**Interfaces:**
- Consumes: `LimitesSecao` (Task 2); `WorkspaceInviteDialog` (`open`, `onOpenChange`, `user`, `workspaceId`, `canManageMembers`); RPC `trocar_papel` (`p_workspace_id`, `p_user_id`, `p_role`), os handlers existentes `handleRemoveMember`, `handleResendInvite`, `handleRevokeInvite`, e o `AlertDialog` "Remover membro" que já existe.
- Produces: `PessoasSecao({ pessoas, meuUserId, podeGerenciar, onTrocarPapel, onRemover, ocupadoId })` e `ConvitesPendentesSecao({ convites, podeGerenciar, onReenviar, onCancelar, onCopiarLink, ocupadoId })`; os tipos vêm dos que a página já usa (`MemberWithProfile`, `WorkspaceInvite`).

Decisões:
- **Topo:** no desktop, `PageHeader collapse` "Membros e convidados" com a ação `Button variant="primary"` "Convidar pessoa" (`UserPlusIcon`). No telefone, o mesmo botão em `w-full` logo abaixo do título da casca. Só com `canManageMembers`.
- **Convidar** abre uma instância local de `WorkspaceInviteDialog`; `onOpenChange={(aberto) => { setConvidarAberto(aberto); if (!aberto) recarregar() }}` (Review Focus 3).
- **Pessoas · N:** linha = `Avatar` (tom de `identityToneFor`, iniciais), nome (com "(você)" na sua), e-mail em `ItemDescription`, `Badge` com `rotuloDoPapel(role)`; ⋯ só com `canManageMembers && role !== "owner" && !isMe` (Review Focus 1 e 2), com "Tornar convidado" / "Tornar membro" (chama `trocar_papel`, toast de sucesso "<nome> agora é <papel>." ou de erro) e "Remover da carteira" (`variant="destructive"`, abre o `AlertDialog` atual).
- **Convites pendentes:** linha = ladrilho com `EnvelopeIcon` (e-mail) ou `LinkIcon` (link), o e-mail ou "Link de convite", descrição "<papel> · <expira em …>" (reusar `formatLinkInviteExpiresAt`); ⋯ só com `canManageMembers`: "Reenviar" (só e-mail), "Copiar link" (só link), "Cancelar convite" (destructive, `handleRevokeInvite`). Sem pendentes: uma linha `Muted` "Nenhum convite pendente".
- **Limites:** `LimitesSecao` só com `isAdulto`, depois dos pendentes; o `id="limites"` e o `id="workspace-invites"` ficam nas seções (âncoras de outras jornadas).
- O aviso "Apenas o owner pode remover membros…" sai.

- [ ] **Step 1: Testes** (fonte): a página contém `<WorkspaceInviteDialog`, "Convidar pessoa", `if (!aberto)` recarregando, `<PessoasSecao`, `<ConvitesPendentesSecao`, `<LimitesSecao`, `id="limites"`, `id="workspace-invites"`; não contém `PapelDoConviteWireframe`, `TrocarPapelWireframe`, `LimitesWireframe`, "Gerar link de convite" nem "Apenas o owner"; `pessoas-secao.tsx` condiciona o ⋯ a `podeGerenciar && pessoa.role !== "owner" && pessoa.user_id !== meuUserId`, tem "Tornar convidado", "Tornar membro", "Remover da carteira"; `convites-pendentes-secao.tsx` tem "Reenviar", "Copiar link", "Cancelar convite", "Nenhum convite pendente". Atualizar `papeis.test.ts:104-105` para cobrar a condição do ⋯ em `pessoas-secao.tsx`.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** `npx vitest run src`, tsc, eslint, `npm run ds:audit -- "src/app/(app)/members" src/components/members` → PASS.
- [ ] **Step 5: Commit** — `feat(membros): a tela no layout A, com Convidar no topo e as ações no ⋯`.

### Task 4: Jornadas

**Files:** `docs/JORNADAS.md` (a jornada de Membros: convidar pelo botão e pelo diálogo, trocar papel e remover pelo ⋯, pendentes com ⋯, limites em DS; os wireframes do Bloco 7 saem), `docs/atlas/template.html` (o mesmo, e a data da capa), `AGENTS.md` só se citar a forma antiga da tela, `python3 docs/atlas/build.py`.

- [ ] Atualizar, gerar e commitar `docs(jornadas): a tela de Membros no layout novo` (com `atlas-jornadas.html`). A republicação do Atlas é do controlador.
