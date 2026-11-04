# Ações da carteira no "Editar carteira" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Em Configurações, o cartão da carteira fica só com ladrilho, nome e um botão; para o dono, "Editar" abre o diálogo "Editar carteira", que passa a reunir todas as ações da carteira (nome, ícone e cor; Divisão; Datas e orçamento; Excluir carteira).

**Architecture:** `WorkspaceAppearanceEditDialog` ganha um slot `acoes?: ReactNode`, desenhado no `DialogBody` abaixo dos campos. Quem monta as linhas é `WorkspaceAppearanceSettings`, que continua dono dos estados e dos diálogos de Divisão, Datas e Excluir: eles abrem por cima do "Editar carteira" (Radix empilha; no telefone a gaveta dentro de gaveta vira `NestedRoot` sozinha). O ⋯ (`DropdownMenu`) sai do cartão.

**Tech Stack:** Next 16, React 19, componentes de `src/components/ui/`, vitest por leitura de fonte (`src/test/fonte.ts`).

**Spec:** o pedido do dono em 2026-11-03: "deixe todas as configurações da carteira dentro do dialog de editar. Então o apagar eu quero que fique lá dentro e a divisão também. Quando eu clicar em editar, abro o dialogue e lá tem todas as ações para eu tomar referente a carteira." Ele pulou as perguntas. Decisões do Claude: as linhas abrem os diálogos que já existem por cima do Editar (sem passo interno); quem não é dono não tem Editar, e o botão do cartão é "Sair da carteira"; memória do dono: "Carteira fica só com ladrilho, nome e Editar".

## Global Constraints

- Texto em português; os rótulos de hoje ficam: "Editar", "Divisão" (valor "Dividida" | "Pote único"), "Datas e orçamento", "Excluir carteira", "Sair da carteira".
- Design system: só `ui/` e tokens; nada novo em `src/components/ui/`, `globals.css` ou `src/app/designsystem/`; todo `<button>` cru declara `type`; um `primary` por tela (o `FormSubmit` do diálogo).
- O botão do cartão é `Button variant="tertiary"` sem `size` (padrão da casa).
- O banco de desenvolvimento é o de produção: nenhum agente cria, edita ou apaga carteira, nem abre o navegador.
- Commits só com os arquivos da tarefa (`git add <arquivos>`); a árvore tem trabalho alheio sem commit.
- `docs/JORNADAS.md`, `docs/atlas/template.html` e `docs/atlas/atlas-jornadas.html` ficam **sem commit** (carregam linhas de outro trabalho); a republicação do Atlas é da sessão principal.

## Review Focus

1. **Dono da primeira carteira** (`type === "personal"`): o diálogo não oferece "Excluir carteira". Teste: a linha de excluir só aparece sob `canDeleteProject`.
2. **Quem não é dono**: não vê Editar nem o diálogo; vê "Sair da carteira" no cartão e a nota "Só o dono pode alterar nome, ícone e cor.". Teste por regex de `!owner` → `Sair da carteira`.
3. **Excluir com sucesso**: a carteira atual muda e o "Editar carteira" fecha junto (o efeito que zera `editTargetId` quando `currentWorkspace.id` muda continua). Teste: o efeito segue no arquivo.
4. **Trocar de carteira com o Editar aberto**: todos os diálogos fecham (o teste existente "trocar de carteira fecha todos os diálogos" continua verde).
5. **Divisão ainda indisponível** (`split_mode === undefined`): a linha é `SettingsRow` sem ação, agora dentro do diálogo (teste existente continua).

---

### Task 1: O cartão enxuto e as ações dentro do "Editar carteira"

**Files:**
- Modify: `src/components/settings/workspace-appearance-edit-dialog.tsx` (prop `acoes`)
- Modify: `src/components/settings/workspace-appearance-settings.tsx` (sem ⋯; linhas no `acoes`)
- Test: `src/components/settings/carteira-forms.test.ts`, `src/components/settings/settings-page.test.ts`

**Interfaces:**
- Produces: `WorkspaceAppearanceEditDialog({ open, onOpenChange, workspace, acoes }: { …; acoes?: React.ReactNode })` — `acoes` vai no fim do `DialogBody`, depois de `WorkspaceAppearanceFormFields`, precedido de um `Separator` só quando existe.

