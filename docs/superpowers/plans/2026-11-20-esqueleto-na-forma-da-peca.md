# Esqueleto na forma da peça — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** todo esqueleto do app tem a forma da peça que ele guarda: cápsula para controle, raio de cartão para cartão.

**Architecture:** o `Skeleton` (`src/components/ui/skeleton.tsx`) ganha `shape="control"` e `shape="surface"`. Depois, os esqueletos de `ui/` e os das telas passam a usar a forma da peça real.

**Tech Stack:** React 19, Tailwind v4, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-20-esqueleto-na-forma-da-peca-design.md`

## Global Constraints

- **`shape="control"`:**
  - cápsula, `rounded-full shrink-0`;
  - `size`: `xs` `h-6`, `sm` `h-7`, `md` `h-8`, `lg` `h-9` (o padrão), `xl` `h-10`;
  - `md`, `lg` e `xl` levam também `pointer-coarse:h-11`;
  - a largura é de quem chama;
  - botão de ícone: `aspect-square`, com a largura derivando da altura (nada de `w-*` nem `size-*`).
- **`shape="surface"`:** `rounded-surface`, sem degrau.
- **Mapa de forma:**
  - botão, campo, busca, aba, trilho de abas, `Select`, pílula de filtro → `control`;
  - cartão, painel, tabela → `surface`;
  - avatar → `circle`; ladrilho de cor → `tile`; chip → `pill`; texto → `text`;
  - o resto continua `block`, com o raio da peça real. Nunca um raio que a peça não tem.
- **Altura:** a do esqueleto segue a da peça real, com o piso de 44 no toque, para a tela não pular quando o dado chega. Antes de mudar, leia o JSX da peça real que o esqueleto guarda.
- **Sem teste-tranca** que reprove esqueleto quadrado (abordagem C). Os testes existentes que fixam classes antigas de esqueleto são atualizados para a forma nova.
- **Arquivos de outras sessões:** `src/components/ui/theme-toggle.tsx` tem mudança não commitada de outra sessão. Não o edite; ele fica fora.
- **Commits:** só os seus arquivos, com `git commit <caminhos>`. Sem push, sem stash, sem reset e sem `git add .`. A mensagem termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Cada task de migração** termina com:
  - `npx vitest run <pastas tocadas>`;
  - `npx tsc --noEmit`;
  - `npm run ds:audit -- <pastas tocadas>`;
  - `graphify update .`.
- **Relatório:** liste, por arquivo, cada esqueleto que ficou `block` e por quê.

## Review Focus

1. **Botão de ícone no toque:** com `aspect-square`, ele vira círculo de 44, e não oval.
2. **A tela não pula:** a altura do esqueleto bate com a da peça, nos dois apontadores.
3. **Raio que vence:** um `rounded-*` que ficou no `className` depois de trocar a forma desfaz a cápsula. Tire o raio velho.
4. **Esqueleto que não é controle:** gráfico, barra de progresso e linha de texto não viram cápsula sem a peça ser cápsula.
5. **`text` dentro de controle:** o osso do rótulo dentro de um botão continua `text`. Só o botão inteiro é `control`.

---

### Task 1: as formas `control` e `surface` no `Skeleton`

**Files:**
- Modify: `src/components/ui/skeleton.tsx` (`FORMAS`, `SkeletonShape` e o comentário do topo)
- Test: `src/components/ui/skeleton.test.ts`
- Modify: `src/app/designsystem/docs/skeleton.tsx` (as duas formas no mostrador e na `PropsTable`)
- Modify: `AGENTS.md`, no bullet "**`Skeleton`**": `shape` passa a listar `control` (a cápsula na escada de controle, 44 no toque, `aspect-square` no de ícone) e `surface` (o raio do `Card`)

- [ ] **Step 1: testes.**
  - `control` sem `size` tem `h-9`, `rounded-full` e `pointer-coarse:h-11`.
  - `control size="xs"` tem `h-6` e não tem `pointer-coarse:h-11`. O mesmo vale para `sm` (`h-7`).
  - `md` é `h-8` e `xl` é `h-10`, os dois com `pointer-coarse:h-11`.
  - `surface` tem `rounded-surface`.
  - Siga o estilo do `skeleton.test.ts` (fonte ou render, o que ele já usa).
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** implementar. As classes vão por extenso no `FORMAS`, porque o Tailwind lê texto.
- [ ] **Step 4:** PASS. Rodar:
  - `npx vitest run src/components/ui/skeleton.test.ts src/app/designsystem`;
  - `npx tsc --noEmit`;
  - `npm run ds:audit -- src/components/ui/skeleton.tsx`;
  - `npm run ds:docs-map`, se a página mudar de seção.
- [ ] **Step 5:** commit `feat(skeleton): as formas control e surface`.

### Task 2: os esqueletos de `ui/`

**Files (Modify):** os esqueletos dentro de `src/components/ui/`: `avatar-group`, `bottom-bar`, `calendar`, `card`, `carousel`, `chart`, `date-tile`, `device-frame`, `filter-bar`, `hover-card`, `onboarding`, `page-header`, `page-section`, `qr-code`, `seal`, `showcase`, `sidebar`, `split-shell`, `stat-card`, `table`, `timeline` e `top-bar`. Não o `theme-toggle`.

**Interfaces:**
- Consumes: `Skeleton shape="control" | "surface"` da Task 1.

- [ ] **Step 1:** para cada `<Skeleton`, ache a peça real no mesmo arquivo e aplique o mapa de forma.
- [ ] **Step 2:** atualize os `*-versions.test.ts` que fixavam a classe antiga.
- [ ] **Step 3:** rodar as verificações em `src/components/ui src/app/designsystem` e commit `fix(ui): os esqueletos dos componentes na forma da peça`.

### Task 3: Transações, Categorias e Painel

**Files (Modify):**
- `src/components/transactions/` (`transactions-page-skeleton`, `detalhe/folha-do-plano`, `visualizador-de-anexo`);
- `src/components/categories/` (`categories-page-grid-skeleton`, `detail/category-detail-skeleton`, `expense-category-card`, `income-category-card`);
- `src/components/dashboard/dashboard-page-skeleton.tsx`;
- `src/app/(app)/dashboard/page-client.tsx`.

**Interfaces:**
- Consumes: Task 1.

- [ ] **Step 1:** em `transactions-page-skeleton.tsx:52-53`:
  - o trilho de abas vira `shape="control"`, sem `rounded-row-lg` e sem `pointer-coarse:h-11` à mão;
  - o botão do telefone vira `shape="control"` com `aspect-square`.
- [ ] **Step 2:** o mesmo mapa em todo o resto dos arquivos.
  - Nos cartões de Categorias a faísca (`data-osso="faisca"`, `rounded-none`) fica como está.
- [ ] **Step 3:** atualize os testes que fixavam a classe antiga.
- [ ] **Step 4:** verificações e commit `fix(esqueletos): Transações, Categorias e Painel na forma da peça`.

### Task 4: Cartões, Contas a pagar, Assinaturas e Previsão

**Files (Modify):**
- `src/components/credit-cards/` (`credit-card-detail-skeleton`, `credit-card-tile`, `credit-cards-page-skeleton`);
- `src/app/(app)/credit-cards/page-client.tsx`;
- `src/components/bills/` (`bills-page-skeleton`, `bill-detail-sheet`);
- `src/components/subscriptions/subscriptions-page-skeleton.tsx`;
- `src/components/previsao/previsao-skeleton.tsx`.

- [ ] **Step 1:** o mapa de forma em cada `<Skeleton`.
  - No `bill-detail-sheet.tsx:181`, o `rounded-lg` vira a forma do ladrilho real.
- [ ] **Step 2:** atualize os testes que fixavam a classe antiga.
- [ ] **Step 3:** verificações e commit `fix(esqueletos): Cartões, Contas, Assinaturas e Previsão na forma da peça`.

### Task 5: casca, Você, Membros, Configurações, conta e acesso

**Files (Modify):**
- `src/components/layout/` (`auth-shell`, `notifications-panel`, `workspace-picker-menu-body`, `workspace-switcher`);
- `src/components/me/me-page-skeleton.tsx`;
- `src/components/members/` (`members-section-skeleton`, `workspace-invite-dialog`);
- `src/app/(app)/members/loading.tsx`;
- `src/components/settings/` (`settings-page-skeleton`, `notification-preferences`, `workspace-delete-dialog`);
- `src/components/account/` (`apple-pay-convite`, `atalho-secao`, `ias-secao`);
- `src/components/auth/showcase/mini-app.tsx`.

- [ ] **Step 1:** o mapa de forma em cada `<Skeleton`.
  - O esqueleto das abas do painel de notificações (`h-9 w-full rounded-full`) vira `shape="control"`.
- [ ] **Step 2:** atualize os testes que fixavam a classe antiga.
- [ ] **Step 3:** verificações e commit `fix(esqueletos): casca, Você, Membros e Configurações na forma da peça`.
