# Os espaços do cartão "Do que é feito o mês" — design curto

**Por quê.** Ao lado do "Últimos 6 meses", o cartão fica com 252px de altura, mas o conteúdo ocupa só o topo e sobram uns 90px vazios. Além disso, o pedaço do fixo na barra é estreito demais e aparece sem número. O dono escolheu a combinação **A + C** do mockup `docs/design/painel/do-que-e-feito-espacos.html` (22/11/2026).

## Abordagens
- **A · Barras maiores e legenda com valores, no pé.** Escolhida.
- **B · Colunas em pé.** Recusada: muda o desenho aprovado e fica parecida com o gráfico ao lado.
- **C · "Em dezembro já entram R$ X" no pé.** Escolhida junto com a A.

## O que muda
1. **`ChartSplitCompare` ganha `size`**: `md` (32px, o padrão) e `lg` (48px). O cartão usa o `lg`. Essa mudança no DS segue a invariante 8: a prop entra na página do chart, no teste e no bullet do AGENTS.md.
2. **A legenda desce para o pé** do cartão (`mt-auto`), com uma linha por parte: a bolinha, o nome (e "· Seguro carro" com o selo "novo", quando houver) à esquerda, e o valor em `font-mono font-semibold` à direita. Assim o fixo ganha o número que não cabe na barra.
3. **Abaixo da legenda**, depois de um `Separator`, vem "Em <mês seguinte> já entram **R$ X**", só quando `fixo.proximoMes > 0`.
4. **Essa linha sai do rodapé do cartão "Já decidido"**, para não repetir. O rodapé fica só com "A última parcela acaba em".

## Fora
A conta, a frase e as listas não mudam.
