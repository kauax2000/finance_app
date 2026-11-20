# Detalhe da categoria — redesenho

Data: 20/11/2026 · Rota: `/categories/[categoryId]?type=&month=`

## Intenção

Quem entra numa categoria quer **entender os gastos dela e ter todas as
informações daquela categoria num lugar só** (palavras do dono). A tela é o
raio-X de uma categoria: quanto, onde, quando, com quem e por quê. O Painel
continua com a visão geral da carteira; a análise aprofundada de **uma**
categoria mora aqui. Isso refina a regra "o Painel concentra a análise": a
análise da carteira é do Painel, a da categoria é desta tela.

O dono pediu para não partir da tela atual: estrutura, ordem e peças são
novas. Comportamentos que já funcionam (editar, excluir, limite, lista de
lançamentos com a categoria travada) são reaproveitados.

## Objetivos

A tela responde, nesta ordem de importância (aprovado pelo dono):

1. **Como estou neste mês** — quanto gastei, quanto sobra ou estourou do
   limite, e a projeção até o fim do mês com o que ainda vai cair (parcelas e
   assinaturas previstas).
2. **Isso é normal?** — comparação com o **mesmo ponto** do mês anterior (não
   o mês inteiro) e com a média dos últimos 6 meses.
3. **Histórico** — 12 meses em barras, com a linha do limite.
4. **Onde e quem** — divisão por cartão/forma de pagamento e por membro da
   carteira (`paid_by`).
5. **Para onde vai** — os maiores gastos do mês e as descrições que mais se
   repetem ("iFood · 14×").
6. **O que já está comprometido** — parcelas e assinaturas da categoria, e o
   que ainda cai neste mês.
7. **Peso** — % que a categoria representa no gasto (ou receita) da carteira
   no mês.
8. **Lançamentos do mês** — a lista inteira.
9. **Ações** — editar, definir/mudar limite, novo lançamento, excluir.

**Categoria de receita**: os itens 1 e 6 viram "quanto entrou" e "quanto ainda
vai entrar"; sem limite, o 1 é só o total e o previsto; o 4 e o 5 valem igual.

## Não objetivos

- Mudar o banco, a RPC ou a regra do mês da fatura do cartão.
- Orçamento histórico por mês (o banco só traz o limite do mês aberto; ver
  "Limites conhecidos").
- Mexer na lista de Categorias, no formulário de categoria ou no Painel.
- Insights por IA, metas, alertas novos.

## Anti-objetivos (falha mesmo funcionando)

- Um número que não bate com o da lista de Categorias ou do aviso de
  orçamento. Todo total sai de `buildCategoryCommitmentsForMonth` e da
  atribuição pelo mês do fechamento da fatura, as mesmas de hoje.
- Uma parede de gráficos sem resposta clara: o topo diz em uma linha como está
  o mês, como no Monzo ("sobra R$ 640 de R$ 2.000").
- Componente novo, cor crua ou markup solto na tela (invariantes do
  `AGENTS.md`).
- No telefone, rolar uma tela enorme para achar os lançamentos.

## Abordagens consideradas

1. **Reescrever a tela com o que já existe — escolhida.** Mesma RPC
   (`rpc_fetch_category_detail_bundle`), contas novas em funções puras
   testadas no navegador, peças do design system. Sem migração: pode ir a
   `main` junto com a 2.0 sem quebrar o front antigo.
2. Reescrever e levar as contas para uma RPC nova. Menos dado trafegado, mas
   migração nova, duas versões da RPC durante a 2.0 e a regra do mês da
   fatura duplicada em SQL (hoje ela é uma só, travada pelos vetores
   dourados). Recusada.
3. Reformar as peças atuais aos poucos. Herda a estrutura que o dono pediu
   para ignorar. Recusada.

## Layout (opção B, escolhida no navegador)

**Desktop (≥ 768px)** — duas colunas sob o `PageHeader collapse`:

```
┌ Alimentação                         ‹ novembro ›   + Lançar  ⋯ ┐
├──────────────────────────────────────┬──────────────────────────┤
│ R$ 1.360  sobra R$ 640 de R$ 2.000   │ Lançamentos (32)         │
│ ████████████░░░┆┆┆  previsto R$ 1.600│ 18 nov  iFood      -48   │
│ [▲12% vs mesmo dia de out] [média…]  │ 17 nov  Mercado   -312   │
│ [23% do total]                       │ …                        │
│ Últimos 12 meses  ▆▇▅█▇▆▇▅█▆▇▆ ┄┄┄  │ (rola na própria coluna, │
│ Onde e quem      │ Maiores/repetidos │  presa sob a barra)      │
│ Comprometido (parcelas, assinaturas) │                          │
└──────────────────────────────────────┴──────────────────────────┘
```

A coluna da análise é a mais larga (~3/5); a dos lançamentos fica presa
(`sticky` sob `--top-bar-bottom`) e rola sozinha.

