# Lançamentos do mês no detalhe da categoria — a tabela de Transações

Data: 24/11/2026 · Opção escolhida pelo dono: **A** (mockups em `.superpowers/brainstorm/…/lancamentos-opcoes.html`).

## Por quê

O bloco "Lançamentos do mês" de `/categories/[id]` ainda é a `TransactionsTable` antiga, com o
`TransactionsToolbar` e os chips antigos: colunas Tipo e Categoria repetidas, lápis e lixeira em
toda linha, outro filtro e outro telefone. Transações já usa a `TransacoesTabela` sobre o
`DataTable`. O dono quer a mesma tabela aqui, e a regra de nunca montar tela com peça já
substituída.

## Objetivo

O detalhe da categoria mostra os lançamentos do mês com **a mesma tabela de Transações**: por dia
com o total do dia, a `FilterBar`, a seleção com barra de lote, o ⋯ e o menu de contexto, o
telefone em lista agrupada com deslizar e toque longo, as projetadas apagadas e sem clique.

Não-objetivos: mudar a tabela de Transações; trocar o resumo do Painel
(`dashboard-recent-transactions.tsx`, que também usa a `TransactionsTable` antiga, fica para
outra tarefa); mudar a análise do detalhe.

Anti-objetivos: a lista não pode discordar do "Gasto em novembro" da página (as linhas vêm da
mesma fonte); nenhuma tabela, barra ou chip escrito à mão; o filtro de categoria e o de período não
aparecem (a página já fixa os dois).

## Abordagens consideradas (o "como" da opção A)

1. **Estreitar o contrato da `TransacoesTabela` e dar a ela uma fonte em memória** (escolhida).
   A tabela passa a receber um tipo `FonteDaTabela` (só o que ela lê do `tela`); Transações
   continua passando o `tela`, que já o satisfaz. O detalhe monta a fonte com as linhas do mês
   que a página já tem, filtradas, ordenadas e paginadas no cliente.
2. **Reusar `useTransacoesDaTela` com o banco filtrando categoria e mês.** Menos código novo, mas
   perde as projetadas (parcelas e assinaturas previstas) e as linhas do ciclo do cartão que o
   pacote do mês traz: a lista discordaria do total da página. Recusada.
3. **Copiar a tabela para um componente da categoria.** Duas tabelas de novo. Recusada.

## Desenho

### 1. `TransacoesTabela` com contrato estreito

- Novo tipo exportado `FonteDaTabela` em `transacoes-tabela.tsx`: `estado`, `setEstado`,
  `pagina` (`transactions`, `totalCount`, `isLoading`, `isFetching`, `error`, `refetch`),
  `workspaceAux` (`invoicePayments`, `workspaceHasTransactions`), `categories`,
  `detalhe.abrir`, `invalidar` e `pedidosDeAbertura.setImportar` opcional.
- A prop `tela` passa a ser `FonteDaTabela`. `TelaDeTransacoes` a satisfaz sem mudança.
- Nova prop `semCategoria` (padrão `false`): tira a coluna só-telefone "Categoria" da legenda do
  gêmeo (todas as linhas são da mesma categoria). O ladrilho da descrição fica.
- Sem `pedidosDeAbertura.setImportar`, o vazio "Seu primeiro lançamento" não mostra "Importar
  extrato".
- `id` e `aria-label` do `DataTable` viram props com o padrão de hoje ("transactions",
  "Transações"), para o detalhe dizer "Lançamentos de <categoria>".

### 2. Fonte da categoria: `useLancamentosDaCategoria`

Hook novo em `src/components/categories/detail/use-lancamentos-da-categoria.ts`, devolve uma
`FonteDaTabela` mais o que o bloco precisa.

- **Linhas**: despesa usa `expenseMonthRows` (o pacote do mês, com as projetadas); receita usa os
  `txs` postados do mês que o pacote já traz. O `useTransactionsListController` deixa de buscar a
  lista (`skipListQuery` sempre verdadeiro).
- **Estado local** (não vai à URL, a URL da página é o mês): `filtros`, `q` vazio, `sort`
  (padrão data desc) e `page`. Trocar de mês zera filtros e volta à página 1.
- **Filtro no cliente**: função pura nova `filtrarNaMemoria(linhas, estado)` em
  `src/lib/queries/transacoes-filtradas.ts`, ao lado do `aplicarFiltros`, com a **mesma
  semântica** campo a campo (descrição contém sem diferenciar caixa, como o `ilike`; valor nos cinco modos com
  `approxRange`; pagamento, cartão, pessoa, pagou, projeto por lista com "é"/"não é"; conferir;
  parcelada com "Todas"; recorrente; assinatura). Período e categoria são ignorados aqui. Testes
  espelham os do `aplicarFiltros`.
