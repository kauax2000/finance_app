# Insight "para conferir" com a lista no alto (detalhe da categoria) — design curto

Data: 27/11/2026 · Escolha do dono: opção **C** ("lista com ícone, no alto") do mockup
`.superpowers/brainstorm/83721-1795806314/content/conferir-opcoes.html` (indicativo).

## Intenção

O cartão "N para conferir" do carrossel de insights mostra hoje o total no canto e até 2 linhas
soltas (`dia · descrição · valor`) empurradas para o pé do cartão, que tem a altura do maior
insight. Com um lançamento, o total repete a linha e sobra um vão em cima. O cartão também não
diz por que aquilo é para conferir. O objetivo é ler como as notificações: o que entrou, de onde
veio, quando e quanto, logo abaixo do título.

## Objetivos

- A lista sobe para logo abaixo do título; o respiro que sobra fica entre a lista e o botão.
- Cada linha é um `Item` como a linha das notificações (`notification-row.tsx`): à esquerda o
  ícone de onde veio, num `ItemMedia variant="tile"` no tom `info`; no meio a descrição
  (`ItemTitle`, truncada) e, embaixo, "25 de nov · Apple Pay" (`ItemDescription`: o dia e a
  origem); à direita o valor (`nums font-mono`).
- A origem sai de `transactions.source` pelo `ROTULO_DA_ORIGEM` (`lib/piloto/piloto.ts`); sem
  rótulo, "pelo app" — a mesma regra de `notaDaOrigem`.
- O ícone também sai da origem: atalho e Apple Pay, o telefone; frase rápida e WhatsApp, o balão;
  as importações, o documento; recorrente, as setas; o resto, o ✦ do lançamento inteligente.
- Até 3 linhas (hoje 2), as mais recentes; o resto vira "e mais N".
- O canto do título fica vazio (o total sai): o valor está em cada linha.
- O botão "Conferir agora" e o destino não mudam.

## Não objetivos

- O carrossel continua com a altura do maior insight (a opção A foi recusada agora).
- Nenhum outro insight muda. Nenhuma gravação nova (a opção D ficou de fora).
- O desktop recebe a mesma forma (o cartão é um só); nada além dele muda lá.

## Antiobjetivos

- Uma linha que diz menos que hoje (dia, descrição e valor continuam).
- Ícone colorido por pessoa ou por categoria: a cor é do tom `info`, o do "a conferir" do detalhe
  do lançamento (rodada 371).

## Abordagens

1. **C — lista no alto com o `Item` do DS** (escolhida).
2. B — o número grande e a frase em cima, a lista em placa. Recusada.
3. D — conferir no próprio cartão. Fora: é funcionalidade e grava no banco.
4. A — o carrossel na altura de cada slide. Fora desta mudança.

## O como decidido

- `lib/insights-da-categoria.ts`: as linhas do corpo `conferir` ganham `dataYmd` e `origem`
  (o `source`), e o corte vai a 3.
- `corpo-do-insight.tsx`: o ramo `conferir` monta `ItemGroup` de `Item size="sm"` sem caixa; o
  dia por extenso curto ("25 de nov") vem dos helpers de `transaction-date.ts`.
- `insights-da-categoria.tsx`: no `conferir` o canto some e o corpo não leva `mt-auto` (a lista
  fica no alto; a sobra vai para antes do botão).
- Testes de fonte e de texto nos moldes dos que já existem para o corpo.

## Para quem constrói

O mapa de ícones por origem (Heroicons `16/solid` ou `20/solid`, conforme o corpo do ladrilho), o
degrau exato do `Item` e do ladrilho, e o espaçamento entre as linhas, dentro do design system.
