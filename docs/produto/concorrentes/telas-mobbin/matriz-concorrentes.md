# Matriz de experiência — Monarch, Copilot, YNAB, Rocket Money, Quicken Simplifi

Montada em 28/10/2026 a partir dos dossiês `docs/produto/concorrentes/telas-mobbin/{monarch,copilot,ynab,rocket,simplifi}.md`, de `padroes.md` e de 7 imagens conferidas à mão (painel iOS de Monarch, Copilot e YNAB; Spending do Rocket; Spending Plan iOS e painel web do Simplifi; transações web do Monarch). O Mobbin não foi consultado de novo.

**Convenções**
- **Sim / Parcial / Não / não visto.** "Não" quer dizer que o dossiê procurou e não achou, ou que a tela mostra que a função não existe. "não visto" quer dizer que não há evidência nenhuma nas telas, o que não prova que a função não exista. O Monarch AI Assistant e o assistente do Copilot, por exemplo, existem no produto mas não estão no Mobbin.
- O link de cada célula é a tela do Mobbin que prova a afirmação. Um "fluxo" é uma sequência de telas.
- **julgamento** marca opinião. O resto é observação.
- Os passos da seção 4 são **estimativas** de toques ou cliques, contados nas telas e nos fluxos. Ninguém cronometrou.
- Abreviações nas tabelas largas: **M** = Monarch, **C** = Copilot, **Y** = YNAB, **R** = Rocket Money, **S** = Simplifi.

---

## 1. Funcionalidades

