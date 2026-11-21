# "Dias da semana" — dias úteis × fim de semana (opção C), design curto

**Por quê.** O cartão de hoje tem três problemas:
- são só barras, sem número;
- uma compra grande (os R$ 2.000 de segunda, na Carro) achata os outros dias;
- o domingo zerado some.

O dono escolheu a **C** (21/11/2026): dois números que leem de relance e uma fileira de sete quadrados com a intensidade do valor.

**Mockup:** `docs/design/painel/dias-da-semana.html`, opção C.

## Abordagens
- **A.** O dia em destaque e as barras com o valor. Recusada.
- **B.** Contar compras, com uma chave para o valor. Recusada.
- **C (escolhida).** Dias úteis × fim de semana, e uma fileira de calor.

## Como fica
1. **Os dois números.** Ficam lado a lado, com 16px entre eles.
   - **Dias úteis** (seg a sex): o % em `text-xl font-semibold`; embaixo, "dias úteis · R$ 2.890" em `text-muted-foreground`.
   - **Fim de semana** (sáb e dom): a mesma forma, "fim de semana · R$ 172".
   - O lado de **maior** valor fica com o número em `text-foreground`; o menor, com o número em `text-muted-foreground`.
   - Os dois % somam 100, com o arredondamento do `splitPercents`.
   - Com um lado em zero, ele mostra "0%" e "R$ 0".
2. **A fileira.** Sete quadrados iguais, de seg a dom, com 6px de vão e o dia abreviado embaixo (`text-xs`, muted).
   - Cada quadrado tem a cor da categoria (`corDaSerie`) com opacidade proporcional ao valor do dia sobre o maior dia. O piso é 12% para dia com valor, e o maior dia fica a 100%.
   - O dia zerado é um quadrado vazio, com borda tracejada em `--border`, sem cor.
   - O raio é o degrau da escala que serve ao quadrado (`rounded-row`, 12px).
   - **Dica:** ao passar o cursor ou tocar num quadrado, aparece a dica enxuta do DS: o dia por extenso ("Segunda"), o valor e a % do mês.
   - **Acessível:** a fileira tem `role="img"`, com um `aria-label` que lista os sete dias e valores, e passa pela tabela de dados do `ChartFrame`, se a peça a usar.
3. **Fora:** as barras.

## No design system
O `ChartHeatmap` é o calendário de semanas e não serve. Nasce no `chart.tsx` a **`ChartHeatStrip`**: uma fileira de N células com intensidade pelo valor. Ela recebe:
- `data`, `nameKey`, `dataKey`;
- `color` (a cor cheia da intensidade);
- `label`;
- `format`;
- `labelText`, opcional (o nome por extenso na dica).

Ela segue a invariante 8: entra com a página de docs (o exemplo dos dias da semana), o teste e uma linha na seção "Gráficos" do `AGENTS.md`.

A intensidade é cor sob nenhum texto: o dia fica embaixo, fora da célula. Entra também na seção de exceção "cor da pessoa só em traço, área e destaque de barra" do `AGENTS.md`, como "célula de calor".
