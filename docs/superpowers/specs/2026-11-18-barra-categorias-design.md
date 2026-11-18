# Barra de Categorias: mês compacto e receitas no mês — desenho

Data: 18/11/2026. Escolhas do dono: opção **A + B** dos mockups, sem aba "Todas", cartão de
receita com **recebido + previsto**.

## Por quê

A barra de Categorias (Despesas | Receitas à esquerda, o mês à direita) tem quatro problemas:

- o mês pesa mais que o tipo: são quatro peças contra duas;
- "Este mês" fica aceso mesmo quando a tela já está no mês atual;
- a barra muda de forma ao ir para Receitas, porque o mês some ali;
- o cartão de receita mostra só o nome, sem valor nenhum.

## O que muda

### A — o seletor de mês compacto (todas as telas que o usam)

```
no mês atual:                 ‹  Novembro de 2026  ›
em outro mês:  Voltar a este mês  ‹  Agosto de 2026  ›
```

- `‹ mês ›` vira uma cápsula só: um `ButtonGroup` do design system com os dois botões de
  ícone e, no meio, o gatilho que abre a `MonthGrid`, como hoje.
- "Este mês" vira **"Voltar a este mês"**, terciário, à esquerda da cápsula, e **só aparece
  fora do mês atual**.
- A mudança mora no miolo compartilhado (`MonthNavArrowControls`, em
  `src/components/categories/categories-toolbar.tsx`). Por isso valem juntos Categorias, o
  Painel (`dashboard-toolbar.tsx`), o detalhe da categoria e o painel da fatura do cartão.
- O mês no cabeçalho do telefone (`useMonthInHeader` / `MonthNavPanel`) não muda.

### B — o mês também vale em Receitas

- Em Receitas a barra mostra o mesmo seletor de mês e não muda de forma ao trocar de aba.
  O mês no cabeçalho do telefone também passa a valer nas duas abas (hoje é
  `enabled: filterType === "expense"`).
- O cartão de receita ganha o valor do mês, espelhando o de despesa, sem barra de orçamento
  e sem chip de variação:
  - **valor grande** = recebido + previsto;
  - **linha de baixo** = `Recebido R$ X · + R$ Y previstos` quando há previsto, e
    `Sem previsões no mês` quando não há (mesmo texto da despesa).
- **Recebido**: receitas lançadas na categoria, com data local no mês civil e até hoje,
  fora do cartão de crédito.
- **Previsto**: receitas lançadas com data futura dentro do mês, mais as cobranças de
  assinaturas `kind === "income"` da categoria que caem no mês e ainda não foram lançadas.
- A regra é a mesma de **Previsão** (`src/lib/previsao/fluxo.ts`: `recebidas`,
  `receitasPrevistas`, `cobrancasPorLancar`). Reaproveitar, não reescrever.
- Os dados já chegam: a consulta da tela (`fetchBudgetsAndSpend`) já busca as receitas do mês
  com folga e as assinaturas. Não entra consulta nova.
- O esqueleto do cartão de receita ganha o osso do valor.

## Abordagens

1. **Escolhida:** a cápsula sai do miolo compartilhado do `MonthNav`, composta com
   `ButtonGroup`, e as receitas do mês saem dos dados já carregados, pela regra de Previsão.
2. Criar um componente `MonthStepper` em `src/components/ui/`. Recusada: pede autorização,
   registro e página no catálogo, e é muito para uma composição de peças que já existem.
3. Uma consulta nova para as receitas. Recusada: a consulta da tela já traz os dados.

## Fora

- Aba "Todas". Misturar receita e despesa não faz sentido: os cartões têm formas
  diferentes, o total não soma, e achar uma categoria pelo nome já é papel da lupa (⌘K).
- Linha de resumo sob a barra: a análise mora no Painel.
- Variação contra o mês anterior e barra no cartão de receita.

## Restrições

- Nada muda em `src/components/ui/` nem em `globals.css`.
- "Voltar a este mês" é `tertiary`, e a cápsula segue a escada da `Toolbar` (36 no mouse,
  44 no dedo, por `--toolbar-control`).
- Dinheiro com `currencyBRL` / `MoneyDisplay` (helpers do projeto), nada formatado à mão.
- Não é mudança de jornada: rota, destino e diálogo ficam como estão.

## Fica para quem implementa

- Se a soma das receitas vira uma função pura em `src/lib/` (com teste), ao lado de
  `category-commitments.ts`, ou se reaproveita direto um pedaço exportado de `fluxo.ts`.
- O nome acessível da cápsula (`aria-label` do grupo e dos botões), seguindo os de hoje.
