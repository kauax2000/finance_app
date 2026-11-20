# Detalhe da categoria — teste da faixa do mês: B × F (design curto)

Data: 20/11/2026 · pedido do dono, depois de ver seis direções no navegador
(`.superpowers/brainstorm/…/faixa-do-mes-v3.html`).

**Intenção.** A barra da faixa do mês ficava gigante no desktop largo e, sem
limite, não dizia nada. O dono quer **usar as duas melhores direções, B e F,
na tela de verdade**, trocando entre elas por uma chave, para decidir no uso.

**Anotado para depois (pedido do dono):** gostou das informações da opção E
(a barra dividida por forma de pagamento, com legenda em reais e %) e quer
isso **mais embaixo** na tela. Não entra neste teste; volta depois que ele
escolher entre B e F.

## As duas versões (só desktop, ≥ 768px; o telefone não muda)

Comum às duas: a faixa fica sob o `PageHeader` (como hoje), alinhada ao
ladrilho, e o bloco "Comparação" de baixo **sai** (a comparação mora na
faixa). O resto da análise e a coluna de lançamentos ficam como estão.

**B — linha de métricas.** À esquerda: sobrancelha "Gasto em <mês>"
(receita: "Recebido em <mês>"), o valor (`MoneyDisplay 3xl`) e uma **barra
curta** (largura fixa ~20rem) sob ele — contra o limite quando há (com
`projected`, `bands`, `marker` como hoje), senão o peso na carteira — e a
legenda ("25% do gasto da carteira", ou a frase do limite). À direita,
separados por fios verticais, três métricas: **vs mesmo dia de <mês ant.>**
(valor + selo de variação, verde quando gastou menos), **Média de 6 meses**
(valor + "R$ X acima/abaixo"; some sem média) e **Lançamentos** (contagem +
"maior: R$ X · <forma>"). Quebra em duas linhas quando não cabe.

**F — barras comparadas.** Duas colunas na grade da tela (3/5 · 2/5). À
esquerda: sobrancelha, o valor com o selo "▼ 18% vs out", e a linha "25% do
gasto da carteira · 9 lançamentos". À direita: barras horizontais **na mesma
escala** (`ChartBarList`, sem `share`): "<Mês>", "<Mês ant.>, até dia N" (ou
"<Mês ant.>" num mês passado), "Média de 6 meses" (some sem média) e, com
limite, "Limite". A do mês aberto em destaque.

## A chave

Um `ToggleGroup variant="segmented"` pequeno, rotulado "Teste de layout",
com "B · Métricas" e "F · Barras", na ponta direita da faixa (acima dela,
alinhado à direita), só no desktop. A escolha fica no aparelho
(`localStorage`, chave `detalhe-categoria:faixa`, padrão `B`), com
`try/catch`. É provisória: some quando o dono escolher.

## Restrições

Só peças do design system; nada em `src/components/ui/`, `globals.css`,
banco ou RPC. `ds:audit`, `tsc`, lint e `test:unit` verdes.
