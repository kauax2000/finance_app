# YNAB — telas no Mobbin

Estudo de 28/10/2026. Complementa o dossiê de produto `docs/produto/concorrentes/eua/2026-10-26-ynab.md` (preço, empresa e funcionalidades estão lá). Aqui ficam só as telas e a UX.

## Cobertura

- **iOS: sim.** É o app novo, de set/2025: o "Great YNAB Remodel", com fundo creme, verde-lima e roxo, e a tab bar Plan · Accounts · Transaction · Reflect · Help. Vi cerca de 45 telas: o fluxo "Onboarding" (12 telas), o "Creating an account" (7), o "Completing onboarding" (5) e telas soltas do plano, de transação, do Reflect, de contas, de configurações e do paywall.
- **Web: sim.** É o app.ynab.com, com barra lateral escura e a grade de orçamento. Vi cerca de 35 telas: o "Onboarding" (21 telas), o "Setting up a first target" (4), o "Adding a transaction" (8), os fluxos de mover e duplicar transação e telas soltas do plano, do Reflect e do YNAB Together.
- **Ausências no Mobbin, depois de buscas:**
  - nenhuma tela de cartão de crédito com a categoria "Credit Card Payment" (as contas da demonstração são só caixa e empréstimo);
  - nenhuma tela de IA ou chat (o produto não tem);
  - nenhuma tela de assinatura ou recorrente além do campo "Repeat";
  - nenhuma tela do YNAB Together no iOS (só na web).

## Navegação e arquitetura de informação

