# Remover o assistente de Categorias — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a tela `/categories` passa a abrir sempre direto na grade do mês. O assistente de primeiro uso (renda, categorias e limites, confirmar) sai do app.

**Architecture:** a remoção é só no front. O banco continua igual, porque o front de `main` ainda lê a coluna e chama a RPC (`categories_onboarding_completed_at`, `complete_workspace_categories_onboarding`). Saem os componentes do assistente, o ramo `showOnboarding` da página e as referências deles nos testes de fonte. O mapa de jornadas é atualizado na mesma mudança.

**Tech Stack:** Next.js, React, Vitest.

**Spec:** pedido do dono em 19/11/2026: "Remova o onboarding da tela de categorias". Não há desenho escrito.

## Global Constraints

- **Banco:** nada muda em `supabase/`, em `src/types/database.ts`, em `src/lib/supabase.ts` nem no `select` de `workspace-provider.tsx`. A coluna e a RPC ficam, por compatibilidade com o front de `main`.
- **Design system:** nada muda em `src/components/ui/`, exceto os testes de fonte que citam os arquivos apagados (`card-versions.test.ts`, `dialog-versions.test.ts`).
- **Comportamento:** a grade, os diálogos e o vazio "Crie suas categorias" (`categories.length === 0`) continuam iguais. Quem nunca concluiu o assistente passa a ver a grade direto.
- **Atlas:** é mudança de jornada, então seguir os passos de "Jornadas do app" no AGENTS.md. A republicação é do controlador.
- **Arquivos alheios:** não fazer stage de `CLAUDE.md` nem de `graphify-out/graph.json`.

## Review Focus

1. Carteira nova, criada sem modelo, com a coluna nula: abre a grade (ou o vazio "Crie suas categorias"), nunca uma tela em branco ou um esqueleto preso.
2. O `fetchBudgetsAndSpend` hoje não roda enquanto `showOnboarding`. Sem a guarda, ele roda sempre e a grade tem números.
3. Nenhum import pendente dos arquivos apagados: `tsc` e o build limpos.

---

### Task 1: tirar o assistente do app

**Files:**
- Delete:
  - `src/components/categories/categories-onboarding-wizard.tsx`
  - `src/components/categories/categories-onboarding-loading-shell.tsx`
  - `src/components/categories/categories-onboarding-panel-styles.ts`
  - `src/components/categories/categories-onboarding-wizard-viagem.test.ts`
- Modify: `src/app/(app)/categories/page-client.tsx`. Saem os imports (l.17-18), `showOnboarding` (~l.230-232), a guarda `if (showOnboarding) return` no efeito que chama `fetchBudgetsAndSpend` (com a dependência `showOnboarding`) e o ramo que devolve `CategoriesOnboardingLoadingShell` e `CategoriesOnboardingWizard`. Se `refreshWorkspaces` ficar sem uso, ele sai da desestruturação.
- Modify: as listas de arquivos em `src/components/ui/card-versions.test.ts:87`, `src/components/ui/dialog-versions.test.ts:174` e `src/lib/notification-producers.test.ts:11`. Tirar a entrada do arquivo apagado; se a lista ficar vazia ou o teste perder o sentido, remover o caso.
- Test: `src/app/(app)/categories/page-client.test.ts`

**Interfaces:**
- Produces: nenhuma. Nada de fora importa os arquivos apagados; confirmar com `grep -rn "categories-onboarding" src`, que deve voltar vazio depois.

- [ ] **Step 1:** escrever o teste em `page-client.test.ts`, `"a tela não tem o assistente de primeiro uso"`. Ele lê a fonte da página com `lerFonte` e confere que ela não contém `CategoriesOnboarding`, `showOnboarding` nem `categories_onboarding_completed_at`.
- [ ] **Step 2:** rodar `npx vitest run "src/app/(app)/categories/page-client.test.ts"`. Esperado: FAIL.
- [ ] **Step 3:** apagar os quatro arquivos e editar a página e os três testes de fonte, como em Files.
- [ ] **Step 4:** rodar `grep -rn "categories-onboarding\|CategoriesOnboarding" src`. Esperado: vazio.
- [ ] **Step 5:** rodar `npx tsc --noEmit && npm run lint && npm run test:unit`. Esperado: tudo verde, lint com 0 erros.
- [ ] **Step 6:** atualizar a jornada.
  - **`docs/JORNADAS.md`**, seção 9:
    - tirar a frase "Na primeira visita de cada carteira aparece um assistente";
    - no fluxograma, tirar `onboarded`, `step0`, `step1`, `step2` e `complete`, e ligar `cats` direto a `listView`;
    - na tabela de regras, tirar a linha "Assistente";
    - na linha "Só leitura" (~l.1831), tirar "e o assistente de categorias não abre";
    - nas linhas do modelo de carteira (~l.2009 e ~l.2153), registrar que `categories_onboarding_completed_at` é gravado só por compatibilidade, já que o assistente saiu do app.
    - Manter `%%{init}%%` e não usar palavra reservada do Mermaid como id.
  - **`docs/atlas/template.html`:**
    - a mesma explicação em "Como funciona" da jornada 9;
    - as lacunas e os apêndices que citam o assistente;
    - a linha de data da capa, com `19 nov 2026 · o assistente de primeiro uso de Categorias saiu: a tela abre direto na grade do mês` no começo;
    - as contagens da capa, se mudarem.
  - Rodar `python3 docs/atlas/build.py`.
- [ ] **Step 7:** rodar `graphify update .` e fazer o commit `refactor(categorias): sai o assistente de primeiro uso`. O stage é dos arquivos por caminho, com o `git rm` dos apagados, `docs/JORNADAS.md`, `docs/atlas/template.html` e `docs/atlas/atlas-jornadas.html`.
