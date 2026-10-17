# Busca global do app — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A paleta ⌘K do app acha, direto na raiz, telas, ações, transações (por descrição, valor, data, categoria e cartão), cartões, categorias, compras parceladas, assinaturas, contas, membros e carteiras.

**Architecture:** O parse do termo e o ranqueamento local são funções puras em `src/lib/` (testadas). As transações vêm de uma consulta nova ao Supabase (só leitura, com espera de 250ms, cache do React Query, fora da persistência); o resto vem das consultas que a casca já tem, mais uma consulta leve de contas. A paleta passa a filtrar sozinha (`shouldFilter: false` no cmdk): cada grupo recebe a sua lista já ranqueada e cortada.

**Tech Stack:** Next.js 16, React 19, TanStack Query, Supabase JS, cmdk pelo `Command` do design system, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-16-busca-global-do-app-design.md`

## Global Constraints

- **Nunca gravar no banco**: o banco de desenvolvimento é o de produção. Nenhum `insert`/`update`/`delete`/`rpc` de escrita, nem em teste manual.
- Nada muda em `src/components/ui/`, `src/app/globals.css` nem `src/app/designsystem/`. O visual são as peças que já existem do `Command`.
- Ícones só de `@heroicons/react/16/solid` dentro de `CommandItemIcon` (ícone passado como valor de navegação segue `24/outline`, como hoje).
- Textos em português, no tom dos atuais. Comentários em português, na densidade do arquivo.
- Grupos locais mostram até **5** linhas; transações até **8**; espera de **250ms**; consulta de transações só com **2+ caracteres** ou com valor/data reconhecidos.
- Valor sem centavos = `[n, n+1)` na consulta e `min=n&max=n,99` no link; com centavos, exato.
- Mês sem ano (e `dd/mm` sem ano) = a ocorrência mais recente até hoje.
- `npx tsc --noEmit && npm run lint && npm run test:unit` passam ao fim de cada tarefa (avisos de lint antigos não contam; erros sim).
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Termo com aspas, `%`, `_`, vírgula ou parênteses ("café (padaria)", "50%") — a consulta não pode quebrar o filtro `.or()` do PostgREST nem casar tudo. Teste na Task 2.
2. Termo só com espaço ou só com "R$" — nada de consulta, nada de erro. Teste na Task 1.
3. A carteira trocada com a paleta aberta, ou resultados chegando de um termo antigo — as transações mostradas são sempre do termo e da carteira atuais (a chave da consulta tem os dois). Teste na Task 2 (chave).
4. A tabela `bills` ausente (`isPostgrestRelationMissingError`) — o grupo de contas some, a paleta segue. Coberto na Task 2.
5. Nenhum resultado local e transações ainda carregando — a paleta mostra "Buscando…", não "Nada encontrado". Teste de fonte na Task 3.

---

### Task 1: O parse do termo e o link "Ver todas"

**Files:**
- Create: `src/lib/transaction-search.ts`
- Test: `src/lib/transaction-search.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type BuscaTransacoes = {
      /** O que sobra depois de tirar valor e data, aparado e com espaços simples. */
      texto: string
      /** Faixa de valor; `max` exclusivo. 150 → {min:150, max:151}; 150,50 → {min:150.5, max:150.5, exato:true} */
      valor: { min: number; max: number; exato: boolean } | null
      /** Datas locais `yyyy-mm-dd`, as duas inclusivas. */
      periodo: { de: string; ate: string } | null
  }
  export function parseBuscaTransacoes(termo: string, hoje: Date): BuscaTransacoes
  /** Pronta para consultar: texto com 2+ caracteres, ou valor, ou período. */
  export function buscaPronta(b: BuscaTransacoes): boolean
  /** `/transactions?q=…&from=…&to=…&min=…&max=…` (só o que existe). */
  export function verTodasHref(b: BuscaTransacoes): string
  ```

- [ ] **Step 1: Write the failing tests** (`hoje = new Date(2026, 9, 16)`, 16/10/2026):

```ts
expect(parseBuscaTransacoes("mercado", hoje)).toEqual({ texto: "mercado", valor: null, periodo: null })
expect(parseBuscaTransacoes("150", hoje).valor).toEqual({ min: 150, max: 151, exato: false })
expect(parseBuscaTransacoes("150,50", hoje).valor).toEqual({ min: 150.5, max: 150.5, exato: true })
expect(parseBuscaTransacoes("R$ 1.234,56", hoje).valor).toEqual({ min: 1234.56, max: 1234.56, exato: true })
expect(parseBuscaTransacoes("março", hoje).periodo).toEqual({ de: "2026-03-01", ate: "2026-03-31" })
expect(parseBuscaTransacoes("marco", hoje).periodo).toEqual({ de: "2026-03-01", ate: "2026-03-31" })
expect(parseBuscaTransacoes("dezembro", hoje).periodo).toEqual({ de: "2025-12-01", ate: "2025-12-31" })
expect(parseBuscaTransacoes("fev 2024", hoje).periodo).toEqual({ de: "2024-02-01", ate: "2024-02-29" })
expect(parseBuscaTransacoes("mar/26", hoje).periodo).toEqual({ de: "2026-03-01", ate: "2026-03-31" })
expect(parseBuscaTransacoes("15/03", hoje).periodo).toEqual({ de: "2026-03-15", ate: "2026-03-15" })
expect(parseBuscaTransacoes("20/11", hoje).periodo).toEqual({ de: "2025-11-20", ate: "2025-11-20" })
expect(parseBuscaTransacoes("15/03/2025", hoje).periodo).toEqual({ de: "2025-03-15", ate: "2025-03-15" })
expect(parseBuscaTransacoes("03/2025", hoje).periodo).toEqual({ de: "2025-03-01", ate: "2025-03-31" })
expect(parseBuscaTransacoes("2026", hoje)).toMatchObject({ valor: { min: 2026, max: 2027, exato: false }, periodo: null })
expect(parseBuscaTransacoes("mercado março 150", hoje)).toMatchObject({ texto: "mercado", valor: { min: 150 }, periodo: { de: "2026-03-01" } })
expect(parseBuscaTransacoes("  uber   eats ", hoje).texto).toBe("uber eats")
expect(buscaPronta(parseBuscaTransacoes("a", hoje))).toBe(false)
expect(buscaPronta(parseBuscaTransacoes("   ", hoje))).toBe(false)
expect(buscaPronta(parseBuscaTransacoes("R$", hoje))).toBe(false)
expect(buscaPronta(parseBuscaTransacoes("ub", hoje))).toBe(true)
expect(buscaPronta(parseBuscaTransacoes("9", hoje))).toBe(true)
expect(verTodasHref(parseBuscaTransacoes("mercado março 150", hoje))).toBe("/transactions?q=mercado&from=2026-03-01&to=2026-03-31&min=150&max=150%2C99")
expect(verTodasHref(parseBuscaTransacoes("150,50", hoje))).toBe("/transactions?min=150%2C50&max=150%2C50")
```

- [ ] **Step 2:** `npx vitest run src/lib/transaction-search.test.ts` → FAIL (módulo não existe).
- [ ] **Step 3: Implement** em `src/lib/transaction-search.ts`. Tokeniza por espaço; cada token é valor, data ou texto. Meses: `janeiro|jan … dezembro|dez`, sem acento e minúsculos (normalizar com `normalize("NFD")` e tirar diacríticos; "marco" = março). Um token de 4 dígitos 1900–2099 logo depois de um mês é o ano dele; ano de 2 dígitos em `mar/26` = 2026. `R$` sozinho é descartado. `min`/`max` do link em pt-BR (`150,99`) via `URLSearchParams`; o `from`/`to` é o que a lista lê sem `preset` (`src/lib/transactions-list-search-params.ts`). Use `ROUTES.TRANSACTIONS`.
- [ ] **Step 4:** o mesmo comando → PASS.
- [ ] **Step 5: Commit** `feat(busca): o termo da busca vira texto, valor e período`.

### Task 2: As consultas da busca (transações e contas)

**Files:**
- Create: `src/lib/queries/use-transactions-search.ts`
- Create: `src/lib/queries/use-bills-list.ts`
- Create: `src/hooks/use-debounced-value.ts`
- Modify: `src/lib/queries/keys.ts` (raízes `transactionsSearch` e `billsList`, com `*Keys`)
- Modify: `src/lib/queries/persist.ts` (`transactionsSearch` em `NON_PERSISTED_ROOTS`)
- Test: `src/lib/queries/transactions-search.test.ts`

**Interfaces:**
- Consumes: `BuscaTransacoes`, `buscaPronta` (Task 1).
- Produces:
  ```ts
  // use-transactions-search.ts
  export type TransacaoEncontrada = Pick<Transaction, "id" | "description" | "amount" | "type" | "date" | "category_id" | "payment_credit_card_id">
  /** O `or=` do PostgREST: descrição OU categoria OU cartão. `null` sem texto. */
  export function filtroOuTransacoes(texto: string, categoriaIds: string[], cartaoIds: string[]): string | null
  export function useTransactionsSearchQuery(args: {
      workspaceId: string | null
      busca: BuscaTransacoes
      categoriaIds: string[]
      cartaoIds: string[]
  }): UseQueryResult<TransacaoEncontrada[]>
  // use-bills-list.ts
  export type ContaListada = { id: string; name: string; amount_estimated: number | null }
  export function useBillsListQuery(workspaceId: string | null, enabled: boolean): UseQueryResult<ContaListada[]>
  // use-debounced-value.ts
  export function useDebouncedValue<T>(valor: T, ms: number): T
  ```

- [ ] **Step 1: Write the failing tests** for the pure parts:

```ts
expect(filtroOuTransacoes("mercado", [], [])).toBe("description.ilike.%mercado%")
expect(filtroOuTransacoes("mercado", ["c1", "c2"], ["k1"])).toBe("description.ilike.%mercado%,category_id.in.(c1,c2),payment_credit_card_id.in.(k1)")
expect(filtroOuTransacoes("", ["c1"], [])).toBeNull()
// % e _ escapados (como em fetchTransactionsListPage); vírgula, parênteses e aspas não quebram o or=
expect(filtroOuTransacoes("50%", [], [])).toBe('description.ilike."%50\\%%"')
expect(filtroOuTransacoes("café (padaria), centro", [], [])).toBe('description.ilike."%café (padaria), centro%"')
// a chave muda com a carteira e com o termo partido
expect(transactionsSearchKeys.list("w1", { texto: "a", valor: null, periodo: null }, [], []))
    .not.toEqual(transactionsSearchKeys.list("w2", { texto: "a", valor: null, periodo: null }, [], []))
