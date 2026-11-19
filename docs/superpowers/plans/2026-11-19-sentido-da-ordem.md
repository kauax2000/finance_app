# Sentido da ordem (tocar de novo inverte) — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** no menu de ordem de Categorias, a seção "Sentido" sai. A ordem escolhida mostra uma seta e o sentido em texto pequeno, e tocar nela de novo inverte o sentido sem fechar o menu.

**Architecture:** o `DropdownMenuRadioItem` (`src/components/ui/dropdown-menu.tsx`) ganha `indicatorIcon`, que troca o tique do `indicator="check"`. A `OrdemDasCategorias` (`src/components/categories/categorias-do-mes.tsx`) usa essa prop e um `onSelect` que inverte o sentido e chama `preventDefault`.

**Tech Stack:** React 19, Radix DropdownMenu, Tailwind v4, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-19-sentido-da-ordem-design.md`

## Global Constraints

- **`indicatorIcon?: React.ReactNode`** em `DropdownMenuRadioItem`. Só vale com `indicator="check"`: troca o `CheckIcon`. Sem a prop, nada muda. A mudança em `ui/` foi autorizada pelo dono.
- **Seta:** `ArrowDownIcon`, Heroicons `16/solid`. Quando invertida, `rotate-180`, com `transition-transform duration-(--duration-fast)`.
- **Texto do sentido:** embaixo do nome, em `text-xs text-muted-foreground`. Só a ordem escolhida o mostra. Os rótulos são "Maior primeiro"/"Menor primeiro", "A → Z"/"Z → A" e "Mais subiu"/"Mais caiu".
- **Tocar na escolhida:** `e.preventDefault()` no `onSelect` e `onInvertidaChange(!invertida)`. O menu fica aberto.
- **Tocar em outra:** `onCriterioChange(valor)`. A página já zera `invertida`, e o menu fecha.
- **Sai:** o `DropdownMenuRadioGroup` "Sentido" e o separador antes dele.
- **Não muda:** o `aria-label` do gatilho, o tamanho `lg` e o telefone.
- **Commits:** só os seus arquivos, com `git commit <caminhos>`. Outras sessões têm arquivos não commitados nesta árvore. Sem push. Cada commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Toque duplo rápido na escolhida:** inverte duas vezes e volta ao natural, sem fechar o menu.
2. **Teclado:** Enter ou Espaço na escolhida inverte e mantém o foco na linha.
3. **Trocar de aba (Despesas e Receitas):** o rótulo Gasto/Receita troca, e o sentido continua o mesmo.
4. **Os outros menus com `indicator="check"` ou `"dot"`:** não mudam.
5. **Movimento reduzido:** a seta troca sem girar.

---

### Task 1: `indicatorIcon` no `DropdownMenuRadioItem`

**Files:**
- Modify: `src/components/ui/dropdown-menu.tsx` (`DropdownMenuRadioItem`, os dois ramos: menu e folha)
- Test: `src/components/ui/dropdown-menu-versions.test.ts`
- Modify: `src/app/designsystem/docs/dropdown-menu.tsx`, com uma frase ao lado do `indicator="check"`
- Modify: `AGENTS.md`, no bullet do `DropdownMenu`, ao lado do `indicator="check"`: "`indicatorIcon` troca o tique (a seta do sentido da ordem)"

- [ ] **Step 1: teste de fonte.** O tipo tem `indicatorIcon`, e o ramo `check` renderiza `indicatorIcon ?? <CheckIcon`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** implementar.
- [ ] **Step 4:** PASS. Rodar `npx tsc --noEmit` e `npm run ds:audit -- src/components/ui/dropdown-menu.tsx`.
- [ ] **Step 5:** commit `feat(dropdown-menu): o rádio com tique aceita outro ícone (indicatorIcon)`.

### Task 2: a ordem escolhida inverte ao tocar de novo

**Files:**
- Modify: `src/components/categories/categorias-do-mes.tsx` (`OrdemDasCategorias`)
- Test: `src/components/categories/categorias-do-mes.test.ts`

- [ ] **Step 1: testes de fonte da peça.**
  - Não contém `"Sentido"`.
  - Contém `indicatorIcon=`, `ArrowDownIcon`, `rotate-180` e `preventDefault()`.
  - Os seis rótulos de sentido continuam no arquivo.
  - Teste de render do gatilho, como hoje: `aria-label="Ordenar categorias: gasto, maior primeiro"`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** implementar segundo as Global Constraints.
- [ ] **Step 4:** PASS. Rodar `npx tsc --noEmit`, `npm run lint` e `npm run ds:audit -- src/components/categories/categorias-do-mes.tsx`.
- [ ] **Step 5:** `graphify update .` e commit `feat(categorias): tocar de novo na ordem inverte o sentido, sem fechar o menu`.
