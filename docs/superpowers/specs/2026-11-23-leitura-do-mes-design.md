# "Leitura do mês": o cartão de insight do detalhe da categoria — design curto

**Por quê.** O dono quer que o cartão de cima, a frase sobre o mês, tenha cara de insight: uma leitura que o app preparou para a pessoa, com menos parágrafo, os motivos visíveis e o que fazer em seguida. Das rodadas de mockup, escolheu o **I1** (`docs/design/painel/insight-do-mes-v3.html`, que também aparece em `insight-do-mes-v4.html`) em 23/11/2026.

## Abordagens
- **I1 · Insight da marca (escolhida).** Brilho da marca na borda, manchete serifada, motivos com régua e uma sugestão com ação.
- **I2 · Véu âmbar com lâmpada.** Recusada.
- **I3 · Citação sem cartão.** Recusada.
- **J1, J2 e J3** (as evoluções do I1). O dono preferiu o I1 como estava.

## O cartão
1. **Moldura:** `Card variant="brand"`, o brilho da marca na borda (a família "Brilho" do AGENTS). Ele é **a peça de marca da tela**: confira que nenhuma outra peça de marca aparece no detalhe da categoria. Nenhuma cor da marca vai sob o texto.
2. **Cabeça:** um ✦ num círculo pequeno neutro e o texto "Leitura do mês", em `text-muted-foreground` e `text-sm`. Não use caixa-alta.
3. **Manchete:** fica em `--font-display` (Ledger), ~23px (`text-2xl`), com só a porcentagem no tom de estado. Os casos:
   - **Variável fora do normal (±5%):** "O que você controla subiu/caiu **N%** este mês". Na receita, "As avulsas subiram/caíram…".
   - **Variável normal, total fora (±2%):** "O mês está **N%** acima/abaixo da média".
   - **Normal:** "O mês está dentro do seu normal".
   - **Sem média:** "Ainda não dá para comparar este mês".

   O AGENTS lista onde a Ledger mora. Acrescente esta manchete à lista.
4. **Apoio** (`text-sm`, muted, números em `font-semibold text-foreground`). Os casos:
   - **Com motivos:** "São **R$ D acima** do seu normal, e quase tudo veio de dois lugares:". Com um motivo só: "…, e veio de um lugar:". Na manchete do total, D é a diferença do total para a média.
   - **Normal:** "**R$ X** dele já eram parcelas." Sem fixo, não há apoio.
   - **Sem média:** "**R$ X** fixos e **R$ Y** do dia a dia neste mês."
5. **Motivos:** no máximo 2. São as maiores contribuições em reais **na direção da manchete**, entre os grupos do variável (diferença contra o normal do grupo; num grupo novo, o valor inteiro) e o fixo (a diferença do fixo contra o normal, com o nome do fixo novo quando houver; senão, "Parcelas").
   - **Linha:** bolinha (a cor da categoria no variável, `--muted-foreground` no fixo), nome, detalhe muted opcional ("novo", "novo desde set"), uma régua de até ~220px com o tamanho relativo ao maior motivo, e o valor com sinal ("+R$ 340" / "−R$ 405") em `font-mono font-semibold` no tom da regra de despesa.
   - **Grade:** `max-content | minmax(5rem,13.75rem) | auto`, alinhada entre as linhas.
   - **Régua:** use a peça do DS que existir (um `Progress size="sm"` com `fillColor` serve). Peça nova só se nenhuma servir, e aí com a invariante 8.
   - **Fora:** sem motivos nos casos normal e sem média.
6. **Sugestão** (rodapé do cartão, com `Separator` em cima): "Com o dia a dia no seu normal, <mês seguinte> fecha perto de **R$ X**". X é `fixo.proximoMes` mais `normais.variavel`. Na receita: "…, <mês seguinte> deve entrar perto de **R$ X**". Ela só aparece com o normal do variável conhecido e o mês aberto (o mês da tela é o mês atual). À direita fica o botão `Button variant="secondary" size="sm"` **"Ver <motivo principal>"**, que só aparece quando o motivo principal é um grupo do variável. O botão filtra a lista de lançamentos da página pela busca com o nome do grupo e rola até ela. Use o que o controller da lista já oferece (procure a busca em `use-transactions-list-controller`). Se não houver busca, o botão fica de fora e isso vai para o relatório.
7. **Telefone:** a régua encolhe, a sugestão empilha (texto, depois o botão na largura toda) e o resto não muda.

## Onde mora
- A conta pura: `motivosDoMes(c, despesa)` e `manchete/apoio` (ou `leituraDoMes(c, despesa, yearMonth)`, que devolve tudo), em `src/lib/composicao-do-mes.ts`, com testes. `fraseDaComposicao` sai, se ficar sem uso, junto com os testes dela.
- A interface fica no `do-que-e-feito-o-mes.tsx`, no lugar do `Item` de hoje. Se o JSX passar de ~80 linhas, ela vira um arquivo próprio `leitura-do-mes.tsx` na mesma pasta.

## Fora
Os outros cartões e a conta da composição não mudam. Nenhum caminho de navegação muda: o botão só filtra a lista da própria página.