```

(Regra do escape: `\`, `%` e `_` com barra; o padrão vai entre aspas duplas quando tem `,` `(` `)` `"` `%` `\` ou espaço-de-borda — aspas duplas internas viram `\"`. Ajuste o teste só se a documentação do PostgREST mostrar outra forma, e diga no relatório.)

- [ ] **Step 2:** `npx vitest run src/lib/queries/transactions-search.test.ts` → FAIL.
- [ ] **Step 3: Implement.**
  - `useTransactionsSearchQuery`: `enabled` só com `workspaceId` e `buscaPronta(busca)`. Seleciona só as colunas de `TransacaoEncontrada`, `.eq("workspace_id")`, `.or(filtro)` se houver texto, `.gte/.lt("amount")` pelo valor (`.eq` quando `exato`), `.gte("date", filterRangeStartIso(de))` e `.lte("date", filterRangeEndIso(ate))` pelo período, `.order("date", { ascending: false }).limit(8)`, `.abortSignal(signal)` do `queryFn`. `staleTime: 30_000`. Erro lança (o grupo trata).
  - `useBillsListQuery`: `bills` com `id, name, amount_estimated`, `.eq("workspace_id")`, `.order("name")`. Relação ausente (`isPostgrestRelationMissingError`) devolve `[]`.
  - `useDebouncedValue`: `setTimeout` num efeito, limpo a cada troca.
