# Transações — redesenho: plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para executar este plano tarefa por tarefa. Os passos usam caixas de seleção (`- [ ]`) para acompanhar o progresso.

**Objetivo:** reconstruir `/transactions` (desktop e telefone), o detalhe, a importação e os campos de wireframe do formulário sobre o design system. Os filtros passam a ser tokens no `FilterBar`, com resumo, revisão "a conferir" e lote completo.

**Arquitetura:**
- Um módulo puro de filtros (URL ↔ `FilterValue[]`) e um montador de consulta único (`aplicarFiltros`), usados pela página, pelo resumo e pela exportação.
- Um hook novo, `useTransacoesDaTela`, controla só a página. O `useTransactionsListController` antigo fica para o modo embutido de Categorias.
- Os componentes da tela moram em `src/components/transactions/`. Os wireframes exclusivos da tela são apagados.

**Stack:** Next (versão do repo, leia `node_modules/next/dist/docs/` antes de mexer em rota), React Query, Supabase JS, Vitest, Tailwind v4, os componentes de `src/components/ui/`.

**Spec:** `docs/superpowers/specs/2026-11-07-transacoes-redesenho-design.md`. Leia a seção citada em cada tarefa antes de começar.

## Restrições globais

- O `AGENTS.md` é lei. Antes de qualquer JSX, rode `npm run ds:catalog`. Ao fim de toda tarefa de UI, rode `npm run ds:audit -- <arquivos da tarefa>` sem violação nova.
- A regra do graphify: rode `graphify query "<pergunta>"` antes do primeiro grep ou da primeira leitura de código. Depois de mudar código, rode `graphify update .`.
- Componente nenhum em `src/app/`. Nada de cor crua, `p-[13px]` ou classe montada.
- Não editar `src/components/ui/` nem `src/app/globals.css`, **exceto na Tarefa 7**.
- **O dev aponta para o Supabase de produção.** Nenhuma tarefa grava dado pelo navegador. As gravações são testadas com o cliente falso no Vitest.
- O texto da interface fica em pt-BR, com a cópia exata da spec.
- Pesos de botão:
  - par de ações: `primary` + `tertiary`;
  - três ações juntas: `primary`, `secondary` e `tertiary`;
  - `Button` sempre com `type`.
- Cada commit fecha com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Branch `finance-app-2.0`. Nunca dar push em `main`.
- Os testes de fonte que reprovarem pelo desenho novo são **reescritos para travar o desenho novo** na mesma tarefa, nunca apagados sem substituto.

## Foco da revisão

1. **Link antigo com várias chaves** (`?card=X&preset=last30`, `?pm=credit_card&card=X`, `?cats=a&from=…&to=…`) precisa dar todos os tokens, e o período padrão não pode entrar. Testes na Tarefa 1.
2. **"Sem categoria" misturado com ids**: `categoria is [a, __none__]` precisa virar um OU (`category_id.in.(a),category_id.is.null`). `is-not [a, __none__]` precisa virar `not.in.(a)` E `not.is.null`. Testes na Tarefa 2.
3. **Estorno no cartão** (uma receita com categoria de despesa): o resumo o desconta das Saídas, e ele não conta como Entrada (regra do Painel, `ehEstornoNoCartao`). As linhas projetadas não somam. Teste na Tarefa 2.
4. **CSV com `;`, aspas ou quebra de linha** na descrição: o campo vai entre aspas, com as aspas dobradas. O valor sai com sinal e vírgula decimal. Teste na Tarefa 2.
5. **↑↓ no detalhe quando a linha aberta sai da lista** (excluída, ou filtrada fora depois de editar): as setas desligam e a folha continua mostrando a linha. Na ponta da página, as setas também ficam desligadas. Teste na Tarefa 8.

