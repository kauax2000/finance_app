# "Do que é feito o mês" no detalhe da categoria — design

**Por quê.** O detalhe enxuto da categoria responde "quanto foi" e "é normal?", mas deixa duas perguntas de fora: **por que está diferente do normal** e **quanto disso a pessoa controla**. Na Carro, 80% do mês são parcelas. O gasto do dia a dia está abaixo do normal, e a tela não conta isso. O dono aprovou o bloco em 21/11/2026.

**Mockups:**
- `docs/design/painel/do-que-e-feito.html`: o bloco e a ordem da tela;
- `docs/design/painel/categoria-mais-rica.html`: o "Quem gastou" e o "deve fechar em".

## Abordagens
- **Blocos separados** ("Com o que se gasta", "Já comprometido"). Recusada: mostrava as partes sem a conta que as liga.
- **Um bloco que explica (escolhida).** Uma frase com o porquê, a barra fixo × variável e, embaixo, as duas listas.

## A tela, em ordem
1. **A faixa do mês**, como hoje, com a frase "deve fechar em **R$ X**". Com o mês aberto, X é o lançado mais o previsto do mês (`mes.lancado + mes.previsto`). Com o previsto zero, a frase continua: "nada mais previsto até o dia N". Num mês fechado ela não aparece, porque o valor já é o fechamento. Com limite, a frase ganha o fim "· R$ Y acima do limite" ou "· cabe no limite".
2. **"Do que é feito o mês"**, o bloco novo, descrito abaixo.
3. **"Últimos 6 meses"**, como hoje.
4. **"Quem gastou"**: só numa carteira com dois adultos ou mais, e só se mais de uma pessoa lançou nesta categoria no mês. É uma linha por pessoa, com o avatar (`AvatarGroupItem`/`Avatar` com `identityToneFor`), o nome, uma barra pelo valor e o valor. A pessoa conta pelo `user_id` do lançamento, que é quem lançou. A soma usa o mesmo peso da despesa, então o estorno abate. Fica de fora do convidado.
5. **O insight**, a lista de lançamentos e o link do Painel, como hoje.

## O bloco "Do que é feito o mês"
- **Título** "Do que é feito o mês".
- **A frase.** Fica em `text-base`, com os números em `font-semibold` e o tom de estado só no "abaixo" e no "acima" (`text-success`/`text-warning`, como o resto da tela, pela régua `despesa`). Ela escolhe um dos casos, nesta ordem:
  1. **Sem média** (menos de 2 meses de histórico): "**R$ X** fixos e **R$ Y** do dia a dia neste mês." Sem comparação.
  2. **Dentro do normal**: o total fica dentro de ±2% da média (a mesma faixa da `vereditoDaMedia`). A frase é "O mês está dentro do seu normal." e, se houver fixo, " **R$ X** dele já eram parcelas."
  3. **Algo novo** puxou o mês: há um fixo novo (uma parcela cujo plano começou nos últimos 3 meses, ou uma assinatura criada nos últimos 3 meses) e o total está acima da média. A frase é "O mês está **N% acima** da média por causa de **\<nome\>**, que começou em **\<mês\>**." Com mais de um novo, entra o de maior valor.
  4. **O fixo puxou**: total acima da média, e o fixo responde por mais da metade da diferença. A frase é "O mês está **N% acima** da média só por causa das **parcelas**. O que você controla, **R$ Y**, está **M% abaixo/acima** do seu normal." Se o variável estiver dentro de ±2%, o fim vira "está dentro do seu normal".
  5. **O variável puxou**: total acima da média, e o variável responde pela maior parte. A frase é "O mês está **N% acima** da média: **\<grupo\>** subiu **M%** (**R$ A** a mais que o normal)." O grupo é o de maior aumento em reais.
  6. **Abaixo da média**: a mesma lógica dos casos 4 e 5, com "abaixo", e o grupo que mais caiu.
  
  **O "normal" de cada parte** é a média dos meses do histórico, a mesma janela de `mediaDosMeses`:
  - o fixo normal é a média do fixo desses meses;
  - o variável normal é a do variável;
  - o normal de um grupo é a média só dos meses em que ele apareceu.
