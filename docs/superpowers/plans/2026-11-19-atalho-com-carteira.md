# Atalho com carteira Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O guia cria um atalho (voz ou toque) com a carteira escolhida, um de cada modo; a lista fala de atalhos e muda a carteira sem reinstalar; os guias de passos levam o voltar ao topo.

**Architecture:** Migração aditiva (`create_capture_token` com `p_gatilho`, RPC `set_capture_token_workspace`); `GuiaDoAtalho` e `AtalhoSecao` em `src/components/account/`; os quatro guias de passos copiam o ‹ do Importar.

**Tech Stack:** Postgres/Supabase, React, Tailwind v4 com tokens, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-19-atalho-com-carteira-design.md`

## Global Constraints

- Branch `finance-app-2.0`; stage só por caminho explícito (outras sessões commitam nesta pasta); sem push; sem aplicar migração em produção (o controlador pede ao dono).
- Nada em `src/components/ui/` nem `src/app/globals.css`; token-first; Heroicons `16/solid` em slot de 16.
- Textos exatos: "Adicionar atalho"; título da seção "Atalhos"; passo 2 "Escolha a carteira"; aviso "Substitui o seu atalho de voz atual." / "Substitui o seu atalho de toque atual."; "Mudar carteira"; "Desconectar este atalho?"; "Limite de 10 atalhos. Desconecte um para criar outro."; "Não foi possível listar os atalhos."; ‹ com `aria-label="Voltar"`.
- O ‹ copia `src/components/transactions/importar/importar-extrato-dialog.tsx:626-638`: `Button type="button" variant="tertiary" size="icon-md" className="absolute top-2.5 left-2.5 z-20"` com `<ChevronLeftIcon />`, só com `useIsMobile()` e passo > 0, filho direto do `DialogContent`.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- Pessoa com um atalho de voz cria outro de voz: o antigo é desconectado só depois de o novo existir; falha na desconexão mostra o erro e o novo vale.
- Token antigo sem `atalho_gatilho` (nunca usado): aparece com o nome gravado e não é substituído por nenhum modo.
- Pessoa com uma carteira só: passo 2 mostra o nome dela, sem seletor; "Mudar carteira" não aparece.
- Mudar carteira para uma carteira de que a pessoa saiu: RPC devolve `nao_membro` e o diálogo mostra "Você não é membro dessa carteira."
- No desktop o rodapé mantém "Voltar"; no telefone só a ação de seguir e o ‹.

---

### Task 1: Banco

**Files:**
- Create: `supabase/migrations/20261119130000_atalho_carteira.sql`
- Modify: `src/types/database.ts` (args das duas RPCs)

**Interfaces:**
- Produces: `create_capture_token(p_workspace_id uuid, p_name text, p_gatilho text default null) returns text`; `set_capture_token_workspace(p_id uuid, p_workspace_id uuid) returns void`.

- [ ] **Step 1:** Migração: `drop function if exists public.create_capture_token(uuid, text);` e recriar com o corpo de `20261023120000_captura.sql:38-72` mais `p_gatilho` (`check` já existe na coluna; inserir `atalho_gatilho = p_gatilho`; `p_gatilho` fora de `('siri','toque')` e não nulo → `raise exception 'gatilho_invalido'`). `set_capture_token_workspace`: `security definer`, `search_path = ''`, `is_workspace_member(p_workspace_id)` senão `nao_membro`; `update ... where id = p_id and user_id = auth.uid() and revoked_at is null`; nenhuma linha → `raise exception 'nao_encontrado'`. `revoke ... from public, anon; grant execute ... to authenticated` nas duas. Comentário no topo no estilo das migrações vizinhas.
- [ ] **Step 2:** Tipos em `database.ts` (`Args` das duas). `npx tsc --noEmit` → ok.
- [ ] **Step 3:** Commit dos dois arquivos.

---

### Task 2: Guia cria atalho com carteira, um de cada modo

**Files:**
- Modify: `src/components/account/guia-do-atalho.tsx`, `src/components/account/gatilhos-do-atalho.ts`, `src/components/account/nome-livre.ts` (apagar se nada mais usar), `src/components/account/atalho-secao.tsx` (só as props do guia), quem mais renderiza `<GuiaDoAtalho` (achar com grep), `src/components/account/conta.test.ts`

**Interfaces:**
- Consumes: Task 1.
- Produces: `GuiaDoAtalho` props `{ open, onOpenChange, aoCriar, substituir?: CaptureToken, atalhos?: CaptureToken[] }` (sai `nomesEmUso`); `tituloDoAtalho(t: Pick<CaptureToken, "name" | "atalho_gatilho">): string` em `gatilhos-do-atalho.ts` (`siri` → "Lançar gasto", os outros quatro → "Lançar gasto rápido", nulo → `t.name`).

- [ ] **Step 1: Testes que falham** em `conta.test.ts`: `tituloDoAtalho({ name: "iPhone de Kauã", atalho_gatilho: "siri" }) === "Lançar gasto"`, `("bloqueio") === "Lançar gasto rápido"`, `(null) === "iPhone de Kauã"`; fonte do guia contém `p_gatilho`, `<DialogTitle>Adicionar atalho</DialogTitle>`, `Escolha a carteira`, `Substitui o seu atalho de`, `aria-label="Voltar"` e `top-2.5 left-2.5`; não contém `label="Nome do aparelho"` nem `Conectar o iPhone`; o rodapé dos passos > 0 usa `<FormCancel` para o Voltar (nenhum `<Button type="button" variant="tertiary" onClick={() => irPara(`). Rodar `npx vitest run src/components/account/conta.test.ts` → FAIL.
- [ ] **Step 2: Implementar**
  - Passo 2 (`PASSOS[1].titulo = "Escolha a carteira"`): sem campo de nome; o seletor "Os gastos caem em" sempre que houver mais de uma carteira; com uma só, `Muted` "Os gastos caem em {nome}." Texto do passo: o nome do atalho ("O atalho se chama …") fica.
  - `criar()`: `p_name = atual.nome`, `p_gatilho = modo === "voz" ? "siri" : "toque"`. O alvo de substituição é `substituir ?? atalhos.find((t) => t.atalho_gatilho != null && modoDoGatilho(t.atalho_gatilho) === modo)`; o aviso "Substitui o seu atalho de {voz|toque} atual." aparece no passo 2 quando ele existe; a desconexão segue o caminho atual de `substituir`.
  - `substituir` (Baixar de novo) mantém a carteira dele como inicial.
  - Rodapé: Voltar dos passos 1+ vira `<FormCancel onClick={() => irPara(passo - 1)}>Voltar</FormCancel>` (se `FormCancel` não esconder fora de `Form`, confira em `src/components/ui/form.tsx` e `dialog.tsx` e use o que o Importar usa); passo 0 mantém `FormCancel` "Cancelar". O ‹ do Global Constraints com `passo > 0`.
  - Apagar `nomeComModo`/`nomeTemModo`/`nomeSugerido`/`baseDoNome`/`nomeEditado` e testes deles se ficarem sem uso.
  - Textos com "aparelho" no guia viram "atalho".
- [ ] **Step 3:** `npx vitest run src/components/account/conta.test.ts && npx tsc --noEmit && npm run lint && npm run ds:audit -- src/components/account` → ok; `npm run test:unit` antes do commit.
- [ ] **Step 4:** Commit dos arquivos tocados.

---

### Task 3: Lista de atalhos e Mudar carteira

**Files:**
- Modify: `src/components/account/atalho-secao.tsx`, `src/components/account/lancar-pelo-iphone-vazio.tsx`, `src/app/(app)/me/` (texto "aparelhos" da linha Lançar pelo iPhone; ajustar `me-page.test.ts`), `src/components/account/conta.test.ts`
- Create: `src/components/account/mudar-carteira-do-atalho.tsx`

**Interfaces:**
- Consumes: `tituloDoAtalho` (Task 2), `set_capture_token_workspace` (Task 1).
- Produces: `MudarCarteiraDoAtalho({ atalho: CaptureToken | null, onOpenChange: (open: boolean) => void, aoMudar: () => void })`; `legendaDoAtalho(t: CaptureToken, carteira: string): string` = "carteira · último gasto …" / "carteira · ainda não lançou nada" (substitui `legendaDoAparelho`).

- [ ] **Step 1: Testes que falham**: `legendaDoAtalho({ ...base, atalho_gatilho: "siri" }, "Casa") === "Casa · ainda não lançou nada"`; fonte da seção contém `Adicionar atalho`, `>Atalhos<`, `Mudar carteira`, `Desconectar este atalho?`, `tituloDoAtalho(t)`, `MicrophoneIcon`; `mensagemDoErroDeToken({ message: "limite_tokens" }) === "Limite de 10 atalhos. Desconecte um para criar outro."`; fonte de `mudar-carteira-do-atalho.tsx` contém `set_capture_token_workspace`. Rodar → FAIL.
- [ ] **Step 2: Implementar**
  - Linha: ícone `MicrophoneIcon` (voz) ou `CursorArrowRippleIcon` (toque/nulo) no `ItemMedia tile`; título `tituloDoAtalho(t)`; legenda `legendaDoAtalho`.
  - Menu ⋯: "Mudar carteira" (`WalletIcon` 16/solid) só com `workspaces.length > 1`, antes de Desconectar.
  - `MudarCarteiraDoAtalho`: `Dialog surface="auto"` com `Form`, `FormField` + `Select` das carteiras (valor inicial a do atalho), `FormCancel` + `FormSubmit` "Salvar"; erro via `mensagemDoErroDeToken` (`nao_membro` já mapeado) em `FormError`; sucesso fecha e chama `aoMudar` (refetch). Siga um diálogo de edição existente em `src/components/account/` como modelo.
  - Textos: os do Global Constraints; `NOME_INVALIDO` sai se ficar sem uso.
- [ ] **Step 3:** testes, `tsc`, `lint`, `ds:audit -- src/components/account`, `npm run test:unit`.
- [ ] **Step 4:** Commit.

---

### Task 4: Voltar no topo nos outros guias

**Files:**
- Modify: `src/components/account/guia-do-apple-pay.tsx`, `src/components/account/conectar-ia-dialog.tsx`, `src/components/pwa/install-pwa-sheet.tsx`, testes deles se a fonte for conferida (`grep -rln` pelos nomes)

- [ ] **Step 1: Teste que falha** (no teste de fonte existente de cada um, ou em `conta.test.ts` para os dois de `account/`): fonte contém `aria-label="Voltar"` e `top-2.5 left-2.5`; não contém `className={passo === 0 ? "invisible"`. → FAIL.
- [ ] **Step 2:** Tirar o Voltar invisível; no desktop o Voltar fica no rodapé só com `passo > 0`, escondido no telefone (o mesmo mecanismo do Task 2); o ‹ do Global Constraints com `passo > 0`. A ação de seguir continua `primary`.
- [ ] **Step 3:** testes, `tsc`, `lint`, `ds:audit` dos três arquivos, `npm run test:unit`; commit.

---

### Task 5: Jornada

**Files:** `docs/JORNADAS.md`, `docs/atlas/template.html`, `docs/atlas/atlas-jornadas.html` (gerado), `docs/captura/atalho-iphone.md`

- [ ] **Step 1:** Trocar "Conectar o iPhone"/"Adicionar iPhone"/"iPhones conectados"/nome do aparelho por: "Adicionar atalho", passo 2 "Escolha a carteira", um atalho de cada modo (o novo substitui o antigo do mesmo modo), lista "Atalhos" com "Mudar carteira" (RPC `set_capture_token_workspace`), `create_capture_token` com `p_gatilho`, o ‹ no topo dos guias de passos no telefone. Mermaid com `%%{init}%%`, sem id reservado.
- [ ] **Step 2:** `python3 docs/atlas/build.py` → ok; `graphify update .`; commit.
