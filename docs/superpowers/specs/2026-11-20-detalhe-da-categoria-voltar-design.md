# Detalhe da categoria — o voltar no desktop (design curto)

Data: 20/11/2026 · aprovado pelo dono (opção A no navegador).

**Intenção.** No desktop o detalhe da categoria não tinha voltar: a saída era
só a barra lateral. O telefone já tem o voltar na barra do topo.

**Design.** No `PageHeader` do desktop, `PageHeaderTitleRow` recebe
`back={"/categories?month=" + mês aberto}` e `backLabel="Voltar para
Categorias"`: o ‹ compacto antes do ladrilho. O `PageHeaderBack` volta pelo
histórico quando a pessoa veio de dentro do app; aberto por link direto, vai
ao `href`. O telefone não muda.

**Abordagens.** A (escolhida): o voltar do `PageHeader`, peça que já existe,
só nesta tela. B: trilha "‹ Categorias" acima do título — uma linha a mais.
C: voltar na barra do topo — muda a barra de todas as subpáginas do desktop.

**Fora.** Detalhe do cartão e do projeto ainda não usam `PageHeader`;
ganham o voltar na revisão de cada tela.

**Jornada.** `docs/JORNADAS.md` §9 (aresta do voltar no desktop) e o Atlas na
mesma mudança.
