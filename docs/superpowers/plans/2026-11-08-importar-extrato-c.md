# Importar extrato, versão C — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** importar extrato em dois passos (Arquivo → Conferir), com colunas deduzidas, "já existe", categoria por linha, seleção, e a lista compacta que expande o diálogo para a tela cheia.

**Architecture:** a dedução do CSV e a busca de "já existe" são funções de `src/lib/import/` (puras ou com o `db` injetado, testadas); o hook `use-importar-extrato.ts` ganha o estado da conferência (marcadas, categoria por item, filtro, expandido) e grava só o escolhido; o diálogo é recomposto com peças do sistema.

**Tech Stack:** Next 16, React 19, TypeScript, Supabase, TanStack Table (`DataTable`), Vitest.

**Spec:** `docs/superpowers/specs/2026-11-08-importar-extrato-c-design.md`

## Global Constraints

- Leia o `AGENTS.md` da raiz antes (Dialog, Card, Select, Combobox, DataTable, ToggleGroup, Badge, Item, MoneyDisplay, EmptyState, Forms/Enter, "Funcionalidade nova", Jornadas).
- Tudo é componente do sistema; **nenhum componente novo nem mudança em `src/components/ui/`** — se uma peça faltar, pare e reporte `NEEDS_CONTEXT` (o controlador pergunta ao dono).
- Gravar continua igual: `needs_review`, `client_id` gerado uma vez por item (repetir não duplica), `import_batch_id`, desfazer. `gravarLote` recebe só os itens marcados, com a categoria escolhida.
- Banco de dev é produção: nos testes, `supabase` sempre mockado; no navegador, só abrir o diálogo e ler — **nunca clicar Importar** (o controlador faz isso com o dono, usando `teste-importacao.csv`).
- Não rode prettier. `npx vitest run <arquivos>`, `npx tsc --noEmit`, `npx eslint <arquivos>`, `npm run ds:audit -- <arquivos>`.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sem push. Não toque em `CLAUDE.md` nem `graphify-out/`.
- Exploração: `graphify query "<pergunta>"` antes do primeiro grep/leitura.

## Review Focus

1. CSV de conta com valores positivos para gasto (ex.: planilha pessoal): a dedução do sinal segue o arquivo, e a linha de confirmação diz isso. → Task 1.
2. Duas compras iguais no mesmo dia e valor, uma já no app: só uma é marcada "já existe" (casamento 1 para 1). → Task 2.
3. Expandir com linhas marcadas/categoria trocada, filtrar, recolher: nada se perde. → Task 4.
4. Desmarcar tudo: botão desabilitado; Importar 1 de 48 grava só aquele. → Task 3.
5. Arquivo sem data reconhecível: o passo Colunas aparece; com ela, nunca. → Task 1/3.

---

### Task 1: Dedução do CSV (`lib/import`)

**Files:** Modify `src/lib/import/csv.ts`; Test `src/lib/import/leitores.test.ts` (ou `csv.test.ts` novo).

**Interfaces — Produces:**
```ts
export type Deducao = {
  mapa: { data: number; descricao: number; valor: number; categoria: number | null }
  temCabecalho: boolean
  negativoEhDespesa: boolean
  certa: boolean // false quando data ou valor não foram achados: o passo Colunas aparece
}
export function deduzirMapeamento(linhas: string[][], destino: "cartao" | "conta"): Deducao
```
- [ ] Testes (o `teste-importacao.csv` do repo é um caso): cabeçalho `Data;Descrição;Valor` → mapa 0/1/2, cabeçalho true, conta → negativo é despesa, certa; cabeçalho em inglês `Date,Description,Amount`; sem cabeçalho (1ª linha já é dado) → acha pelas colunas; colunas em outra ordem (`Valor;Data;Histórico`); coluna `Categoria` → categoria; cartão com valores positivos → negativo não é despesa; conta com >80% positivos → segue o arquivo; nenhuma coluna de data → `certa: false`.
- [ ] RED → implemente (reuse `lerData`, `lerValorBr`, `normalizarDescricao` para tirar acento/caixa) → GREEN → `tsc`, `eslint`.
- [ ] Commit `feat(importar): deduz colunas, cabeçalho e sinal do CSV`.

### Task 2: "Já existe" (`lib/import`)

**Files:** Modify `src/lib/import/importar.ts`; Test `src/lib/import/importar.test.ts`.

**Interfaces — Produces:**
```ts
export type Existente = { id: string; description: string; date: string }
export async function buscarJaExistentes(
  db: SupabaseClient, workspaceId: string, destino: DestinoImportacao, itens: ItemImportavel[],
): Promise<Map<string /* clientId */, Existente>>
```
- [ ] Testes com o `db` mockado: consulta só `id, description, date, amount, payment_method, payment_credit_card_id` da carteira, entre a menor e a maior data do lote, do mesmo destino; casa por data (dia local) + valor; **1 para 1** (dois itens iguais e um existente → só um casa); sem lote → mapa vazio sem consulta; erro da consulta → mapa vazio (não bloqueia a importação).
- [ ] RED → implemente → GREEN → `tsc`, `eslint`.
- [ ] Commit `feat(importar): acha os lançamentos que já existem na carteira`.

