# Quicken Simplifi — telas no Mobbin

Estudo de 28/10/2026, feito só com o Mobbin. Complementa `docs/produto/concorrentes/eua/2026-10-26-quicken-simplifi.md`. No Mobbin o app aparece como **"Quicken"**, mas as telas são do Simplifi: logo "Quicken Simplifi" no onboarding, Spending Plan, Watchlist, Refund Tracker.

## Cobertura

- **iOS: sim.** ~40 telas vistas e 5 fluxos: onboarding (12 telas), configuração de contas (15), adicionar transação (24), transação dividida (4) e ajuda (3).
- **Web: sim.** ~20 telas vistas: painel, Spending Plan, transações com filtros, patrimônio, relatórios, Bills & Income, investimentos e Quicken Assist (IA, beta).
- Ficou de fora: o compartilhamento com parceiro ou convite de usuário. Nenhuma tela no Mobbin, em nenhuma plataforma.

## Navegação e arquitetura de informação

**iOS.** **Não tem tab bar.** É um ☰ que abre uma gaveta lateral agrupada ([gaveta no fluxo de onboarding](https://mobbin.com/flows/a8fa7bf6-bceb-403d-a372-42ed82e2e4b2)):

- **Insights:** Investments, Watchlist e Reports, com 9 subitens: Total Spending, Spending by Month, Income, Net Income by Month, Savings, Net Worth, Monthly Summary, Credit Score e Refund Tracker;
- **Utilities:** Help e Settings.

O topo da home tem sincronizar, sino e perfil. Settings é outra gaveta, da direita, com nome, e-mail, "Subscription Renews: Dec 02, 2025", o seletor de Aparência (System | Light | Dark), Achievements, Passcode & Face ID, Community, Legal, Help Center, Sign Out e "Delete Quicken ID" em vermelho ([configurações](https://mobbin.com/screens/ffd32e31-6baa-4910-a383-1f6437a90573)).

**Web.** Um trilho de ícones fino à esquerda, sem rótulo (só ícones). Painel, transações e patrimônio têm uma **segunda coluna fixa de contas**: "Accounts + New", árvore Banking → Savings → conta, Investments, Assets, Liabilities, com subtotais ([transações web](https://mobbin.com/screens/e543344e-1f98-4610-b7eb-a54e29b5eeb4)). No canto inferior direito fica um botão flutuante ✦ da IA, e o topo tem ajuda, notificações e configurações.

## Telas por área

### Onboarding, cadastro e paywall
- O carrossel "Powerfully simple." mostra um mini-cartão "Top Spending" (rosca + "Groceries $804") e um depoimento de usuário. Os CTAs são "Get Started" e "Sign In".
- Para criar conta: Quicken ID com e-mail, **celular** ("This helps secure and verify your account") e senha. Depois vem "Check your inbox", com código de 6 dígitos ([criar conta](https://mobbin.com/screens/d95ca539-cfeb-4c85-ab3b-a92387c3ed06), [verificar](https://mobbin.com/screens/3f5e3416-972e-410e-810c-930610674cb8)).
- O **paywall vem antes de ver o app**. O topo é um iPhone desenhado com a tela "Income after bills": Income $6,453 − Fixed expenses & savings goals $3,377 = $3,075 Income available. Embaixo aparece a pílula vermelha "67% Off the First Year!", "~~$71.99~~ $23.90 per year", "Same value as $1.99 per month", uma lista de 5 benefícios com ✓ e "Subscribe" ([paywall topo](https://mobbin.com/screens/aaaad76e-f005-4da0-8135-0b7b0028ca08), [paywall rodapé](https://mobbin.com/screens/5b3319d4-5850-4a7c-ad5c-30af961e11e0)). Não vi teste grátis nessa tela.
- "Welcome Aboard!" → "Add account": busca de instituição e grade de bancos populares, com **"Apple Wallet ✦ NEW"** no topo. No pé ficam "Track an asset or cash account — Add account · Add asset". Escolher a Apple Wallet abre a folha nativa do iOS ("Select Accounts… Apple Cash") ([fluxo configurar contas](https://mobbin.com/flows/81995b78-8b9d-46d0-8850-20ff5629df9e)).

### Painel / home
- **iOS:** um cartão roxo cheio "Banking $0.00" (Cash & Checking, Credit, Savings, Other Banking) em carrossel de 2 páginas. Depois vêm "Recent Spending Friday – Today", o vazio ilustrado "Kudos! You haven't spent anything." e o "Spending Plan".
- O painel é **personalizável**: lista de cartões com olho (mostrar/ocultar) e alça de arrastar. Os cartões são Recent Spending, Bills & Payments, Spending Plan, Spending Watchlist, Investments, Top Spending, Goals, Achievements e Credit Score. "Accounts Summary" fica fixo ("pinned so that your money stays top of mind"), e há "Reset to default" ([personalizar](https://mobbin.com/screens/dc9755bf-2086-4706-a095-50ffc5d2bee0)).
- **Web:** "Hello, Sam! 👋" e "Customize". A grade de cartões tem Net Worth (com variação e seletor "6 months"), Recent Transactions, Bills & Income, Income, Spending, Watchlist, Holdings, Investments, Achievements ("Collected 5/24") e Credit Score ([painel web](https://mobbin.com/screens/f4185e0b-854e-4b34-b478-848edd784844), [painel com watchlist](https://mobbin.com/screens/defceb80-cdf5-414c-a79a-299c9180f3c1)).
- **Watchlist** (cartão web): por categoria ou pessoa ("Auto & Transport", "Sam Lee"), com "5 month Monthly Average $114", "Year to date $570" e "This month: Spent so far +$10 · Projected +$52 · Target $600". É o orçamento de olho, sem envelope.

### Transações (lista, detalhe, edição)
- **iOS:** "All Transactions" com a pílula "See projected cash flow >" no topo, depois "Transaction Activity — Showing All Transactions", busca e filtro. Cada linha tem o pagador com ✓ verde (revisado), "⑂ Groceries, Groceries" quando está dividida, valor e data ([lista](https://mobbin.com/flows/5673c75a-7932-436f-8d9c-f18bdb7ebec5)).
- **Web:** tabela com abas All | Spending | Income, agrupada por **Pending** e por mês, com seções recolhíveis. As colunas são configuráveis pela ⚙: Date, Account, Check #, flag, Status (Pending), Payee, Category, ícones de "excluída de"/recorrente e Amount. A categoria dividida aparece como "--- Split ---" ([transações](https://mobbin.com/screens/e543344e-1f98-4610-b7eb-a54e29b5eeb4), [colunas](https://mobbin.com/screens/df8e9dd2-851f-48d5-81a0-2bd33675c5ad)).
- **Filtros web:** um painel de 3 colunas. A primeira tem os tipos (Categories, Payees, Tags, Accounts, Flags, Advanced), a segunda as opções (árvore de categorias com caixas) e a terceira o resumo "4 filters selected" com chips removíveis. Em Advanced: Bills & Subscriptions sim/não, Excluded in reports, Excluded in spending plan, Reviewed/Not reviewed ([filtros](https://mobbin.com/screens/fe08122d-437f-49a9-8670-0adbacce633c), [avançado](https://mobbin.com/screens/ebc948b0-04c0-4a09-9f8a-aa6025736a01)). **Julgamento:** é o melhor filtro de transações do grupo.

### Adicionar transação manual (fluxo)
- Um formulário longo, com 24 telas no fluxo, numa página só. Os campos são:
  - **Payee** (seletor) e **Amount** com teclado numérico e "+/-";
  - **"Expecting a refund? Track it here"** logo abaixo do valor;
  - Account, Date, Category e Tags (chips com ⊕);
  - "Use to assign multiple tags or categories ⑂ Split";
  - **Transaction Status** Pending | Cleared, "Set flag", o switch "Reviewed";
  - **"Exclude from: Spending Plan / Reports"** (caixas, com explicação de cada um);
  - Notes e **"Attach a file"**;
  - CTA fixo "Create". O toast é "Transactions created — Undo" ([fluxo](https://mobbin.com/flows/5673c75a-7932-436f-8d9c-f18bdb7ebec5), [formulário](https://mobbin.com/screens/e03e76d2-c2ae-4c8a-aac7-a24f93a7d27e)).
- **Dividir:** "Split Transaction" com o cabeçalho fixo "Left to Split ✓ $0.00". Cada parte tem Category, Amount e Tags próprias, e há "+ Add Split" e "Add Left to Split" ([fluxo dividir](https://mobbin.com/flows/d540e38b-aab2-40c9-ac22-40c6108edc53)).

### Reembolsos (Refund Tracker)
- É uma área própria no menu Reports. No vazio aparece "Waiting for money back on a return you made? Track it here" com o CTA "Track a Refund" ([vazio](https://mobbin.com/screens/7f898420-08d5-41f7-8e2c-d902084cf812)).
- O formulário "Track a Refund" tem Payee, Amount (verde, "+$"), **Expected Date** ("Let us know when to alert you if you haven't received this"), Account, Category, Note e anexo ([formulário](https://mobbin.com/screens/f1d47c4b-55ca-4b06-a4ac-682678eb2c33)).
- A lista divide **Expected** (+$500, com borda serrilhada de recibo) e **Completed** ([lista](https://mobbin.com/screens/1d3e2636-1dfe-4d1a-bf3d-d3a2ddd1f584)). Na web, Bills & Income tem a aba "Refunds" e o botão "+ Refund" ([Bills & Income web](https://mobbin.com/screens/d20c9ad7-3847-4285-9637-61b903d30dbd)).

### Spending Plan (o destaque) e categorias
- **iOS, Overview:** mês com "Today ◀ ▶". Uma rosca grande (salmão quando estoura) com "−$270.00 Available" e "**−$8.71 Available per day**", e a legenda "Over spent". Os detalhes vêm em linhas clicáveis: Income after bills · Planned spending · Projected other spending ([visão geral](https://mobbin.com/screens/e52fd942-c411-4981-80c2-0ff0282b0a96)).
- **Planned spending:** cartões por categoria com ícones de recorrente e de rollover, "$0 of $150", "Available $150" e barra. O rodapé fixo tem o total, e há alternância cartão/lista ([planejado](https://mobbin.com/screens/deb31efd-0f8a-4061-803a-641ba67025f1)). "Add Expense" escolhe entre **One-time expense** (só este mês) e **Monthly expense** ([opções](https://mobbin.com/screens/f82d1642-4272-4b45-99a1-1192dd7fd563)). O mensal tem nome opcional, categoria, valor e o switch **"Roll over funds each month"** ([mensal](https://mobbin.com/screens/e49c011e-399c-4c6d-9b03-100f751bf47f)).
- **Web:** uma coluna esquerda com a **conta em cascata**: + Income → − Bills → − Planned Spend → − Other Spend → − Goals = "Left this month −$14,265.08", com rosca. Clicar numa linha abre à direita os cartões ou as transações daquele termo ([plano web](https://mobbin.com/screens/dd505fe6-1fef-4e88-be94-9cc014500afb), [Other Spend](https://mobbin.com/screens/f299428b-45df-4ad8-9315-3ee06c5dfdf7)).
- **Configuração guiada:** um modal explica a subtração com a mesma cascata em miniatura ("Left this month $1,800") ([intro](https://mobbin.com/screens/da3c5ea7-0a34-4b64-ac74-d6822e79f993)). Depois uma faixa fixa no pé diz "Build your Spending Plan: 1 of 4 completed — Next, add your Bills… [Add Bills >]" ([setup](https://mobbin.com/screens/efb314cd-6ab4-4d81-a72e-d17f0ad5d3d9)). O modal "Add bills to Spending Plan — We found the following recurring bills. Uncheck any you don't want" vem com "Total this month" e "Add missing bills" ([adicionar contas](https://mobbin.com/screens/fbba19d8-f4d1-4aca-b7ef-6cf9b105c6ce)).
- **Categorias:** lista longa agrupada, com busca e o selo "Tax related" ([categorias](https://mobbin.com/screens/e09762f1-1a4c-41b0-8b5a-fda6104c3e61)).

### Contas a pagar, recorrentes e projeção
- **Bills & Payments (iOS):** chips Overview | Cash Flow | All Recurring. O Overview é um **calendário do mês** (com alternância lista/calendário) e, abaixo, "Past" e "Next", com ladrilho de letra colorida, valor e o selo "Paid" ([calendário](https://mobbin.com/screens/f8776143-92ee-4bd5-a60e-c7738fe7982d)). All Recurring tem os filtros Bills, Subscriptions, Transfers e Canceled, mais busca e "Every month" ([recorrentes](https://mobbin.com/screens/d9644902-fbfc-418d-ae52-b92291295c52)).
- **Criar série:** tela de sucesso "Series Created — Walmart $120.00 • Every month — Edit Series", com o convite "Connect to the Biller — We'll keep Simplifi updated with your most recent bill information [No thanks | Connect]" ([série criada](https://mobbin.com/screens/e7505494-679b-4a22-afeb-24c4219c4e77)).
- **Projected Cash Flow:** seletor de horizonte ("Next 1 month") e de conta. Mostra "Account balance — Today's balance / Projected on Jan 03" e a lista das próximas transações ([projeção](https://mobbin.com/screens/d4077983-7bd6-4954-a477-c2bc7594214f)). O acesso é pela pílula no topo da lista de transações.
- **Web Bills & Income:** abas Overview | Cash Flow | All Series | Refunds e subabas All Active, Bills, Subscriptions, Income, Transfers, Canceled. A linha tem conta, categoria, valor e frequência, e o total anualizado ("+$25.00 Yearly") ([séries web](https://mobbin.com/screens/d20c9ad7-3847-4285-9637-61b903d30dbd)).

### Patrimônio, relatórios, metas e investimentos
- **Net Worth web:** períodos 1M, 3M, 6M, 1Y, 5Y, QTD, YTD e All. O gráfico tem colunas Assets × Debt e uma linha Net Worth, com tooltip. Os cartões ao lado são "**Debt to Asset Ratio 98% Risky**" (barra verde→vermelho e conselho em texto) e "Breakdown" $/% por Assets/Debt. A árvore de contas mostra a variação "All-time change" ([patrimônio](https://mobbin.com/screens/cf902547-63ac-48de-8f51-1dce02f9e269)). No iOS, o Net Worth avisa "Limited data available" e mostra a tabela por mês ([iOS](https://mobbin.com/screens/ca8f4eff-8be8-4957-b00e-664b0ad2ce37)).
- **Relatórios:** no iOS é um seletor "Breakdown" + "Date Range", com barras e tabela por mês ([gastos por mês](https://mobbin.com/screens/f74af978-aeef-4149-b481-37809806fb66); [renda líquida](https://mobbin.com/screens/e61697da-7d71-4fc9-8e36-b5b7134dbcc6)). Na web há abas Home | Spending | Spending Summary | Income Summary, rosca e legenda, e uma tabela em árvore "Expense transactions by category". O relatório pode ser salvo com nome ("Save report") ([relatório](https://mobbin.com/screens/c95ecdd8-23a3-4b07-b753-c9e2ce3902bd), [salvar](https://mobbin.com/screens/f856fce1-2331-4685-903d-deb4d96b2338)).
- **Meta:** nome ("House"), o switch "Target goal date", mês e ano, e a contribuição mensal calculada ([meta](https://mobbin.com/screens/f1874d47-a60b-4d0d-86a9-6114edd211f4)).
- **Investimentos:** abas Holdings | Balances | Performance, notícias relacionadas e uma folha para adicionar conta, posições manuais ou dinheiro ([investimentos](https://mobbin.com/screens/e3619715-38dd-4bd7-a15f-88731ffac0bc)).

### IA (Quicken Assist, web, beta)
- **Primeiro uso:** o modal "Welcome to Quicken Assist — Clarity & Insight, Tailored to You" traz três promessas: respostas a partir dos dados, insights e **"Take action… like recategorizing transactions, creating rules, or setting up savings goals"**. Há um bloco de consentimento explícito: "optional and fully under your control… No data is sent to AI until you accept… You can turn off Quicken Assist anytime in settings" ([boas-vindas](https://mobbin.com/screens/29873c85-0112-443a-b378-631e4659b53c)).
- **Chat:** painel lateral direito, que pode ser expandido ou minimizado, com "New" e o selo Beta. A resposta vem estruturada em **What I found / Items to watch / Bottom line**. No exemplo, a IA detectou uma conta recorrente de hipoteca possivelmente duplicada. Há botões 👍 👎, copiar e ouvir, e o rodapé diz "can make mistakes. Verify results" ([chat](https://mobbin.com/screens/e375687d-53bb-4f16-8165-549a57bd3d93)). As conversas anteriores ficam numa lista, com títulos como "Duplicate Recurring Bills Review" ([histórico](https://mobbin.com/screens/fe4c0cee-4748-4f9d-a375-686cd5363ea9)).
- O suporte tem um **agente de IA que vê a tela**, com consentimento: "allow an AI Agent to view your screen… session will be recorded" ([consentimento suporte](https://mobbin.com/screens/c5e6870f-21ee-458f-82a9-fb49ef245651)).

### Compartilhar com parceiro
- **Não está no Mobbin** (nem iOS nem web). A única marca de "pessoa" é um Watchlist por pessoa ("Sam Lee") no painel web, e isso é filtro, não papel.

### Configurações e ajuda
- A gaveta de configurações já foi descrita em Navegação. A ajuda é uma folha "Hi there! 👋 How can we help?" com Messages, Help, "Send us a message", artigos (incluindo "Troubleshooting Missing Transactions"), vídeo no YouTube, blog e **"Want to talk? … for an immediate callback [Call Me]"** ([fluxo ajuda](https://mobbin.com/flows/fe61e981-9bb4-46c2-9583-1981686a03ec)).

## Fluxos

1. **Onboarding (iOS, 12 telas):** carrossel → Create account (e-mail, celular, senha) → código por e-mail → paywall anual com 67% off → Welcome Aboard → Add account ([fluxo](https://mobbin.com/flows/a8fa7bf6-bceb-403d-a372-42ed82e2e4b2)).
2. **Configurar contas (iOS, 15 telas):** Welcome → Add account → Apple Wallet (folha nativa) → "Your connected accounts + Add account" → home vazia ([fluxo](https://mobbin.com/flows/81995b78-8b9d-46d0-8850-20ff5629df9e)).
3. **Adicionar transação (iOS, 24 telas):** lista vazia → ⊕ → pagador → valor (teclado) → conta → data → categoria → tags (folha com busca) → dividir → status, flag, revisado → excluir de plano/relatórios → notas, anexo → Create → toast com Undo ([fluxo](https://mobbin.com/flows/5673c75a-7932-436f-8d9c-f18bdb7ebec5)).
4. **Transação dividida (iOS):** Split → partes com "Left to Split" → Continue → resumo "2 Splits Edit" no formulário ([fluxo](https://mobbin.com/flows/d540e38b-aab2-40c9-ac22-40c6108edc53)).
5. **Rastrear reembolso (iOS):** Refund Tracker vazio → Track a Refund → formulário com data esperada → "Your Refund has been created" + toast com Undo → lista Expected ([criado](https://mobbin.com/screens/3b0b5c12-410f-4afe-9eec-552cc5532376)).
6. **Montar o Spending Plan (web):** intro em cascata → Income → faixa "1 of 4" → Add bills (detectadas, desmarcáveis) → Planned → Other ([intro](https://mobbin.com/screens/da3c5ea7-0a34-4b64-ac74-d6822e79f993)).

## Diferença iOS × web

- **Navegação:** o iOS usa ☰ e gaveta, sem tab bar, e tudo fica a dois toques. A web usa trilho de ícones e a coluna fixa de contas.
- **Spending Plan:** no iOS são telas empilhadas (Overview → detalhe). Na web, a cascata Income − Bills − Planned − Other − Goals fica sempre visível à esquerda e é a própria navegação. A web explica melhor a conta.
- **IA:** o Quicken Assist só aparece na web no Mobbin, com o botão ✦ flutuante. No iOS não vi tela de IA.
- **Densidade:** a web tem tabelas com colunas configuráveis, filtros de 3 colunas e relatórios salvos. O iOS é formulário longo e listas simples.
- **Visual:** é o mesmo nos dois: roxo chapado, cartões brancos, ilustrações de estrela e caixa nos vazios.

## Para nós

**Copiar**
- **"Disponível por dia"** ao lado do disponível do mês ("−$8.71 Available per day"; o Rocket faz o mesmo na web). É a resposta curta a "quanto posso gastar".
- **A cascata como navegação do plano:** Receita − Contas − Planejado − Outros − Metas = Sobra. Cada termo é clicável e abre o que o compõe. Serve à nossa visão de família: cada termo pode mostrar "de quem".
- **Refund Tracker = estorno esperado.** Uma lista "Esperados × Recebidos", com **data esperada e alerta se não chegar**, e o atalho "Esperando estorno?" dentro do formulário de transação. Casa direto com o nosso estorno na fatura: dá para ligar o esperado à fatura que deveria trazê-lo.
- **Configurar contas detectadas com desmarcar** ("We found the following recurring bills. Uncheck any you don't want") e a faixa de progresso fixa "1 of 4".
- **"Excluir de: Plano / Relatórios"** como duas caixas explicadas no formulário (equivale ao "Ignore" de 3 níveis do Rocket).
- **Resposta da IA em 3 blocos** (O que achei / O que vigiar / Em resumo) e o **consentimento antes do primeiro envio**. Combina com "dados da pessoa".
- **Debt-to-asset ratio com faixa e conselho** como cartão de patrimônio.
- **Filtro de transações em 3 colunas** com o resumo em chips à direita.

**Evitar**
- **Paywall antes de ver o app**, sem teste visível e com preço riscado. É o oposto do nosso "teste sem cartão".
- Celular obrigatório no cadastro.
- **Formulário de transação com 15+ campos** numa página (status, cheque, flag, revisado…). **Julgamento:** é contabilidade de Quicken herdada. Nosso lançamento deve continuar curto, com o resto em "mais detalhes".
- Gaveta como única navegação no telefone: Reports tem 9 subitens escondidos.
- Achievements e Credit Score disputando o painel.

**Onde ganhamos**
- **Família:** nenhuma tela de compartilhamento no Mobbin. A "pessoa" só existe como filtro de watchlist.
- **Captura:** a porta de entrada é conectar banco (ou Apple Wallet). O manual é um formulário longo, e não há mensagem, voz nem foto.
- **Cartão:** "Credit" é só uma linha no cartão Banking. Não vi fatura, fechamento nem parcela, nem em iOS nem em web.
- **Ameaça:** a **Apple Wallet como fonte de contas** já está no onboarding deles ("NEW"). Se o nosso "Apple Pay" for captura, o Simplifi já tem a versão de conexão.

## Arquivos baixados

Pasta: `simplifi/`

| Arquivo | Tela |
| --- | --- |
| ios-criar-conta.webp | https://mobbin.com/screens/d95ca539-cfeb-4c85-ab3b-a92387c3ed06 |
| ios-verificar-email.webp | https://mobbin.com/screens/3f5e3416-972e-410e-810c-930610674cb8 |
| ios-paywall-topo.webp | https://mobbin.com/screens/aaaad76e-f005-4da0-8135-0b7b0028ca08 |
| ios-paywall-rodape.webp | https://mobbin.com/screens/5b3319d4-5850-4a7c-ad5c-30af961e11e0 |
| ios-painel-ordenar-cartoes.webp | https://mobbin.com/screens/fd5e9886-e50a-4b39-8e63-7c990e558b2a |
| ios-plano-gastos-visao.webp | https://mobbin.com/screens/e52fd942-c411-4981-80c2-0ff0282b0a96 |
| ios-contas-a-pagar-calendario.webp | https://mobbin.com/screens/f8776143-92ee-4bd5-a60e-c7738fe7982d |
| ios-fluxo-projetado.webp | https://mobbin.com/screens/d4077983-7bd6-4954-a477-c2bc7594214f |
| ios-adicionar-transacao.webp | https://mobbin.com/screens/e03e76d2-c2ae-4c8a-aac7-a24f93a7d27e |
| ios-rastrear-reembolso.webp | https://mobbin.com/screens/f1d47c4b-55ca-4b06-a4ac-682678eb2c33 |
| ios-reembolsos-lista.webp | https://mobbin.com/screens/1d3e2636-1dfe-4d1a-bf3d-d3a2ddd1f584 |
| web-painel.webp | https://mobbin.com/screens/f4185e0b-854e-4b34-b478-848edd784844 |
| web-painel-watchlist.webp | https://mobbin.com/screens/defceb80-cdf5-414c-a79a-299c9180f3c1 |
| web-plano-gastos.webp | https://mobbin.com/screens/dd505fe6-1fef-4e88-be94-9cc014500afb |
| web-transacoes.webp | https://mobbin.com/screens/e543344e-1f98-4610-b7eb-a54e29b5eeb4 |
| web-patrimonio.webp | https://mobbin.com/screens/cf902547-63ac-48de-8f51-1dce02f9e269 |
| web-quicken-assist.webp | https://mobbin.com/screens/e375687d-53bb-4f16-8165-549a57bd3d93 |
