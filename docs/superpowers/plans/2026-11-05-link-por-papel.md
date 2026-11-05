# Link de convite por papel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Um link de convite ativo por papel (membro e convidado). No diálogo, a escolha Membro/Convidado mostra o link daquele papel ou o botão de gerar, e o link já está lá quando o diálogo abre.

**Architecture:** A Edge `workspace-invites-create` passa a revogar só o link do mesmo papel ao gerar, e o `action: "get"` devolve os dois links (`{ links: { member, guest } }`). O front lê isso numa consulta própria do React Query (`inviteLinksKeys.links`), fora do IndexedDB, buscada quando Membros abre e na casca (`AquecerMembros`, só o dono). O diálogo lê a mesma consulta, sem estado local de link, e escreve nela ao gerar e ao excluir.

**Tech Stack:** Next.js (App Router desta versão), React, `@tanstack/react-query` v5, Supabase Edge Functions (Deno), vitest, `deno test`.

**Spec:** pedido do dono em 05/11/2026, nesta conversa: "quando eu abro o dialog tem um link ainda existente, ele carrega primeiro o card antigo e só depois mostra o link e o link deve ser para cada opção e se o link gerado é do membro quando eu estiver no membro ele aparece, se eu colocar no convidado, daí o botão de gerar link aparece, porque daí eu preciso gerar um link para convidado." Ele pulou as perguntas; as decisões abaixo são do controlador e estão marcadas.

## Global Constraints

- Design system do `AGENTS.md`; nada novo em `src/components/ui/` nem em `globals.css`. O esqueleto é o `Skeleton` existente.
- O link é segredo de portador: a consulta dos links **não** vai ao IndexedDB (entra em `NON_PERSISTED_ROOTS` de `src/lib/queries/persist.ts`). Decisão do controlador.
- O token do link continua `inviteLinkToken(SUPABASE_SERVICE_ROLE_KEY, id)` (`supabase/functions/_shared/token-hash.ts`); o banco guarda só o hash.
- Copy: o aviso do link antigo continua "Já existe um link ativo, de antes de o link poder ser mostrado de novo. Gere um novo para copiar (o anterior deixa de valer)." e só aparece para o papel selecionado cujo link não se refaz. O botão continua "Gerar link de convite". A frase do cartão continua "…e entra como membro/convidado." pelo papel selecionado.
- Banco de dev = produção: não gerar nem excluir link real ao testar. A Edge é publicada no fim pelo dono (`scripts/publicar-link-de-convidado.sh` já publica `workspace-invites-create` nos dois projetos).
- Commits só com os arquivos da tarefa (`git add <arquivos>`, nunca `-A`); trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; depois de código, `graphify update .`. Sem `git stash`.

## Review Focus

1. Gerar link de Convidado com um link de Membro ativo → o de Membro continua valendo (a revogação filtra `role`). Teste de fonte na Task 1.
2. Dois links pendentes do mesmo papel (dados antigos) → o `get` devolve o mais recente. Teste do `escolherLinksAtivos` na Task 1.
3. Link vencido (`expires_at` no passado) com `status = 'pending'` → não aparece. Teste do `escolherLinksAtivos` na Task 1.
4. Diálogo aberto antes de os links chegarem → o espaço do link mostra o esqueleto, nunca o botão nem o aviso. Teste de fonte na Task 3.
5. Excluir com Convidado selecionado → revoga só o `invite_id` do convidado, e o de Membro continua no cache. Teste de fonte na Task 3.

---

### Task 1: A Edge, um link por papel

**Files:**
- Create: `supabase/functions/_shared/invite-links.ts`
- Test: `supabase/functions/_shared/invite-links.test.ts`
- Modify: `supabase/functions/workspace-invites-create/index.ts` (a revogação do link e o ramo `action === 'get'`)
- Test: `src/lib/papeis/edges-papeis.test.ts` (teste de fonte da Edge, já existe)