- [ ] **Step 4:** o comando → PASS; `npx tsc --noEmit` limpo.
- [ ] **Step 5: Commit** `feat(busca): as consultas de transações e de contas para a paleta`.

### Task 3: A paleta acha tudo na raiz

**Files:**
- Create: `src/lib/app-search.ts` (ranqueamento puro)
- Create: `src/components/layout/app-search-sources.ts` (telas e ações, com sinônimos)
- Modify: `src/components/layout/app-command-palette.tsx`
- Test: `src/lib/app-search.test.ts`, `src/components/layout/app-command-palette.test.ts`

**Interfaces:**
- Consumes: Tasks 1 e 2; `commandFilter` (`src/lib/command-filter.ts`); `useNotificationsUi().open`; `useWorkspace()` (`workspaces`, `currentWorkspaceId`, `setCurrentWorkspaceId`); `useGlobalShellDialogsOptional()` (`global-shell-dialogs-provider.tsx`: `openCategoryCreate`, `openCreditCardCreate`; `null` fora da casca — então as duas ações só aparecem com o contexto); `useInstallmentPlansQuery`, `useSubscriptionsQuery`, `useMemberDirectoryQuery`.
- Produces:
  ```ts
  // app-search.ts
  /** Os `limite` melhores pela nota do `commandFilter` (0 fica fora); empate mantém a ordem de entrada. Termo vazio devolve os primeiros `limite`. */
  export function ranquear<T>(itens: readonly T[], termo: string, chave: (item: T) => { valor: string; palavras?: string[] }, limite: number): T[]
  // app-search-sources.ts
  export type TelaBuscavel = { href: string; name: string; icon: HeroIcon; palavras: string[] }
  export const TELAS_BUSCAVEIS: TelaBuscavel[]
  ```