**Telefone** — subpágina: o nome sobe à barra ao rolar e o mês fica no
cabeçalho (`useMonthInHeader`), como hoje. O topo da tela é o bloco "como
estou neste mês"; logo abaixo, `Tabs` com **Resumo** e **Lançamentos (32)**.
Resumo empilha os itens 2 a 7; Lançamentos é a lista. As ações (editar,
excluir, limite) ficam no ⋯; "+ Lançar" continua no "+" da barra de baixo.

## Partes do como já decididas

- **Dados**: `useCategoryDetailBundleQuery` como está. A RPC já devolve os
  lançamentos com `to_jsonb(t)` (inclui `paid_by`, `payment_method`,
  `payment_credit_card_id`, `description`), 12 meses em `series_rows`,
  parcelas, assinaturas, cartões e somas da carteira.
- **Contas novas** em funções puras num arquivo de `lib/` (sem `cva`), cada
  uma com teste: comparação com o mesmo ponto do mês anterior, média de 6
  meses, divisão por forma de pagamento/cartão, divisão por membro, maiores
  gastos, descrições repetidas, projeção do mês. O total do mês continua o
  `committedTotal` de `buildCategoryCommitmentsForMonth`.
- **Peças**: tudo do design system — `PageHeader`, `StatCard`/`Progress`
  (com `projected` para o previsto e `bands` de orçamento), `ChartContainer`
  com barras e `ChartReferenceLine` para o limite, `ChartBarList`
  para as divisões, `Item`/`DescriptionList` para maiores e comprometido,
  `Tabs` no telefone, `Card padding="none"` nos painéis, `EmptyState`.
- **Reaproveitados**: o diálogo de editar/excluir (`CategoryDetailDialogs` e a
  lógica de salvar), a lista de lançamentos com a categoria travada
  (`useTransactionsListController` + `CategoryEmbeddedTransactions`, ou o
  `DataTable` que ela já usa) com "Ver em Transações" e abrir o detalhe.
  Os componentes visuais antigos de `detail/` (hero, resumo, tendências,
  esqueleto) são apagados.
- **Esqueleto** novo na forma da tela (as duas colunas no desktop, topo + abas
  no telefone), no `loading.tsx` e no `AdiarMontagem`.
- **Convidado** (`isAdulto` falso) só lê: sem ⋯ de editar/excluir/limite.
- **Jornada**: o mapa muda (abas no telefone, blocos novos), então
  `docs/JORNADAS.md` seção 9, o template do Atlas e a republicação entram na
  mesma mudança.

## Decisões da revisão (calls do autor, conferir)

- **O número do topo é o lançado**, não o comprometido: `postedTotal` de
  `buildCategoryCommitmentsForMonth`, o mesmo que o aviso de orçamento
  (`gastoDaCategoriaNoMes` no `evaluate-budgets`) soma. "Sobra" = limite −
  lançado; o previsto (parcelas + assinaturas) aparece à parte, como o
  trecho `projected` do `Progress`. O tom de estouro olha o lançado; o
  previsto que passaria do limite vira o aviso "com o previsto, passa em R$ X".
  (A tela de hoje usava `limite − committedTotal`; muda de propósito.)
- **Receita** usa `receitasDoMesPorCategoria`, a mesma conta da lista de
  Categorias, para os números baterem.
- **"Mesmo ponto do mês anterior"**: os lançamentos que contam no mês anterior
  pela mesma atribuição de mês (fatura pelo fechamento), cortados pela **data
  da compra** até o mesmo dia do mês. Mês aberto já fechado (passado): mês
  inteiro contra mês inteiro, e o texto diz "vs outubro".
- **Média de 6 meses**: os 6 meses **completos antes** do mês aberto, mês sem
  gasto conta zero, e só a partir do mês de criação da categoria (com menos de
  2 meses de histórico, o bloco não mostra média).

- **Coluna de lançamentos no desktop (decisão do dono, opção A)**: lista
  simples montada com `Item` (data, descrição, valor; agrupada por dia), sem
  seleção nem deslize. Tocar numa linha abre o detalhe do lançamento (o mesmo
  de hoje); no pé, "Ver em Transações" (`/transactions?cats=id`, com o mês).
  A `DataTable` **não** muda. No telefone, a aba Lançamentos usa a lista que
  já existe (`CategoryEmbeddedTransactions`), que lá já vira o gêmeo do
  telefone pela largura da tela.

## Limites conhecidos

- A linha do limite no histórico usa o limite do mês aberto para os 12 meses
  (o banco não traz os limites antigos). Rotular como "limite atual".
- `series_rows` não traz descrição: "descrições repetidas" e "maiores gastos"
  valem só para o mês aberto.

## Deixado ao construtor

- Ordem fina dos blocos dentro de Resumo e as peças exatas de cada bloco,
  dentro do catálogo (`npm run ds:catalog`).
- Quantos itens mostrar em "maiores" e "repetidos" (sugestão: 5 e 3).
- Textos e estados vazios de cada bloco.
- Se faltar peça (ex.: barra com limite dentro do `StatCard`), **parar e
  perguntar** ao dono antes de criar ou mudar componente em `ui/`.
