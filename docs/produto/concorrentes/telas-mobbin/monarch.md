# Monarch Money — telas no Mobbin

Estudo da camada de telas e UX. O produto, o preço e a empresa estão no dossiê `docs/produto/concorrentes/eua/2026-10-26-monarch-money.md`; aqui não se repete o que já está lá.

## Cobertura

- **iOS: sim.** Cerca de 45 telas vistas. Captura principal de julho de 2025 (tema claro creme, laranja); dois fluxos antigos de fev/2024 (tema azul-marinho, com "Recurring" como 6ª aba).
- **Web: sim.** Cerca de 75 telas vistas. Captura principal de março de 2025; um fluxo antigo de dez/2023 (sidebar azul).
- **Fora do Mobbin (não vi, procurei):** o **AI Assistant** (lançado em dez/2025) e os **Shared Views** (dono por conta/transação, out/2025). As capturas são anteriores. Procurei "AI assistant chat insights weekly recap" no iOS em modo `deep`: só voltaram outros apps (Cleo, Cash App, Granola). O único chat com IA visto é o **chat de suporte** da web. Também não vi telas de Investimentos por dentro, de cartão de crédito com fatura detalhada, nem de recibo/foto.

## Navegação e arquitetura de informação

**Web (desktop)**
- Sidebar fixa à esquerda, plana, 10 itens: Dashboard, Accounts, Transactions, Cash Flow, Reports (selo "NEW"), Budget, Recurring (contador laranja de pendências), Goals, Investments, Advice. No topo da sidebar: logo, busca (tooltip "Search ⌘K"), sino, engrenagem e botão de recolher. No pé: card "What's New" fechável, barra de "Free trial · 2 days left", "Get 45% discount"/"Get 1 Month Free" (indicação), Help & Support e o usuário. [painel](https://mobbin.com/screens/e3960e40-e978-48dc-8b90-8c91e83d7507), [painel com trial](https://mobbin.com/screens/ca7efb29-4b14-4188-bf19-e662d4e56337)
- Cabeçalho de página com título + abas de sub-visão em texto laranja sublinhado (Reports: Cash Flow · Spending · Income; Budget: Budget · Forecast; Recurring: Monthly · All recurring) e ações à direita (Date, Filters, Saved, botão laranja primário). [relatório](https://mobbin.com/screens/dac45a11-e8d3-4c48-8e3d-5a2e05f74951), [recorrentes](https://mobbin.com/screens/ff4c128e-98e3-4b4c-ab68-837b99b892bb)
- Layout recorrente: **conteúdo à esquerda + coluna "Summary" à direita** (contas, comerciante, relatórios, orçamento). [conta](https://mobbin.com/screens/e448a8b6-c017-4587-90d5-37846c7e13fd)
- Configurações: duas colunas de menu, **Account** (Profile, Display, Notifications, Security) e **Household** (General, Members, Preferences, Institutions, Categories, Merchants, Rules, Tags, Data, Billing, Referrals). [configurações](https://mobbin.com/screens/df8ad161-1592-4458-9426-b8e4cdd0fb80)
- Breadcrumb "Accounts › Cash account", "Goals › Emergency fund".

**iOS**
- Tab bar de 5: Dashboard, Accounts, Transactions, Cash Flow, Budget. Cabeçalho com ☰ (menu lateral) e sino à esquerda, ação da tela à direita. [painel](https://mobbin.com/screens/eb1eb354-7583-4a0b-92e3-f4f5609f719a)
- Menu lateral (gaveta pela ☰): "More Features" (Recurring, Goals, Investments) e "Your Household" (Members, Institutions, Categories, Preferences, Rules, Merchants), barra de trial e "Give 50% Get $50". [menu lateral](https://mobbin.com/screens/f5acd802-5ab8-49ca-85d0-d9799aa450c4)
- **A tab bar é personalizável**: "Edit navigation" arrasta itens entre a barra e a "Side navigation"; Dashboard fica travado (cadeado). [editar navegação](https://mobbin.com/screens/e60e3968-dacd-432a-bf20-924ca8f81979), [com Reset/Apply](https://mobbin.com/screens/da4175c4-a380-40c7-bd03-53bc4d1fcdcd)
- Em fev/2024 a 6ª aba era Recurring (fluxo antigo, tema azul). [fluxo antigo](https://mobbin.com/flows/e12ffc88-2d1f-4cc5-96dd-97761b730c5e)

## Telas por área

### Onboarding, cadastro e paywall
- **Web, cadastro em tela dividida**: Apple, Google ou e-mail à esquerda; à direita, carrossel de depoimento ("…great for if you share expenses with a partner…") sobre um print do app. [cadastro](https://mobbin.com/screens/d81e8377-0577-4050-be9a-94f29509c4ff)
- Passos de uma pergunta por tela, barra de progresso laranja no topo: verificar e-mail (código de 6 dígitos), criar senha com checklist ao vivo, "How did you hear about Monarch?", "What brings you to Monarch?" (multiescolha, inclui "Manage my money with a partner"), "Tell us about yourself" (nome, país, **"Do you manage your finances with a partner?"**, "Do you work with a financial professional?"). [objetivos web](https://mobbin.com/screens/e5a02112-92b2-49c1-a048-dc783c8be249), [fluxo web](https://mobbin.com/flows/c572ee18-b1b9-4ad0-b300-ec215b906bf1)
- **Paywall antes de ver qualquer dado**: linha do tempo "Today / In 6 days (lembrete por e-mail) / In 7 days (cobrança)", anual US$ 99,99 com "SAVE 44%" pré-selecionado e mensal US$ 14,99. No iOS (jul/2025) o botão diz "Start 7-day trial and save 30% more" e um link "Or continue in-app without additional discount" — **empurra a compra para fora da App Store**. [paywall iOS](https://mobbin.com/screens/f4f97ca0-8e85-4609-8f21-c5c9902171d4), [paywall iOS 2024 com Business Insider](https://mobbin.com/screens/648acdda-e963-4f0d-b98d-e32dca5ccdd8)
- **Checkout web (Stripe)**: Google Pay/Link, cartão, promo, "Today's total $0.00" e "After trial (Billed Mar 26, 2025) $14.99". O cartão é obrigatório. [checkout](https://mobbin.com/screens/e9fae71f-d8d5-45d8-9729-6de388dd74cb)
- Depois do pagamento, o painel abre com o dado vazio e um coach mark: "Let's begin by connecting the account where most of your spending happens" (web 2023) e, no iOS, cartões fantasma de transações com "Add account". [fluxo web antigo](https://mobbin.com/flows/894ae6f5-7771-496d-9933-73f653265884), [fluxo iOS](https://mobbin.com/flows/337e1f92-cc63-4c7f-8516-4b462dbb891c)
- **Bom:** uma pergunta por tela; a pergunta "gerencia com parceiro?" já no cadastro; a linha do tempo do teste é honesta sobre quando cobra.
- **Fraco:** cartão antes de qualquer valor; a pergunta do parceiro não leva a nenhum convite logo em seguida (nos fluxos vistos, o próximo passo é pagar).

### Painel (home)
- **Web**: grade de widgets em duas colunas, botão "Customize". Widgets vistos: Getting Started (checklist de 4 com barra segmentada), Budget (Fixed/Flexible/Non-Monthly com barras e "remaining" em verde ou vermelho), Spending (linha deste mês × mês passado, área laranja), Transactions (5 recentes, com filtro "All transactions / Needs review by… Anyone / Sam Lee"), Net worth, Goals (top 3 com foto), Recurring, Investments (top movers), Advice. [painel](https://mobbin.com/screens/e3960e40-e978-48dc-8b90-8c91e83d7507), [painel com investimentos e advice](https://mobbin.com/screens/f5e0390b-fe1f-4c6f-aa6a-fecedd5b24cb), [filtro needs review](https://mobbin.com/screens/d4fc19f8-57df-4c34-a123-22b3b9f64ec7)
- Estado vazio celebrado: "You reviewed everything!" com check verde. [transações revisadas](https://mobbin.com/screens/fde0ac03-319a-480a-a8d7-53cb837d1343)
- **iOS**: os mesmos widgets em coluna, cada um com "⋯"; carrossel de gráficos (pontos de página) no patrimônio; cartão "July's progress — Great job! You're up-to-date for July"; "What's new" fechável. "Customize dashboard" é uma folha com liga/desliga e arrastar. [painel iOS](https://mobbin.com/screens/eb1eb354-7583-4a0b-92e3-f4f5609f719a), [personalizar](https://mobbin.com/screens/f480cf39-0945-4b85-bc1a-472f281eddb4)
- **Bom:** "Needs review" como fila de trabalho com dono; o painel é configurável.
- **Fraco:** sem número-herói do tipo "quanto ainda dá para gastar"; o vermelho "-$61 remaining" aparece mesmo com orçamento $0 (lê como erro).

### Lista de transações e detalhe/edição
- **Web, página Transactions**: lista densa agrupada por dia com o total do dia à direita; colunas comerciante (logo), categoria (emoji + nome), conta, valor. Barra: Search (popover que explica: casa comerciante, categoria, extrato original, valor e notas), Date (presets + duas datas), Filters (painel com abas Categories/Merchants/Accounts/Tags/Amount/Other e checkboxes em árvore), Edit rules, "+ Add transaction". [transações](https://mobbin.com/screens/6d7710b7-7222-45d8-a3a9-550a8bae1516), [filtros](https://mobbin.com/screens/25ee586f-f702-483f-8562-6b9b1b09c636), [datas](https://mobbin.com/screens/b76d55a8-2c46-422b-8653-e2fc635ee35a)
- **Edição em massa**: "Edit multiple" vira checkboxes (⌘A), "2 transactions selected (Esc)", menu "Edit 2 › Edit 2 transactions / Move to account"; painel lateral com "No change" em cada campo (categoria, meta, data, recorrente, notas, tags, ocultar, status de revisão) e uma confirmação "Does this look right?" listando a mudança. [seleção](https://mobbin.com/screens/df18fae2-042d-4fad-9f1a-563199da00ae), [painel em massa](https://mobbin.com/screens/e761a6d8-d2e7-4e29-a02f-2a45e679e830), [mover de conta](https://mobbin.com/screens/e765bbd3-81e4-4f99-bf33-be5bfc3f8fad)
- **Detalhe (web)**: folha à direita com marcar revisado (✓), ocultar (olho), valor e conta no topo, "View 31 transactions" do comerciante, Type, Date, Category com atalho "Split", Goal, Notes, Tags, **"Needs review by: Anyone"**; setas ↑↓ flutuantes para ir à próxima transação sem fechar. [detalhe](https://mobbin.com/screens/e75d351a-b5cc-42e5-a134-79688e30f988)
- **Dividir (web)**: modal com Original e Splits, alternância By Amount / By Percent, "0% left to split" com check verde, "Remove all splits", "Split into 2 transactions". [dividir](https://mobbin.com/screens/ff1a7429-0914-4273-8fb7-10eaffe17f11)
- **iOS**: lista com busca e filtro, cabeçalho com ✓ (revisão) e +; detalhe em lista de linhas (Merchant, Original Statement, History "1 transaction", Account, Category, Goal, Date, Notes, Tags). Depois de dividir, toast "2 split transactions created — Create a rule to do this automatically · CREATE". [lista iOS](https://mobbin.com/screens/fb41dd46-1f4f-416b-86ce-831959737b6f), [fluxo dividir iOS](https://mobbin.com/flows/0a0f283a-5b8a-49c1-a107-774992a44de9)
- Toasts escuros no canto inferior direito com DISMISS ("Transactions deleted successfully · 2 transactions were affected", "Upload complete · Successfully imported 17 transactions"). [toast](https://mobbin.com/screens/d0887146-3b11-4d63-9bc7-3121dedfba10), [CSV](https://mobbin.com/screens/d9b0b49f-d1c4-40ce-ae42-68b3ce48cd96)
- **Bom:** navegar ↑↓ dentro do detalhe; massa com confirmação do que muda; o toast que oferece transformar a ação em regra.
- **Fraco:** nada de parcela, fatura ou estorno na transação; "dono" não aparece (só "Needs review by").

### Adicionar transação manual
- **Web**: modal sobre a página da conta. Segmento Debit/Credit, Amount, Merchant (busca), Date, Category (lista agrupada com emoji e "Create new category"), Notes, Tags (cores, "Create new tag"), e um cartão com interruptor **"Adjust the account balance by $12 — This will update the account's balance by the transaction amount starting on March 11, 2025"**. [vazio](https://mobbin.com/screens/f9ff3d4d-938e-4ba0-85bf-de795dedd7e3), [categoria](https://mobbin.com/screens/ef95c53f-2827-4a4d-9f60-5ef32f98f989), [tags](https://mobbin.com/screens/f24eae38-0397-470e-9808-243eaec97f05)
- **iOS**: folha "New Transaction" com Debit/Credit, **valor grande centrado e "NEW BALANCE: $95.00" logo abaixo**, linhas Merchant, Date, Account, Category; teclado já aberto. [nova transação](https://mobbin.com/screens/d8c96d3b-5680-44a4-b11a-b54c5066571c), [fluxo](https://mobbin.com/flows/dea78d5a-79fd-4668-9fc1-27e1351f3139)
- **Bom:** mostrar o saldo resultante enquanto digita.
- **Fraco:** sete campos para um lançamento; não vi voz, foto, frase livre nem atalho — o manual é um formulário.

### Categorias e orçamento
- **Onboarding do orçamento (web, tela cheia)**: (1) separar categorias em chips arrastáveis nos baldes **Fixed / Non-Monthly / Flexible**; (2) tabela de não mensais com Frequência, Valor-alvo e Orçamento mensal ("se não gastar, rola para os meses seguintes"); (3) "Does this look right for your fixed expenses?" com valores pré-preenchidos do histórico. [baldes](https://mobbin.com/screens/f9b6a221-a541-4148-afaa-5ab1e69a385f), [não mensais](https://mobbin.com/screens/efa45f08-1408-4e1d-9e90-7e023abcd499), [fixos](https://mobbin.com/screens/e796d1bc-7564-4580-9923-2ec925002991)
- **Página Budget (web)**: tabela por grupo com Budget (campo editável na célula), Actual e Remaining em pílula verde; ícone de rollover na pílula; "Every 6 months" sob a categoria; "Show 6 unbudgeted"; seção Contributions com as metas. Coluna direita com **"Left to budget"** grande (vermelho quando negativo) e abas Summary/Income/Expenses. Abas Budget · Forecast. [orçamento](https://mobbin.com/screens/fe7beadd-310d-4122-b68f-6a135a217001)
- Configurações do orçamento em modal: Flex × Category, "This month only / All future months", Recalculate (média histórica), Clear all (com confirmação), "Budget walkthrough". [configurações](https://mobbin.com/screens/f04b452d-0659-4b01-adb5-811289a414d7)
- **iOS**: faixa vermelha "Left to budget -$1,250" no topo, Summary com as três barras, grupos colapsáveis. Editar um valor abre uma folha com Add/Remove, valor grande, "Remaining", os seis meses anteriores, "Spent last month", "Monthly Average" e "Apply to all future months". [orçamento iOS](https://mobbin.com/screens/e6be801e-6f5f-4cc4-9dd1-4548b271566a), [editar valor](https://mobbin.com/screens/e19436f7-ff3e-412d-a5d9-186b5b043e25), [não mensal](https://mobbin.com/screens/fc15c30a-2025-4cd5-b67b-1b9c717d3a39)
- Categorias iOS: lista com alça de arrastar, abas Income/Expense, "Add a category / Add group"; grupo pode ser orçado "By group". [categorias](https://mobbin.com/screens/ef7198ca-74f0-4ab3-899f-d1afd5157b88), [grupo](https://mobbin.com/screens/d7042a2e-9fcb-4477-845b-a226babfbdae)
- **Bom:** o editor de valor mostra o histórico na hora de decidir; a classificação Fixed/Flexible/Non-Monthly é simples de explicar.
- **Fraco:** "Left to budget -$91,038" em vermelho gritante num orçamento de teste; um orçamento único para a casa (nenhuma tela de limite por pessoa).

### Contas, cartão de crédito e faturas
- **Accounts (web)**: patrimônio com gráfico e seletor "Net worth performance" + período, "Refresh all", "+ Add account"; grupos por tipo com saldo e "20 hours ago"; Summary com Assets/Liabilities (Totals/Percent) e "Download CSV". Passar o mouse num ícone mostra **o status da conexão: Balances Healthy, Transactions Healthy, "Report an issue"**. [contas](https://mobbin.com/screens/de8d26b4-e456-4cfa-bd52-99ff96e94174), [status](https://mobbin.com/screens/d923ff26-de65-4aee-8362-60b653d76060)
- Página da conta: saldo atual com variação, gráfico, transações com "Edit multiple" e "Add transaction", Summary (tipo, última atualização, criada em), cartão "Closed Account". [conta](https://mobbin.com/screens/e448a8b6-c017-4587-90d5-37846c7e13fd)
- **Fatura do cartão** só aparece como "Credit cards — Set up bill sync" no Recurring e numa tela de **Spinwheel** ("statement balances and due dates with information from your credit report"). Não vi fatura, ciclo, parcelas nem estorno. [Spinwheel](https://mobbin.com/screens/c82fcf42-9912-4dd8-9dd5-daa05ae1986e)
- iOS: Accounts com abas Net Worth/Cash, períodos 1M…ALL, "+ Add an account" tracejado. [contas iOS](https://mobbin.com/screens/c62dd697-6693-4a63-8151-d5b562472a80)
- Limpeza de histórico (iOS): "Delete transaction history" com data de corte e caixas para sincronizadas, manuais e CSV; alerta nativo "cannot be undone". [apagar histórico](https://mobbin.com/screens/f7cdf078-c80b-4070-b69e-7b78ae6d6f9d)

### Recorrentes e assinaturas
- **Web**: Monthly (mês com ← →, Today, List/Calendar) com três colunas no topo — Income, Expenses (barra "paid / remaining") e Credit cards — e a tabela por status (Complete), com data relativa "(18 days ago)", conta, categoria e valor com ✓. "All recurring" agrupa por Active com "Next Due Date (13 days)". [mensal](https://mobbin.com/screens/ff4c128e-98e3-4b4c-ab68-837b99b892bb), [todos](https://mobbin.com/screens/e3c14697-eade-48b3-a93d-020bb950ae3a)
- Faixa laranja "There is 1 new recurring merchant… Review now"; o recorrente é uma propriedade do **comerciante** (Mark this merchant as recurring, frequência, tipo, data inicial, valor, status Active/Canceled: "cancelado mostra o passado, não prevê o futuro"). [editar](https://mobbin.com/screens/efddcf51-2aba-4733-8cea-ccacb0b659c7)
- **iOS**: Upcoming / All recurring, calendário do mês com ponto no dia, Income com barra, "Add recurring expenses", "Set up bill sync"; tocar no dia abre a folha com os itens. [recorrentes iOS](https://mobbin.com/screens/c768c818-330e-4598-bd2e-fe2af92f48e4), [dia](https://mobbin.com/screens/f4033636-5d77-4b6d-95af-90817a3cd8a5)
- **Bom:** detecção vira uma fila "Review now"; o status "Canceled" com explicação.
- **Fraco:** não cancela nada; cartão é só "set up bill sync".

### Metas, patrimônio, relatórios e gráficos
- **Metas**: escolha por grade de fotos com contador +/- ("Emergency Fund", "Down Payment", "Wedding"…), nome e imagem editáveis, atribuir contas a cada meta, prioridade #1, #2. Página da meta: capa com foto, valor, "Saved 1309% of $10,000", Contributions por mês, Balances, Details; "Assign your accounts" com "Always use the entire account balance". [escolher metas](https://mobbin.com/screens/efca7f5f-187f-4071-a6ce-d42e97660245), [atribuir contas](https://mobbin.com/screens/cfd15ae4-5296-45cc-b781-835f83bce1eb), [arquivar](https://mobbin.com/screens/e31717ce-d1ae-4515-8aa6-5a42f9440f74)
- **Cash Flow (web)**: barras por mês com linha, Monthly/Quarterly/Yearly, quatro KPIs (Income, Expenses, Total savings, Savings rate), quebras por Category/Group/Merchant, botão Share. [fluxo de caixa](https://mobbin.com/screens/fac1b9db-7ef3-48ae-b58f-aa46aee85625)
- **Reports**: **Sankey** de renda → gastos por categoria, rosca de renda por comerciante, transações e Summary com "Download CSV", relatórios "Saved". **Compartilhar gráfico como imagem** com "Hide amounts" e "Transparent background", rodapé "Powered by Monarch". [Sankey](https://mobbin.com/screens/dac45a11-e8d3-4c48-8e3d-5a2e05f74951), [compartilhar](https://mobbin.com/screens/cf276734-811b-402d-b17a-dcdf74bf6e75), [imagem](https://mobbin.com/screens/def61ac9-d7e6-4844-8e70-56b0a00ae9d2)
- Comerciante: barras por mês com divisória de ano, transações e Summary (total, média, maior). [comerciante](https://mobbin.com/screens/dabe2c23-abd5-4952-9212-e79adbec362e)
- **Bom:** o compartilhamento com "ocultar valores" é marketing orgânico seguro; o Sankey resume o mês num olhar.
- **Fraco:** estado vazio do Sankey ainda desenha as faixas cinzas.

### Compartilhar com parceiro/família
- **Members (web)**: três blocos — Invitations (e-mail, "Invited March 20, 2025 · Sent!/Resend Invite", ×), **Household Members** ("Use this for family members, partners, or someone else you manage your household with… their own username/password"; o dono aparece como **"Family Manager"**) e **Financial Professionals** ("Access will expire after 60 days"). [membros](https://mobbin.com/screens/b38d5b78-cc18-4260-951c-d21e69adc40b)
- Convite: modal só com e-mail e um aviso amarelo **"IMPORTANT: Members you invite will have full access to your household's data. You should only invite people you fully trust."** Sucesso: "We'll notify you when they accept". [convite](https://mobbin.com/screens/8d2fbc64-8041-48e7-ba16-47ce3aba63a2), [enviado](https://mobbin.com/screens/ec0f7f47-ef58-4026-b1e6-e2d02f32b525)
- Erro quando o convidado já usa Monarch: **"They'll have to delete their existing household before they can join yours."** [erro](https://mobbin.com/screens/145907be-f4b2-4083-ad92-5ece9eba18b6)
- **iOS**: Members com o texto "Invite trusted members to your household for free. They'll have full access to view and modify your household's data." Menu ⋯ "Add member / Add an advisor"; convite de consultor que, se o e-mail não tem conta profissional, gera um **e-mail pronto** convidando para o programa. [membros iOS](https://mobbin.com/screens/d5843b49-1808-4374-b23e-2dc66491dd32), [convite iOS](https://mobbin.com/screens/c2bb5ff5-add5-488c-9079-2f6379f4eaa2), [consultor não encontrado](https://mobbin.com/screens/4f7dcf9e-fa6d-4558-a71f-ae1198c0e91f)
- Onde o parceiro aparece no uso diário: só em **"Needs review by"** (Anyone ou uma pessoa), no detalhe e no filtro do widget de transações. [detalhe](https://mobbin.com/screens/e75d351a-b5cc-42e5-a134-79688e30f988)
- **Bom:** o aviso de acesso total é claro; o papel de consultor com prazo de 60 dias.
- **Fraco:** um papel só para a família (acesso total); nenhum papel limitado, nenhuma tela de "quem pagou" ou acerto; o convidado com conta própria precisa apagar a casa dele.

### IA, chat e insights
- O único chat visto é o **Support Chat** da web: painel flutuante azul, "Our AI support agent is trained on our entire Help Center… or get support from a human", 👍/👎 e copiar; fechar pede confirmação. [chat de suporte](https://mobbin.com/screens/d1d2876d-593c-44b2-a521-1b0cb2e3a701)
- **Advice (web)**: biblioteca de tarefas por categoria (Save up, Spend, Pay down, Protect, Invest, Wellness), "Prioritized by you" e "Essential advice", cada item com "NOT STARTED · 8 TASKS TO COMPLETE"; widget no painel. Não é IA, é conteúdo guiado. [advice](https://mobbin.com/screens/d3ba7a3d-dd99-4f32-b0d9-8be47ef01c79), [save up](https://mobbin.com/screens/db3fb7cb-ef0b-43d2-8ef3-e98b5494a626)
- AI Assistant, faísca nos widgets e Weekly Recap: **não estão no Mobbin**.

### Configurações e regras
- **Preferences**: "Mark new transactions as Needs Review", "Mark uncategorized… as Needs Review", "Allow edits to pending transactions" com aviso de que a edição pode se perder; seção **Monarch Labs** com interruptor BETA. [preferências](https://mobbin.com/screens/de463158-cd7c-4587-a510-6c95c90334f1)
- **New rule**: duas colunas "If transaction matches criteria…" (Merchants, Amount, Categories, Accounts) e "Then apply these updates…" (Rename merchant, Update category, Add tags, Hide, Review status, Link to goal, ou Split transaction); aba **"Preview changes (0)"**. [regra](https://mobbin.com/screens/f9c4c392-960b-40ae-bb0a-c42f66322216)
- Household General: nome da casa e endereço. [household](https://mobbin.com/screens/60830754-8016-4063-8e02-1fe59aca7f13)
- Reativar assinatura em modal com Annual/Monthly, promo e "Due today $0.00". [reativar](https://mobbin.com/screens/df8ad161-1592-4458-9426-b8e4cdd0fb80)

## Fluxos

1. **Onboarding iOS (jul/2025, 18 telas)** — splash → e-mail → "Verify your email" (Step 2 of 6) → … → "What brings you to Monarch?" (Step 4) → "Tell us about yourself" com "Do you manage your finances with a partner?" (Step 6) → paywall com linha do tempo → painel com coach mark "Add account". [fluxo](https://mobbin.com/flows/337e1f92-cc63-4c7f-8516-4b462dbb891c)
2. **Onboarding web (17 telas)** — home de marketing ("The modern way to manage money", selos WSJ/Forbes/Motley Fool "Best App for Couples") → cadastro → código → senha com checklist → origem → objetivos → paywall "How your free trial works" → checkout. [fluxo](https://mobbin.com/flows/c572ee18-b1b9-4ad0-b300-ec215b906bf1); versão 2023 com 30 telas até o coach mark de conectar banco: [fluxo antigo](https://mobbin.com/flows/894ae6f5-7771-496d-9933-73f653265884)
3. **Configurar orçamento (web)** — baldes Fixed/Non-Monthly/Flexible → tabela de não mensais → revisar fixos pré-preenchidos → página Budget. Telas: [1](https://mobbin.com/screens/f9b6a221-a541-4148-afaa-5ab1e69a385f), [2](https://mobbin.com/screens/efa45f08-1408-4e1d-9e90-7e023abcd499), [3](https://mobbin.com/screens/e796d1bc-7564-4580-9923-2ec925002991)
4. **Metas (web)** — grade de fotos com contador → nomear/trocar foto → atribuir contas por meta → página da meta. [1](https://mobbin.com/screens/efca7f5f-187f-4071-a6ce-d42e97660245), [2](https://mobbin.com/screens/edae4f97-6817-4513-9926-c4cd2397700e), [3](https://mobbin.com/screens/dc747c1c-43d2-420c-94ca-9cf83b6e84f3)
5. **Adicionar transação (iOS)** — Transactions → + → folha com valor grande e novo saldo → Select category (lista agrupada com busca) → volta à lista. [fluxo](https://mobbin.com/flows/dea78d5a-79fd-4668-9fc1-27e1351f3139); versão 2024: [fluxo](https://mobbin.com/flows/5312847c-b441-494b-bd69-dcc323be3973)
6. **Dividir transação (iOS)** — detalhe → Split → "Add split" (valor, "$300 left to split", categoria, tags, meta, Needs Review, Hide) → "This transaction has been split" + toast oferecendo criar regra. [fluxo](https://mobbin.com/flows/0a0f283a-5b8a-49c1-a107-774992a44de9)
7. **Convidar parceiro (web)** — Settings › Members → "Add Household Member" → modal com aviso de acesso total → Send Invite → "Invite sent… We'll notify you" → linha em Invitations com "Resend Invite". Erro se a pessoa já tem conta. [1](https://mobbin.com/screens/8d2fbc64-8041-48e7-ba16-47ce3aba63a2), [2](https://mobbin.com/screens/ec0f7f47-ef58-4026-b1e6-e2d02f32b525), [3](https://mobbin.com/screens/aee31ddb-8fec-4386-9924-f6855ba0b9a0), [erro](https://mobbin.com/screens/145907be-f4b2-4083-ad92-5ece9eba18b6)
8. **Convidar parceiro (iOS)** — menu lateral › Members → ⋯ "Add member" → folha com e-mail e aviso → lista com o pendente e ×. [1](https://mobbin.com/screens/256af184-3226-4cf4-b615-0dfbb42da214), [2](https://mobbin.com/screens/c2bb5ff5-add5-488c-9079-2f6379f4eaa2), [3](https://mobbin.com/screens/d5843b49-1808-4374-b23e-2dc66491dd32)

## Diferença iOS × web

- **Web é a casa do trabalho pesado**: edição em massa, regras com prévia, Sankey e relatórios salvos, Advice, checkout, configuração de orçamento em tela cheia. Não vi nada disso no iOS.
- **iOS é leitura e lançamento rápido**: tab bar de 5 personalizável, o resto num menu lateral; folhas no lugar de modais; valor grande com novo saldo; calendário de recorrentes como vista principal.
- A mesma página da web vira **coluna de cartões** no iOS (painel, orçamento), e a coluna "Summary" da direita desce para o fim da página (conta, categoria).
- O detalhe da transação é **folha lateral com setas ↑↓** na web e **página de linhas** no iOS.
- O convite de membro é idêntico nos dois, só com texto diferente; o de consultor no iOS gera um e-mail pronto.
- Dark mode: vi a lista de transações escura no iOS; na web todas as telas eram claras.

## Para nós

**Copiar**
- **"Needs review by <pessoa>"** como fila com dono, no painel e no detalhe; e o estado vazio "Você revisou tudo!". Liga direto com a nossa família com papéis e com "a conferir" da fatura. **julgamento**
- **Novo saldo ao digitar** o valor do lançamento (iOS). No nosso caso, "limite do cartão depois desta compra" ou "quanto ainda dá para gastar depois desta". **julgamento**
- **Toast que oferece virar regra** depois de uma ação manual (dividir, recategorizar) e a **prévia da regra** antes de salvar.
- **Editor de valor de orçamento com o histórico** ao lado (6 meses, mês passado, média) e "aplicar aos próximos meses".
- **Status da conexão por conta** (Healthy / Report an issue) — para nós, o equivalente é o estado da importação de fatura ou do canal de captura.
- **Compartilhar gráfico como imagem com "ocultar valores"** — crescimento orgânico sem expor dado.
- **Setas ↑↓ no detalhe** para revisar em sequência sem fechar a folha.
- Pergunta "gerencia com parceiro?" no cadastro — mas, ao contrário deles, **levar logo ao convite**. **julgamento**

**Evitar**
- Cartão de crédito antes de ver valor, e o paywall que empurra para a web com desconto. Nosso teste sem cartão é o contraste. **julgamento**
- O aviso "acesso total, só convide quem confia muito" como única proteção: é a confissão de que não há papéis. Nossa tela de convite deve mostrar o papel e o que ele vê.
- "Apague a sua casa para entrar na minha": converter quem já usa o app em convidado precisa de caminho que não destrói dado.
- Vermelho grande em orçamento novo ("Left to budget -$91,038"), que assusta no primeiro dia.
- Sete campos no lançamento manual.

**Onde ganhamos (pelas telas)**
- **Família com papéis**: no Mobbin só existe "Family Manager", membro com acesso total e consultor. Nenhuma tela de quem pagou, acerto, limite por pessoa ou filho com visão restrita.
- **Fatura que bate**: o cartão de crédito deles se resume a "Set up bill sync" e à Spinwheel; não há tela de fatura, parcelas, estorno nem conferência de PDF.
- **Captura sem banco**: o lançamento manual é um formulário; nenhum fluxo de mensagem, voz ou foto aparece no Mobbin. O painel vazio inteiro gira em torno de "Add account / Link account".
- **IA**: o que aparece é chat de suporte e uma biblioteca de conselhos; a IA de produto deles não está documentada em telas aqui, então não dá para comparar a UX.

## Arquivos baixados

Pasta: `monarch/` (todos conferidos com `file`: WebP; iOS 1179×2676)

| Arquivo | Mobbin |
|---|---|
| `web-painel.webp` | https://mobbin.com/screens/e3960e40-e978-48dc-8b90-8c91e83d7507 |
| `web-transacoes.webp` | https://mobbin.com/screens/6d7710b7-7222-45d8-a3a9-550a8bae1516 |
| `web-detalhe-transacao.webp` | https://mobbin.com/screens/e75d351a-b5cc-42e5-a134-79688e30f988 |
| `web-dividir-transacao.webp` | https://mobbin.com/screens/ff1a7429-0914-4273-8fb7-10eaffe17f11 |
| `web-orcamento.webp` | https://mobbin.com/screens/fe7beadd-310d-4122-b68f-6a135a217001 |
| `web-recorrente-editar.webp` | https://mobbin.com/screens/efddcf51-2aba-4733-8cea-ccacb0b659c7 |
| `web-convite-membro.webp` | https://mobbin.com/screens/8d2fbc64-8041-48e7-ba16-47ce3aba63a2 |
| `web-membros.webp` | https://mobbin.com/screens/b38d5b78-cc18-4260-951c-d21e69adc40b |
| `web-checkout.webp` | https://mobbin.com/screens/e9fae71f-d8d5-45d8-9729-6de388dd74cb |
| `web-relatorio-sankey.webp` | https://mobbin.com/screens/dac45a11-e8d3-4c48-8e3d-5a2e05f74951 |
| `web-contas-status.webp` | https://mobbin.com/screens/d923ff26-de65-4aee-8362-60b653d76060 |
| `web-regra-nova.webp` | https://mobbin.com/screens/f9c4c392-960b-40ae-bb0a-c42f66322216 |
| `ios-painel.webp` | https://mobbin.com/screens/eb1eb354-7583-4a0b-92e3-f4f5609f719a |
| `ios-orcamento.webp` | https://mobbin.com/screens/e6be801e-6f5f-4cc4-9dd1-4548b271566a |
| `ios-nova-transacao.webp` | https://mobbin.com/screens/d8c96d3b-5680-44a4-b11a-b54c5066571c |
| `ios-paywall.webp` | https://mobbin.com/screens/f4f97ca0-8e85-4609-8f21-c5c9902171d4 |
| `ios-convite-membro.webp` | https://mobbin.com/screens/c2bb5ff5-add5-488c-9079-2f6379f4eaa2 |
| `ios-recorrentes.webp` | https://mobbin.com/screens/c768c818-330e-4598-bd2e-fe2af92f48e4 |
| `ios-menu-lateral.webp` | https://mobbin.com/screens/f5acd802-5ab8-49ca-85d0-d9799aa450c4 |