- **A barra.** O `ChartSplit labels="none"`, com o fixo na cor da categoria (`corDaSerie`) e o variável em `--muted-foreground`. Embaixo, a legenda "● Fixo · R$ X · N%" à esquerda e "● Variável · R$ Y · M%" à direita, com o `ChartSwatch`. **Num mês sem fixo**, não há barra nem legenda, e só a coluna do variável aparece, na largura toda.
- **Duas colunas** (`@container`: uma coluna abaixo de cerca de 36rem do bloco).
  - **Fixo · parcelas e assinaturas**, com "a última acaba em \<mês/ano\>" à direita do título da coluna. Cada item tem:
    - a data do pagamento do mês (`DateTile` do DS, o dia e o mês curto);
    - o nome;
    - embaixo, "N de T" para a parcela (ou "todo mês" para a assinatura) e, se ela for nova (até 3 meses), o selo "novo desde \<mês\>" no tom `warning`;
    - uma barrinha de progresso da parcela (`Progress size="sm"` com `fillColor` da categoria);
    - o valor à direita.
    
    No pé da coluna vem "Em \<mês seguinte\> já entram **R$ Z**", com o fixo previsto do mês seguinte, se houver.
  - **Variável · o que você controla**, com "vs seu normal" à direita do título. Cada linha tem o nome do grupo, embaixo "N vezes", à direita a variação (↑ 20% `warning`, ↓ 8% `success`, "= normal" dentro de ±5%, "novo" se o grupo não existia antes) e o valor. Ficam os 3 maiores grupos em valor; o resto vira a linha "Outros N lançamentos · R$ W", sem variação.
- **O agrupamento** é pela descrição normalizada:
  - minúsculas, sem acento;
  - sem o sufixo de parcela (" - 3/6", "(3/12)");
  - sem números e pontuação no fim;
  - a **primeira palavra** como chave.
  
  O nome exibido é a grafia mais comum do grupo, que nem sempre é a da primeira palavra. Por exemplo, "Estacionamento" e "Estacionamento Shopping" viram o grupo "estacionamento", exibido como "Estacionamento".
- **O que é fixo**: o lançamento do mês com `installment_plan_id` ou `subscription_id`. O resto é variável.
- **Receita.** O bloco vale também para a categoria de receita, com "entradas" e com os tons invertidos (entrar mais é bom), como o resto da tela.
- **Sem lançamento no mês**: não há bloco.

## Onde mora
- **A conta pura** fica em `src/lib/composicao-do-mes.ts`, um arquivo novo com testes:
  - `composicaoDoMes(...)` devolve fixo, variável, grupos, normais e o caso da frase, com os números;
  - `quemGastou(...)` devolve as pessoas e os valores.
- **O texto da frase** sai de uma função pura no mesmo arquivo, `fraseDaComposicao(c, despesa)`, para ser testada. Ela devolve as partes com os pedaços em negrito marcados, sem JSX.
- **A interface** fica em `src/components/categories/detail/do-que-e-feito-o-mes.tsx` e em `quem-gastou.tsx`, montadas só com peças do DS. Se faltar uma peça (por exemplo, a linha de lista com data, nome, legenda e valor), use o `Item` com `ItemMedia`. Uma peça nova do DS, se for mesmo necessária, segue a invariante 8.

## Jornadas
Nenhum caminho muda. Atualize só a descrição da tela no G9 do `docs/JORNADAS.md` e no `docs/atlas/template.html`, e rode o `build.py`.

## Fora
- O "Com o que se gasta" e o "Já comprometido" como blocos separados.
- A edição de grupos pela pessoa.
- Agrupar por estabelecimento ou CNPJ.
