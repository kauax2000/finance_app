# Detalhe do lançamento: "isso pesa?"

Data: 10/11/2026. Tela: o painel de detalhe de uma transação
(`src/components/transactions/transaction-detail-sheet.tsx`), o mesmo aberto
em Transações, no Painel, em Cartões e em Categorias.

## Por quê

Hoje o painel repete o que a linha da tabela já disse (data e autor aparecem
duas vezes), põe tudo no mesmo peso ("Entrou por: App" ao lado da categoria) e
não ajuda a decidir nada. A pessoa abre um gasto para saber **se ele pesa**:
se a categoria está estourando, se a fatura está crescendo, se aquele gasto
saiu mais caro que o normal, quando uma parcela acaba. O painel novo responde
isso primeiro e deixa os dados de registro em segundo plano.

## Objetivos

- Uma leitura de três segundos: valor, o que foi, quando e com o quê, e a
  frase que diz se pesa.
- Cada bloco de contexto leva a algum lugar (a lista filtrada, a fatura, as
  parcelas, o orçamento).
- Nenhum dado repetido; a origem do lançamento sai do lugar nobre.

## Não objetivos

- Editar no lugar (a opção C): fica para depois. Editar continua pelo botão
  Editar e pelo formulário.
- Histograma ou gráfico grande; o contexto é compacto.
- Mudar o banco: só leituras novas.

## Antiobjetivos (falha mesmo que funcione)

- Mais de uma manchete, ou manchete que não diz nada ("Gasto registrado").
- Um número sem rótulo, ou uma projeção que não diz que é projeção.
- O painel ficar mais lento para abrir: o topo e os detalhes aparecem na
  hora; o contexto chega depois, com esqueleto no lugar.
- Mostrar ao convidado o que ele não pode ver (orçamento, fatura de cartão
  com titular).

## A forma (decidida com o dono)

De cima para baixo, igual em todo tipo de lançamento:

1. **Topo**: ladrilho da categoria, o valor grande (`MoneyDisplay xl`, com
   sinal e tom de receita), o nome (sem o "(k/n)" que o banco grava na
   parcela; o chip "k/n" ao lado) e uma linha "Seg, 10 de nov · Bradesco Visa
   •• 3063" (o dia por extenso curto e a forma de pagamento). Sem hora: o
   lançamento só guarda o dia.
2. **Manchete**: no máximo uma frase, a de maior prioridade entre as que se
   aplicam, num `Alert` no tom dela (aviso, informação, sucesso). Sem nada
   relevante, não há manchete.
3. **Blocos de contexto**: cada um com título curto em sobrancelha, um número
   principal e um link à direita do título.
4. **Detalhes**: um bloco pequeno com a categoria e "quem": "Kauã lançou e
   pagou" quando é a mesma pessoa, "Renata pagou · Kauã lançou" quando não;
   recorrência, assinatura e projeto, quando existem, como linhas com link.
5. **A conferir** (o bloco atual), **Partes** (carteira dividida) e
   **Anexos** seguem como hoje, depois dos detalhes.
6. **Rodapé**: Excluir à esquerda, Editar à direita (como hoje). A origem
   ("Lançado pelo app") vira uma nota pequena no fim do corpo.

## Os casos e os blocos

| Caso | Quando | Blocos |
| --- | --- | --- |
| Despesa | sempre | **Categoria no mês** |
| Despesa no cartão | `payment_method = credit_card` com cartão | **Fatura** |
| Gasto que se repete | a mesma descrição (normalizada) apareceu 3+ vezes nos últimos 90 dias, contando esta | **Histórico** |
| Parcela | `installment_plan_id` | **Compra parcelada** (no lugar da seção atual) |
| Receita | `type = income` | **Receitas do mês** |

**Categoria no mês** — com orçamento: "R$ 820 de R$ 1.000", "faltam R$ 180 ·
20 dias", barra do orçamento com o traço do dia do mês; link "ver os N" abre
Transações filtrada pela categoria e pelo mês. Sem orçamento: o total do mês e
"outubro até dia 10: R$ 240" (o mês anterior até o mesmo dia), com o link
"definir orçamento" (abre Categorias no detalhe da categoria). Sem categoria:
o bloco não aparece.

**Fatura** — "Fatura de dezembro", o total até agora, o estado (aberta · fecha
26/nov, fechada, paga) e, se houver parcelas nela, "R$ 1.120 em parcelas";
link "ver fatura" abre a fatura em Cartões.

**Histórico** — "Uber nos últimos 90 dias": barras pequenas das últimas até 8
vezes (esta destacada), "14 vezes · R$ 406" e "média R$ 29"; link "ver os 14"
abre Transações com o filtro Descrição contém.

**Compra parcelada** — total e número de parcelas, quanto falta, barra do
plano, "1 de 2 · próxima 9/dez"; link "ver parcelas". O `ImpactoDaParcela`
segue onde está hoje.

**Receitas do mês** — o que entrou no mês e, se houver receita recorrente
prevista, "de R$ X esperados"; link "ver as N".

