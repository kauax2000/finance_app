# Resumo de "Do que é feito o mês": o insight em cima e o seu normal × este mês — design curto

**Por quê.** O dono achou o cartão de resumo carregado de texto e pediu algo mais visual. Escolheu a opção **G** do mockup `docs/design/painel/do-que-e-feito-visual.html` e pediu que o texto vá para **um cartão de insight separado, em cima** (22/11/2026).

## Abordagens
- **G · Seu normal × este mês (escolhida).** Duas barras empilhadas, divididas em "o que você controla" e "já decidido".
- **H · O mês em blocos.** Recusada: a variação fica escondida numa pílula.
- **I · Barras do que subiu e do que caiu.** Recusada pelo dono.
- As rodadas só de texto (A–F) foram recusadas por terem texto demais.

## O que muda
1. **Cartão de insight, em cima.** Fica no lugar do resumo de hoje e tem a mesma forma do `InsightDaCategoria`:
   - um `Item variant="outline"` com o `ItemMedia variant="tile"`;
   - o tom e o ícone seguem a direção do que você controla, ou do total quando ele não saiu do normal: `warning` (`ExclamationTriangleIcon`) quando subiu o gasto ou caiu a entrada, `success` (`CheckCircleIcon`) no caso contrário, `info` (`LightBulbIcon`) no normal ou sem média;
   - o texto é a frase de `fraseDaComposicao`.

   Para cortar texto, a frase **perde o fim que repete a faixa**: some ", e o mês ficou N% acima/abaixo da média" (e "…dentro da média") no caso em que começa pelo variável. "As parcelas caíram" vira "As parcelas caíram." Os testes da frase seguem a mudança.
2. **Cartão "Do que é feito o mês"**, com o desenho G:
   - **No título**, à direita, um selo com a variação do total ("+23%" ou "−4%"), no tom da regra de despesa, e nenhum selo sem média.
   - **Linha "seu normal"**: uma barra tracejada (fundo listrado em tokens), dividida em normal do variável e normal do fixo, com o valor escrito dentro do pedaço que couber.
   - **Linha com o nome do mês** ("novembro"): a barra cheia, com o variável na cor da categoria e o fixo cinza. Dentro de cada pedaço vão o valor e a variação contra o normal ("R$ 3.140 ↑ 14%"), sem a variação quando ela está dentro de ±5%. Um pedaço estreito demais mostra só o valor, ou nada.
   - **As duas linhas na mesma escala**: a maior das duas ocupa a largura toda, e a outra fica proporcional (na Carro, o normal fica em 81%).
   - **Legenda embaixo**: "● O que você controla" e "● Já decidido · <o fixo novo, quando houver>".
   - **Sem média** (menos de 2 meses): não há linha do normal nem selo; fica só a barra do mês.
   - **Só um lado no mês**: a barra tem um pedaço só.
   - O rótulo de cada linha fica numa coluna estreita à esquerda. A 375px, a coluna fica acima da barra ou encolhe, e o texto de dentro cai para só o valor.
3. **A peça do desenho vai para o DS** (autorização permanente do dono). Ela estende o `ChartSplit` ou cria uma peça irmã (`ChartSplitCompare` ou similar) com:
   - linhas rotuladas;
   - a escala comum;
   - a variante tracejada;
   - o rótulo dentro do segmento.

   A peça segue a invariante 8: registry, página de docs, teste e bullet no AGENTS.md. Os nomes acessíveis listam os valores das duas linhas.
4. As duas listas de baixo ("O que você controla" e "Já decidido") **não mudam**.

## Fora
A conta da composição e as listas. Nenhum caminho muda.
