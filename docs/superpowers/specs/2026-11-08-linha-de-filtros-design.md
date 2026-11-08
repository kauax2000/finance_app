# Linha de filtros de Transações numa linha só — design

Data: 08/11/2026. Escolha do dono: opção **B** do comparativo de layouts
(abas à esquerda, filtros numa faixa que rola de lado, "+ Filtro" e contagem
fixos à direita). O dono pulou as perguntas; o que está marcado **(decisão do
Claude)** é meu e pode ser revisto.

## Por quê

A linha sobre a tabela de `/transactions` (abas Todas/Despesas/Receitas,
`FilterBar` com os tokens, "+ Filtro", "Limpar" e a contagem "611
lançamentos") quebra de jeitos diferentes conforme a largura e o número de
filtros, e cada peça cai num lugar diferente:

- a linha da tela (`transacoes-toolbar.tsx`) é `flex-wrap`: as abas e a
  `FilterBar` podem ir para linhas diferentes;
- dentro da `FilterBar`, a fileira de tokens também é `flex-wrap`: com muitos
  filtros, os tokens e o "+ Filtro" descem;
- abaixo de 28rem (448px) da largura **da própria `FilterBar`**, a contagem
  empilha embaixo da fileira (`@max-md/filter-bar:flex-col`). Ao lado das
  abas, a `FilterBar` fica com ~360px numa tela larga, e a contagem desce para
  baixo do "+ Filtro" mesmo sem filtro nenhum (o print do dono).

## Objetivo

Cada peça mora num lugar fixo, em qualquer largura e com qualquer número de
filtros:

```
[Todas | Despesas | Receitas]  [token][token][tok…  →]  [+ Filtro] [Limpar]  48 lançamentos
```

- **Abas**: à esquerda, nunca encolhem.
- **Faixa de filtros**: no meio, ocupa a sobra, **nunca quebra linha**; o que
  não cabe rola na horizontal, com a borda esmaecida (a dissolução do sistema)
  do lado em que há mais.
- **"+ Filtro" e "Limpar"**: logo depois da faixa, **fora dela** — nunca rolam
  para fora de vista.
- **Contagem**: na ponta direita, sempre na mesma linha.

A altura da linha não muda com o número de filtros; a tabela não pula.

## Fora do escopo

- O editor de cada filtro (o popover) e o editor de período.
- Outras telas: hoje só Transações usa a `FilterBar` no app.
- Mudar o que as abas, os filtros ou a contagem fazem (nenhum caminho muda;
  não é mudança de jornada).

## Anti-objetivos

- Um filtro novo entrar fora de vista sem a pessoa perceber.
- A contagem ou o "+ Filtro" mudarem de lugar por causa da largura.
- Duas árvores (`md:hidden` / `hidden md:flex`) para telefone e desktop.

## Como funciona

### A `FilterBar` ganha a forma "faixa"

Uma prop nova na `FilterBar`, `overflow`: `"wrap"` (o de hoje, padrão) ou
`"scroll"`. Com `"scroll"`, em **qualquer** largura:

- a fileira dos tokens (com o E/OU no começo, quando existe) é uma faixa de
  uma linha (`flex-nowrap`, `overflow-x-auto`, sem barra de rolagem visível),
  com a dissolução de borda do sistema (`scroll-fade-x` /
  `useScrollFade`) e, no cursor, as setas de "tem mais" se o sistema já as
  oferece para o eixo X (decisão do Claude: usar o que existe; não inventar);
- "+ Filtro" e "Limpar" saem da faixa e ficam num grupo fixo logo depois
  dela;
- a contagem fica na mesma linha, na ponta, e **não empilha** (a regra
  `@max-md/filter-bar:flex-col` não vale nessa forma);
- ao **adicionar** um filtro, a faixa rola até o token novo (o fim); ao
  editar um token, ele é trazido para a vista se estiver cortado;
- o foco por Tab num token cortado o traz para a vista (o navegador já faz;
  a dissolução não pode esconder o anel de foco).

A forma `mobile="scroll"` de hoje (só no telefone) continua existindo para
quem usa `overflow="wrap"`; com `overflow="scroll"` ela é redundante.
Componente de `src/components/ui/`: a escolha da opção B pelo dono é a
autorização. Página do catálogo e `filter-bar-versions.test.ts` na mesma
mudança.

### A linha de Transações

`transacoes-toolbar.tsx` deixa de ser `flex-wrap` no desktop:

- **Desktop/largura de sobra**: uma linha — abas (`shrink-0`), a `FilterBar
  overflow="scroll"` (`flex-1 min-w-0`). A contagem e o "+ Filtro" vêm de
  dentro da `FilterBar`.
- **Largura estreita** (a linha da tela com menos de 40rem, por container
  query **da própria linha**, não da janela — decisão do Claude: 40rem é onde
  abas (~260px) + "+ Filtro" + contagem (~260px) deixam menos de ~120px para
  a faixa): duas linhas fixas — linha 1, abas esticadas e o ⋯ (que hoje já
  aparece só no telefone); linha 2, a `FilterBar` inteira (faixa, "+ Filtro",
  contagem). Nessa forma a contagem continua na ponta direita da linha 2
  (decisão do Claude: o mockup a punha numa terceira linha no telefone; numa
  linha própria ela volta a "mudar de lugar").
- No telefone a regra é a mesma da largura estreita: a pergunta é a largura da
  linha, não o aparelho. Alvos de 44 no dedo continuam vindo dos componentes.

### O que não muda

Os tokens, o popover de edição, a URL, o atalho, o "Limpar" com 2+ filtros,
o E/OU, os estados `pending`/`disabled` e o `aria` da `FilterBar`.

## Restrições

- Leia o `AGENTS.md` (FilterBar, Toolbar, "A dissolução", Touch devices) antes.
- Tokens e utilitários do sistema; nada de px literal; nenhuma árvore duplicada
  por `isMobile`/`md:hidden`.
- `ds:audit`, `tsc`, `eslint`, testes de `src/components/ui`,
  `src/app/designsystem` e `src/components/transactions`.
- Não rodar prettier. Banco de dev é produção: só leitura no navegador.

## O que fica para quem constrói

- O nome exato das classes e se a dissolução usa o `ScrollArea` ou as
  `@utility` direto (a `FilterBar` já usa `scrollFadeViewportXClassName`).
- Como medir "rolar até o token novo" (por `data-slot` do último token depois
  do layout).