- [ ] **Step 1: Write the failing tests.**

`src/lib/app-search.test.ts`:
```ts
const itens = [{ v: "Transações", p: ["gastos", "extrato"] }, { v: "Cartões", p: ["fatura"] }, { v: "Painel" }]
const k = (i: typeof itens[number]) => ({ valor: i.v, palavras: i.p })
expect(ranquear(itens, "fatura", k, 5).map((i) => i.v)).toEqual(["Cartões"])
expect(ranquear(itens, "gastos", k, 5).map((i) => i.v)).toEqual(["Transações"])
expect(ranquear(itens, "", k, 2).map((i) => i.v)).toEqual(["Transações", "Cartões"])
expect(ranquear(itens, "zzz", k, 5)).toEqual([])
```

`src/components/layout/app-command-palette.test.ts` (lê a fonte com `lerFonte`/`semComentarios` de `src/test/fonte.ts`):
```ts
// a raiz acha tudo: os grupos, na ordem do desenho
for (const g of ["Telas", "Ações", "Transações", "Cartões", "Categorias", "Compras parceladas", "Assinaturas", "Contas a pagar", "Membros", "Carteiras"]) expect(fonte).toContain(`heading="${g}"`)
// as sub-páginas saíram
expect(fonte).not.toContain("CommandPages")
expect(fonte).not.toContain('label="Categorias…"')
// quem filtra é a paleta
expect(fonte).toContain("shouldFilter: false")
// as ações novas e os destinos
for (const t of ["Nova categoria", "Novo cartão", "openCategoryCreate", "openCreditCardCreate", "?txn=", "?plan=", "?sub=", "/bills?detail=", "verTodasHref", "setCurrentWorkspaceId"]) expect(fonte).toContain(t)
// carregando não é "nada encontrado"
expect(fonte).toContain("Buscando…")
expect(fonte).toContain("Não deu para buscar transações agora.")
// telas novas e sinônimos
const fontes = lerFonte("src/components/layout/app-search-sources.ts")
for (const t of ["ACCOUNT_SESSIONS", "ACCOUNT_ACTIVITY", "fatura", "boletos", "gastos"]) expect(fontes).toContain(t)
```

