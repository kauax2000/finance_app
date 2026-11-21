# Detalhe da categoria enxuto (C) e "Para onde vai o dinheiro" no Painel

**Por quê.** A aba Resumo do detalhe da categoria cresceu para uns 14 blocos, e vários números se repetiam:
- o total do mês aparecia 4 vezes;
- a média aparecia 3 vezes;
- a compra de R$ 2.000, 4 vezes.

A tela virou um segundo Painel. A decisão registrada do dono é que **a análise mora no Painel**, e Categorias é uma tela secundária. O dono escolheu a **C evoluída** (21/11/2026):
- a categoria responde a três perguntas: quanto foi, se é normal, o que foi;
- tudo o que sai dela entra no Painel, numa seção nova.

**Mockup:** `docs/design/painel/c-evoluida-e-painel.html`, aprovado.

## Abordagens
- **A.** Enxuta, com 7 blocos por pergunta e os gráficos à vista. Recusada: ainda é um painel de gráficos.
- **B.** Quatro respostas em frase, com o gráfico sob demanda numa folha. Recusada.
- **C evoluída (escolhida).** A categoria fica com a faixa, os últimos 6 meses, um insight e a lista. O resto vai para o Painel.

## O detalhe da categoria
Sem as abas Resumo e Lançamentos. A ordem, no telefone e no desktop:
1. **A faixa do mês**, como está hoje: o valor, a comparação e a régua.
2. **"Últimos 6 meses"**: o cartão de hoje, com o selo contra a média, a tendência, a média rotulada e o maior mês. Com limite, a linha do limite também aparece, com a `ChartReferenceLine` e o rótulo "limite R$ X". Tocar num mês **não** navega.
3. **Um insight só**: o primeiro dos `insights` que tem ação (definir limite, ou a parcela que termina com "Ver na Previsão"). Sem nenhum com ação, não há cartão. O convidado vê a sugestão sem o botão, como hoje.
4. **A lista de lançamentos**: o `CategoryEmbeddedTransactions` de hoje, com a mesma ordem, o "Ver em Transações" e o vazio, agora direto na tela.
5. **"Ver a análise de \<categoria\> no Painel ›"**: um link (`Button variant="link"` ou o link do DS) para `/dashboard?categoria=<id>#para-onde-vai`.

Saem da tela:
- Ritmo do mês, Como foi pago, Dias da semana e Tamanho das compras;
- Destaques dos gastos;
- Já comprometido: parcelas, assinaturas e o que se repete;
- os fatos de "Para ficar de olho";
- a Comparação do telefone, que a faixa já mostra.

O código que só esses blocos usavam sai junto. O que o Painel reaproveita (ver abaixo) muda de lugar, não é apagado.

## O Painel: "Para onde vai o dinheiro"
Uma seção nova, com o `PageSection` titulado "Para onde vai o dinheiro" e a âncora `id="para-onde-vai"`. Ela fica depois do bloco de cima (Seguro para gastar, Insights, KPIs) e antes do calendário, das faturas, das parcelas e das categorias.

- **Escopo.** A despesa do mês do Painel (`calendarYm`), na carteira inteira, com o mesmo corte de mês que o Painel já usa: o crédito vai pelo fechamento da fatura.
- **Filtro.** "Todas as categorias ▾" fica no cabeçalho da seção, nas `actions` do `PageSectionHeader`, como um `Combobox` de categoria, porque a pessoa procura pelo nome. A categoria escolhida vai para a URL (`?categoria=<id>`, por `router.replace`, sem empilhar histórico), e "Todas" tira o parâmetro. Uma categoria que não existe, ou que não é de despesa, cai em "Todas".
- **Os cartões.** São os mesmos que a categoria tinha, com o mesmo desenho e as mesmas regras de hoje:
  1. **Ritmo do mês** (o acumulado do mês contra o anterior, a projeção e a dica com a diferença), na largura toda;
  2. **Tamanho das compras** (a concentração e as duas maiores) e **Como foi pago** (a barra dividida, a lista com o ícone e a cor da forma, e a diferença contra o mês anterior), lado a lado;
  3. **Dias da semana** (os dias úteis contra o fim de semana, e a fileira de calor) e **Destaques** (maior compra, compra típica, mais frequente e dia mais caro), lado a lado.
  
  Os rodapés de enchimento ("9 compras no mês", "Segunda foi o dia mais caro") **saem**.
- **Cor.** Sem categoria escolhida, a série usa a cor neutra dos gráficos da casa: `--chart-expense`, a do gasto. Com categoria, usa a cor dela, como hoje: `tileVividColor(tileColorFor(cor))`.
- **Quem vê.** Só quem vê o Painel de adulto. O convidado tem o Painel dele e não ganha a seção.
- **Vazio.** Um mês sem despesa (ou a categoria escolhida sem despesa no mês) mostra o `EmptyState` da seção, com a frase "Sem gastos em \<mês\>", e não a seção vazia.
- **Carregando.** O esqueleto da seção entra no `DashboardPageSkeleton`.

## Onde mora o código
- Os cartões saem de `src/components/categories/detail/resumo/graficos-do-resumo.tsx` e de `cartoes-do-gasto.tsx` para uma pasta de domínio nova, `src/components/analise-do-mes/`. Cada cartão fica em um arquivo e recebe dados prontos, sem saber de categoria nem de Painel. As funções de cálculo continuam em `src/lib/categoria-resumo.ts` e `src/lib/categoria-detalhe.ts`. Se um nome ficar enganoso, ele pode ganhar um apelido; arquivo novo não é obrigatório.
- O Painel calcula os dados num hook ao lado do `use-dashboard-data.ts`, com as transações que ele já carrega (`transactionsWide` e `prevTransactions`). Se faltar o mês anterior para o ritmo e para a diferença da forma, a busca acontece pela query que o Painel já usa, sem RPC nova.

## Jornadas (obrigatório)
Muda a navegação:
- as abas saem da categoria;
- nasce a ponte categoria → Painel filtrado;
- o Painel ganha o parâmetro `?categoria=`.

Atualizar `docs/JORNADAS.md` (jornadas G4 e G9, e o mapa geral), `docs/atlas/template.html`, rodar `python3 docs/atlas/build.py` e republicar o Atlas. A republicação fica com a sessão principal.

## Fora
- O desenho do resto do Painel, que segue em wireframe onde já era.
- Os gráficos de divisão guardados para a revisão do Painel.
