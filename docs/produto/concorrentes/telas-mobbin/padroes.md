# Mobbin — padrões transversais para os nossos diferenciais

Estudo de 2026-10-28, Mobbin MCP (só `ios` e `web`). Descrições feitas olhando as telas.

## Cobertura

| Tópico | iOS | Web | Apps com bons exemplos | Ausentes no Mobbin |
| --- | --- | --- | --- | --- |
| 1. Família / dividir / acerto | forte | fraca | Splitwise, KOHO, Monzo, Starling, GoHenry, PayPal, Notion | Tricount, Honeydue, Zeta, Greenlight (não apareceram) |
| 2. Fatura, parcelas, vencimento | média | fraca | Neo Financial, Klarna, Affirm, Copilot, Lloyds | Apple Card/Wallet, Nubank |
| 3. Captura rápida (foto, chat, voz) | média | — | Google Health (Fitbit), Cleo, Brex, Airwallex, Wise, Copilot | Expensify, Ramp (não apareceram) |
| 4. Paywall e teste honesto | forte | média | Monarch, Copilot, pillowtalk, Givingli, Jomo, Cleo, GoPay, Quicken, Craft, Intercom | — |
| 5. Painel do mês | forte | média | Copilot (iOS e web), Monzo, Klarna, Starling, Lloyds | Apple Wallet |

## 1. Finanças compartilhadas / família

