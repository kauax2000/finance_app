# Conferir leitura (ajustar sem colunas) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No telefone, o ajuste da leitura do CSV do Importar deixa de falar de colunas. A pessoa vê os dois primeiros lançamentos como vão entrar e corrige de onde vem cada informação, escolhendo entre os valores do próprio arquivo.

**Architecture:**
- `MapearColunasEmLista` (em `src/components/transactions/importar/mapear-colunas.tsx`) é reescrita como **`ConferirLeitura`**, com as mesmas props: `{ linhas, valor, onChange, disabled }`. Quem a chama passa a usar o nome novo. Ela só aparece no telefone (`celular`): na subtela e no passo Colunas.
- A prévia sai de `mapearCsv` (`src/lib/import/csv.ts`) com o mapeamento atual. Os dois primeiros `itens` aparecem; `estorno` é entrada.
- Cada pergunta (Data, Descrição, Valor, Categoria) é um `Select`. As opções são os valores da primeira linha de dados do arquivo, uma por coluna, mais "Nenhum destes". Escolher troca o mapeamento por `comPapel`, que já existe.
- O desktop e a tabela `MapearColunas` não mudam.

**Tech Stack:** React, Tailwind v4, vitest (testes de fonte).

**Spec:** aprovado pelo dono em 17/11/2026: a opção A do artefato "Ajustar sem colunas" (https://claude.ai/artifact/MCbTBW1NbEZ6vfEYGQbzKo, versão 2), com a copy da tabela "O que muda nos textos". Copy literal:

| Onde | Texto |
|---|---|
| Item do ⋯ (telefone) e título da subtela | `Conferir leitura` |
| Título da seção da prévia | `É assim que vai entrar?` |
| Título da seção das escolhas | `Algo fora do lugar?` |
| Descrição da seção das escolhas | `Escolha de onde vem cada informação.` |
| Rótulos das perguntas | `Data`, `Descrição`, `Valor`, `Categoria` |
| Rótulo da lista aberta (o nome acessível do seletor) | `Qual destes é a data?`, `Qual destes é a descrição?`, `Qual destes é o valor?`, `Qual destes é a categoria?` |
| Opção de ausência | `Nenhum destes` |
| Sinal | `Gastos aparecem como`, com as duas opções escritas com um valor do próprio arquivo: o primeiro valor não zero da coluna do valor, sem sinal, como `−72,40` e `72,40`. O primeiro é `negativoEhDespesa: true`. |
| Cabeçalho | `Pular a 1ª linha`, com a ajuda `Ela tem os títulos, não um lançamento` (o `temCabecalho`) |
| Botão da subtela | `Está certo` |
| Erro com Data, Descrição ou Valor em "Nenhum destes" | `Escolha a data, a descrição e o valor.` |

## Global Constraints

- **Só peças do design system:**
  - `PageSection size="sm"` + `PageSectionHeader` + `PageSectionTitle` + `PageSectionDescription` para as seções;
  - `Card variant="muted" padding="none"` + `ItemGroup variant="divided"` + `Item` para as listas;
  - `Select` com `SelectItem` (a ausência em `variant="none"`) para as perguntas;
  - `FormSwitch` para pular a linha e `Tabs` para o sinal (como hoje em `AjustesDaLeitura`);
  - `MoneyDisplay signed` para o valor, e os helpers de `src/lib/transaction-date.ts` para a data (escolha o que escreve "1 de outubro").
  - Nada novo em `src/components/ui/`.
- Sem prettier. Comentários em português. Nunca `git add graphify-out/graph.json` nem `CLAUDE.md`. Sem push. Cada commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Depois de cada commit, `graphify update .`.
- Sem navegador no subagente (o banco é de produção). Quem confere a tela é o controlador.
- Mudança de jornada (item do ⋯ e nome da subtela): `docs/JORNADAS.md` e `docs/atlas/template.html` na Task 2. O controlador roda o build e republica o Atlas.

## Review Focus

- **Mapeamento que não lê nada** (Data em "Nenhum destes", ou uma coluna sem data legível): a prévia mostra `Nenhum lançamento legível com estas escolhas.` no lugar dos lançamentos, sem quebrar.
- **Arquivo com uma linha só, ou com o cabeçalho ligado e uma linha:** as opções saem da primeira linha de dados. Se ela não existir, as opções saem da linha 0.
- **Valor da opção vazio** (a célula em branco): a opção mostra `(vazio)`.
- **Coluna sem valor não zero:** o sinal cai em `−10,00` e `10,00` como exemplo.
- **Duas colunas com o mesmo valor de exemplo:** cada opção é a coluna pelo índice (o `value` do `SelectItem` é o índice), e o texto pode repetir.

---

### Task 1: `ConferirLeitura` no lugar de `MapearColunasEmLista`

**Files:**
- Modify: `src/components/transactions/importar/mapear-colunas.tsx` (substitui `MapearColunasEmLista`; `AjustesDaLeitura` dá lugar às duas linhas novas dentro de `ConferirLeitura`; a tabela `MapearColunas` do desktop continua com os textos dela)
- Modify: `src/components/transactions/importar/importar-extrato-dialog.tsx` (o import e o uso: só troca o nome)
- Test: `src/components/transactions/importar/importar-extrato-dialog.test.ts`

**Interfaces:**
- Produces: `export function ConferirLeitura(props: { linhas: string[][]; valor: MapeamentoColunas; onChange: (m: MapeamentoColunas) => void; disabled?: boolean })`.

- [x] **Step 1: Testes de fonte que falham** (`semComentarios` de `mapear-colunas.tsx`), num `describe("Conferir leitura fala dos dados, não das colunas")`:
  - contém `export function ConferirLeitura(`, e não contém `MapearColunasEmLista`;
  - contém cada texto da tabela da Spec que mora no componente: `É assim que vai entrar?`, `Algo fora do lugar?`, `Escolha de onde vem cada informação.`, `Nenhum destes`, `Gastos aparecem como`, `Pular a 1ª linha`, `Ela tem os títulos, não um lançamento`, `Nenhum lançamento legível com estas escolhas.`, e o molde `Qual destes é ` dos rótulos;
  - contém `mapearCsv(` e `.slice(0, 2)`;
  - não contém a palavra `coluna` em texto visível. Teste: nenhuma string entre aspas com `coluna`, com exceção dos nomes acessíveis da tabela do desktop.
  - Ajuste as asserções antigas que citam `MapearColunasEmLista` e `<AjustesDaLeitura ` para a forma nova.
- [x] **Step 2: Rodar** `npx vitest run src/components/transactions/importar`. Esperado: FALHA.
- [x] **Step 3: Implementar** `ConferirLeitura` como na Spec, com os casos do Review Focus.
- [x] **Step 4: Rodar** `npx vitest run src/components/transactions/importar`, `npx tsc --noEmit`, `npx eslint src/components/transactions/importar` e `npm run ds:audit -- src/components/transactions/importar`. Esperado: PASSA.
- [x] **Step 5: Commit** com `feat(importar): no telefone, Conferir leitura mostra como vai entrar e pergunta de onde vem cada informação`.

### Task 2: Os textos de fora do componente e a jornada

**Files:**
- Modify: `src/components/transactions/importar/importar-extrato-dialog.tsx`:
  - o item do ⋯ do telefone `Ajustar colunas` vira `Conferir leitura`;
  - o título `"Ajustar colunas"` da subtela vira `"Conferir leitura"`;
  - o rótulo do `FormSubmit` na subtela, `"Pronto"`, vira `"Está certo"`.
- Modify: `src/components/transactions/importar/use-importar-extrato.ts` (o erro `Escolha a coluna da data, da descrição e do valor.` vira `Escolha a data, a descrição e o valor.`)
- Modify: `docs/JORNADAS.md` (o nó `importAdjust` e a linha do Importar dizem "Conferir leitura") e `docs/atlas/template.html` (a mesma frase)
- Test: `src/components/transactions/importar/importar-extrato-dialog.test.ts`, `use-importar-extrato.test.ts` se ele cita o erro

**Interfaces:**
- Consumes: Task 1 (`ConferirLeitura` já no lugar).

- [x] **Step 1: Testes que falham:**
  - `dialogo` contém `Conferir leitura` (o item e o título) e `subtela ? "Está certo"`;
  - o hook contém `Escolha a data, a descrição e o valor.`;
  - atualize as asserções que citam `"Ajustar colunas"`, `"Pronto"` e o erro antigo.
- [x] **Step 2: Rodar** `npx vitest run src/components/transactions/importar`. Esperado: FALHA.
- [x] **Step 3: Implementar.** Atualize também a jornada nos dois documentos.
- [x] **Step 4: Rodar** `npx vitest run src/components/transactions/importar`, `npx tsc --noEmit` e `npx eslint src/components/transactions/importar`. Esperado: PASSA.
- [x] **Step 5: Commit** com `feat(importar): o ajuste da leitura se chama Conferir leitura, e o botão diz Está certo`.
