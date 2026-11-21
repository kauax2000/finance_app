# "Ritmo do mês" — design curto

Data: 21/11/2026. O dono aprovou "junte o B e o C no design do A" e a correção dos rótulos da ponta, em `.superpowers/brainstorm/42393-1795272288/content/ritmo-junto.html`.

## Intenção
O gráfico existe para responder se o mês está gastando mais ou menos que o anterior, e onde vai fechar. Hoje ele não mostra nenhum número e a comparação só aparece no topo da página.

## O que muda
- **Cabeçalho:**
  - **Título:** "Ritmo do mês".
  - **Selo:** a diferença em reais contra o mês anterior no mesmo dia: "R$ 672 a menos que outubro" ou "R$ 120 a mais que outubro". Tem a mesma faixa de ±2% do selo da média, que diz "igual a outubro". O tom é `success` quando é melhor, `warning` quando é pior e neutro em "igual". Na despesa, menos é melhor; na receita, mais.
  - **Canto direito:** com o mês aberto, "deve fechar em R$ X", em que X = lançado até hoje + previsto do mês. Com o mês fechado, "fechou em R$ X".
- **Gráfico:**
  - as duas linhas de hoje: o mês em cheio na cor da categoria, o anterior tracejado e neutro;
  - **o véu:** o espaço entre as linhas, do dia 1 até hoje, na cor do selo, a 14%;
  - **o previsto:** com o mês aberto e previsto > 0, depois de hoje a linha do mês segue tracejada (60%) numa reta de "valor de hoje" até "lançado + previsto" no último dia, terminando num ponto vazado. Sem previsto, a reta é plana até o fim do mês;
  - **o fio do hoje:** um fio vertical no dia de hoje, com "hoje, dia 21" no pé. Só com o mês aberto;
  - **os rótulos nas pontas, sem legenda:**
    - "novembro · R$ 3.063" no ponto de hoje, embaixo dele, terminando no ponto;
    - "outubro · R$ 3.740" acima do fim da linha do anterior;
    - "previsto · R$ 3.063" embaixo do ponto vazado, na tinta da categoria;
  - **o eixo:** só os dias 1, 8, 15, 22 e o último;
  - sem as linhas do fundo, como os outros gráficos do resumo.
- **Dica:** a de duas séries, como hoje. As séries auxiliares (véu e previsto) não aparecem nela.

## Abordagens
A (comparação no cabeçalho, valores nas pontas), B (véu da diferença) e C (previsto até o fim). O dono escolheu as três juntas, no desenho da A.

## Decisões minhas
- O previsto não tem data por dia (é o total de parcelas e assinaturas do mês), então a linha é uma reta até o último dia, e não degraus.
- O selo compara com o mesmo dia do mês anterior, que é o que o gráfico desenha. O topo da página mostra a mesma comparação em %, e aqui ela vai em reais.
