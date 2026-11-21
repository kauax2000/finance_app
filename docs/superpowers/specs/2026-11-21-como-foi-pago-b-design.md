# "Como foi pago" — barra dividida e lista (opção B), design curto

**Por quê.** O cartão de hoje (a rosca C2 com a legenda C3) tem quatro problemas:
- o miolo repete o total que já está no topo da página;
- o nome do cartão quebra em duas linhas, e o % fica solto na ponta;
- "−R$ 15" não diz contra o quê;
- cada forma é só uma bolinha, sem ícone.

Pensando na leitura, o dono escolheu a **B** (21/11/2026): comprimento se compara melhor que ângulo, a resposta vem primeiro, os valores ficam numa coluna e nada quebra.

**Mockup:** `docs/design/painel/como-foi-pago-v3.html`, opção B.

## Abordagens
- **A.** A rosca com "65% no PIX" no miolo e linhas com ícone. Recusada: ângulo se lê pior.
- **B (escolhida).** Uma barra dividida na largura toda e uma lista.
- **C.** Um ranking com uma barra por forma. Recusada: repete o tamanho duas vezes.

## Como fica (duas formas ou mais)

1. **Cabeçalho.**
   - O título é "Como foi pago".
   - À direita, em `Caption`, vai "vs outubro", ou "vs outubro inteiro" com o mês aberto (o mesmo motivo do cartão de uma forma).
   - Sem comparação (nada no mês anterior), não há legenda.
2. **Destaque.**
   - A maior forma vem em número grande ("65%", `text-xl font-semibold`, `nums`), seguida de "no PIX" em `text-muted-foreground`.
   - À direita, "2 formas" em `Caption`.
   - O % sai do mesmo arredondamento da barra (`splitPercents`), para os números baterem.
   - A preposição segue a forma única: "em dinheiro"; "sem forma de pagamento"; "no <nome>" nas outras.
3. **A barra.** O `ChartSplit` na largura toda, com segmentos de 8px de altura e 4px de vão, nas cores de hoje (`RAMPA_DO_PAGAMENTO`, pela chave). Os rótulos dele saem, porque a lista diz tudo.
4. **A lista.** Uma linha por forma, na ordem de hoje (do maior valor ao menor). Linhas a 12px uma da outra. Cada linha tem:
   - **à esquerda**, um ladrilho redondo de 32px:
     - no cartão de crédito, a bandeira (`CreditCardBrandChip`);
     - nas outras formas, o ícone de `ICONE_DA_FORMA` (o `EllipsisHorizontalIcon` como reserva), em `text-muted-foreground`;
     - fundo `bg-muted`;
   - **no meio:**
     - o nome inteiro (`truncate` só como último recurso);
     - embaixo, a amostra de 8px na cor da série, depois "65%" e " · " e a diferença ("−R$ 15", "+R$ 312", "igual" ou "novo", no tom de `diferencaDaForma`);
     - nome e linha de baixo são par de identidade, sem `gap`;
   - **à direita**, o valor em `font-mono nums font-semibold`, com `reaisInteiros`.
5. **Fora:** a rosca, o miolo com o total e a coluna de % solta.

O cartão de **uma forma só** não muda: o anel, a bandeira e "Tudo no …".

## No design system
- `ChartSplit` ganha `labels="none"`: só a barra, sem rótulos nem legenda, com o nome acessível igual.
- Se não existir uma amostra de cor exportada para usar fora da legenda, nasce `ChartSwatch({ color })` (o ponto de 8px da legenda) em `chart.tsx`. Ela vai com docs, teste e uma linha no `AGENTS.md`, e a legenda passa a usá-la.

## Acessível
- A barra mantém o `label` com o resumo.
- A lista é texto real.
- O destaque não é `aria-hidden`.
