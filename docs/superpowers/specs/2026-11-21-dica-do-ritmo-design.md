# A dica do "Ritmo do mês" (opção B) — design curto

**Por quê.** A dica do Ritmo do mês ("Dia 17 · novembro R$ 2.098,60 · outubro R$ 948,30") tem três problemas:
- não diz a diferença contra o mês anterior, que é o motivo do gráfico;
- cobre as duas linhas bem onde elas se afastam;
- depois de hoje, mostra só o mês anterior, sem o previsto.

O espaçamento interno também é mais apertado que o da dica do "Últimos meses" (`variant="single"`).

**Mockup:** `docs/design/painel/dica-do-ritmo.html`, opção B (o dono escolheu a B em 21/11/2026).

## Abordagens
- **A.** Valor grande e diferença embaixo, a dica enxuta. Recusada: o dono quer os dois valores.
- **B (escolhida).** As duas linhas e um rodapé "diferença".
- **C.** Sem balão, o cabeçalho lê o dia. Recusada.

## O que muda

### No design system (`ChartTooltipContent` e `ChartLine`)
1. **O respiro.** A dica padrão (várias séries) passa ao respiro da enxuta: `px-3.5 py-2.5`, e as linhas ficam a 8px uma da outra. Vale para toda dica de gráfico do app (pedido do dono: "espaçamento como no primeiro gráfico").
2. **A amostra de traço.** No `ChartLine`, a amostra de cada linha é um traço de 14px:
   - na cor da série;
   - cheio, ou tracejado quando o `config` da série tem `dashed`;
   - pontilhado quando é o previsto.
   - No lugar da bolinha.
3. **O rodapé `diferença`.** É um prop novo do `ChartLine`, a primeira série menos a segunda no ponto:
   - um fio fino em cima;
   - o rótulo "diferença" à esquerda;
   - o valor com sinal à direita, em moeda, no tom do veredito (`better`: na despesa, a mais é `warning`, a menos é `success`);
   - só aparece com as duas séries no ponto.
4. **O previsto na dica.** Num ponto em que a primeira série é `null` e o `ghost` tem valor, a linha dela vira "previsto":
   - o valor do `ghost`, a 75%;
   - o traço pontilhado;
   - a diferença sai do previsto.
5. **A posição.** Com o rodapé de diferença, a dica fica presa no topo do gráfico (`position={{ y: 0 }}`), como a enxuta, e não cobre as linhas.
6. **O cabeçalho.** O rótulo fica miúdo e cinza, como na enxuta.
7. **Os valores.** O valor da primeira série fica em `text-foreground`; os das outras ficam em `text-muted-foreground`.

### Na tela (`graficos-do-resumo.tsx`)
- O Ritmo do mês liga a diferença: `better` é `lower` na despesa e `higher` na receita.
- O rótulo vira "17 de novembro", e o dia 0 continua "início do mês".
- No dia 0 os dois valores são zero, e a diferença não aparece.

## Fora
- A dica enxuta não muda.
- O `heroi-do-seguro` (o outro `ChartLine` do app) ganha só o respiro e o traço, sem rodapé.
