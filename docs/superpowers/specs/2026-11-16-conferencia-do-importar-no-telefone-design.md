# Conferência do Importar no telefone (opção B)

Data: 16/11/2026. Escolha do dono: opção B ("ações no cabeçalho, abas sozinhas") e "anime as transições".

## Por quê

Nos prints da conferência (passo 2) no telefone:
1. As abas cortam ("Sem categoria" passa da borda).
2. A barra "Colunas: … · Inverter · Ajustar · Ações" quebra em duas linhas, com dois botões de mesmo peso.
3. O card "Saldo" fica entre a lista e o botão e lê como erro.
4. No "Ver todos", lupa, "Ver menos" e "Ações" espremem as abas ("Todos 60 | Saíd…").
5. A linha muda entre as vistas: no resumo, "dd/mm · categoria"; na vista cheia, a data embaixo do valor, o selo antes da categoria e borda de tabela.
6. O total some no "Ver todos".

## Abordagens

- A: a barra em duas linhas e o total no botão. Recusada.
- **B: as ações num ⋯ no cabeçalho e as abas com a linha só para elas. O total vira uma linha discreta acima do botão. Escolhida.**
- C: um resumo que filtra (três cartões) no lugar das abas. Recusada.

## Design (só no telefone, `useIsMobile()`; o desktop não muda)

1. **⋯ no cabeçalho da gaveta**, ao lado do ✕, na linha do título (`DialogHeaderRow` com `endAdornment`). O menu (`DropdownMenu`) traz:
   - **Buscar** (abre o campo de busca, ver 3);
   - **Inverter sinal** e **Ajustar colunas**, só com CSV;
   - um separador e as ações das visíveis que hoje estão em "Ações": Pôr categoria, Deixar fora e Trazer, com os mesmos rótulos.

   Aparece só no passo Conferir.
2. **As abas sozinhas na linha**, roláveis (`scrollable`), com a dissolução de borda que o `Tabs` já oferece. No telefone saem da conferência a barra "Colunas", a lupa e o "Ações" da linha das abas. O "Ver menos" fica no pé da lista, no lugar do "Ver todos".
3. **Busca**: o item "Buscar" abre o campo de busca numa linha logo abaixo das abas, já focado, e o ✕ do campo fecha. Ela vale nas duas vistas. O estado da busca sobe para quem renderiza o cabeçalho, para o ⋯ conseguir abri-la.
4. **Uma linha só nas duas vistas**: à esquerda, o título e embaixo "categoria · estorno"; à direita, o valor e embaixo a data (dd/mm). A vista cheia perde a borda de tabela no telefone e fica igual à do resumo.
5. **Total**: o card "Saldo" vira uma linha "Total" acima do botão, sem caixa, e aparece nas duas vistas. Tocar nela abre o detalhe que o card tinha (entram X de Y, saídas, entradas, sem categoria), pelo mesmo `Collapsible`.
6. **Animações**, a partir de `importar/movimento.ts`, que é a linguagem aprovada para movimento dentro de modal:
   - Trocar de aba: a lista chega em escada (`ESCADA_DA_LISTA`), remontando pela aba.
   - Ver todos e Ver menos: a vista que sai esmaece (`VISTA_QUE_SAI`), a que chega vem em escada, e a gaveta anda na altura (o hook novo da gaveta).
   - Abrir e fechar a busca: o campo brota da linha das abas, com o `field-bloom` ou o `menu-morph` que o sistema já tem.
   - O total muda de valor com `ContagemQueAnda`, como hoje.
   - Com movimento reduzido, tudo troca na hora.

## Não muda

O desktop. O passo 1. A lógica de importar, marcar e categorizar. Os textos que já existem.

## Restrições

Só peças do design system (`DropdownMenu`, `Tabs`, `Item`, `Collapsible`, `Button icon-md`). Nada de `ui/` novo. Se faltar algo em `ui/`, a tarefa para e reporta. Para mudança de jornada (o ⋯ abre ações), atualizar `docs/JORNADAS.md` e o Atlas, se a seção do Importar descrever a barra.
