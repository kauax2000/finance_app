# "Como foi pago" — C2 com a legenda do C3

Mockup: `docs/design/painel/graficos-de-divisao.html` (C2 e C3). Aprovado pelo dono em 21/11/2026: "o C2 com as legendas do C3".

## Por quê
Hoje o cartão corta o nome ("Bradesco Visa…"), repete no cabeçalho o total do topo da página, e com uma forma só (o caso mais comum) a rosca é um anel inteiro que só diz "100%". Nada compara com o mês anterior.

## O que muda
- O cabeçalho é só o título "Como foi pago": o total sai.
- **Duas formas ou mais:**
  - a rosca inteira de 120px, com respiro entre as fatias e as pontas arredondadas;
  - no miolo, o total do mês com "no mês" embaixo; passar o cursor numa fatia leva o miolo a ela, como já faz;
  - a legenda ao lado: o ponto, o nome inteiro (até duas linhas) e, embaixo do nome, "R$ 1.360 · +312". A diferença contra o mês anterior vem no tom do veredito (despesa: a mais é `warning`, a menos é `success`; receita inverte), ou "novo" quando a forma não existia no mês anterior. O % fica à direita.
- **Uma forma só:**
  - o anel cheio na cor da forma, com a ficha da bandeira no miolo (cartão: `CreditCardBrandChip`; outra forma: o ícone dela);
  - ao lado, "Tudo no <nome>", "N compras · R$ total" e "+R$ X vs <mês anterior>" no tom do veredito (some sem mês anterior).

## Abordagens
- A (lista com cartão e barra) e B (barra dividida) foram mostradas e preteridas pelo C2/C3.
- Construção: o design system ganha no `ChartDonut` a linha de detalhe na legenda e a forma arredondada. A tela e a lib fazem o resto.

## Fora
- Filtrar os lançamentos ao tocar numa forma.
- Os outros gráficos (C, C3, C4, C5) vão para o Painel, em outra revisão.
