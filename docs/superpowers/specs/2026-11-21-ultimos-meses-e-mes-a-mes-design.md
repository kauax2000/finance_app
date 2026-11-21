# "Últimos meses" (B) e "Mês a mês" (A) — design curto

Data: 21/11/2026. Mockup aprovado: `.superpowers/brainstorm/75919-1795230631/content/doze-meses-opcoes.html`. O dono decidiu: "faça o B" no lugar do primeiro gráfico de "Como o mês andou", e "o A é adicionado na seção como mais um gráfico".

## Intenção
O cartão de hoje diz "12 meses" e mostra 7, não mostra valor nenhum sem toque, a média não tem rótulo e o primeiro mês não aparece no eixo. Quem abre a categoria quer ver de relance quanto foi o mês e como ele se compara, e poder ir a outro mês.

## O que muda
1. **"Últimos meses" (B)**, no lugar do cartão "Últimos 12 meses":
   - **Cabeçalho:** a legenda pequena com o mês ("Novembro"), embaixo o valor grande do mês (o total da série no mês aberto) e, ao lado, um selo com a comparação com a média ("+5% vs média", em âmbar acima e verde abaixo, numa faixa de ±2% que diz "na média", em neutro). À direita, o título "Últimos meses" em cinza.
   - **Gráfico:** a área de hoje, na cor do ladrilho, com três marcas:
     - a linha da média com o rótulo "média R$ 2.907" escrito nela, à esquerda;
     - o maior mês com um ponto vazado e o rótulo "out · R$ 3.740 (maior)";
     - o mês aberto com o ponto cheio, que já existe.

     Todos os meses aparecem no eixo, inclusive o primeiro.
   - **Sem média:** sem selo e sem a linha. **Com um só mês:** sem a marca de maior.
2. **"Mês a mês" (A)**, um cartão novo na seção, numa linha própria e na largura toda, depois da linha dos três cartões pequenos:
   - **Título:** "Mês a mês", com "desde <mês>" ao lado. À direita, a legenda "toque num mês para abrir".
   - **Barras:** uma por mês, da mesma série. O mês aberto na cor do ladrilho e os outros no neutro. O valor aparece só em cima da barra do mês aberto.
   - **Mês pela metade:** o primeiro mês com gasto, quando a série começa depois do início da janela, é desenhado tracejado (só contorno). É o mês em que a categoria começou a ser usada.
   - **Média:** a mesma linha com o rótulo.
   - **Toque numa barra:** abre aquele mês nesta tela (`?month=YYYY-MM`, mantendo o `type`). Tocar no mês aberto não faz nada.

## Regras
- A comparação do selo segue `vereditoDaMedia` (já usada na faixa do mês) para não dizer outra coisa que a faixa.
- Os valores dos rótulos vão em reais inteiros (`reaisInteiros`), como no mockup. O valor grande do cabeçalho vai com centavos.
- Nada muda no cálculo da média (o mês pela metade continua contando). Tirá-lo da média é outra decisão, ainda não tomada.

## Abordagens consideradas
- A (barras tocáveis), B (área com número), C (área + rodapé de números), D (A + C com chave). O dono escolheu B no lugar do gráfico de hoje e A como gráfico extra.

## O que o design system ganha (autorização permanente, invariante 6)
- `ChartReferenceLine label`: o texto escrito na linha, à esquerda, sobre a superfície do gráfico.
- `ChartReferenceDot`: um ponto (vazado) com rótulo acima, para marcar um valor na série.
- `ChartBars valueLabels="selected"`: o valor só na barra selecionada.
- `ChartBars partial`: lista de valores de `x` desenhados só com contorno tracejado.

Cada um com docs na página do `Chart` e teste em `chart-versions.test.ts`.

## Decisões minhas
- O "Mês a mês" fica numa linha própria, na largura toda, depois dos três cartões pequenos. É "mais um gráfico" sem tirar nenhum do lugar.
- O título do B diz "Últimos meses" (não "12") porque a série pode ter menos.
