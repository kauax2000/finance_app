# Importar e Exportar na barra da lista Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No desktop de Transações, Importar e Exportar saem do ⋯ do cabeçalho e viram dois botões terciários na barra da lista, depois da contagem; com a barra estreita, voltam ao ⋯ ao lado das abas.

**Architecture:** `TransacoesToolbar` (`src/components/transactions/transacoes-toolbar.tsx`) já recebe `onImportar`, `onExportar` e `exportando` e desenha o ⋯ no telefone. Ela ganha os dois botões depois da `FilterBar`, e o ⋯ passa a aparecer também quando a linha parte (`@max-3xl/transacoes`). A página (`src/app/(app)/transactions/page-client.tsx`) tira o `PageHeaderActions`.

**Tech Stack:** React 19, Tailwind v4 (container queries), vitest de fonte.

**Spec:** `docs/superpowers/specs/2026-11-18-importar-exportar-na-barra-design.md`

## Global Constraints

- Botões: `Button type="button" variant="tertiary"`, sem `size` (a barra é `lg`, o padrão do `Button`), ícone `16/solid` sem classe de tamanho: `ArrowUpTrayIcon` "Importar", `ArrowDownTrayIcon` "Exportar". Exportar com `disabled={exportando}`.
- Visíveis só com a linha inteira no desktop: `hidden md:flex @max-3xl/transacoes:hidden`. O ⋯ (`MenuMaisAcoes variant="floating"`) aparece no complemento exato: telefone (`max-md:flex`) e linha partida (`@max-3xl/transacoes:flex`). Nunca os dois juntos, nunca nenhum (fora o convidado).
- Sem um handler (convidado), o botão some; sem os dois, o grupo some.
- O cabeçalho do desktop fica só com o título: sai o `PageHeaderActions` e o comentário "Criar mora no + Adicionar…" passa a dizer que Importar e Exportar moram na barra da lista.
- Nada em `src/components/ui/` muda.
- Jornada: atualizar `docs/JORNADAS.md` (linhas 691–692 do fluxograma de Transações, "Importar extrato … no ⋯ do cabeçalho (desktop)" na tabela do Importar e "no ⋯ do cabeçalho do desktop" na do Exportar), a mesma explicação em `docs/atlas/template.html`, rodar `python3 docs/atlas/build.py`. A republicação do Atlas é do controlador.
- Sem prettier. Comentários em português. Nunca `git add graphify-out/graph.json` nem `CLAUDE.md`. Sem push. Commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sem navegador no subagente (banco de produção).

## Review Focus

- Janela de 768–1000px: a linha parte; o ⋯ aparece e os botões não.
- Convidado: nem botões nem ⋯.
- Exportando: o botão Exportar fica desligado.
- Telefone: igual a hoje (o ⋯ ao lado das abas).

---

### Task 1: Os botões na barra e o cabeçalho sem ⋯

**Files:**
- Modify: `src/components/transactions/transacoes-toolbar.tsx`, `src/app/(app)/transactions/page-client.tsx`, `docs/JORNADAS.md`, `docs/atlas/template.html`, `docs/atlas/atlas-jornadas.html` (gerado)
- Test: `src/app/(app)/transactions/page-client.test.ts` (o teste do `PageHeaderActions` em ~44–47 vira o contrário; o da barra em ~81–82 continua)

- [ ] **Step 1: Testes que falham** (fonte sem comentários):
  - a página não contém `<PageHeaderActions` nem `MenuMaisAcoes`;
  - a barra contém `variant="tertiary"` com `Importar` e `Exportar`, `disabled={exportando}` e a classe `hidden md:flex @max-3xl/transacoes:hidden`;
  - o invólucro do ⋯ contém `max-md:flex` e `@max-3xl/transacoes:flex`.
- [ ] **Step 2: Rodar** `npx vitest run "src/app/(app)/transactions" src/components/transactions`. Esperado: FALHA.
- [ ] **Step 3: Implementar** como nas Global Constraints. Atualize o comentário do ⋯ na barra (hoje diz "acima, Importar e Exportar moram no cabeçalho").
- [ ] **Step 4: Rodar** os testes do Step 2, `npx tsc --noEmit`, `npx eslint` nos arquivos tocados e `npm run ds:audit -- src/components/transactions/transacoes-toolbar.tsx`. Esperado: PASSA.
- [ ] **Step 5: Jornada:** `docs/JORNADAS.md`, `docs/atlas/template.html`, `python3 docs/atlas/build.py`.
- [ ] **Step 6: Commit** `feat(transacoes): no desktop, Importar e Exportar saem do ⋯ do cabeçalho para a barra da lista`.
