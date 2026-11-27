# Resumo do mês num cartão (detalhe da categoria, telefone) — design curto

Data: 27/11/2026 · Escolha do dono: opção **B2** ("num cartão"), caminho **1** (compor peças que já existem), "coloque tudo o que tem hoje no card".

## Intenção

No telefone, o topo do detalhe da categoria é centrado (`PageHeader phone="hero"`) e a faixa logo abaixo (`ResumoDoMes`) é alinhada à esquerda, solta. A barra sem limite mede o peso na carteira, mas nada diz isso perto dela, e o "26% do gasto da carteira" mora num chip separado. O objetivo é separar "quanto" (o topo) de "como está indo" (um cartão), sem perder nenhuma informação de hoje.

## Objetivos

- O topo fica: ladrilho, nome, valor, "gasto em <mês>" e a comparação com o mês anterior num chip (seta colorida, o resto em cinza, com o valor do mês anterior: "↑ 10% que no mesmo dia de outubro · R$ 3.740").
- Tudo o que a faixa mostra hoje vai para um `Card`, na mesma ordem de leitura:
  - em cima, o que a barra mede: com limite, a frase do limite ("**Sobra R$ 320** de R$ 1.500" / "**Passou R$ X** do limite de R$ Y") e, no mês aberto, "dia 27 de 30" à direita; sem limite, "**26%** do gasto da carteira" e "de R$ 15.820" (o total da carteira) à direita;
  - a barra (`BarraDoMes`, como hoje: limite com previsto, cortes e ritmo; sem limite, o peso);
  - embaixo, no mês aberto, "Deve fechar em **R$ X** · …" (`LinhaDoFechamento`, igual a hoje);
  - por último, em cinza: o aviso do limite ("Com o previsto, passa R$ X", no tom de aviso), "Ainda vem R$ X" (mês fechado com previsto, como hoje) e o peso na carteira quando ele não está em cima (com limite).
- Mês fechado: sem "dia N de M" e sem "Deve fechar"; a comparação diz "que em <mês>".
- Receita: "Recebido em", "da receita da carteira", mesma forma.

## Não objetivos

- O desktop não muda (`FaixaDoMes` e o `ResumoDoMes destaque`).
- Nenhum componente novo nem mudança em `src/components/ui/` ou `globals.css`.
- Nenhum texto novo além de "de R$ <total da carteira>" e "dia N de M".

## Antiobjetivos

- Sumir com alguma informação que a tela mostra hoje.
- Uma barra sem dizer o que mede.

## Abordagens

1. **Compor peças existentes na tela** (escolhida): `Card` (outline, padding md) + `Progress` com `ProgressHeader`/`ProgressLabel`/`ProgressValue` no `header` (como o tile do cartão de crédito), frases com `Muted`/`P`, chip com `Badge`. Mexe só nos arquivos do detalhe.
2. Peça nova `ProgressCard` no design system — recusada pelo dono agora: só esta tela usaria.

## O como decidido

- `ResumoDoMes` (ramo do telefone, `src/components/categories/detail/resumo-do-mes.tsx`) passa a devolver o `Card`. O `PageSection` com `aria-label` fica em volta.
- O `header` do `Progress` leva a linha de cima; o nome acessível da barra continua dizendo o valor e o limite (ou o total).
- `TopoDaCategoria` (`topo-da-categoria.tsx`) troca a `Caption` única por "gasto em <mês>" (`Caption`) e o chip (`Badge` neutro, a seta com o tom de hoje: `text-success` / `text-destructive`). O texto do chip sai de `fraseDaComparacao`, com o valor anterior depois de " · " em vez de entre parênteses.
- O total da carteira é `lancado / pesoNoTotal`, a mesma conta da `BarraDoMes`.
- "dia N de M" sai do `hojeYmd`/`yearMonth` que a página já tem.
- O esqueleto do detalhe (`category-detail-skeleton.tsx`) ganha a forma do cartão.

## Para quem constrói

- Espaçamentos internos, degraus de texto e o tamanho do `Badge`, dentro do design system.
- Testes de fonte nos moldes de `topo-da-categoria.test.ts`.

Mockup: `.superpowers/brainstorm/19306-1795789822/content/topo-b2-tudo.html` (indicativo).