---

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/transactions/filtros.ts` (novo) | os campos estáticos, `lerFiltrosDaUrl` e `escreverFiltrosNaUrl` |
| `src/lib/queries/transacoes-filtradas.ts` (novo) | `aplicarFiltros`, `fetchTransacoesPagina`, `fetchResumoTransacoes`, `fetchTransacoesParaExportar` |
| `src/lib/transactions/csv.ts` (novo) | `transacoesParaCsv` |
| `src/lib/transactions/mutations.ts` | ganha `marcarConferidos` e `categorizarEmLote` |
| `src/components/transactions/use-transacoes-da-tela.ts` (novo) | o estado da página: a URL, as consultas, a seleção, o detalhe e os parâmetros consumidos |
| `src/components/transactions/use-campos-de-filtro.ts` (novo) | o `FilterField[]` com as opções vindas dos dados |
| `src/components/transactions/transacoes-toolbar.tsx` (reescreve `transactions-toolbar.tsx`) | as abas, a busca, o `FilterBar`, o ⋯ do telefone e o filtro do cabeçalho |
| `src/components/transactions/resumo-das-transacoes.tsx` (novo) | o `StatCardGroup` |
| `src/components/transactions/aviso-a-conferir.tsx` (novo) | o `Alert` da página |
| `src/components/transactions/transactions-table.tsx` (reescrito) | as colunas, o grupo, as ações e o lote |
| `src/components/transactions/categorizar-em-lote-dialog.tsx` (novo) | o diálogo do lote |
| `src/components/transactions/transaction-detail-sheet.tsx` (reescrito) | a casca, o herói, a lista, o rodapé e as setas |
| `src/components/transactions/a-conferir-no-detalhe.tsx` (novo) | o bloco a conferir |
| `src/components/transactions/partes-da-despesa.tsx` (novo) | a divisão |
| `src/components/transactions/anexos-do-lancamento.tsx` (novo) | os anexos |
| `src/components/transactions/importar/*` (novo) | `ImportarExtratoDialog` e `useImportarExtrato` |
| `src/components/transactions/compartilhado-aviso.tsx` (novo) | o `Alert` do arquivo compartilhado |
| `src/components/transactions/transaction-form-fields.tsx` | projeto, quem pagou e pesos no DS |
| `src/app/(app)/transactions/page-client.tsx` (reescrito) | só a composição |
| `src/components/transactions/transactions-page-skeleton.tsx` | o esqueleto novo |
| `src/components/ui/data-table.tsx` + docs + teste | a prop `selectionSummary` (Tarefa 7) |
| apagados | `transactions-filters-panel.tsx`, `transactions-active-filters-chips.tsx`, `transactions-date-presets.tsx` e os wireframes `a-conferir-lista`, `a-conferir`, `importar-extrato`, `compartilhado-aviso` (e `mapeamento-csv.tsx` se ficar sem uso) |

---

### Task 1: Modelo de filtros e tradução da URL

**Arquivos:**
- Criar: `src/lib/transactions/filtros.ts`
- Teste: `src/lib/transactions/filtros.test.ts`

**Interfaces:**
- Produz:
  - `type CampoId = "periodo"|"categoria"|"pagamento"|"cartao"|"valor"|"conferir"|"captura"|"pessoa"|"pagou"|"projeto"|"parcelada"|"plano"|"assinatura"|"recorrente"`.
  - `CAMPOS_BASE: FilterField[]`, os 14 campos da spec §5.2 sem opções, na ordem da §5.2. `plano` e `assinatura` levam `multiple: false`.
  - `SEM_CATEGORIA = "__none__"`.
  - `type EstadoDaLista = { type: "all"|"income"|"expense"; q: string; filtros: FilterValue[]; sort: { key: "date"|"amount"; dir: "asc"|"desc" }; page: number }`.
  - `lerFiltrosDaUrl(p: URLSearchParams, hoje?: Date): EstadoDaLista & { migrou: boolean }`. `migrou` vale `true` quando havia parâmetro antigo ou quando entrou o período padrão; o hook então reescreve a URL com `replace`.
  - `escreverFiltrosNaUrl(estado: EstadoDaLista, base: URLSearchParams): URLSearchParams`. Preserva as chaves que não são da lista (`txn`, `new`, `importar`, `frase*`, `compartilhado*`, `tipo`). Apaga as antigas. Não escreve valores padrão (`type=all`, `sort=date.desc`, `page=1`).

- [ ] **Passo 1: escrever os testes que falham**, com `hoje = new Date(2026, 10, 7)`:
  - `lerFiltrosDaUrl(new URLSearchParams(""))` → `filtros` igual a `[{field:"periodo",operator:"is",values:["este-mes"]}]` e `migrou: true`.
  - `?txn=abc` → o mesmo período padrão (`txn` não é filtro).
  - `?card=X&preset=last30` → `[{periodo is ["ultimos-30"]}, {cartao is ["X"]}]` (a ordem segue `CAMPOS_BASE`), sem o padrão.
  - `?preset=last15` → `periodo is ["2026-10-24","2026-11-07"]`.
  - `?from=2026-10-01` → `periodo is ["2026-10-01","2026-11-07"]`; `?to=2026-10-31` → `["2000-01-01","2026-10-31"]`.
  - `?cats=a,b` → `categoria is ["a","b"]`; `?uncat=1` → `categoria is ["__none__"]`.
  - `?min=1.234,56` → `valor gte ["1234.56"]`; `min=10&max=50` → `valor between ["10","50"]`; `max=50` → `valor lte ["50"]`.
  - `?inst=1` → `parcelada is ["true"]` (confira em `normalizar` do `filter-bar.tsx` o formato que o booleano aceita e use esse); `?plan=P` → `plano is ["P"]`; `?sub=S` → `assinatura is ["S"]`; `?conferir=1` → `conferir is [<o mesmo valor booleano>]`.
  - `?pm=pix,credit_card&card=X` → `pagamento is ["pix","credit_card"]` e `cartao is ["X"]`.
  - `?f=categoria:is-not:a` → lido por `parseFilters(…, CAMPOS_BASE)`, `migrou: false`, sem padrão.
  - `?type=expense&q=uber&sort=amount.asc&page=3` → `type`, `q`, `sort` e `page` lidos.
  - Ida e volta: `lerFiltrosDaUrl(escreverFiltrosNaUrl(e, new URLSearchParams("txn=1")))` devolve `e`, e o resultado mantém `txn=1` e não tem `cats`, `preset` nem `conferir`.
- [ ] **Passo 2:** `npx vitest run src/lib/transactions/filtros.test.ts`. Esperado: FALHA (módulo inexistente).
- [ ] **Passo 3: implementar.** Os UUIDs de `card`, `cats`, `plan` e `sub` são validados como no controlador antigo (`use-transactions-list-controller.ts:491-608`), e o inválido é descartado. Use `parseYmdLocal`/`localYmdFromDate` de `@/lib/transaction-date`. O parse do valor reusa a regra de `parseAmountFilter`: tira os pontos e troca a vírgula. Exporte-a de `fetch-transactions-list-page.ts` em vez de duplicar.
- [ ] **Passo 4:** rode o teste. Esperado: PASSA.
- [ ] **Passo 5:** commit `feat(transacoes): filtros em tokens e tradução dos parâmetros antigos`.

### Task 2: Consulta filtrada, resumo, exportação e CSV

**Arquivos:**
- Criar: `src/lib/queries/transacoes-filtradas.ts`, `src/lib/transactions/csv.ts`
- Modificar: `src/lib/queries/fetch-transactions-list-page.ts` (exportar os selects, `parseAmountFilter`, `PAGE_SIZE` e a execução com fallback de embed como `executarComFallbackDeEmbed(construir: (select: string) => PostgrestFilterBuilder)`, sem mudar o comportamento dele)
- Teste: `src/lib/queries/transacoes-filtradas.test.ts`, `src/lib/transactions/csv.test.ts`

**Interfaces:**
- Consome: `EstadoDaLista`, `SEM_CATEGORIA` (Tarefa 1).
- Produz:
  - `aplicarFiltros<Q>(q: Q, estado: Pick<EstadoDaLista,"type"|"q"|"filtros">, hoje?: Date): Q`, para qualquer builder do PostgREST.
  - `fetchTransacoesPagina({ workspaceId, estado }): Promise<{ transactions: Transaction[]; totalCount: number }>`.
  - `type Resumo = { saidas: number; entradas: number; resultado: number; quantidade: number; truncado: boolean }`.
  - `fetchResumoTransacoes({ workspaceId, estado }): Promise<Resumo>`.
  - `fetchTransacoesParaExportar({ workspaceId, estado }): Promise<{ transactions: Transaction[]; truncado: boolean }>`.
  - `LIMITE_DE_SOMA = 10_000`.
  - `transacoesParaCsv(rows: Transaction[], ctx: { nomeDoMembro: (userId: string) => string }): string`.

- [ ] **Passo 1: testes que falham para `aplicarFiltros`.** Use um builder falso que grava as chamadas (`eq`, `in`, `not`, `is`, `or`, `gte`, `lte`, `ilike`) e devolve a si mesmo. Asserções, uma por campo e operador da spec §5.2:
  - `type=expense` → `eq("type","expense")`.
  - `q="50% off"` → `ilike("description","%50\\% off%")`, com o escape de hoje.
  - `periodo este-mes` (hoje = 7/11/2026) → `gte("date","2026-11-01")` e `lte("date","2026-11-30")`.
  - `categoria is [a,b]` → `in("category_id",["a","b"])`.
  - `categoria is [__none__]` → `is("category_id",null)`.
  - `categoria is [a,__none__]` → `or("category_id.in.(a),category_id.is.null")`.
  - `categoria is-not [a,__none__]` → `not("category_id","in","(a)")` e `not("category_id","is",null)`.
  - `pagamento is-not [pix]` → `not("payment_method","in","(pix)")`.
  - `cartao is [X]` → `in("payment_credit_card_id",["X"])`, sem exigir `pagamento`.
  - `valor between [10,50]` → `gte("amount",10)` e `lte("amount",50)`.
  - `conferir` → `eq("needs_review",true)`.
  - `captura is [importacao]` → `in("source",["import_pdf","import_sheet","import_statement"])`. Os ids de opção são `app`, `quick_text`, `shortcut`, `apple_pay`, `mcp` (confira o nome real da origem do MCP no `TransactionSource`), `share`, `importacao` e `recurring`.
  - `pessoa` → `user_id`; `pagou` → `paid_by`; `projeto` → `project_id`.
  - `parcelada` → `not("installment_plan_id","is",null)`.
  - `plano` → `eq("installment_plan_id",P)`; `assinatura` → `eq("subscription_id",S)`.
  - `recorrente` → `eq("is_recurring",true)`.
- [ ] **Passo 2: testes que falham para `fetchResumoTransacoes`.** Use o cliente falso com o `range` paginado e estas linhas:
  - despesa de 100;
  - receita de 300;
  - estorno no cartão de 20 (`type: "income"`, `payment_method: "credit_card"`, categoria de tipo `expense`);
  - resultado esperado: `saidas: 80`, `entradas: 300`, `resultado: 220`, `quantidade: 3`, `truncado: false`.
  - Com 10.001 linhas devolvidas, `truncado: true` e a soma das 10.000 primeiras.
  - O select é `"type, amount, payment_method, category:categories(type)"`. Para o estorno, reuse `ehEstornoNoCartao`, a mesma regra do Painel.
- [ ] **Passo 3: testes que falham para `transacoesParaCsv`.**
  - O cabeçalho é exatamente `data;descrição;categoria;tipo;valor;forma;cartão;lançado por;a conferir`.
  - A despesa de 1234.5 vira `-1234,50`, e a receita, `1234,50`.
  - A descrição `Mercado; "Extra"\nfim` vira `"Mercado; ""Extra""\nfim"`.
  - A data sai como `07/11/2026`.
  - `a conferir` vale `sim` ou `não`.
  - Começa com o BOM `﻿`, para o Excel abrir.
- [ ] **Passo 4:** `npx vitest run src/lib/queries/transacoes-filtradas.test.ts src/lib/transactions/csv.test.ts`. Esperado: FALHA.
- [ ] **Passo 5: implementar.**
  - `fetchTransacoesPagina` usa `executarComFallbackDeEmbed`, `count: "exact"`, `range` de `PAGE_SIZE`, e a ordem de hoje (data com `created_at` de desempate). Junta os cartões por `attachPaymentCards`: exporte-o de onde mora.
  - Resumo e exportação paginam por `range` de 1000 até `LIMITE_DE_SOMA`.
- [ ] **Passo 6:** rode os testes. Esperado: PASSA. Rode também `npx vitest run src/lib/queries` para garantir que a lista antiga não mudou.
- [ ] **Passo 7:** commit `feat(transacoes): consulta filtrada única, resumo e CSV`.

### Task 3: Hook da página `useTransacoesDaTela`

**Arquivos:**
- Criar: `src/components/transactions/use-transacoes-da-tela.ts`
- Teste: `src/components/transactions/use-transacoes-da-tela.test.ts` (fonte e lógica pura)

**Interfaces:**
- Consome: Tarefas 1 e 2; `useCategoriesQuery`, `useCreditCardsQuery`, `useTransactionsWorkspaceAuxQuery`; e os consumidores de parâmetro de `transactions-list-search-params.ts` (`consumirParametroImportar`, `consumirParametroFrase`, `consumirParametroCompartilhado`).
- Produz `useTransacoesDaTela(): TelaDeTransacoes` com:
  - `estado`, `setEstado(parcial: Partial<EstadoDaLista>)`: mudar `type`, `q` ou `filtros` volta à página 1; escreve na URL por `router.replace`.
  - `pagina: { transactions; totalCount; isLoading; isFetching; error; refetch }`.
  - `resumo: { data?: Resumo; isFetching }`.
  - `contagemAConferir: number` (o head count de `needs_review`, `staleTime` de 60 s).
  - `detalhe: { aberto: Transaction | null; abrir(t, opts?: { editar?: boolean }); fechar(); vizinhos: { anterior?: Transaction; seguinte?: Transaction } }`.
  - `pedidosDeAbertura: { importar: boolean; setImportar(b) ; criar: null | "despesa"|"receita"|"parcelada"; frase?: string; compartilhado?: { chave: string; tipo?: "pdf" } | { erro: true } }`.
  - `excluir(ids: string[])`: abre a confirmação de hoje.
  - `invalidar()`: lista, resumo e contagem.
  - Chaves de consulta: `["transacoes","pagina",workspaceId,estado]`, `["transacoes","resumo",workspaceId,estado sem sort/page]` e `["transacoes","a-conferir",workspaceId]`, todas com `keepPreviousData`. **Toda mutação de transação já existente invalida também o prefixo `["transacoes"]`**: procure as invalidações de `transactionsKeys` e acrescente.
- Porte do controlador antigo, com o mesmo comportamento:
  - o `?txn=` (a linha da página ou `select("*")`, e o parâmetro sai);
  - o `?new=1|parcelada|receita`;
  - o `?importar=1`;
  - os `frase*` e `compartilhado*`;
  - a linha ao vivo do detalhe (`liveDetailTransaction`);
  - voltar uma página quando a página fica vazia depois de excluir.

- [ ] **Passo 1: testes que falham** para uma função pura exportada, `vizinhosDe(lista: Transaction[], id: string)`:
  - devolve o anterior e o seguinte na ordem da lista;
  - ignora as linhas projetadas (`isProjectedTransactionRow`);
  - devolve `{}` quando o id não está na lista.
  - Teste de fonte: o hook não importa `use-transactions-list-controller`.
- [ ] **Passo 2:** rode e veja falhar.
- [ ] **Passo 3: implementar o hook.**
- [ ] **Passo 4:** rode os testes e `npx tsc --noEmit`. Esperado: verde.
- [ ] **Passo 5:** commit `feat(transacoes): hook da página com URL em tokens`.

### Task 4: Campos de filtro, toolbar e filtro do cabeçalho

**Arquivos:**
- Criar: `src/components/transactions/use-campos-de-filtro.ts`, `src/components/transactions/transacoes-toolbar.tsx`
- Apagar: `transactions-toolbar.tsx`, `transactions-filters-panel.tsx`, `transactions-active-filters-chips.tsx`, `transactions-date-presets.tsx` (depois que a Tarefa 12 trocar a página: até lá ficam, mas sem uso novo)
- Testes: `src/components/transactions/transacoes-toolbar.test.ts`; reescrever `top-bar-versions.test.ts:343` e as linhas de `combobox-versions`, `popover-versions`, `toggle-group-versions` e `date-picker-versions` que citam os arquivos apagados (troque pela trava equivalente do arquivo novo, ou remova a linha quando o arquivo deixou de existir, explicando no commit).

**Interfaces:**
- Consome: `CAMPOS_BASE` (Tarefa 1) e `TelaDeTransacoes` (Tarefa 3).
- Produz:
  - `useCamposDeFiltro(type: EstadoDaLista["type"]): { campos: FilterField[]; carregando: boolean }`. Usa os ids e a ordem de `CAMPOS_BASE` e põe as opções:
    - categorias do tipo, com `media` `<ColorTile size="xs" …/>` e "Sem categoria";
    - `PAYMENT_METHOD_VALUES` com `paymentMethodLabel`;
    - os cartões;
    - os membros com `Avatar xs` (o campo some com menos de 2 membros ou para o convidado);
    - os adultos (só em carteira `split`);
    - os projetos ativos (some sem nenhum);
    - os planos e as assinaturas do aux.
  - `<TransacoesToolbar tela={TelaDeTransacoes} campos={FilterField[]} onImportar() onExportar() />`:
    - `Toolbar` com `TransactionTypeSegment`, `ToolbarSearch` (espera de 300 ms e grava `q`) e, no telefone, `ToolbarActions` com o ⋯ (`DropdownMenu`: "Importar extrato", "Exportar CSV");
    - abaixo, o `FilterBar` com `value`, `onValueChange`, `count`, `total`, `noun=["lançamento","lançamentos"]`, `mobile="scroll"`, sem `onMatchChange` e sem `urlParam`;
    - publica o filtro do cabeçalho por `usePageChromeFilter`, cujo clique rola ao topo e clica no "+ Filtro" pelo `data-slot` com o comentário `shortcut:` da spec §5.4.
    - Com `contagem === totalCount` e nenhum filtro, o `FilterBar` não mostra "N de N" (confira como o `count`/`total` se comporta; prefira passar `total` só com filtro aplicado).

- [ ] **Passo 1: testes de fonte que falham.**
  - `transacoes-toolbar.tsx` importa `FilterBar` de `@/components/ui/filter-bar`.
  - Não contém `onMatchChange` nem `urlParam`.
  - Contém `usePageChromeFilter`.
  - Não contém `md:hidden` (uma árvore só).
  - `use-campos-de-filtro.ts` usa `CAMPOS_BASE`.
- [ ] **Passo 2:** rode e veja falhar.
- [ ] **Passo 3:** implemente. Rode `npm run ds:audit -- src/components/transactions/transacoes-toolbar.tsx src/components/transactions/use-campos-de-filtro.ts`.
- [ ] **Passo 4:** rode os testes e o `tsc`. Esperado: verde.
- [ ] **Passo 5:** commit `feat(transacoes): FilterBar no topo da lista`.

### Task 5: Resumo e aviso "a conferir"

**Arquivos:**
- Criar: `src/components/transactions/resumo-das-transacoes.tsx`, `src/components/transactions/aviso-a-conferir.tsx`
- Modificar: `src/lib/transactions/mutations.ts` (com `marcarConferidos`, compartilhado com a Tarefa 6: crie-o aqui)
- Teste: `src/lib/transactions/mutations-lote.test.ts`, `src/components/transactions/resumo.test.ts`

**Interfaces:**
- Produz:
  - `marcarConferidos(ids: string[]): Promise<void>`: `update({ needs_review: false }).in("id", ids)`, lançando no erro.
  - `<ResumoDasTransacoes resumo={Resumo | undefined} pendente={boolean} />`:
    - `StatCardGroup variant="joined"`, `StatCard size="sm"`;
    - rótulos "Saídas", "Entradas", "Resultado" e "Lançamentos";
    - o valor das Saídas com sinal negativo; as Entradas e o Resultado com sinal; o tom de dinheiro por `income`/`expense`;
    - "Resultado" e "Lançamentos" com `className="max-md:hidden"` no `StatCard` (esconder no telefone não é uma segunda árvore);
    - `truncado` mostra o `StatCardFooter` "Somando os primeiros 10.000";
    - `pendente` esmaece;
    - sem dado, o `StatCard` em esqueleto.
  - `<AvisoAConferir total={number} ativo={boolean} onRevisar() onConfirmarTodos(): Promise<void> />`, com a cópia exata da spec §7:
    - inativo: "N lançamentos a conferir" (singular "1 lançamento a conferir") e a ação "Revisar";
    - ativo: "Conferindo N" e a ação "Confirmar todos", que abre um `AlertDialog` com `AlertDialogAction variant="primary"`, o título "Confirmar N lançamentos?" e o `pending` na raiz;
    - com `total === 0`, nada renderiza.

- [ ] **Passo 1: testes que falham.**
  - `marcarConferidos(["a","b"])` chama `from("transactions").update({needs_review:false}).in("id",["a","b"])` no cliente falso e propaga o erro.
  - Fonte: `resumo-das-transacoes.tsx` usa `StatCardGroup` e não escreve `KpiCard`.
  - Fonte: `aviso-a-conferir.tsx` usa `AlertAction` e não tem `svg` filho.
- [ ] **Passo 2:** rode e veja falhar.
- [ ] **Passo 3:** implemente e rode o `ds:audit` nos dois componentes.
- [ ] **Passo 4:** testes verdes.
- [ ] **Passo 5:** commit `feat(transacoes): resumo do recorte e aviso a conferir`.

### Task 6: Tabela nova, ações da linha e lote

**Arquivos:**
- Reescrever: `src/components/transactions/transactions-table.tsx`
- Criar: `src/components/transactions/categorizar-em-lote-dialog.tsx`
- Modificar: `src/lib/transactions/mutations.ts` (`categorizarEmLote`), `src/components/transactions/global-transaction-create-provider.tsx` ou `transaction-form-use.tsx` (`initialValues` para duplicar, só se ainda não existir)
- Teste: `mutations-lote.test.ts` (ampliado), `transactions-table.test.ts` (novo), e reescrever `table-versions.test.ts:226-244`, `hover-card-versions.test.ts:66` e `context-menu-versions.test.ts:45` se reprovarem.

**Interfaces:**
- Consome: `TelaDeTransacoes`, `marcarConferidos`.
- Produz:
  - `categorizarEmLote(ids: string[], categoryId: string | null): Promise<void>`, com `update({ category_id, needs_review: false })`.
  - `duplicarComoNova(t: Transaction): void`, exportado de `global-transaction-create-provider.tsx`. Abre o criar com os valores da spec §6.4: data de hoje; a parcelada vira despesa simples do valor da parcela, e a descrição perde o `/ \(\d+\/\d+\)$/`.
  - Uma função pura `valoresDuplicados(t: Transaction, hoje: Date)`, que é a testada.
  - `<TransactionsTable tela={TelaDeTransacoes} membros={…} onEditar(t) onDuplicar(t) onExcluir(ids) />`:
    - colunas, `meta.mobile`, grupo por dia com o `groupTotal` líquido, `rowActions` (Confirmar `primary` só com `needs_review`; Editar, Duplicar e Excluir no ⋯), `rowContextMenu` e `bulkActions` (Categorizar, Marcar conferidos, Editar e Excluir), todos da spec §6;
    - `toolbar={{ view: true }}` e `id="transactions"`;
    - `countLabel` "N lançamentos";
    - os `empty` da §6.5.
  - A coluna Data: veja se o `DataTable` aceita `columnVisibility` controlado. Se sim, ela some com a ordem por data. Se não, fica sempre. **Não mexa em `ui/`.**
  - `<CategorizarEmLoteDialog ids tipo onDone />`: `Dialog size="sm"`, um `Form` com `FormField` + `Combobox` de categoria do tipo, e `FormActions` com Cancelar e "Categorizar". Com tipos misturados, a ação do lote recebe `disabled` e o rótulo de dica "Selecione só despesas ou só receitas".

- [ ] **Passo 1: testes que falham.**
  - `categorizarEmLote(["a"],"c")` grava `{category_id:"c",needs_review:false}` com `.in("id",["a"])`.
  - `valoresDuplicados({…parcela "Lentes (1/2)", amount 109.95, date "2026-10-06"}, hoje)` dá descrição "Lentes", 109.95, data "2026-11-07", sem plano e `needsReview` falso.
  - Fonte: a tabela usa `groupByLocalDay` e `formatDayHeadingPtBr`, não tem a coluna `Tipo` e tem `bulkActions` com "Categorizar" e "Marcar conferidos".
- [ ] **Passo 2:** rode e veja falhar.
- [ ] **Passo 3:** implemente e rode o `ds:audit` na tabela e no diálogo.
- [ ] **Passo 4:** testes e `tsc` verdes.
- [ ] **Passo 5:** commit `feat(transacoes): tabela por dia, confirmar na linha e lote completo`.

### Task 7: `DataTable.selectionSummary` (mudança de `ui/`, pede o ok do dono)

**Arquivos:**
- Modificar: `src/components/ui/data-table.tsx` (a prop e a barra flutuante perto da linha 1964), `src/app/designsystem/docs/data-table.tsx` (um interruptor "Soma da seleção" no "Na tela"), `src/components/ui/table-versions.test.ts`, `AGENTS.md` (o bullet do `DataTable`: "`selectionSummary` põe a soma na barra"), `docs/design/HISTORICO-DESIGN-SYSTEM.md` (uma rodada nova)
- Modificar: `transactions-table.tsx`, que passa `selectionSummary={(rows) => <MoneyDisplay value={liquido(rows)} signed />}`

**Interfaces:** `selectionSummary?: (rows: T[]) => React.ReactNode`. Aparece depois de "N selecionadas", separado por " · ", na mesma região viva.

- [ ] **Passo 1: teste que falha** em `table-versions.test.ts`: a fonte do `DataTable` declara `selectionSummary`, e a barra o renderiza depois da contagem.
- [ ] **Passo 2:** rode e veja falhar.
- [ ] **Passo 3:** implemente. **O harness vai pedir confirmação ao editar `src/components/ui/`.** Se o dono recusar, pule a tarefa, registre "recusado" no relatório e deixe a tabela sem a prop.
- [ ] **Passo 4:** rode `npm run ds:docs-map` e os testes. Esperado: verde.
- [ ] **Passo 5:** commit `feat(ds): DataTable selectionSummary — a soma da seleção`.

### Task 8: Detalhe novo, com o bloco "a conferir" e as setas

**Arquivos:**
- Reescrever: `src/components/transactions/transaction-detail-sheet.tsx`
- Criar: `src/components/transactions/a-conferir-no-detalhe.tsx`, mais `src/lib/captura/a-conferir-acoes.ts` com a lógica tirada do wireframe: `confirmarLancamento(id)`, `lembrarCartaoDaWallet(cardId, alias)` (até 60 caracteres, lendo o alias atual) e `desfazerLote(batchId)`
- Apagar: `src/components/wireframe/a-conferir-wireframe.tsx` (só depois de nenhuma importação sobrar)
- Teste: `src/lib/captura/a-conferir-acoes.test.ts`, `transaction-detail-sheet.test.ts`; reescrever as linhas de `wireframe.test.ts` e `a-conferir.test.ts` sobre o detalhe para travar o `AConferirNoDetalhe`; manter `sheet-versions.test.ts:104` (flush)

**Interfaces:**
- Consome:
  - `TelaDeTransacoes.detalhe` (com `vizinhos`) e `duplicarComoNova`;
  - os `InstallmentPurchaseSection`/`ImpactoDaParcela` de hoje;
  - `PartesDaDespesa` e `AnexosDoLancamento` (Tarefa 9). Até lá, mantenha os wireframes deles no lugar e troque na Tarefa 9.
- Produz:
  - `<TransactionDetailSheet transaction anterior? seguinte? onNavegar(t) onEditar onDuplicar onExcluir onClose launchInEditMode />`, com a casca, o herói, a `DescriptionList`, a ordem do corpo e o rodapé de três ações da spec §8;
  - as teclas ↑/↓ e J/K fora de campo de texto, só sem edição aberta;
  - `<AConferirNoDetalhe transaction onFeito() />`, com a spec §8.3. O `AlertDialog` do "Desfazer importação" usa a cópia "Apagar os N lançamentos desta importação?".

- [ ] **Passo 1: testes que falham.**
  - `confirmarLancamento` exige 1 linha devolvida (`select("id")`), senão lança. A regra é a do wireframe.
  - `lembrarCartaoDaWallet` corta o alias em 60.
  - `desfazerLote("B")` apaga por `eq("import_batch_id","B")`.
  - Fonte: o detalhe não importa nada de `@/components/wireframe/a-conferir-wireframe` e não contém `window.confirm`.
  - Fonte: o detalhe registra o atalho de seta por `keydown` e ignora alvo `input`/`textarea`/`contenteditable`.
  - Pura: `podeNavegar(vizinhos, editando)` devolve `{anterior:false, seguinte:false}` quando `editando` é verdadeiro ou quando os vizinhos não existem (o caso da linha que saiu da lista, foco 5).
- [ ] **Passo 2:** rode e veja falhar.
- [ ] **Passo 3:** implemente e rode o `ds:audit` nos dois arquivos.
- [ ] **Passo 4:** testes e `tsc` verdes.
- [ ] **Passo 5:** commit `feat(transacoes): detalhe com herói, setas e a conferir no DS`.

### Task 9: Divisão e anexos no DS

**Arquivos:**
- Criar: `src/components/transactions/partes-da-despesa.tsx`, `src/components/transactions/anexos-do-lancamento.tsx`
- Modificar: `transaction-detail-sheet.tsx` (troca os dois wireframes)
- Modificar: `src/components/wireframe/divisao-wireframe.tsx` e `anexos-wireframe.tsx`. Mova a lógica que os dois lados usam para `src/lib/divisao/` e `src/lib/anexos.ts`, e deixe os wireframes chamando o mesmo código. Contas a pagar e Painel continuam com eles.
- Teste: `src/lib/divisao/partes.test.ts` (ampliar), `src/lib/anexos.test.ts` (se a função movida for nova ali), e manter `src/lib/bills/anexos-da-conta.test.ts` verde

**Interfaces:**
- `<PartesDaDespesa transaction />`: spec §9.3. Usa `definir_partes` (`src/lib/divisao/dados.ts:64`) e `useAdultos`. A validação da soma é a função pura `faltaParaFechar(partes: Record<string,number>, total: number): number`, que vai em `src/lib/divisao/partes.ts`.
- `<AnexosDoLancamento transaction />`: spec §9.4, sobre o `src/lib/anexos.ts`. Upload, URL assinada, popup bloqueado, cota e apagar com `AlertDialog`.

- [ ] **Passo 1: testes que falham.**
  - `faltaParaFechar({a:50,b:40}, 100) === 10`;
  - `faltaParaFechar({a:60,b:40}, 100) === 0`;
  - centavos sem erro de ponto flutuante: `{a:33.33,b:33.33,c:33.34}`, total 100 → 0.
  - Fonte: o detalhe não importa `PartesDaDespesaWireframe` nem `AnexosWireframe`.
- [ ] **Passo 2:** rode e veja falhar.
- [ ] **Passo 3:** implemente e rode o `ds:audit` nos dois componentes.
- [ ] **Passo 4:** verde, incluindo `npx vitest run src/lib/bills src/components/wireframe`.
- [ ] **Passo 5:** commit `feat(transacoes): divisão e anexos do detalhe no DS`.

### Task 10: Importar extrato em diálogo de passos

**Arquivos:**
- Criar: `src/components/transactions/importar/importar-extrato-dialog.tsx`, `src/components/transactions/importar/use-importar-extrato.ts` (a lógica de `importar-extrato-wireframe.tsx`: preparar, importar com `client_id` estável e desfazer; nenhuma regra muda) e `src/components/transactions/importar/mapear-colunas.tsx` (a versão DS de `mapeamento-csv.tsx`)
- Apagar: `src/components/wireframe/importar-extrato-wireframe.tsx`, e `mapeamento-csv.tsx` se `graphify query "mapeamento-csv"` mostrar que só o importar o usa (a conferência da fatura pode usar; nesse caso ele fica)
- Teste: `src/components/transactions/importar/use-importar-extrato.test.ts`; reescrever as linhas de `wireframe.test.ts` sobre a importação ("prepara uma vez, importa e desfaz", "importar é consumido da URL") para o hook e o diálogo novos

**Interfaces:**
- `useImportarExtrato({ workspaceId })` → `{ passo: "arquivo"|"colunas"|"conferir"|"feito"; escolherArquivo(f); modo; setModo; destino; setDestino; mapeamento; setMapeamento; previa: { itens; total; soma; periodo; categoriasNovas }; importar(): Promise<{ quantidade; loteId }>; desfazer(): Promise<void>; pendente; erro }`.
- `<ImportarExtratoDialog open onOpenChange onRevisar() />`, com a spec §9.2: `Dialog surface="auto" size="lg"`, `DialogSteps`, `dirty` + `confirmDiscard`, `pending`.

- [ ] **Passo 1: testes que falham**, portados das asserções do wireframe:
  - o `client_id` é gerado uma vez por item, e "importar" duas vezes manda os mesmos ids (sem duplicar);
  - `source` é `import_statement` para o extrato e `import_sheet` para a planilha;
  - `needs_review` é verdadeiro e o `import_batch_id` é o mesmo em todos;
  - `desfazer` apaga por `import_batch_id`;
  - as categorias que faltam são criadas antes das transações.
- [ ] **Passo 2:** rode e veja falhar.
- [ ] **Passo 3:** implemente e rode o `ds:audit` na pasta `importar/`.
- [ ] **Passo 4:** verde.
- [ ] **Passo 5:** commit `feat(transacoes): importar extrato em diálogo de passos`.

### Task 11: Campos de wireframe do formulário no DS

**Arquivos:**
- Modificar: `src/components/transactions/transaction-form-fields.tsx` (linhas 81–82, 702, 985 e 993)
- Modificar: `projetos-wireframe.tsx` e `divisao-wireframe.tsx` (tirar `ProjetoDoLancamentoWireframe`, `QuemPagouWireframe` e `PesosDaParceladaWireframe` se ficarem sem uso; `opcoesDoProjeto` vai para `src/lib/projetos/` se o formulário precisar)
- Teste: `transaction-form-layout.test.ts` (ampliar); manter `carteira-forms.test.ts` verde

**Interfaces:** o `valor`/`onChange` de hoje (`projectId`, `paidBy`, `pesosDaParcelada`), sem mudar o contrato com o `useTransactionForm`.
- Projeto: `FormField label="Projeto (opcional)"` + `Combobox` com `variant="none"` "Sem projeto".
- Quem pagou: `FormField` + `Select` dos adultos, com o `Avatar xs`.
- Pesos: um `FormInput` por adulto, com o rótulo do nome e a soma em `Caption`.
- As regras de quando aparecem não mudam: o JORNADAS "Projeto, quem pagou e as partes".

- [ ] **Passo 1: teste de fonte que falha:** `transaction-form-fields.tsx` não importa nada de `@/components/wireframe/projetos-wireframe` nem de `@/components/wireframe/divisao-wireframe`.
- [ ] **Passo 2:** rode e veja falhar.
- [ ] **Passo 3:** implemente e rode o `ds:audit` no arquivo.
- [ ] **Passo 4:** `npx vitest run src/components/transactions src/components/settings` verde.
- [ ] **Passo 5:** commit `feat(transacoes): projeto, quem pagou e pesos do formulário no DS`.

### Task 12: Montagem da página, cabeçalho, vazios, esqueleto, exportar e limpeza

**Arquivos:**
- Reescrever: `src/app/(app)/transactions/page-client.tsx` (só a composição; nenhum componente declarado ali) e `src/components/transactions/transactions-page-skeleton.tsx`
- Criar: `src/components/transactions/compartilhado-aviso.tsx`
- Apagar: `a-conferir-lista-wireframe.tsx`, `compartilhado-aviso-wireframe.tsx` e os quatro arquivos da Tarefa 4, se ainda existirem
- Modificar: `src/lib/captura/a-conferir.test.ts` e `src/lib/captura/compartilhado.test.ts` (as travas novas: `conferir=1` vira o token pelo `lerFiltrosDaUrl` e a página importa `AvisoAConferir`; a página importa `CompartilhadoAviso`), `src/components/wireframe/wireframe.test.ts` (tira o que é da tela) e `src/lib/papeis/app-do-convidado.test.ts` se reprovar
- Teste: `src/app/(app)/transactions/page-client.test.ts` (fonte)

**Interfaces:**
- Consome todas as anteriores.
- Composição (spec §4, §6.5, §11, §12):
  - `PageHeader collapse` com `PageHeaderTitle asChild` e `PageHeaderActions`: `TransactionNewSplitButton` (`primary`), "Importar" (`secondary`) e "Exportar" (`tertiary`). O convidado não vê os dois últimos.
  - `CompartilhadoAviso`.
  - `AvisoAConferir`, cujo `onRevisar` faz `setEstado({ filtros: [conferir], sort: {key:"date",dir:"desc"} })`.
  - `ResumoDasTransacoes`, `TransacoesToolbar`, `TransactionsTable` e `TransactionDetailSheet`.
  - O `AlertDialog` de excluir, como hoje.
  - `ImportarExtratoDialog` e `CategorizarEmLoteDialog`.
  - Exportar: `fetchTransacoesParaExportar` + `transacoesParaCsv` + o download por `Blob`, com o nome `transacoes-AAAA-MM-DD.csv` e o toast da spec §11.
  - O vazio da carteira tem as ações "Nova transação" e "Importar extrato".
- `<CompartilhadoAviso pedido onDismiss />`: `Alert tone="warning"`, com a cópia "Para conferir a fatura, abra o cartão e use Conferir fatura." e, no PDF, a `AlertAction` "Abrir cartões" para `/credit-cards`. A leitura do Cache Storage e a abertura do formulário com `fotoInicial` seguem iguais: porte de `page-client.tsx:213-249`.
- O esqueleto: `SkeletonGroup` com 2 a 4 `StatCard` em esqueleto, `FilterBarSkeleton` e `TableSkeleton group={false}`.

- [ ] **Passo 1: teste de fonte que falha.**
  - A página não importa nada de `@/components/wireframe/`.
  - Não declara `function` de componente além de `TransactionsPageClient`.
  - Importa `TransacoesToolbar`, `ResumoDasTransacoes` e `AvisoAConferir`.
  - Não importa `useTransactionsListController`.
- [ ] **Passo 2:** rode e veja falhar.
- [ ] **Passo 3:** implemente e apague os arquivos.
- [ ] **Passo 4:** a régua inteira, verde:
  - `npm run ds:audit -- "src/app/(app)/transactions" src/components/transactions`
  - `npx tsc --noEmit && npm run lint && npm run test:unit`
- [ ] **Passo 5:** commit `feat(transacoes): página nova montada e wireframes da tela apagados`.

### Task 13: Jornadas, Atlas, grafo e verificação no navegador

**Arquivos:**
- Modificar: `docs/JORNADAS.md`, a seção de Transações e as linhas da tabela citadas (linhas 869, 884, 886, 890, 895, 896, 898 e 899 de hoje, mais as lacunas). O conteúdo está na spec §14.
- Modificar: `docs/atlas/template.html` (a mesma jornada, as lacunas, a data e as contagens da capa)
- Rodar: `python3 docs/atlas/build.py`
- Republicar `docs/atlas/atlas-jornadas.html` no URL do Atlas (`https://claude.ai/artifact/1N43LFYP1YSVsWaRMaNTRL`) com a ferramenta Artifact. Sem a ferramenta, registre "Atlas desatualizado" no relatório.
- Rodar: `graphify update .`

- [ ] **Passo 1:** atualize o `JORNADAS.md`, seguindo a legenda e o `%%{init}%%` do topo em todo fluxograma alterado.
- [ ] **Passo 2:** atualize o template e rode o build. Esperado: o arquivo gerado sem erro.
- [ ] **Passo 3: verificação no navegador, só leitura** (`preview_start` com `dev-attach`):
  - 1440×900 e 375×812, nos temas claro e escuro;
  - os links `?card=<id>&preset=last30`, `?cats=<id>`, `?conferir=1`, `?inst=1&type=expense`, `?plan=<id>` e `?txn=<id>`, cada um com os tokens certos;
  - ↑↓ no detalhe;
  - o filtro do cabeçalho do telefone abre o "+ Filtro";
  - o importar até o passo "Conferir", **sem clicar em Importar**;
  - o console sem erro;
  - uma captura de tela de cada largura para o relatório.
  - **Nada de Confirmar, Categorizar, Excluir, Salvar, Importar ou Desfazer.**
- [ ] **Passo 4:** commit `docs(jornadas): transações redesenhada — filtros em tokens, a conferir, importar em diálogo`.
