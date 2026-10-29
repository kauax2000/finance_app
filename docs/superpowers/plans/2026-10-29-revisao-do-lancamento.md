# Revisão do lançamento inteligente — redesenho — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Melhorar o layout, o design e a usabilidade do painel de revisão do lançamento inteligente, com alvos de toque de 44 no telefone.

**Architecture:** Tudo dentro do componente `Revisao` de `src/components/transactions/lancamento-inteligente.tsx` (linhas ~899–1415). Nenhuma peça nova em `src/components/ui/` nem token em `globals.css`: só composição de peças existentes (`Tabs`, `Item`, `ColorTile`, `Select`, `Combobox`, `DatePicker`, `Caption`). O gesto de abertura (o vidro, `data-revela`, a cascata) não muda.

**Tech Stack:** Next 16, React 19, design system de `src/components/ui/`, Vitest com testes de fonte (`lerFonte`/`semComentarios` de `@/test/fonte`).

**Spec:** este documento. O dono pediu "melhora o design … touch points no mobile" e pulou as perguntas; as decisões abaixo são do executor (Claude) e estão marcadas como tal.

## O que muda (decisões do executor)

Problemas vistos no iPhone (440pt) na versão atual:

1. **O tipo é uma pílula `Badge` de ~24pt** (alvo abaixo de 44) e trocar o tipo pede dois toques (pílula → `Select` → item).
2. **A linha Categoria desalinha**: com categoria escolhida a mídia vira `ColorTile size="xs"` (24, quadrado) no lugar do ladrilho redondo de 28 das outras linhas, e o rótulo "Categoria" fica 4px à esquerda dos vizinhos.
3. **A legenda sob o valor repete as linhas** ("Uber · Bradesco Visa Infinity" = Descrição + Forma).
4. **Valor longo empurra o rótulo** ("Bradesco Visa Infinity" + selo + chevron) sem truncar.
5. **Editar uma escolha custa dois passos**: tocar a linha abre um campo com "ok", e só então o seletor.

O desenho novo:

- **Tipo = trilho segmentado `Tabs`** (sem `TabsContent`, como o `TransactionTypeSegment`), `stretch`, no topo, à esquerda do ×. As abas são `tipos` (o convidado já perde Receita e Estorno), **menos Estorno, que só aparece quando o tipo lido é `estorno`**. Trocar a aba chama `leitura.editar("tipo", edicaoDoTipo(campos, v, categories))`. O tipo deixa de ter estado de edição (`editando === "tipo"` some).
- **Abaixo do trilho, uma `Caption`** com o motivo quando houver (`por causa de “${campos.motivoDoTipo}”`) e o selo IA (`Badge size="xs" tone="info"`) quando `leuComIA`. Sem motivo e sem IA, nada.
- **Valor**: o botão do valor ocupa a largura (`w-full`, `min-h-11`), `MoneyDisplay` como hoje. **Legenda só na parcelada** (`12× de R$ X no <cartão>`); nos outros tipos, nenhuma.
- **Linhas**: a mídia é sempre o ladrilho do campo (`ItemMedia variant="tile"`), também na Categoria. Com categoria escolhida, o `ColorTile size="xs"` vai **antes do nome, no lado do valor**. O texto do valor trunca (`min-w-0 truncate`, a coluna do valor com `max-w-[60%]`), o rótulo não encolhe (`shrink-0`). Linhas continuam `min-h-12.5` (50 ≥ 44).
- **Escolhas abrem direto**: tocar Categoria, Forma, Data ou Parcelas monta o editor **já aberto** (`Combobox defaultOpen`, `Select defaultOpen`, e no `DatePicker` o equivalente que ele expuser — ver Task 3) e **escolher fecha a edição** (chama `fechar()`); fechar o seletor sem escolher também volta à linha. Sem botão "ok" nesses quatro. Descrição e Valor (texto) mantêm o campo com "ok" e o Enter que confirma.
- Rodapé, ×, `ImpactoDaParcela`, miniatura do recibo, `motivo` do Aprovar: sem mudança.

## Global Constraints