- [ ] **Step 2:** `npx vitest run src/lib/app-search.test.ts src/components/layout/app-command-palette.test.ts` → FAIL.
- [ ] **Step 3: Implement.**
  - `app-search-sources.ts`: `TELAS_BUSCAVEIS` = as telas de hoje (`TELAS`) mais Sessões ativas (`ROUTES.ACCOUNT_SESSIONS`) e Atividade (`ROUTES.ACCOUNT_ACTIVITY`), com os títulos de `APP_SUB_PAGE_TITLES`, e `palavras` com os sinônimos do desenho (Transações ← lançamentos, gastos, extrato, movimentações; Cartões ← fatura, crédito; Contas a pagar ← boletos, despesas fixas, vencimentos; Assinaturas ← recorrentes, mensalidades; Painel ← início, resumo, dashboard; Configurações ← ajustes, preferências; Planos e pagamentos ← assinatura do app, cobrança; Membros ← convidar, pessoas). As ações com sinônimos: Nova despesa ← gasto, saída; Nova receita ← entrada, salário.
  - `AppCommandPalette`: `commandProps={{ filter: commandFilter, shouldFilter: false }}`; tira `CommandPages`, `useCommandPages`, `SubPageItem`, o atalho ⌫ da legenda e as páginas `categorias`/`cartoes`.
  - **Campo vazio**: Recentes; Ações; "Telas" sem as que já estão nos Recentes; "Notificações" no fim de "Telas" (abre o painel com `open()`, não vai para os recentes).
  - **Com texto**: cada grupo local = `ranquear(lista, query, chave, 5)`, só renderizado com itens; ordem: Telas, Ações, Transações, Cartões, Categorias, Compras parceladas, Assinaturas, Contas a pagar, Membros, Carteiras. Valor do item (`value`) único por tipo (`"cartao:" + id` etc.), para o cmdk não acender dois juntos. Os valores das assinaturas, parcelas e contas entram nas `palavras` (formatados como `currencyBRL` e cru), para "49,90" achá-las.
  - **Transações**: `busca = parseBuscaTransacoes(useDebouncedValue(query, 250), new Date())`; `categoriaIds`/`cartaoIds` = os ids cujo nome casa `busca.texto` pelo `commandFilter`. Linha: ícone `ArrowTrendingDownIcon`/`ArrowTrendingUpIcon` pelo `type`, a descrição (ou "Sem descrição") com `CommandHighlight`, e na meta a data curta (`formatTransactionDmyPtBr`) e o valor (`signedCurrencyBRL`, classe `nums`). Escolher vai a `${ROUTES.TRANSACTIONS}?txn=${id}` (sem recente). Última linha do grupo: "Ver todas em Transações" → `verTodasHref(busca)`. Pendente: uma linha `CommandLoading` "Buscando…" dentro do grupo. Erro: uma linha `CommandLoading` (não selecionável) "Não deu para buscar transações agora.".
  - **Vazio**: o `CommandEmpty` só quando nada local casou **e** a consulta não está pendente; com consulta pendente e nada local, o `CommandLoading` "Buscando…" ocupa o lugar. Descrição do vazio: "A busca cobre telas, ações, transações, cartões, categorias, parcelas, assinaturas, contas, membros e carteiras."
  - **Destinos**: cartão `creditCardDetailPath(id)`; categoria `categoryDetailPath(id)`; parcela `${ROUTES.TRANSACTIONS}?plan=${id}` (título = `description`); assinatura `${ROUTES.TRANSACTIONS}?sub=${id}`; conta `${ROUTES.BILLS}?detail=${id}`; membro `ROUTES.MEMBERS`; carteira: `setCurrentWorkspaceId(id)` e fechar, a atual fora da lista. O mapa `destinos` dos recentes ganha parcelas, assinaturas e contas.
  - **Consultas ligadas com a paleta aberta**: parcelas, assinaturas, membros e `useBillsListQuery(workspaceId, true)` (o `PaletteBody` só monta com a paleta aberta).
  - Atualize o comentário do topo do arquivo e o `description` do `CommandDialog`: "Vá para uma tela, adicione algo ou encontre uma transação, um cartão, uma categoria, uma parcela, uma assinatura, uma conta, um membro ou uma carteira."
