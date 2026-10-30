# Mobbin — fintechs de pagamento, cartão e divisão (28/10/2026)

Complemento do [estudo de telas](../2026-10-28-estudo-telas-mobbin.md). Ele não
repete o que o [padroes.md](padroes.md) já registrou: os saldos e grupos do
Splitwise, a linha do tempo de parcelas da Klarna, o paywall da Cleo, o recibo
da Brex e o envio de arquivo da Wise. Aqui o foco são as fintechs de
pagamento: o que elas fazem com status, fatura, divisão, captura e IA.

Como ler:
- Toda tela citada tem link para o Mobbin (o link só abre com a conta do Mobbin).
- As imagens baixadas estão em [`fintechs/`](fintechs/).
- O que é opinião está marcado como **julgamento**.
- Lembrete do contexto: nós **não movemos dinheiro e não conectamos banco**.
  Quase tudo de transferência, saque e investimento fica de fora.

## 1. Cobertura

| App | iOS | Web | Observação |
|---|---|---|---|
| Wise | ~20 telas | ~16 telas | a melhor cobertura; o web é forte (barra lateral, insights, divisão) |
| Cash App | ~25 telas | — | inclui o assistente de IA (jul/2026) |
| PayPal | ~10 telas | ~8 telas | o web capturado é quase todo da conta empresa (faturas, recorrência) |
| Venmo | ~7 telas | — | sem as telas de Grupos |
| Klarna | ~20 telas (3 fluxos) | — | |
| Apple Wallet (Apple Card) | ~12 telas | — | sem o Apple Card Family e sem as parcelas mensais |
| Cleo | ~18 telas | — | o chat e o orçamento |
| Splitwise | ~18 telas (2 fluxos) | — | o lançamento e a divisão; os saldos já estão no padroes.md |
| Expensify | — | ~10 telas | recibos e relatórios |
| **Robinhood** | **ausente** | **ausente** | as buscas devolvem Phantom, Public e Cash App |
| **Ramp, Brex** | ausentes nesta rodada | ausentes | no lugar vieram Navan, Midday, Mercury, Revolut Business e QuickBooks |

## 2. Por app

### Wise

**Navegação.** No iOS, uma barra de quatro abas (Início, Cartão, Destinatários,
Pagamentos). No web, a barra lateral com Pagamentos aberto em subitens
(Agendados, Débitos diretos, Pagamentos recorrentes no cartão, Pedidos, Dividir
conta) e Insights. As ações principais são três pílulas no topo: Enviar,
Adicionar, Pedir.

