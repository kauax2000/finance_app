# Estudo de telas dos concorrentes no Mobbin (28/10/2026)

Os dossiês de produto ([EUA](eua/2026-10-26-estudo-eua.md), [Optio](2026-10-21-optio.md))
dizem **o que** cada concorrente faz e cobra. Este estudo cobre **como** as telas
deles fazem isso, no telefone (iOS) e no desktop (web), a partir do Mobbin.

Como ler:
- Toda tela citada tem link para o Mobbin (o link só abre com a conta do Mobbin).
  As imagens estão copiadas em [`telas-mobbin/`](telas-mobbin/), porque as
  imagens servidas pelo Mobbin expiram em 30 dias.
- O que é opinião está marcado como **julgamento**.
- O Mobbin só tem iOS e web: **não há Android**. Aqui, "telefone" quer dizer iOS.

## 1. Cobertura

| App | iOS | Web | Dossiê |
|---|---|---|---|
| Monarch Money | ~45 telas (jul/2025) | ~75 telas (mar/2025) | [monarch.md](telas-mobbin/monarch.md) |
| Copilot Money | ~65 telas (2024 e ago/2026) | ~30 telas | [copilot.md](telas-mobbin/copilot.md) |
| YNAB | ~45 telas (set/2025) | ~35 telas | [ynab.md](telas-mobbin/ynab.md) |
| Rocket Money | ~45 telas + 8 fluxos | ~14 telas | [rocket.md](telas-mobbin/rocket.md) |
| Quicken Simplifi | ~40 telas + 5 fluxos | ~20 telas | [simplifi.md](telas-mobbin/simplifi.md) |
| EveryDollar, Empower, PocketGuard, Honeydue | ausentes | ausentes | [ausentes-eua.md](telas-mobbin/ausentes-eua.md), [everydollar.md](telas-mobbin/everydollar.md) |
| Concorrentes BR (Mobills, Organizze, Optio, Minhas Economias, Olivia, Guiabolso) e bancos BR (Nubank, Inter, PicPay, Mercado Pago, C6, Itaú) | ausentes | ausentes | [brasil.md](telas-mobbin/brasil.md) |
| Padrões de outros apps (Splitwise, KOHO, GoHenry, Klarna, Affirm, Neo, Monzo, Cleo, Fitbit, Brex, Wise…) | sim | parcial | [padroes.md](telas-mobbin/padroes.md) |

Lacunas do Mobbin:
- O Monarch AI Assistant (dez/2025) e os Shared Views do Monarch (out/2025) são
  mais novos que as capturas.
- O único app brasileiro no Mobbin é o iFood. Ele serve para as convenções de Pix
  e de "Resumo de valores".
- A **fatura do Nubank** e as telas dos concorrentes brasileiros vão precisar de
  captura própria.

## 2. O que as telas confirmam: os nossos quatro diferenciais

Os cinco apps americanos do Mobbin deixam os mesmos quatro buracos. Agora eles
estão provados em tela, e não só no dossiê.

| Diferencial | Monarch | Copilot | YNAB | Rocket | Simplifi |
|---|---|---|---|---|---|
| **Família com papéis** | "Family Manager" + membro com acesso total ("only invite people you fully trust"); quem já usa precisa **apagar a própria casa** para entrar | nenhuma tela | YNAB Together: plano inteiro compartilhado, e o gerente vê tudo | "Share with your partner": switch de visão total | nenhuma tela |
| **Fatura que bate** | "Set up bill sync" (Spinwheel); sem fatura | cartão é saldo | uma linha "Credit Spending" | "% do limite" + pagamento recorrente | linha "Credit" |
| **Captura sem banco** | formulário de 7 campos | só para contas manuais | 8 campos, com jargão ("Cleared") | 4 campos | mais de 15 campos |
| **Cobrança honesta** | cartão antes de ver o app; desconto para pagar fora da App Store | pede forma de pagamento, mas tem linha do tempo honesta | paywall antes de qualquer dado no iOS; web "No credit card required" | "pague o que acha justo" com âncora; débito no fim do teste | paywall anual com preço riscado logo após o cadastro |