**iOS**
- A tab bar tem 5 itens: **Plan**, **Accounts**, **Transaction** (um "+" central em círculo, que abre a folha de lançamento), **Reflect** e **Help**. A "Help" é uma aba inteira, o que mostra o peso da educação no produto. Veja [plano iOS](https://mobbin.com/screens/df907708-c21e-4fb4-970a-c747b1bb7a01).
- O topo do Plan tem o "⋯" à esquerda, o mês no centro como seletor ("Sep 2025 ⌄") e, à direita, o filtro e o "editar plano". Logo abaixo, um segmentado alterna **Categories** e **Spotlight**.
- **Ready to Assign** é uma faixa verde-lima larga, logo abaixo do segmentado: o número que manda na tela inteira.
- Não há aba de configurações: elas moram no "⋯". Uma das telas, [Account Settings](https://mobbin.com/screens/fe5744f7-64af-4503-b016-e1244528820b), é uma webview com setas de navegador embaixo, um sinal de remendo.

**Web**
- A barra lateral escura (azul-marinho) tem, no topo, o nome do plano e o e-mail num seletor; depois **Plan**, **Reflect** e **All Accounts**; depois as contas agrupadas (Starred, Cash) com o saldo de cada uma e o tique de conciliada; e "+ Add Account" no pé. Veja [plano web com inspetor](https://mobbin.com/screens/caa1e0f6-53f7-44e7-b3b1-fe79fdfe5a5d).
- Todo o espaço de trabalho tem **três colunas**: a lateral, a grade e um **inspetor** à direita (o resumo do mês, ou o detalhe da categoria selecionada).
- Uma faixa roxa no topo da tela de contas avisa "27 new transactions to approve or categorize" e tem um botão [View]. Veja [All Accounts](https://mobbin.com/screens/d6d76a46-7846-4f0c-865a-2bfdcffb903a).
- A tela inicial depois do login é a grade "Your Plans", com um cartão por plano e uma coluna de "Explore Resources" (vídeos, blog, podcasts). Veja [Your Plans](https://mobbin.com/screens/b73c87ed-377c-4322-ac30-962eb5bacd7f).

## Telas por área

### Onboarding e cadastro (o método ensinado antes da conta)

- **[Abertura](https://mobbin.com/flows/e61d5e95-d0e7-4f9c-a6fa-65c01290e2ff).** Texto grande em cinza, "You're not bad with money. You just haven't found a tool that works. Until now.", com o logo da árvore e as ações [Get Started!] e [I have a YNAB account].
  - Bom: fala da culpa da pessoa antes de falar do produto.
- **[Mini-jogo do método](https://mobbin.com/screens/d31bd7cc-06e5-42be-8bd6-3e2ef5c7dd90).** "With YNAB, you give every dollar a job." Mostra "Balance: $2400" e cinco potes (Bills, Fun Stuff, Car Maintenance, My Trip!, My Hobbies) com o botão "Tap to fill".
  - Ao tocar, o saldo cai ($1600) e notas de dinheiro voam para o pote ("To have what you need…"). Veja [potes enchendo](https://mobbin.com/screens/d1119f50-4834-4fe5-804b-121935ed2de8).
  - Fecha com "Now you can make guilt-free purchases": o pote "My Hobbies $100" diz "I've got money already set aside!", e o botão é "You're coming home with me".
  - Bom: ensina o modelo mental inteiro em 3 toques, sem um campo de formulário.
- **Carrossel ilustrado** com potes de moedas e o texto "your plan can change too… move money around whenever you need. Not just expected, but encouraged." São seis pontos de paginação, no fluxo de onboarding.
- **[Quem mora na casa](https://mobbin.com/screens/c37f4a28-98de-4f18-8a07-8c6285fe1dbc).** "Who's in your household?", com escolha múltipla entre Myself, My partner, Other adults, Teens, Kids e Pets, mais uma barra de progresso no topo.
  - Serve para montar as categorias iniciais. É a única menção a família no onboarding.
- **[Plano pronto antes da conta](https://mobbin.com/screens/c8f55d9d-bfa0-49bd-a825-5d3012cf1fa1).** "Sam's Plan": um foguete e o texto "Wow, now that's a plan! 🎉 Save your progress (and keep going!) when you sign up for a free trial today."
  - Embaixo, as categorias montadas com os valores em esqueleto e o botão [Continue].
  - Bom: a pessoa vê o plano dela antes de criar a conta. O cadastro vira "salvar o que já fiz".
- **[Paywall iOS](https://mobbin.com/screens/d6c179ff-6587-4b17-aee1-eb836d5d5d7f).** "Start Your Free Month Today" e "The average YNABer saves $600 in their first month."
  - Dois cartões de rádio: Yearly $109.00/year (selo "SAVE 39%", "just 30 cents per day!") e Monthly $14.99/month. Abaixo, o selo "Featured by Apple".
  - **Uma caixa de confirmação é obrigatória** antes do botão: "I understand that my free trial will last until October 2, 2025, and will auto-renew at $109.00/year until cancelled".
  - Rolando, aparecem o depoimento de um casal, "91% say YNAB has changed…", "Manage money together… up to six people" e um bloco **"Here's how your free trial works"** em 3 passos (um mês grátis, renovação automática, como cancelar nos ajustes da Apple até 24 horas antes). Veja [paywall, como funciona o teste](https://mobbin.com/screens/bb8d791a-532b-4b0b-b0c1-e2f2ac37469a).
  - No iOS o teste passa pela assinatura da App Store. Já a landing da web diz "No credit card required" (vista no fluxo web de onboarding).
- **[Boas-vindas depois do pagamento](https://mobbin.com/flows/e61d5e95-d0e7-4f9c-a6fa-65c01290e2ff).** "Welcome, new YNABer!", "We'll show you how to give every dollar a job", o campo "Plan Currency: US Dollar" e o botão [Personalize Your Plan].
- **Web.** Um modal com ilustração à esquerda e texto à direita, com barra de progresso no topo:
  - "First things first, people call us 'why-nab'. What should we call you?" (o nome);
  - "Let's build your plan";
  - um depoimento ("You can get out of debt, and stay out!" — Trent, YNABer).
  - Depois vêm 3 passos na própria grade, com uma faixa no pé: "Step 1 of 3 · Personalize your plan · Continue Without Targets", "Step 2 of 3 · Start working with real numbers… Add your account balances" e o modal "Wow, now that's a plan!" com [Start Over] e [Set Your First Target]. Veja [fluxo web](https://mobbin.com/flows/175d554e-52b3-480a-be60-6038541cb65e), [primeiro target](https://mobbin.com/flows/bdec42d4-6dd0-476c-b5d8-1e50c3e02669) e [wow plano web](https://mobbin.com/screens/e4ed1348-0e37-4366-88df-554af97b0b73).
- **Fraco:** são 12 telas no iOS e 21 na web antes do uso real. O paywall vem antes de qualquer conta ou dado verdadeiro.

### Plano: atribuir o dinheiro (o coração)

**iOS**
- **[Plano vazio](https://mobbin.com/screens/e4798a83-cd7c-444f-8929-0eda37637013).** Um cartão verde com envelope: "Assign Your $50,000.00. This is the money in all of your bank accounts. Let's give it something to do! Start by asking yourself, 'What does this money need to do before I get paid again?'". Botão [Assign Money] e, abaixo, [Add Another Account].
  - Cada categoria mostra o chip amarelo "$0.00" e a frase "$2,800.00 more needed by the 29th".
  - Bom: o estado vazio é uma pergunta do método, não um "nenhum dado".
- **[Plano com estados](https://mobbin.com/screens/df907708-c21e-4fb4-970a-c747b1bb7a01).** Cada linha tem o emoji, o nome, um **chip de saldo** à direita (verde = financiado, amarelo = falta, cinza = zero) e, embaixo, uma **barra fina segmentada** com a frase de estado:
  - "Funded";
  - "$1,400.00 more needed this month";
  - "Funded. Spent $50.00 of $200.00";
  - "$200.00 needed eventually";
  - "Fully Spent" (barra hachurada).
  - Bom: a frase sob a barra explica o número. Ninguém precisa decifrar cor.
- **[Atribuir com teclado](https://mobbin.com/screens/ec57556a-a5c3-48a7-aec3-4fc911a83155).** Tocar na linha (Utilities) a destaca em lilás e abre um **teclado numérico próprio, com calculadora** (−, +, =).
  - O teclado tem uma fileira de atalhos em cima: **Auto-Assign**, **Move Money** e **Details**.
  - No modo edição, as colunas ficam "Assigned" e "Available".
- **[Mover dinheiro](https://mobbin.com/screens/f5ac4a9f-be14-43fe-937e-ac04601591df).** Uma folha com a origem no topo ("Move From ⚡ Utilities $60.00"), uma seta "To", o destino (📦 Self storage) e um **slider** para arrastar o valor, além do teclado e de "Select Another".
  - O fundo da folha muda de verde para amarelo quando a origem fica abaixo da meta. Veja [mover, origem amarela](https://mobbin.com/screens/d4385427-4995-4ac2-a5dc-2a8f0bd27403).
- **[Cobrir estouro](https://mobbin.com/screens/f4a9ab88-82d1-4710-9a1c-d9c7bf3de2cf).** "Cover Overspending · 👖 Clothing $0.00". Escolhe-se a fonte (Groceries, que fica a −$1,400 e mostra $1,300 restantes) no mesmo slider, e [Done].
- **[Filtro "Underfunded"](https://mobbin.com/screens/ddfe8fba-ab03-4efc-bbcd-7757888d0030).** O plano mostra só o que falta financiar, com "Viewing Underfunded. View All Categories".
- **[Editar plano: "Cost to Be Me"](https://mobbin.com/screens/f8920a5f-afba-4c83-9ee3-ae9f85080284).** Um cabeçalho roxo com "$0.00 Cost to Be Me" e duas barras, Monthly Targets e Monthly Income ($8,000).
  - O cartão "What does it cost to be you? Your targets add up to one simple number". Cada categoria tem "+ Add Target". Ações: New Group e Reorder.
  - Quando os targets passam da renda, a barra fica **vermelha** ($8,040 contra $8,000). Veja [cost to be me estourado](https://mobbin.com/screens/f3b4f3b5-6954-44b1-9a10-4312dd1531cd).
- **[Tipo de target](https://mobbin.com/screens/e44344b7-3e0b-4ff4-9d4c-0e1c8ec0a6c6).** "Rent · Each Month" oferece duas opções: "Set aside another $2,800.00" (selo "Most people choose this") ou "Refill up to $2,800.00" ("Use for: groceries, fun money, dining out", com a explicação da sobra).
  - Bom: a escolha técnica vem com um exemplo de uso e com a escolha da maioria.
- **"Finish Onboarding".** Um cartão roxo no meio do plano ("Spend with confidence and clarity") até a pessoa terminar a configuração. Veja [fluxo completing onboarding](https://mobbin.com/flows/b05bd5de-003b-488c-b4d8-a487f5f99c56).

**Web**
- **[Grade com inspetor](https://mobbin.com/screens/caa1e0f6-53f7-44e7-b3b1-fe79fdfe5a5d).**
  - Topo: as setas ‹ Oct 2025 › com uma nota do mês ("This is my budg…"), e no centro um cartão de estado: "$0.00 All Money Assigned ✓", que vira o botão verde "$57.56 Ready to Assign [Assign ▾]".
  - Chips de filtro: All · ⚠ 1 Overspent · Money Available · Underfunded · Snoozed · Overfunded · Next Bills.
  - Barra de ações: + Category Group · Undo · Redo · **Recent Moves**.
  - Colunas: CATEGORY · ASSIGNED · ACTIVITY · AVAILABLE, com checkbox por linha e totais por grupo.
  - O inspetor da categoria (Investments) mostra Available Balance, "Cash Left Over From Last Month", "Assigned This Month", "Cash Spending" e "Credit Spending", e depois o editor de **Target** (Weekly/Monthly/Yearly/Custom, "I need $10", "By 27th", "Next month I want to: Set aside another / Refill up to"), Auto-Assign e Notes.
- **[Inspetor do mês](https://mobbin.com/screens/c7ef15d3-daa7-4aca-9b1d-d1cb12447bed).** "October's Summary" (Left Over from Last Month, Assigned, Activity, Available), "Cost to Be Me" com a renda esperada editável, e **Auto-Assign** como lista de atalhos:
  - Underfunded, Assigned Last Month, Spent Last Month, Average Assigned, Average Spent, Reset Available Amounts e Reset Assigned Amounts, cada um com o valor ao lado.
- **[Estouro: "Fix This"](https://mobbin.com/screens/c27d6573-f43d-4087-986b-e95c5ca054e8).** O cartão central fica vermelho ("−$10.00 You assigned more than you have [Fix This]") e abre um popover "Un-assign money from [select]" com Cancel e OK.
  - Bom: o erro vem com o conserto no mesmo lugar.
- **[Mover pelo popover](https://mobbin.com/screens/bb2e4b81-eece-4045-959c-417d28d5ae8f).** Clicar no chip "Available" abre "Move [10.00] To [select]".
  - No inspetor aparece "Assigned in Future Months", com "Ready to Assign in November is −$10.00. Cash overspending in October reduced the money ready to assign for November" e o botão [Cover Overspending].
  - Embaixo, uma dica educativa: "Tired of living paycheck to paycheck? Getting one month ahead…".
- **[Detalhe do Ready to Assign](https://mobbin.com/screens/f27d0ba5-3da0-465f-91a5-fb409c77b548).** Um popover com a conta: + Inflow, − Assigned in October = Total, "Nice work! Every dollar has a job.", e um aviso com link para "YNAB Checkup".
  - Bom: o número principal é auditável num clique.
- **[Editar flags](https://mobbin.com/screens/a8a3c74c-7afb-4ec9-98c4-4e69e30d2fa7).** Seis cores de flag renomeáveis (Overspent Alert, Coming Up, To Budget, On Track, For Review, Fun Money).
- **Fraco (julgamento):**
  - a grade tem 3 colunas de número e 7 chips de filtro, densa para quem chega;
  - "Credit Spending" no inspetor é o único traço de cartão visto;
  - não se vê o lado do cartão (fatura, fechamento) em nenhuma tela.

### Lista de transações e detalhe/edição

**iOS**
- **[Registro da conta](https://mobbin.com/screens/dc7fe159-a71e-4abd-921b-ec9dbf86bbf8).** O cabeçalho mostra "Daily", "⛓ Unlinked", "$52,020.00 Working Balance" e o botão [Select].
  - Abaixo: a busca, a linha "Show 11 uncleared transactions ›" e a lista agrupada por dia. Cada linha tem o beneficiário, a categoria com emoji, o valor e o ícone "C" de conciliado.
- **[Seleção múltipla](https://mobbin.com/screens/f9ad37e5-3c05-4906-b5c7-cbcd70400d9f).** "3 Selected", "−$750.00 Selected Total", e uma barra de baixo com Approve · Categorize · Clear · More.
  - Bom: a soma do que está selecionado aparece no topo.
- **[Memo na lista](https://mobbin.com/screens/f094bf8d-058e-44b8-8968-f5e68743f543).** O memo aparece numa pílula sob a linha ("September rent"), com a flag colorida no nome. O "Starting Balance" aparece como "Inflow: Ready to Assign".

**Web**
- **[All Accounts](https://mobbin.com/screens/d6d76a46-7846-4f0c-865a-2bfdcffb903a).** Uma planilha com as colunas ACCOUNT · DATE · PAYEE · CATEGORY · MEMO · OUTFLOW · INFLOW e um ícone de estado.
  - Em cima, a equação **Cleared Balance + Uncleared Balance = Working Balance**.
  - Ações: + Add Transaction · File Import · Undo/Redo · View · busca.
  - Uma transação importada sem categoria mostra o chip amarelo **"This needs a category"**, e um "i" azul marca as não aprovadas.
- **[Ações em lote](https://mobbin.com/flows/5a5e4642-3491-4bb8-81f3-6efef48bd3b3).** Selecionar linhas faz surgir uma barra flutuante escura no pé: "× 3 Transactions · Approve · Reject · Categorize · ⋯ More".
  - O "More" abre: Mark as Uncleared (C), Match (M), Unmatch (⇧U), Duplicate (⇧D), Flag ›, Move to Account ›, Export 3 Transactions e Delete. Todos têm atalho de teclado.
- **[Conta individual](https://mobbin.com/screens/fc197648-f393-4837-9973-0efe595cce70).** O título "USD Account (USD) – 5148 ☆", os selos "Checking · Linked · Not Yet Reconciled" e o botão [Reconcile] em destaque.
  - "Edit Account" é um modal com apelido, notas, **Working Balance editável** ("An adjustment transaction will be created automatically if you change this amount"), "Unlink Account" e "Close Account".

### Adicionar transação manual

**iOS: [Add Transaction](https://mobbin.com/screens/eafd2ca3-0a9a-4836-87fc-2901155f6f53)**
- Uma folha modal com Cancel e o título.
- Um segmentado **− Outflow | + Inflow** e o valor grande em vermelho ("−$2,800.00").
- Um cartão com Payee, Category, Account e Date, cada um com ícone roxo e chevron.
- Um segundo cartão com Cleared (toggle), Flag e Memo; um terceiro com Repeat ("Never").
- Um botão flutuante [✓ Save].
- O seletor de flag é uma folha por cima, com 7 cores e "Edit Flags". Veja [flags](https://mobbin.com/screens/fb412c87-a80e-4ceb-9c9d-6f09b7fb581a).
- Bom: a ordem segue a cabeça (quanto, para quem, de onde).
- Fraco: são 8 campos visíveis, e "Cleared" é jargão contábil logo no formulário principal.

**Web: [adicionar transação](https://mobbin.com/flows/5a5e4642-3491-4bb8-81f3-6efef48bd3b3)**
- "+ Add Transaction" insere uma **linha editável no topo da própria planilha**: Account ▾ · Date ▾ · Payee ▾ · Category ▾ · memo · outflow · inflow.
- Os botões são [Cancel], [Save] e **[Save and add another]**.
- A data abre um calendário com **"Repeat: Never ▾"** dentro do próprio seletor. Veja [data com repetir](https://mobbin.com/screens/ed6520a9-d446-4369-ab74-8ce9fbfe46e7).
- Escolher como Payee uma conta ("To/From SGD Account") vira **transferência**, e a categoria passa a "Category not needed".
- **[Dividir](https://mobbin.com/screens/fd551b69-3a52-4ef6-9eba-6a6199694f41).** Category "Split (Multiple Categories)…" abre subliinhas e mostra **"Amount remaining to assign: 0.00 / 50.00"**.
  - O payee abre uma lista agrupada: "Payments and Transfers" e "Saved Payees", com "Manage Payees" no pé.
- Bom: é rápido para quem digita muito (estilo planilha, Enter e Tab).
- Fraco: não há valor em destaque, nem sugestão de categoria visível no momento de digitar.

### Categorias e orçamento
Coberto em "Plano". Há ainda o [Reordenar categorias](https://mobbin.com/screens/ef1bb354-53df-4c3f-b715-82eee17fac1c) (uma folha com puxadores por grupo e por categoria) e o "+ Add Category" junto ao nome do grupo na web (no fluxo de onboarding web).

### Cartão de crédito, contas, faturas e recorrentes

- **[Adicionar conta](https://mobbin.com/screens/fcdebe98-ce76-4b36-bf12-9312a91294fa).** "Search for your bank", uma grade de 8 bancos populares (Chase, Capital One, Amex, BofA, Citi, Discover, Wells Fargo e Apple) e, abaixo de "or", **"Add an Unlinked Account"**.
  - O manual é a segunda opção, visível mas subordinada.
- **[Lista de contas iOS](https://mobbin.com/screens/ea080d33-e23c-4473-a08c-0c0493de6604)** (tema escuro): um aviso de notificações, "All transactions" e os grupos Cash, Loan e Closed com o subtotal de cada um, mais [+ Add Account].
- **[Empréstimo](https://mobbin.com/screens/f82cde3f-c4d8-4688-94ba-4f16096e79ef).** Abas Overview e Activity, um anel "99.8% Paid Off", "Loan Payoff Overview: You'll pay off your loan in 1 month if you pay the minimum", Monthly Target, Due Every, **Debt Free Date: Oct 2025** e [Edit Target].
  - Bom: transforma a dívida numa data.
- **Cartão de crédito: não visto no Mobbin.** O "Credit Spending" no inspetor e as "Annual credit card fees" como categoria são os únicos traços.
- **Recorrentes: só o "Repeat"** no lançamento e na data. Não há tela de assinaturas nem calendário de contas.

### Metas, patrimônio, relatórios e gráficos

- **[Reflect iOS](https://mobbin.com/screens/f9387a42-18ab-4c36-a7f5-425845680ff8).** "Spending Breakdown" com o segmentado Month/Preset, "Last 3 Months ⌄", "+$2,220.00", uma **barra empilhada horizontal** e a lista de categorias, cada uma com uma barrinha de % e um chevron. No fim, "Positive Inflow Categories".
- **[Reflect web](https://mobbin.com/screens/e492e96c-7278-4e2f-8dd8-9cfa73d76fe2).**
  - Abas: Spending Breakdown · Spending Trends · Net Worth · Income v Expense · Age of Money.
  - Filtros: mês, All Categories e All Accounts. Botão Export.
  - Uma **rosca** com rótulos externos e o centro dinâmico (a categoria sob o cursor: "🎁 Holidays & gifts $91.58 42%"), o segmentado Categories/Groups e a lista com barras à direita.
  - Embaixo: Average Monthly Spending, Average Daily Spending, Most Frequent Category e Largest Outflow.
- **Metas** são os "Targets" das categorias (vistos acima). Não há tela de meta separada.

### Compartilhar com parceiro ou família

- **[YNAB Together (introdução)](https://mobbin.com/screens/e4ec2c3f-3f3c-4ac9-9663-c1f734b9a593).** Uma ilustração de "high five" e o texto "Invite up to 5 people to your subscription without having to share your password. Each member… gets their own YNAB account… As the group manager, you can choose to share your plans or keep them private."
- **[Painel do grupo](https://mobbin.com/screens/798a5c8f-660a-4c90-b97f-e4410eb1d775).** Group Manager (Sam), Pending Invitations (John Doe), "4 invites remaining" e [Invite Member].
- **[Convidar](https://mobbin.com/screens/37839cbe-87dd-4b17-973a-d70d8aa17103).** Nome, e-mail e **"Select Your Plan(s) to Share"**, com uma caixa por plano.
- **[Gerenciar membro](https://mobbin.com/screens/10cf68b5-ebe4-4edd-92cc-d764d596f3c5).** "Pending: Invite Expires Nov 04, 2025", Cancel Invite e [Resend Invite].
  - Mostra **"Since you're the group manager, John Doe's plans will always be shared with you"** e a lista dos planos dele com o estado Shared ou Not shared.
- No iOS, só a pergunta "Who's in your household?" do onboarding e a faixa de indicação "Sharing YNAB with a friend? [Share]". Veja [plano com valores ocultos](https://mobbin.com/screens/c548dc57-ab85-4d9f-97fa-f24b2814e089).
- Fraco: a unidade é o **plano inteiro**. Não há papel, nem "quem pagou", nem visão por pessoa. O gerente vê tudo dos membros por regra.

### IA, chat e insights
Não há no Mobbin, e o produto não tem. O "insight" vem como frase de estado na linha da categoria, como "Spotlight" no Plan (a tela não foi vista) e como dicas educativas no inspetor.

### Configurações
- **[Display Options](https://mobbin.com/screens/d8a1904e-6749-4f36-a2f4-da5d61b08da4).** Theme (Light, Dark ou Match System) e **Balance Style: "Differentiate Without Color"**, que acrescenta contorno e símbolo aos chips vermelho, amarelo e verde.
  - Bom: acessibilidade para daltonismo pensada no componente de saldo.
- **[Esconder valores](https://mobbin.com/screens/c548dc57-ab85-4d9f-97fa-f24b2814e089).** Um ícone de olho no topo do plano troca todos os valores por "••••••", mas as barras ficam.
- **[Account Settings](https://mobbin.com/screens/fe5744f7-64af-4503-b016-e1244528820b).** Uma webview simples com nome e login.

## Fluxos

1. **Onboarding iOS** ([fluxo](https://mobbin.com/flows/e61d5e95-d0e7-4f9c-a6fa-65c01290e2ff)):
   1. a frase "You're not bad with money";
   2. o carrossel do método;
   3. o mini-jogo dos potes;
   4. as perguntas (quem mora na casa e outras);
   5. as categorias sugeridas;
   6. o plano pronto ("Wow, now that's a plan!");
   7. o cadastro ([fluxo](https://mobbin.com/flows/34bde369-d45f-4a67-8e7c-446aa762fdd2));
   8. o paywall com a caixa de ciência;
   9. "Welcome, new YNABer!" e a moeda;
   10. o plano vazio "Assign Your $50,000";
   11. o "Finish Onboarding" ([fluxo](https://mobbin.com/flows/b05bd5de-003b-488c-b4d8-a487f5f99c56)).
2. **Onboarding web** ([fluxo, 21 telas](https://mobbin.com/flows/175d554e-52b3-480a-be60-6038541cb65e)):
   1. a landing, "No credit card required";
   2. o modal do nome ("why-nab");
   3. "Let's build your plan";
   4. as perguntas e os depoimentos;
   5. o "Wow, now that's a plan!";
   6. os passos 1/3 a 3/3 na própria grade (categorias e targets, saldos reais das contas, primeiro target — [fluxo](https://mobbin.com/flows/bdec42d4-6dd0-476c-b5d8-1e50c3e02669)).
3. **Adicionar transação, web** ([fluxo](https://mobbin.com/flows/5a5e4642-3491-4bb8-81f3-6efef48bd3b3)): + Add Transaction, a linha editável, a conta, a data com Repeat, o payee (uma conta vira transferência), a categoria, o valor, e [Save] ou [Save and add another].
4. **Adicionar transação, iOS:** o "+" da tab bar abre a folha, que tem Outflow/Inflow, o valor, Payee, Category, Account, Date, Cleared, Flag, Memo e Repeat, e [Save].
5. **Atribuir dinheiro, iOS:** o cartão "Ready to Assign", tocar na categoria, o teclado com calculadora, e Auto-Assign ou Move Money (slider entre origem e destino) e [done].
6. **Corrigir estouro, web:** o cartão vermelho "You assigned more than you have", [Fix This], "Un-assign money from", e OK.
7. **Convidar parceiro, web:** YNAB Together, Get Started, Invite Member (nome, e-mail e planos a compartilhar), Pending ou Resend.
8. **Ações em lote, web:** marcar as linhas, a barra flutuante, Approve, Categorize ou More (Duplicate, Move to Account e outros). Veja [mover](https://mobbin.com/flows/423273e1-6fc1-454e-b9a5-761dc7e75aa4) e [duplicar](https://mobbin.com/flows/97b364e3-e661-4cdf-9b93-0bb532b92a1d).

## Diferença iOS × web

- **O modelo é o mesmo, a forma é outra.**
  - O iOS é um **app de toque**: linhas grandes com frase de estado, chips coloridos, teclado-calculadora próprio, slider para mover dinheiro e folhas em cascata.
  - A web é uma **planilha**: colunas Assigned, Activity e Available, inspetor lateral, popovers e atalhos de teclado.
- **Atribuir.** No iOS, atribuir é tocar na linha e digitar no teclado da casa. Na web, é digitar na célula "Assigned" (a célula vira um campo com calculadora).
- **Detalhe da categoria.** No iOS fica em "Details", no teclado ou numa folha. Na web, no **inspetor fixo** à direita.
- **Lançamento.** No iOS é uma folha com cartões de campos. Na web é uma linha inline com "Save and add another".
- **Telas só da web:** relatórios completos (5 abas), ações em lote com atalhos, Reconcile em destaque, YNAB Together e Edit Account.
- **Telas só do iOS:** o mini-jogo do método, o paywall da App Store, "Cost to Be Me" como tela cheia e "Differentiate Without Color".
- **Visual.** O iOS tem fundo creme, lima e roxo e é lúdico (emoji em toda categoria, ilustrações). A web é mais sóbria, com a lateral azul-marinho; os emojis continuam.

## Para nós

**Copiar**
- **Frase de estado sob a barra da categoria** ("$1,400 more needed this month", "Funded. Spent $50 of $200", "Fully Spent"). **Julgamento:** é a melhor peça vista, porque troca o "decifre a cor" por uma frase. Serve para o orçamento por categoria e, de forma direta, para **a fatura do cartão** ("Faltam R$ 320 para cobrir a fatura de 10/nov").
- **O método ensinado com um mini-jogo antes da conta**, e o plano pronto antes do cadastro ("salve o que já fez"). Casa com **teste sem cartão**: a pessoa sente o valor antes de dar qualquer dado.
- **O número principal auditável** (o popover do Ready to Assign: entradas − atribuído = total). **Julgamento:** para nós, o equivalente é "por que o total da fatura é este?" (parcelas, estornos e ajustes, linha a linha). Isso leva ao diferencial **fatura que bate**.
- **O erro com o conserto no mesmo lugar** ("You assigned more than you have [Fix This]").
- **A caixa de ciência no paywall**, com a data exata do fim do teste e o valor da renovação, e o bloco "como funciona o teste" em 3 passos. Casa com **cobrança honesta**.
- **Balance Style "sem depender de cor"** como preferência do componente de saldo.
- **Soma da seleção** no topo da lista de transações e **barra flutuante de ações em lote**. O nosso `DataTable` já tem a barra; falta conferir se mostra a soma.

**Evitar**
- Jargão contábil no formulário principal ("Cleared", "Working Balance", "Uncleared").
- Paywall antes de qualquer dado real, no iOS.
- Onboarding de 12 a 21 telas. **Julgamento:** o nosso caminho é a captura por mensagem ou IA já no primeiro minuto, e não o questionário.
- A grade web com 3 colunas de número e 7 filtros como primeira vista.
- O gerente do grupo ver tudo dos membros por regra. Nós temos papéis (adulto, filho-convidado), e a carteira é pública só entre adultos.

**Onde ganhamos**
- **Cartão e fatura.** Não há uma única tela de cartão com fatura, fechamento, parcelas ou estorno no Mobbin do YNAB. O cartão dele é "gastou, reserva já". Nós mostramos a fatura que bate com o PDF.
- **Família.** A unidade do YNAB é o plano compartilhado, sem "quem pagou" nem acerto. **Julgamento:** a pergunta "Who's in your household?" com Teens e Kids prova que a demanda existe, mas lá ela só gera categorias.
- **Captura.** O "Add Transaction" do YNAB tem 8 campos e nenhuma sugestão automática no momento de digitar. Mensagem, voz e foto são o nosso atalho.
- **Preço.** O "grátis para sempre" contra um paywall de US$ 109/ano logo depois do mini-jogo.

## Arquivos baixados

Pasta: `ynab/`

- `ios-metodo-cada-dolar.webp`: https://mobbin.com/screens/d31bd7cc-06e5-42be-8bd6-3e2ef5c7dd90
- `ios-paywall.webp`: https://mobbin.com/screens/d6c179ff-6587-4b17-aee1-eb836d5d5d7f
- `ios-plano.webp`: https://mobbin.com/screens/df907708-c21e-4fb4-970a-c747b1bb7a01
- `ios-plano-teclado.webp`: https://mobbin.com/screens/ec57556a-a5c3-48a7-aec3-4fc911a83155
- `ios-mover-dinheiro.webp`: https://mobbin.com/screens/f5ac4a9f-be14-43fe-937e-ac04601591df
- `ios-adicionar-transacao.webp`: https://mobbin.com/screens/eafd2ca3-0a9a-4836-87fc-2901155f6f53
- `ios-quem-mora-na-casa.webp`: https://mobbin.com/screens/c37f4a28-98de-4f18-8a07-8c6285fe1dbc
- `web-plano-inspetor.webp`: https://mobbin.com/screens/caa1e0f6-53f7-44e7-b3b1-fe79fdfe5a5d
- `web-estouro-corrigir.webp`: https://mobbin.com/screens/c27d6573-f43d-4087-986b-e95c5ca054e8
- `web-transacoes-aprovar.webp`: https://mobbin.com/screens/d6d76a46-7846-4f0c-865a-2bfdcffb903a
- `web-dividir-transacao.webp`: https://mobbin.com/screens/fd551b69-3a52-4ef6-9eba-6a6199694f41
- `web-together.webp`: https://mobbin.com/screens/798a5c8f-660a-4c90-b97f-e4410eb1d775
