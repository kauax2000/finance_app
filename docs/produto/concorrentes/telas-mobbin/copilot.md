# Copilot Money — telas no Mobbin

Estudo de 28/10/2026, só por leitura no Mobbin (nada salvo lá). Complementa o dossiê de produto `docs/produto/concorrentes/eua/2026-10-26-copilot-money.md`; aqui fica só a camada de telas e UX.

## Cobertura

- **iOS: sim.** Aparece como "Copilot" e "Copilot Money" (duas capturas em épocas diferentes: uma de 2024, com fluxo de importar do Mint, e uma de ago/2026). Cerca de 65 telas vistas, entre telas soltas e 5 fluxos (2 de onboarding, adicionar conta, definir orçamentos, adicionar transação/transferência).
- **Web: sim** (app.copilot.money). Cerca de 30 telas vistas: painel, transações, contas, investimentos, categorias, recorrentes, configurações, cadastro e teste grátis.
- **Mac/iPad nativo:** não encontrado como app separado no Mobbin (Mobbin só tem iOS e web).
- **Não encontrado em nenhuma plataforma (3 buscas cada):** compartilhar com parceiro/família, assistente de IA em conversa ("Money Assistant"), tela de paywall própria no iOS (só a folha da App Store), fatura de cartão com ciclo. A busca por "invite partner" na web devolveu outro app também chamado "Copilot" (portal B2B com "Team" e "Client Access", logo verde) — descartado.

## Navegação e arquitetura de informação