**Julgamento:** nenhum deles tem tela de quem pagou, de acerto, de limite por
pessoa nem de filho com visão restrita. Também nenhum tem tela de fechamento,
parcela, estorno ou conferência de fatura. Nenhum lança por mensagem, voz ou
foto: os chats de finanças do Mobbin (Cleo, Lloyds, Origin) só respondem
perguntas. Nos quatro pontos, o terreno está vazio.

**Ameaça:** o Simplifi já oferece a **Apple Wallet como fonte de contas** no
onboarding (selo "NEW"). Se o nosso Apple Pay for só captura, ele já tem a versão
de conexão.

## 3. Navegação: telefone × desktop

| App | Telefone | Desktop |
|---|---|---|
| Monarch | tab bar de 5 **personalizável** (Dashboard travado) + gaveta ☰ "More / Your Household" | sidebar de 10 itens, abas de sub-visão no cabeçalho, coluna "Summary" à direita |
| Copilot | **sem tab bar**: pílulas roláveis no topo (reordenáveis); todo detalhe abre em folha | três colunas: sidebar com contas e saldos · lista · painel de detalhe fixo (ver, editar e criar) |
| YNAB | tab bar de 5 com "+" central e aba **Help** | três colunas: sidebar escura · grade · inspetor |
| Rocket | tab bar de 5; "More" abre gaveta | sidebar de 7, sem gaveta |
| Simplifi | **só gaveta ☰** (Reports com 9 subitens escondidos) | trilho de ícones + coluna de contas em árvore |

**O padrão do desktop é de três colunas:** navegação, lista e detalhe fixo. A
nossa web já tem a sidebar e o `DataTable`. **Julgamento:** o que falta é um
painel de detalhe que fique aberto ao lado da lista, como o do Copilot e o do
YNAB, em vez de diálogo.

**O padrão do telefone é tab bar com "+" central** (YNAB) ou com o "+" à parte.
Gaveta como navegação única (Simplifi) e pílulas roláveis (Copilot) escondem
metade das seções. A nossa `BottomBar` com o `BottomBarAction` segue o padrão
bom.

## 4. Padrões para copiar, por área

### Painel: "quanto ainda dá"
- O número principal é o que **sobra**, não o que foi gasto: "$577 left out of
  $2,927" no Copilot e "£160.67 left to spend this month" no Monzo.
- O Copilot desenha a linha do gasto acumulado contra a **reta do ritmo ideal**,
  com o selo "$99 under" na ponta.
- Dar o **valor por dia** ao lado do mês: "−$8.71 Available per day" no Simplifi,
  "$1,815/day for the next 11 days" no Rocket web.
- Comparar sempre com o **mesmo trecho do mês anterior**, em linha tracejada
  (Copilot, Rocket, Lloyds).
- A conta do plano em cascata, com cada termo clicável (Simplifi web): Receita −
  Contas − Planejado − Outros − Metas = Sobra. **Julgamento:** na nossa versão de
  família, cada termo também diz "de quem".

### Revisão: o que a IA lançou
- Uma **fila "a revisar" com dono**: "Needs review by <pessoa>" no Monarch, com
  filtro por pessoa no widget e o vazio "You reviewed everything!".
- No Copilot, a revisão aparece como ponto azul na linha, bloco TO REVIEW no
  painel e filtro "Review status".
- **Julgamento:** é o encaixe natural da nossa captura por mensagem e IA. O que
  a IA lança entra na fila, com o dono certo.
- **Corrigir oferece regra:** depois de editar, um toast oferece "+ Rule", e a
  prévia mostra "43 transações vão mudar" com o nome antigo riscado (Rocket,
  Monarch).
- No detalhe, **setas ↑↓** levam à próxima transação sem fechar a folha
  (Monarch web).

### Lançamento
- O Monarch iOS mostra o **novo saldo enquanto se digita**. Para nós, o
  equivalente é "limite do cartão depois desta compra" ou "quanto ainda dá
  depois desta".
- O Simplifi tem o atalho "Expecting a refund? Track it here" e o **Refund
  Tracker** (Esperados × Recebidos, com data esperada e alerta). **Julgamento:**
  ligar o estorno esperado à fatura que deveria trazê-lo é terreno só nosso.