**Interfaces:**
- Produces: `export type LinhaDeLink = { id: string; role: 'member' | 'guest'; expires_at: string; created_at: string; token_hash: string }` e `export function escolherLinksAtivos(linhas: LinhaDeLink[], agora: Date): { member: LinhaDeLink | null; guest: LinhaDeLink | null }` — por papel, o mais recente por `created_at` com `expires_at > agora`.
- Produces (resposta do `get`): `{ ok: true, links: { member: LinkAtivo | null, guest: LinkAtivo | null } }`, com `LinkAtivo = { invite_id: string; expires_at: string; invite_url: string | null }` (`invite_url: null` quando o hash não bate: link antigo).

- [ ] **Step 1: Testes que falham** — `invite-links.test.ts` (Deno, `jsr:@std/assert@1.0.19` como `token-hash.test.ts`): `escolherLinksAtivos` com um de cada papel devolve os dois; com dois `member` devolve o de `created_at` maior; com um `guest` vencido devolve `guest: null`; lista vazia devolve os dois `null`. Em `edges-papeis.test.ts`, sobre o fonte da Edge sem comentários: a revogação do link contém `.eq('role', role)` antes do `.is('invited_email', null)` no `update({ status: 'revoked' })`, e o fonte contém `links: { member:` e `escolherLinksAtivos(`.
- [ ] **Step 2:** `deno test supabase/functions/_shared/invite-links.test.ts` e `npx vitest run src/lib/papeis/edges-papeis.test.ts` → FAIL.
- [ ] **Step 3: Implementar.** O `get` lê todos os links pendentes da carteira (`status = 'pending'`, `invited_email is null`, colunas `id,role,expires_at,created_at,token_hash`), passa por `escolherLinksAtivos(linhas, new Date())` e, para cada papel, refaz o token e confere o hash (como hoje). A criação do link revoga só `.eq('role', role)`.
- [ ] **Step 4:** os dois testes passam; `deno check supabase/functions/workspace-invites-create/index.ts`.
- [ ] **Step 5: Commit** — `feat(convites): um link ativo por papel na Edge`.

### Task 2: Os links no cache do front

**Files:**
- Create: `src/lib/queries/fetch-invite-links.ts`
- Test: `src/lib/queries/fetch-invite-links.test.ts`
- Modify: `src/lib/queries/keys.ts` (`queryRoot.inviteLinks`, `inviteLinksKeys`)
- Modify: `src/lib/queries/persist.ts` (+ `persist.test.ts`): `queryRoot.inviteLinks` em `NON_PERSISTED_ROOTS`
- Modify: `src/app/(app)/members/page-client.tsx`: `useQuery` dos links com `enabled` só para o dono
- Modify: `src/components/layout/aquecer-membros.tsx`: também pré-busca os links quando `papel === "owner"`

**Interfaces:**
- Consumes: a resposta do `get` da Task 1.
- Produces: `export type LinkAtivo = { invite_id: string; expires_at: string; invite_url: string | null }`, `export type LinksDeConvite = { member: LinkAtivo | null; guest: LinkAtivo | null }`, `export function fetchInviteLinks(workspaceId: string): Promise<LinksDeConvite>` (chama `invokeEdgeJson("workspace-invites-create", { body: { workspace_id, invite_kind: "link", action: "get" } })`; resposta sem `links` vira os dois `null`), `export const INVITE_LINKS_STALE_MS = 5 * 60_000`, e `inviteLinksKeys.links(workspaceId)` = `["inviteLinks", workspaceId]`.

