# Detalhe da categoria — o mês sobe para o topo (design curto)

Data: 20/11/2026 · aprovado pelo dono (opção B no navegador) · segue
`2026-11-20-detalhe-da-categoria-design.md`.

**Intenção.** O cabeçalho do desktop dizia só o nome; a resposta "como estou
neste mês" ficava num bloco "Este mês" dentro da coluna da análise, repetindo
o mês da pílula. O dono escolheu a opção B: o número do mês sobe para logo
abaixo do cabeçalho, na largura toda.

**Objetivo.** Desktop: entre o `PageHeader` e as duas colunas, uma faixa de
largura inteira com o valor do mês (`MoneyDisplay size="3xl"`) e, ao lado, a
legenda "gastos em <mês>" (receita: "recebidos em <mês>"); a barra do limite
(`Progress`, igual à de hoje) na largura da faixa; e numa linha só, separadas
por " · ": a frase do limite, o aviso do previsto ou "Ainda vem", e o peso
("23% do gasto da carteira"). Sem o título "Este mês" (o mês está na pílula).
A coluna da análise começa na Comparação, e a coluna Lançamentos começa na
mesma altura dela.

**Não muda.** O telefone (o bloco já fica no topo, com título e ⋯); o
`PageHeader`, a pílula do mês (texto "Novembro de 2026") e o "+ Lançar"
primário; nada em `src/components/ui/`, `globals.css`, banco ou RPC.

**Abordagens.** (1) Faixa própria abaixo do cabeçalho, no casco da tela —
escolhida: local, sem `ui/`. (2) O resumo dentro do `PageHeader` (sobe com
ele ao rolar): exigiria mudar um componente de `ui/` usado em 11 telas.
Recusada. (3) Encolher o bloco na coluna: não tira a repetição. Recusada.

**Peças.** `CategoryDetailLayout`: no desktop, `resumo` acima da grade de 5
colunas. `ResumoDoMes`: prop `destaque?: boolean` (o desktop passa `true`)
que tira o `PageSectionHeader`, põe a legenda ao lado do valor e junta as
frases numa linha que quebra no estreito. Esqueleto (`category-detail-skeleton.tsx`)
na forma nova. Tokens e peças do design system; `ds:audit` limpo.

**Deixado ao construtor.** Espaçamentos dentro da escada; quebra da linha das
frases em larguras médias.
