# A carteira se edita no seletor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configurações deixa de ter a seção Carteira; no seletor de carteira (barra lateral e cabeçalho do telefone), a carteira selecionada ganha à direita um botão só com ícone: o lápis "Editar carteira" para o dono (abre o diálogo Editar carteira que já existe), "Sair da carteira" para quem não é dono.

**Architecture:** Os estados e diálogos que hoje moram em `WorkspaceAppearanceSettings` (Editar carteira com Divisão, Datas e orçamento, Excluir carteira ou o aviso da pessoal; o diálogo Datas e orçamento; `WorkspaceDeleteDialog`; `WorkspaceLeaveDialog`) passam para um hook em `src/components/workspace/acoes-da-carteira.tsx`. O `WorkspaceSwitcher` monta os diálogos do hook e passa ao `WorkspacePickerMenuBody` as duas ações. A seção sai de Configurações e o arquivo `workspace-appearance-settings.tsx` é apagado.

**Tech Stack:** Next 16, React 19, componentes de `src/components/ui/`, vitest por leitura de fonte (`src/test/fonte.ts`).

**Spec:** o pedido do dono em 2026-11-03: "o foco é que a gente tire [as ações da carteira] das configurações. As configurações vão ser sobre o aplicativo, o sistema da pessoa, não sobre a carteira. No drop-down da carteira, um botão editar só com o ícone do lado direito da carteira selecionada." E: "o lápis vira um sair para quem não é dono."

## Global Constraints

- Texto em português; rótulos: "Editar carteira <nome>" e "Sair da carteira <nome>" como nome acessível dos botões de ícone.
- Design system: só `ui/` e tokens; nada novo em `src/components/ui/`, `globals.css` ou `src/app/designsystem/`; Heroicons sem tamanho vêm de `@heroicons/react/16/solid`; todo `<button>` cru declara `type`.
- O comportamento do diálogo Editar carteira não muda (Divisão no trilho com o exemplo, Datas e orçamento por cima, Excluir carteira vermelho na largura toda, o aviso da pessoal só em texto, um Salvar).
- O banco de desenvolvimento é o de produção: nenhum agente salva, cria ou apaga carteira, nem abre o navegador.
- Commits só com os arquivos da tarefa (`git add <arquivos>`; `git rm` para o apagado).
- `docs/JORNADAS.md`, `docs/atlas/template.html` e `docs/atlas/atlas-jornadas.html` ficam **sem commit**; a republicação do Atlas é da sessão principal.

## Review Focus

1. **Trocar de carteira com um diálogo aberto** fecha todos os diálogos (o efeito que hoje existe em `WorkspaceAppearanceSettings` vai junto para o hook). Teste por leitura de fonte do hook.
2. **Duas instâncias do seletor** (barra lateral e cabeçalho do telefone) não abrem dois diálogos ao mesmo tempo: o estado é por instância e só a instância clicada abre. Teste: o hook é chamado dentro de `WorkspaceSwitcher`, não num provider global.
3. **O botão de ícone não troca de carteira**: clicar nele não dispara o `onValueChange` do grupo de rádio (ele é um `DropdownMenuItem` irmão do `DropdownMenuRadioItem`, não filho). Teste por regex da estrutura.
4. **Quem não é dono vê "Sair"**, e o dono nunca vê "Sair" no seletor. Teste por regex do ternário.
5. **Configurações sem carteira**: a página não importa nada de carteira e o esqueleto de Configurações perde o cartão dela. Teste.

---

### Task 1: As ações da carteira saem de Configurações e vão ao seletor

**Files:**
- Create: `src/components/workspace/acoes-da-carteira.tsx`
- Modify: `src/components/layout/workspace-switcher.tsx`, `src/components/layout/workspace-picker-menu-body.tsx`, `src/app/(app)/settings/(raiz)/page-client.tsx`, `src/components/settings/settings-page-skeleton.tsx`
- Delete: `src/components/settings/workspace-appearance-settings.tsx`
- Test: `src/components/settings/carteira-forms.test.ts`, `src/components/settings/settings-page.test.ts` (as asserções que liam `workspace-appearance-settings.tsx` passam a ler `acoes-da-carteira.tsx`), e um teste novo em `src/components/layout/workspace-picker-acoes.test.ts`

**Interfaces:**
- Produces: `export function useAcoesDaCarteira(): { editar: (() => void) | null; sair: (() => void) | null; dialogos: React.ReactNode }` — para a carteira atual: `editar` só para o dono, `sair` só para quem não é dono; `dialogos` é todo o JSX dos diálogos (o mesmo de hoje em `WorkspaceAppearanceSettings`, menos o cartão, o esqueleto e o `EmptyState`).
- `WorkspacePickerMenuBodyProps["callbacks"]` ganha `editarCarteira?: () => void` e `sairDaCarteira?: () => void`.

