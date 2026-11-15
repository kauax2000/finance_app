# A tela de Previsão no design system — design

**Pedido (14/11/2026):** dar à tela `/previsao` "design, layout e usabilidade
excelentes com a nova identidade" e pôr a Previsão na barra lateral. O dono
escolheu, entre as versões do artefato
(https://claude.ai/artifact/XWZmc5CFQ7QBvWc8FqdsKW), a **A**.

**Por quê:** a tela é a visão **diária e futura** das finanças da pessoa (palavras
do dono). O estudo de concorrentes
(`docs/produto/concorrentes/2026-10-28-comparativo-ux.md`, §5 e ação nº 1) diz
que "quanto sobra" é a pergunta nº 1 e o único quesito em que estamos zerados; o
Copilot põe o número na primeira linha, com o gasto contra a reta do ritmo.

## Abordagens consideradas

- **A · O número primeiro, o futuro embaixo** (escolhida): o seguro grande, o
  valor por dia e a linha do gasto contra o ritmo; embaixo, de onde vem o número
  e os 6 meses com os acontecimentos escritos. Responde as duas perguntas sem
  toque.
- **B · Mês a mês:** fileira de meses que troca o miolo. Exige tocar mês a mês
  para achar o vermelho; o ritmo só vale no mês atual.
- **C · Hoje e Futuro lado a lado:** duas colunas no desktop. O herói divide a
  atenção com o gráfico; no telefone vira a A.

## Metas, não metas, anti-metas

- **Metas:** o seguro do mês legível num relance; dá para ver se o gasto está
  adiantado em relação ao ritmo; dá para ver o primeiro mês no vermelho e quando
  os parcelamentos acabam; a reserva se edita na própria tela; a Previsão tem
  porta fixa na navegação.
- **Não metas:** mudar as contas de `src/lib/previsao/` (só se soma a do gasto
  acumulado); o cartão compacto do Painel (`SeguroDoPainelWireframe`) continua
  wireframe até a revisão do Painel; saldo de partida entre meses.
- **Anti-metas:** arco-íris ou peça de marca sob número de dinheiro; verde e
  vermelho de estado (`success`/`destructive`) no lugar de entrada e saída
  (invariante 3); componente novo escrito na tela; o número principal sumir
  atrás de um gráfico.

## A tela (versão A)

Ordem única; no telefone vira uma coluna, no desktop o terceiro e o quarto
blocos ficam lado a lado (o "De onde vem" à esquerda, os 6 meses à direita).

1. **Cabeçalho:** `PageHeader collapse` com "Previsão" (o padrão das telas
   revisadas: no telefone o título grande é da casca, `TituloDaTela`).
2. **Herói, "Seguro para gastar em <mês>"** (um `Card`):
   - o seguro em `MoneyDisplay` grande (negativo em `expense`);
   - "R$ X por dia · N dias, contando hoje" (`porDia`, `diasRestantes`); com
     seguro ≤ 0, "Sem folga até o fim do mês" no lugar do por dia;
   - **o gráfico do ritmo** (`ChartContainer` + `ChartLine`): o gasto
     acumulado do mês dia a dia até hoje (linha cheia, `--foreground`) contra a
     reta do ritmo (tracejada, neutra), que vai de 0 no dia 1 ao total que dá
     para gastar no mês (`entra − reserva`) no último dia; o dia de hoje marcado
     por `ChartAnnotation` "hoje". Legenda: "Gasto pela data da compra" ·
     "Ritmo até o fim do mês".
   - **O gasto conta pela data da compra** (decisão do dono, 14/11): toda
     despesa do mês no dia da transação, **inclusive no cartão**, e o estorno
     no cartão abatendo no dia dele; o pagamento de fatura não entra (as
     compras dela já contaram no mês delas). É de propósito um regime diferente
     do seguro (caixa): o gráfico avisa "estou gastando rápido demais?", e a
     legenda diz o regime. Com `entra − reserva ≤ 0`, a reta some e fica só a
     linha, com "Sem receita prevista neste mês" na legenda.
3. **"De onde vem"** (`Card` + `DescriptionList`), tudo o que o wireframe
   mostra hoje:
   - Entra (`income`), com o detalhe "R$ X recebidas · R$ Y previstas"
     (`DescriptionHint`);
   - Despesas fora do cartão (`expense`), com "R$ X pagas · R$ Y previstas";
   - cada fatura que vence no mês: o nome, "vence dd/mm", o valor e, quando
     cabem, os selos "paga" e "total do banco"; sem fatura, "Nenhuma fatura
     vence neste mês";
   - um separador e "Sobra do mês" (entra − sai);
   - Reserva do mês;
   - um separador e "Seguro para gastar".
   Abaixo, em `Muted`: "Já comprometido na próxima fatura: R$ X", se houver
   "Contas sem valor: …", e a nota do regime: "A fatura conta no mês em que
   vence. Cada mês começa do zero." Na barra do cartão, a ação "Editar
   reserva".
4. **"Próximos 6 meses"** (`Card`): `ChartBars` com a sobra de cada mês (barra
   para cima em `--chart-income`, para baixo em `--chart-expense`, o mês atual
   em destaque), um `Badge tone="expense"` "<Mês> fica no vermelho" no canto
   quando há `primeiroMesNegativo`; abaixo, uma lista de `Item` com os
   acontecimentos: o primeiro mês no vermelho ("Sai R$ X e entra R$ Y") e, por
   mês, os parcelamentos que terminam ("Zara e Cadeira terminam" · "A partir de
   <mês seguinte>, R$ X a menos por mês"). Sem acontecimentos, "Nada muda nos
   próximos meses".
   **O entra e o sai de cada mês** (a tabela do wireframe) continuam: na dica
   da barra (`ChartTooltipContent`: entra, sai, sobra) e numa tabela de leitura
   abaixo do gráfico, recolhida num `Collapsible` "Ver mês a mês" (mês, entra,
   sai, sobra, fim de parcelamentos), que também é a versão para leitor de
   tela.
5. **Reserva:** "Editar reserva" abre um `Dialog` (`surface="auto"`) com
   `Form` + `FormInput money` "Reserva do mês" e `FormActions`; a mesma escrita
   de hoje (`workspaces.monthly_savings_target`). Quem não é dono vê a ação
   desligada com a dica "Só quem é dono da carteira altera a reserva".

6. **Fatura acima do normal** (o que o sino promete): quando a fatura aberta de
   um cartão, mais as parcelas que vão cair nela, passa de 120% da média das 3
   últimas fechadas — a mesma regra do alerta `cc_invoice_trending_high`
   (`supabase/functions/_shared/fatura-tendencia.ts`) —, um `Alert
   tone="warning"` logo abaixo do herói: "Fatura do <cartão> X% acima do
   normal" · "R$ Y prevista, vence dd/mm; a média das 3 últimas é R$ Z", com a
   ação "Ver fatura" (`creditCardInvoicePath`). Um por cartão; com menos de 3
   fechadas, nada. A regra no cliente é uma função pura nova em
   `src/lib/previsao/`, travada contra o Deno por
   `src/lib/fixtures/fatura-tendencia-vectors.json` (o teste de paridade que
   já existe).
7. **"E se eu parcelar?"** (o impacto da parcela do Bloco 5, que hoje só
   aparece no formulário): um `Card` depois dos 6 meses com `Form` — valor
   total (`FormInput money`), número de parcelas e, opcional, o cartão — e,
   ao preencher, o quadro que já existe (`ImpactoDaParcela`,
   `src/components/transactions/impacto-da-parcela.tsx`, sobre
   `impactoDaParcela`): a parcela e o fim, o pico, as próximas faturas, o %
   da renda, o 1º mês com seguro negativo e o limite do cartão. **Simula, não
   grava**; a ação "Lançar esta compra" abre o formulário de lançamento em
   Parcelada com os valores preenchidos.
8. **Sem receita recorrente:** no herói, uma linha "Cadastre o salário para
   prever os próximos meses" com a ação "Adicionar receita recorrente"
   (Assinaturas, tipo receita — a receita recorrente do Bloco 5). Some quando
   existe ao menos uma assinatura `income` ativa.

O cartão compacto do Painel (`SeguroDoPainelWireframe`) e o insight "seguro
baixo" (Bloco 6) também saem do Bloco 5, mas moram no Painel: ficam para a
revisão do Painel.

**Estados:** carregando → esqueletos na forma dos blocos (`CardSkeleton`,
`Skeleton`), nunca "Carregando…"; erro → `EmptyState` com "Tentar de novo";
sem carteira → o `EmptyState` existente das telas.

## A barra lateral (mudança de jornada)

- "Previsão" entra em `MAIN_NAVIGATION` logo depois de "Painel" (é a pergunta
  do dia), com um ícone Heroicons `24/outline` de tendência.
- **No telefone** a barra lateral não existe; a Previsão entra no grupo
  **Carteira** da página Você, como as outras telas da barra (minha decisão:
  é o equivalente da barra no telefone; a barra de baixo não muda).
- O convidado segue sem a rota (`rotas-do-convidado.ts`): o item não aparece
  para ele.
- Atualiza `docs/JORNADAS.md` (seção 13 e o mapa: a rota deixa de ser "sem
  entrada no menu"), `docs/atlas/template.html`, o build e a republicação do
  Atlas.

## Restrições

- Só componentes de `src/components/ui/` e tokens existentes. Se faltar algo,
  parar e perguntar (invariante 6).
- O wireframe sai: `linha-do-tempo-wireframe.tsx` é apagado; de
  `seguro-para-gastar-wireframe.tsx` fica só o que o Painel usa
  (`SeguroDoPainelWireframe` e o cartão compacto); a tela nova mora em
  componentes fora de `src/app/` (invariante 1), em
  `src/components/previsao/`.
- Dinheiro por `MoneyDisplay`/`currencyBRL`; datas pelos helpers de
  `transaction-date.ts`; meses por `labelYearMonthPt`/`formatMonthLongPtBr`.
- Nenhuma gravação nova no banco (a reserva já existia).
- `npm run ds:audit` limpo, `tsc`, `lint`, testes.

## Decisões minhas (da revisão do construtor)

- **As barras dos 6 meses mostram a sobra** (entra − sai, sem a reserva), a
  mesma da `projecaoMensal` e do `primeiroMesNegativo`; o rótulo do gráfico diz
  "Sobra". O herói é o seguro (sobra − reserva): os dois aparecem com o nome
  certo em "De onde vem", então não há duas verdades.
- **"R$ X a menos por mês"**: `fimDeParcelamentos` ganha o valor da parcela
  (`installment_amount` do plano) em `projecaoMensal`, testado.
- **Só o mês corrente**, sem navegação de mês (a previsão é de hoje para a
  frente). No dia 1, o gráfico tem um ponto.
- **Dono:** `isWorkspaceOwner(currentWorkspace.id)` do `useWorkspace`, como o
  wireframe. Reserva `null` aparece como R$ 0,00; campo vazio grava `null`, 0
  grava 0 (como hoje).
- **Carteira nova, sem nada lançado** (nenhuma transação, assinatura, plano,
  conta ou cartão): `EmptyState` "Ainda não há o que prever" com a ação
  "Adicionar lançamento". Com qualquer dado, a tela normal; meses sem movimento
  são barras zeradas.
- **No telefone**, a Previsão é a primeira linha fixa do grupo Carteira da
  página Você (antes de Cartões), e `isVoceTabActive` passa a incluir
  `/previsao`; ícone na escala do `Item`.

## Fica para quem constrói

- A função pura do gasto acumulado (`gastoAcumuladoDoMes(dados, ym)` em
  `src/lib/previsao/`), pela data da compra como decidido acima, testada (mês
  de 28/30/31 dias, estorno no cartão, dia 1).
- A escala e os eixos dos gráficos, o texto exato das dicas.
- O ícone exato da barra.