**Painel.** O saldo total vem em cima, com um ícone de gráfico ao lado; depois
vêm os cartões por moeda, "Tarefas" ("Lee pediu 1 SGD — Revisar") e as
transações. O olho do canto troca todos os valores por `****`
([saldo visível](https://mobbin.com/screens/7e0d7d7a-a184-42f0-87dc-6be74cf68a2a),
[saldo oculto](https://mobbin.com/screens/0a9eff62-9a44-4f72-b5db-b4d2f6e1f564),
[tarefas](https://mobbin.com/screens/091bf508-6807-466b-aa28-0466d43afebd)).
No web, o mesmo painel tem colunas
([web](https://mobbin.com/screens/d9223593-f3c2-4a80-819e-959b17c68b82)).

**Status de uma operação.** O detalhe da transferência tem duas abas,
"Atualizações" e "Detalhes". Em Atualizações, cada etapa é uma linha com data
e hora: "você criou", "recebemos", "o dinheiro está sendo processado" (a etapa
atual em negrito, com ponto verde), "pagamos" e "fulano recebe". As futuras
ficam em cinza vazado
([em andamento](https://mobbin.com/screens/d7da9beb-2dd6-4e38-8efd-a08113f32614),
[concluída](https://mobbin.com/screens/90f9308a-90f2-41c0-8472-18629f1b796d)).
Quando cancela, a aba vira uma frase: "Seu dinheiro será devolvido… costuma levar
3–5 dias úteis"
([cancelada](https://mobbin.com/screens/56c4cec9-a5e9-4e2c-b60b-f4a2493cf5ce)).
O ⋯ do detalhe tem "Ocultar esta atividade" e "Excluir dos Insights"
([folha](https://mobbin.com/screens/f13100db-1e46-4b0e-aa78-77abb2fce0bc)).

**Detalhe e anexo (web).** Os dados da transação ficam à esquerda; à direita, a
nota ("algumas notas para te ajudar depois") e o anexo, com os formatos e o
limite ditos ("PDF, JPG, HEIC, XLS… menos de 10MB"). A categoria é uma pílula
editável no cabeçalho. Ocultar devolve um toast "Atividade oculta · Desfazer"
([detalhe web](https://mobbin.com/screens/cdebb2c8-108a-4a6c-9436-98b9725a15b9)).
A lista do web tem busca, Filtros (com contagem) e Download
([transações](https://mobbin.com/screens/2930c3d1-40a7-45ac-95a1-b9dea8652ea2)).

**Insights (web).** Barras por mês com o mês atual em preto, "média mensal" e
"gasto em janeiro" lado a lado, e categorias com barra e porcentagem
([insights](https://mobbin.com/screens/a48799b7-4e7c-4a57-a568-10f4c37fb8ff)).

**Dividir conta (web).** São três passos numa barra de progresso (Transação ·
Divisão · Revisão). Primeiro, escolher **a partir de uma transação que já
existe**, ou "outra coisa", manualmente
([escolher](https://mobbin.com/screens/70f0709e-0576-4366-8f09-e108d1f660a3)).
Depois, pessoas com o valor de cada uma e o rótulo "Pagou" / "Te deve"
([dividir](https://mobbin.com/screens/3e052b07-41ac-4604-a1f9-a9e6eb66da6f)),
e por fim a revisão
([revisão](https://mobbin.com/screens/3ba942ac-6cce-4335-932f-7bb736f99e30)).
A divisão criada mostra "0 USD recebido" numa barra, quem foi cobrado e "Sua
parte — Pago"
([divisão](https://mobbin.com/screens/adcb01ab-310e-43c7-a3ed-212f2819dff4)).

**Papéis (conta compartilhada).** "As transferências dessa pessoa precisam de
aprovação?" vem como um segmento (Nenhuma · 1 aprovação · 2 aprovações). Embaixo,
um diagrama de dois passos (cria → enviada) e o que muda, em frases
([aprovação](https://mobbin.com/screens/b3a285ca-491a-4525-ba77-3e9beff0f448)).
O limite mensal e as permissões são interruptores com uma explicação longa
([limites](https://mobbin.com/screens/20374897-e0dc-4d88-b413-8bac8b92d552)).

**Segurança.** O cartão congelado aparece no próprio desenho do cartão
("Frozen"), e o botão vira "Descongelar"
([congelado](https://mobbin.com/screens/bcdd5fa6-68ae-47df-83f4-cf217aba4a9c)).
O **Kill Switch** diz em três tópicos o que faz: sai de todos os aparelhos,
congela os cartões e cancela o pendente
([kill switch](https://mobbin.com/screens/bb23b4d6-9259-4225-ba87-055e4adc81bc)).

**O que é bom.** O status em etapas com hora; o "excluir dos insights" no
detalhe; o anexo que diz o que aceita; a divisão que nasce de uma transação.

### Cash App

**Navegação.** Uma pílula flutuante de três abas: o **saldo como rótulo da aba**
("$2"), o teclado ($) e a atividade (relógio)
([início](https://mobbin.com/screens/18b40898-3971-46f3-9604-f1b875183119)).
O olho esconde o saldo, que vira `●●●●`
([oculto](https://mobbin.com/screens/e9ab5758-292c-4dd3-b9fe-505bda4e9df4)).

**Lançar.** A aba central é o teclado em tela cheia, com o valor gigante e
três botões: Pool, Pedir, Pagar
([teclado](https://mobbin.com/screens/f9cec454-e8b9-4ee5-aede-9ee842863eb9)).
Pagar e pedir abrem uma folha "Pagar **para**" com o teclado
([folha](https://mobbin.com/screens/468e7290-291c-4e36-9a5d-be5e5934e897)).

**Atividade.** "Pendente" vem separado de "Hoje" / "Este mês", com a ação na
linha ("Get It Now"). A falha aparece riscada, com "Failed" na legenda.
Dispensar mostra o toast "Mensagem dispensada · Desfazer"
([atividade](https://mobbin.com/screens/bced5f41-f392-42c1-843f-ca75423c2ecc)).

**Assistente de IA (2026).** A tela preta tem o campo "Eu quero…" e o aviso fixo
"A IA pode errar, confira as respostas". Vazia, ela sugere três perguntas
("Estou gastando mais esta semana?")
([sugestões](https://mobbin.com/screens/56ff5f1d-e0ad-4657-90e3-ab6ba37081e2)).
Para "quanto posso gastar esta semana", ela mostra "Connecting the dots"
([carregando](https://mobbin.com/screens/8bd8633c-b469-43b3-84d9-91bef8063671))
e depois **a transação que serviu de base, um gráfico "Net: +$16,95" com o
período, e a previsão em texto**: "previsão de 7 dias termina em US$ 0,91…
nenhuma conta recorrente vindo"
([gráfico](https://mobbin.com/screens/2d543e0f-4c65-44d5-8828-a35df58ba902),
[texto](https://mobbin.com/screens/ff659acb-042c-426c-ab5f-e376c58325c6)).
O suporte por robô é outro chat, com sugestões em pílulas
([suporte](https://mobbin.com/screens/a9d8caa7-7c28-4345-8b7e-32bceb383487)).

**O que é bom.** A resposta da IA traz a prova (a transação e o gráfico) antes da
frase. O teclado é a ação central. O desfazer aparece em toda dispensa.

### PayPal e Venmo

**PayPal iOS.** Cinco abas, com Enviar/Pedir num botão central redondo. Em
Atividade: a busca, os chips "Tudo · Compras · Enviado e recebido ·
**Assinaturas**", e "Pendente" separado de "Concluído", com Cancelar na linha
([atividade](https://mobbin.com/screens/5969e566-58ee-4417-bedc-be826d2a427a)).
O detalhe de um envio tem três ações redondas, "Enviar de novo · **Dividir
pagamento** · Mensagem", e depois "Ajuda": chat com o assistente, perguntas e
reportar
([detalhe](https://mobbin.com/screens/646c3322-377e-497d-a3a1-7887f933f5cc)).
A home é quase toda oferta e loja
([home](https://mobbin.com/screens/ba0daa06-d921-448f-ae72-d971d3529555)).

**PayPal web.** A Atividade tem filtros em chips (Data: este mês · Tipo · Status
· Moeda). O Tipo abre um popover de rádios, com "Pagamentos automáticos",
"Reembolsos" e "Transações reportadas"
([filtros](https://mobbin.com/screens/440666c7-48dd-40b1-9c4d-07aa57154fd4)).
Em Configurações › Pagamentos, "gerencie seus pagamentos automáticos"
([pagamentos](https://mobbin.com/screens/8c70add4-586f-49cd-ae0c-6935658e2ee1)).
A série recorrente de faturas é uma tabela: frequência, próxima ocorrência,
status e valor
([recorrente](https://mobbin.com/screens/57175a8b-eea5-43e0-9723-d9560c3a8d02)).

**Venmo.** O teclado de valor tem **÷ × − +**: dá para digitar "60/3" no valor
([teclado](https://mobbin.com/screens/361cb39b-29e3-4674-ad04-fffa700f94a2)).
Ao escrever a nota ("Coffee", "Ticket"), aparecem emojis sugeridos acima do
teclado
([nota](https://mobbin.com/screens/aa7dae7f-90e1-4974-a777-ced671226ab3)).
Cada pagamento declara a privacidade (Público / Privado) antes de enviar
([privacidade](https://mobbin.com/screens/2be187c9-ebe2-448b-b78c-c27d35038da8)).
O perfil de uma pessoa tem a aba **"Entre vocês"**, com o histórico só dos dois
([entre vocês](https://mobbin.com/screens/51d4b014-ac68-4b96-80b2-ef56296c58d1)).
As telas de Grupos do Venmo **não estão** no Mobbin.

### Klarna

**Navegação.** Pílula flutuante: Início, Pagamentos, Carteira, Mais.

**Pagamentos.** O topo diz "Total que você deve **US$ 43,69**" e, embaixo, "Todos
os próximos pagamentos estão agendados". Depois vêm atalhos (Todas as compras,
Devoluções e reembolsos, Insights, Entregas) e "Em andamento"
([fluxo Pagamentos](https://mobbin.com/flows/cb8b6681-068a-4724-8637-2f55c1b2fc88)).

**Plano de parcelas.** "US$ 8,75 a cada 2 semanas" vem com a linha do tempo de 4
pontos (na compra, em 2, 4 e 6 semanas) e o selo "0% de juros"
([confirmar plano](https://mobbin.com/screens/2d3fe1c9-c3c3-4ec8-8ba8-14a7d550c41a)).
A divulgação legal vem por extenso: o número de parcelas, as datas, "encargo
financeiro US$ 0,00"
([divulgação](https://mobbin.com/screens/4669a63b-f934-4de2-b5b7-51511797590f)).
Na **calculadora**, cada parcela é uma pizza que enche (¼, ½, ¾, cheia)
([calculadora](https://mobbin.com/flows/e9084420-c5f9-4567-aaf8-a448802af449)).

**Ciclo do mês.** Nos Insights, "Definir ciclo mensal" oferece "Mês do calendário"
ou "**Mês do salário**: começa na data em que você recebe". O dia é escolhido em
chips (24, 25, 26, 27, "Último dia do mês") e a prévia aparece ao lado ("junho:
25/mai – 24/jun"). A nota diz: "a data se ajusta sozinha em fins de semana e
feriados"
([salário](https://mobbin.com/screens/74b1ba91-0c40-4fff-a4f3-7f17fe7dab0f),
[calendário](https://mobbin.com/screens/0c454f50-2831-4dc0-bf95-9a75b58dcbca)).

**Privacidade de uma compra.** No detalhe, dá para ocultar a informação do
produto, com o toast "A informação do produto desta compra foi ocultada".
A categoria também é editável ali ("Viagem Outros ✎")
([oculto](https://mobbin.com/screens/99888eb8-4008-4de0-92b2-656c62c4c3a6),
[detalhe](https://mobbin.com/screens/6194e9d4-7d29-4c06-8bf6-d6bf522f980c)).
O número do cartão some na gravação de tela ("Card details are not visible
during screen recording").

### Apple Wallet (Apple Card)

**Cartão.** Embaixo do cartão, quatro blocos: Saldo do cartão (com o
disponível), **Pagamento vence 1 abr** + "Pagar antes", Atividade do ano, e a
lista "Últimas transações". Com tudo pago, o bloco vira "Nada a pagar ✓"
([com saldo](https://mobbin.com/screens/23c06c82-2da7-4f30-9458-3e7c7e95b179),
[nada a pagar](https://mobbin.com/screens/4c236223-264b-41bc-89ba-bee98aa99b49)).

**Pagamento com juro à vista.** É uma roda: ao escolher o valor, o centro mostra
"**US$ 0,06 de juros em 1 abr**" e a legenda diz "Diminua seus juros". Os botões
são "Agendar" e "Pagar US$ 10"
([roda](https://mobbin.com/screens/e4d05cdc-2267-4205-9e65-8a3ea40dcba0)).

**Detalhe do saldo e faturas.** Saldo de janeiro, + Novos gastos, − Pagamentos e
créditos, e a nota "novos gastos incluem as pendentes". Depois o limite, o
saldo total, o disponível e a lista de **Faturas** por mês
([detalhe](https://mobbin.com/screens/88caae53-8c0f-4247-b60e-1a5a0646b0ad)).
A fatura do mês é uma conta de chegada: saldo anterior, novos gastos, **encargos
de juros**, pagamentos e créditos. Embaixo, "Baixar fatura em PDF" e "Exportar
transações"
([fatura de janeiro](https://mobbin.com/screens/607b55a8-585f-4e33-9997-25bea22b23c3)).

**Atividade.** Semana / Mês / Ano em segmento, barras por dia e "Por categoria ·
Por estabelecimento"
([semana](https://mobbin.com/screens/82a32fee-bf5f-4c39-b4b8-0e002de68d4c)).
Buscar por "Food & Drink" vira um token no campo e agrupa o resultado em
Transações, Estabelecimentos e Locais
([busca](https://mobbin.com/screens/2396ddf1-a390-4aab-9c4d-69f7f84271d6)).

**Detalhe da transação.** Status: Pendente, câmbio, total. Depois "**Aparece na
fatura como:** starbucks@f'polis(fps)", o mapa, a categoria editável e "Reportar
um problema"
([detalhe](https://mobbin.com/screens/3b29e0d1-9ce1-4b0b-83aa-d394a3de3017)).

**Não encontrado:** o Apple Card Family (co-titular e participantes), as Parcelas
Mensais e a tela "Pagar o mínimo × total" com a estimativa de juros anual. A
busca por elas devolve Wise, GoHenry, Greenlight e Revolut.

### Cleo

**Navegação.** Seis abas (Gastos, Orçamento, Chat, Poupar, Empréstimo,
Hábitos), com o Chat no centro.

**Chat.** "Posso comprar isso?": pergunta o valor e responde "você está gastando
US$ 9,05 por dia, o saldo é US$ 58,96. **Pode gastar US$ 20.**", com um botão
"Definir renda"
([posso gastar](https://mobbin.com/screens/0f720f72-c280-45ee-afb5-1a85728f96fa)).
Os resumos vêm em texto puro: "+ US$ 331 Renda − US$ 201 Gasto = US$ 129". Os
desdobramentos vêm em pílulas ("por categorias", "por estabelecimento", "para o
meu feed")
([resumo](https://mobbin.com/screens/c9fc6adc-37a7-435b-baff-5ca70c720ea4)).
Categorizar também é conversa: "US$ 170 em E Transfer… É alguma destas?", com as
categorias em pílulas
([categorizar](https://mobbin.com/screens/2b301b36-7501-41a4-84ef-348ccd6a036a)).
O onboarding é conversa com respostas em pílulas de humor ("não muito ☀️ …
tudo e mais um pouco 🌧")
([onboarding](https://mobbin.com/screens/44af2edb-67d5-42ab-b73e-83bb8793d1b8)).

**Orçamento.** "Detalhamento de fevereiro: 11 dias restantes", Entrou × Saiu em
pilhas de moedas, com "Limite", "Gasto" e "A vencer". Depois "**US$ 1.274 até
US$ 1.463 ✎**" e "**US$ 115,90 por dia**"
([orçamento](https://mobbin.com/screens/a822a300-6318-4db7-8e54-a4a42ab91626)).
As "Contas a vencer" separam o que cai neste ciclo das "contas futuras"
([contas](https://mobbin.com/screens/9224a5eb-dc3a-4d9b-b17b-e43aff643c01)).
Uma seção "**Ignorando**" mostra o que foi excluído, com "Algo errado?"
([ignorando](https://mobbin.com/screens/c0e62c97-f74e-41b8-9411-6f85016c7f0e)).

**Tom.** Gírias, GIFs e emojis, até 💀 em "Contas". **Julgamento:** não serve
para a família brasileira de 30–45 anos nem para "premium transparente". Da Cleo
fica a forma (prova + frase + ação), não o tom.

### Splitwise

**Navegação.** Amigos, Grupos, Atividade, Conta.

**Lançar despesa.** Descrição, valor e **uma frase-botão: "Pago por você e
dividido igualmente"**. Na faixa de cima do teclado: data ("Hoje"), grupo,
câmera e nota
([lançar](https://mobbin.com/screens/363e8a79-6a6d-405f-9767-33f6232bf972)).
Tocar na frase abre **quatro atalhos em frases completas**: "Você pagou, dividido
igualmente. Sam te deve US$ 10" · "Você deve o valor inteiro" · "Sam pagou,
dividido igualmente" · "Sam deve o valor inteiro", e "Mais opções"
([atalhos](https://mobbin.com/screens/836c3b1f-c0f0-47c4-8b2a-e5fa9f9f5c27)).
Em Mais opções, a divisão tem cinco modos: igual, valores exatos, %, cotas e
ajuste ±. O rodapé fecha a conta ("US$ 20 de US$ 20 · US$ 0 restante")
([igual](https://mobbin.com/screens/a3b1b86d-5f8e-4c44-9dca-1a297ecd0591),
[exato](https://mobbin.com/screens/d3cd7701-4eba-43ab-9dfb-957502d64c95)).

**Divisão padrão do grupo.** Vale "para todas as novas despesas que você
adicionar a este grupo" e "não afeta as adicionadas pelos outros". As **cotas**
vêm explicadas com o exemplo "família de 3 → 3 cotas"
([cotas](https://mobbin.com/screens/f546eb42-f44f-4e1e-9c2a-fb5590d628f6),
[%](https://mobbin.com/screens/bb738db1-0c1f-47cb-b156-a1cb75131e56)).

**Recibo com itens.** A foto vira "Confirmar itens": a miniatura do recibo,
subtotal, imposto e total, e cada item numa linha editável, com "Adicionar item"
([itens](https://mobbin.com/screens/ba220c78-9ede-4bd0-ba41-16c6476716fa),
[fluxo](https://mobbin.com/flows/973eb780-6f72-4489-8bf5-da466a4c4bf3)).

**Acerto.** "Registrar um pagamento": dois avatares com uma seta e "Você pagou
John D. US$ 180"
([acerto](https://mobbin.com/screens/d6afe93d-62f4-46f4-88f1-54430380c8e0)).

### Expensify (web) e outros de recibo

- **Expensify.** Coluna de miniatura do recibo em cada linha; quem não tem
  recibo mostra um papel com "?". Os status são chips coloridos (Aberto,
  Processando, Aprovado, Reembolsado), e os filtros sobem em painel
  ([lista](https://mobbin.com/screens/959b1c6c-db26-4f75-8871-bdcb8b363001),
  [filtros](https://mobbin.com/screens/c8b550ac-027e-4004-994d-e60db5119ce9)).
  "Nova despesa" abre um menu: Criar manualmente, Escanear recibo, Criar várias
  ([menu](https://mobbin.com/screens/32b696bd-84fb-4cb6-bba3-5821903fe01e)).
  Durante o OCR, os campos dizem "Escaneando…" no lugar do valor
  ([escaneando](https://mobbin.com/screens/fe23aaa2-6388-4e95-88de-768a44bbe4e3)).
  Um aviso fixo diz o próximo passo: "Esperando **você** enviar"
  ([próximo passo](https://mobbin.com/screens/a2bcf94c-ea45-4f6d-b87e-cb1a7ed7c357)).
- **Revolut Business:** o recibo PDF com "**Match found**" e a despesa
  correspondente, "Confirmar correspondência"
  ([match](https://mobbin.com/screens/1180d5ee-a7bc-45f2-bb0f-03a09b51859a)).
- **Midday:** uma caixa de recibos com "Pendente" e, no ⋯, "Tentar
  correspondência de novo"
  ([inbox](https://mobbin.com/screens/d11fa826-89e7-4937-8a87-4bb836336577)).
- **Mercury:** "Descrição do banco: GOOGLE *GSUITE_forma-a" no detalhe, como o
  "Aparece na fatura como" da Apple
  ([detalhe](https://mobbin.com/screens/b315af47-c926-4be0-8e5f-182a270d2430)).

## 3. Aplicável ao nosso app

Ordenado por impacto. Esforço: P (dias), M (1–2 semanas), G (mais). Tudo é
**julgamento**. O que muda tela entra primeiro como wireframe (`AGENTS.md`).

1. **A fatura como conta de chegada, com o PDF ao lado.** Diferencial: *a
   fatura que bate*. Copiar a fatura do mês do Apple Card: saldo anterior +
   compras + juros/encargos − pagamentos e estornos = total. Cada linha é
   clicável até os lançamentos, e "Baixar PDF" e "Exportar" ficam no pé. Onde
   não bater, a diferença entra como uma linha a mais ("Diferença com o PDF:
   R$ 12,40 → ver"). Esforço **M**. Aplicável: sim. É a forma mais curta de
   provar que o número bate.
2. **"Aparece na fatura como".** Diferencial: *conferir o PDF*. O detalhe do
   lançamento mostra o texto cru da fatura ("IFD*IFOOD SAO PAULO") ao lado do
   nome bonito (Apple, Mercury). É a chave para a pessoa casar a linha do PDF
   com o lançamento, e para a regra "sempre que vier X, é Y". Esforço **P**
   (campo + exibição; vem do import da fatura). Aplicável: sim.
3. **O juro de pagar menos, mostrado no valor.** Diferencial: *fatura e juros,
   cobrança honesta*. A roda do Apple Card adaptada a "quanto vou pagar desta
   fatura": ao digitar o valor, aparece "Pagando R$ X, o rotativo deve custar
   ~R$ Y até a próxima fatura". Nós não pagamos nada, então é **simulação e
   registro** do pagamento. Esforço **M**: precisa da taxa do cartão, que a
   pessoa informa ou que vem do PDF. Aplicável: adaptado. Sem a taxa real, o
   número tem de vir marcado como estimativa, ou viola "número errado é pior
   que nenhum".
4. **Status em etapas para o que a IA lançou.** Diferenciais: *captura sem banco*
   e *Piloto Automático visível*. Copiar as Atualizações da Wise no detalhe do
   lançamento capturado: "Recebido por mensagem 14:02 · Lido pela IA ·
   Categoria sugerida · Conferido por Ana · Bateu com a fatura de nov".
   Também serve para a parcela ("3 de 10 · próxima na fatura de dez") e para o
   estorno esperado ("Pedido 10/out · esperado na fatura de nov · ainda não
   chegou"). Esforço **M**. O componente `Timeline` do DS já tem `state`
   done/current/upcoming. Aplicável: sim.
5. **Lançar a divisão em uma frase.** Diferencial: *família — quem pagou e
   acerto*. Copiar o Splitwise: no lançamento, uma frase-botão "Pago por você,
   dividido igualmente com Ana", que abre quatro atalhos em frase completa e
   "mais opções" (valor exato, %, cotas). A divisão padrão fica por carteira,
   com o texto "vale para os novos lançamentos". As cotas servem a "casa de 3"
   com dois adultos. A Wise acrescenta a **divisão a partir de um lançamento que
   já existe**. Esforço **M**. Aplicável: sim; já está na direção do
   padroes.md, e a novidade é a forma.
6. **Ciclo pelo dia do salário.** Diferencial: *saber quanto ainda dá*. O "Mês do
   salário" da Klarna, com chips do dia, a prévia do intervalo e o ajuste para
   dia útil. Para o público CLT brasileiro (5º dia útil), "o salário some antes
   do dia 20" se mede melhor do pagamento ao próximo pagamento. Esforço **M**:
   mexe em orçamento, painel e relatórios. Aplicável: sim; o "5º dia útil" é
   uma opção a mais que a Klarna não tem.
7. **A IA responde com a prova.** Diferenciais: *captura por frase/IA* e
   *avisar e explicar*. Copiar o Cash App: a resposta traz o lançamento ou o
   gráfico de base, depois a frase e uma ação (Cleo: "Pode gastar R$ 20" +
   "Definir renda"). Vazia, a tela sugere três perguntas, e o aviso "a IA pode
   errar" fica fixo. Esforço **M**. Aplicável: sim; sem o tom da Cleo.
8. **"Excluir da análise" e "Ignorando".** Diferencial: *orçamento por
   categoria*. Um item no ⋯ do lançamento (Wise "Excluir dos Insights") e uma
   seção no fim do orçamento com o que está fora, mais "Algo errado?" (Cleo). É
   o reembolso da empresa, a transferência entre carteiras e a compra do
   parente. Esforço **P**. Aplicável: sim.
9. **Anexo com o que aceita, e o recibo na linha.** Diferencial: *foto de
   comprovante, dados da pessoa*. O campo de anexo diz formatos e limite (Wise);
   a lista mostra a miniatura do comprovante, ou um "?" onde ele falta
   (Expensify). Durante a leitura, os campos dizem "Lendo…". O recibo com itens
   (Splitwise) serve para dividir o mercado. Esforço **P** para o anexo e a
   miniatura, **G** para os itens. Aplicável: sim no P; adaptado no G (é bom
   para a divisão, mas pouca gente vai itemizar).
10. **Ocultar valores e a privacidade de uma compra.** Diferencial: *privacidade
    entre adultos, dados da pessoa*. O olho que troca todos os valores por
    `••••` (Wise, Cash App) e mostrar o app em público. Atenção: a carteira é
    pública entre adultos (decisão do dono), então o "ocultar produto" da
    Klarna **não** vira gasto privado. Vira só "ocultar a descrição na tela" da
    própria pessoa, ou nada. Esforço **P** para o olho. Aplicável: o olho sim;
    o ocultar por compra, não, contra a regra da carteira.
11. **"Sair de todos os aparelhos" em um toque.** Diferencial: *seus dados são
    seus; medo de celular roubado*. Do Kill Switch da Wise fica só a parte que
    nos cabe: encerrar as sessões e pedir a senha de novo, explicado em
    tópicos. Esforço **P** (o Supabase tem `signOut({ scope: 'global' })`).
    Aplicável: adaptado; não há cartão para congelar.
12. **O resumo de pagamentos em uma frase de estado.** Diferencial: *contas a
    pagar, parcelas*. A Klarna diz "Total que você deve R$ X" e "Todos os
    próximos pagamentos estão agendados". O nosso seria "Faltam R$ 3.210 em
    parcelas · próxima: R$ 412 na fatura de 10/nov". A Apple troca o bloco por
    "Nada a pagar ✓" quando zera. Esforço **P**. Aplicável: sim.
13. **Pendente separado do confirmado, com desfazer.** Diferencial: *fila "a
    conferir"*. Cash App e PayPal separam "Pendente" em cima, com a ação na
    linha, e toda dispensa tem "Desfazer" no toast. A nossa caixa "a conferir"
    pode ser o "Pendente" do topo da lista, e não uma tela à parte. Esforço
    **P**. Aplicável: sim.
14. **Teclado de valor que faz conta.** Diferencial: *lançar sem esforço*. O ÷ ×
    − + do Venmo, para "180/3" ou "45+12,90". Esforço **P** no `Input money`,
    mas é mudança de componente do DS e pede o ok do dono. Aplicável: sim; no
    PWA o teclado é o do sistema, então é preciso aceitar a expressão digitada.
15. **"Entre vocês".** Diferencial: *família — acerto*. A aba do Venmo no perfil
    de uma pessoa, com só os lançamentos e acertos entre as duas, serve para
    "o que eu e a Ana temos a acertar". Esforço **P/M**. Aplicável: adaptado.
16. **Filtros em chips com popover, e "Assinaturas" como filtro.** Diferencial:
    *assinaturas*. PayPal: os chips Data · Tipo · Status, e "Assinaturas" como
    chip da Atividade, em vez de só uma tela separada. Esforço **P** (o
    `FilterBar` já existe). Aplicável: sim.
17. **Aprovação por papel.** Diferencial: *família — filho-convidado*. O
    segmento da Wise "Nenhuma · 1 aprovação" com o diagrama "cria → enviada"
    vira "os lançamentos do Pedro precisam ser conferidos por um adulto?".
    Esforço **M**. Aplicável: adaptado; casa com o papel que só lança.

## 4. Não aplicável

- **Mover dinheiro:** enviar, pedir, sacar, converter, Pool, "Get It Now",
  "Repetir esta transferência", "Pagar antes" de verdade, autopay e o teclado
  como aba central de pagamento. Nós não movemos dinheiro. (O teclado como
  *lançar* é outra coisa; ver o item 14.)
- **Congelar o cartão, controles do cartão, PIN, ocultar o número na gravação de
  tela:** não temos cartão.
- **Cripto, ações, juros sobre saldo, "Total returns" (Wise, PayPal, Cash App):**
  fora do produto.
- **Ofertas, cashback e lojas na home (PayPal, Klarna):** a home do PayPal é
  vitrine. É o oposto de "premium transparente" e de não vender dado.
- **Feed social e privacidade "Público" do Venmo:** não há rede social; a
  carteira é da família.
- **Limite e aprovação de gasto por cartão (Wise para outra pessoa, Greenlight,
  Revolut Business):** só se aplica a quem emite cartão. O aplicável é o papel
  de lançar (item 17).
- **O tom da Cleo:** gíria, GIF, 💀 e "hype mode" não combinam com o ICP nem com
  o "sem sermão" sério.
- **Truth in Lending da Klarna:** o formato é legal dos EUA. O espírito (o custo
  total dito) já está no item 3.
- **O web da PayPal Business (faturas a clientes, ferramentas):** é para
  vendedor.
- **Robinhood:** ausente do Mobbin, nada a avaliar.

## 5. O que não foi encontrado

- **Robinhood** (iOS e web), **Ramp** e **Brex** nesta rodada (a Brex já tem uma
  tela no padroes.md).
- **Apple Card:** Family (co-titular, participantes, limites), Parcelas Mensais
  e a escolha mínimo × total com o juro anual.
- **Venmo:** Grupos (despesa dividida e saldo do grupo).
- **Cash App e Venmo web:** sem capturas de web.
- **Onboarding, verificação e paywall** destes apps: não buscados a fundo. O
  paywall da Cleo já está no padroes.md, e os outros não vendem assinatura de
  finanças pessoais.

## 6. Imagens baixadas (`fintechs/`)

| Arquivo | Tela | Mobbin |
|---|---|---|
| `wise-ios-linha-do-tempo.webp` | status em etapas com hora | [link](https://mobbin.com/screens/d7da9beb-2dd6-4e38-8efd-a08113f32614) |
| `wise-ios-aprovacao.webp` | aprovação por pessoa | [link](https://mobbin.com/screens/b3a285ca-491a-4525-ba77-3e9beff0f448) |
| `wise-ios-kill-switch.webp` | sair de tudo em um toque | [link](https://mobbin.com/screens/bb23b4d6-9259-4225-ba87-055e4adc81bc) |
| `wise-web-dividir-conta.webp` | dividir a partir de uma transação | [link](https://mobbin.com/screens/3e052b07-41ac-4604-a1f9-a9e6eb66da6f) |
| `wise-web-detalhe-anexo.webp` | detalhe com nota, anexo e desfazer | [link](https://mobbin.com/screens/cdebb2c8-108a-4a6c-9436-98b9725a15b9) |
| `cashapp-ios-assistente-previsao.webp` | IA: previsão com prova | [link](https://mobbin.com/screens/ff659acb-042c-426c-ab5f-e376c58325c6) |
| `paypal-ios-atividade-filtros.webp` | atividade com chips e pendente | [link](https://mobbin.com/screens/5969e566-58ee-4417-bedc-be826d2a427a) |
| `klarna-ios-ciclo-salario.webp` | ciclo pelo dia do salário | [link](https://mobbin.com/screens/74b1ba91-0c40-4fff-a4f3-7f17fe7dab0f) |
| `klarna-ios-ocultar-compra.webp` | ocultar a informação da compra | [link](https://mobbin.com/screens/99888eb8-4008-4de0-92b2-656c62c4c3a6) |
| `applewallet-ios-juros-pagamento.webp` | roda de pagamento com o juro | [link](https://mobbin.com/screens/e4d05cdc-2267-4205-9e65-8a3ea40dcba0) |
| `applewallet-ios-fatura-mes.webp` | fatura do mês como conta de chegada + PDF | [link](https://mobbin.com/screens/607b55a8-585f-4e33-9997-25bea22b23c3) |
| `applewallet-ios-detalhe-transacao.webp` | "Aparece na fatura como" | [link](https://mobbin.com/screens/3b29e0d1-9ce1-4b0b-83aa-d394a3de3017) |
| `cleo-ios-posso-gastar.webp` | "Pode gastar R$ X" no chat | [link](https://mobbin.com/screens/0f720f72-c280-45ee-afb5-1a85728f96fa) |
| `splitwise-ios-presets-divisao.webp` | quatro atalhos de divisão em frase | [link](https://mobbin.com/screens/836c3b1f-c0f0-47c4-8b2a-e5fa9f9f5c27) |
| `splitwise-ios-cotas-familia.webp` | divisão padrão do grupo por cotas | [link](https://mobbin.com/screens/f546eb42-f44f-4e1e-9c2a-fb5590d628f6) |
| `splitwise-ios-recibo-itens.webp` | recibo lido em itens | [link](https://mobbin.com/screens/ba220c78-9ede-4bd0-ba41-16c6476716fa) |

A pasta `fintechs/` também tem arquivos de outro estudo em paralelo (Monzo,
Revolut, N26, Starling, Chime), que não são citados aqui.
