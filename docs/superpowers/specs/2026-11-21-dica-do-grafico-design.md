# Dica do gráfico com uma série — design curto

Data: 21/11/2026. O dono escolheu a opção A em `.superpowers/brainstorm/75919-1795230631/content/dica-do-grafico.html`.

## Intenção
A dica de hoje, num gráfico de uma série só, repete o nome da série ("● Carro"), abrevia o mês ("set") e não diz como o ponto foi. A pessoa passa o cursor (ou toca) para entender um mês, e precisa do valor e da comparação.

## O que muda (vale para todo gráfico do app com uma série só)
- **Forma enxuta, automática:** área, linha ou barras com uma série só, sem `formatter` nem `share`. A dica tem:
  - o rótulo do ponto em cima, miúdo e em cinza;
  - o valor embaixo, maior (`text-base`, mono, semibold);
  - sem bolinha e sem o nome da série.
- **Linha de comparação** embaixo do valor, miúda, só com as partes que existirem, separadas por " · ":
  - **contra a referência**, quando a forma recebe `tooltipReference`. Exemplo: "+21% vs média". O percentual vai no tom do veredito (`warning` quando é pior, `success` quando é melhor, segundo `better`).
  - **contra o ponto anterior**, quando a forma recebe `delta`, que já existe. Exemplo: "+10% vs agosto". Em tinta neutra.
- **Rótulo legível:** `tooltipLabel(x)` troca o rótulo do eixo pelo da dica, nela e na comparação com o anterior. Exemplo: "set" vira "Setembro" e "ago" vira "agosto".
- **Posição:** em área e linha de uma série, a dica fica presa ao topo do gráfico (`position={{ y: 0 }}`) e segue o cursor só na horizontal, para não cobrir a curva embaixo.

## Na tela (detalhe da categoria)
- **"Últimos meses":** `delta`, `tooltipReference` (a média, `better` "lower" na despesa e "higher" na receita) e `tooltipLabel` com o mês por extenso.
- **"Mês a mês":** o mesmo.
- **Os outros gráficos de uma série** ganham a forma enxuta automaticamente, sem comparação.

## Decisões minhas
- A forma enxuta é automática para uma série só, sem prop. É o que o dono aprovou para "todo gráfico com uma linha só".
- Duas séries ou mais (o Ritmo do mês, por exemplo) continuam como hoje.
