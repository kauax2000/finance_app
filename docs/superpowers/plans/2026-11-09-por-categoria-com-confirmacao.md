# Pôr categoria com confirmação — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** o diálogo "Pôr categoria" da conferência do Importar extrato vira a opção D escolhida pelo dono: lista de categorias no próprio diálogo (com a cor e o ícone, como o seletor do formulário de lançamento), tocar só marca, e o botão do rodapé diz e aplica o efeito.

**Architecture:** tudo em `PorCategoria` (`src/components/transactions/importar/conferir-importacao.tsx`), mais a leitura das categorias (`use-importar-extrato.ts`), que passa a trazer `color` e `icon`. A lista é a mesma peça visual do formulário (`ColorTile` + `CategoryIconPreview`), com `SearchInput` em cima; o rodapé tem `Cancelar` (`DialogClose` + `Button tertiary`) e a ação primária.

**Tech Stack:** React 19, Tailwind v4, design system do projeto, Vitest (testes de fonte e de unidade).

**Spec:** escolha do dono (09/11/2026), seção "D · Lista no diálogo, com confirmação" de https://claude.ai/artifact/FoLtDKFainRJ5pZMop33Cn.

## Global Constraints

- Não tocar `src/components/ui/`, `src/app/globals.css`, `CLAUDE.md`, `graphify-out/`. Só tokens. Ícones Heroicons pela régua do tamanho.
- Sem prettier. Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sem push.
- O banco do dev é produção: no navegador, nunca clicar em Importar.
- Verificação: `npx tsc --noEmit`, `npx eslint src/components/transactions/importar`, `npx vitest run src/components/transactions/importar`, `npm run ds:audit -- src/components/transactions/importar/conferir-importacao.tsx`.

## Comportamento (da opção D)

- Cabeçalho: título "Pôr categoria"; descrição "Vale para as linhas à vista." (uma linha: `Vale para {descricao}.`).
- Logo abaixo, três `Badge` neutros (`variant="soft"`, sem `tone`), na ordem: "{n} saídas", "{n} entradas", "{n} com categoria" — contados nos `itens` do diálogo (`tipoDoItem(i, destino)`; "com categoria" = `imp.categoriaDe(i.clientId) != null`). Um badge com 0 saídas ou 0 entradas não aparece; "com categoria" aparece sempre (é o que vai ser trocado).
- `SearchInput` "Buscar categoria" (filtro sem acento, por substring: use `commandFilter`/a busca do projeto se encaixar; senão `normalize("NFD")` + `includes`).
- Lista rolável no corpo (o `DialogBody` já rola e dissolve): "Sem categoria" primeiro, depois um fio, depois grupos "Despesas"/"Receitas" com título só quando os dois tipos estão à vista (como hoje: `tipos`, `misturadas`). Cada linha: `ColorTile size="xs"` com `CategoryIconPreview` + nome; a marcada fica `selected` com ✓. Lista vazia na busca: "Nenhuma categoria com esse nome.".
- Tocar numa linha só marca (estado local `escolhida: string | null`, começa `null`).
- Rodapé: `Cancelar` e a primária desabilitada até marcar. Rótulo da primária:
  - categoria: `Pôr ${nome} em ${n}`, com `n = idsParaCategoria(itens, tipo, destino).length`;
  - "Sem categoria": `Tirar a categoria de ${n}` (n = todos os itens).
  Clicar aplica (`imp.setCategoria(ids, valor)`, como o `escolher` de hoje) e fecha.
- O Enter: a primária é `type="submit"` de um `Form` próprio do diálogo (o diálogo é portalizado, fora do `<form>` do Importar no DOM; confira que não envia o Importar). Se o `Form` aninhado em React causar problema, use `Button type="button"` e explique no relatório.

## Review Focus

1. Só despesas à vista: sem títulos de grupo, sem o badge de entradas.
2. Categoria de receita escolhida com despesas e receitas à vista: o número do botão conta só as receitas.
3. Busca que não acha nada: a mensagem aparece e a primária continua com a escolha anterior (ou desabilitada se não havia).
4. Fechar e reabrir: a escolha volta a `null`.
5. Categoria sem `color`/`icon` (nulos no banco): o ladrilho cai no padrão do `ColorTile`/`normalizeCategoryIcon`, sem quebrar.

---

### Task 1: Diálogo Pôr categoria na forma D

**Files:**
- Modify: `src/components/transactions/importar/use-importar-extrato.ts` (o `select("id,name,type")` das categorias → `"id,name,type,color,icon"`; o tipo `Categoria` ganha `color: string | null; icon: string | null`; ajuste fixtures de teste que montam `Categoria`)
- Modify: `src/components/transactions/importar/conferir-importacao.tsx` (`PorCategoria`)
- Test: `src/components/transactions/importar/importar-extrato-dialog.test.ts` (as asserções do `PorCategoria`, perto das que citam `idsParaCategoria(itens, tipo, destino)`) e `use-importar-extrato.test.ts` se tocar no select.

- [x] **Step 1: testes de fonte que falham** (`conferir` = fonte de `conferir-importacao.tsx`): contém `"Vale para as linhas à vista."`, `` `Pôr ${`` , `"Tirar a categoria de"`, `ColorTile`, `CategoryIconPreview`, `SearchInput`, `"com categoria"`; não contém `ComboboxTrigger placeholder="Escolha uma categoria"`. E na fonte do hook: `"id,name,type,color,icon"`.
- [x] **Step 2:** `npx vitest run src/components/transactions/importar` → FAIL.
- [x] **Step 3:** implementar o "Comportamento" acima. Reaproveite as peças do formulário (veja `CategoryPickerList` em `src/components/transactions/transaction-form-fields.tsx`: `ColorTile`, `CategoryIconPreview`, `normalizeCategoryIcon`, `FormPickerPopoverItem`). Se `FormPickerPopoverItem` só funcionar dentro do popover, use `Item` (`size="sm"`, `selected`, `asChild` num `<button type="button">`) — nada de linha desenhada à mão.
- [x] **Step 4:** a Verificação das Global Constraints passa.
- [x] **Step 5:** commit `feat(importar): Pôr categoria com a lista no diálogo e o efeito no botão`.

### Task 2: Conferir no navegador (controlador)

- [x] Na conferência (só ler; **nunca clicar Importar**): abrir Ações → Pôr categoria; a lista mostra cor e ícone; marcar uma categoria muda o botão; Cancelar não aplica; print para o dono.
