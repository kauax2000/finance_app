# Total da conferência com faixa de ação Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No telefone, o rodapé da conferência do Importar troca o Total que abre e fecha (`ResumoDoSaldo`) por:
- o Total sempre à vista, sem abrir;
- uma legenda com a contagem de saídas e de entradas;
- uma faixa âmbar de ação quando há lançamentos sem categoria.

**Architecture:**
- Um componente novo, exportado, `TotalDaConferencia({ imp })`, em `src/components/transactions/importar/conferir-importacao.tsx`, mais uma peça exportada `FaixaSemCategoria({ imp, travado })` no mesmo arquivo.
- No rodapé do telefone (`importar-extrato-dialog.tsx`, ~linha 614), o `<div role="status">` passa a conter `TotalDaConferencia`, e a `FaixaSemCategoria` vem **antes** dele no JSX. Com o `flex-col-reverse` do rodapé, ela aparece abaixo do Total e acima do botão, e fica fora da região viva.
- O desktop continua com o `ResumoDoSaldo rotulo="Saldo"` no corpo (`conferir-importacao.tsx`, ~linha 1148), sem mudança.

**Tech Stack:** React, Tailwind v4, vitest (testes de fonte).

**Spec:** a opção A4 do artefato "Total da conferência" (https://claude.ai/artifact/D5rvDS8RauXiu5AYwNWzig, versão 2), escolhida pelo dono em 17/11/2026:
- **Linha do Total:** `Total` à esquerda e o saldo à direita, como hoje: `ContagemQueAnda` com `signedCurrencyBRL`, `text-expense` quando negativo e `text-income` quando não. Sem `Collapsible`.
- **Legenda:** `${n} saídas · ${n} entradas`, com o singular `1 saída` / `1 entrada` e `numberBR`, em `Caption`.
- **Faixa** (só com `resumo.semCategoria > 0` ou com o filtro `"sem-categoria"` ligado):
  - um `<button type="button">` de linha inteira, altura mínima de 44 (`min-h-11`), raio `rounded-row-lg`;
  - superfície `tagChipWarning` (de `@/components/ui/badge`), com o `BadgeDot` no tom de aviso à esquerda;
  - com o filtro desligado, o texto é `${n} sem categoria` e, à direita, `Revisar`, em `font-medium`. O toque faz `imp.setFiltro("sem-categoria")`.
  - com o filtro `"sem-categoria"` ligado, o texto é `Mostrando só os sem categoria` e, à direita, `Ver todos`. O toque faz `imp.setFiltro("todos")`.
  - `disabled` enquanto a importação grava (o `travado` que o diálogo já passa às pendências: `imp.pendente === "importar"`).

## Global Constraints

- Só peças e tokens do design system: `Caption`, `BadgeDot`, `tagChipWarning`, `ContagemQueAnda` (que já existe no arquivo), `rounded-row-lg` e `min-h-11`. Nada novo em `src/components/ui/`. O `<button>` cru leva `type="button"` (a regra do `form-submit-owner.test.ts`).
- O `ResumoDoSaldo` continua existindo para o desktop.
- Sem prettier. Comentários em português. Nunca `git add graphify-out/graph.json` nem `CLAUDE.md`. Sem push. O commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Depois, `graphify update .`.
- Sem navegador no subagente: o banco é de produção.

## Review Focus

- **A última categoria resolvida com o filtro ligado** (`semCategoria` chega a 0 com `"sem-categoria"` ligado): a faixa fica, dizendo `Mostrando só os sem categoria · Ver todos`, para a pessoa poder sair.
- **Nenhum sem categoria e o filtro desligado:** a faixa não aparece e não deixa espaço vazio.
- **Uma saída ou uma entrada só:** a legenda usa o singular.
- **Leitor de tela:** a região viva (`role="status"`) anuncia o Total e a legenda, e não o botão.
- **O ⋯ e a legenda da lista ("Sem categoria (28) · Mostrar todos"):** continuam funcionando junto com a faixa, todos sobre o mesmo `imp.filtro`.

---

### Task 1: TotalDaConferencia e FaixaSemCategoria no rodapé do telefone

**Files:**
- Modify: `src/components/transactions/importar/conferir-importacao.tsx`, com os dois componentes novos junto do `ResumoDoSaldo` (~linha 550)
- Modify: `src/components/transactions/importar/importar-extrato-dialog.tsx`, no rodapé (~linhas 612–618)
- Test: `src/components/transactions/importar/importar-extrato-dialog.test.ts`

**Interfaces:**
- Produces:
  - `export function TotalDaConferencia({ imp }: { imp: ImportarExtrato })`
  - `export function FaixaSemCategoria({ imp, travado }: { imp: ImportarExtrato; travado?: boolean })`

- [x] **Step 1: Testes de fonte que falham** (`semComentarios`):
  - `conferir` exporta os dois componentes e contém `Revisar`, `Mostrando só os sem categoria`, `Ver todos`, `tagChipWarning`, `imp.setFiltro("sem-categoria")` e `imp.setFiltro("todos")`;
  - `conferir` contém o singular `1 saída` e `1 entrada`, ou a forma que os produz (fixe-a no teste);
  - o `TotalDaConferencia` não usa `Collapsible`;
  - `dialogo` casa `/<FaixaSemCategoria imp=\{imp\} travado=\{travadoAoImportar\} \/>\s*<div role="status"[^>]*>\s*<TotalDaConferencia imp=\{imp\} \/>/` dentro do ramo `celular && imp.passo === "conferir"`;
  - ajuste a asserção antiga do rodapé que cita `<ResumoDoSaldo imp={imp} rotulo="Total" />`.
- [x] **Step 2: Rodar** `npx vitest run src/components/transactions/importar`. Esperado: FALHA.
- [x] **Step 3: Implementar** como na Spec. No ramo do telefone, a faixa e o status ficam num fragmento.
- [x] **Step 4: Rodar** `npx vitest run src/components/transactions/importar`, `npx tsc --noEmit`, `npx eslint src/components/transactions/importar` e `npm run ds:audit -- src/components/transactions/importar`. Esperado: PASSA.
- [x] **Step 5: Commit** com `feat(importar): no telefone, o Total fica à vista e os sem categoria viram uma faixa com Revisar`.