## A manchete

Prioridade, a primeira que vale ganha:

1. **Orçamento estourado ou a caminho** (aviso): já passou de 100% — "Mercado
   passou do orçamento de novembro em R$ 120." Ou a projeção linear (gasto até
   hoje ÷ dias decorridos × dias do mês) passa do orçamento, a partir do dia 5
   do mês — "No ritmo de agora, Mercado fecha novembro em R$ 1.180, R$ 180
   acima do orçamento."
2. **Preço fora do normal** (informação): no Histórico, esta vez ficou 30% ou
   mais acima da média das outras — "Este Uber custou 52% mais que a sua média
   (R$ 29)."
3. **Fim das parcelas perto** (sucesso): a última parcela é no mês que vem ou
   neste — "Última parcela em dezembro. Depois, R$ 253,50 a mais por mês."
4. Nada.

Só vale para o mês corrente: num lançamento de um mês que passou, a 1 diz o
que aconteceu ("Mercado fechou outubro em R$ 1.240, 24% acima do
orçamento"), sem projeção.

## Regras

- O topo, a manchete vazia e os detalhes aparecem sem esperar o contexto; cada
  bloco tem esqueleto até a leitura chegar e some se a leitura falhar (sem
  erro gritado: o detalhe continua útil).
- Convidado: nada de orçamento nem de fatura; ele vê o Histórico só das
  próprias despesas.
- Linha projetada ("Previsto") não abre o detalhe — sem mudança.
- Telefone: a mesma ordem, na gaveta; os blocos ocupam a largura.
- Tudo com componentes do design system (`Alert`, `Card`, `Progress` com
  `bands`, `StatCard`/`DescriptionList`, `Chart` para as barras). O traço do
  dia na barra pode não existir no `Progress` hoje: se faltar, é proposta de
  variante e passa pelo dono antes (invariante 6).

## Dados

- Orçamento e total da categoria no mês: as leituras já usadas no detalhe da
  categoria (`budgets` por `period_start`, transações da categoria no mês).
- Fatura: o total da fatura do fechamento desta compra, o mesmo cálculo de
  Cartões.
- Histórico: consulta nova, só leitura, das despesas da carteira com a mesma
  descrição normalizada (sem o "(k/n)", sem acento, minúscula) nos últimos 90
  dias.
- Receitas do mês e recorrentes: as leituras do Painel e da Previsão.

## Para testar

Uma carteira de teste criada pelo app ("Teste · Detalhe"), com:
categoria Mercado com orçamento de R$ 1.000 e gastos que passam do ritmo;
um cartão com fatura aberta; 5 ou mais "Uber" em 90 dias com um mais caro;
uma compra parcelada em 2×; uma receita. Cada caso abre um painel diferente.

## Decisões de construção (decididas pelo Claude, conferir)

- **Fatura**: reusa o cálculo de Cartões (o mesmo slot de `creditCardInvoiceBadgeForRow`
  e o total por fechamento); se ele só existe dentro da tela, extrai para `lib/`
  sem mudar o número de Cartões. Compra de fatura fechada ou paga mostra aquela
  fatura, com o estado dela; o bloco não some.
- **Histórico**: leitura no cliente (Supabase `select` das despesas da carteira
  ativa nos últimos 90 dias, com `ilike` no começo da descrição para estreitar),
  e a normalização (sem "(k/n)", sem acento, minúscula) em JS. Sem RPC nem
  índice novo. Sem as projetadas.
- **Convidado**: a RLS já limita o convidado às próprias despesas; ele vê o
  total da categoria no mês (só o dele), sem orçamento, sem fatura e sem a
  manchete de orçamento.
- **Gasto da categoria no mês**: o mesmo número do detalhe da categoria (a
  mesma leitura, com as mesmas regras de parcela e cartão), para os dois nunca
  divergirem.
- **Receitas esperadas**: as receitas recorrentes da Previsão que caem no mês;
  num mês que passou, só o total que entrou.
- **Leitura**: uma consulta por bloco, dentro do próprio painel (os quatro
  lugares que o abrem não passam dados), com esqueleto e falha por bloco.
- **Links**: usam os parâmetros que já existem (`f=categoria:…,periodo:…` e
  `f=descricao:contains:…` em Transações, o detalhe da categoria, a fatura em
  Cartões). Se algum faltar, criá-lo é mudança de jornada e entra no
  `JORNADAS.md` e no Atlas na mesma mudança.

## Pergunta ao dono

- **O traço do dia na barra do orçamento** pede uma variante nova no
  `Progress` (`ui/`, invariante 6). Sem ela, o plano B é a barra sem traço e o
  "faltam R$ 180 · 20 dias" carregando o ritmo.

## Fica com quem constrói

O texto final das frases dentro do tom acima, os limiares exatos além dos
fixados (30%, dia 5, 3 vezes, 90 dias, 8 barras), a forma do esqueleto, e qual
componente do design system veste cada bloco.