- [ ] **Step 1: Testes que falham** — `fetch-invite-links.test.ts` com `vi.mock("@/lib/edge-invoke")`: manda `action: "get"` e `invite_kind: "link"`; devolve `links` como veio; resposta `{ ok: true }` sem `links` vira `{ member: null, guest: null }`. `persist.test.ts`: `shouldPersistQuery(consulta(["inviteLinks", "w1"]))` é `false`.
- [ ] **Step 2:** `npx vitest run src/lib/queries/fetch-invite-links.test.ts src/lib/queries/persist.test.ts` → FAIL.
- [ ] **Step 3: Implementar** `fetchInviteLinks`, a chave, a exclusão no persist, o `useQuery` em `page-client.tsx` (`staleTime: INVITE_LINKS_STALE_MS`, `enabled` com `canManageMembers`) e a pré-busca em `AquecerMembros` (`queryClient.prefetchQuery` com a mesma chave e `staleTime`, só com `papel === "owner"`).
- [ ] **Step 4:** testes passam; `npx tsc --noEmit`.
- [ ] **Step 5: Commit** — `feat(membros): os links de convite buscados ao abrir Membros, só em memória`.

### Task 3: O diálogo mostra o link do papel escolhido

**Files:**
- Modify: `src/components/members/workspace-invite-dialog.tsx`
- Test: `src/components/members/membros.test.ts` (teste de fonte) e `src/lib/papeis/papeis.test.ts` (o teste "o link vai com o papel escolhido…" continua valendo)

**Interfaces:**
- Consumes: `fetchInviteLinks`, `inviteLinksKeys`, `INVITE_LINKS_STALE_MS`, `LinksDeConvite` (Task 2).

- [ ] **Step 1: Testes que falham** (fonte sem comentários do diálogo):
  - lê a consulta: contém `inviteLinksKeys.links(` e `useQuery(`;
  - o link é o do papel selecionado: contém `links?.[papelDoConvite.role]`;
  - sem estado local de link: não contém `setGeneratedLinkUrl`, `pendingLinkInvite` nem `action: "get"`;
  - enquanto carrega, esqueleto: contém `<Skeleton` e o ramo do esqueleto vem antes de `Gerar link de convite` no fonte;
  - gerar e excluir escrevem no cache: contém `setQueryData(inviteLinksKeys.links(` ao menos duas vezes;
  - excluir revoga o `invite_id` do papel: `handleRevokeInvite(linkDoPapel.invite_id)`.
- [ ] **Step 2:** `npx vitest run src/components/members src/lib/papeis` → FAIL.
- [ ] **Step 3: Implementar.** `const linkDoPapel = links?.[papelDoConvite.role] ?? null`. Estados do cartão, nesta ordem: consulta pendente → `Skeleton` (`shape="pill"`, a altura do botão); `linkDoPapel?.invite_url` → campo + Copiar + Excluir e a validade (`linkDoPapel.expires_at`); `linkDoPapel` sem URL → o aviso do link antigo + Gerar; sem link → Gerar. Gerar grava `{ invite_id, expires_at, invite_url }` no papel em `setQueryData`; Excluir confirmado grava `null` no papel. A frase "entra como…" usa `papelDoConvite.role`. O `linkCopied` volta a `false` ao trocar de papel. O efeito de abrir não busca mais o link (a consulta já cuida); a Edge `workspace-invites-create` de criação passa a devolver `invite_id` (já devolve).
- [ ] **Step 4:** `npx vitest run src/components/members src/lib/papeis`, `npx tsc --noEmit`, `npx eslint src/components/members`, `npm run ds:audit -- src/components/members/workspace-invite-dialog.tsx` sem violação nova.
- [ ] **Step 5: Commit** — `feat(membros): o diálogo mostra o link do papel escolhido, pronto ao abrir`.

### Task 4: Jornadas e Atlas

**Files:** `docs/JORNADAS.md` (linha "Papel do convite (Bloco 7A)" e o nó `link` do fluxograma de Membros: um link por papel; gerar revoga só o do mesmo papel; o diálogo mostra o do papel escolhido; a consulta `inviteLinks` em memória, buscada ao abrir Membros e pela casca), `docs/atlas/template.html` (o mesmo na jornada de Membros), `python3 docs/atlas/build.py`.

- [ ] Atualizar, gerar e commitar `docs(jornadas): um link de convite por papel` (com `atlas-jornadas.html`). A republicação do Atlas e a publicação da Edge são do controlador.
