# As ações da direita: mês com setas, ordem em ícone (A) — desenho curto

Data: 19/11/2026. Escolha do dono: **A**.

## Por quê

À direita da barra de Categorias, "Maior gasto ⌄" e "Novembro de 2026 ⌄" são dois textos iguais lado a lado. O dono não gostou. O mês muda a tela inteira e a ordem só arruma os cartões, então os dois não deveriam ter o mesmo peso.

## O que muda

- **O mês (desktop)** vira uma pílula flutuante com três partes: ‹ Novembro de 2026 ›.
  - As setas passam um mês para trás ou para a frente, sem abrir nada.
  - O nome abre a grade de meses de hoje (o mesmo `MonthNavPanel`).
  - A pílula é composta com peças do sistema, em `ButtonGroup` com `Button variant="floating"`, na altura da barra (36). As setas são `icon-*`, com `aria-label` "Mês anterior" e "Próximo mês".
- **Onde o mês muda:** a mudança mora no `MonthNav` do desktop (`dense`), então vale em toda tela que o usa: Categorias, Painel (`dashboard-toolbar`), o detalhe da categoria e a análise da fatura do cartão. Regra do dono: o ajuste de UI vale em todo componente igual. O telefone não muda: o mês continua no cabeçalho (`useMonthInHeader`), e a fatura no telefone segue `mobileTriggerFullWidth`.
- **A ordem (desktop)** vira só o ícone ⇅ (`BarsArrowDownIcon`), num botão `tertiary` de ícone, sem fundo e à esquerda do mês. Ele abre o mesmo menu de rádio e leva `aria-label="Ordenar categorias: <ordem atual>"`, com uma dica (`Tooltip`) "Ordenar". O telefone continua com o botão `floating` de ícone.
- **Hierarquia:** o mês é a peça principal, com fundo. A ordem é a secundária, sem fundo e menor.

## O que não muda

As abas, a contagem, a grade de meses, a animação do marcador, o "Este mês" e os limites.

## Abordagens

1. **A (escolhida):** o mês com setas numa pílula e a ordem em ícone.
2. **B:** uma pílula só, partida ao meio. As duas ações continuavam com o mesmo peso.
3. **C:** o mês em destaque e a ordem em texto cinza. Ocupava mais espaço e o mês não ganhava setas.
4. **D:** a ordem escondida num botão de ajustes. Ficava um toque mais longe.

## Fica com quem constrói

A composição exata da pílula (`ButtonGroup` ou peça interna do `MonthNav`), desde que use componentes do sistema. Quando o mês está no limite (`min`/`max`), a seta fica desabilitada se o `MonthNav` já tiver limite. Se não tiver, nada muda.
