# "Do que é feito o mês" em cards separados — design curto

**Por quê.** O dono pediu (22/11/2026) que as partes do bloco fiquem mais separadas, em cartões próprios, podendo usar mais colunas. Hoje, um cartão só junta a frase, a barra, as duas listas e o rodapé.

**Mockup:** `docs/design/painel/do-que-e-feito-cards.html`, opção A, com os dados reais da Renata.

## Abordagens
- **A · Resumo em cima e duas listas embaixo (escolhida pelo dono).** Mantém a leitura de cima para baixo: primeiro o porquê, depois o detalhe.
- **B · Três colunas.** Recusada: na coluna de ~770px, a frase ocupa 5 ou 6 linhas e as listas perdem a variação em reais.
- **C · Números em cartões e listas embaixo.** Recusada: a tela fica mais alta, e os números repetem a frase.

## O que muda
1. **Cartão de resumo** ("Do que é feito o mês"), na largura toda, com:
   - a frase;
   - a barra (`ChartSplit labels="none"`);
   - embaixo da barra, a legenda com os dois totais: "● O que você controla · **R$ 776** · 35%" à esquerda e "● Já decidido · **R$ 1.418** · 65%" à direita, com `ChartSwatch`.

   Sem fixo, ou sem variável, não há barra nem legenda.
2. **Dois cartões lado a lado** abaixo do resumo, a 16px dele e entre si (`--space-block`):
   - **"O que você controla"** (na receita, "Avulsas"). É o da esquerda e o mais largo (`5fr_4fr`). O apoio à direita do título é "vs seu normal". As linhas são as de hoje.
   - **O título do fixo** de hoje ("Já decidido · parcelas", "… e assinaturas" ou "… entradas fixas"). O apoio é "N ativas", com o número de itens do fixo. As linhas são as de hoje. O **rodapé fica dentro deste cartão**, preso ao pé (`mt-auto`), em duas linhas, cada uma com o rótulo à esquerda e o valor à direita: "A última parcela acaba em" / **mai/27** e "Em dezembro já entram" / **R$ 1.418**.
   - Os dois cartões têm a mesma altura (a grade estica).
   - Abaixo de ~36rem da área, os dois empilham com o variável primeiro.
   - Com só um dos lados, o cartão que sobra ocupa a largura toda.
3. **Sai** o cabeçalho de coluna com total dentro das listas, porque o total foi para a legenda do resumo. Saem também o fio e o rodapé comum.
4. **O esqueleto** da página troca o bloco de 80 por um resumo (`h-36`) e, embaixo, dois blocos lado a lado (`h-56`) a partir do `md`.

## Fora
A conta, a frase e as linhas não mudam. Nenhum caminho muda, então não há atualização de jornada.