- Nada em `src/components/ui/`, `src/app/globals.css` nem `src/app/designsystem/` (exigem autorização do dono).
- Tokens apenas; ícones Heroicons pela régua de tamanho; todo `<button>` cru com `type`.
- `data-revela` continua em cada peça que chega na cascata (o trilho do tipo, o valor, a lista, o rodapé).
- Banco de produção no dev: nenhum lançamento é aprovado em teste manual.
- Verificação de cada task: `npx tsc --noEmit && npm run lint && npx vitest run src/components/transactions src/lib/lancamento-gesto.test.ts` e `npm run ds:audit -- src/components/transactions/lancamento-inteligente.tsx` sem violação nova.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; nunca adicionar `CLAUDE.md` nem `.superpowers/`. Depois do commit de código, `graphify update .` e commit separado `chore(graph): …` só com `graphify-out/graph.json`.

## Review Focus

1. Convidado (`papel === "guest"`): o trilho mostra só Despesa e Parcelada; nenhuma aba Receita aparece.
2. Leitura que vem como `estorno`: a aba Estorno aparece e está ativa; trocar para Despesa a faz sumir.
3. Abrir um seletor e fechá-lo sem escolher (Esc, toque fora): a linha volta, com o foco nela, e nenhum valor muda.
4. Nome de cartão ou categoria longo: o rótulo da linha continua inteiro e o valor trunca com reticências.
5. Painel desatualizado (frase mudou depois do Enter, `opacity-60`): o trilho continua clicável e a troca edita a leitura atual.

---

### Task 1: O tipo vira trilho segmentado

**Files:**
- Modify: `src/components/transactions/lancamento-inteligente.tsx` (o bloco `editando === "tipo"` / pílula, ~L1308–1333; o `case "tipo"` do `editor`; `TODOS_OS_CAMPOS` e o piscar de linha seguem valendo para `tipo` pelo id `lancamento-tipo`)
- Test: `src/components/transactions/lancamento-inteligente.test.ts`

**Interfaces:**
- Consumes: `tipos`, `tipo`, `edicaoDoTipo`, `leitura.editar`, `campos.motivoDoTipo`, `leuComIA` (já no componente).
- Produces: o `TabsList` com `id="lancamento-tipo"` (o piscar de leitura nova procura esse id).

- [ ] **Step 1: Teste de fonte que falha** — novo `it("o tipo é um trilho de abas, e o motivo é uma legenda", …)`:
  - `expect(fonte).toMatch(/<Tabs[\s\S]{0,200}value=\{tipo\}/)`
  - `expect(fonte).toContain('id="lancamento-tipo"')` e `expect(fonte).toMatch(/<TabsList[^>]*id="lancamento-tipo"/)`
  - `expect(fonte).not.toContain('emEdicao("tipo"')` e `expect(fonte).not.toContain('case "tipo":')` dentro do `editor` (basta `not.toMatch(/case "tipo":\s*return \(\s*<Select/)`)
  - `expect(fonte).toContain("por causa de “")` dentro de uma `<Caption` (`toMatch(/<Caption[\s\S]{0,200}por causa de/)`)
  - `expect(fonte).toMatch(/t\.tipo !== "estorno" \|\| tipo === "estorno"/)` (a regra da aba Estorno)
- [ ] **Step 2:** `npx vitest run src/components/transactions/lancamento-inteligente.test.ts` → FAIL.
- [ ] **Step 3:** Implementar: `Tabs` (de `@/components/ui/tabs`) com `value={tipo}`, `onValueChange` → `leitura.editar("tipo", edicaoDoTipo(campos, v as TipoDoLancamento, categories))`; `TabsList` com `id="lancamento-tipo"`, `aria-label="Tipo do lançamento"`, `stretch` (prop do `Tabs`/`TabsList` conforme a API em `tabs.tsx`); abas = `tipos.filter((t) => t.tipo !== "estorno" || tipo === "estorno")`. A linha do trilho deixa espaço para o × (`pe-10`, como hoje). Abaixo, a `Caption` com motivo e selo IA. Remover o `case "tipo"` do `editor`, a pílula e `TOM_DO_TIPO` se ficar sem uso; tirar `"tipo"` de `TODOS_OS_CAMPOS` só se o piscar quebrar (o id continua existindo no `TabsList`). Ajustar testes antigos que procuram a pílula do tipo.
- [ ] **Step 4:** Verificação da seção Global Constraints → PASS.
- [ ] **Step 5:** Commit `feat(lancamento): o tipo da revisão é um trilho de abas` + commit do grafo.

### Task 2: Linhas alinhadas, valor que trunca, legenda só na parcelada

