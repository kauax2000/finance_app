# Conferência mostra tudo no telefone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No telefone, a conferência do Importar (passo 2) mostra todos os lançamentos da aba na lista do resumo, de uma vez, e o "Ver todos" / "Ver menos" saem.

**Architecture:** Tudo em `src/components/transactions/importar/conferir-importacao.tsx`. O teto `LIMITE` (6) e o par Ver todos / Ver menos passam a valer só fora do telefone (`celular`, de `useIsMobile()`, já no arquivo). No telefone a lista do resumo (`ItemGroup` de `Linha`) recebe `daTabela` inteiro, e a vista cheia (`DataTable`) nunca aparece. O desktop não muda.

**Tech Stack:** React, Tailwind v4, vitest (testes de fonte com `lerFonte`/`semComentarios`).

**Spec:** pedido do dono, 16/11/2026: "Não muda nada do design mostrar todos ou mostrar só um pedaço. Então no caso do mobile já mostre todos os lançamentos de uma vez só e remova o botão ver mais e ver menos."

## Global Constraints

- Só no telefone (`celular`). Desktop idêntico: `LIMITE`, "Mostrando 6 de N ·", Ver todos, Ver menos e a tela cheia continuam.
- Nada em `src/components/ui/`. Sem prettier. Nunca `git add graphify-out/graph.json` nem `CLAUDE.md`. Sem push. Commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Comentários em português.
- **Não abrir o Importar no app real além do passo 1** (o banco é de produção; "Importar N lançamentos" grava).

## Review Focus

- **`imp.expandido` já `true` ao virar telefone** (janela redimensionada): no telefone a lista do resumo aparece com tudo, nunca a tela cheia; o efeito devolve `imp.setExpandido(false)`.
- **Chaves das linhas:** `chavesCompacto` cobre exatamente as linhas mostradas (todas no telefone), senão o React reclama de chave ou repete.
- **Busca no telefone:** continua filtrando a lista (o `daTabela` já vem filtrado).
- **Aba trocada:** a escada (`ESCADA`) continua; com dezenas de linhas, o teto da escada do `movimento.ts` segura o atraso.
- **Código morto do telefone:** a linha `{celular && podeExpandir ? … botaoRecolher …}` sai; o `botaoRecolher` fica só no desktop.

---

### Task 1: No telefone, a lista mostra tudo, sem Ver todos / Ver menos

**Files:**
- Modify: `src/components/transactions/importar/conferir-importacao.tsx` (~667–760, ~961–1040)
- Test: `src/components/transactions/importar/importar-extrato-dialog.test.ts`

- [ ] **Step 1: Teste de fonte que falha** (`semComentarios` do `conferir`), num `describe("no telefone a conferência mostra tudo")`:
  - contém `const teto = celular ? undefined : LIMITE`;
  - contém `const podeExpandir = !celular && resumo.total > LIMITE`;
  - contém `daTabela.slice(0, teto).map((i, n) => (` e `chavesDasLinhas(daTabela.slice(0, teto))`;
  - não contém `celular && podeExpandir`;
  - a vista cheia só fora do telefone: contém `{imp.expandido && !celular ? (` antes de `<DataTable` (o ramo que hoje é `{imp.expandido ? (`);
  - um efeito devolve o expandido no telefone: casa `/if \(celular && imp\.expandido\) imp\.setExpandido\(false\)/`.
  - Ajuste as asserções antigas que este pedido troca (`.slice(0, LIMITE).map`, a da linha 497 do Ver menos no pé da tabela) para a forma nova; não apague as do desktop.
- [ ] **Step 2: Rodar** `npx vitest run src/components/transactions/importar`. Esperado: FALHA nas asserções novas.
- [ ] **Step 3: Implementar** em `conferir-importacao.tsx`:
  - `teto` e `podeExpandir` como acima; `grande` vira `teto !== undefined && daTabela.length > teto` (o "Mostrando" some sozinho no telefone);
  - a lista usa `slice(0, teto)` e as chaves também;
  - o ramo da tabela cheia vira `imp.expandido && !celular`; tire dele o pé `{celular && podeExpandir ? …}`;
  - `React.useEffect(() => { if (celular && imp.expandido) imp.setExpandido(false) }, [celular, imp.expandido])` (ajuste a forma ao que o arquivo usa);
  - o comentário "O compacto tem teto…" passa a dizer que o teto é só do desktop.
  - Confira em `importar-extrato-dialog.tsx` se algo do telefone depende de `imp.expandido` (o ⋯, a busca); se só existir para o Ver todos do telefone, remova; se não, não mexa.
- [ ] **Step 4: Rodar** `npx vitest run src/components/transactions/importar`, `npx tsc --noEmit` e `npx eslint src/components/transactions/importar`. Esperado: PASSA.
- [ ] **Step 5: Commit** com `feat(importar): no telefone a conferência mostra todos os lançamentos, sem Ver todos e Ver menos`.