- [ ] **Step 1: Testes.** Em `workspace-picker-acoes.test.ts`: (a) `workspace-picker-menu-body.tsx` renderiza, na linha da carteira atual (`workspace.id === currentWorkspaceId`), um `DropdownMenuItem` irmão do `DropdownMenuRadioItem` (dentro de um `<div className="flex …">`), com `aria-label={\`Editar carteira ${workspace.name}\`}` e `PencilIcon` quando `callbacks.editarCarteira`, ou `aria-label={\`Sair da carteira ${workspace.name}\`}` e `ArrowRightStartOnRectangleIcon` quando `callbacks.sairDaCarteira`; o `onSelect` chama `callbacks.closePicker()` antes; (b) `workspace-switcher.tsx` chama `useAcoesDaCarteira()`, renderiza `{acoes.dialogos}` e passa `editarCarteira: acoes.editar ?? undefined` e `sairDaCarteira: acoes.sair ?? undefined`; (c) `acoes-da-carteira.tsx` contém o efeito que fecha `setDeleteOpen(false)`, `setLeaveOpen(false)` e `setDatasOpen(false)` em `[currentWorkspace?.id]`, e `editar: owner ? …` / `sair: !owner ? …`. Em `settings-page.test.ts`: a página de Configurações não contém `WorkspaceAppearanceSettings` nem `Carteira`; o arquivo `workspace-appearance-settings.tsx` não existe. Em `carteira-forms.test.ts`: troque `carteira()` para ler `src/components/workspace/acoes-da-carteira.tsx` e ajuste as asserções do cartão (`openEdit`, `Button … onClick={openEdit}`, `<Card padding="none">`, `Sair da carteira` fora do `acoes`) para o que o hook tem; as do diálogo (Divisão, Datas, Excluir, aviso da pessoal, `acoesDe`) continuam.
- [ ] **Step 2:** `npx vitest run src/components/settings src/components/layout` — falha.
- [ ] **Step 3:** Implemente. Mova a lógica de `WorkspaceAppearanceSettings` para `useAcoesDaCarteira` (sem o cartão, o esqueleto, o `EmptyState` e o `SettingsSection`). No `WorkspacePickerMenuBody`, a carteira atual vira `<div className="flex items-center gap-1">` com o `DropdownMenuRadioItem` (`className="min-w-0 flex-1"`) e o `DropdownMenuItem` de ícone (`className="shrink-0"`, o ícone com `aria-hidden`); as outras linhas ficam como estão. No telefone o seletor abre na escala do toque e o item de ícone segue a altura da linha. Tire `<WorkspaceAppearanceSettings />` da página de Configurações e um cartão do `SettingsPageSkeleton` (`[0, 1, 2]`, comentário "três cartões"). Apague `workspace-appearance-settings.tsx`.
- [ ] **Step 4:** `npx tsc --noEmit && npx vitest run src/components src/app && npx eslint src/components src/app/\(app\)/settings && node .claude/skills/design-system-guard/scripts/audit.mjs src/components/layout src/components/workspace src/components/settings` — verde, sem achado novo.
- [ ] **Step 5:** commit `feat(carteira): editar e sair moram no seletor, e Configurações fica só com o app`.

### Task 2: Jornadas

**Files:** `docs/JORNADAS.md` (seção 2: o diagrama de `/settings` e a linha "Ações da carteira (3/nov/2026)"; seção 3, navegação, se o seletor aparece lá), `docs/atlas/template.html` (jornada 02 "Configurar" e "Como funciona", a linha de `/settings` no apêndice de rotas, a capa com "3 nov 2026 · editar e sair da carteira moram no seletor; Configurações fica só com o app; ").

- [ ] **Step 1:** No diagrama da seção 2, o nó de entrada das ações passa a ser o seletor de carteira (`switcher`): `switcher -->|"lápis da carteira atual, dono"| edit` e `switcher -->|"ícone Sair, quem não é dono"| leave`; `settings` não leva mais a `owner`. A linha da tabela diz que a seção Carteira saiu de Configurações e que as ações moram no seletor (arquivos: `src/components/workspace/acoes-da-carteira.tsx`, `src/components/layout/workspace-picker-menu-body.tsx`, `src/components/settings/workspace-appearance-edit-dialog.tsx`).
- [ ] **Step 2:** `python3 docs/atlas/build.py` → `ok`. Sem commit.
