# O fim da página Minha conta — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tirar a página `/account`: no desktop o menu do usuário ganha "Editar perfil" (abre o `EditProfileDialog`); no celular a Você ganha "Planos e pagamentos" e "Política de privacidade" (rota nova dentro do app).

**Architecture:** A navegação (`navigation.ts`, `mobile-navigation.ts`, `account-menu-links.ts`) troca Minha conta por Planos e pela rota nova `/settings/privacidade`, que entra no grupo das telas de configuração da Você. `/account` vira só um redirecionamento. O `user-menu.tsx` monta o `EditProfileDialog`.

**Tech Stack:** Next.js (App Router desta versão — ler `node_modules/next/dist/docs/` antes de mexer em rota), React, vitest.

**Spec:** `docs/superpowers/specs/2026-11-04-fim-de-minha-conta-design.md`

## Global Constraints

- "Celular" = `useIsMobile()` (abaixo de 768px).
- Design system do `AGENTS.md`; nada novo em `src/components/ui/` nem em `globals.css`.
- Toda rota nova: `page.tsx` com `<AdiarMontagem fallback={<Loading />}>` e `loading.tsx`.
- Banco de dev = produção: nada de salvar perfil, trocar senha ou excluir conta em verificação.
- Commits só com os arquivos da tarefa (`git add <arquivos>`, nunca `-A`; `deno.lock` e `graphify-out/graph.json` sujos não são da tarefa); sem prettier em `src/components/account/`; não contornar `guarda-componentes`; trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; depois de código, `graphify update .` (sem commitar `graph.json`).

## Review Focus

1. Link antigo para `/account` (favorito, notificação) → no celular cai em `/me`, no desktop no Painel, por `replace`, sem montar nada. Teste na Task 2.
2. Convidado (`guest`) → vê Planos e Política de privacidade na Você e abre as duas (`/plans` exata e `/settings/*`). Teste na Task 1.
3. Voltar de `/plans` e de `/settings/privacidade` no celular → Você. Teste na Task 1.
4. Desktop: "Editar perfil" no menu abre o diálogo e fechar o menu não fecha o diálogo. Conferido no navegador (controlador).
5. Nenhum `ROUTES.ACCOUNT` sobra no app fora do redirecionamento. Teste na Task 2 (`grep` de fonte).

---

### Task 1: A navegação

**Files:**
- Modify: `src/config/navigation.ts` (`ROUTES.SETTINGS_PRIVACIDADE = "/settings/privacidade"`; `APP_PAGE_TITLES[ROUTES.SETTINGS_PRIVACIDADE] = "Política de privacidade"`; tirar `APP_PAGE_TITLES[ROUTES.ACCOUNT]` se nada mais usar; `isAccountHubPath` sai se ficar sem uso)
- Modify: `src/components/layout/account-menu-links.ts` (o item `ROUTES.ACCOUNT` sai de `ACCOUNT_MENU_PROFILE_LINK_ITEMS`)
- Modify: `src/config/mobile-navigation.ts` (`ROTAS_DE_VOCE_EM_SETTINGS` ganha `SETTINGS_PRIVACIDADE`; grupo Conta = `[PLANS ("Planos e pagamentos", SparklesIcon), SETTINGS_PRIVACIDADE ("Política de privacidade", LockClosedIcon 24/outline), COFRE, SETTINGS_IAS, SETTINGS_NOTIFICACOES]`; o `case ROUTES.ACCOUNT` sai; `miniIconFor` ganha o par de `LockClosedIcon` se faltar)
- Modify: `src/components/layout/app-header.tsx:43` (`/plans` volta a `ROUTES.ME`)
- Modify: `src/lib/papeis/rotas-do-convidado.ts` (`ROUTES.ACCOUNT` sai de `COM_SUBROTAS`)
- Modify: `src/components/layout/sidebar-app-shell.tsx:53` (o `ROUTES.ACCOUNT` da lista sai)
- Modify: `src/lib/jornada/jornada.ts:29-31` (canal do iPhone: `texto: "Fale ou escreva o gasto e o Atalho lança. Conecte o iPhone em Lançar pelo iPhone."`, `href: ROUTES.SETTINGS_LANCAR`)
- Test: `src/config/mobile-navigation.test.ts` e os testes que citarem essas listas

