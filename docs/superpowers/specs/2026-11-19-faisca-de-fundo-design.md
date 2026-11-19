# Cartões de Categorias: a faísca vira o fundo (E + barra) — desenho curto

Data: 19/11/2026. Escolha do dono: **E, com a barra**, e "nenhuma informação que tem hoje seja removida".

## Por quê

O dono pediu melhorias de design nos cartões de Categorias. Ele recusou a lista, os cartões enxutos e os cartões deitados, e escolheu a faísca de fundo, desde que tudo o que o cartão mostra hoje continue lá.

## O que muda (despesa e receita)

Cada cartão fica nesta ordem, de cima para baixo:

1. **Cabeçalho:** ladrilho, nome e ⋯, como hoje.
2. **Valor e variação** na mesma linha, como hoje, e embaixo "lançado + previsto" ou "recebido + previsto", quando houver.
3. **A barra e a frase** (`Progress` e a situação: a parte do mês ou o limite), como hoje, agora **antes** da faísca.
4. **A faísca dos 6 meses no pé, de borda a borda.** Ela sangra pelas laterais e pela base do cartão (`-mx-(--card-px) -mb-(--card-py)`), e o recorte do `Card` faz a borda arredondada. Fica mais alta (de `h-10` para `h-16`), sem fundo próprio, e continua com a linha tracejada da média (`reference`), a cor da categoria, o nome e a descrição para o leitor de tela.

**O esqueleto do cartão** segue a mesma ordem: o osso da faísca vai para o pé, também de borda a borda.

**Nada sai:** valor, variação, previsto, barra (limite, parte do mês, previsto tracejado e marcador do ritmo), frase da situação, faísca com média, ⋯, toque longo e link do cartão continuam.

## O que não muda

A grade (1, 2 ou 3 colunas), a altura igual dos cartões numa linha (`h-full`), o `CardLink`, o menu de contexto e as cores.

## Abordagens

1. Lista compacta: recusada.
2. Cartões enxutos em 3 colunas, sem faísca: recusada.
3. O cartão de hoje, afinado: recusada.
4. "Quanto falta" em primeiro: recusada.
5. **A faísca vira o fundo, com a barra (escolhida).**
6. Cartão deitado: recusada.

## Fica com quem constrói

Se o `ChartSparkline` tiver recuo interno que impeça a faísca de encostar nas bordas, quem constrói o zera na chamada, sem mexer no `ui/chart`. Se isso não for possível só com props e classes, quem constrói avisa antes de mexer no componente.
