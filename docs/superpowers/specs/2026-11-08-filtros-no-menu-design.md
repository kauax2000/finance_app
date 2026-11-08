# Filtros que não cabem vão para um menu — design

Data: 08/11/2026. Pedido do dono, depois de ver a faixa que rola de lado
(`FilterBar overflow="scroll"`, commits `6b240039`…`7b5a9a07`): **não quer a
linha que rola**; quando houver mais filtros ativos do que cabem, um **botão**
na linha abre um **dropdown** com os filtros que ficaram de fora. O dono pulou
as perguntas; o que está marcado **(decisão do Claude)** é meu.

Substitui a forma "faixa" da spec `2026-11-08-linha-de-filtros-design.md`; o
resto daquela spec (abas à esquerda, "+ Filtro" logo depois dos filtros,
contagem na ponta, duas linhas no estreito) continua valendo.

## Objetivo

```
[Todas|Despesas|Receitas]  [token][token][+2 ▾]  [+ Filtro]          48 lançamentos
```

- A linha nunca rola e nunca quebra: os tokens que cabem aparecem; os que não
  cabem saem para o botão **"+N"** (N = quantos saíram), logo depois do último
  token visível e antes do "+ Filtro".
- O botão abre um dropdown com uma linha por filtro escondido, escrita como o
  token (`Categoria é Mercado`). Escolher uma linha abre o **editor daquele
  filtro** (o mesmo popover dos tokens, que já tem "Remover"), ancorado no
  botão "+N". (decisão do Claude: editar e remover pelo editor, sem um × na
  linha do menu — uma linha de menu com dois alvos é armadilha no toque.)
- Sem excesso, o botão não existe.

## Quem sai

- O mecanismo do sistema: `quemSai` (`lib/overflow`) e o menu de
  `lib/overflow-menu` (o mesmo do `Tabs`, `ToolbarActions` e
  `PageHeaderActions`), medindo por `ResizeObserver` como o `Toolbar` faz.
- Saem do **fim** (os mais novos primeiro), na ordem da lista.
  (decisão do Claude.)
- **Ficam sempre**: o token cujo editor está aberto (inclusive o recém-criado,
  enquanto se escolhe o valor). Ao fechar o editor, se ele não couber, sai.
- O "+ Filtro", o "Limpar" e a contagem nunca saem.
- O menu usa o gatilho do `OverflowMenu` com **texto** ("+2") em vez do ⋯:
  `OverflowMenu` ganha um rótulo visível opcional (o nome acessível continua
  "Mais 2 filtros"). Se o ícone ⋯ for o padrão, o padrão não muda para os
  outros usos.

## A `FilterBar`

- A prop `overflow` passa a ser `"wrap"` (padrão, inalterado) ou `"menu"`;
  `"scroll"` sai (só a Transações usava). A rolagem da faixa, o
  auto-rolar até o token novo e a dissolução X dessa forma saem junto.
- No `"menu"` continuam: uma linha só, ações e contagem fixas, e na barra
  estreita (<28rem dela) a contagem só com o número (o nome para o leitor de
  tela) e o "Limpar" em ×.
- Teclado: o "+N" é mais um controle da fileira (`role="toolbar"`, setas);
  tokens escondidos (`hidden`) saem da navegação.
- Página do catálogo e `filter-bar-versions.test.ts` na mesma mudança;
  `AGENTS.md` (bullet da `FilterBar`) troca a frase da faixa pela do menu.

## A linha de Transações

- `overflow="menu"`.
- O corte para duas linhas sobe para `@max-3xl` (48rem da linha): achado da
  revisão final — com `@max-2xl`, entre ~672 e ~700px a linha ainda era uma só,
  mas a `FilterBar` já ficava abaixo de 28rem e trocava "Limpar" e contagem; a
  48rem, a forma estreita da barra só aparece com a linha empilhada.

## Fora do escopo / anti-objetivos

- Outras telas, o editor de período, a URL dos filtros.
- Um token sumir sem rastro: todo filtro ativo está à vista ou no "+N".
- Duas árvores por largura.

## Restrições

As de sempre: `AGENTS.md`, tokens, sem px literal, sem prettier, banco de dev
é produção (no navegador só olhar), sem push.
