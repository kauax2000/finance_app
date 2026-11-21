# "Tamanho das compras" — concentração (opção L), design curto

**Por quê.** O cartão de hoje conta compras por faixa fixa: até R$ 50, R$ 50–200, R$ 200–500 e R$ 500+. Ele tem três problemas:
- não mostra que uma compra grande é a maior parte do dinheiro;
- não tem número nenhum;
- no cartão estreito, perde metade dos rótulos.

A pergunta do cartão é: **o dinheiro desta categoria vai em muitas compras pequenas ou em poucas grandes?** O dono escolheu a **L** (21/11/2026). Ela mede pelo valor, não depende de faixas fixas e mostra cada compra.

**Mockups:**
- `docs/design/painel/tamanho-das-compras-3.html`, opção L;
- as recusadas, nos arquivos `tamanho-das-compras*.html` da mesma pasta.

## Abordagens
- **H.** As faixas fixas, lidas pelo valor. Recusada.
- **K.** As três maiores compras numa lista. Recusada.
- **L (escolhida).** Cada compra é um bloco, da maior para a menor, na largura do valor. As que fazem 80% do mês ficam na cor da categoria.

## Como fica
1. **A frase.** Diz "**5 de 16** compras fizeram 80% do mês".
   - O número fica em `text-xl font-semibold` e o resto em `text-sm text-muted-foreground`.
   - Com uma compra só, a frase é "**1 compra** fez o mês inteiro".
   - Na receita, a palavra é "entradas".
   - **O "N".** É o menor número de compras, da maior para a menor, cuja soma alcança 80% do total.
2. **A fileira.** Os blocos ficam lado a lado, com 2px de vão e 28px de altura. O raio vem da escada pequena do DS.
   - A largura de cada bloco é proporcional ao valor (`flex-grow`), com mínimo de 2px.
   - As N primeiras compras ficam na cor da categoria (`corDaSerie`), e as demais em `--muted` (o cinza dos gráficos).
   - **Muitas compras.** Acima de 40 compras, as menores se juntam num bloco só no fim, "outras M compras", em `--muted`. Assim nenhum bloco vira fio.
   - **Dica:** ao passar o cursor ou tocar num bloco, a dica enxuta mostra a descrição da compra, a data ("9 de novembro") e o valor, ou então "outras M compras" e a soma.
   - **Acessível:** a fileira tem `role="img"`, com um `aria-label` que traz a frase e as três maiores compras.
3. **Embaixo:** "maiores" à esquerda e "menores" à direita, em `text-xs` muted.
4. **Fora:** as barras por faixa.

## Dados
`concentracaoDasCompras(txs, tipo)` fica em `src/lib/categoria-resumo.ts`. Ela usa as mesmas compras que o `porFaixaDeValor` (`peso === 1`, ou seja, o estorno não é compra) e devolve:
- `compras`, ordenadas por valor, do maior para o menor. Cada uma traz `id`, `descricao`, `data` e `valor`;
- `total`;
- `n80`.

O `porFaixaDeValor` sai, se ficar sem uso.

## No design system
A fileira é um `ChartSplit` com duas capacidades novas, no lugar de uma peça nova:
- `size="lg"`: segmentos de 28px de altura, raio pequeno e vão de 2px;
- `tooltip`: a dica enxuta por segmento, com `labelText` e o valor.

As cores vêm do `config` por chave. Se a forma do `ChartSplit` não aceitar isso sem gambiarra, nasce a `ChartStrip` em `chart.tsx`, e o builder diz no relatório o que escolheu. Nos dois casos, a mudança vai com a página de docs, o teste e uma linha no `AGENTS.md`.
