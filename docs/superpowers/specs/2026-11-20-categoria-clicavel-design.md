# Categoria clicável: D no desktop, D2 no telefone — desenho curto

Data: 20/11/2026. Escolha do dono, feita no artefato "Categorias clicáveis" (https://claude.ai/artifact/LZPjZFZic5sCw88xmfHqMn).

## Por quê

O cartão de categoria abre o detalhe, mas nada mostra isso: no desktop só aparece com o cursor em cima, e no telefone não há sinal nenhum.

## O que muda (cartões de despesa e receita)

**Desktop (`md` para cima, com cursor):**
- Um chevron (›, `ChevronRightIcon` 16/solid, `text-muted-foreground`) depois do nome. Ele fica escondido em repouso (`opacity-0`) e, com o cursor sobre o cartão ou com o foco do teclado, aparece e desliza 2px para a direita, ficando na tinta do texto.
- Com o cursor, o cartão reforça o realce: o fundo clareia um passo, a borda acende e a sombra cresce, além da `shadow-md` que já existe.

**Telefone (abaixo de `md`):**
- Sem chevron.
- A faísca cresce para cima: o pé do cartão passa de `h-16` para `h-26`, que dá 104px, ainda sangrando de borda a borda.
- Um botão fantasma, "Ver lançamentos ›", pousa por cima da parte de baixo da faísca. Ele ocupa a largura do cartão menos o recuo (`inset-x-(--card-px)`), fica a 10px do pé e tem 44px de altura, o alvo de toque. Em repouso não tem fundo.
- Ao tocar no cartão, o botão acende com o realce do terciário do app: a tinta do texto a ~12% (`bg-foreground/12`), branco translúcido no escuro e preto no claro. É **o mesmo realce do sistema, sem a cor da categoria**.
- O botão não é um segundo link: o cartão inteiro já é o link (`CardLink`). Ele é um rótulo visual dentro do cartão, `aria-hidden`, porque o link já tem o nome da categoria.

**Nada sai:** valor, variação, previsto, barra, frase, faísca com média, ⋯, menu de contexto. O esqueleto acompanha a nova altura da faísca no telefone.

## Abordagens

1. Chevron sempre visível: recusado. O dono quis o chevron só no hover.
2. Só hover reforçado: insuficiente no telefone.
3. Rodapé "Ver lançamentos" abaixo da faísca: evoluiu para a D2.
4. **D (desktop) + D2 (telefone): escolhida.**