- [ ] **Step 1: Testes**: o grupo Conta de `getVoceGroups([], "owner")` é exatamente `[PLANS, SETTINGS_PRIVACIDADE, COFRE, SETTINGS_IAS, SETTINGS_NOTIFICACOES]`, e o de `"guest"` também; `voceBackHref(ROUTES.PLANS)` e `voceBackHref(ROUTES.SETTINGS_PRIVACIDADE)` são `ROUTES.ME`; `isVoceTabActive(ROUTES.SETTINGS_PRIVACIDADE, [])` é `true`; `rotaPermitidaAoConvidado("/settings/privacidade")` é `true`; o canal do iPhone de `canaisPara("iphone", [])` tem `href === "/settings/lancar-pelo-iphone"`. Trocar as asserções antigas que esperavam `ROUTES.ACCOUNT` ou `voceBackHref(ROUTES.PLANS)` indefinido.
- [ ] **Step 2:** rodar → FAIL. **Step 3:** implementar. **Step 4:** `npx vitest run src`, `npx tsc --noEmit` → PASS.
- [ ] **Step 5: Commit** — `feat(voce): Planos e Política de privacidade no lugar de Minha conta`.

### Task 2: As rotas — `/settings/privacidade` nova e `/account` só redireciona

**Files:**
- Create: `src/app/(app)/settings/privacidade/{page.tsx,page-client.tsx,loading.tsx}` (molde de `settings/notificacoes/`: `PageHeader collapse` só fora do celular, título "Política de privacidade"; o corpo é o `PrivacidadeWireframe`; `loading.tsx` com `SettingsPageSkeleton`)
- Modify: `src/components/wireframe/privacidade-wireframe.tsx` (o link "Abrir Minha conta (precisa entrar)" sai; o do Cofre fica)
- Modify: `src/app/(app)/account/(raiz)/page-client.tsx` → só redireciona: `useEffect` com `router.replace(isMobile ? ROUTES.ME : ROUTES.DASHBOARD)`, devolve `null`. Os componentes que ficarem sem uso (o esqueleto `account-page-skeleton.tsx`, `SettingsLink` se for só dela…) saem, se e somente se nenhum outro arquivo os importar (`grep`); o `loading.tsx` da rota passa a não mostrar esqueleto (o vazio de `(app)/loading.tsx`).
- Test: `src/app/(app)/settings/settings-rotas.test.ts` (a rota nova na tabela `ROTAS`, com `<PrivacidadeWireframe />`), um teste de fonte para `/account` (`router.replace(isMobile ? ROUTES.ME : ROUTES.DASHBOARD)`, sem `EditProfileDialog`/`Seal`), e um teste que varre `src/` (fora de testes, de `navigation.ts` e da rota `/account`) e não acha `ROUTES.ACCOUNT` nem `"/account"`.

- [ ] Testes → FAIL → implementar → `npx vitest run src`, `npx tsc --noEmit`, eslint, `npm run ds:audit -- "src/app/(app)/settings/privacidade"` → PASS.
- [ ] **Commit** — `feat(conta): a Política de privacidade dentro do app e /account só redireciona`.

### Task 3: "Editar perfil" no menu do usuário (desktop)

**Files:**
- Modify: `src/components/layout/user-menu.tsx` (um `DropdownMenuItem` "Editar perfil" com `UserCircleIcon` no lugar do antigo link, abrindo `EditProfileDialog` montado fora do `DropdownMenuContent` — o menu fecha e o diálogo fica; estado `editarAberto`)
- Test: o teste do `user-menu` (ou novo `user-menu.test.ts`, fonte): contém `>Editar perfil<`/`Editar perfil`, `<EditProfileDialog open={editarAberto}`, e não contém `ROUTES.ACCOUNT`.

- [ ] Testes → FAIL → implementar → `npx vitest run src`, `npx tsc --noEmit`, eslint → PASS.
- [ ] **Commit** — `feat(conta): Editar perfil no menu do usuário`.

### Task 4: Jornadas e regras

**Files:** `docs/JORNADAS.md` (a jornada de Minha conta: a página some, `/account` redireciona; Editar perfil pelo menu no desktop e pela foto da Você no celular; Planos e Política de privacidade na Você; a jornada de começar; o mapa geral se a ponte mudou), `docs/atlas/template.html` (o mesmo, os apêndices de rotas, a data e as contagens da capa), `AGENTS.md` (os trechos que citam Minha conta: o voltar a Você — "Minha conta e Configurações voltam a ela" —, a página `/me` e "Planos fica dentro de Minha conta", o `Avatar onEdit` "Minha conta edita o perfil por ele", o `Seal` "Minha conta o usa no lugar de 'Membro desde'"), `python3 docs/atlas/build.py`.

- [ ] Atualizar, gerar e commitar `docs(jornadas): o fim da página Minha conta` (com `atlas-jornadas.html`). A republicação é do controlador.
