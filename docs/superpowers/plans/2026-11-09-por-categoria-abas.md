# Pôr categoria com abas — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** o diálogo "Pôr categoria" da conferência do Importar fica baixo (a lista rola no meio), separa Despesas e Receitas em abas e deixa escolher uma categoria de cada tipo de uma vez.

**Architecture:** só `PorCategoria` em `src/components/transactions/importar/conferir-importacao.tsx` (a versão de hoje: lista no diálogo, tocar marca, botão diz o efeito, `Form` próprio com `stopPropagation`). O estado `escolhida: string | null` vira uma escolha por tipo; a lista ganha um `Tabs` de escolha (sem `TabsContent`, como o `TransactionTypeSegment`); a altura do diálogo fica fixa e baixa.

**Tech Stack:** React 19, Tailwind v4, design system do projeto, Vitest (testes de fonte).

**Spec:** pedido do dono (09/11/2026): "deixar o dialog bem menor, menos alto, com o scroll no meio; Tabs para selecionar despesa ou receita; selecionar as categorias das despesas ou da receita separando as duas". Leitura confirmada sem objeção: abaixo, "Comportamento".

## Global Constraints

- Não tocar `src/components/ui/`, `src/app/globals.css`, `CLAUDE.md`, `graphify-out/`. Só tokens.
- Sem prettier. Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sem push.
- Verificação: `npx tsc --noEmit`, `npx eslint src/components/transactions/importar`, `npx vitest run src/components/transactions/importar`, `npm run ds:audit -- src/components/transactions/importar/conferir-importacao.tsx`.

## Comportamento

- **Altura:** `DialogContent size="sm" layout="fixed"` com altura fixa de `min(85dvh, 30rem)` (o diálogo tem essa altura mesmo com poucas categorias, e não pula ao trocar de aba). Título, descrição, badges, busca e abas ficam parados; só a lista (`DialogBody`) rola; rodapé parado. Prefira declarar pela variável que o `Dialog` já lê (`--dialog-max-h`, veja `dialog.tsx`: o `has-[[data-slot=dialog-steps]]` faz o mesmo) + `h-(--dialog-max-h)`; se o `ds:audit` reprovar o valor arbitrário, diga no relatório e use o que ele aceitar.
- **Abas:** abaixo da busca, `Tabs` padrão (sem `variant`/`size`), `TabsList` com `aria-label="Tipo da categoria"` e `stretch` se existir, gatilhos "Despesas" e "Receitas". Só aparecem quando os dois tipos estão à vista (`misturadas`); com um tipo só, a lista é desse tipo, sem abas. Aba inicial: `tipos[0]` (despesas quando há). Os títulos de grupo "Despesas"/"Receitas" dentro da lista saem.
- **Escolha por tipo:** estado `escolhas: { expense: string | null; income: string | null }` (cada valor: id de categoria, `SEM`, ou `null`). Tocar numa linha marca na aba aberta; tocar de novo na marcada desmarca. Trocar de aba não perde a escolha da outra. A aba com escolha mostra um `BadgeDot` (ou o ponto que o `TabsTrigger` aceitar, via `count`/peça própria — sem desenhar à mão).
- **"Sem categoria"** continua no topo da lista, com o fio embaixo, e vale **só para o tipo da aba aberta** (`idsParaCategoria(itens, tipo, destino)` com o tipo da aba, valor `null`).
- **Busca:** filtra só a aba aberta; vazia mostra "Nenhuma categoria com esse nome.". Trocar de aba não limpa a busca.
- **Rodapé:** primária desabilitada sem nenhuma escolha. Rótulo: cada escolha vira uma frase — categoria: `Pôr ${nome} em ${n}`; sem categoria: `Tirar a categoria de ${n}` — e as duas se juntam com " e " (a segunda começa minúscula: "Pôr Mercado em 5 e pôr Salário em 1", "Pôr Mercado em 5 e tirar a categoria de 1"). `n` = `idsParaCategoria(itens, tipo, destino).length`. Aplicar faz um `imp.setCategoria` por escolha e fecha; fechar zera escolhas, busca e aba.
- Os badges de contagem (saídas, entradas, com categoria) ficam como estão.

## Review Focus

1. Só despesas à vista: sem abas, uma escolha só, rótulo como hoje.
2. Duas escolhas: as duas aplicadas, cada uma só no seu tipo.
3. Desmarcar tocando de novo: o rótulo volta e a primária desabilita se não sobrou escolha.
4. Busca sem resultado numa aba e escolha marcada na outra: a primária continua valendo.
5. Fechar e reabrir: nada marcado, aba inicial, busca vazia.

---

### Task 1: abas, escolha por tipo e altura fixa

**Files:**
- Modify: `src/components/transactions/importar/conferir-importacao.tsx` (`PorCategoria`)
- Test: `src/components/transactions/importar/importar-extrato-dialog.test.ts`

- [x] **Step 1: testes de fonte que falham** (fonte de `conferir-importacao.tsx`): contém `TabsTrigger value="expense"` com `Despesas`, `TabsTrigger value="income"` com `Receitas`, `aria-label="Tipo da categoria"`, `" e "` na montagem do rótulo, `escolhas`; e a lista não tem mais `<Caption className="px-1">{t === "expense" ? "Despesas" : "Receitas"}</Caption>`. Se a frase "Tirar a categoria de" e `` `Pôr ${`` já têm asserção, mantenha.
- [x] **Step 2:** `npx vitest run src/components/transactions/importar` → FAIL.
- [x] **Step 3:** implementar o "Comportamento". Extraia a montagem do rótulo para uma função pura exportada `rotuloDePorCategoria(partes: { nome: string | null; n: number }[]): string` (nome `null` = sem categoria) e teste-a em `importar-extrato-dialog.test.ts` com: `[{nome:"Mercado",n:5}]` → `"Pôr Mercado em 5"`; `[{nome:null,n:3}]` → `"Tirar a categoria de 3"`; `[{nome:"Mercado",n:5},{nome:"Salário",n:1}]` → `"Pôr Mercado em 5 e pôr Salário em 1"`; `[{nome:"Mercado",n:5},{nome:null,n:1}]` → `"Pôr Mercado em 5 e tirar a categoria de 1"`; `[]` → `"Pôr categoria"`. Números com `numberBR`.
- [x] **Step 4:** a Verificação passa.
- [x] **Step 5:** commit `feat(importar): Pôr categoria em abas, uma escolha por tipo, e mais baixo`.

### Task 2: Conferir no navegador (controlador)

- [x] Conferência com CSV de teste na conta Pix (só ler; **nunca clicar Importar**): diálogo baixo com a lista rolando; abas; marcar uma despesa e uma receita muda o rótulo; Cancelar não aplica; print.
