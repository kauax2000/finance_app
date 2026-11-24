# Quem gastou — barra dividida com lista (design curto)

**Data:** 24/11/2026 · **Tela:** detalhe da categoria (`/categories/[id]`) · **Mockup:** `docs/design/painel/quem-gastou-opcoes.html`, opção A (escolhida pelo dono).

## Por quê

O cartão de hoje (`src/components/categories/detail/quem-gastou.tsx`) ocupa a largura inteira só com duas linhas. Entre o nome e o valor fica uma barra de ~640px. O cartão não diz a fatia de cada pessoa, e o nome é cortado em 112px fixos.

## Objetivo

Responder "quem fez quanto do mês" de relance, no mesmo desenho do cartão "Como foi pago" (`components/analise-do-mes/como-foi-pago.tsx`).

**Fora do escopo:**
- filtrar a lista por pessoa (opção B, que pede um filtro novo em Transações);
- comparação com o mês anterior por pessoa;
- frase em Ledger (opção C).

## Abordagens consideradas

- **A · Barra dividida e lista (escolhida).** Pede pouca peça nova e reusa `ChartSplit`, `ChartSwatch` e o `Item`.
- **B · Linhas que filtram as compras da pessoa.** Mais útil, mas pede um filtro por autor em Transações: é outro projeto.
- **C · Frase com a barra.** Seria uma segunda frase em Ledger na tela, disputando atenção com a Leitura do mês.

## Desenho

**Barra.** No topo, `ChartSplit labels="none"` com uma parte por pessoa, na ordem do maior para o menor. O nome acessível é "Gastos do mês por pessoa" (despesa) ou "Entradas do mês por pessoa" (receita).

**Cor da pessoa.** É a cor de identidade do avatar, `var(--identity-N)`, vinda de `identityToneFor`.
- Um helper novo em `lib/avatar.ts` devolve o N: `identityIndexFor(stored, seed): number` (1–6). Assim, nada é montado com classe em tempo de execução.
- Se duas pessoas caírem na mesma identidade, todo o cartão passa para a rampa `--chart-1..5`, na ordem da lista. Assim a barra sempre separa as pessoas.

**Lista abaixo.** Uma linha por pessoa, como as linhas do "Como foi pago":
- o avatar `sm`;
- o `ItemContent` com o nome (`truncate`, sem largura fixa) e, embaixo, a linha miúda: `ChartSwatch` na cor da pessoa, depois "93% · 14 compras" (ou "1 compra"; na receita, "entrada" e "entradas");
- à direita, o valor em `font-mono font-semibold` com `reaisInteiros`.

Nome e linha miúda são par de identidade, sem `gap`. O % vem de `splitPercents`, para somar 100 com a barra.

**Contagem.** `quemGastou` (`lib/composicao-do-mes.ts`) passa a devolver `{ userId, valor, compras }`. `compras` conta os lançamentos de peso positivo daquela pessoa (o estorno abate o valor, mas não é compra).

**Largura (desktop).** No `CategoryDetailLayout`, quando `quem` e `insight` existem juntos, os dois ficam lado a lado (`md:grid-cols-2`, `gap-(--space-block)`). Com um só, ele ocupa a linha inteira. No telefone, empilha como hoje.

**Raio.** O cartão é `rounded-surface` (via `CartaoDoGrafico`/`Card`). A barra e a amostra são as do `ChartSplit`/`ChartSwatch`, e nenhum raio novo é escrito na tela.

## Regras que continuam

- O cartão só aparece com 2 pessoas ou mais e total maior que 0. A tela decide (carteira de adultos).
- "Ex-membro" para quem saiu do diretório.

## Fica com quem constrói

- A ordem exata das classes.
- O texto do nome acessível de cada linha.
- Os testes: o `compras` do `quemGastou`, o `identityIndexFor` e o caso de colisão.