- O "Ignore" do Rocket tem 3 níveis: não ignorar · fora do orçamento · fora de
  tudo. O Simplifi faz o mesmo com "Excluir de: Plano / Relatórios". Resolve
  transferência entre carteiras e estorno sem apagar nada.
- Fora de finanças, o Fitbit mostra **a frase virando registro**: a resposta traz
  o cartão do registro criado, convida a corrigir conversando e avisa que a IA
  erra. A foto de recibo do Brex **casa com o lançamento que já existe** ("Keep"
  ou "Select manually") em vez de criar outro.
- **Evitar:** formulário longo e jargão contábil (Cleared, Working Balance, flag,
  cheque).

### Orçamento e categorias
- O YNAB põe uma **frase de estado sob a barra** de cada categoria: "$1,400 more
  needed this month", "Funded. Spent $50 of $200", "Fully Spent". **Julgamento:**
  é a melhor peça do estudo, porque troca "decifre a cor" por uma frase. Na
  fatura ela vira "Faltam R$ 320 para cobrir a fatura de 10/nov".
- O número principal é **auditável**: o popover do "Ready to Assign" mostra a
  conta (YNAB). Na fatura, o equivalente é "por que o total é este?", com
  parcelas, estornos e ajustes linha a linha.
- **O erro vem com o conserto:** "You assigned more than you have [Fix This]"
  (YNAB).
- O editor de valor do Monarch iOS mostra o **histórico ao lado**: os 6 meses
  anteriores, o mês passado e a média.
- **Evitar:** o vermelho gritante no primeiro dia ("Left to budget −$91,038" no
  Monarch) e o mar de barras vermelhas sem dizer quanto passou (Copilot).

### Recorrentes e assinaturas
- A **regra do recorrente é uma frase editável** (Copilot): "Lançamentos chamados
  [X], de [R$] a [R$], em [qualquer dia do mês], todo [mês]". Embaixo vêm o
  próximo pagamento e o gráfico de pontos com o mês seguinte tracejado. Ao mudar
  a regra, aparece "Desfazer / Recalcular todos".
- O Rocket mostra o **custo anualizado** por grupo ("$377 per year") e no
  cancelamento ("save up to $95.88 per year").
- Ao **remover, pede o motivo** (apagar ou "já cancelei"), e as inativas ficam
  numa lista "inativa desde" (Rocket).
- Para contas detectadas, o Simplifi propõe a lista com a instrução "desmarque
  o que não quer".
- **Evitar:** o concierge do Rocket pede a **senha da conta de terceiros** (a da
  Amazon) para cancelar.

### Fatura e parcelas (padrões de fora dos concorrentes)
- **Parcelas** numa linha do tempo curta, com o valor em cada ponto (Klarna).
- **Pago × restante** sobre uma barra (Affirm, Neo).
- **Vencimento relativo:** "Aug 28 (in 16 days)" (Neo).
- **Cada valor com a consequência:** total, fatura e mínimo, cada um com o que
  evita (Neo). **Julgamento:** dizer ao lado do mínimo que ele leva ao rotativo é
  uma honestidade que os bancos brasileiros não praticam.

### Família
- O **saldo em frase com direção**: "Overall, you owe $180", com o "Acertar" na
  própria linha (Splitwise).
- **"Quem pagou" é um estado da linha da pessoa:** selo "pagou", valor riscado, e
  os outros "devem" (KOHO).
- **O papel explicado pelo que pode e não pode** antes do convite (co-responsável
  do GoHenry), com a escolha numa lista de papéis de uma linha cada.
- **Julgamento:** dentro de casa, "deve" em laranja soa acusatório. Melhor "a
  acertar" ou "Ana pagou por vocês dois", em cor neutra.
- **Evitar** os dois erros do Monarch: o aviso "acesso total" como única
  proteção, e exigir que a pessoa apague a própria casa para entrar.

### Onboarding e paywall
- O YNAB **ensina antes do cadastro**: um mini-jogo de potes, depois o plano
  pronto, e o cadastro vira "salve o que já fez". O custo é alto: 12 telas no iOS
  e 21 na web.