- [ ] **Step 4:** os dois testes → PASS; `npx tsc --noEmit && npm run lint && npm run test:unit` limpos.
- [ ] **Step 5: Commit** `feat(busca): a paleta acha transações, cartões, parcelas e tudo do app na raiz`.

### Task 4: Jornadas, Atlas e regras

**Files:**
- Modify: `docs/JORNADAS.md` (linha 332 do fluxograma da paleta; a linha "Busca global (⌘K)" da tabela, ~366)
- Modify: `docs/atlas/template.html` (o item "Busca." ~516; a data e as contagens da capa se mudarem)
- Modify: `AGENTS.md` (o bullet "Busca" do design system: a do **app** abre…)
- Generate: `docs/atlas/atlas-jornadas.html` via `python3 docs/atlas/build.py`

- [ ] **Step 1:** Reescreva o nó da paleta no fluxograma (`palette([...])`) para "Paleta de busca: Recentes, Telas, Ações, Transações, Cartões, Categorias, Parcelas, Assinaturas, Contas, Membros, Carteiras" e acrescente as arestas para os destinos novos (`/transactions?txn=id`, `?plan=id`, `?sub=id`, `/bills?detail=id`, `/members`, troca de carteira, painel de notificações). Ids de nó não podem ser palavras reservadas do Mermaid (`href`, `end`, `graph`…); o bloco mantém o `%%{init}%%`.
- [ ] **Step 2:** Reescreva a linha "Busca global (⌘K)" da tabela de regras: a raiz busca tudo; transações no banco (descrição, valor, data, categoria, cartão; 8 mais recentes; espera de 250ms; "Ver todas" com `q`/`from`/`to`/`min`/`max`, e a lista filtra o texto só na descrição); o resto do cache; contas por consulta leve; recentes no `app:busca`. Arquivos: `app-command-palette.tsx`, `app-search-sources.ts`, `transaction-search.ts`, `use-transactions-search.ts`, `use-bills-list.ts`.
- [ ] **Step 3:** No `template.html`, o mesmo em linguagem de pessoa no item "Busca."; atualize a data da capa para 16 de outubro de 2026 se ela mostrar data.
- [ ] **Step 4:** No `AGENTS.md`, troque no bullet "Busca" o trecho da paleta do app ("com as telas da navegação, as ações do '+ Adicionar' (os mesmos ganchos) e as sub-páginas de categorias e cartões") por: "que acha na raiz telas, ações, transações (no banco: descrição, valor, data, categoria e cartão), cartões, categorias, parcelas, assinaturas, contas, membros e carteiras, com `shouldFilter: false` — cada grupo chega ranqueado por `ranquear` (`lib/app-search`)".
- [ ] **Step 5:** `python3 docs/atlas/build.py` termina sem erro; `grep -c "Transações" docs/atlas/atlas-jornadas.html` > 0. **Não** use curinga `*` dentro de `var()`/`[...]` em nenhum doc (o Tailwind varre os docs).
- [ ] **Step 6: Commit** `docs: a busca global nas jornadas e no Atlas`. (A republicação do Atlas é do controlador, com a ferramenta de Artifact.)