**Files:**
- Modify: `src/components/transactions/lancamento-inteligente.tsx` (a `legenda`, o bloco do valor ~L1336–1366, o `.map` das linhas ~L1374–1425)
- Test: `src/components/transactions/lancamento-inteligente.test.ts`

**Interfaces:**
- Consumes: nada novo.
- Produces: nada novo.

- [ ] **Step 1: Teste de fonte que falha** — `it("as linhas têm o mesmo ladrilho, e o valor trunca", …)`:
  - `expect(fonte).not.toMatch(/<ItemMedia>\s*<ColorTile/)` (a categoria não troca a mídia)
  - `expect(fonte).toMatch(/<ItemActions[\s\S]{0,400}<ColorTile size="xs"/)` (o ladrilho da categoria vai para o lado do valor)
  - `expect(fonte).toMatch(/truncate/)` no `span` do valor (`toMatch(/"nums[^"]*"|truncate[\s\S]{0,80}valor \?\? "Escolher"/)` — basta que o `span` com `valor ?? "Escolher"` leve `truncate`)
  - `expect(fonte).toMatch(/tipo === "parcelada"[\s\S]{0,200}`\$\{campos\.parcelas\}× de/)` e `expect(fonte).not.toContain('.filter(Boolean).join(" · ")')`
- [ ] **Step 2:** rodar → FAIL.
- [ ] **Step 3:** Implementar: mídia sempre `ItemMedia variant="tile" tone={x.tom} tint="vivid"`; na categoria escolhida, `<ColorTile size="xs" color={categoria.color} />` antes do texto, dentro de `ItemActions`; o `span` do valor com `min-w-0 truncate`; `ItemActions` com `min-w-0 max-w-[60%]`; `ItemTitle` com `shrink-0`. `legenda` = a frase da parcelada ou `null`. O botão do valor com `w-full min-h-11`.
- [ ] **Step 4:** Verificação → PASS; `ds:audit` sem regra nova (o `max-w-[60%]` é valor arbitrário: se a regra de valor arbitrário reprovar, use `max-w-3/5`).
- [ ] **Step 5:** Commit `fix(lancamento): linhas da revisão alinhadas, valor que trunca` + grafo.

### Task 3: As escolhas abrem direto

**Files:**
- Modify: `src/components/transactions/lancamento-inteligente.tsx` (`emEdicao`, `editor` nos casos `categoria`, `forma`, `data`, `parcelas`)
- Test: `src/components/transactions/lancamento-inteligente.test.ts`

**Interfaces:**
- Consumes: `fechar()` (volta à linha com o foco nela), `abrir(campo)`.
- Produces: `const ESCOLHAS: CampoDoLancamento[] = ["categoria", "forma", "data", "parcelas"]` (módulo), usado por `emEdicao` para omitir o "ok".

- [ ] **Step 1: Teste de fonte que falha** — `it("categoria, forma, data e parcelas abrem o seletor direto", …)`:
  - `expect(fonte).toContain('const ESCOLHAS: CampoDoLancamento[] = ["categoria", "forma", "data", "parcelas"]')`
  - `expect(fonte).toMatch(/<Combobox[\s\S]{0,80}defaultOpen/)`
  - contagem: `expect(fonte.match(/<Select[\s\S]{0,60}defaultOpen/g)?.length).toBe(2)` (forma e parcelas)
  - `expect(fonte).toMatch(/onOpenChange=\{\(aberto\) => \{?\s*if \(!aberto\) fechar\(\)/)` em pelo menos um seletor
- [ ] **Step 2:** rodar → FAIL.
- [ ] **Step 3:** Implementar: nos quatro, o seletor monta aberto e `onOpenChange={(aberto) => { if (!aberto) fechar() }}`; a escolha grava (`leitura.editar`) e o fechamento do seletor chama `fechar()`. `emEdicao` não desenha o `Button` "ok" para `ESCOLHAS`. **`DatePicker`**: leia `src/components/ui/date-picker.tsx`; se ele aceitar `open`/`defaultOpen`/`onOpenChange`, use; se não aceitar, a Data fica como hoje (campo + "ok") e o motivo vai num comentário de uma linha — não mude `ui/`. Garanta que o foco volta à linha (`fechar` já faz) e que o efeito que foca o editor (`editorRef`) não rouba o foco do seletor aberto (pule o foco para `ESCOLHAS`).
- [ ] **Step 4:** Verificação → PASS.
- [ ] **Step 5:** Commit `feat(lancamento): as escolhas da revisão abrem o seletor direto` + grafo.
