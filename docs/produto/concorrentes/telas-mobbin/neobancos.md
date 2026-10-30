# Neobancos no Mobbin: Revolut, Monzo, N26, Starling e Chime (28/10/2026)

Estudo de telas dos neobancos famosos, para tirar ideias que servem a um app de
finanças da família **que não é banco, não move dinheiro e não conecta banco**.
Complementa o [estudo de 28/10](../2026-10-28-estudo-telas-mobbin.md) e não repete
o que ele já achou (o "sobra" como número principal, a fila "a revisar", a regra
do recorrente em frase, o "deve" acusatório, Splitwise, KOHO, GoHenry etc.).

Método: buscas no Mobbin por app e por área (painel, análise, orçamento,
assinaturas, cofres, família, divisão, transação, recibo, busca, plano). As telas
foram olhadas uma a uma; nada aqui vem só do metadado.

## 1. Cobertura

| App | iOS | Web | Observação |
|---|---|---|---|
| Revolut | 24 telas vistas | 8 telas vistas | O web é magro: barra lateral Home/Hub, coluna central estreita e o detalhe do cartão numa folha à direita. Não há análise, orçamento nem família no web. |
| Monzo | 27 telas vistas | não está no Mobbin | A busca web devolve Mercury, Copilot e outros. |
| N26 | 15 telas vistas | não está no Mobbin | |
| Starling | 17 telas vistas | não está no Mobbin | |
| Chime | 13 telas vistas | não está no Mobbin | Só iOS; pouco sobre gasto. |
| Nubank | não está no Mobbin | não está no Mobbin | A busca "Nubank credit card bill installments" devolveu WHOOP, Neo, Klarna, Cash App. |

**O que não achei:**
- Monzo Flex por dentro: só o atalho "Move to Flex Credit Card" na transação.
- Monzo para filhos (Under 16s): a busca não trouxe tela.
- A tela de comparação de planos da Revolut (Premium/Metal/Ultra): só a tela "Premium" de quem já assina.
- Fatura de cartão de crédito com parcelas em qualquer um dos cinco.
- Notificação de transação (push) como tela.

## 2. Revolut

**Navegação (iOS):** tab bar com cinco abas (Home · Invest · Payments · Crypto ·
Lifestyle). No topo, avatar, busca em pílula e dois atalhos redondos (análise e
cartões). A home é um carrossel de contas que se passa para o lado, cada uma com
seu fundo, e embaixo vêm widgets com "+ Add widgets". O tema é escuro, com
folhas de baixo para toda decisão.