- [Splitwise — Grupos](https://mobbin.com/screens/8d4a1f26-0dd5-488c-a257-990a28c15159) (iOS):
  topo "Overall, you owe $180.00" em laranja; cada grupo com foto, "You owe John D.
  $200.00" e um botão contornado "Settle up" na própria linha; FAB "Add expense".
  **Padrão**: o saldo líquido é a primeira frase da tela e cada linha já traz a ação de
  acertar. Funciona porque responde "quem deve a quem" sem abrir nada.
- [Splitwise — Saldos do grupo, expandido](https://mobbin.com/screens/a65c5e3d-efa0-456e-8cf2-dc87f760e198) (iOS):
  "Alex Smith gets back $158.00 in total" (verde) / "Sam Lee owes $158.00" (laranja);
  expandir mostra a dívida par a par e dois botões "Remind…" e "Settle up". Rodapé:
  "Simplify debts is turned off — Turn on now". Variantes:
  [simplificar ligado](https://mobbin.com/screens/973e57e7-b7d4-4be1-bfc6-d24711597608).
  **Padrão**: frase em linguagem natural com verbo de direção (recebe/deve) + cor;
  "simplificar dívidas" como opção explícita do grupo.
- [KOHO — Nova despesa](https://mobbin.com/screens/475292ac-19e3-4c1f-87f5-c75473e5db4b) (iOS):
  card da despesa (Dinner, $50.00), linha "Split equally — Evenly with all members" com
  lápis, e por pessoa: quem pagou com selo "Paid for the expense" e o valor riscado,
  quem não pagou com "Borrowed $25.00". Aviso: "members will be notified". **Padrão**:
  "quem pagou" é um estado da linha da pessoa, não um campo separado; o valor riscado
  mostra que a parte dela já está quitada.
- [Monzo — Dividir conta](https://mobbin.com/screens/c6e308a3-8bff-48f8-b6e6-582d6d4008bd) (iOS):
  transação no topo (Carrefour, 20.74), cada pessoa com avatar de iniciais e
  stepper −/+ no valor (10.37 / 10.37), "Add someone outside Monzo", CTA "Request
  Money". **Padrão**: divisão igual por padrão, ajuste fino por stepper na linha.
- [Monzo — Pessoa e acerto](https://mobbin.com/screens/0d05e08e-2846-48fa-b63d-fe72446607e1) (iOS):
  avatar grande, linha "Settle up — All or part of what you owe 0.00", histórico com
  "Netflix 3.39 — You're owed 2.26". **Padrão**: acerto parcial permitido.
- [Monzo — Home com conta conjunta](https://mobbin.com/screens/f5c5680b-88b8-4289-b068-100b3484222d) (iOS):
  cartões empilhados (Barclays, "monzo JOINT £1,054.31", conta pessoal £40.96) e na
  atividade "Request for: Carrefour…" e "They requested". **Padrão**: a conta conjunta é
  uma carteira irmã da pessoal, trocada por toque, não outro app.
- [GoHenry — Convidar co-responsável](https://mobbin.com/screens/6fe0e5d8-b7fd-4738-a632-079447b2c4ff) (iOS):
  "Here's the lowdown": o responsável principal responde pela conta; o co-responsável
  "pode fazer tudo o que você faz, exceto adicionar ou remover cartão", lista com ícones
  do que ele pode (recarregar, mesada e limites do filho, notificações, suporte), aceite
  de termos e CTA "Invite a co-parent". **Padrão**: o papel é explicado pelo que a pessoa
  **pode e não pode** fazer, antes do convite.
- [Notion — Convidar com nível de acesso](https://mobbin.com/screens/42c70a6f-1dcc-4823-9cd5-a94a6d1d1574) (iOS):
  folha "Change access" com Full access / Can edit / Can comment / Can view, cada um com
  uma linha do que inclui. **Padrão**: escolha do papel numa folha com descrição curta.
- [Copilot web — Dividir transação](https://mobbin.com/screens/f4043a72-6e85-46c8-98e4-88920d9899de) (web):
  modal sobre a lista, abas "Equal split / Custom split", linhas com categoria e %,
  "+ Add split", rodapé "Left to split $0.00" em verde. **Padrão**: contador do que
  falta dividir trava o salvar sem mensagem de erro.
- Extra: [Starling — Settle Up por link](https://mobbin.com/screens/a7fe15a0-7d08-466e-add3-a86f123fa858)
  (iOS): link copiável, valor opcional, mensagem, "Share link" — cobrar quem não usa o app.

## 2. Fatura / cartão com parcelas, fechamento e vencimento

- [Neo Financial — Statement](https://mobbin.com/screens/7e4658ca-b17a-462e-804c-5aed63ea6bf3) (iOS):
  bloco "Statement": "$22.66 — Remaining due of $22.66" com barra de progresso,
  "Payment due Aug 28 (in 16 days)", "Minimum payment $17.99"; abaixo Auto-Pay (Off),
  depois transações. **Padrão**: o que falta pagar + barra + data com contagem relativa
  ("em 16 dias") no mesmo cartão.
- [Neo Financial — Cartão sem fatura](https://mobbin.com/screens/4048a2af-3608-4e60-9e60-f585beb963df) (iOS):
  saldo atual, "Utilization 0%" com ponto verde, "Available credit $6,000.00 of $6,000",
  três ações (Pay / View statements / Manage card), "No payment due" e "Next statement
  available Aug 7". **Padrão**: quando não há fatura, a tela diz quando a próxima fecha.
- [Neo Financial — Valores para pagar](https://mobbin.com/screens/a8d3f242-1801-44bc-ba4e-64bc48837175) (iOS):
  três opções copiáveis: Total balance, Statement balance ("Avoid interest charges"),
  Minimum payment ("Avoid impacting your credit score"). **Padrão**: cada valor diz a
  consequência de pagar aquele valor.
- [Klarna — Confirmar plano](https://mobbin.com/screens/2d3fe1c9-c3c3-4ec8-8ba8-14a7d550c41a) (iOS):
  "Pay in 4 — $8.75 every 2 weeks", linha do tempo vertical com pontos: Due at purchase /
  In 2 weeks / In 4 weeks / In 6 weeks, cada um com o valor. **Padrão**: parcelas como
  timeline curta com data relativa; é o desenho mais legível de parcelas do Mobbin.
- [Klarna — Escolher plano](https://mobbin.com/screens/93080bc9-d64f-433d-889f-c8106e0e8636) (iOS)
  e [Truth in Lending](https://mobbin.com/screens/4669a63b-f934-4de2-b5b7-51511797590f):
  chip "0% interest", "Total $35.00", número de parcelas e encargo financeiro $0.00 em
  caixa destacada. **Padrão**: o custo total e o juro zero ficam visíveis antes de
  confirmar.
- [Affirm — Cronograma do plano](https://mobbin.com/screens/fd94185a-5347-422f-8927-ff4f08b305e8) (iOS):
  abas Schedule/Details, "Payment progress" com barra, "Paid to date $0.00 / Remaining
  $56.00", "Plan timeline" com eventos. **Padrão**: pago vs. restante como par de números
  sobre a barra.
- [Copilot — Recorrente](https://mobbin.com/screens/430efb0a-7ac5-42e1-a8e3-a3e7c46e3abe) (iOS):
  regra em frase editável ("Transactions named X from $2 to $7 on any day of the month
  every month"), "Next payment $9.00 expected around Sep 18th", gráfico com o ponto
  futuro tracejado, histórico. **Padrão**: o futuro é tracejado no mesmo gráfico do
  passado.
- [Lloyds — Extrato em PDF no app](https://mobbin.com/screens/0335eca0-1c09-483d-a1a6-91da127c9b62) (iOS):
  o PDF do extrato mensal renderizado em páginas, com compartilhar. Referência para o
  nosso "conferir com o PDF da fatura".
- Web: nada de fatura de cartão de consumo. O mais próximo é
  [Google Ads — Billing summary](https://mobbin.com/screens/6af831aa-2964-4137-8671-7bdb99b7be63):
  três cartões (Balance / Next automatic payment / Last payment) e o mês corrente
  decomposto em "Balance from May, Spend, Taxes, Net cost, Payments, Current balance".
  **Padrão**: reconciliação do período em linhas que somam.

## 3. Captura rápida

- [Google Health (Fitbit) — Ask coach](https://mobbin.com/screens/8facdb3a-644e-412d-b566-d58eb2793c11) (iOS):
  a pessoa escreve "I just had a cup of coffee"; a resposta diz o que foi registrado e
  mostra um **cartão do registro** ("Nutrition log · Coffee · Today, 9:54 AM · 2 cal");
  convida a corrigir ("Let me know if you added any milk"); campo com microfone; aviso
  "Coach is AI and can make mistakes". **Padrão**: frase livre → registro estruturado
  visível no chat, com correção conversacional. É exatamente o nosso lançamento por
  mensagem, fora de finanças.
- [Cleo — Chat](https://mobbin.com/screens/c9fc6adc-37a7-435b-baff-5ca70c720ea4) (iOS):
  resumo em texto ("+ $331 Income − $201 Spent = $129 Net"), chips de resposta rápida
  ("by merchants", "to my insights feed"). [Cleo AI — Hey you](https://mobbin.com/screens/73d8bc4c-bc92-4520-9633-40e0f6f4bec5):
  abre com uma observação sobre os gastos e três respostas prontas; campo "Ask me
  anything" com botão de voz. **Padrão**: chips sugeridos reduzem digitação.
- [Brex — Scan receipt](https://mobbin.com/screens/590f0b25-00c8-47b4-8a81-51bcdf73d3e1) (iOS):
  após a foto, a transação casada aparece no topo (£2.50) com "Select manually" em
  laranja, campo de memo, botões Retake / Keep. **Padrão**: o recibo é casado com uma
  transação existente, e a pessoa só confirma.
- [Revolut Business — My receipts](https://mobbin.com/screens/06fddf49-fce7-4440-a537-e9502a702803) (iOS):
  área tracejada "Tap to scan a receipt", item com status "Scanning…" e o e-mail para
  encaminhar recibos. **Padrão**: processamento assíncrono com estado na lista.
- [Airwallex — Reembolso preenchido](https://mobbin.com/screens/d7e0560a-014b-4312-b7e9-ce1511ba345b) (iOS):
  recibo anexado com "View receipt", data, valor com moeda, comerciante e descrição já
  preenchidos e editáveis.
- [Wise — Upload. Check. Send.](https://mobbin.com/screens/a4810e56-b3ae-4d50-a0fd-917c3d0e350f) (iOS):
  enviar boleto/fatura/print (PNG, JPG, PDF), "We autofill the recipient details and
  transfer amount", "Check everything looks okay", aviso de que a IA erra. **Padrão**:
  três passos nomeados no título e honestidade sobre a IA.
- [Copilot — Nova transação](https://mobbin.com/screens/a2db6184-4699-44c2-8122-9d4f56b71d78) (iOS):
  abas Regular / Income / Transfer, data, nome, valor grande, chip de categoria, conta,
  SAVE — tudo numa folha com o teclado aberto.
- [Copilot — Dividir transação](https://mobbin.com/screens/ea307f13-0255-4b7d-a6ca-18db31407f9d) (iOS):
  teclado numérico próprio, linhas valor + chip de categoria, "+ add".

## 4. Paywall e teste honesto

- [Monarch — How your free trial works](https://mobbin.com/screens/f4f97ca0-8e85-4609-8f21-c5c9902171d4) (iOS):
  linha do tempo Today / In 6 days ("We'll send you a reminder email") / In 7 days
  ("Your subscription starts July 14 unless you've canceled"), dois planos com preço
  anual por mês, CTA e um link secundário "Or continue in-app without additional discount".
  **Padrão**: data real de cobrança escrita, lembrete prometido.
- [Copilot — Claim your free trial](https://mobbin.com/screens/b6ba77c0-7d8f-423e-8453-9db2a97f8035) (iOS):
  mesma linha do tempo (Today / 7 days before / In a month), "Cancel anytime, for any
  reason", e no rodapé Restore · All Plans · Enter Referral · **Skip**. Mais abaixo, o
  [FAQ do paywall](https://mobbin.com/screens/008d84bc-3e1e-4b7b-a4d6-616e19c3c3e6)
  responde "Why isn't Copilot free?" (preço justo para nunca vender os dados financeiros)
  e "Can I cancel through the app?". **Padrão**: o porquê do preço ligado à privacidade.
- [pillowtalk — how your 7 day free trial works](https://mobbin.com/screens/2f9bcce8-e4bd-4cf1-9027-3b8f44eb4ca6) (iOS)
  e [Givingli — Try Premium on Us](https://mobbin.com/screens/3b9243e4-291c-4077-8d18-4e3853da4854):
  timeline Today / Day 2 Reminder / Day 3 Trial ends com ícones de cadeado, sino e
  estrela. O padrão é recorrente no Mobbin.
- [Jomo — How is Jomo different?](https://mobbin.com/screens/355c903b-4580-4f82-bd8f-0c46195fa434) (iOS):
  paywall que responde objeções ("Can I trust you with my data?" — os dados ficam no
  aparelho; "sem investidores") e "We'll notify you 24h before your trial ends!".
  **Padrão**: confiança e dados no lugar de lista de recursos.
- [Cleo AI — Plus vs Builder](https://mobbin.com/screens/c330c3f7-92f0-4323-8260-19342d065716) (iOS):
  tabela de duas colunas com X e ✓, coluna recomendada com fundo verde, última linha é o
  custo mensal; CTA cheio + "Not right now" contornado.
- [GoPay — Basic vs Plus](https://mobbin.com/screens/9f6969fd-335a-40cf-9dc1-67c6f705ce1d) (iOS):
  tabela com ícone de info por linha, coluna Plus destacada, selo "supervised by Bank
  Indonesia". **Padrão**: o plano grátis aparece como coluna real, não escondido.
- [Quicken — tabela de planos](https://mobbin.com/sites/sections/1d41c04b-03fb-468f-aeaf-e0e7f1bf6b31) (web):
  linhas por tarefa ("Share your finances with partner": "Share with partner or advisor"
  vs. "N/A"), plano recomendado com borda.
  [Quicken — topo](https://mobbin.com/sites/sections/773e9723-cb88-48dd-bf80-6fff20170870):
  selo "30 day money back guarantee".
- [Craft — planos](https://mobbin.com/sites/sections/1d233811-a8c1-46dc-9b29-eb4c12feba62) (web):
  Starter "Free", Plus, **Family** ("Invite up to 5 family members", preço "for the
  entire group"). [Intercom](https://mobbin.com/sites/sections/1686d957-b7a3-4020-a0c0-5c9b6d6fa63a):
  "Free for 14 days. No credit card required." na primeira dobra.
- Contraexemplo: [WHOOP — We're Not Charging You Yet](https://mobbin.com/screens/1c6b3f4d-ff16-4aa4-9b61-74b804cf3dd1)
  (iOS): pede cartão completo mesmo com 12 meses de crédito, e informa a renovação em
  letra de rodapé.

## 5. Painel do mês

- [Copilot web — Dashboard](https://mobbin.com/screens/4e13cc80-a9e1-48b0-8882-c8857758acc5) (web):
  cartão "Monthly spending: **$4,465 left** · $9,300 budgeted" com linha do gasto
  acumulado contra a linha tracejada do orçamento e etiqueta "$6,674 under"; ao lado
  patrimônio; "Transactions to review" (estado vazio "You've reviewed 30 transactions");
  "Top categories" com barra gasto/limite; "Next two weeks" com recorrentes datados.
  **Padrão**: o número principal é **o que sobra**, não o que foi gasto.
- [Copilot — Monthly spending](https://mobbin.com/screens/c234ccb2-d1cb-4582-9df5-87c3a4a3d697) (iOS):
  "Spent $2,236.30 · $690 under", barras dos meses verdes com o mês estourado em
  vermelho e a linha do orçamento atravessando; por categoria Spent / Budget / Over.
- [Monzo — Your spending target](https://mobbin.com/screens/da1002f2-1a0b-49f2-acef-69f838ae1b53) (iOS):
  "Your spending target is £800 — You've already spent £639.33 so you've got £160.67
  left to spend this month." Frase única, sem gráfico. E
  [Monzo — média mensal](https://mobbin.com/screens/e0ee1ad7-d20c-4667-89d4-0fc184537e39):
  barras de 12 meses com média tracejada e o link "Doesn't look right?".
- [Monzo — Categoria com alvo](https://mobbin.com/screens/d9d5cc47-eb11-4ae3-b6a2-1c7db08c7d71) (iOS):
  "This month −£242.22 Over target", linha descendente contra o alvo tracejado verde.
- [Klarna — Insights](https://mobbin.com/screens/1b5919b4-9b02-43db-8e30-540ea5f01fce) (iOS):
  "Spent so far $0.00", barra fina, "$100 left of $100", esqueleto de barras e cartão
  vazio. [Definir orçamento](https://mobbin.com/screens/4f1479d5-a74e-4b75-8b14-ea8797ec9143):
  folha com valor grande editável, "Jun 1 until today", Save / Remove budget.
- [Starling — Spending trackers](https://mobbin.com/screens/58fe677d-26a9-4cc3-921e-0768225c9552) (iOS):
  "Resetting in 12 days, on 27 Jul", por categoria "£50.00 remaining" com barra e
  spent/budget nas pontas.
- [Lloyds — Spending insights](https://mobbin.com/screens/c792115c-8ac3-4bfd-bab8-ea72deb09752) (iOS):
  seta de mês, total, barras de 3 meses, chip "£80 less than this time in June",
  filtros Categories / Retailers & payees / Payment types. **Padrão**: comparar com o
  **mesmo ponto** do mês anterior, não com o mês inteiro.

## Para nós

### Copiar

1. **Saldo de família em frase com verbo de direção** (Splitwise: "recebe / deve", cor
   por direção) e a ação de acerto na própria linha. Para o nosso "quem pagou e acerto",
   o topo da tela de membros pode ser uma frase só: "Você deve R$ 180 à Ana".
2. **"Quem pagou" como estado da linha da pessoa** (KOHO: selo "pagou", valor riscado;
   os outros "devem"). Evita um campo "pago por" solto no formulário.
3. **Papel explicado pelo que pode e não pode** antes do convite (GoHenry), com a escolha
   numa folha de papéis com uma linha de descrição cada (Notion). Serve direto para
   adulto vs. filho-convidado.
4. **Parcelas como linha do tempo curta com valor por ponto** (Klarna), e **pago vs.
   restante** sobre uma barra (Affirm, Neo). A fatura mostra "fecha em X / vence em Y
   (em 16 dias)" com contagem relativa (Neo).
5. **Valores de pagamento com consequência** (Neo: total, fatura, mínimo, cada um com o
   que evita). **julgamento**: no Brasil, "pagar o mínimo" vira rotativo; dizer isso ao
   lado do valor é honestidade que os bancos não fazem.
6. **Frase → registro visível no chat, corrigível por conversa** (Fitbit). O cartão do
   lançamento criado aparece dentro da resposta, com o aviso de que a IA erra (Fitbit,
   Wise).
7. **Recibo casado com lançamento existente** (Brex: "Keep" ou "Select manually"). Para
   foto de comprovante e conferência de fatura em PDF, o gesto é "confirmar o casamento",
   não "redigitar".
8. **Teste honesto com linha do tempo e data real** (Monarch, Copilot): hoje / lembrete /
   data da cobrança, e "Skip" visível. **julgamento**: como nosso teste é sem cartão, a
   linha do tempo fica mais forte ainda: "hoje: tudo liberado / dia X: aviso / dia Y:
   volta ao grátis, nada é cobrado".
9. **Paywall que responde objeções de dados** (Jomo) e **grátis como coluna real** da
   tabela (GoPay, Quicken). **julgamento**: casa com "grátis para sempre" e "dados da
   pessoa" melhor que lista de recursos.
10. **O número do painel é o que sobra** (Copilot "$4,465 left", Monzo "£160.67 left to
    spend this month"), com orçamento tracejado no gráfico e comparação com o **mesmo
    dia** do mês anterior (Lloyds).
11. **Plano família com preço do grupo** (Craft: "for the entire group", até 5 membros).

### Evitar

- **Pedir cartão no teste** (WHOOP), mesmo dizendo que não cobra agora. Contradiz o
  nosso diferencial.
- **Paywall com desconto que pune quem recusa** (Monarch: "continue without additional
  discount"). **julgamento**: pressiona, e não combina com "cobrança honesta".
- **Linguagem de dívida dura entre família**: "owes" em laranja funciona entre amigos de
  viagem; dentro de casa pode soar acusatório. **julgamento**: preferir "a acertar" ou
  "Ana pagou por vocês dois" e deixar a cor neutra para membros da família.
- **Chat de IA só para perguntas** (Cleo, Lloyds, Origin): nenhum app de finanças do
  Mobbin mostra **lançar** por mensagem; o exemplo bom é de saúde (Fitbit). Não copiar o
  chat de consulta como se fosse captura.
- **Vermelho para mês estourado no gráfico** (Copilot) está ok como estado, mas não
  usar a mesma cor para "despesa" — nosso design system já separa `expense` de
  `destructive`.

## Arquivos baixados

Pasta `padroes/`

| Arquivo | Tela |
| --- | --- |
| `familia-splitwise-grupos-ios.webp` | [Splitwise — Grupos](https://mobbin.com/screens/8d4a1f26-0dd5-488c-a257-990a28c15159) |
| `familia-splitwise-saldos-ios.webp` | [Splitwise — Saldos expandido](https://mobbin.com/screens/a65c5e3d-efa0-456e-8cf2-dc87f760e198) |
| `familia-koho-quempagou-ios.webp` | [KOHO — Nova despesa](https://mobbin.com/screens/475292ac-19e3-4c1f-87f5-c75473e5db4b) |
| `familia-monzo-dividir-ios.webp` | [Monzo — Dividir conta](https://mobbin.com/screens/c6e308a3-8bff-48f8-b6e6-582d6d4008bd) |
| `familia-monzo-homejoint-ios.webp` | [Monzo — Home com conjunta](https://mobbin.com/screens/f5c5680b-88b8-4289-b068-100b3484222d) |
| `familia-gohenry-coparent-ios.webp` | [GoHenry — Co-responsável](https://mobbin.com/screens/6fe0e5d8-b7fd-4738-a632-079447b2c4ff) |
| `familia-copilot-dividir-web.webp` | [Copilot web — Dividir](https://mobbin.com/screens/f4043a72-6e85-46c8-98e4-88920d9899de) |
| `fatura-neo-statement-ios.webp` | [Neo — Statement](https://mobbin.com/screens/7e4658ca-b17a-462e-804c-5aed63ea6bf3) |
| `fatura-klarna-parcelas-ios.webp` | [Klarna — Confirmar plano](https://mobbin.com/screens/2d3fe1c9-c3c3-4ec8-8ba8-14a7d550c41a) |
| `fatura-affirm-cronograma-ios.webp` | [Affirm — Cronograma](https://mobbin.com/screens/fd94185a-5347-422f-8927-ff4f08b305e8) |
| `captura-fitbit-chatlog-ios.webp` | [Fitbit — Ask coach](https://mobbin.com/screens/8facdb3a-644e-412d-b566-d58eb2793c11) |
| `captura-brex-recibo-ios.webp` | [Brex — Scan receipt](https://mobbin.com/screens/590f0b25-00c8-47b4-8a81-51bcdf73d3e1) |
| `captura-wise-upload-ios.webp` | [Wise — Upload. Check. Send.](https://mobbin.com/screens/a4810e56-b3ae-4d50-a0fd-917c3d0e350f) |
| `paywall-monarch-trial-ios.webp` | [Monarch — Trial](https://mobbin.com/screens/f4f97ca0-8e85-4609-8f21-c5c9902171d4) |
| `paywall-cleo-comparacao-ios.webp` | [Cleo — Plus vs Builder](https://mobbin.com/screens/c330c3f7-92f0-4323-8260-19342d065716) |
| `paywall-quicken-tabela-web.webp` | [Quicken — tabela](https://mobbin.com/sites/sections/1d41c04b-03fb-468f-aeaf-e0e7f1bf6b31) |
| `painel-copilot-dashboard-web.webp` | [Copilot web — Dashboard](https://mobbin.com/screens/4e13cc80-a9e1-48b0-8882-c8857758acc5) |
| `painel-copilot-mensal-ios.webp` | [Copilot — Monthly spending](https://mobbin.com/screens/c234ccb2-d1cb-4582-9df5-87c3a4a3d697) |
| `painel-monzo-alvo-ios.webp` | [Monzo — Spending target](https://mobbin.com/screens/da1002f2-1a0b-49f2-acef-69f838ae1b53) |
