# Passo Colunas refinado — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** o passo Colunas do Importar extrato ganha o "Refinamento 2" escolhido pelo dono: mesma estrutura de hoje, com acabamento, o efeito do sinal visível na tabela e a linha de cabeçalho marcada.

**Architecture:** a mudança mora toda em `MapearColunas` (`src/components/transactions/importar/mapear-colunas.tsx`). A tabela continua com o `Select` no topo de cada coluna; o valor se pinta pela resposta do sinal (lido com `lerValorBr`); a linha de cabeçalho ganha fundo; o interruptor e o sinal saem para um cartão de duas linhas separadas por fio, e o sinal troca o `FormRadioGroup chip` pelo trilho de abas (`Tabs` sem `TabsContent`, como o `TransactionTypeSegment`).

**Tech Stack:** React 19, Tailwind v4, design system do projeto, Vitest (testes de fonte).

**Spec:** escolha do dono (09/11/2026) na página https://claude.ai/artifact/TFS4T8JbExDoEBohupvm93, seção "2 · Acabamento, com o cabeçalho destacado na tabela".

## Global Constraints

- Não tocar `src/components/ui/`, `src/app/globals.css`, `CLAUDE.md` nem `graphify-out/`. Só tokens (nada de `#hex`, `bg-white`, `p-[13px]`).
- Dinheiro de entrada/saída usa `text-income` / `text-expense` (invariante 3: não `success`/`destructive`).
- Sem prettier. Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sem push.
- O banco do dev é produção: no navegador, nunca clicar em Importar.
- Verificação: `npx tsc --noEmit`, `npx eslint src/components/transactions/importar`, `npx vitest run src/components/transactions/importar`, `npm run ds:audit -- src/components/transactions/importar/mapear-colunas.tsx`.

## Review Focus

1. Valor que não se lê (`lerValorBr` devolve `null`, texto, vazio): fica `text-muted-foreground`, sem cor de dinheiro.
2. Valor zero: sem cor.
3. Nenhuma coluna como Valor (`valor.valor === -1`): nenhuma célula pintada, nada quebra.
4. `temCabecalho` desligado: a 1ª linha do arquivo volta a ser dado comum, sem fundo, e entra entre as linhas de dados.
5. `disabled`: o trilho de abas do sinal também trava.

---

### Task 1: Refinamento 2 no `MapearColunas`

**Files:**
- Modify: `src/components/transactions/importar/mapear-colunas.tsx`
- Test: `src/components/transactions/importar/importar-extrato-dialog.test.ts` (a linha que exige `"Neste arquivo, −12,34 é:"`, perto da 208, e um teste novo no mesmo `describe`)

**Interfaces:** a assinatura de `MapearColunas` e `comPapel` não muda.

- [ ] **Step 1: testes de fonte que falham** (lendo `mapear-colunas.tsx` como o arquivo já faz com `ler(...)`):
  - não contém `"Neste arquivo, −12,34 é:"` nem `FormRadioGroup`;
  - contém `"Valor negativo é"`, `TabsTrigger value="gasto"` com `Gasto` e `TabsTrigger value="entrada"` com `Entrada`;
  - contém `lerValorBr` e `text-expense` e `text-income`;
  - contém `"A linha com fundo não entra como lançamento."`;
  - o `SelectTrigger` tem `w-full`.
- [ ] **Step 2:** `npx vitest run src/components/transactions/importar/importar-extrato-dialog.test.ts` → FAIL.
- [ ] **Step 3: implementar.**
  - `SelectTrigger` com `className="w-full"`.
  - Coluna do Valor (`i === valor.valor`): `TableHead`/`TableCell` alinhados à direita com `.nums`. Nas linhas de dados, a cor sai de uma função local `tomDoValor(texto: string, negativoEhDespesa: boolean): "expense" | "income" | null` — `lerValorBr(texto)`; `null` ou `0` → `null`; `< 0` → `negativoEhDespesa ? "expense" : "income"`; `> 0` → o oposto. `expense` → `text-expense`, `income` → `text-income`, `null` → `text-muted-foreground` (como hoje).
  - Linha de cabeçalho do arquivo (`temCabecalho`): continua `font-medium`, ganha `bg-muted/50` na `TableRow`.
  - Abaixo da tabela, um `Card variant="muted" padding="none"` com um `ItemGroup variant="divided"` de duas linhas (`Item` sem `interactive`, `size="sm"`):
    1. `FormSwitch label="1ª linha é cabeçalho"` com `description`: ligado → `"A linha com fundo não entra como lançamento."`; desligado → `"Ligue se a 1ª linha tiver os nomes das colunas."`.
    2. Rótulo `"Valor negativo é"` à esquerda e, à direita, `Tabs value={negativoEhDespesa ? "gasto" : "entrada"} onValueChange=…` com `TabsList aria-label="Valor negativo é"` e os dois `TabsTrigger` (`Gasto`, `Entrada`), `disabled` repassado aos gatilhos. Sem `TabsContent`. Versão padrão do `Tabs` (sem `variant`/`size`).
  - Se `Card muted` + `ItemGroup divided` não montar as duas linhas com o fio do mockup, use o que o `npm run ds:catalog` oferecer de mais próximo e diga no relatório; nunca markup solto com classes de cartão à mão.
- [ ] **Step 4:** a Verificação das Global Constraints passa (o `ds:audit` sem violação nova no arquivo).
- [ ] **Step 5:** commit `feat(importar): o passo Colunas mostra o efeito do sinal e marca a linha de cabeçalho`.

### Task 2: Conferir no navegador (controlador)

- [ ] `http://localhost:3000/transactions` → Importar extrato com `teste-importacao.csv`, Ajustar na conferência para chegar ao passo Colunas (só ler; **nunca clicar Importar**): trocar Gasto/Entrada pinta os valores ao contrário; desligar o cabeçalho tira o fundo e a frase troca; print para o dono.
