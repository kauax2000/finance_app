# Lista da gaveta: cabeçalho "Filtros" e rodapé de ações Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Na gaveta do telefone, a lista "Filtrar por…" ganha um cabeçalho com o título "Filtros", centralizado, e um rodapé preso com "Limpar tudo" e "Ver N lançamentos". O "Limpar tudo" solto, à direita, no fim da lista, sai.

**Architecture:** Tudo em `ListaDeCampos` (`src/components/ui/filter-bar.tsx` ~1673–1722), no ramo `naGaveta`. O cabeçalho repete a grade do cabeçalho do editor da gaveta (`grid-cols-[1fr_minmax(0,auto)_1fr]`, o mesmo título), só com o título no meio. O rodapé fica fora da área que rola. O rótulo "Ver …" vem de `count` e `noun`, que o `FilterBar` já recebe; quem os repassa ao `ListaDeCampos` é o pai (`FilterBar`, ~1412).

**Tech Stack:** React, cmdk, Tailwind v4, vitest (testes de fonte).

**Spec (design curto, escolhido pelo dono em 16/11/2026):**
- **Escolha:** o cabeçalho da opção B (só o título "Filtros") com as ações da opção C (rodapé com Limpar e Ver resultados). As opções eram: A, o botão na linha inteira; B, o cabeçalho "Limpar | Filtros | Pronto"; C, o rodapé preso com "Limpar tudo" e "Ver N lançamentos".
- **Rodapé:** "Limpar tudo" em `tertiary`, e "Ver N lançamentos" em `primary`, que fecha a gaveta. É a regra do par de ações, `primary` com `tertiary`. Os dois dividem a linha, 50/50.
- **Decisões minhas:**
  - Sem filtro ligado, "Limpar tudo" some e "Ver …" ocupa a linha inteira, porque o sistema evita botão desabilitado.
  - Com `count` indefinido (carregando), o rótulo é "Ver resultados".
  - Com `count` 1, "Ver 1 lançamento"; com outro número, "Ver N lançamentos", pelo `noun`. Sem `noun`, "Ver N resultados".
  - "Ver" fecha a gaveta pelo mesmo caminho do "Pronto" do editor.

## Global Constraints

- Peças do sistema: `Button` (`primary` / `tertiary`). O texto do botão vai em minúscula, e o `Button` põe a maiúscula.
- O desktop (popover) não muda: tudo fica sob `naGaveta`.
- O rodapé não rola com a lista. Ele fica abaixo do `CommandList`, e a lista continua com o teto `LISTA_NA_GAVETA`.
- O título do cabeçalho tem o mesmo corpo e peso do título do editor da gaveta.
- Sem prettier. Nunca `git add graphify-out/graph.json` nem `CLAUDE.md`. Sem push. O commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- **Fechar:** "Ver …" fecha a gaveta pelo mesmo mecanismo do "Pronto" e devolve o foco como hoje.
- **Limpar tudo:** continua chamando `onLimparTudo`, e a lista fica sem valores.
- **Plural e carregando:** "Ver 1 lançamento", "Ver 12 lançamentos" e, com `count` indefinido, "Ver resultados".
- **Altura:** a gaveta não pode saltar ao abrir. O rodapé entra na medida desde o primeiro quadro.

---

### Task 1: Cabeçalho e rodapé da lista na gaveta

**Files:**
- Modify: `src/components/ui/filter-bar.tsx` (`ListaDeCampos` e a chamada dele no `FilterBar`)
- Test: `src/components/ui/filter-bar-gaveta.test.ts`

- [ ] **Step 1: Teste que falha.** O teste confere na fonte (com `semComentarios`):
  - o ramo `naGaveta` da lista tem um cabeçalho com o texto `Filtros`;
  - existe um `Button` com `variant="primary"` cujo rótulo começa com `Ver ` e é montado a partir de `count` (o "Ver resultados" sem `count`);
  - o "Limpar tudo" é `variant="tertiary"` e fica na mesma linha (o mesmo contêiner) do "Ver";
  - o antigo `<div className="flex justify-end px-2 pb-2">` sumiu.

  Se a lógica do rótulo for uma função pura (recomendado: `rotuloVerResultados(count?: number, noun?: [string, string]): string`, exportada), teste também o comportamento: `(undefined) → "Ver resultados"`, `(1, ["lançamento","lançamentos"]) → "Ver 1 lançamento"`, `(12, …) → "Ver 12 lançamentos"`, `(3, undefined) → "Ver 3 resultados"`.
- [ ] **Step 2: Rodar** `npx vitest run src/components/ui/filter-bar-gaveta.test.ts`. Esperado: FALHA.
- [ ] **Step 3: Implementar** o cabeçalho (título "Filtros" na grade do editor) e o rodapé (`flex gap-2`, os dois botões `flex-1`; sem filtro, só o "Ver"). Repasse `count`, `noun` e a função de fechar ao `ListaDeCampos`.
- [ ] **Step 4: Rodar** `npx vitest run src/components/ui/filter-bar` e `npx tsc --noEmit`. Esperado: PASSA.
- [ ] **Step 5: Commit** com `feat(filter-bar): a lista da gaveta tem o cabeçalho "Filtros" e o rodapé Limpar tudo | Ver resultados`.