- **Ordenação e página no cliente**: data (com `created_at` e `id` desempatando) ou valor;
  `PAGE_SIZE` o mesmo de Transações.
- **Campos da barra**: os de `useCamposDeFiltro(tipo)` menos `categoria` e `periodo`.
- **Detalhe, editar e excluir**: continuam no que a página já monta hoje
  (`TransactionDetailSheet`, `TransactionFormDialog`, `ExcluirLancamentosDialog`, via o
  controlador da página). `detalhe.abrir` chama a abertura do detalhe que existe;
  `onEditar` abre o detalhe em modo edição; `onExcluir` abre a confirmação de exclusão.
  `invalidar` invalida `transactions` da carteira (o pacote do mês recarrega).

### 3. O bloco na tela

`CategoryEmbeddedTransactions` é reescrito em volta da `TransacoesTabela`:

- A barra (`toolbar.start`): o rótulo "Lançamentos do mês" (o mesmo de hoje), a `FilterBar`
  (`overflow="menu"`, contagem do filtrado) e, na ponta, **"Ver em Transações"**.
- **"Ver em Transações"** abre `/transactions` com `f=periodo:is:<1º dia>:<último dia>,
  categoria:is:<id>` mais os filtros ligados na lista (pelo `escreverFiltrosNaUrl`, o mesmo
  formato que o cartão "Quem gastou" já usa). É ação única na barra: `secondary`, pela regra de
  ação sem `primary`.
- No telefone o filtro fica **na barra do bloco**, não no cabeçalho (o cabeçalho do detalhe leva
  o mês, regra já registrada no AGENTS.md).
- Saem: `TransactionsToolbar`, `TransactionsActiveFiltersChips`, `TransactionsTable`, a forma
  `lista` e todo o estado de filtro antigo que só eles usavam.

### 4. Quem já mexe na lista

- "Ver <grupo>" da Leitura do mês e o insight "Ver os dois na lista": em vez de
  `setFilterDescriptionQuery`, põem o token `descricao:is:<nome>` no estado da fonte e rolam até
  `LANCAMENTOS_DO_MES_ID`.
- Insight "Ver os dois" (concentração): ordena por valor desc, página 1, e rola.

### 5. Jornada

Muda o destino de "Ver em Transações" (de `?cats=id` para `?f=periodo…,categoria…`) e o filtro da
lista: atualizar `docs/JORNADAS.md` (seção 9, nó `phoneTabs` e a linha do Detalhe),
`docs/atlas/template.html`, rodar `python3 docs/atlas/build.py` e republicar o Atlas.

### 6. Vazios e telefone (decisões de quem escreveu, para o dono conferir)

- **Filtro sem resultado no telefone**: a barra do bloco **fica à vista** (o detalhe não publica
  o filtro no cabeçalho). A `TransacoesTabela` ganha uma prop para isso (ex.:
  `filtroNaBarra`), e o "Editar filtros" do vazio abre o "+ Filtro" da `FilterBar` do bloco, por
  callback (`onEditarFiltros`). Sem as props, Transações segue igual.
- **Mês sem lançamento na categoria, sem filtro**: a tabela aceita um `vazio` próprio. O detalhe
  mostra "Nenhum lançamento em <mês>" com "Nova transação", que abre o formulário como hoje
  (`openDialog` do controlador), sem pré-preencher a categoria.
- **Receita**: a lista mostra todo lançamento da categoria no mês, inclusive os de data futura já
  lançados (como Transações mostra). Receita prevista de assinatura não vira linha (não existe
  como linha hoje).
- **"Ver em Transações" por datas do mês**: as compras no cartão contam pelo ciclo da fatura no
  bloco, e Transações filtra por data. O link de hoje já filtra por data; segue assim, como o
  "Quem gastou".

## Restrições

- Peças só do design system atual; nada de componente em `src/app/`.
- O detalhe da categoria segue com o `AdiarMontagem` e o esqueleto dele (o esqueleto do bloco
  passa a ser o do `DataTable`/`TableSkeleton`, se o atual for da tabela antiga).
- Banco de produção no dev: testar sem gravar (abrir detalhe, filtrar, ordenar, selecionar;
  não excluir nem salvar).

## Deixado ao construtor

- Nome exato dos tipos e arquivos novos, e se `filtrarNaMemoria` mora em
  `transacoes-filtradas.ts` ou num arquivo irmão.
- A variant do "Ver em Transações" pela regra do cabeçalho (ação única: `secondary`).
- Apagar arquivos antigos que ficarem sem importador (conferir com `grep` antes).