| Função | Monarch | Copilot | YNAB | Rocket | Simplifi |
|---|---|---|---|---|---|
| Painel | Sim. Grade de widgets que dá para personalizar ([web](https://mobbin.com/screens/e3960e40-e978-48dc-8b90-8c91e83d7507)) | Sim. Abre com "$X left" ([iOS](https://mobbin.com/screens/e45e34c5-26c1-4e20-99de-731530b71704)) | Parcial. Não há painel: a home é o Plan ([plano](https://mobbin.com/screens/df907708-c21e-4fb4-970a-c747b1bb7a01)) | Sim. iOS com o que vai vencer; web com a curva do mês ([web](https://mobbin.com/screens/f075dbe0-f75d-4955-9fbb-bca17ef8bb3d)) | Sim. Cartões que dá para personalizar ([web](https://mobbin.com/screens/f4185e0b-854e-4b34-b478-848edd784844)) |
| Transações | Sim. Lista densa agrupada por dia ([web](https://mobbin.com/screens/6d7710b7-7222-45d8-a3a9-550a8bae1516)) | Sim. Ponto azul de "não revisada" ([iOS](https://mobbin.com/screens/e0f620ec-6c04-4d3d-b57f-b108bd34de72)) | Sim. Planilha com conciliação ([web](https://mobbin.com/screens/d6d76a46-7846-4f0c-865a-2bfdcffb903a)) | Sim ([fluxo](https://mobbin.com/flows/4a244717-e90d-49db-87ae-c3a92e21a6df)) | Sim. Colunas configuráveis ([web](https://mobbin.com/screens/e543344e-1f98-4610-b7eb-a54e29b5eeb4)) |
| Lançamento manual | Sim. 7 campos; mostra o novo saldo ([iOS](https://mobbin.com/screens/d8c96d3b-5680-44a4-b11a-b54c5066571c)) | Parcial. Só em conta manual ([fluxo](https://mobbin.com/flows/a90d6aef-b871-4b5b-94b8-2e8797c90e5c)) | Sim. 8 campos ([iOS](https://mobbin.com/screens/eafd2ca3-0a9a-4836-87fc-2901155f6f53)) | Sim. 4 campos ([fluxo](https://mobbin.com/flows/4a244717-e90d-49db-87ae-c3a92e21a6df)) | Sim. Mais de 15 campos ([iOS](https://mobbin.com/screens/e03e76d2-c2ae-4c8a-aac7-a24f93a7d27e)) |
| Regras / auto-categorização | Sim. Regra com prévia; um toast oferece criar regra ([regra](https://mobbin.com/screens/f9c4c392-960b-40ae-bb0a-c42f66322216)) | Sim. "Copilot Intelligence" e a regra do recorrente escrita em frase ([recorrente](https://mobbin.com/screens/ee83ed17-444a-4380-bfcb-792f3ca8dcd3)) | não visto. Só "This needs a category" e Approve ([web](https://mobbin.com/screens/d6d76a46-7846-4f0c-865a-2bfdcffb903a)) | Sim. Renomear vira regra, com "43 Matching" ([confirmar](https://mobbin.com/screens/fd12c9b6-0768-44c8-9540-090ec43c167e)) | Parcial. O Assist promete "creating rules", mas a tela de regras não foi vista ([Assist](https://mobbin.com/screens/29873c85-0112-443a-b378-631e4659b53c)) |
| Orçamento | Sim. Baldes Fixed, Flexible e Non-Monthly ([web](https://mobbin.com/screens/fe7beadd-310d-4122-b68f-6a135a217001)) | Sim. Barra pelo ritmo e rollover ([iOS](https://mobbin.com/screens/f1778c3a-ee4e-4bd7-960b-52db273f15d2)) | Sim. Envelopes, que são o núcleo do produto ([plano](https://mobbin.com/screens/df907708-c21e-4fb4-970a-c747b1bb7a01)) | Sim ([web](https://mobbin.com/screens/e8e471f9-dc5d-47a7-8d02-8b62c096149b)) | Sim. Spending Plan em cascata ([web](https://mobbin.com/screens/dd505fe6-1fef-4e88-be94-9cc014500afb)) |
| Categorias | Sim. Grupos, emoji e arrastar ([iOS](https://mobbin.com/screens/ef7198ca-74f0-4ab3-899f-d1afd5157b88)) | Sim. Cor e emoji; seção "Excluded" ([nova](https://mobbin.com/screens/fdb1a20f-3747-410b-b374-a61c7cd31fac)) | Sim. Grupos e reordenar ([reordenar](https://mobbin.com/screens/ef1bb354-53df-4c3f-b715-82eee17fac1c)) | Parcial. As categorias padrão não são editáveis ([categorias](https://mobbin.com/screens/90475175-d1f4-49c5-984f-35acacdafbff)) | Sim. Lista longa e "Tax related" ([categorias](https://mobbin.com/screens/e09762f1-1a4c-41b0-8b5a-fda6104c3e61)) |
| Recorrentes / assinaturas | Sim. Calendário e fila "Review now" ([web](https://mobbin.com/screens/ff4c128e-98e3-4b4c-ab68-837b99b892bb)) | Sim. Regra em frase e próximo pagamento ([iOS](https://mobbin.com/screens/ee83ed17-444a-4380-bfcb-792f3ca8dcd3)) | Parcial. Só o campo "Repeat" ([data](https://mobbin.com/screens/ed6520a9-d446-4369-ab74-8ce9fbfe46e7)) | Sim, é o destaque do app; mostra o custo anual por grupo ([próximas](https://mobbin.com/screens/01d9cc58-851a-4e29-9b1b-a6f0bef3b85d)) | Sim. "Series" e filtro de assinaturas ([recorrentes](https://mobbin.com/screens/d9644902-fbfc-418d-ae52-b92291295c52)) |
| Cancelar assinatura | Não. Só o status "Canceled" ([editar](https://mobbin.com/screens/efddcf51-2aba-4733-8cea-ccacb0b659c7)) | Não | Não | Sim. Concierge que pede o login do serviço ([fluxo](https://mobbin.com/flows/7702f8ba-dd42-4e06-8771-ffc7dd72ba7e)) | Não. Só o filtro "Canceled" |
| Cartão / fatura | Parcial. "Set up bill sync" e Spinwheel ([Spinwheel](https://mobbin.com/screens/c82fcf42-9912-4dd8-9dd5-daa05ae1986e)) | Não. O cartão é só saldo, com a imagem do plástico ([contas](https://mobbin.com/screens/d65fba1d-7472-4778-a353-9d35276cccab)) | não visto. Só "Credit Spending" no inspetor | Parcial. % do limite usado e "Credit card payment" ([dívida](https://mobbin.com/flows/0ab48252-2c5c-4f75-97e8-d52fdd5300e3)) | Parcial. Uma linha "Credit" no cartão Banking |
| Parcelas | não visto | não visto | não visto | não visto | não visto |
| Estorno / reembolso | não visto | não visto | não visto | Parcial. Bloco "Reimbursements" e "Ignore" em 3 níveis ([não-gasto](https://mobbin.com/screens/dc349679-b843-41e5-b59f-c9862dcb342a)) | Sim. Refund Tracker com data esperada ([formulário](https://mobbin.com/screens/f1d47c4b-55ca-4b06-a4ac-682678eb2c33)) |
| Contas a pagar | Parcial. Recorrentes com "paid / remaining" ([web](https://mobbin.com/screens/ff4c128e-98e3-4b4c-ab68-837b99b892bb)) | Parcial. UPCOMING e "$0 left to pay" ([web](https://mobbin.com/screens/e07ab595-3099-4aa5-8ff4-b1c133b257b4)) | Parcial. Chip "Next Bills" e "needed by the 29th" ([web](https://mobbin.com/screens/caa1e0f6-53f7-44e7-b3b1-fe79fdfe5a5d)) | Sim. Upcoming e "Mark as Paid" ([ações](https://mobbin.com/screens/4b99c2af-ed69-4048-aa22-af12e860651b)) | Sim. Calendário com o selo "Paid" ([calendário](https://mobbin.com/screens/f8776143-92ee-4bd5-a60e-c7738fe7982d)) |
| Metas | Sim. Foto, contas atribuídas e prioridade ([metas](https://mobbin.com/screens/efca7f5f-187f-4071-a6ce-d42e97660245)) | Sim. Projeção e dica da IA ([meta](https://mobbin.com/screens/e95802f1-7270-4ad1-ba16-f5c1104592c8)) | Sim, como Targets da categoria ([target](https://mobbin.com/screens/e44344b7-3e0b-4ff4-9d4c-0e1c8ec0a6c6)) | Parcial. Misturadas com as contas em Assets ([ativos](https://mobbin.com/screens/0450c132-3626-4cba-95e2-f16d48fb3c03)) | Sim ([meta](https://mobbin.com/screens/f1874d47-a60b-4d0d-86a9-6114edd211f4)) |
| Patrimônio / investimentos | Sim, mas a tela de Investments por dentro não foi vista ([contas](https://mobbin.com/screens/de8d26b4-e456-4cfa-bd52-99ff96e94174)) | Sim nos dois ([patrimônio](https://mobbin.com/screens/d65fba1d-7472-4778-a353-9d35276cccab)) | Parcial. A aba Net Worth do Reflect e empréstimos; investimentos não vistos ([empréstimo](https://mobbin.com/screens/f82cde3f-c4d8-4688-94ba-4f16096e79ef)) | Sim / parcial. Net Worth sim; investimento só na lista de contas ([web](https://mobbin.com/screens/e5c8b294-1200-4200-b763-6521a4840f77)) | Sim. Debt-to-asset e Holdings ([patrimônio](https://mobbin.com/screens/cf902547-63ac-48de-8f51-1dce02f9e269)) |
| Relatórios | Sim. Sankey e relatórios salvos ([Sankey](https://mobbin.com/screens/dac45a11-e8d3-4c48-8e3d-5a2e05f74951)) | Parcial. Cash flow sem tela de relatório ([cash flow](https://mobbin.com/screens/e7591103-070b-45f3-bd00-f73be234e5fc)) | Sim. Reflect com 5 abas ([web](https://mobbin.com/screens/e492e96c-7278-4e2f-8dd8-9cfa73d76fe2)) | Parcial. Detalhamento do Spending ([anel](https://mobbin.com/screens/ee2dfe42-9611-44fb-bbe7-88ba4ede7f03)) | Sim. 9 relatórios e "Save report" ([relatório](https://mobbin.com/screens/c95ecdd8-23a3-4b07-b753-c9e2ce3902bd)) |
| IA chat | não visto. Só o chat de suporte ([suporte](https://mobbin.com/screens/d1d2876d-593c-44b2-a521-1b0cb2e3a701)) | não visto. O balão é suporte humano ([suporte](https://mobbin.com/screens/07a9cbee-d794-41b2-bccf-425f8a138a09)) | Não; o produto não tem | Não. O "Chat" é humano | Sim. Quicken Assist em beta, só na web ([chat](https://mobbin.com/screens/e375687d-53bb-4f16-8165-549a57bd3d93)) |
| IA lançamento | não visto | Parcial. Categoriza sozinho; não lança ([onboarding](https://mobbin.com/flows/92d7d390-97fc-485a-8fab-d9cf1acbd632)) | Não | não visto | não visto |
| Compartilhar com parceiro / família | Sim. Household Members ([membros](https://mobbin.com/screens/b38d5b78-cc18-4260-951c-d21e69adc40b)) | Não. Procurado 3 vezes | Sim. YNAB Together, só na web ([painel](https://mobbin.com/screens/798a5c8f-660a-4c90-b97f-e4410eb1d775)) | Parcial. Um "Enable" no Profile; o fluxo depois dele não foi visto ([perfil](https://mobbin.com/screens/e21bdf1b-c5c2-45d8-8ca2-72467368cdb0)) | Não. Nenhuma tela |
| Papéis | Parcial. Family Manager, membro com acesso total e consultor por 60 dias | Não | Parcial. Gerente e membro; o membro escolhe quais planos compartilha ([gerenciar](https://mobbin.com/screens/10cf68b5-ebe4-4afd-92cc-d764d596f3c5)) | Não | Não |
| Quem pagou / acerto | Não. Só "Needs review by" ([detalhe](https://mobbin.com/screens/e75d351a-b5cc-42e5-a134-79688e30f988)) | Não | Não | Não | Não. Só a watchlist por pessoa |
| Exportar | Sim. CSV em contas e relatórios | Sim. "Export all transactions (CSV)" ([web](https://mobbin.com/screens/d05050cc-0059-45d8-b0ee-19c21d5873d4)) | Sim. Export no Reflect e em lote | Sim. Botão "CSV" na lista | não visto |
| Tema escuro | Parcial. Só a lista iOS foi vista escura | Sim, completo ([web](https://mobbin.com/screens/fd8c7d1d-72cb-4c60-90a5-cd4fd1e5c58c)) | Sim. Light, Dark ou System ([display](https://mobbin.com/screens/d8a1904e-6749-4f36-a2f4-da5d61b08da4)) | não visto | Sim. System, Light ou Dark ([config.](https://mobbin.com/screens/ffd32e31-6baa-4910-a383-1f6437a90573)) |
| Acessibilidade (sem depender de cor, ocultar valores) | Parcial. "Hide amounts" só ao compartilhar um gráfico ([compartilhar](https://mobbin.com/screens/cf276734-811b-402d-b17a-dcdf74bf6e75)) | Parcial. "Accessible colors" e "+ e −"; ocultar valores não visto ([acessib.](https://mobbin.com/screens/e02e6dfd-3210-4217-9aa3-d0b76f1c12ab)) | Sim. "Differentiate Without Color" e o olho que oculta valores ([ocultar](https://mobbin.com/screens/c548dc57-ab85-4d9f-97fa-f24b2814e089)) | não visto | não visto |

**Leitura**
- O **Monarch** cobre a lista mais larga: regras, metas, relatórios, membros e exportação. Perde em cartão e IA, que estão fora das telas do Mobbin.
- O **Simplifi** é o único com **Refund Tracker** e com **chat de IA** visível. Não tem família.
- O **Rocket** é o único que **cancela** uma assinatura e trata contas a pagar como função de primeira linha.
- O **YNAB** é estreito de propósito: orçamento, conciliação e acessibilidade de cor. Não tem regras, recorrentes de verdade nem IA.
- **Nenhum dos cinco** tem fatura com ciclo, parcelas ou "quem pagou".

---

## 2. Divisão de telas e arquitetura

| Critério | Monarch | Copilot | YNAB | Rocket | Simplifi |
|---|---|---|---|---|---|
| Navegação no telefone | Tab bar de 5 (Dashboard, Accounts, Transactions, Cash Flow, Budget), que dá para personalizar, mais uma gaveta ☰ ([editar](https://mobbin.com/screens/e60e3968-dacd-432a-bf20-924ca8f81979)) | **Sem tab bar.** 8 pílulas roláveis no topo ([painel](https://mobbin.com/screens/e45e34c5-26c1-4e20-99de-731530b71704)) | Tab bar de 5 (Plan, Accounts, "+" Transaction, Reflect, Help) ([plano](https://mobbin.com/screens/df907708-c21e-4fb4-970a-c747b1bb7a01)) | Tab bar de 5 (Dashboard, Recurring, Spending, Transactions, More); o More é uma gaveta ([menu](https://mobbin.com/screens/001e163e-1e09-43de-95a6-083a12bda87e)) | **Só gaveta ☰**, sem tab bar ([fluxo](https://mobbin.com/flows/a8fa7bf6-bceb-403d-a372-42ed82e2e4b2)) |
| Navegação no desktop | Sidebar com 10 itens; conteúdo mais a coluna "Summary" | Sidebar com 6 itens e as contas com saldo; 3 colunas (lateral, lista e detalhe fixo) ([web](https://mobbin.com/screens/fd8c7d1d-72cb-4c60-90a5-cd4fd1e5c58c)) | Lateral escura com Plan, Reflect e as contas; 3 colunas com inspetor ([web](https://mobbin.com/screens/caa1e0f6-53f7-44e7-b3b1-fe79fdfe5a5d)) | Sidebar com 7 itens; conteúdo mais uma coluna à direita ([web](https://mobbin.com/screens/f075dbe0-f75d-4955-9fbb-bca17ef8bb3d)) | Trilho só de ícones, mais uma coluna fixa de contas em árvore ([web](https://mobbin.com/screens/f4185e0b-854e-4b34-b478-848edd784844)) |
| Seções de 1º nível | 10 na web; 5 abas e mais 3 na gaveta do iOS | 8 no iOS; 6 na web (Goals e Cash flow não aparecem na lateral) | 3 na web, mais as contas; 5 abas no iOS | 7 na web; 4 abas e o More no iOS (Net Worth e Credit Score ficam escondidos) | 3 grupos na gaveta (Insights, Reports com 9 subitens, Utilities); cerca de 10 ícones na web |
| Onde moram as configurações | Engrenagem na lateral; duas colunas, Account e Household ([config.](https://mobbin.com/screens/df8ad161-1592-4458-9426-b8e4cdd0fb80)) | Engrenagem no topo do iOS; um modal com abas na web | No "⋯" do Plan; uma das telas é webview ([conta](https://mobbin.com/screens/fe5744f7-64af-4503-b016-e1244528820b)) | Na gaveta More (iOS) ou na engrenagem (web) | Uma segunda gaveta, que abre da direita (iOS) |
| Como abre o detalhe | Folha lateral com setas ↑↓ na web; página de linhas no iOS ([detalhe](https://mobbin.com/screens/e75d351a-b5cc-42e5-a134-79688e30f988)) | Folha no iOS; painel fixo à direita na web | Inspetor fixo na web; folha no iOS | Página no iOS; modal de 2 colunas na web ([web](https://mobbin.com/screens/ef2e47f5-b325-4cac-a7c8-9c7fd908415a)) | Página no iOS; painel ao lado da cascata na web |
| Profundidade até as funções secundárias | Recurring, Goals e Investments a 2 toques no iOS (☰ e item) | Pílula fora da tela: rolar e tocar | Relatórios a 1 toque; Together não existe no iOS | Net Worth, regras e compartilhar a 2 ou 3 toques (More, item, sub) | Relatórios a 3 toques (☰, Reports, subitem) |

**Leitura**
- O **Monarch** é o melhor no telefone: tab bar que a pessoa personaliza e o resto numa gaveta nomeada.
- O **Copilot** e o **YNAB** resolvem melhor o desktop, com 3 colunas e detalhe fixo, que permite revisar sem perder a lista.
- O **Simplifi** é o pior no telefone: tudo fica atrás da ☰, e os relatórios a 3 níveis.
- O **Rocket** esconde patrimônio e configurações no "More". **julgamento**: aceitável para um app centrado em recorrentes.

---

## 3. Botões e ações

| Critério | Monarch | Copilot | YNAB | Rocket | Simplifi |
|---|---|---|---|---|---|
| Ação primária: posição e forma | Botão laranja "+ Add transaction" no cabeçalho da web; "+" no cabeçalho da lista no iOS ([web](https://mobbin.com/screens/6d7710b7-7222-45d8-a3a9-550a8bae1516)) | "+" flutuante no pé, à direita, em cada seção ([categorias](https://mobbin.com/screens/f1778c3a-ee4e-4bd7-960b-52db273f15d2)) | "+" **central na tab bar**, cinza como as outras abas; "+ Add Transaction" na barra da planilha web ([plano](https://mobbin.com/screens/df907708-c21e-4fb4-970a-c747b1bb7a01)) | ⊕ no cabeçalho em degradê, à direita ([gastos](https://mobbin.com/screens/ee2dfe42-9611-44fb-bbe7-88ba4ede7f03)) | ⊕ na lista no iOS; "+ New" nas contas web; botão flutuante ✦ da IA ([web](https://mobbin.com/screens/f4185e0b-854e-4b34-b478-848edd784844)) |
| Cor primária | Laranja | Azul | Verde-lima e roxo no iOS; verde na web | Vinho→vermelho; vermelho no ativo da web | Roxo |
| Primário × secundário | Laranja cheio contra contornos brancos (Filters, Edit rules) | Texto azul em caixa alta ("MARK AS REVIEWED") e pílulas | [Save] flutuante; [Save and add another] secundário na web | Botões contornados na folha de ações; CTA cheio no paywall | CTA "Create" fixo; contornos (Today, ◀ ▶) ([plano](https://mobbin.com/screens/e52fd942-c411-4981-80c2-0ff0282b0a96)) |
| Ações em lote | Sim. "Edit multiple", painel com "No change" e confirmação ([massa](https://mobbin.com/screens/e761a6d8-d2e7-4e29-a02f-2a45e679e830)) | Parcial. Caixa por linha na web; a barra não foi vista | Sim. Barra flutuante na web e barra no iOS com a soma ([iOS](https://mobbin.com/screens/f9ad37e5-3c05-4906-b5c7-cbcd70400d9f)) | não visto | não visto |
| Menus contextuais | "⋯" em cada widget; "Edit 2 ›" | "…" na conta (Hide, Closed, Delete) ([menu](https://mobbin.com/screens/ff5af71c-c937-448f-9e7d-f7e13567e38e)) | "More" com 8 ações em lote | ⋮ na linha do recorrente abre uma folha ([ações](https://mobbin.com/screens/4b99c2af-ed69-4048-aa22-af12e860651b)) | não visto |
| Toasts com desfazer ou regra | Toast escuro com DISMISS; "Create a rule… CREATE" depois de dividir ([fluxo](https://mobbin.com/flows/0a0f283a-5b8a-49c1-a107-774992a44de9)) | "Undo / Recalculate all" ([web](https://mobbin.com/screens/e07ab595-3099-4aa5-8ff4-b1c133b257b4)) | Undo e Redo fixos na barra, mais "Recent Moves" | "+ Rule" depois de renomear ([fluxo](https://mobbin.com/flows/dd9d1ac7-cc88-492c-b17a-c324100d90ac)) | "Transactions created — Undo" |
| Atalhos de teclado no desktop | ⌘K (busca), ⌘A e Esc na seleção | não visto | Sim. C, M, ⇧U e ⇧D no menu de lote | não visto | ⌘⇧0 para o Assist (dica no painel web) |

**Leitura**
- O **YNAB** é o mais completo para quem trabalha no teclado: lote, atalhos, Undo/Redo e soma da seleção.
- O **Monarch** vem logo atrás: lote com confirmação do que muda e toast que vira regra.
- O **Copilot** reaproveita o painel de detalhe para criar. É um formulário só para ver, editar e criar.
- **julgamento**: o "+" do YNAB no centro da tab bar, cinza e sem destaque, é a ação primária mais fraca visualmente; o laranja do Monarch é a mais clara.

---

## 4. Usabilidade de tarefas-chave (passos estimados)

| Tarefa | Monarch | Copilot | YNAB | Rocket | Simplifi |
|---|---|---|---|---|---|
| Lançar um gasto | ~5 toques no iOS (Transactions, +, valor, comerciante, categoria, salvar). O saldo novo aparece ao digitar ([fluxo](https://mobbin.com/flows/dea78d5a-79fd-4668-9fc1-27e1351f3139)) | ~4 (+, nome, valor, categoria pelo trilho, SAVE). Atrito: só funciona em conta manual ([fluxo](https://mobbin.com/flows/a90d6aef-b871-4b5b-94b8-2e8797c90e5c)) | ~6 (+, valor, Payee, Category, Account, Save). Atrito: "Cleared" no formulário principal | ~5 (Transactions, ⊕, nome, data, valor, Save). Tem só 4 campos | Mais de 6, num formulário com mais de 15 campos, entre eles status, flag e "Exclude from" ([fluxo, 24 telas](https://mobbin.com/flows/5673c75a-7932-436f-8d9c-f18bdb7ebec5)) |
| Ver quanto sobra no mês | 1 toque (aba Budget, "Left to budget"). Não há número-herói no painel | **0**: a primeira linha do painel ("$577 left"), contra a reta do ritmo ([painel](https://mobbin.com/screens/c1bb5363-d727-4f41-a45b-56979b528927)) | 0 para "Ready to Assign"; o que sobra por categoria fica em cada linha. Atrito: o número é "a atribuir", não "a gastar" | 1 (aba Spending, "Left For Spending"); a web mostra ainda "$X/day" ([web](https://mobbin.com/screens/e8e471f9-dc5d-47a7-8d02-8b62c096149b)) | 2 (☰ e Spending Plan), com "Available" e "per day" |
| Revisar ou corrigir uma transação | Widget "Needs review" e detalhe com ↑↓ para seguir sem fechar | Bloco TO REVIEW no painel com "MARK AS REVIEWED" | Faixa "27 new transactions to approve" e Approve em lote | "Needs categorization" no Spending; renomear vira regra | Switch "Reviewed" e filtro Reviewed / Not reviewed ([avançado](https://mobbin.com/screens/ebc948b0-04c0-4a09-9f8a-aa6025736a01)) |
| Ver o cartão e a fatura | Recurring › Credit cards › "Set up bill sync". Não há fatura | Accounts: saldo e imagem do cartão. Não há fatura | não visto | More › Net Worth › Debt: "% Used" (3 toques). Não há fatura | Painel: uma linha "Credit". Não há fatura |
| Convidar o parceiro | Web: Settings › Members › Add › e-mail › Send, ~5 passos com aviso de acesso total ([convite](https://mobbin.com/screens/8d2fbc64-8041-48e7-ba16-47ce3aba63a2)). Erro se o convidado já tem conta | não visto | Web: Together › Invite Member (nome, e-mail e planos), ~4 passos ([convidar](https://mobbin.com/screens/37839cbe-87dd-4b17-973a-d70d8aa17103)). Não existe no iOS | More › Profile › Enable (3 toques); o resto do fluxo não foi visto | não visto |
| Cancelar uma assinatura | Não cancela; dá para marcar "Canceled" | Não | Não | ~5 (Recurring, Start a Cancellation, serviço, "Cancel this for me", login do serviço). Atrito: pede a **senha do serviço** e leva até 10 dias úteis | Não |
| Criar um orçamento | 3 telas na web (baldes, não mensais e fixos já preenchidos) ([baldes](https://mobbin.com/screens/f9b6a221-a541-4148-afaa-5ab1e69a385f)) | Vem sugerido por categoria no onboarding; basta confirmar ([fluxo](https://mobbin.com/flows/786e10d4-177c-4b47-97da-3247ae1b7948)) | Atribuir categoria por categoria com o teclado e Auto-Assign; os targets vêm com exemplo | More › Manage Budget (renda, contas, resto) ([gerenciar](https://mobbin.com/screens/eaecfc68-9885-4209-8da4-b5d357e1a039)) | Guiado em 4 passos, com as contas detectadas para desmarcar ([adicionar contas](https://mobbin.com/screens/fbba19d8-f4d1-4aca-b7ef-6cf9b105c6ce)) |

**Leitura**
- O **Copilot** ganha no uso diário: o que sobra e o que falta revisar estão na primeira tela, e o lançamento é uma folha só.
- O **Rocket** é o único que resolve "cancelar", mas com um custo de confiança (a senha de terceiros).
- O **Simplifi** cobra caro no lançamento e na navegação.
- A tarefa "ver a fatura" **falha nos cinco**.

---

## 5. Design visual

| Critério | Monarch | Copilot | YNAB | Rocket | Simplifi |
|---|---|---|---|---|---|
| Paleta e cor da marca | Creme ou branco e laranja; a lateral web é clara ([web](https://mobbin.com/screens/6d7710b7-7222-45d8-a3a9-550a8bae1516)) | Azul-marinho e azul; web cinza neutra | Creme, verde-lima e roxo no iOS; lateral azul-marinho na web | Degradê vinho→vermelho no topo das abas iOS; web branca | Roxo chapado e cartões brancos |
| Tipografia (**julgamento**, pelas imagens) | Sans neutra, com títulos médios | Sans arredondada e pesada nos números; sobrancelhas em caixa alta | Sans grande, números em negrito dentro de chips | Sans leve; sobrancelhas espaçadas ("YOUR BUDGET") | Sans geométrica e título grande ("Overview") |
| Densidade | Web densa (tabela); iOS arejado | Alta: muitos números pequenos | Web muito densa (3 colunas e 7 filtros); iOS espaçado | Média; cartões arejados | Web densa (árvore e tabela); iOS espaçado |
| Estilo de gráfico | Área, Sankey e barras com linha | Linha acumulada contra a reta do ritmo, anéis e barras com a linha do orçamento | Barra segmentada sob cada linha; rosca no Reflect | Anel segmentado com ícones e curva cumulativa na web | Rosca grande, cascata e colunas com linha |
| Tema escuro | Só a lista iOS foi vista | Completo; é o tema de destaque | Sim (lista de contas iOS) | não visto | Seletor existe; as telas vistas são claras |
| Vermelho e verde | Vermelho grande em "Left to budget −$91,038" | Muito vermelho cheio no estouro; a receita em verde | Verde, amarelo e cinza no chip, sempre com uma frase | O negativo sai **laranja** ("−$91"), com alerta "!" ([gastos](https://mobbin.com/screens/ee2dfe42-9611-44fb-bbe7-88ba4ede7f03)) | Salmão para o estouro |
| Ícones e emojis | Emoji nas categorias e logo dos comerciantes | Emoji em chips em caixa alta; letras R, T e I | Emoji em toda categoria | Ícone de traço em círculo pastel | Ladrilho com letra colorida; pouco emoji |
| Cartões × listas | Widgets em cartões; listas densas | Cartões arredondados; imagem do cartão físico | Listas de linhas e cartões só no vazio | Cartões | Cartões no painel; formulário em lista |
| Ilustração | Fotos nas metas | Cidade isométrica no onboarding | Muita: potes, foguete, "high five" | Pouca; depoimentos | Caixa, estrela e cartão 3D nos vazios ([web](https://mobbin.com/screens/f4185e0b-854e-4b34-b478-848edd784844)) |

**Leitura (julgamento)**
- O **Copilot** tem a identidade mais forte e o escuro mais bem resolvido, mas pesa em vermelho e em densidade.
- O **YNAB** é o mais legível por cor, porque toda cor vem acompanhada de uma frase.
- O **Monarch** é limpo e sóbrio, e o laranja só marca a ação.
- O **Rocket** tem marca forte no topo do iOS e é genérico na web.
- O **Simplifi** é o mais genérico visualmente.

---

## 6. Organização da informação

| Critério | Monarch | Copilot | YNAB | Rocket | Simplifi |
|---|---|---|---|---|---|
| Contas | Por tipo, com resumo Assets / Liabilities e status da conexão ([status](https://mobbin.com/screens/d923ff26-de65-4aee-8362-60b653d76060)) | Por tipo (Credit cards, Depository, Investments, Loans), na lateral web com saldo | Starred, Cash, Loan e Closed, com o tique de conciliada | Checking, Credit Cards, Net Cash, Savings e Investments | Árvore Banking → Savings → conta; Assets e Liabilities |
| Categorias | Grupos mais os baldes Fixed / Flexible / Non-Monthly | Categorias, "Excluded" e "Groups of budgets" | Grupos (Needs…) com Targets | Padrão (fixas) e personalizadas; Bills separado de "Everything Else" | Árvore longa com "Tax related" |
| Configurações | Account (pessoa) e Household (casa), separados | iOS: Features, Appearance, Accessibility…; web: 5 abas | Espalhadas no "⋯", parte em webview | Gaveta More com 10 linhas | Gaveta da direita |
| Nomenclatura e jargão | Household, Needs review, Flex, Rollover | Recurrings, Excluded, "Copilot Intelligence" | **O mais carregado**: Ready to Assign, Cleared, Working Balance, Cost to Be Me, Age of Money | Ignore from Budget / Everything, Left for spending | Spending Plan, Watchlist, Series, Payee, Check # |

**Leitura**
- O **Monarch** separa pessoa e casa nas configurações, e a casa já é a unidade de família.
- O **Simplifi** organiza bem as contas (árvore) e o plano (cascata), mas carrega o vocabulário do Quicken.
- O **YNAB** exige aprender um idioma próprio. **julgamento**: compensa para o fiel, afasta quem está chegando.

---

## 7. Entrega de valor

| Critério | Monarch | Copilot | YNAB | Rocket | Simplifi |
|---|---|---|---|---|---|
| Tempo até o primeiro valor (**julgamento**) | Longo: cadastro, perguntas, paywall e só então conectar o banco | Médio: conectar banco e revisar; o **Demo Mode** dá valor imediato | **Curto**: o mini-jogo e o plano pronto aparecem antes da conta ([método](https://mobbin.com/screens/d31bd7cc-06e5-42be-8bd6-3e2ef5c7dd90)) | Médio: questionário e conectar a conta corrente | Longo: cadastro e paywall antes de ver o app |
| O que o onboarding pede antes | E-mail, código, senha, perguntas e "gerencia com parceiro?" | Apple ou e-mail, banco pelo Plaid, notificações e duplicatas | Nome e quem mora na casa; nada de banco antes do plano | Meta, perfil, origem, nome, e-mail e **conta corrente obrigatória** | E-mail, **celular** e senha |
| Paywall | Antes dos dados; cartão obrigatório; teste de 7 dias com linha do tempo; o iOS empurra a compra para a web ([paywall](https://mobbin.com/screens/f4f97ca0-8e85-4609-8f21-c5c9902171d4)) | Folha da App Store (1 mês e US$ 95/ano); web pede pagamento, com um "Skip" visível ([web](https://mobbin.com/screens/6f2a2a69-d56a-44bf-a5a0-4dfcece8284d)) | iOS depois do plano, com caixa de ciência obrigatória; web "No credit card required" ([paywall](https://mobbin.com/screens/d6c179ff-6587-4b17-aee1-eb836d5d5d7f)) | "Pague o que achar justo", teste de 7 dias e débito em conta ([paywall](https://mobbin.com/screens/50401be4-6845-434a-989c-153bf925170f)) | Antes do app, 67% de desconto, nenhum teste visto ([paywall](https://mobbin.com/screens/aaaad76e-f005-4da0-8135-0b7b0028ca08)) |
| O "aha" (**julgamento**) | Ver a casa inteira e a fila "Needs review" | "Esses números estão certos?" e "$X left" ([revisão](https://mobbin.com/screens/e188690d-a9a1-4271-ab66-3966b9bc3b2e)) | "Cada dólar tem um trabalho" e "Wow, now that's a plan!" | As 4 portas e "Save up to $768 per year" | "Income after bills" e "Available per day" |
| Estados vazios | Cartões fantasma com "Add account", "You reviewed everything!" e um Sankey cinza | "30 transactions to unlock intelligence" | Uma pergunta do método ("What does this money need to do…") ([vazio](https://mobbin.com/screens/e4798a83-cd7c-444f-8929-0eda37637013)) | Checklist "COMPLETE SETUP 5/7" | Ilustrado: "Kudos! You haven't spent anything" |

**Leitura**
- O **YNAB** entrega valor antes de pedir qualquer dado ou cartão, pelo menos na web.
- O **Copilot** tem o melhor atalho sem banco (o demo) e o melhor fecho do onboarding (a revisão dos números).
- O **Monarch** e o **Simplifi** cobram antes de mostrar qualquer coisa.
- O **Rocket** exige o banco, mas promete economia em dólar logo de cara.

---

## 8. Telefone × desktop

| App | O que muda entre as plataformas |
|---|---|
| Monarch | A web concentra o trabalho pesado: edição em massa, regras com prévia, Sankey, Advice e configuração do orçamento. O iOS fica com leitura e lançamento: tab bar personalizável, folhas e saldo novo. O detalhe é folha com ↑↓ na web e página no iOS. |
| Copilot | O iOS tem pílulas no topo, folhas, muita cor e Goals e Cash flow como seções. A web tem 3 colunas, cinza, lote, filtros em chips com totais e configurações em modal; Goals e Cash flow não aparecem na lateral. O paywall é da Apple no iOS e uma página própria na web. |
| YNAB | O modelo é o mesmo nos dois. O iOS é de toque: teclado-calculadora, slider para mover dinheiro, mini-jogo e "Differentiate Without Color". A web é planilha: inspetor, atalhos, Reconcile, os 5 relatórios e o Together, que só existe nela. |
| Rocket | O iOS esconde patrimônio e regras no More, e o painel abre com o que vai vencer. A web põe tudo na lateral, e o painel abre com o gasto do mês e a curva. O degradê só existe no iOS. |
| Simplifi | O iOS usa gaveta e formulários longos. A web tem trilho de ícones, coluna de contas, cascata do plano sempre visível, filtro em 3 colunas e o Assist, que **só aparece na web**. |

**Leitura**
- O **Monarch** e o **YNAB** têm a divisão mais deliberada: o mesmo modelo, com a forma nativa de cada plataforma.
- O **Copilot** e o **Simplifi** deixam funções de fora de uma das plataformas. No Copilot, Goals e Cash flow não estão na lateral da web; no Simplifi, a IA não está no iOS.

---

## Ranking por dimensão (julgamento)

1. **Funcionalidades:** 1º Monarch (a lista mais larga e a única com membros, regras com prévia e exportação). 2º Simplifi (estorno, contas a pagar e chat de IA). 3º Rocket (cancelamento e contas a pagar). 4º Copilot (forte no núcleo, sem família). 5º YNAB (estreito de propósito).
2. **Arquitetura:** 1º Monarch (tab bar personalizável e gaveta nomeada). 2º YNAB (tab de 5 e 3 colunas com inspetor). 3º Rocket (tab bar, mas o More esconde o patrimônio). 4º Copilot (3 colunas excelentes na web, pílulas sem tab bar no iOS). 5º Simplifi (só gaveta).
3. **Botões e ações:** 1º YNAB (lote, atalhos, Undo/Redo e soma da seleção). 2º Monarch (lote com confirmação, ⌘K e toast que vira regra). 3º Copilot (painel único de criar e Undo/Recalcular). 4º Rocket (toast "+ Rule" e folha ⋮, sem lote visto). 5º Simplifi (só Undo e um atalho).
4. **Usabilidade das tarefas:** 1º Copilot (o que sobra a 0 toques, revisão no painel e lançamento em uma folha). 2º Rocket (cancela, mostra o que sobra a 1 toque e lança com 4 campos). 3º Monarch (lançamento com saldo novo, mas sem número-herói). 4º YNAB (8 campos e jargão). 5º Simplifi (mais de 15 campos e gaveta).
5. **Design visual:** 1º Copilot (identidade e escuro). 2º YNAB (a cor sempre com frase). 3º Monarch (sóbrio, ação clara). 4º Rocket (forte no iOS, genérico na web). 5º Simplifi (genérico).
6. **Organização da informação:** 1º Monarch (pessoa e casa separadas, baldes simples). 2º Simplifi (árvore de contas e cascata, com jargão do Quicken). 3º Copilot (contas na lateral, "Excluded" claro). 4º Rocket (categorias padrão travadas, patrimônio escondido). 5º YNAB (idioma próprio).
7. **Entrega de valor:** 1º YNAB (plano antes da conta, sem cartão na web). 2º Copilot (Demo Mode e revisão final). 3º Rocket (promete economia, mas exige o banco). 4º Monarch (cartão antes de qualquer dado). 5º Simplifi (paywall antes do app e celular obrigatório).
8. **Telefone × desktop:** 1º Monarch (divisão clara entre trabalho pesado e uso rápido). 2º YNAB (mesmo modelo, forma nativa). 3º Copilot (bom nos dois, com funções que somem). 4º Rocket (painéis com leituras diferentes). 5º Simplifi (IA só na web, gaveta no telefone).

## Lacunas comuns

- **Fatura de cartão.** Nenhum dos cinco mostra ciclo, fechamento, vencimento da fatura, parcelas nem conferência com o PDF. O cartão é saldo, % do limite ou "bill sync".
- **Quem pagou e acerto.** Ninguém tem. O máximo é o "Needs review by" do Monarch e a watchlist por pessoa do Simplifi.
- **Papéis limitados.** A família é acesso total (Monarch, Rocket) ou o plano inteiro (YNAB). Não há papel de filho, visão restrita nem limite por pessoa. O Copilot e o Simplifi não têm família.
- **Captura sem banco.** O lançamento manual é sempre um formulário, de 4 a mais de 15 campos. Ninguém lança por mensagem, voz ou foto, e o produto inteiro pressupõe Plaid. O Copilot só tem o demo como saída.
- **IA de lançamento.** Não aparece em nenhum. A IA vista é chat (Simplifi, só web e beta) ou selo de categorização (Copilot).
- **Estorno ligado à fatura.** Só o Simplifi rastreia o reembolso esperado, e sem ligação com a fatura do cartão.
- **Cancelar sem entregar senha.** Só o Rocket cancela, e pede o login do serviço.
- **Teste sem cartão no telefone.** Ninguém oferece no iOS. Só a web do YNAB diz "No credit card required".
- **Ocultar valores e não depender de cor.** Completo só no YNAB. No Copilot é parcial (cores acessíveis) e no Monarch também (só ao compartilhar um gráfico).
