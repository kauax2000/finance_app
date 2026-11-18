# Importar e Exportar na barra da lista de Transações (desktop)

Pedido do dono (18/11/2026): a opção 5 da revisão do desktop, "lançar e importar ao alcance", na
versão D do artefato "Cabeçalho de Transações" (https://claude.ai/artifact/1e3ynzCUMELeo2sTBtJLUa).
Ele descartou repetir o "+ Adicionar": a barra lateral já tem o botão de criar.

## Intenção

Importar e Exportar estão escondidos no ⋯ do cabeçalho. Na D eles viram dois botões pequenos na
barra da lista, depois da contagem ("660 lançamentos · Importar · Exportar"), colados ao que
agem: o Exportar leva os filtros da lista, e o Importar põe lançamentos nela.

## O que muda

- **Desktop, com a barra numa linha só:** depois da `FilterBar` (que termina na contagem), dois
  `Button variant="tertiary"` com ícone: "Importar" (`ArrowUpTrayIcon`) e "Exportar"
  (`ArrowDownTrayIcon`). Exportando, o Exportar fica desligado até o arquivo sair, como o item do
  ⋯ hoje. A altura é a da barra (`lg`, a da `FilterBar`).
- **O cabeçalho perde o ⋯:** o `PageHeaderActions` sai da página; o título fica sozinho.
- **Barra estreita** (a linha que parte em duas abaixo de 48rem do contêiner, `@max-3xl/transacoes`,
  e o telefone): os dois botões não cabem e voltam ao ⋯ (`MenuMaisAcoes`) ao lado das abas, como no
  telefone hoje. Uma janela de 768 a ~1000px usa o ⋯; ninguém fica sem os dois.
- **Convidado:** nada aparece, como hoje.
- **O telefone não muda.**

## Fora

- O "+ Adicionar" no cabeçalho (redundante com a barra lateral, decisão do dono).
- Mudar o que Importar e Exportar fazem: só o lugar do botão muda.

## Abordagens consideradas

A (Importar à vista no cabeçalho), B (par Novo + Importar), C (botão com menu) e D (na barra).
B e C repetem o criar. Entre A e D, o dono escolheu testar a D.

## Decisões minhas

- Os dois botões são `tertiary`, o peso mais leve: a barra já tem as abas e o "+ Filtro", e um
  preenchimento disputaria com eles.
- Rótulos curtos ("Importar", "Exportar"): o ícone e o lugar dizem o resto.

## Jornada

Muda onde a pessoa acha Importar e Exportar no desktop: `docs/JORNADAS.md` (a jornada de
Transações e as linhas de Importar e Exportar), o template do Atlas, o build e a republicação.