### iOS
- **Sem tab bar.** O topo é uma faixa azul com o nome "Copilot", engrenagem (configurações) à esquerda e balão (suporte) à direita. Abaixo, **pílulas horizontais roláveis** com as seções: Dashboard, Cash flow, Accounts, Investments, Transactions, Categories, Recurrings, Goals ([painel escuro](https://mobbin.com/screens/e45e34c5-26c1-4e20-99de-731530b71704), [transações](https://mobbin.com/screens/e0f620ec-6c04-4d3d-b57f-b108bd34de72)).
- A ordem das seções é da pessoa: Configurações › Appearance › "App sections: Rearrange" ([configurações](https://mobbin.com/screens/de8d202b-63e1-49cc-a941-7e0be3bd51c5)).
- Ações flutuantes no pé, à direita: "+" sozinho em Transações; engrenagem + "+" em Contas/Investimentos; varinha + "+" em Categorias ([categorias](https://mobbin.com/screens/f1778c3a-ee4e-4bd7-960b-52db273f15d2)).
- Em Cash flow, o seletor de período (4W · 3M · 1Y · MTD · YTD) é uma pílula flutuante no pé, com a engrenagem ao lado ([fluxo de caixa](https://mobbin.com/screens/e7591103-070b-45f3-bd00-f73be234e5fc)).
- **Todo detalhe abre em folha** (sheet com alça) por cima da seção: transação, categoria, recorrente, meta, ajustes de gráfico.

### Web
- **Barra lateral fixa** com: Dashboard, Transactions, Accounts, Investments, Categories, Recurrings. Abaixo, **as contas agrupadas por tipo** (Depository, Investment, Loan, Other), cada uma com ponto colorido e saldo. No pé: Explore (ou "Start here" no início), Get Help, Settings ([transações web](https://mobbin.com/screens/fd8c7d1d-72cb-4c60-90a5-cd4fd1e5c58c)).
- **Três colunas**: barra lateral · lista · painel de detalhe à direita, que fica aberto enquanto se navega na lista ([categorias web](https://mobbin.com/screens/f9852ce6-2bba-46cc-a8c5-4f7ca8317074), [recorrentes web](https://mobbin.com/screens/e07ab595-3099-4aa5-8ff4-b1c133b257b4)). Sem nada selecionado, o painel mostra "Select to view details" ([investimentos vazio](https://mobbin.com/screens/f8d7b1dc-9ba3-4d61-b4f2-3dd03820b36d)).
- Configurações num **modal com abas laterais**: General, Connections, Account, Subscription, About ([conta](https://mobbin.com/screens/d05050cc-0059-45d8-b0ee-19c21d5873d4)).
- Metas (Goals) e Cash flow **não aparecem** na barra lateral web vista.

## Telas por área

### Onboarding, cadastro e paywall
- **iOS, boas-vindas:** ilustração isométrica de cidade com logos de bancos e marcas; "Let's Do Money Better"; "Sign up with Apple" e "Sign up with your email"; atalho **"Demo Mode ▸"** no canto; na versão 2024, selo "Coming from Mint? Learn More" (fluxo [Onboarding 23 telas](https://mobbin.com/flows/92d7d390-97fc-485a-8fab-d9cf1acbd632), [Onboarding 27 telas](https://mobbin.com/flows/bec90a3f-1c1b-490a-b27d-8445cc6e62a7)).
- **"Choose a starting point":** Start fresh (recomendado) ou Import Mint Data.
- **"Link bank accounts":** prévia do gráfico de patrimônio zerada ($0 assets / $0 debt), caixas tracejadas "Link a new account" por tipo (Credit cards, Depository…), e a saída **"Not ready to link yet? Try demo mode →"**. Depois, a folha do Plaid e o consentimento do banco ([Capital One](https://mobbin.com/screens/65c58c5b-5f78-4b0c-aeff-a2f9cee2e440)).
- **"Types of transactions":** ensina os três tipos (regular, receita, transferência) com exemplo de linha e o selo "Powered by Copilot Intelligence".
- **"Notification Preferences":** um cartão por tipo, com a notificação de exemplo em cima ("You just got paid — $2,145 from Business Inc.") e ON/OFF.
- **"Your finances — Let's make sure these numbers are correct"** ([revisão](https://mobbin.com/screens/e188690d-a9a1-4271-ab66-3966b9bc3b2e)): cartões empilhados — contas rastreadas, renda mensal, Subscriptions & Bills (previsto no mês), Housing, Investments (com chave), **Monthly Budget** sugerido por categoria (com chave para ligar) — cada um com "Review in detail →"; botão final "Tap to confirm"/"Complete onboarding". Antes, uma tela **"Remove duplicates"** pede para confirmar pares suspeitos ("Yes, these are probably duplicates") ([duplicatas](https://mobbin.com/screens/faf01723-8ac9-4f33-9399-f2164a430821)).
- **Paywall iOS:** só a folha nativa da App Store — "1-month free trial, $95.00 per year". Não vi tela de planos própria no iOS.
- **Web, cadastro:** tela mínima, nome + e-mail + aceite de termos, "Let's go!" ([cadastro](https://mobbin.com/screens/c8acf38e-d601-4ec6-ab0f-e2d2892896d0)).
- **Web, teste grátis** ([teste](https://mobbin.com/screens/6f2a2a69-d56a-44bf-a5a0-4dfcece8284d)): barra de passos no topo (Security › Accounts › Transactions › Subscription › Review); à esquerda "Start your free trial", plano "$95/year + 1 month free trial — Only $7.92/mo", forma de pagamento (Google Pay, cartão, "Pay with link"); à direita prova social (finalista Design Awards, Editor's Choice, "21,000 5-star reviews") e **linha do tempo do teste**: hoje começa · aviso 7 dias antes · cobra em um mês. No pé, **"Skip"** visível. Modal de cartão com abas Card / Bank ("$5 back") / Google Pay ([cartão](https://mobbin.com/screens/9595c1b3-d82b-44a2-b23b-2d7b9a5a7aec)).
- Bom: demo em três pontos de entrada; revisão final "esses números estão certos?" antes do painel; linha do tempo honesta do teste. Fraco: tudo gira em ligar banco; o teste pede forma de pagamento (o "Skip" existe, mas o que acontece depois não foi visto).

### Painel / home
- **iOS** ([painel escuro](https://mobbin.com/screens/e45e34c5-26c1-4e20-99de-731530b71704), [painel com orçamentos](https://mobbin.com/screens/c1bb5363-d727-4f41-a45b-56979b528927)): no topo, **"$577 left out of $2,927 budgeted"** com uma linha de gasto acumulado contra a reta do ritmo ideal e um selo "$99 under" / "$1,084 over" na ponta da linha. Depois: **TO REVIEW** (transações novas de hoje/ontem com chip de categoria e botão "MARK AS REVIEWED"), **BUDGETS** (anéis coloridos por categoria com emoji no centro e "$71.74 over / $1.52 left"), **UPCOMING** (recorrentes "in 8 days" com valor), **NET THIS MONTH** (barra receita × gasto × gasto excluído) e **GOALS** ("$560 saved in Aug — Above target $200").
- **Web** ([painel vazio](https://mobbin.com/screens/c23ab69a-41bf-423a-be8e-a94e24135341)): grade de cartões — Monthly spending ("$0 left"), Net worth (Assets/Debts com gráfico 1W…ALL), Transactions to review, Top categories, Next two weeks. Vazio honesto: **"30 transactions to unlock intelligence"** e "There are no upcoming payments".
- Bom: o painel responde "quanto ainda posso gastar" na primeira linha e coloca a revisão como tarefa diária. Fraco: anéis sem rótulo de nome dependem do emoji.

### Lista de transações e detalhe/edição
- **iOS lista** ([lista](https://mobbin.com/screens/e0f620ec-6c04-4d3d-b57f-b108bd34de72), [filtrada](https://mobbin.com/screens/e10c8e51-2f20-4e76-9768-c773c10a7a44)): agrupada por dia, linha = nome · chip de categoria (emoji + caixa alta colorida) · valor; receita em verde; **ponto azul** à direita marca "não revisada"; ícones "R" (recorrente), "T" (transferência), "I" (receita) antes do nome. Busca em pílula grande; filtro vira **chip dentro da busca** (o cartão do banco em miniatura, com ×); cabeçalho de mês com total ("May 2026 $130.66").
- **iOS detalhe** ([recorrente pendente](https://mobbin.com/screens/db951b8a-c61e-4fb6-b91b-ce3134c7fd0b)): folha centrada — data, nome grande, "PENDING $9.00", nota, recorrente vinculado, categoria, tags, **a imagem do cartão do banco**, e ações "Not recurring · Goal". Escolher recorrente abre folha com "Start a new one" ([folha](https://mobbin.com/screens/f03b4779-8f32-4945-b435-b1ca2cb31733)).
- **Web lista** ([escuro](https://mobbin.com/screens/fd8c7d1d-72cb-4c60-90a5-cd4fd1e5c58c), [divisão](https://mobbin.com/screens/5cdd8c30-c4d9-414a-9f26-9a87bda95830)): caixa de seleção por linha, nome + conta em cinza ("Savings 3567"), contador de tags, chip de categoria, valor. Painel direito: tipo ("Regular transaction ▾"), Category, Recurring (+), Tags, **Split "$75.00 split 2 ways"**, "Add a note…". Apagar uma parte de divisão avisa "This transaction is part of a split… Edit split instead" ([aviso](https://mobbin.com/screens/4712d95e-d956-40d7-8513-1cced2a006e3)).
- **Web filtros** ([menu](https://mobbin.com/screens/af445d77-66cf-4448-8cc5-3a1b57f035f4), [chips](https://mobbin.com/screens/e84d04ca-ca4d-4760-8bfb-7ab659b8a69e)): menu "Filter by" (Account, Category, Date, Recurring, Review status, Tag, Type) e "Sort by" (Date, Amount); os filtros viram chips removíveis ("This month ×", "+ Add filter") e aparece a barra de totais **Total spent · Total income · Net** do recorte.
- Bom: revisão como estado da transação (ponto + filtro "Review status"); totais do filtro; divisão com proteção. Fraco: descrição crua do banco ("Mobile Purchase 08-18 Target") continua sendo o nome.

### Adicionar transação manual
- **iOS** ([fluxo regular](https://mobbin.com/flows/a90d6aef-b871-4b5b-94b8-2e8797c90e5c), [transferência](https://mobbin.com/flows/69cf35a5-3637-428f-af71-4662d58ffb92), [outro](https://mobbin.com/flows/92822164-61f6-4c3b-b36f-f1d0650137ca)): "+" abre folha com segmentado **Regular · Income · Transfer**; data; "Transaction name" em fonte grande e "$0.00" logo abaixo; chip de categoria; **trilho horizontal de categorias** com "Type the category name or scroll" e um chip "EXCLUDE"; o cartão da conta (só contas manuais, "Cash — Manual account"); botão SAVE acima do teclado. Na versão 2024 havia "ADD A NEW TRANSACTION" tracejado no topo da lista.
- **Web** ([criar](https://mobbin.com/screens/f6eecc5b-88c9-4218-af70-3d809cdeafe5), [vazio](https://mobbin.com/screens/cc6c4b80-dd4f-4327-b050-08495f052573)): o "+" da lista abre o mesmo painel de detalhe em modo criação — Name / $0, Expense ▾, Category, Recurring, Tags, nota, botão "Create" no topo (desabilitado até ter nome e valor).
- Bom: uma tela, teclado já aberto, tipo em segmentado. Fraco: é fluxo secundário (só contas manuais); sem voz, foto, divisão ou parcela na criação.

### Categorias e orçamento
- **iOS lista** ([categorias](https://mobbin.com/screens/f1778c3a-ee4e-4bd7-960b-52db273f15d2), [demo](https://mobbin.com/screens/cee0bf4c-54a2-4ce8-8bba-4267b38eea12)): cartão com "$2,383 spent in Aug" · rosca · "$1,705 total budget"; tabela SPENT | barra | BUDGET por categoria, barra verde/amarela/laranja/vermelha conforme o ritmo; seção EXCLUDED no fim.
- **iOS detalhe** ([Other](https://mobbin.com/screens/e6fe4340-7a37-48d0-bf3a-47638a72bf31), [Rent](https://mobbin.com/screens/f24d64b0-69a8-44f4-9a70-256433e36af9)): emoji, nome, "SPENT $1,309.40 · $1,159 over"; barras de 12 meses com a **linha do orçamento** e etiqueta do valor; Key metrics (total no ano, média mensal); recorrentes da categoria; transações do mês. Agrupar categorias em "Groups of budgets".
- **Nova categoria** ([nova](https://mobbin.com/screens/fdb1a20f-3747-410b-b374-a61c7cd31fac)): Regular/Excluded, emoji, nome e orçamento grandes; **faixa de cores** em que a cor escolhida tinge o botão e o teclado inteiro.
- **Gasto mensal** ([com rollover](https://mobbin.com/screens/da918ea9-125e-4db9-b9da-b037affb92d0), [sem](https://mobbin.com/screens/ea210059-6422-4022-a25c-55063fb025b3)): SPENT + ROLLOVER "from Jul", gráfico em degraus, e por categoria SPENT / BUDGET / UNDER-OVER.
- **Web** ([categorias](https://mobbin.com/screens/f9852ce6-2bba-46cc-a8c5-4f7ca8317074)): mesma tabela; painel à direita com "Budget for all months ▾", gráfico de barras com linha do orçamento, transações do mês, "Save budget".
- Bom: a linha do orçamento sobre o histórico mostra tendência sem texto. Fraco: muito vermelho cheio quando quase tudo estoura; a varinha na barra de ação não diz o que faz.

### Contas, cartões e faturas
- **iOS Contas** ([patrimônio](https://mobbin.com/screens/d65fba1d-7472-4778-a353-9d35276cccab)): gráfico de patrimônio (ou Assets × Debt em duas linhas), seções Credit cards / Depository / Investments / Loans, cada conta como **imagem do cartão físico** com BALANCE/AVAILABLE e CHANGE. Ajustes: "Combine assets and debt", "Use a single line", contas incluídas.
- **Web Contas** ([contas](https://mobbin.com/screens/fcb4126b-4d10-4708-98ae-ddbf5ed80ba4)): lista por tipo com variação 1W e saldo; painel à direita com gráfico, alocação e posições; menu "…" com Hide account, Mark as closed, Delete account ([menu](https://mobbin.com/screens/ff5af71c-c937-448f-9e7d-f7e13567e38e)). Conta manual: cartão com cor escolhida numa grade de 16 cores ([manual](https://mobbin.com/screens/cc7e1775-15cf-4b15-87ac-866ccdc0e3e0)); seletor de instituição com busca em 10.000 ([seletor](https://mobbin.com/screens/c48e9af3-e018-463a-8d1a-d3eba48b186f)).
- **Fatura de cartão:** não vi. Cartão de crédito é só uma conta com saldo; sem ciclo, vencimento, parcelas ou fatura.

### Recorrentes e assinaturas
- **iOS** ([Playstation](https://mobbin.com/screens/ee83ed17-444a-4380-bfcb-792f3ca8dcd3), [Allianz](https://mobbin.com/screens/ef0e6179-820d-4935-9403-c5db0f44d123)): a regra é **uma frase editável**: "Transactions named [Playstation] from [$20] to [$30] on [any day of the month] every [month]" — cada parte sublinhada é um campo. Abaixo, "NEXT PAYMENT $25.00 Expected around Sep 19th", gráfico de pontos dos últimos meses com o próximo tracejado, transações vinculadas, barra "Rename · Edit transactions · Delete".
- **Confirmar frequência** ([folha](https://mobbin.com/screens/d30770a1-9c54-4388-b32a-9b414dd59021)): "It looks like the frequency of this recurring is Every 2 weeks" e a lista para corrigir. A grade de recorrentes atrás mostra cartões com nome, valor, dia e um tique.
- **Web** ([recorrentes](https://mobbin.com/screens/e07ab595-3099-4aa5-8ff4-b1c133b257b4)): "$0 left to pay · $1,714 paid so far" com anel; lista do mês com data, frequência, categoria, valor e tique de pago; painel com Rules em chips ("named Netflix Subscription", "from $15.00 to $25.00", "every month"); mudar a regra mostra toast **"Recurring transaction amount range changed — Undo / Recalculate all"**.
- Bom: a regra em frase é a melhor peça do app. Fraco: nada de cancelar/negociar; nome cru do banco.

### Metas, patrimônio, relatórios e gráficos
- **Cash flow iOS** ([gasto](https://mobbin.com/screens/e7591103-070b-45f3-bd00-f73be234e5fc), [4 semanas](https://mobbin.com/screens/dc42e867-73df-407d-9809-4b2d100ae922)): cartões Net income / Spend / Income, cada um com período, valor, **variação em chip** ("↗ 63.38%") e "vs $1,368.56 in Jul 1 – Jul 19" (mesmo trecho do mês anterior), barras empilhadas por categoria com a linha tracejada do período anterior; lista de categorias abaixo. Ajustes: "Show excluded spend", "Show comparison" ([ajustes](https://mobbin.com/screens/fa8e2406-88e7-43db-93bd-a24ca16886fe)).
- **Net income** ([folha](https://mobbin.com/screens/f3c595f2-2a78-44c9-beee-5707a3babf42)): "Monthly income minus spend", barras verdes/vermelhas de 18 meses, Key metrics e totais por mês.
- **Metas** ([meta](https://mobbin.com/screens/e95802f1-7270-4ad1-ba16-f5c1104592c8), [ajustes](https://mobbin.com/screens/ef987c95-b8ca-435d-b214-b55a8cee830d), [como acompanhar](https://mobbin.com/screens/f7195833-9923-4d7f-976a-cf0917701ec8)): "Dream Wedding — $19 to go", gráfico com projeção tracejada, dica com o ícone da IA "You need to save $10 per month", contribuições por conta, "Update progress" (Edit allocations / Add transactions). Criar: "Target date" ou "Monthly contribution". Ajustes: "Reactivate when funds dip", "Update budgets on spend", arquivar (com aviso) ou apagar.
- **Investimentos** (iOS e web): saldo/retorno com período, "top movers today" em cartões com mini-gráfico, contas, alocação; benchmark e "Live balance estimate".
- Bom: toda comparação diz contra o quê ("vs … in Jul 1 – Jul 19"). Fraco: densidade de números pequenos.

### Compartilhar com parceiro/família
- **Não encontrado** no iOS nem na web (busca padrão e profunda). Nenhuma tela de convite, membro ou "quem pagou".

### IA, chat e insights
- O balão do topo abre **suporte humano** estilo Intercom ([suporte](https://mobbin.com/screens/07a9cbee-d794-41b2-bccf-425f8a138a09)): "Hi … How can we help?", Messages, Help, "We'll be back online tomorrow", artigos, Changelog. Artigos explicam as métricas com avaliação 😞😐😃 ([artigo](https://mobbin.com/screens/d6cf494b-a753-40ab-926a-d86ca2123733)).
- A IA aparece **dentro** das telas, não em conversa: selo "Copilot Intelligence" na categorização (ícone de faísca no chip), a dica da meta, o "30 transactions to unlock intelligence" do painel web. O assistente de conversa citado no dossiê não está no Mobbin.

### Configurações
- **iOS** ([tema](https://mobbin.com/screens/de8d202b-63e1-49cc-a941-7e0be3bd51c5), [acessibilidade](https://mobbin.com/screens/e02e6dfd-3210-4217-9aa3-d0b76f1c12ab), [conta](https://mobbin.com/screens/d8279343-3093-4371-8d28-e06fa5711a24), [ícone](https://mobbin.com/screens/fd6fc5ed-f3e3-4d7d-b0fe-f27bc379c4ca)): Demo mode; Features (Budgeting liga/desliga, Tags); Connections; Appearance (rearranjar seções, Dark mode Automatic/On/Off, **ícone do app** com 7 opções); Rollovers (início, categorias); Accessibility ("Display transactions with + and -", **"Accessible colors — best for red-green color blindness"** com prévia); Restart the onboarding, Export your transactions, Log out of all devices, privacidade, apagar conta.
- **Web** ([conta](https://mobbin.com/screens/d05050cc-0059-45d8-b0ee-19c21d5873d4), [conexões](https://mobbin.com/screens/d73a7b58-2bcc-4e3f-bbb4-4aa22f356725)): e-mail com Copy, 2FA, Restart onboarding, **Export all transactions (CSV)**, Clear local cache, "We don't ever sell your financial data", Log out of all devices, Delete account; Connections com "+ New" e endereço de Bitcoin manual.

## Fluxos

1. **Onboarding iOS** ([23 telas](https://mobbin.com/flows/92d7d390-97fc-485a-8fab-d9cf1acbd632), [27 telas](https://mobbin.com/flows/bec90a3f-1c1b-490a-b27d-8445cc6e62a7)): boas-vindas (Apple/e-mail, Demo) → ponto de partida (zero ou Mint) → ligar contas (Plaid → banco) → tipos de transação → notificações → remover duplicatas → "Your finances" (renda, contas fixas, moradia, investimentos, orçamento sugerido) → App Store (1 mês grátis, $95/ano) → painel.
2. **Definir orçamentos iOS** ([fluxo](https://mobbin.com/flows/786e10d4-177c-4b47-97da-3247ae1b7948)): cartão Monthly Budget com orçamento sugerido por categoria → revisar → confirmar.
3. **Adicionar conta iOS** ([fluxo](https://mobbin.com/flows/489c99a0-ed60-4650-afc4-c30b0c319e31)): Contas → Add → Plaid → consentimento do banco → conta aparece com a imagem do cartão.
4. **Adicionar transação iOS** ([regular](https://mobbin.com/flows/a90d6aef-b871-4b5b-94b8-2e8797c90e5c), [transferência](https://mobbin.com/flows/69cf35a5-3637-428f-af71-4662d58ffb92)): "+" → folha com segmentado → nome, valor, categoria pelo trilho → conta manual → SAVE → linha no topo da lista ("I Cash", "T Transfer").
5. **Teste grátis web:** cadastro (nome, e-mail) → passos Security › Accounts › Transactions › Subscription › Review → plano anual + forma de pagamento (Google Pay, cartão, Link) → CEP → "Start your 1 month free trial" ([CEP](https://mobbin.com/screens/56d896cc-a51e-4c4e-ab7d-33aab62ac4f3)).
6. **Convite de parceiro:** não existe no Mobbin.

## Diferença iOS × web

- iOS: uma coluna, seções em pílulas no topo, detalhe em folha, ações flutuantes no pé, muita cor (topo azul, chips coloridos, imagem do cartão). Web: três colunas (barra lateral com contas e saldos · lista · detalhe fixo), cinza neutro, chips menores, modo escuro completo.
- A web ganha seleção em massa (caixas por linha), filtros em chips com totais do recorte, divisão de transação visível e Settings em modal. O iOS tem Cash flow e Goals como seções; na barra lateral web vista, não.
- O "+" faz a mesma coisa nos dois, mas no iOS abre folha com teclado e na web reaproveita o painel de detalhe em modo criação — **um formulário só para ver, editar e criar**.
- O paywall do iOS é a folha da Apple; o da web é uma página própria com prova social e linha do tempo do teste.

## Para nós

**Copiar**
- **Revisão como tarefa do dia**: ponto "não revisado" na linha, bloco TO REVIEW no painel com "Marcar como revisado", filtro "Status de revisão". Liga direto com a captura por mensagem/IA: o que a IA lançou entra para revisão. **julgamento**
- **Regra do recorrente em frase editável** ("Lançamentos chamados X, de R$ a R$, em qualquer dia do mês, todo mês") + "Desfazer / Recalcular todos" ao mudar a regra. Serve para assinaturas e contas a pagar.
- **"vs mesmo trecho do mês anterior"** em todo número de fluxo de caixa, com a linha tracejada do período anterior no gráfico.
- **Topo do painel = "quanto ainda dá" com a reta do ritmo ideal** e o selo "R$ 99 abaixo" na ponta. Já é o nosso "quanto ainda dá para gastar"; a forma deles é a referência.
- **Linha do orçamento sobre as barras de 12 meses** no detalhe da categoria.
- **Revisão final do onboarding** ("esses números estão certos?") com cartões de renda, contas fixas e orçamento sugerido, cada um com "Revisar".
- **Linha do tempo honesta do teste** (hoje · aviso 7 dias antes · cobrança) — casa com nossa cobrança honesta; nós sem cartão, eles com.
- **Painel único ver/editar/criar** na web, e totais do recorte (Gasto · Receita · Líquido) quando há filtro.
- Configuração de **cores acessíveis (daltonismo)** e "mostrar + e −".

**Evitar**
- Navegação em pílulas roláveis sem tab bar: no telefone, metade das seções fica fora da tela. **julgamento**
- Nome cru do banco como título da transação ("Mobile Purchase 08-18 Target").
- Mar de vermelho na lista de orçamentos quando quase tudo estoura; barra cheia vermelha não diz quanto passou.
- Anéis de orçamento só com emoji, sem nome.

**Onde ganhamos**
- **Família:** não há tela nenhuma de parceiro, membro, papel ou acerto. Nosso maior vazio deles.
- **Fatura do cartão:** cartão é saldo; sem ciclo, vencimento, parcelas, estorno ou conferência com o PDF.
- **Captura sem banco:** o manual é secundário (só contas manuais, sem voz/foto/mensagem); o produto pressupõe Plaid. O demo é o único caminho sem banco.
- **Cobrança:** pede forma de pagamento no teste; nós, grátis para sempre e teste sem cartão.
- **IA:** no Mobbin a IA é selo e dica; o chat é suporte humano. Nossa IA de lançamento é visível e central. **julgamento**

## Arquivos baixados

Pasta: `copilot/`

| Arquivo | Tela | Mobbin |
|---|---|---|
| ios-painel.webp | Painel escuro (gasto × mês, revisar, próximos) | https://mobbin.com/screens/e45e34c5-26c1-4e20-99de-731530b71704 |
| ios-painel-orcamentos.webp | Painel demo (anéis, líquido, metas) | https://mobbin.com/screens/c1bb5363-d727-4f41-a45b-56979b528927 |
| ios-fluxo-caixa.webp | Cash flow, gasto com comparação | https://mobbin.com/screens/e7591103-070b-45f3-bd00-f73be234e5fc |
| ios-transacoes.webp | Lista de transações | https://mobbin.com/screens/e0f620ec-6c04-4d3d-b57f-b108bd34de72 |
| ios-detalhe-transacao.webp | Detalhe (pendente, recorrente, cartão) | https://mobbin.com/screens/db951b8a-c61e-4fb6-b91b-ce3134c7fd0b |
| ios-adicionar.webp | Adicionar transação (Regular) | https://mobbin.com/flows/a90d6aef-b871-4b5b-94b8-2e8797c90e5c (tela 17db282f) |
| ios-categorias.webp | Categorias com orçamento | https://mobbin.com/screens/f1778c3a-ee4e-4bd7-960b-52db273f15d2 |
| ios-categoria-detalhe.webp | Detalhe da categoria | https://mobbin.com/screens/e6fe4340-7a37-48d0-bf3a-47638a72bf31 |
| ios-recorrente.webp | Recorrente com regra em frase | https://mobbin.com/screens/ee83ed17-444a-4380-bfcb-792f3ca8dcd3 |
| ios-meta.webp | Meta com projeção | https://mobbin.com/screens/e95802f1-7270-4ad1-ba16-f5c1104592c8 |
| ios-onboarding-revisao.webp | "Your finances" no onboarding | https://mobbin.com/screens/e188690d-a9a1-4271-ab66-3966b9bc3b2e |
| web-transacoes.webp | Transações web, escuro, com painel | https://mobbin.com/screens/fd8c7d1d-72cb-4c60-90a5-cd4fd1e5c58c |
| web-filtros.webp | Menu de filtros e chips | https://mobbin.com/screens/af445d77-66cf-4448-8cc5-3a1b57f035f4 |
| web-categorias.webp | Categorias web com painel | https://mobbin.com/screens/f9852ce6-2bba-46cc-a8c5-4f7ca8317074 |
| web-recorrentes.webp | Recorrentes web com toast | https://mobbin.com/screens/e07ab595-3099-4aa5-8ff4-b1c133b257b4 |
| web-paywall.webp | Teste grátis web | https://mobbin.com/screens/6f2a2a69-d56a-44bf-a5a0-4dfcece8284d |