- [ ] **Step 1: Testes.** Em `carteira-forms.test.ts` e `settings-page.test.ts`, troque as asserções do ⋯ por:
  - `workspace-appearance-settings.tsx` não contém `DropdownMenu` nem `EllipsisVerticalIcon`;
  - casa `/owner \? \(\s*<Button[^>]*variant="tertiary"[^>]*onClick=\{openEdit\}/` e o texto `Editar`;
  - casa `/canDeleteProject \?[\s\S]*Excluir carteira/` dentro do valor passado a `acoes=` (o trecho entre `acoes={` e o `/>` do `WorkspaceAppearanceEditDialog`);
  - casa `/!owner \?[\s\S]*Sair da carteira/` fora do `acoes`;
  - as linhas `Divisão` e `Datas e orçamento` aparecem dentro do `acoes` (mesma fatia), com `{podeDivisao ? (` e `{podeDatas ? (`;
  - `workspace-appearance-edit-dialog.tsx` declara `acoes?: React.ReactNode` (ou `ReactNode`) e renderiza `{acoes ?` dentro do `DialogBody`.
  Mantenha os testes de `open={divisaoOpen && podeDivisao}`, `open={datasOpen && podeDatas}`, `AINDA_NAO_DISPONIVEL` e o de trocar de carteira.
- [ ] **Step 2:** `npx vitest run src/components/settings` — falha.
- [ ] **Step 3:** Implemente. O cartão: ladrilho + nome à esquerda; à direita, para o dono, `<Button type="button" variant="tertiary" onClick={openEdit}>` com `PencilIcon` (`data-icon="inline-start"`, `aria-hidden`) e "Editar"; para quem não é dono, o mesmo `Button` com `ArrowRightStartOnRectangleIcon` e "Sair da carteira" (`onClick={() => setLeaveOpen(true)}`); a `CardNote` de quem não é dono fica. As linhas Divisão / Datas saem do cartão e vão para `acoes`, num `ItemGroup variant="divided"` (de `@/components/ui/item`), com os mesmos `SettingsRow`/`SettingsLink` de hoje. "Excluir carteira" é a última coisa do `acoes`, só com `canDeleteProject`: `Button type="button" variant="tertiary"` com `TrashIcon` e `className="self-start text-destructive hover:text-destructive active:text-destructive"` (o "Excluir conta" de Minha conta), `onClick={() => setDeleteOpen(true)}`. Os diálogos de Divisão, Datas, Excluir e Sair continuam renderizados onde estão. Remova imports mortos (`DropdownMenu*`, `EllipsisVerticalIcon`, `Separator` se sobrar). O esqueleto do cartão: troque o `Skeleton shape="tile" size="lg"` da direita por `Skeleton shape="pill"` com a largura de um botão (`className="h-9 w-20 pointer-coarse:h-11"`).
- [ ] **Step 4:** `npx tsc --noEmit && npx vitest run src/components/settings "src/app/(app)/settings" && npx eslint src/components/settings && node .claude/skills/design-system-guard/scripts/audit.mjs src/components/settings` — verde, sem achado novo.
- [ ] **Step 5:** commit `feat(configuracoes): as ações da carteira moram no Editar carteira` com os quatro arquivos.

### Task 2: Jornadas

**Files:**
- Modify: `docs/JORNADAS.md` (seção 2: o diagrama `settings["/settings"] --> owner…` e a tabela de regras), `docs/atlas/template.html` (jornada 02, "Como funciona", e a linha de `/settings` no apêndice de rotas; a data da capa ganha "3 nov 2026 · as ações da carteira moram no Editar carteira; ")

- [ ] **Step 1:** No diagrama, o dono vai a `edit(["Editar carteira: nome, ícone, cor, e as linhas Divisão, Datas e orçamento e Excluir carteira"])`, e `divisao`, `datas` e `del` saem de `edit` (não de `owner`); `leave` continua saindo de `owner -->|"não"|` com o rótulo "Sair da carteira, no cartão". Na tabela, uma linha "Ações da carteira (3/nov/2026)": o cartão tem só ladrilho, nome e o botão (Editar para o dono, Sair da carteira para os outros); o ⋯ saiu; Divisão, Datas e orçamento e Excluir carteira moram no diálogo Editar carteira e abrem os diálogos deles por cima; arquivos `src/components/settings/workspace-appearance-settings.tsx`, `src/components/settings/workspace-appearance-edit-dialog.tsx`.
- [ ] **Step 2:** `python3 docs/atlas/build.py` → `ok`.
- [ ] **Step 3:** sem commit (ver Global Constraints).
