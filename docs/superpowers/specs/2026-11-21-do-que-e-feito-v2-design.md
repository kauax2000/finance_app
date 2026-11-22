# "Do que é feito o mês" v2 — design curto

**Por quê.** O dono viu a primeira versão do bloco com os dados reais da Renata e pediu melhorias de detalhe. Os problemas encontrados foram estes:
1. A frase se contradiz: "4% abaixo só por causa das parcelas" e, logo depois, "67% acima".
2. O fixo, que já está decidido, pesa mais que o variável, que é o que se controla.
3. A cor da categoria está no fixo, e o variável fica cinza.
4. Há ruído: selos "novo" repetidos, barras iguais e "1 vez" em toda linha.
5. "OUT 29" aparece numa lista de novembro.
6. Há repetição: "novembro" no canto e a legenda que repete os totais.

**Mockup aprovado:** `docs/design/painel/do-que-e-feito-v2.html`, feito com os dados reais da Renata.

## Abordagens
- **Polir onde está.** Recusada: mantém o fixo dominando o bloco.
- **Reordenar pelo que se controla (escolhida).** O variável vai primeiro e mais largo, e o fixo fica compacto.
- **Abas Variável | Fixo.** Recusada: esconde metade do bloco.

## O que muda
1. **Frase** (`fraseDaComposicao`). Ela começa pelo variável quando ele saiu do normal (±5%):
   - "O que você controla **subiu/caiu N%**: **R$ V**, R$ D acima/abaixo do seu normal, puxado por **\<grupo\>** (novo, R$ X | ↑ M%)."
   - Em seguida, o fixo e o total: "As parcelas subiram/caíram, e o mês ficou **N% acima/abaixo** da média." ou "…e o mês ficou dentro da média.". Se o fixo for igual ao normal (±5%), a primeira parte some: "…e o mês ficou…".
   - Quando o variável está normal e o fixo explica o total, valem os casos "novo" e "fixoPuxou" de hoje, reescritos sem o "só por causa".
   - Os casos "semMedia" e "normal" ficam como estão.
   - O tom segue a direção: mais gasto é `warning`, e na receita o tom se inverte.
   - O grupo que puxou é o de maior diferença em reais, na direção do variável.
2. **Ordem e peso.**
   - A coluna da esquerda é **"O que você controla"**, na cor da categoria e mais larga (`1.25fr`).
   - A da direita é **"Já decidido · parcelas"**, em `--muted-foreground`.
   - A barra de cima segue a mesma ordem e as mesmas cores: o variável primeiro e colorido, o fixo cinza.
   - Abaixo de cerca de 36rem do bloco, as colunas empilham com o variável primeiro.
3. **Totais no cabeçalho de cada coluna**, no formato "● Título · **R$ X** · N%". Sai a legenda separada da barra.
4. **As linhas do variável:**
   - o nome, e embaixo a data do lançamento ("23 nov"; com mais de uma vez, "N vezes · última 23 nov");
   - à direita, a variação em reais e em %: "R$ 49 abaixo · ↓ 30%" (`success`/`warning` pela regra de despesa), "= normal" dentro de ±5%, ou "não tinha antes" no grupo novo;
   - o selo "novo" ao lado do nome;
   - o valor no fim.
   
   O "Outros N lançamentos" segue igual.
5. **O fixo compacto.**
   - Uma linha por item: o nome, "6/12" em muted e o progresso em pontinhos (`ProgressDots` ou a peça do DS que existir; se não houver, um `Progress size="sm"` curto de largura fixa) para parcelas de até 12. Acima de 12, só o "N/T". Na assinatura, "todo mês". O valor fica à direita.
   - **No máximo 3 linhas**, as de maior valor. O resto vira uma linha somada: "+ N parcelas" (e, se todas forem novas no mês, "+ N parcelas novas este mês") com os nomes em muted e o total.
   - Saem as datas grandes (`DateTile`) e as barras longas. O "novo desde" sai da linha e entra na frase, quando é ele que explica o mês.
6. **Rodapé comum**, com um fio por cima: "A última parcela acaba em **mai/27**" à esquerda e "Em dezembro já entram **R$ X**" à direita. Com fixo zero, não há rodapé.
7. **Sai:** o "novembro" do canto do título.

## Fora
- A conta (`composicaoDoMes`) não muda, exceto pelo que a frase e as linhas novas precisarem, como a data do último lançamento do grupo.
