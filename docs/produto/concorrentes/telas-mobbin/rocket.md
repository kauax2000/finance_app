# Rocket Money — telas no Mobbin

Estudo de 28/10/2026, feito só com o que o Mobbin mostra. Complementa o dossiê de produto em `docs/produto/concorrentes/eua/2026-10-26-rocket-money.md` (empresa, preço, reputação), sem repetir o que está lá.

## Cobertura

- **iOS: sim.** Cobertura rica: ~45 telas vistas, mais 8 fluxos (onboarding, criação de conta, compromisso de assinatura, adicionar transação, adicionar ativo, renomear transação, cancelar assinatura, apagar e remover recorrente).
- **Web: sim.** ~14 telas vistas: painel, recorrentes, orçamento, patrimônio, detalhe de transação em modal, cancelamento do Premium.
- Ficou de fora: tela de score de crédito em detalhe, metas em detalhe, chat. O Mobbin tem as entradas no menu, mas não as telas.

## Navegação e arquitetura de informação

**iOS.** Uma tab bar de 5 itens: Dashboard · Recurring · Spending · Transactions · More. O "More" abre uma **gaveta lateral**, e não uma página ([menu Mais](https://mobbin.com/screens/001e163e-1e09-43de-95a6-083a12bda87e)). A gaveta tem, em ordem:

- o selo "You're Premium" e uma frase motivacional;
- "Refer a Friend", em destaque com borda vermelha;
- "Chat" e "Enter Demo Mode";
- Profile, Share Account, Manage Budget, Categories/Tags & Rules, Linked Accounts, Notifications & Alerts, Premium Membership, Add Employee Benefit, Help & Privacy;
- "Log Out".

Net Worth e Credit Score ficam escondidos nesse "More". Cada aba tem um cabeçalho em degradê vinho→vermelho, com ⚙ à esquerda e ⊕ à direita. As abas internas são sublinhadas: Upcoming | All, Summary | Assets | Debt.

**Web.** Sidebar fixa à esquerda com:

- "Hi, Sam / Premium Member", sino e engrenagem;
- 7 itens: Dashboard, Recurring, Spending, Budgets, Net Worth, Transactions, Credit Score;
- no pé, o cartão "Get the app" com QR e "Chat with us".

O conteúdo central vem com uma coluna lateral direita: contas no painel e "Start a cancellation" no recorrente ([painel web](https://mobbin.com/screens/f075dbe0-f75d-4955-9fbb-bca17ef8bb3d)). A web não tem a gaveta "More", e todas as áreas ficam no primeiro nível.

## Telas por área

### Onboarding, cadastro e paywall
- O onboarding é um questionário longo, com uma pergunta por tela e cartões de opção com ícone de traço. A ordem é:
  1. "Are you saving for something specific?" (carro, dívida, reserva, casa…);
  2. "Tell us about yourself", em multisseleção: alugo, tenho casa, sou casado, tenho filhos, tenho carro, pago empréstimo estudantil;
  3. "How did you find us?" (metrô, podcast, influencer…);
  4. nome legal e e-mail, com "Enable FaceID" e os termos marcados por padrão;
  5. "Link your accounts": Checking marcado como **Required**, e Credit Cards. Embaixo há um depoimento "Best app I've ever used" com 5 estrelas ([fluxo Onboarding](https://mobbin.com/flows/fed2772b-6edd-432f-b195-0691f2d84d04), [Criando conta](https://mobbin.com/flows/c039b598-adfb-4216-9e7b-2fc896fd1a8b)).
- Depois de conectar, aparece "Ready to start saving right away?" com 4 portas: Review Subscriptions, Create A Budget, Save For A Goal e Lower A Bill. Em seguida vem a promoção de widget ("See your upcoming bills"). Depois cai no painel com o checklist "COMPLETE SETUP (5/7)" em borda tracejada.
- **Paywall "Pay What You Think Is Fair"**: $9, $10 ou $11 por mês, com "Most people pick $10" e "Choose custom amount". Abaixo vêm "Rocket Money pays for itself — Save up to $768 per year" e a prova social "419K members saved money in past 30 days". O CTA é "Start Free Trial", com o selo "7 day free trial, cancel anytime" ([paywall](https://mobbin.com/screens/50401be4-6845-434a-989c-153bf925170f)).
- Depois vem a tela "Fantastic!", com a lista de recursos Premium e um texto legal de autorização de débito ("authorize Rocket Money to electronically debit my account for $10.00 per month… after the trial ends on October 08") e o CTA "Agree & Continue" ([consentimento Premium](https://mobbin.com/screens/1137fa1a-5548-440a-8f06-0a52032a713a)). A data de cobrança aparece por extenso, o que é bom. O débito é na conta bancária, não no cartão.

### Painel / home
- **iOS:** o painel mostra, em ordem:
  - o checklist de configuração;
  - "Build your credit" (vender o rent reporting, "+58 Points");
  - "Upcoming": cartões horizontais com logo, valor e "IN 17 DAYS" ([painel no fluxo de onboarding](https://mobbin.com/flows/fed2772b-6edd-432f-b195-0691f2d84d04)).

  O painel abre com o que vence, e não com saldo.
- **Web:** "Good evening, Sam", com um cartão grande "Current spend this month $1,483" e uma curva cumulativa do mês contra o mês anterior. O tooltip diz "By Aug 7, you spent $434 more than last month", e há um selo laranja "You've spent $1,390 more than last month". Abaixo fica a tabela de transações recentes. À direita fica a lista de contas: Checking, Credit Cards (Add +), Net Cash, Savings e Investments ([painel web](https://mobbin.com/screens/f075dbe0-f75d-4955-9fbb-bca17ef8bb3d), [tooltip](https://mobbin.com/screens/eff714c5-7b2a-4910-b31a-6de29ff63e7f)). A curva "este mês × mês passado no mesmo dia" é a melhor leitura de ritmo de gasto do grupo.

### Transações (lista, detalhe, edição)
- **Lista iOS:** busca, botões "CSV" e "+" no topo, cabeçalho de mês com o total gasto, linha com ícone da categoria em círculo pastel, nome, data com "| Pending" e valor. As entradas vêm em verde ou cinza com "+" ([lista](https://mobbin.com/flows/4a244717-e90d-49db-87ae-c3a92e21a6df)).
- **Filter & Sort** é uma tela cheia com abas Filter | Sort. Os filtros são linhas de drill-down (Contas, Categorias "3 Selected", Tags, Datas, Tipo, Valor) e "Show only" com caixas de marcar (Ignored, Tax Deductible) ([filtro completo](https://mobbin.com/screens/db23199c-c5eb-4ee1-9483-fddb95fc8272)).
- **Detalhe iOS:** data no topo como seletor, nome, valor grande e uma **pílula da categoria**, que é o próprio seletor. Depois vêm dois grupos de linhas:
  - Rename, "Is Recurring?" (switch) e "Ignore" (Don't Ignore ▾);
  - Add Tags, Add Note, Create Rule, Split.

  No fim ficam "See History (40)" e a conta de origem ([detalhe](https://mobbin.com/screens/2fce7f82-477c-4860-b994-2e664f7e02eb)).
- **Renomear → regra:** ao renomear, o toast "Transaction renamed — Create a rule to apply to matching transactions [+ Rule]" oferece a regra no momento certo. A tela "Confirm Changes" lista as "43 Matching Transactions" com o nome antigo riscado e o novo embaixo ([fluxo renomear](https://mobbin.com/flows/dd9d1ac7-cc88-492c-b17a-c324100d90ac), [confirmar regra](https://mobbin.com/screens/fd12c9b6-0768-44c8-9540-090ec43c167e)). **Julgamento:** é o melhor padrão de "edição que vira regra" do grupo.
- **Detalhe web:** modal em duas colunas. À esquerda ficam nome, valor, categoria e nota livre. À direita ficam as "ACTIONS": Tax Deductible (switch), Ignore?, Split e Add Rule. O tooltip "STATEMENT DESCRIPTION" mostra a descrição crua do banco, e o rodapé mostra a conta ([detalhe web](https://mobbin.com/screens/ef2e47f5-b325-4cac-a7c8-9c7fd908415a)). O "Ignore" tem três níveis: Don't ignore · Ignore from Budget · Ignore from Everything ([menu ignorar](https://mobbin.com/screens/fc8b82bb-a25a-4a04-87bd-20213a5ca456)).

### Adicionar transação manual (fluxo)
- O ⊕ da lista abre "Add a Transaction" sobre o degradê, com o segmentado Spend | Income e um cartão com Name*, Date*, Amount* e Category. O botão "Save" fica embaixo, e Cancel/Save também aparecem no topo. Ao salvar, o toast diz "Created Venmo – Shoo Shoo 2025-10-01: $42.00" ([fluxo adicionar transação](https://mobbin.com/flows/4a244717-e90d-49db-87ae-c3a92e21a6df)).
- São só 4 campos. Não há conta, parcela nem quem pagou: a transação manual é exceção num produto que vive de sincronização.

### Categorias e orçamento
- **Spending (iOS):**
  - o cartão "October Budget" com "Left For Spending −$91", uma barra e três anéis (ganhos, contas, "tudo o mais");
  - "Breakdown" com Categories | Tags e o switch "Include bills";
  - um **anel segmentado** com ícones de categoria sobre os arcos e "Total spend in October $262" no centro ([gastos](https://mobbin.com/screens/ee2dfe42-9611-44fb-bbe7-88ba4ede7f03));
  - "Frequent spend" (5× MTA, média $5.14) e "Largest purchases" ([frequentes](https://mobbin.com/screens/d0c694cf-8f64-4372-b3e8-ac8427e48d9d));
  - "Needs categorization";
  - o bloco "Non-spending": Tax Deductible, Reimbursements, Ignored, Transfers;
  - "Data not looking right? → Report a data problem" ([não-gasto](https://mobbin.com/screens/dc349679-b843-41e5-b59f-c9862dcb342a)).
- **Manage Budget (iOS):** a estrutura é Earnings → Budget breakdown (Bills & Utilities; Spending → Everything Else + "Add a Budget") → "Left for savings and debt: Savings Target −$760". Cada linha traz o valor do mês passado embaixo ([gerenciar](https://mobbin.com/screens/eaecfc68-9885-4209-8da4-b5d357e1a039)). A edição é uma folha com − $240 +, o resumo e o histórico de 3 meses em barras com uma linha tracejada do alvo ([editar ganhos](https://mobbin.com/screens/f8e44cf7-4c03-4f09-bef2-d9107a46eb9a)).
- **Budgets (web):** tabela "Budget basics" (Earnings, Bills) e "Budget categories", com as colunas Budgeted (campo editável inline), Actual e Remaining. O restante fica em vermelho quando estoura (−$69.35). À direita há um anel "Left to Spend $19,961.85 of $21,445" e a frase "That's $1,815/day for the next 11 days of the month" ([orçamento web](https://mobbin.com/screens/e8e471f9-dc5d-47a7-8d02-8b62c096149b)).
- **Categorias:** as padrão não são editáveis ("This list only shows custom categories. Default categories are not editable"). As personalizadas têm nome, cor, ícone e grupo. Ao apagar, as transações voltam à categoria original ([Categorias, Tags e Regras](https://mobbin.com/screens/90475175-d1f4-49c5-984f-35acacdafbff), [apagar categoria](https://mobbin.com/screens/f0a627c7-3010-4219-a19d-74230f3e0e2d)).

### Recorrentes e assinaturas (o destaque)
- **Upcoming:** o cartão "Coming Up" tem um mini-calendário de 2 semanas com pontos nos dias de cobrança, depois "Coming later" (logo, nome, "in 9 days", valor, ⋮) e "Recent charges" ([próximas](https://mobbin.com/screens/01d9cc58-851a-4e29-9b1b-a6f0bef3b85d)).
- **All:** agrupado por tipo (Subscriptions, Credit card payment, Bills), com o **custo anual por grupo** ("$377 per year"). A ordenação é uma folha: Type, Account, Amount, Due Date, Frequency, Alphabetical ([ordenar](https://mobbin.com/screens/57b85560-bbfc-469b-a6cf-64a5e3b60cc5)). Ordenado por conta, o cabeçalho de grupo vira o cartão ("2 BANK OF AMERICA | CUSTOMIZED CASH REWARDS VISA") ([por conta](https://mobbin.com/screens/5aa3e934-65e2-482a-ad39-b61ab22f5855)). Há uma dica fixa: "To cancel subscriptions or lower your bills, tap ⋮".
- **Ações da linha (⋮):** uma folha com cabeçalho (logo, nome, frequência, "History >") e botões contornados: Edit Details · Cancel <nome> · Mark as Paid · Remove from List. Os inativos têm Mark as Active · Cancel · Delete from Rocket Money ([ações](https://mobbin.com/screens/4b99c2af-ed69-4048-aa22-af12e860651b)).
- **Remover pede o motivo:** "Delete this subscription" ou "Move to inactive". O toast explica a consequência: "After this charge, you'll no longer see this subscription in your list" ([fluxo remover](https://mobbin.com/flows/7dbc8e47-9e84-44d0-a011-f50c43419ba5)). Os inativos ficam numa página própria, "Inactive since May 27, 2025" ([inativos](https://mobbin.com/flows/0309cbc5-1676-46c6-81e4-b4b918e3bfd2)).
- **Cancelamento (concierge):**
  1. "Start a Cancellation" abre "Choose a subscription", com busca e "+ Add a subscription".
  2. A tela do serviço mostra "You could save up to $95.88 per year" e duas vias: "Cancel this for me" (Premium) ou "If you'd like to cancel yourself" (telefone, site, "View instructions").
  3. "Cancel this for me" pede **e-mail e senha da Amazon**, com a autorização para agir em nome da pessoa.
  4. Na lista aparece a faixa "We're canceling this subscription for you. This can take up to 10 business days" ([fluxo cancelar](https://mobbin.com/flows/7702f8ba-dd42-4e06-8771-ffc7dd72ba7e), [opções](https://mobbin.com/screens/3bc03e0a-dc4d-41cb-be4d-123fb65c3a79), [em andamento](https://mobbin.com/screens/35f336ec-beb4-4afc-af5f-85d7ba3b0a20)).

  Na web, quando não dá para cancelar, o modal admite: "we can't cancel PennyMac on our end… we've linked the details on how you can cancel" → Instructions ([não cancelável](https://mobbin.com/screens/4b7285ed-cd0c-4601-9d44-70ad7a14549f)).
- **Configurar recorrentes no onboarding de orçamento:** "Here are all of your recurring expenses", agrupado em Bills, Utilities, Subscriptions e Other com logos empilhados, "Monthly Average $31" em destaque e "Add a missing recurring expense" ([recorrentes no setup](https://mobbin.com/screens/e919b59d-41e9-43ea-bf92-f4b7603723e0)).
- **Web Recurring:** abas Upcoming | View All | Calendar, busca e ordenação. A tabela tem Nome/Frequência, Conta, Vencimento e Valor. À direita ficam o cartão escuro "Looking to cancel a subscription? → Start a cancellation" e o gráfico "Monthly breakdown" de 6 meses (Subscriptions × Bills & Utilities) ([recorrentes web](https://mobbin.com/screens/88a8182c-024c-442c-aa94-6f2f8d1107ea)).

### Patrimônio, cartões e dívida
- **Net Worth:** abas Summary | Assets | Debt.
  - Debt mostra "Total Debt $445" com linha e períodos 1M, 3M, 6M e 1Y, a faixa "4 new accounts detected — Tap to add them" e os cartões de crédito com uma **barra de uso do limite** ("1% Used") ([dívida](https://mobbin.com/flows/0ab48252-2c5c-4f75-97e8-d52fdd5300e3)).
  - Assets mistura metas ("Reduce my spending 218% Complete") com contas, e tem o switch "Include checking in Net Worth" e "+ Add Asset" ([ativos](https://mobbin.com/screens/0450c132-3626-4cba-95e2-f16d48fb3c03)).
- **Web:** "Total assets value $957" com períodos, o cartão "Complete your financial picture → Add more accounts" e o resumo Assets − Debts = Net Worth explicado em linhas ([patrimônio web](https://mobbin.com/screens/e5c8b294-1200-4200-b763-6521a4840f77)).
- **Não há fatura de cartão.** O cartão aparece como "Credit card payment" recorrente ($396.65/mês) e como dívida com % de uso. Não existe ciclo, fechamento nem parcela.

### Compartilhar com parceiro
- Em Profile, o bloco "ACCOUNT SHARING — Share with your partner — Manage your finances together with your significant other. You will see all of your accounts in one place [Enable]" ([perfil](https://mobbin.com/screens/e21bdf1b-c5c2-45d8-8ca2-72467368cdb0)). Os recursos Premium listam "Shared Accounts". O Mobbin não tem o fluxo depois do Enable.
- É compartilhamento de visão total entre duas pessoas. Não há papel, quem pagou nem acerto.

### IA / chat / insights
- Não há tela de IA no Mobbin. O "Chat" do menu e o "Chat with an Expert" das configurações Premium são suporte humano. Os insights ficam nas frases do painel web ("you spent $434 more than last month") e no "Frequent spend".

### Configurações
- Notificações em matriz Push × Email por tipo: Balances, Transaction alerts, Subscriptions, Recurring Payment, Income, e mais Updates e Tips ([notificações](https://mobbin.com/screens/af032fab-a852-42da-ac78-e6054f9fb800)).
- "You're Premium" lista os recursos com ✓ (Manual Transactions, Account Balance Alerts, Shared Accounts, Customizable Dashboard, iOS widgets). Em "Manage Membership" ficam "Change Monthly Fee $10/mo", trocar a forma de pagamento e "Cancel Membership" visível ([gerenciar Premium](https://mobbin.com/screens/5506dc22-dad3-4e4f-8977-5c1d85a6d2dd)).
- Cancelar o Premium na web abre a pesquisa "Your Feedback Helps Us Improve", com motivo ("I keep forgetting to use it") e "Submit And Cancel Premium" ([cancelar Premium web](https://mobbin.com/screens/f2acdb10-5628-461a-9d12-f98ec1ad5aa6)). É uma tela só, sem labirinto.
- Pesquisa de satisfação embutida no fim das abas: "How are you liking Rocket Money?" com 4 emojis.

## Fluxos

1. **Onboarding (iOS):** meta de poupança → "sobre você" → como nos achou → nome → e-mail + FaceID + termos → conectar Checking (obrigatório) e cartões → 4 portas de economia → widget → painel com checklist 5/7 ([fluxo](https://mobbin.com/flows/fed2772b-6edd-432f-b195-0691f2d84d04); [criação de conta, 17 telas](https://mobbin.com/flows/c039b598-adfb-4216-9e7b-2fc896fd1a8b); [compromisso, 8 telas](https://mobbin.com/flows/45887c47-fde8-4af6-aa98-9bf992a51669)).
2. **Adicionar transação (iOS):** Transactions → ⊕ → Spend/Income → nome, data, valor, categoria → Save → toast ([fluxo](https://mobbin.com/flows/4a244717-e90d-49db-87ae-c3a92e21a6df)).
3. **Renomear e criar regra (iOS):** detalhe → Rename (folha) → toast "+ Rule" → Confirm Changes com 43 transações ([fluxo](https://mobbin.com/flows/dd9d1ac7-cc88-492c-b17a-c324100d90ac)).
4. **Cancelar assinatura (iOS):** Recurring → Start a Cancellation → escolher serviço → "Cancel this for me" ou instruções → login do serviço + autorização → faixa "We're canceling… up to 10 business days" ([fluxo](https://mobbin.com/flows/7702f8ba-dd42-4e06-8771-ffc7dd72ba7e)).
5. **Remover recorrente (iOS):** ⋮ → Remove from List → motivo (apagar ou inativar) → toast explicando ([fluxo](https://mobbin.com/flows/7dbc8e47-9e84-44d0-a011-f50c43419ba5)).
6. **Adicionar ativo manual (iOS):** Net Worth → + Add Asset → tipo → "Add Cash" (nome, valor, data de início) ([fluxo](https://mobbin.com/flows/0ab48252-2c5c-4f75-97e8-d52fdd5300e3)).

## Diferença iOS × web

- **IA:** o iOS esconde Net Worth, Credit Score, regras e configurações na gaveta "More". A web põe tudo na sidebar, mas não tem Profile nem compartilhamento à vista; ficam atrás da engrenagem.
- **Densidade:** o iOS usa cartões, folhas inferiores e telas cheias de filtro. A web usa tabelas com edição inline (orçamento) e modais em duas colunas (detalhe da transação).
- **Painel:** no iOS ele abre com setup e vencimentos. Na web abre com "Current spend this month" e a curva contra o mês passado. São leituras diferentes do mesmo produto.
- **Visual:** o degradê de marca só existe no topo das abas do iOS. A web é branca e neutra, com o vermelho só no logo e no item ativo.

## Para nós

**Copiar**
- **Custo anual por grupo de recorrentes** ("$377 per year") e o "could save up to $95.88 per year" no cancelamento. Anualizar é o que faz assinatura doer. Cabe na nossa tela de Assinaturas sem conectar banco.
- **Remover recorrente pede o motivo** (apagar ou "já cancelei, mover para inativo"), e o toast diz o que acontece depois. Inativos ficam numa lista própria com "inativa desde".
- **Edição que oferece regra no toast**, com a prévia "43 transações vão mudar", nome antigo riscado e novo embaixo. Serve à nossa captura por mensagem/IA: corrigiu uma, propõe aplicar às parecidas.
- **"Ignore" com 3 níveis** (não ignorar · fora do orçamento · fora de tudo). Isso resolve o estorno e a transferência entre carteiras sem apagar.
- **Curva cumulativa "este mês × mês passado no mesmo dia"**, com tooltip em frase.
- **Orçamento web com "R$ X/dia pelos próximos N dias"** ao lado do restante.
- **Cancelar a própria assinatura em uma tela**, com o motivo opcional. Combina com "cobrança honesta".

**Evitar**
- O questionário de marketing ("How did you find us?") e a exigência de conectar a conta corrente antes de ver o app.
- **Pedir a senha de terceiros** (login da Amazon) para cancelar. **Julgamento:** isso não cabe na nossa promessa de "dados da pessoa".
- O paywall de "pague o que acha justo" com âncora ("Most people pick $10") e o débito em conta após o teste. É o contrário do nosso "teste sem cartão".
- Metas misturadas com contas na aba Ativos.
- Score de crédito e "rent reporting" vendidos no painel.

**Onde ganhamos**
- **Fatura de cartão:** no Rocket o cartão é só "pagamento recorrente" e "% do limite usado". Não há fechamento, parcelas nem conferência de fatura. É o nosso diferencial mais claro contra ele.
- **Família:** o "Share with your partner" é um switch de visão total entre duas pessoas, sem papéis, sem filho e sem "quem pagou".
- **Captura sem banco:** a transação manual tem 4 campos e é cidadã de segunda classe. A nossa é a porta principal (mensagem, voz, foto).

## Arquivos baixados

Pasta: `rocket/`

| Arquivo | Tela |
| --- | --- |
| ios-paywall-preco-livre.webp | https://mobbin.com/screens/50401be4-6845-434a-989c-153bf925170f |
| ios-recorrentes-proximas-calendario.webp | https://mobbin.com/screens/01d9cc58-851a-4e29-9b1b-a6f0bef3b85d |
| ios-recorrentes-todas-cancelando.webp | https://mobbin.com/screens/35f336ec-beb4-4afc-af5f-85d7ba3b0a20 |
| ios-recorrentes-iniciar-cancelamento.webp | https://mobbin.com/screens/3b479401-25db-4ce6-8207-f28a46c981cd |
| ios-cancelar-opcoes.webp | https://mobbin.com/screens/3bc03e0a-dc4d-41cb-be4d-123fb65c3a79 |
| ios-detalhe-transacao.webp | https://mobbin.com/screens/2fce7f82-477c-4860-b994-2e664f7e02eb |
| ios-adicionar-transacao.webp | https://mobbin.com/screens/65fc5b63-03bc-4f70-a2ed-a640574c393d |
| ios-orcamento-gerenciar.webp | https://mobbin.com/screens/eaecfc68-9885-4209-8da4-b5d357e1a039 |
| ios-gastos-anel.webp | https://mobbin.com/screens/ee2dfe42-9611-44fb-bbe7-88ba4ede7f03 |
| ios-gastos-frequentes-maiores.webp | https://mobbin.com/screens/d0c694cf-8f64-4372-b3e8-ac8427e48d9d |
| ios-menu-mais.webp | https://mobbin.com/screens/001e163e-1e09-43de-95a6-083a12bda87e |
| ios-perfil-compartilhar-parceiro.webp | https://mobbin.com/screens/e21bdf1b-c5c2-45d8-8ca2-72467368cdb0 |
| web-painel.webp | https://mobbin.com/screens/f075dbe0-f75d-4955-9fbb-bca17ef8bb3d |
| web-orcamento.webp | https://mobbin.com/screens/e8e471f9-dc5d-47a7-8d02-8b62c096149b |
| web-recorrentes.webp | https://mobbin.com/screens/88a8182c-024c-442c-aa94-6f2f8d1107ea |
| web-detalhe-transacao.webp | https://mobbin.com/screens/ef2e47f5-b325-4cac-a7c8-9c7fd908415a |