### Task 3: O hook da conferência

**Files:** Modify `src/components/transactions/importar/use-importar-extrato.ts`; Test `use-importar-extrato.test.ts`.

**Interfaces — Consumes:** `deduzirMapeamento`, `buscarJaExistentes`. **Produces** (no retorno do hook, além do que já existe):
```ts
passo: "arquivo" | "colunas" | "conferir" | "feito"   // "colunas" só quando a dedução falha ou a pessoa pede Ajustar
deducao: Deducao | null
existentes: Map<string, Existente>
marcadas: Set<string>                    // clientIds; nasce com todos menos os que já existem
setMarcada(id: string, on: boolean): void; marcarVarias(ids: string[], on: boolean): void
categoriaDe(id: string): string | null; setCategoria(ids: string[], categoryId: string | null): void
filtro: "todos" | "saidas" | "entradas" | "existem" | "sem-categoria"; setFiltro(f): void
visiveis: ItemImportavel[]               // o lote filtrado
expandido: boolean; setExpandido(v: boolean): void
resumo: { total: number; entram: number; saidas: number; entradas: number; existem: number; semCategoria: number; periodo: { de: string; ate: string } | null }
ajustarColunas(): void                   // vai a "colunas" mantendo o arquivo
```
- O `modo` sai da interface: OFX → `import_statement`; CSV → `import_sheet` se `mapa.categoria != null`, senão `import_statement`.
- `importar()` grava só `marcadas`, com `categoriaDe` aplicada; o "feito" guarda `{ importados, deFora, semCategoria }`.
- [ ] Testes: arquivo com dedução certa vai de "arquivo" direto a "conferir"; dedução incerta passa por "colunas"; `marcadas` nasce sem os existentes; `setCategoria` em lote; `resumo` (entram, saídas/entradas só das marcadas, semCategoria das marcadas); `importar` envia só as marcadas com a categoria escolhida (mock de `gravarLote`/db); `expandido` e `filtro` não mexem em marcadas nem categorias.
- [ ] RED → implemente → GREEN → `tsc`, `eslint`.
- [ ] Commit `feat(importar): conferência com marcadas, categoria por linha e filtro`.

### Task 4: O diálogo

**Files:** Modify `src/components/transactions/importar/importar-extrato-dialog.tsx`, `mapear-colunas.tsx` (a prévia com o papel no topo de cada coluna e a pergunta do sinal); se o arquivo passar de ~400 linhas, separe a conferência em `conferir-importacao.tsx` na mesma pasta. Tests: um `importar-extrato-dialog.test.ts` de fonte (padrão do repo: `lerFonte`).

**Interfaces — Consumes:** o hook da Task 3.
- [ ] Testes de fonte: sem `Tabs` de Extrato/Planilha; `Card variant="dashed"` com `onDrop`/`onDragOver`; destino num `Select` com `SelectGroup` de cartões e contas; `DialogSteps` com 2 passos (3 só com Colunas); a lista compacta limita 6 linhas e só mostra "Ver os N"/⤢ com mais de 6; `DialogContent size` alterna para `"full"` com `expandido`; no expandido, `DataTable` com `search`, seleção e `selectionSummary`; `Combobox` de categoria por linha; `Badge` "já existe"; botão `Importar ${entram}` desabilitado com 0; "feito" com o primário "Ver os N sem categoria" quando há.
- [ ] Implemente com peças do sistema; Enter envia o passo (regra do `Form`); dinheiro com `MoneyDisplay`/tokens de despesa e receita; telefone pela mesma árvore (`Dialog surface="auto"`), linhas em `Item` (o gêmeo do `DataTable`).
- [ ] `npm run ds:audit -- src/components/transactions/importar`; `tsc`; `eslint`; testes de `src/components/transactions` e `src/lib/import`.
- [ ] Navegador (**só abrir e ler; nunca clicar Importar**): `http://localhost:3000/transactions?importar=1` a 1280 e 375px — arraste/escolha `teste-importacao.csv` (o input aceita o arquivo pelo próprio `<input type=file>`; se não der para soltar no teste, escolha), destino, Continuar, conferência, filtro, ⤢ e ⤡, Voltar. Volte o viewport.
- [ ] Commit `feat(importar): diálogo em dois passos com conferência editável e tela cheia`.

### Task 5: Jornada e Atlas

**Files:** `docs/JORNADAS.md` (a linha "Importar extrato ou planilha" e o fluxograma `importDlg`/`importPreview`), `docs/atlas/template.html`, `docs/atlas/atlas-jornadas.html` (gerado).
- [ ] Atualize o fluxograma (Arquivo → [Colunas só se a dedução falhar] → Conferir → Feito; "já existe" desmarcado; só as marcadas gravam; "Ver os N sem categoria") e a tabela; `python3 docs/atlas/build.py`.
- [ ] Commit `docs(jornadas): importar extrato em dois passos`. A republicação do Atlas é do controlador.
