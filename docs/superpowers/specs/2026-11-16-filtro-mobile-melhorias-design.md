# Filtro de Transações no telefone: melhorias sem mudar a forma

Data: 16/11/2026. Telas de referência:
[problemas e propostas](https://claude.ai/artifact/4J1nEZymH3ms87EkxLVCRS) e
[vazio colorido](https://claude.ai/artifact/M1d9XgZMHE6d6trMhG9fvZ) (opção B).

## Por quê

O dono quer o filtro do telefone mais perto de um app nativo, **sem mudar a
forma que funciona**: botão no cabeçalho → gaveta "Filtrar por…" → editor de
cada campo, gravando ao vivo na URL (`?f=`). As melhorias vieram de navegar a
tela a 375px.

## Abordagens

- **A. Pílulas dos filtros ativos na tela** (Vivid, Stake). Recusada.
- **B. Pílulas no lugar das abas.** Recusada.
- **C. Filtro dentro da pílula de busca** (Copilot). Recusada.
- **Escolhida: melhorar o fluxo de hoje** item a item, abaixo.

## Escopo aprovado

1. **Vazio do filtro no telefone** (`transacoes-tabela.tsx`, telefone só):
   quando o filtro não acha nada, a tela fica com o cabeçalho, o vazio e a barra
   de baixo. Saem as abas (Todas/Despesas/Receitas), o cartão da lista e o
   cabeçalho da tabela do desktop, e acaba a rolagem lateral. O vazio ocupa a
   altura livre, centrado, direto no fundo da página.
   - Peça: **leque de três ladrilhos coloridos** (opção B), cada carta numa cor
     viva da paleta de ladrilhos (`TILE_PALETTE`, superfície `tile-vivid`), com
     ícone de 24 outline. Ao montar, as cartas se abrem na mola (gesto orgânico
     do sistema, não escala simples); movimento reduzido: já abertas, paradas.
     Não usa arco-íris, então não gasta a peça de marca da tela.
   - Texto: título "Nada por aqui"; descrição "Nenhum lançamento com o filtro
     ligado." / "…com os N filtros ligados.".
   - Ações (par `primary` + `tertiary`): **Limpar filtros** (zera filtros e
     busca) e **Editar filtros** (abre a gaveta do filtro).
   - Vira uma variante do `EmptyStateIcon` em `ui/empty-state.tsx` (o leque
     `stack` ganha a versão colorida), com página do catálogo e teste. OK do dono
     dado em 16/11 ao escolher a opção. Os vazios "primeiro lançamento" e "tudo
     conferido" não mudam.
4. **Contagem no ícone do filtro** (`app-header.tsx`): o ponto vira o número de
   filtros ligados (1, 2…), e o nome acessível diz "Filtrar, 2 ativos". A tela
   publica a contagem pelo `usePageChromeFilter`.
5. **Lista "Filtrar por…" mostra o valor** (`ui/filter-bar.tsx`): no lugar de
   "editar", o valor do filtro ligado ("Últimos 7 dias", "Carro"), truncado, com
   o chevron. Campo sem filtro fica sem valor.
6. **"Limpar tudo" na lista** quando há ao menos um filtro.
7. **Editor de campo**: "‹ Filtros" volta à lista, o título é só o nome do
   campo, e "Pronto" fecha a gaveta. "Remover filtro" fica no pé e só aparece
   quando o filtro já existia antes de abrir o editor.
8. **Teclado no mesmo toque**: Descrição e Valor ganham foco ao abrir o editor;
   `enterkeyhint="search"` na Descrição e `"done"` no Valor.

Fora do escopo: itens 2 (gaveta vazia ao voltar), 3 (primeiro toque perdido), 9
(modos do Valor em duas linhas) e 10 (gaveta do período pulando).

## Restrições

- Desktop não muda. As mudanças de 5 a 8 valem no `FilterBar` do telefone (a
  gaveta); se a mesma peça servir o desktop, o comportamento lá fica igual.
- `ui/` e `globals.css`: OK do dono dado para os itens 1 e 5–8.
- Nada de dado novo no banco; tudo é leitura da URL.
- Jornada: "Editar filtros" no vazio abre a gaveta que já existe. Atualizar
  `docs/JORNADAS.md` e o Atlas se a seção de Transações descrever o vazio.

## Chamadas minhas

- "Fundo preto" = o fundo da página (`--background`), preto no tema escuro; no
  claro segue o tema, como toda tela.
- Interpretei "versão B" como o leque de ladrilhos, sem a lava da opção A.
- As cores das três cartas: as três primeiras matizes distintas da
  `TILE_PALETTE` (laranja, azul, roxo), fixas.