**Painel e análise**
- [Home com o widget "Spent this month"](https://mobbin.com/screens/f620dc24-0756-447d-8391-b6fff402e875): o widget mostra "$0 · On track", o gasto acumulado e o resto do mês em **tracejado** (a projeção).
- [Analytics](https://mobbin.com/screens/df7b1aab-511c-4959-9238-7ec8da733902): o seletor "Personal ▾" escolhe **de quem** é a análise, e "This month" escolhe o período. Há três cartões: Spent com "Average $10.49 per week", Income e Net cashflow com o selo "Negative". Embaixo, o Budget diz "$79 left to spend · On track".
- [Analytics vazio](https://mobbin.com/screens/be0705ab-b8e1-4012-a110-3d1b3f2fa28b): o vazio mantém a forma do painel com esqueletos e diz "Make your first payment".
- [Preferências do ciclo](https://mobbin.com/screens/f7c29cc4-c96d-4960-a303-bc5b3f60b4af) e [semana começa em](https://mobbin.com/screens/bfb453f8-e0a0-421f-8f7f-bdb62512be68): a pessoa escolhe a frequência e o dia em que o ciclo começa ("for example, on payday").
- [Definir orçamento](https://mobbin.com/screens/fd4141ce-52a5-4b6e-adcd-afce1d423675): o campo de valor vem com o histórico embaixo ("Last 30 days: $0"). **O teclado tem + − × ÷ =**, para a pessoa fazer a conta dentro do campo.

**Ajustar o que conta**
- [Ajustar para a análise](https://mobbin.com/screens/eab3bbe3-078b-4212-a0d8-5fa80a03876a): a pessoa muda o **valor que conta na análise** sem mudar a transação. "$0 excluded from analytics" fica sob o número, e há o interruptor "Exclude" e a categoria.
- [Excluir: só esta ou todas deste destinatário](https://mobbin.com/screens/c3448a23-4e97-49b2-83bd-05eed8dd6d02): uma folha com duas saídas, "All transactions to this recipient" e "Only this transaction".

**Transação**
- [Detalhe](https://mobbin.com/screens/ea30b847-be1c-4858-aaac-4f01cca1a9ea): status, comprovante para baixar, cartão, "Exclude from analytics", categoria, "Amount in analytics", **"Total received $39.88 · Number of transactions 3"** com o mesmo pagador, e a nota.
- [Lista](https://mobbin.com/screens/d0e343a8-5e97-4b70-b94a-64ea9109e7b8): agrupada por dia com o total do dia à direita; a recusada fica com o valor riscado e o motivo em uma linha.

**Assinaturas**
- [Marcar uma assinatura](https://mobbin.com/screens/f7d90e37-7632-411e-bfb9-8e555a852962): a pessoa busca nas próprias transações e escolhe a que se repete.
- [Assinatura adicionada](https://mobbin.com/screens/ed20f8bf-d544-4092-8ece-78f7410be9ef): a folha diz "1 subscription is considered inactive because the merchant didn't charge you on the expected date", com "Go to inactive".
- [Detalhe da assinatura](https://mobbin.com/screens/f4e3b120-5492-4171-97c6-be853b4b899d): frequência, "Started on", cartão, rótulo próprio e o histórico de cobranças. O "Block future payments" é coisa de banco.

**Família (<18)**
- [O pai vê a conta do filho no carrossel](https://mobbin.com/screens/c6ff440a-c7e0-4cae-b524-d2e50b746c68): "Alex · $0 · Available to spend", e o bloco Automations com **"Allowance · Paused"**.
- [Bolso do filho com meta](https://mobbin.com/screens/ce5b749f-117f-46ed-b573-35e9360056c3) ("Alex • Shopping", "Goal · Track progress") e [confirmar dados com o vínculo](https://mobbin.com/screens/da5f6287-1092-4112-8dd7-72bd5803dd48) ("Your relationship: Legal guardian").
- [Convite para o app do filho](https://mobbin.com/screens/fddb0602-70e3-4e69-b0d4-404098e341aa): "Set your kid up on <18 · Share the app".

**Dividir:** o [grupo "Party"](https://mobbin.com/screens/fd7d9e0a-16b8-4b5f-a6c0-31bc7c1c2a93) tem capa com foto e abas Details/Transactions, com "You are owed $6.74" e "Alex owes $3.36". A [conversa de pagamento](https://mobbin.com/screens/f7b049d6-b03c-4ef9-b703-9e5130e688f7) é um chat com Request/Send.

**Plano:** a tela [Premium](https://mobbin.com/screens/e12750f4-27ea-4fd5-8547-84c6e3f4aa3a) diz "Free trial • Next payment on 20 Mar 2025" logo abaixo do nome.

**O que é bom:** a pessoa decide o que conta na análise (valor, exclusão, escopo
de pessoa e ciclo) sem mexer no dado. O vazio guarda a forma do painel. O
teclado faz conta.

## 3. Monzo

**Navegação (iOS):** tab bar flutuante de vidro (Home · Trends · Extra ·
Payments · Help). A home empilha as contas como **cartões de carteira**
(Joint por trás, Personal na frente, até outro banco "See in Monzo for free").
Acima ficam os widgets de saldo ([Personal balance · Joint balance · Spent
this…](https://mobbin.com/screens/d8fad0d1-f10e-4aa6-860c-46fe35e23d77)). Depois
vêm Activity e Pots. A troca de conta é uma [folha](https://mobbin.com/screens/f783c73d-c6ab-4b2c-8335-8e6738917c55).

**Contas agendadas**
- [Calendário de pagamentos agendados](https://mobbin.com/screens/fc38868c-15e2-4acd-9a7f-df9a83ecbf9b): há dois cartões no topo, "£115.13 Total this month · 4 payments" e "£3.39 **Still to pay** · Next in 2 days". Embaixo vem o mês em grade, com o **logo do comerciante e o valor dentro do dia**. Tocar no dia abre a folha com a lista.

**Trends e meta de gasto (o melhor do estudo)**
- [Média mensal](https://mobbin.com/screens/e0ee1ad7-d20c-4667-89d4-0fc184537e39): "Your average monthly spending is £1,373". Mostra 12 barras com a linha da média e a faixa "varied between £181 and £3,212". Embaixo, o link **"Doesn't look right?"**.
- [Escolher a meta](https://mobbin.com/screens/adc853fa-7f79-453e-90c8-cf5418d5a741): três opções prontas, "Keep spend steady £1,373", "5% less £1,304 (+£69 saved)" e "10% less £1,236 (+£137 saved)", mais "Set a custom spending target".
- [O que a meta acompanha](https://mobbin.com/screens/fbd690ad-3e11-4290-b416-467da5a1e376): as contas, "4 excluded categories (Bills, Income, Savings…)" e **"Month resets: 31st or before"**.
- [Quais categorias acompanhar](https://mobbin.com/screens/c1faa5bb-53e2-48de-a0c9-f32b05f37a0a): cada categoria vem com **"£533 on average"** ao lado. [Excluir da meta](https://mobbin.com/screens/bda093f5-c183-4351-9156-0c81d537099e) vem com Bills e Expenses já marcadas.
- [Meta definida](https://mobbin.com/screens/da1002f2-1a0b-49f2-acef-69f838ae1b53): "You've already spent £639.33 so you've got £160.67 left to spend this month. Good luck!"
- [Categoria acima da meta](https://mobbin.com/screens/d9d5cc47-eb11-4ae3-b6a2-1c7db08c7d71): um gráfico de **queima**, em que a linha do disponível desce a cada compra até "−£242.22 Over target", contra a reta tracejada verde do ritmo. Embaixo, as compras agrupadas por dia.
- [Trends vazio](https://mobbin.com/screens/b83ab94b-72e7-4fbf-b98f-9bb998f5ee06): abas Balance/Spending/Target, Month/Year e "Get Trends set up your way".

**Transação (a mais completa dos cinco)**
- [Cabeçalho](https://mobbin.com/screens/3e158bc0-23e0-484d-9742-1064ad6c458b): a categoria com **"Customise and split into multiple categories"**.
- [Ações](https://mobbin.com/screens/f8901c1a-fc08-4218-8263-4cf9471cb998): "Split this bill", "Add to a Running Split (great for group holidays and houseshares)", "Move to Flex Credit Card", "Add notes and #tags" e **"Add receipt"**. Há ainda o interruptor **"Repeating payment — We'll show this for you in Scheduled Payments"**.
- [Com a divisão feita](https://mobbin.com/screens/dffd4e28-a08a-438c-b73a-c3ff6df582e5): o bloco "Bill splitting" mostra "You £10.37 · GT +£10.37 You requested" e o link **"Send payment reminder"**.

**Dividir**
- [Valores por pessoa com − / +](https://mobbin.com/screens/c6e308a3-8bff-48f8-b6e6-582d6d4008bd) e [escolher pessoas](https://mobbin.com/screens/ebd099d4-afa1-4f7c-9f10-9fec762ff5d1), com "Split with people outside Monzo".
- [Running Split](https://mobbin.com/screens/c4a5b521-8e1a-4a87-a219-4e72071f5564): "If they don't have Monzo they'll join as a **guest on the web browser**". Em [Netflix](https://mobbin.com/screens/c018c2cd-c757-4e60-8fa4-5d0a51578c11), a assinatura vira um split recorrente: "We'll let everyone who owes money know".

**Potes:** o [pote "Fun stuff"](https://mobbin.com/screens/b09bb34c-eda0-4301-a42a-ba13468f8a61) tem foto, atividade, agendamento e "Spending · Set budget". O [pote Holiday](https://mobbin.com/screens/f33fa122-7435-4f7c-827c-5f21c125f133) tem arredondamentos, ferramentas e "Archive this Pot".

**Plano (Extra)**
- [Extra em teste](https://mobbin.com/screens/da9f02af-72af-4af8-abd1-e06147f4872e): "6 days left". O cartão diz "It's completely free! … **we will not charge you at the end of the week**", com "Enjoying Extra? Get Extra". Embaixo, **"Most used"** mostra o uso real de cada recurso ("Connected banks · 1 account", "Virtual cards · 2 in use", "Custom categories · 4").
- [Assinante](https://mobbin.com/screens/d25c4df8-088b-4189-8064-a7d2624bae42): "Subscriber since 2026".
- [Bloqueados](https://mobbin.com/screens/c9537fee-8dde-4478-becb-edc9791fc92b) com cadeado e [tabela Free/Extra/Perks/Max](https://mobbin.com/screens/baf88068-f789-4371-be70-4a7848e4c999).
- [Confirmar](https://mobbin.com/screens/b47151c5-632a-4df1-999b-33454e0df831): "**Starting today** you'll pay **£3 a month** for Extra … you can **cancel anytime**", logo acima de "Confirm and pay".

**O que é bom:** a meta nasce do histórico da própria pessoa, com a opção de
contestar. O calendário mostra o mês de contas de um olhar. A transação junta
tudo o que se faz com ela. O teste mostra o uso e promete não cobrar.

## 4. N26

**Navegação (iOS):** tab bar com cinco abas (Home · Finances · Investments ·
Benefits · Cards). O visual é claro, verde-petróleo e com ilustrações. A home
traz o checklist "Get ready to bank your way · 1/5 completed" e o upsell
dentro da lista de transações ([home](https://mobbin.com/screens/b791d6af-f8fe-4ff8-b7a5-6af479493727)).

- [Insights](https://mobbin.com/screens/f3ff5760-c6fa-4536-8709-ca4899f77d10): o seletor de conta e Expenses/Balance. **"Recurring payments · 0 upcoming · €0.00 left to pay"** fica no topo da análise. "Highlights" mostra cada categoria com uma **seta ↑/↓** contra o mês anterior: "Spending more this month?".
- [Para que é o novo Space](https://mobbin.com/screens/e0e2b259-40f4-4c1a-9c6a-f43f8d2d76a8): "Organizing your money" ou "Group expenses — shared financial goals with friends and family, such as travel or birthdays".
- [Income Sorter](https://mobbin.com/screens/a159f496-541b-4456-b34f-cf5abcc70bf4): "For incomes above €400", reparte por Percentage/Fixed amount entre Spaces (Vacation 20%, Main 80%).
- [Detalhe da transação](https://mobbin.com/screens/41bcff70-1135-4d7f-b5ba-f486e590c20d): "Pay back from a Space", categoria, origem, tipo, referência, notas e **#tags**.
- [Busca por tag](https://mobbin.com/screens/b4dc5c95-c7b0-470c-add8-4ab24f73725b): chips das tags usadas e **o resultado já somado** ("2 Transactions · 8/3/25–9/4/25 · €40.00"). Há também um [filtro](https://mobbin.com/screens/f0ce6f8f-6cc1-4216-a3dc-dd609cfde981) por conta, datas, entrada/saída e valor.
- [Membership](https://mobbin.com/screens/69ad3b69-3692-4579-bf5d-5fc532e4774f): "Member since Aug 2025", **"Next billing date Sep 3, 2025" e "Next billed amount €16.90 every month"**, com "Modify membership".

**O que é bom:** o que ainda vai sair (recorrentes) aparece na própria
análise. A busca devolve a soma.

## 5. Starling

**Navegação (iOS):** tab bar com cinco abas (Payments · Spending · Home · Cards
· Spaces). A home fica no centro. O visual é claro, com acento ciano; os Spaces
têm foto.

- [Spending](https://mobbin.com/screens/e2f5c950-f479-4913-8a19-beae03aa21bc): no topo, o campo **"✦ Ask a question…"** (Spending Intelligence). Depois vêm a conta, o período livre ("1 Jul 2025 to 1 Jul 2026"), as barras e a quebra por **Categories · Merchants · Tags**.
- [Gasto acumulado](https://mobbin.com/screens/cf3be552-69da-435e-a79e-ef451d59ee1d): "£2.50 more than the previous period", com o período anterior tracejado. Há também o cartão "Focus your insights: filter out bills or rent".
- [Quebra com %](https://mobbin.com/screens/d4ff60a4-3aa0-49a3-b301-b0a57aa80d0f): "Transfers £200 · 2 transactions · 94%", e "Money received" separado.
- [Tracker de gasto](https://mobbin.com/screens/daaf571a-3653-4d72-9b58-977a1dd15a39): categoria, orçamento mensal e **"Tracking period 27 Jun to 26 Jul"**, um período que não é o mês civil.
- [Foto recusada](https://mobbin.com/screens/f0823879-4df9-4d5c-a742-b8808c16b4a3): "We couldn't use the photos because: ✕ We can't see all 4 corners", com "Try again".
- [Nota](https://mobbin.com/screens/f0c1bc7c-2eec-4c8b-b539-2990623e26ea): o rodapé lembra **de qual transação** é a nota ("Apple iTunes on 3 October 2025 at 7:06am for £11.99").
- [Under 16s](https://mobbin.com/screens/d7d83634-0bed-475c-9dad-d8bfc33b2b80): "You're in control · Help them learn · No fees".
- [Os dados do seu filho](https://mobbin.com/screens/ce83a157-05ad-4a14-82d9-6eab5acd9d68): "Explain to your child that **you'll be able to see their spending**", com o link "Child-friendly privacy policy".
- [Payments](https://mobbin.com/screens/cc83901f-6b3f-49b4-9884-2009d54ff439): "Request money — Send a Settle Up payment link to anyone who owes you money" e "Scam Intelligence — Analyse images".
- [Transações com Export](https://mobbin.com/screens/c4721fe8-ddd0-47c7-ba97-d9483e8de74f) no cabeçalho.

**O que é bom:** a pergunta em linguagem natural mora na tela de gasto. O
período do tracker é livre. A privacidade do filho é dita a ele.

## 6. Chime

**Navegação (iOS):** tab bar com cinco abas (Home · Move · Pay · Deals ·
Profile). A home tem um bloco escuro "Available $1.29", a poupança e a grade
**"Financial tools"**: Direct Deposit "Feb 25 · Last paid", Spending "$17.69 ·
Last month", Taxes "In progress" e FICO ([home](https://mobbin.com/screens/f49e2ec3-450a-43a5-acf3-ec4ab18280bd)).

- [Pagamento do cartão](https://mobbin.com/screens/087101ca-dc3f-465e-9b92-c2464f946b8d): "Current balance due $0.00". O estado vem em frase, "**You're all set!** No balance is due at this time", e há o atalho para o débito automático.
- [Gasto do mês](https://mobbin.com/screens/f35b6d1b-4808-4fc1-846d-4f2febe506d9) com 6 barras e Categories/Merchants. No [comerciante](https://mobbin.com/screens/14c40a87-2f04-4717-8654-e7cfb106164e), "1 Transactions · $1.00 Average spent".
- [Extratos por mês](https://mobbin.com/screens/242a9237-4c18-4a9b-8136-07d87efe4bbc), com abas Credit/Checking/Savings.
- O crédito ([score](https://mobbin.com/screens/99aa4c7c-4b04-4d73-9804-152654f478a1)) e o SpotMe ficam fora do nosso escopo.

**O que é bom:** a home é uma grade de "ferramentas" em que cada cartão tem um
número e um estado curto.

## 7. Aplicável ao nosso app (por impacto)

Os itens marcados **julgamento** são opinião deste estudo, não fato da tela.

1. **Meta de gasto que nasce do histórico, com três atalhos** (Monzo, média →
   escolher meta → o que acompanha). O app mostra "Você gasta em média R$ X por
   mês" com 12 barras e "Isto não parece certo?". Depois oferece "Manter",
   "5% a menos (+R$ Y no ano)", "10% a menos" e "Outro valor". Cada categoria
   vem com "R$ Z em média". *Diferencial: saber quanto ainda dá.* Aplicável:
   **sim**, porque só usa os nossos lançamentos. Esforço **M**. **Julgamento:**
   resolve o orçamento em branco do primeiro uso melhor que qualquer formulário.
2. **Calendário das contas e assinaturas do mês** (Monzo). Dois números no topo
   ("Total do mês" e "Ainda a pagar · próxima em 2 dias") e a grade com o logo
   e o valor dentro do dia. Na nossa versão, a **fatura do cartão entra como um
   evento no dia do vencimento**, e o fechamento aparece como marca. *Diferenciais:
   contas a pagar e fatura que bate.* Aplicável: **sim**. Esforço **M** (o
   `Calendar variant="agenda"` já existe no DS). **Julgamento:** é a tela que
   mais falta ao "avisar antes do problema".
3. **Ciclo que reinicia no dia do salário ou no fechamento** (Revolut "Starts
   on… on payday", Monzo "Month resets 31st or before", Starling "27 Jun to 26
   Jul"). A análise e o orçamento contam do dia que a pessoa escolhe, e o
   cartão pode contar do fechamento ao fechamento. *Diferenciais: quanto dá e
   fatura.* Aplicável: **adaptado**, porque precisamos de dois ciclos (o da casa
   e o de cada cartão). Esforço **M–G**, porque mexe em todas as somas.
   **Julgamento:** é a maior distância entre o mês civil dos apps gringos e o
   salário do dia 5 e a fatura do dia 10 do brasileiro.
4. **A transação como central de ações** (Monzo). No detalhe ficam "Dividir em
   várias categorias", "Dividir com…", "Adicionar comprovante", "Notas e
   #tags" e **"É recorrente → aparece em Contas a pagar"**. Some a isso o
   rodapé do Starling, que mostra de qual lançamento é a nota, e o "Total com
   este comerciante · N lançamentos" da Revolut. *Diferenciais: captura,
   assinaturas e família.* Aplicável: **sim**. Esforço **M**. O "dividir em
   categorias" é o que falta para a compra do mercado com farmácia junto.
5. **"Marcar como assinatura" a partir dos lançamentos, com o estado
   "inativa: não cobrou na data esperada"** (Revolut). Para nós, que não lemos o
   banco, o "não cobrou" vira **"não lançada na data esperada"**, com as saídas
   "Lançar agora", "Pular este mês" e "Cancelei". *Diferencial: assinaturas sem
   banco.* Aplicável: **adaptado**. Esforço **P–M**. **Julgamento:** a mesma
   regra pega a conta que a pessoa esqueceu de lançar.
6. **O teste que mostra o uso e promete não cobrar** (Monzo Extra). Mostra
   "Faltam 6 dias", "Não vamos cobrar nada ao fim do teste" e o bloco "O que você
   mais usou", com números reais ("38 lançamentos por frase", "2 faturas
   conferidas", "3 pessoas na casa"). Antes de pagar, a frase "A partir de hoje:
   12x de R$ 29,90 no cartão · cancele quando quiser", e depois "Próxima cobrança
   em … · R$ …" (N26 Membership). *Diferenciais: cobrança honesta e premium que
   se prova.* Aplicável: **sim**. Esforço **P–M**.
7. **Contar só uma parte do valor** (Revolut "Amount in analytics" e "Excluir:
   só esta / todas deste destinatário"). O valor que entra na análise pode ser
   menor que o lançado, como numa compra que o amigo reembolsou em parte. A
   exclusão pergunta se vale só para esta ou para todas do mesmo estabelecimento.
   *Diferenciais: família, acerto e fatura que bate*, porque a fatura soma o
   total e o orçamento soma a parte da casa. Aplicável: **sim**. Esforço **M**.
   O estudo anterior já trouxe o "excluir de" (Rocket/Simplifi); o novo aqui é o
   **valor parcial** e o **escopo da exclusão**.
8. **Privacidade do filho dita a ele** (Starling). No convite do
   filho-convidado vem a tela "Conte para o seu filho que você vai ver os gastos
   dele", com uma política em linguagem de criança. *Diferencial: família com
   papéis.* Aplicável: **sim**. Esforço **P**, porque é texto.
9. **A análise com o seletor "de quem"** (Revolut "Personal ▾", Monzo widgets
   "Pessoal · Conjunta"). Um seletor de escopo (Casa · Eu · Ana · Pedro) no topo
   da análise, e não uma página por pessoa. *Diferencial: família.* Aplicável:
   **adaptado**, porque precisa respeitar o "só o total do pessoal" entre
   adultos. Esforço **M**.
10. **Pergunta em linguagem natural dentro da tela de gasto** (Starling "Ask a
    question…"). É um campo no topo da análise, e não uma tela de chat à parte.
    *Diferencial: captura por frase e IA.* Aplicável: **sim**, porque já temos a
    frase no lançamento; o mesmo campo pode responder "quanto gastei com
    farmácia em setembro?". Esforço **M–G**, porque depende da IA.
11. **"Ainda a pagar" dentro da análise** (N26 "Recurring payments · upcoming ·
    left to pay"). No topo da análise do mês fica o que ainda vai sair (contas,
    assinaturas, parcelas e fatura aberta). *Diferencial: quanto ainda dá.*
    Aplicável: **sim**. Esforço **P**, se o item 2 existir.
12. **A busca devolve a soma** (N26). "2 lançamentos · 03/08–04/09 · R$ 40,00"
    aparece no topo do resultado de qualquer busca ou tag. Aplicável: **sim**.
    Esforço **P**. É ótimo para "quanto gastei com o Uber este ano?".
13. **Gráfico de queima da categoria** (Monzo). A linha do disponível desce a
    cada compra contra a reta do ritmo e termina em "−R$ 242 acima da meta".
    Aplicável: **sim**. Esforço **P–M** com o `Chart` atual. O estudo anterior
    já trouxe a linha do acumulado contra o ritmo (Copilot); aqui vale **para
    cada categoria**, e não só para o total.
14. **A fatura em frase de estado** (Chime "You're all set! No balance is due").
    O topo da fatura diz uma frase: "Tudo certo: a fatura de 10/nov está paga",
    "Faltam R$ 320 para cobrir", "Fechou ontem; confira com o PDF". *Diferencial:
    fatura que bate.* Aplicável: **sim**. Esforço **P**. Reforça a frase de
    estado do YNAB do estudo anterior, agora no cartão.
15. **Teclado de valor que faz conta** (Revolut, + − × ÷ = no campo). Lançar
    "45,90 + 12" direto no valor serve para a conta dividida e para a compra
    com dois itens. *Diferencial: lançar sem esforço.* Aplicável: **sim** no
    telefone. Esforço **P–M**: o `Input money` ganha a expressão, e isso pede ok
    do dono, porque é componente do DS.
16. **Foto recusada com o motivo** (Starling "We can't see all 4 corners").
    Quando a foto do comprovante falha, o app diz o porquê numa linha e oferece
    "Tentar de novo" ou "Lançar à mão". *Diferencial: captura por foto.*
    Aplicável: **sim**. Esforço **P**.
17. **Divisão recorrente, convidado sem conta e lembrete** (Monzo Running Split
    "guest on the web browser", Netflix como split, "Send payment reminder").
    A assinatura da casa dividida todo mês entra no acerto sozinha; quem não tem
    conta entra por link só de leitura; "Lembrar" gera o texto para o WhatsApp.
    *Diferencial: quem pagou e acerto.* Aplicável: **adaptado**, porque não
    cobramos nada, só lembramos. Esforço **M**. O "deve" do estudo anterior
    continua valendo: tom neutro.
18. **Mesada como automação visível** (Revolut "Automations · Allowance ·
    Paused"). Na página do filho aparece "Mesada · R$ 50 todo dia 5 · Pausada",
    que lança a entrada prevista sem mover dinheiro. *Diferencial: família.*
    Aplicável: **adaptado**. Esforço **P–M**.

## 8. Não aplicável

- **Mover dinheiro entre potes, Income Sorter, arredondamentos e Rules for
  Spaces** (Monzo, N26, Starling): o app não move dinheiro. A ideia útil (a
  reserva com propósito) já está nas carteiras de propósito; um "pote" nosso
  seria só uma meta de saldo, sem transferência.
- **Bloquear cobranças de assinatura e cartões virtuais** (Revolut "Block future
  payments"): exige ser o emissor do cartão.
- **Pagar ou pedir dinheiro por chat ou link** (Revolut chat, Starling Settle
  Up): exige mover dinheiro. Só o lembrete em texto se aproveita (item 17).
- **Monzo Flex e "Move to Flex"**: é crédito do banco. O que vale para nós é o
  inverso, mostrar o parcelamento que já existe na fatura.
- **Score de crédito, SpotMe e Deals** (Chime), **seguros e perks** (N26 Metal,
  Monzo Perks): é produto financeiro ou de parceiro, fora da promessa.
- **Investimentos, cripto e câmbio** (Revolut, N26): fora do escopo.
- **Scam Intelligence** (Starling): analisa anúncio antes de comprar, o que não
  é o nosso trabalho. A lição útil é a da foto com motivo (item 16).
- **Tabela de planos com quatro níveis** (Monzo Free/Extra/Perks/Max): temos um
  plano só. Copiar a tabela inventaria degraus que não existem.
- **Upsell dentro da lista de transações** (N26): briga com "premium
  transparente". **Julgamento:** não fazer.
- **Home em carrossel de contas com fundos fortes** (Revolut): para a família, a
  casa é uma só e o carrossel esconde o total. **Julgamento:** o seletor "de
  quem" (item 9) faz melhor.

## 9. Imagens baixadas

Em [`fintechs/`](fintechs/) (webp, conferidas com `file`):

| Arquivo | Tela |
|---|---|
| `revolut-ios-analytics.webp` | Analytics com escopo "Personal" e "left to spend" |
| `revolut-ios-excluir-da-analise.webp` | Excluir: só esta ou todas do destinatário |
| `revolut-ios-transacao-detalhe.webp` | Detalhe com "Amount in analytics" e total com o mesmo pagador |
| `revolut-ios-assinatura-detalhe.webp` | Assinatura inativa, frequência, início e histórico |
| `revolut-ios-filho-mesada.webp` | Conta do filho vista pelo pai, com a mesada pausada |
| `monzo-ios-calendario-agendados.webp` | Calendário de pagamentos com "Still to pay" |
| `monzo-ios-transacao-acoes.webp` | Ações da transação: dividir, recibo, tags, recorrente |
| `monzo-ios-categoria-meta-queima.webp` | Queima da categoria acima da meta |
| `monzo-ios-escolher-meta.webp` | Meta: manter, 5% ou 10% a menos |
| `monzo-ios-teste-extra.webp` | Teste com "não vamos cobrar" e o uso real |
| `monzo-ios-confirmar-cobranca.webp` | "Starting today you'll pay £3 a month, cancel anytime" |
| `n26-ios-insights-recorrentes.webp` | Insights com recorrentes a pagar e ↑↓ por categoria |
| `starling-ios-spending-pergunta.webp` | Spending com "Ask a question…" e quebra por tags |
| `starling-ios-dados-do-filho.webp` | Privacidade do filho explicada a ele |
| `chime-ios-fatura-em-dia.webp` | Pagamento do cartão: "You're all set!" |