- O Copilot fecha o onboarding com uma **revisão**: renda, contas fixas e
  orçamento sugerido, cada um com "Revisar".
- **Teste com linha do tempo real** (Copilot, Monarch): hoje · aviso 7 dias antes
  · cobrança, com "Skip" visível. O paywall do iOS do YNAB tem uma **caixa de
  ciência** com a data exata do fim do teste e o valor da renovação.
  **Julgamento:** sem cartão, a nossa linha do tempo é mais forte: "hoje: tudo
  liberado · dia X: aviso · dia Y: volta ao grátis, nada é cobrado".
- O FAQ do paywall do Copilot liga o preço a nunca vender dados (Jomo faz o
  mesmo). A coluna "Grátis" de verdade na tabela de planos (GoPay, Quicken) casa
  com "grátis para sempre".
- **Evitar:** o cartão no teste (WHOOP, Monarch, Copilot), o desconto que pune
  quem compra pela App Store (Monarch), o "pague o que acha justo" com âncora
  (Rocket) e o celular obrigatório no cadastro (Simplifi).

### Detalhes de acabamento
- Saldo **sem depender de cor**, como preferência: contorno e símbolo nos chips
  (YNAB "Differentiate Without Color"; Copilot com cores acessíveis e "mostrar
  + e −").
- **Olho que esconde todos os valores** (YNAB). **Compartilhar gráfico como
  imagem** com "ocultar valores" (Monarch).
- **Soma da seleção** no topo da lista e **barra flutuante de ações em lote**
  (YNAB, Monarch).
- **Status por fonte de dado** (Monarch: Healthy / Report an issue). O nosso
  equivalente é o estado da importação da fatura ou do canal de captura.

## 5. O que levar para o produto

Ordenado por impacto contra os diferenciais. **Julgamento** em todo o item.

1. **A fatura como tela própria**, com a frase de estado ("Faltam R$ X para a
   fatura de 10/nov"), o total auditável linha a linha, as parcelas em linha do
   tempo, o vencimento relativo e os três valores (total, fatura, mínimo), cada um
   com a consequência. Nenhum concorrente tem essa tela.
2. **A fila "a conferir" com dono:** o que a IA, a mensagem ou o Apple Pay
   lançaram entra para conferência de quem lançou ou de quem é o cartão. O vazio
   é "Você conferiu tudo!". Corrigir oferece regra, com prévia.
3. **O lançamento por frase mostra o registro criado** dentro da resposta,
   corrigível na conversa. O formulário fica curto, e o resto vai para "mais
   detalhes".
4. **O estorno esperado ligado à fatura** (Refund Tracker do Simplifi + fatura):
   "esperado na fatura de nov · não chegou".
5. **Família:** o convite mostra o papel e o que ele vê; o saldo da casa vira
   uma frase ("Ana pagou R$ 180 por vocês"), com "Acertar" na linha; e entrar
   numa carteira nunca apaga a carteira de ninguém.
6. **O painel abre com "quanto ainda dá"** e o valor por dia, com o ritmo ideal e
   o mesmo trecho do mês passado tracejado.
7. **Paywall com linha do tempo sem cartão**, coluna Grátis real e FAQ de dados.
8. **Desktop em três colunas:** um painel de detalhe fixo ao lado da lista de
   transações.

Itens que mudam telas entram como wireframe primeiro, conforme o `AGENTS.md`.

## 6. O que ainda falta

- **Brasil:** capturar à mão Mobills, Organizze, Optio e a fatura do Nubank e do
  Inter (iOS e Android). O Mobbin não tem nenhum deles.
- **EveryDollar, Empower, PocketGuard, Honeydue:** fora do Mobbin. Para o tema
  casal, os substitutos mais próximos são os fluxos de parceiro do Origin e de
  conta conjunta do KOHO, com links em
  [ausentes-eua.md](telas-mobbin/ausentes-eua.md).
- **Android:** o Mobbin não cobre.
- **Não verificado:** o Monarch AI Assistant e os Shared Views (mais novos que
  as capturas), as telas de Score e Metas do Rocket e o Quicken Assist no iOS.
