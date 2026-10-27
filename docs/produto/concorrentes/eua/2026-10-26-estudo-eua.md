# Estudo consolidado: os concorrentes americanos (26/10/2026)

Escopo: os 9 apps dos dossiês desta pasta (Rocket Money, Monarch Money, YNAB,
PocketGuard, Empower Personal Dashboard, Quicken Simplifi, Honeydue, Copilot
Money, EveryDollar), lidos contra o nosso produto
([estratégia](../../2026-10-21-estrategia-de-produto.md),
[ICP](../../2026-10-20-icp.md) e
[proposta funcional](../../../superpowers/specs/2026-10-20-proposta-funcional-design.md)).

Como ler:
- Todo número vem dos dossiês ou da [checagem](2026-10-26-checagem.md). Onde os
  dois divergem, **vale a checagem**.
- O que é opinião minha está marcado como **julgamento**; o que ainda precisa de
  prova está marcado como **[hipótese]**. O que a fonte não confirmou segue com
  **[não confirmado]**.
- Nenhuma pesquisa nova foi feita para este estudo; não há URL nova. O §7
  (aquisição) vem dos três arquivos de aquisição e da contagem de anúncios na
  Meta desta pasta.
- Nota de produto (26/10/2026): o "gasto privado entre adultos" saiu do
  desenho. Numa carteira, todo adulto vê tudo; quem quer privacidade cria outra
  carteira; o convidado (filho) vê e lança só o que é dele. O texto abaixo já
  segue essa regra.

---

## 1. Sumário executivo

O mercado americano de finanças pessoais é grande, maduro e organizado em
torno de um pressuposto: **conectar o banco por agregador (Plaid, MX, Finicity,
Yodlee) é o normal**. Os 9 apps estudados conectam; 8 vivem disso. Com o fim
do Mint (03/2024), o dinheiro se concentrou: a Monarch passou de 1 milhão de
membros e US$ 100 mi de ARR (10/2026), o Rocket Money tem 403 mil notas na App
Store e dono de US$ 1,3 bi, o YNAB manda no "método". O preço de referência
do app pago é **US$ 75 a 110 por ano** (PocketGuard 74,99; Simplifi 83,88 cheio;
Copilot 95; Monarch 99,99; YNAB 109), com teste de 7 a 34 dias e, em geral,
cartão pedido. Grátis existe (Empower, EveryDollar manual, Honeydue, Rocket
limitado), sempre subsidiado por outra coisa: gestão de patrimônio, rádio,
anúncios ou negociação de contas.

A reclamação nº 1 de todos os 9 é a mesma: **o sync do banco quebra**. A
segunda, cobrança (renovação sem aviso, cobrança após cancelar, teste curto). A
terceira, família: o melhor do mercado (Monarch) diz na própria ajuda que "não
dá para esconder nada de um membro" e não tem papel de filho; Simplifi aceita
**uma** pessoa extra; PocketGuard e Copilot não têm casal; Honeydue, o app "de
casal", está em manutenção.

**O espaço que sobra** é exatamente o nosso desenho: família com papéis
(adultos, filho-convidado, limite por pessoa, quem pagou e acerto), captura sem
banco por mensagem, voz, foto e Apple Pay, cobrança honesta e dados que são da
pessoa. **O que não se transfere** é o nosso argumento nº 1 do Brasil: a
"fatura que bate" com parcelas. O cartão americano não parcela, e o
"statement" é menos central.

**Aquisição (§7):** quatro modelos aparecem. Rocket, Monarch, EveryDollar e
Quicken compram mídia nas redes (78 a 150 anúncios ativos na Meta cada, em
26/10/2026), cada um com caixa por trás; o YNAB cresce por marca e comunidade
sem anúncio nenhum; Empower, Ramsey e Rocket usam o app como funil de outro
negócio; o Honeydue cresceu pelo convite do parceiro. O nosso modelo é o do
YNAB com o convite da família como viral, sem mídia paga antes de medir o
LTV.

**Recomendação (julgamento):** não lançar nos EUA antes de o produto brasileiro
estar fechado (blocos 1–7) e de validar barato: landing page em inglês com
preço, lista de espera e 15 a 20 entrevistas em r/ynab, r/MonarchMoney e
r/mintuit. Posicionar como **o app de dinheiro da família que não pede a senha
do banco**, a US$ 79–99/ano para a casa toda (até 6 pessoas), teste de 14 dias
sem cartão. Oferecer CSV/OFX desde o dia 1 e decidir Plaid opcional só depois
das entrevistas. Reescrever o pitch do cartão para "o statement que bate" e
tratar parcelas como BNPL.

---

## 2. Mapa do mercado

| Segmento | O que vende | Quem está lá | Nota |
|---|---|---|---|
| **Orçamento por método** | Um jeito de orçar, com nome, educação e comunidade | **YNAB** (zero-based, "give every dollar a job"), **EveryDollar** (zero-based + Baby Steps do Dave Ramsey) | Os dois cobram pela disciplina; EveryDollar tem grátis manual |
| **"Quanto sobra para gastar"** (sub-segmento do orçamento) | Um número só: renda − contas − metas | **PocketGuard** ("In My Pocket"/Leftover + Pace), **Quicken Simplifi** ("Left This Month", Spending Plan projetado até 12 meses) | O mais próximo do nosso "seguro para gastar" |
| **Agregador "tudo num lugar"** | Contas, cartões, investimentos, patrimônio, relatórios, IA | **Monarch** (o líder pós-Mint), **Copilot** (premium de design, só Apple), Simplifi também cabe aqui | Monarch: 1 mi+ membros, US$ 100 mi ARR |
| **Assinaturas e contas** | Achar, cancelar e negociar | **Rocket Money** (ex-Truebill; concierge humano, taxa de 35–60% da economia) | Orçamento é secundário; PocketGuard e Monarch detectam mas não cancelam |
| **Patrimônio e aposentadoria** | Painel grátis como funil de gestão de patrimônio | **Empower** (ex-Personal Capital; 0,89% a.a. a partir de US$ 100 mil) | Orçamento é "um teto mensal só" |
| **Casal** | Transparência entre dois parceiros | **Honeydue** (grátis, anúncios, em manutenção); Monarch e YNAB Together como "casal sem custo extra" | **Ninguém faz família com filhos e papéis** |
| **Premium de design** | Acabamento nativo Apple | **Copilot** (Apple Design Awards finalista 2024, 4,8 com 31 mil) | Sem Android, sem casal |

Onde cada um está, em uma linha:
- **Rocket Money**: assinaturas e contas → "tudo-em-um"; grande (10 mi+
  downloads Android), dono Rocket Companies.
- **Monarch**: agregador tudo-num-lugar, líder; casal grátis; IA e MCP.
- **YNAB**: método; comunidade (~200 mil no r/ynab); 6 pessoas por assinatura.
- **PocketGuard**: "quanto sobra"; pequeno (~19 pessoas), estagnado
  **[hipótese do dossiê]**.
- **Empower**: patrimônio; grátis; app com 422 mil notas (mistura 401(k)).
- **Simplifi**: "quanto sobra" + agregador; preço de entrada baixo; dona PE.
- **Honeydue**: casal; grátis; só correções desde 2025.
- **Copilot**: design, Apple; lucrativo, 100 mil+ assinantes (03/2024).
- **EveryDollar**: método + canal de mídia (Ramsey: 18–20 mi ouvintes/semana);
  grátis manual.

---

## 3. Matriz de funcionalidades

Legenda: ✓ tem · ~ parcial · ✗ não tem · ? incerto/não encontrado. "Nós" é o
desenho da proposta funcional (blocos 1–7), não o que está no ar hoje.

| Capacidade | Rocket | Monarch | YNAB | PocketGuard | Empower | Simplifi | Honeydue | Copilot | EveryDollar | **Nós** |
|---|---|---|---|---|---|---|---|---|---|---|
| **Como o dado chega: banco** | ✓ Plaid, só leitura | ✓ Plaid, MX, Finicity; troca de provedor | ✓ Plaid, MX | ✓ Plaid, Finicity, Salt Edge | ✓ Yodlee | ✓ 14 mil inst.; Plaid/Finicity (checagem, via busca) | ✓ agregador ? (Plaid [hipótese]) | ✓ Plaid + MX, Mastercard, Akoya ? | ~ só no Premium (Plaid, Mastercard Connect) | ✗ por escolha |
| Manual | ? não encontrado | ✓ | ✓ todas as plataformas | ✓ | ~ só ativos (casa, cripto) | ✓ caminho de exceção | ✓ plano B | ~ modo demo; não é o fluxo | ✓ o grátis é 100% manual | ✓ |
| Importação de arquivo | ~ só export no Premium | ✓ CSV (só web) | ✓ OFX/QFX/QIF/CSV (web e iPad) | ✓ CSV (do Mint) | ✗ | ~ CSV só web, sem QFX | ✗ | ? | ✗ (queixa) | ✓ CSV/OFX + PDF da fatura |
| Captura sem banco (mensagem, voz, foto, Apple Pay) | ✗ | ~ recibo (foto, e-mail), extensão Chrome | ~ Siri/Atalhos só consulta saldo | ✗ | ✗ | ~ recibo só no Business | ✗ | ~ Atalhos ? | ✗ | ✓ WhatsApp texto/áudio/foto, Siri/Atalhos, Apple Pay, share Android, frase livre, "a conferir" |
| **Orçamento e método** | ~ básico; ilimitado no Premium | ✓ Flex ou Category, rollover | ✓ zero-based, rollover, targets | ✓ 4 métodos, rollover | ~ um teto mensal | ✓ Spending Plan, rollover opcional | ~ limite por categoria | ✓ limite por categoria, rollover opcional | ✓ zero-based, sem rollover por desenho | ✓ orçamento por categoria + limite por pessoa |
| "Quanto ainda dá para gastar" | ✗ | ~ fluxo de caixa; previsão só no Plus | ~ "Available" por categoria | ✓ In My Pocket/Leftover + Pace (mês) | ✗ | ✓ Left This Month, projeção 12 meses | ✗ | ~ | ~ "falta alocar" | ✓ seguro para gastar + previsão 6 meses + impacto da parcela |
| **Cartão: ciclo/fatura** | ✗ | ~ saldo da fatura e mínimo quando o banco informa; alerta de utilização | ~ categoria "Credit Card Payment"; sem ciclo nem parcela; match de pagamento | ✗ só conta ligada | ~ vencimento em "Bills" | ~ Credit Card Dashboard, Bill Connect | ✗ | ✗ | ✗ | ✓ ciclo, parcelas, estorno, PDF conferido (precisa de equivalente americano, ver §8) |
| Assinaturas (detecção) | ✓ + cancelar (concierge) e negociar | ✓ sem cancelar | ✗ | ✓ + cancelar via parceiro | ✗ | ✓ + alerta de aumento | ✗ | ✓ | ✗ (pedido) | ✓ detecção por recorrência + "assinatura mudou de preço" |
| Contas a pagar | ✓ alertas, aumento de conta | ✓ calendário, lembretes | ~ agendadas/targets | ✓ calendário | ~ Bills | ✓ lembretes, fluxo projetado | ✓ lembrete para os dois | ✓ recorrentes | ~ vencimento por linha; push no Premium | ✓ |
| Metas | ✓ Premium, Smart Savings | ✓ Goals (06/2026) | ✓ targets | ✓ | ~ planejadores | ✓ seis modelos | ✗ | ✓ IA sugere | ✓ sinking funds, roadmap | ~ projetos com orçamento total |
| Dívidas | ✓ paydown (Premium) | ✓ avalanche vs bola de neve | ✓ Loan Planner | ✓ snowball/avalanche, data livre | ~ planejador | ~ via IA (beta) | ✗ | ✗ | ✓ bola de neve, debt-free date | ✗ (lacuna) |
| Investimentos / patrimônio | ~ net worth Premium | ✓ + Plus (tax lots, Morningstar, Forecasting) | ~ contas de acompanhamento | ✗ | ✓ o núcleo (Monte Carlo, Fee Analyzer) | ✓ básico | ~ só saldo | ✓ sem tier extra | ✗ | ✗ (anti-ICP) |
| Score de crédito | ✓ grátis; relatório no Premium | ~ widget (VantageScore/Equifax) | ✗ | ✗ | ✗ | ? conflito de fontes | ✗ | ✗ | ✗ | ✗ |
| **Casal/família: pessoas** | ~ 2º login ("account sharing", Premium) | ✓ sem custo extra, n membros | ✓ até 6 (YNAB Together) | ✗ mesmo login | ✗ | ~ 1 pessoa extra (web) | ✓ 2 | ✗ Magic Link = acesso total (checagem) | ~ cônjuge (Household) | ✓ até 6 |
| Papéis | ? | ✓ Admin / Member / Professional (só leitura) | ~ Manager / membro | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ dono / membro / convidado |
| O que cada um vê | ? | tudo ("não dá para esconder"); Shared Views filtra por dono em 4 telas, não em Orçamento/Metas | tudo no plano compartilhado; gerente vê planos dos membros | tudo | n/a | tudo | ✓ escolhe por conta (saldo, transações ou nada) | tudo | tudo (orçamento do dono) | adultos tudo; convidado só o dele; carteira separada = privacidade |
| Filhos | ✗ | ~ "filho" como membro com visão total | ~ "ensinar adolescentes" pelo plano compartilhado | ✗ | ✗ dado do planejador | ✗ | ✗ | ✗ | ✗ | ✓ convidado: lança e vê só o dele; limite por pessoa; nunca entra no saldo |
| Quem pagou / acerto | ✗ | ✗ (só exemplo de MCP) | ✗ | ✗ | ✗ | ✗ | ~ "Splits" (quem deve a quem) | ✗ | ✗ | ✓ `paid_by`, partes por trigger, saldo e `settlements` |
| **IA** | ✓ Rowan (Premium+), age por texto | ✓ Assistant, Insights, categorização, MCP oficial | ✗ regras e matching | ✓ chat (Plus) | ✗ | ✓ Quicken AI beta, age com aprovação | ✗ | ✓ categorização por usuário; Assistant e MCP beta | ✗ ("coaches, não bots") | ~ IA só onde o parser falha (frase confusa, áudio, foto); insights por regra |
| Exportação | ~ Premium | ✓ CSV (5 mil por vez); MCP | ✓ CSV; API pública | ✓ CSV | ✗ | ~ CSV só web | ✗ | ? | ~ CSV só Premium | ✓ exportar e apagar em 1 toque; "só leitura" sem plano |
| Plataformas | iOS, Android, web (Premium), widget | web, iOS, Android (Plus só desktop) | web, iOS, Android, Watch, API, offline | web, iOS, Android, Watch, widgets | web, iOS (iPad, Watch, Mac), Android | web, iOS, Android | iOS, Android (sem web) | iPhone, iPad, Mac, web; **sem Android** | iOS, Android, web (Premium só EUA) | PWA primeiro; nativos iOS/Android depois |

Leitura da matriz (julgamento):
- **Ninguém cobre a linha "captura sem banco" inteira.** O mais perto é a
  Monarch (recibo por foto e e-mail). Mensagem, voz e Apple Pay automático
  não existem no mercado.
- **Ninguém tem filho-convidado, limite por pessoa e acerto de "quem pagou"**
  juntos. A Honeydue tem "Splits" e privacidade por conta; a Monarch tem
  dono por transação só em 4 telas.
- **Todos têm algo que nós não temos:** dívida com plano (7 de 9), investimentos
  (6 de 9), IA conversacional (5 de 9) e score (2 de 9). Dívida é a lacuna
  mais barata de fechar; investimento é anti-ICP por decisão.

---

## 4. Matriz de preço (confirmada pela checagem, 26/10/2026)

| App | Grátis | Mensal | Anual | Teste | Cartão no teste | Família/casal |
|---|---|---|---|---|---|---|
| **Rocket Money** | Sim (assinaturas, contas, orçamento básico) | Premium "pague o que achar justo", US$ 7–14; Premium+ US$ 15 | Não encontrado | 7 dias | Não confirmado oficialmente | 2º login no Premium, sem custo extra declarado |
| **Monarch** | Não | Core US$ 14,99 | Core US$ 99,99; **Plus US$ 199,99** (só anual) | 7 dias | **Sim** ("Payment method required") | Parceiro e membros grátis |
| **YNAB** | Não (365 dias para universitários) | US$ 14,99 | US$ 109 | 34 dias no site (loja diz 30) | **Não** no site | Até 6 pessoas, sem custo extra |
| **PocketGuard** | Não anunciado; terceiros divergem (versão rebaixada: 2 contas, 2 categorias) | Plus US$ 12,99 | US$ 74,99; vitalício US$ 149,99 | 7 dias | Não encontrado | Não encontrado (sem modo casal) |
| **Empower** | Sim, painel inteiro | US$ 0 | US$ 0 (gestão de patrimônio 0,89% a.a., mín. US$ 100 mil) | n/a | n/a | Não encontrado |
| **Quicken Simplifi** | Não | Web: só anual. App Store: US$ 9,99 | US$ 47,88 no 1º ano (promo até 25/11/2026), depois US$ 83,88; App Store US$ 84,99 | **Sem teste**; reembolso 30 dias (compra direta) | Pago no ato | 1 pessoa extra ("Space Sharing"), custo extra não declarado |
| **Honeydue** | Sim, tudo (anúncios) | "Monthly Tip" US$ 0,99–9,99 (gorjeta) | n/a | n/a | n/a | É o produto |
| **Copilot** | Não | US$ 13 | US$ 95 | 1 mês | Não encontrado oficialmente | Sem recurso; Magic Link = acesso total; 2 contas = 2 assinaturas |
| **EveryDollar** | Sim, manual | Premium US$ 17,99 | US$ 79,99 | 14 dias (novos) | Não confirmado | Household (cônjuge), um orçamento |

Referências úteis para nós:
- **Faixa do anual pago:** US$ 74,99 a 109. Mediana perto de **US$ 95**.
- **Equivalente mensal do anual:** US$ 6,25 (PocketGuard) a 9,08 (YNAB).
- **O "casal grátis" é padrão** (Monarch, YNAB, Simplifi, EveryDollar). Cobrar
  por pessoa (Copilot) é a exceção e é reclamação.
- **O teste sem cartão é raro** (só YNAB confirmado). 14 dias sem cartão é
  diferencial legítimo.
- **Padrões de cobrança que geram raiva:** renovação com +50% sem aviso
  (Simplifi), cobrança do ano inteiro ao fim do teste de 7 dias (PocketGuard,
  Monarch), cobrança depois de cancelar (Rocket), reembolso empurrado para a
  Apple (EveryDollar).

---

## 5. Empresas e tração

| App | Dono | Funding / dinheiro | Equipe | Usuários / receita conhecidos |
|---|---|---|---|---|
| **Rocket Money** | Rocket Companies (NYSE: RKT), comprou a Truebill por US$ 1,275 bi (12/2021) | ~US$ 83,9 mi antes da venda [não confirmado]; Série D US$ 45 mi (Accel) | Não encontrado | 2,5 mi membros e ~US$ 100 mi ARR esperado em 2021; "5 mi+ membros" hoje (fonte fraca); 10 mi+ downloads Android |
| **Monarch** | Independente (San Francisco); comprou a MBI/ex-HMBradley em 10/2026 | Série A US$ 15 mi (02/2022, Menlo); Série B US$ 75 mi a US$ 850 mi (05/2025, FPV + Forerunner); ~US$ 95 mi total | 51–200 (LinkedIn); 187 (PitchBook) | **1 mi+ membros** (03/2026), **US$ 100 mi ARR** (10/2026), crescimento 100%+ a.a.; #2 em receita Finanças no Play |
| **YNAB** | Jesse Mecham (Lehi, Utah); "customer-funded" | Nenhuma rodada | "Pequena"; ~40 em 2016 [hipótese] | Não divulga; ~200 mil no r/ynab; usuários de renda alta (Fortune 01/2025) |
| **PocketGuard** | Independente (Califórnia; equipe na Ucrânia); CEO Dmitry Savransky (checagem) | Uma rodada (Noosphere), valor não encontrado | ~19 (09/2026), queda de 29,6% em 2 anos | "1,7 mi+ usuários" (própria); tráfego em queda |
| **Empower** | Empower Retirement / Great-West Lifeco (comprou o Personal Capital por até US$ 1 bi em 2020) | n/a (parte de seguradora) | Não encontrado | Grupo: US$ 1,1 bi de lucro em 2025, 22 mi+ pessoas, US$ 2,3 tri; usuários do painel não encontrado |
| **Simplifi** | Quicken Inc., da Aquiline Capital (PE, 2021; antes H.I.G., antes Intuit) | Sem venture | 51–200 a algumas centenas [não confirmado] | "2 mi usuários ativos" (2021) e "20 mi" (2023, provavelmente cumulativo); assinantes não encontrados |
| **Honeydue** | WalletIQ → Mission Lane (05/2021) → "Moneydue, Inc." (2024) [não confirmado] | Anjos (YC, Mission Lane) | "Pequeno grupo" | Não encontrado |
| **Copilot** | Independente (Nova York + Santiago) | Série A US$ 6 mi (03/2024, Adjacent); ~US$ 6,25 mi total | 27–38 (estimativas) | **100 mil+ assinantes** (03/2024); lucrativo desde 2023 |
| **EveryDollar** | Ramsey Solutions (família Ramsey, Franklin, TN), sem dívida | Sem funding | 950 (2020) | 12 mi downloads, 250 mil novos/mês (01/2026, própria); Ramsey ~US$ 300 mi receita [não confirmado] |

O que isso diz (julgamento):
- **Há dois gigantes com dinheiro de fora** (Rocket, Empower) e **um líder de
  categoria bem capitalizado** (Monarch). Não dá para brigar por mídia paga com
  eles.
- **Três são lucrativas sem investidor e pequenas** (YNAB, Copilot, PocketGuard):
  prova de que assinatura de US$ 75–110/ano sustenta uma empresa de 20 a 40
  pessoas nos EUA. É o nosso modelo.
- **Monarch e Copilot pegaram o êxodo do Mint por CSV**; a importação de
  concorrente é canal, não feature.

---

## 6. Reputação

### Notas e volume (checagem, 26/10/2026)

| App | App Store EUA | Google Play EUA | Trustpilot | BBB |
|---|---|---|---|---|
| Rocket Money | 4,5 (403 mil) | 4,5 (141 mil); 10 mi+ | ~3,2–3,5 (4.100+) | conflito "A+" vs "B" [não confirmado] |
| Monarch | 4,9 (116 mil) | 4,8 (26,1 mil); 500 mil+ | **2,0** (33, perfil não reivindicado) | sem acreditação, 1 avaliação |
| YNAB | 4,8 (~62 mil) | 4,6 (25,4 mil); 1 mi+ | **4,6** (3.138; responde 89% das negativas) | não acreditada, sem nota vista |
| PocketGuard | 4,6 (7,7 mil) | 4,5 (2,91 mil); 100 mil+ | 4,5 (n não encontrado) | não encontrado |
| Empower | 4,8 (~422 mil; mistura 401(k)) | **2,7** (30,4 mil); 1 mi+ | "Poor" (721, personalcapital.com); 1,2 (499, empower-retirement) | não encontrado |
| Simplifi | 4,5 (~12 mil) | 4,6 (5,08 mil); 500 mil+ | 3,6 (84.627, marca Quicken/Classic); 4,3 (23, simplifi.io) | **F** (78 queixas, via BI, 05/2025) [não consultado direto] |
| Honeydue | 4,5 (10 mil) | 4,2 (2,85 mil); 100 mil+ | não consultado | não consultado |
| Copilot | 4,8 (31 mil) | **não existe** | nada encontrado | nada encontrado |
| EveryDollar | 4,7 (84 mil) | 4,3 (15,5 mil); 1 mi+ | 3,3 (6) | não acreditada |

Leitura: a nota de loja é alta para todos (4,5–4,9) e **esconde** o que o
Trustpilot e o Reddit mostram. Quem tem Trustpilot bom é quem responde (YNAB).
A Monarch, com 4,9 na loja, tem 2,0 no Trustpilot.

### Os padrões de reclamação que se repetem (em ordem de frequência nos dossiês)

1. **Sync do banco quebra** (9 de 9). Transações faltando, duplicadas ou com
   sinal trocado; reautenticação a cada poucas semanas; bancos sem cobertura
   (Amex, Synchrony, PayPal, Canadá); "sempre um banco fora" (Simplifi);
   "pontos amarelos por semanas" (Empower); conexão fora por duas semanas
   (Honeydue). A Monarch criou painel público de saúde das conexões e troca de
   provedor; o YNAB, "reset" no app. **Nenhum resolveu.**
2. **Cobrança e cancelamento** (7 de 9). Cobrança após cancelar (Rocket);
   cobrança do ano ao fim do teste de 7 dias (PocketGuard, Monarch); +50% na
   renovação sem aviso (Simplifi); reembolso só pela Apple (EveryDollar);
   "caro, era compra única" (YNAB); taxa de 35–60% pesada (Rocket).
3. **Suporte lento e sem telefone** (6 de 9). 24–48 h ou 5+ dias (Monarch),
   bot (Rocket), mudo (Honeydue), espera de 20–48 min (Empower).
4. **Categorização errada mesmo com regra** (Monarch, Simplifi, Rocket) ou
   **nenhuma categorização** (EveryDollar, por desenho).
5. **Falta de privacidade e recursos por pessoa** no casal (Monarch,
   PocketGuard, Copilot, Simplifi); duplicidade em cartão compartilhado
   (Monarch).
6. **Dados e publicidade**: política que permite usar dados para publicidade
   (Rocket, queixa EPIC/CFPB 2022; Empower; rótulo "Data Used to Track You" na
   Simplifi e no EveryDollar); NAD contra afirmações de anúncio da Monarch
   (02/2026).
7. **Mudança de interface que quebra o fluxo** (YNAB 2025, EveryDollar,
   Empower migração 2025–2026).
8. **Mobile menos completo que a web** (Simplifi, Monarch Plus, YNAB import).

---

## 7. Modelo de aquisição por concorrente

Fontes desta seção: [aquisição A](2026-10-26-aquisicao-a.md) (Rocket, Monarch,
Copilot), [aquisição B](2026-10-26-aquisicao-b.md) (YNAB, EveryDollar,
PocketGuard), [aquisição C](2026-10-26-aquisicao-c.md) (Empower, Simplifi,
Honeydue) e a [contagem de anúncios na Meta](2026-10-26-anuncios-meta.md)
(26/10/2026).

Como ler os números:
- **A contagem da Meta vence o "não encontrado"** dos arquivos de aquisição,
  que não conseguiram abrir a Biblioteca de Anúncios. Ela é uma foto do dia
  (anúncios ativos em 26/10/2026, EUA), não gasto nem total do mês.
- **Semrush e Similarweb medem o site e a busca paga, não as redes sociais.**
  "0% pago" na busca não quer dizer "não anuncia": o EveryDollar tem 0 de
  busca paga e ~150 anúncios na Meta.
- Todo tráfego é **estimativa** de terceiro (set/2026). O "direto" vem inflado
  nas duas ferramentas (o que não se atribui cai lá), e o uso no app não passa
  pelo site.
- CAC e LTV: nenhum dos 9 publica. Toda conta abaixo é **[hipótese]** dos
  arquivos de aquisição.

### Tabela comparativa

| App | Motor principal | Orgânico × pago (Meta 26/10 · busca paga) | Tráfego/mês e fontes (estimativa, set/2026) | Afiliados | Indicação | Parcerias B2B | Funil | Além da assinatura | CAC / LTV |
|---|---|---|---|---|---|---|---|---|---|
| **Rocket Money** | Mídia paga de marca e performance, paga pela controladora (TV, metrô, Meta, podcasts) | **Pago pesado**: ~96 anúncios na Meta, criativos novos todo dia · busca paga 2,65% das palavras | ~1,1 mi (Similarweb); direto 65% (desktop), orgânica 2ª, e-mail 3ª | Impact, US$ 4–10 por cadastro | US$ 10–15 a quem indica [não confirmado] | Podcasts com URL própria por criador (`/ramit`); funil para hipoteca do grupo | Grátis limitado + Premium "pague o que achar justo"; 7 dias | Negociação de contas (35–60% da economia); receita US$ 390 mi em 2025 [não confirmado] | Não divulgado; não estimado |
| **Monarch** | Boca a boca pós-Mint (Reddit), agora com mídia paga, afiliados e criadores | **Pago em alta**: ~78 anúncios na Meta, quase todos de 20–23/10, **com versões em espanhol** · busca paga 4,7% | ~3,6 mi (Similarweb); direto 73%, orgânica 2ª, **afiliado 3ª** | Impact, ~US$ 19–20 por pagante [não confirmado] | 30 dias para os dois lados; promovida no teste: +64% de compartilhamento | Walmart+ (50% no 1º ano) | Sem grátis; 7 dias com cartão | Nenhuma (só assinatura) | ARR ~US$ 100 mi (Sacra, estimativa); LTV ~US$ 230–330 [hipótese] |
| **Copilot** | Imprensa de tecnologia e criadores Apple; anúncio só depois que o custo caiu | **Quase orgânico**: ~4 anúncios na Meta (código 2MFREE) · busca paga 10,75% | 412 mil "em 3 meses" (período ambíguo); direto 61%, orgânica 2ª, **social 3ª** | Não encontrado | Meses grátis cumulativos | Patrocínio do MacStories (código próprio) | Sem grátis; 1 mês | Nenhuma | Receita/assinante ~US$ 200 [hipótese]; CAC pago caiu ~75% pós-Mint |
| **YNAB** | Marca, método e comunidade (conteúdo, podcast, r/ynab) | **Orgânico puro**: 0 anúncios na Meta · 0 busca paga | 3,36 mi (Semrush); direto 85%, orgânica ~7%, quase toda pelo nome | Impact, só por convite, US$ 6–10 por **teste** [não confirmado] | 6 semanas ao amigo, 1 mês a quem indica; presente 3 meses | 365 dias grátis para universitários | Sem grátis; 34 dias **sem cartão** | Nenhuma ("customer-funded") | LTV ~US$ 218, teto de CAC ~US$ 70–100 [hipótese] |
| **EveryDollar** | A mídia da Ramsey (rádio, podcast, livros, igrejas) | **Pago nas redes**: ~150 anúncios na Meta (no ar há semanas) · 0 busca paga | 846 mil (Semrush); direto 74%, ramseysolutions.com 15% | Não encontrado | Não há programa | SmartDollar (empregador), igrejas, SmartVestor | **Grátis manual** + Premium com 14 dias | Livros, cursos, eventos, comissão de corretores; Ramsey ~US$ 300 mi [não confirmado] | CAC marginal ~0 para o ouvinte [hipótese] |
| **PocketGuard** | SEO de comparação + afiliados + resenhas | **Busca, não redes**: 0 anúncios na Meta · busca paga 12,7% | ~28 mil [hipótese] (85 mil em 3 meses, Similarweb); direto 37%, orgânica 2ª, paga 3ª | Impact, **US$ 25 por pagante** com banco | Pontos [não confirmado] | Não encontrado | 7 dias; vitalício US$ 149,99 | Comissão de parceiros [hipótese] | LTV ~US$ 75, teto de CAC US$ 25–40 [hipótese] |
| **Empower** | Painel grátis como isca da gestão de patrimônio e do 401(k) | **Marca**: ~58 anúncios na Meta ("Invest well. Live a little.", vende investimento) · busca paga ~2,5% | 2,45 mi (Semrush, mistura 401(k)); orgânica 40%, direto 36% | Impact/FlexOffers, US$ 80 por lead qualificado [não confirmado] | Vale-presente se o indicado ligar mais de US$ 1.000 em investimento | 20 mi+ participantes de 401(k) | Grátis, sem cartão; o consultor liga a partir de US$ 100 mil | Gestão 0,89% a.a., rollover, seguros | ~US$ 890/ano por cliente de US$ 100 mil [hipótese] |
| **Simplifi** | Marca Quicken + afiliados/resenhas + preço baixo no 1º ano | **Pago**: ~88 anúncios na Meta para "quicken.com" (2 citam Simplifi) · busca paga 7,6% (quicken.com) | quicken.com ~3,8 mi em 3 meses; direto 73%, quase tudo pelo nome; simplifimoney.com 25 mil em 3 meses | Impact, comissão só após aprovação (US$ 2–40 em terceiros) [não confirmado] | Não encontrado | Página de universidades, sem programa descrito | Sem grátis, **sem teste**; garantia 30 dias; US$ 47,88 no 1º ano | Quicken desktop | LTV 2 anos ~US$ 132 [hipótese] |
| **Honeydue** | Convite do parceiro (o app precisa dos dois) + listas "melhor app de casal" | **Orgânico puro**: 0 anúncios na Meta · sem busca paga encontrada | 18,4 mil em 3 meses; orgânica 40% | Não encontrado | O convite é o produto | Comprada pela Mission Lane (05/2021) | Grátis | Cross-sell de conta e cartão de débito da dona | CAC ~0 [hipótese]: 500 mil usuários com menos de US$ 1 mi captado |

### O modelo de cada um

- **Rocket Money.** Compra atenção em escala: TV, metrô, ~96 anúncios na Meta
  com criativo novo todo dia, e um gancho que o produto entrega em minutos
  ("ache as assinaturas que você esqueceu"). Funciona porque a Rocket
  Companies paga a mídia e porque o usuário é topo de funil para hipoteca e
  empréstimo do grupo; a negociação de contas é receita extra. ([aquisição
  A](2026-10-26-aquisicao-a.md), [Meta](2026-10-26-anuncios-meta.md))
- **Monarch.** Ganhou a base de graça com o fim do Mint, no Reddit, e agora
  converte o Série B (US$ 75 mi) em mídia: ~78 anúncios novos na Meta, alguns
  em espanhol, criadores no YouTube e afiliados como 3ª fonte do site.
  Funciona porque o LTV de um pagante a ~US$ 100/ano paga um afiliado de
  US$ 20 com folga, e a indicação promovida durante o teste rende sem mídia.
  ([aquisição A](2026-10-26-aquisicao-a.md))
- **Copilot.** Produto muito bom, só Apple, mostrado a quem influencia (imprensa
  de tecnologia, MacStories, Marques Brownlee). Cresceu dois anos sem anúncio,
  ficou lucrativo e só abriu o pago (pouco: ~4 na Meta, 10,75% de busca paga)
  quando o custo caiu. ([aquisição A](2026-10-26-aquisicao-a.md))
- **YNAB.** Ensina um método de graça há anos (conteúdo, podcast, workshops,
  r/ynab) e colhe busca pelo nome: 85% do site é direto, 0 anúncio na Meta, 0
  busca paga. Funciona porque o método cria fã, o teste de 34 dias sem cartão
  dá tempo de o método "clicar" e uma assinatura serve a casa inteira.
  ([aquisição B](2026-10-26-aquisicao-b.md))
- **EveryDollar.** É a ferramenta da mídia da Ramsey (18–20 mi ouvintes/semana,
  igrejas, livros). O grátis manual é a porta, e o dinheiro está em cursos,
  eventos e comissão de corretores. Os ~150 anúncios na Meta (histórias de
  casais que quitaram dívidas) se pagam pelo ecossistema, não pela assinatura
  do app. ([aquisição B](2026-10-26-aquisicao-b.md),
  [Meta](2026-10-26-anuncios-meta.md))
- **PocketGuard.** Vive de blog de comparação, afiliado bem pago (US$ 25 por
  pagante) e vitrines de resenha, com um pouco de busca paga. Sem marca nem
  rede social, o tráfego cai (−13,5% no mês): é o contraexemplo do SEO
  genérico. ([aquisição B](2026-10-26-aquisicao-b.md))
- **Empower.** O painel grátis existe para achar quem tem saldo para a gestão de
  patrimônio (0,89% a.a.) e o rollover de 401(k). A Meta mostra marca de
  investimento, não de orçamento. Funciona porque um cliente de US$ 100 mil
  vale ~US$ 890/ano [hipótese] e paga US$ 80 por lead.
  ([aquisição C](2026-10-26-aquisicao-c.md))
- **Simplifi.** Aproveita a marca Quicken (o tráfego é quase todo pelo nome),
  uma rede de afiliados e resenhas e o preço de US$ 47,88 no 1º ano com data
  para acabar. Os ~88 anúncios da Meta são da marca Quicken; só 2 citam o
  Simplifi. ([aquisição C](2026-10-26-aquisicao-c.md),
  [Meta](2026-10-26-anuncios-meta.md))
- **Honeydue.** Cada usuário traz o segundo, porque o app só faz sentido a dois;
  chegou a 500 mil usuários quase sem dinheiro. Sem receita própria, acabou
  vendida a quem queria a base para vender conta e cartão.
  ([aquisição C](2026-10-26-aquisicao-c.md))

### Os padrões

| Modelo | Quem | O que custa | O que precisa para funcionar |
|---|---|---|---|
| **Mídia paga de performance** (redes, não busca) | Rocket (~96 na Meta), Monarch (~78), EveryDollar (~150), Quicken (~88) | Verba contínua e uma linha de produção de criativos (o Rocket troca todo dia; terceiros contam ~46 criativos novos por semana) | LTV conhecido e caixa para esperar o retorno: uma controladora (Rocket), um Série B (Monarch), um ecossistema que monetiza depois (Ramsey) ou um dono de PE com marca de décadas (Quicken) |
| **Marca e comunidade sem anúncio** | YNAB (0 na Meta, 0 busca paga); Copilot quase todo | Anos de conteúdo e de fundador presente; tempo, não dinheiro | Um método ou um produto com ponto de vista que crie fã; teste longo para o hábito nascer; resposta pública e humana |
| **Funil para outro negócio** | Empower (patrimônio), EveryDollar (cursos e corretores da Ramsey), Rocket (hipoteca do grupo) | O app pode ser grátis ou barato, porque o lucro vem atrás | Um produto caro por trás do app. Não copiável por nós |
| **Viral de convite** | Honeydue (o parceiro é parte do produto) | Quase zero em mídia | Um produto que **precisa** da segunda pessoa e uma receita própria; sem ela, a base vira ativo de outro |

Duas observações (julgamento):
- **A busca paga é pequena para todos** (no máximo 12,7%, PocketGuard). Quem
  compra mídia compra nas redes sociais. O "Google Ads de budget app" não é o
  campo de batalha.
- **O modelo que encolhe é o único sem marca nem rede**: PocketGuard, só SEO e
  afiliado, perde tráfego mês a mês. Afiliado e SEO completam um motor; não são
  o motor.

### Implicações para nós (julgamento; em ordem de prioridade)

1. **O motor é o YNAB + o Honeydue, não o Rocket.** Marca com ponto de vista
   ("o app de dinheiro da família que não pede a senha do banco") e convite
   da família como viral. Vale para o Brasil agora e para o lançamento
   americano depois. Custo: tempo do fundador e produto. Nada de verba de
   mídia.
2. **O convite de família é o canal nº 1 e precisa de desenho de canal**,
   não só de recurso:
   - convidar o parceiro é o 1º passo do onboarding (lição do Honeydue);
   - a indicação aparece **durante o teste**, quando o hábito nasce (Monarch,
     +64% de compartilhamento);
   - recompensa em meses grátis para os dois lados (YNAB, Copilot), que não
     custa caixa;
   - medir convites aceitos por carteira e o quanto viram carteiras novas fora
     da família. **[hipótese]** Cada carteira traz 1 a 2 pessoas; o viral de
     verdade é a pessoa convidada que abre a própria carteira.
   - Diferente do Honeydue: com plano pago desde o dia 1, a base não vira
     ativo de outro.
3. **Conteúdo e SEO de cauda longa no nosso ângulo, não "best budgeting app".**
   - Termos: "budget app without linking bank", "family budget app with kids",
     "Monarch/YNAB alternative without Plaid", "best app for couples"; no
     Brasil, o equivalente em português ("controle financeiro sem conectar o
     banco", "app de finanças para a família").
   - A vaga de "app de casal" está aberta (o site do Honeydue tem 18 mil visitas
     em 3 meses); o SEO genérico perde (PocketGuard).
   - Calculadoras públicas ("safe to spend", juros do rotativo) e páginas
     "alternativa a X" honestas; o YNAB e o Rocket as usam.
   - Método com nome, ensinado de graça (o YNAB tem o "give every dollar a job"; o
     Ramsey, os Baby Steps): o nosso candidato é o "seguro para gastar" da casa.
4. **Afiliados e sites de comparação, depois da retenção medida.**
   - Pagar só por resultado: por pagante (PocketGuard, US$ 25) ou por teste
     (YNAB, US$ 6–10). Uma rede como a Impact é barata de abrir.
   - Criador de finanças com URL própria (`/nome`, como o Rocket) mede sem
     cupom; cupom exclusivo por parceiro, como o Simplifi.
   - NerdWallet, Forbes Advisor e Experian: só com o programa de afiliados de
     pé e alguém cuidando (lição do arquivo B).
5. **O público hispânico é uma porta barata e quase vazia.**
   - A Monarch já anuncia em espanhol na Meta (26/10/2026); nenhum outro dos 9
     mostrou isso nas fontes.
   - Nós já temos o i18n e o português. O espanhol custa tradução e revisão,
     não produto novo. **[hipótese]** Uma landing em espanhol com a mesma
     lista de espera do §12 mede o interesse por ~US$ 0–100.
   - Brasileiros nos EUA são um primeiro nicho natural (o produto já fala a
     língua deles) **[hipótese]**: comunidades e grupos, como as igrejas do
     Ramsey.
6. **O que NÃO fazer cedo.**
   - **Mídia paga sem LTV medido.** Os quatro que compram mídia têm uma fonte
     de caixa que nós não temos. Primeiro o beta mede retenção e conversão; o
     pago entra só quando o CAC se paga em menos de 12 meses **[julgamento]**,
     e começa pequeno, com o formato mais barato (gravação de tela do "dinheiro
     achado" ou do lançamento em 2 segundos, como o Rocket).
   - TV, metrô, podcast grande: precisam de controladora.
   - Vitalício (PocketGuard) e "pague o que achar justo" (Rocket): ver §10.
   - Grátis sem receita (Honeydue): o viral sem dinheiro acaba vendido.

---

## 8. O que o usuário americano espera

### Conectar o banco é o normal

- Os 9 conectam. Onboarding de 8 começa por "connect your accounts". O
  usuário pergunta "e a Plaid?" antes de perguntar o preço (Simplifi, Copilot,
  Empower nos dossiês).
- Mas **a dor do sync é a reclamação nº 1 documentada em todos**, e a própria
  comunidade do YNAB diz que "logging manually will likely be the smoothest".
- **Quem já compra manual, e quanto é:**
  - **EveryDollar grátis**: 100% manual, 12 mi downloads e 250 mil novos/mês
    (própria empresa); o Ramsey vende "manual" como virtude
    ("accountability"). É a maior prova de que existe mercado para "sem
    banco", a custo zero.
  - **YNAB manual**: caminho legítimo e documentado (manual + File-Based
    Import + Reconcile); a comunidade o recomenda quando o sync falha. Tamanho:
    não há número público; **[hipótese]** minoria da base de ~milhões.
  - **Goodbudget** (envelope, manual) aparece nos comparativos da Ramsey como
    o outro "free forever"; não foi dossiê.
  - Tamanho total do segmento manual: **não medido**. Ordem de grandeza
    [hipótese]: milhões de contas grátis no EveryDollar, dezenas de milhares
    de pagantes dispostos a lançar à mão.
- **O que isso significa para o nosso "sem conectar o banco":**
  - Não pode parecer **falta de recurso**. Precisa de uma história na primeira
    tela: "sem senha de banco, sem sync quebrado, lançar leva 2 segundos", com
    as 1 estrelas de sync dos outros como prova.
  - O americano aceita manual **quando o custo de lançar cai a quase zero**
    (é o nosso bloco 3) **ou quando é grátis** (EveryDollar). Cobrar US$ 79–99
    por manual exige que a captura funcione muito bem no dia 1.
  - **CSV/OFX/QFX é obrigatório** desde o lançamento: é a ponte que YNAB,
    Monarch, Simplifi e PocketGuard usam, e é o que o usuário do Mint aprendeu.
  - Parte do mercado quer o oposto (patrimônio e investimentos ligados). Esse
    público é o da Empower e da Monarch e **não é nosso**.

### O que muda do Brasil para os EUA

| Tema | Brasil (ICP) | EUA (dossiês e conhecimento geral; **[hipótese]** onde não há fonte nos dossiês) | Efeito no produto |
|---|---|---|---|
| **Cartão de crédito** | Parcelado sem juros é 41% das compras; "o mês é a fatura"; fechamento e vencimento são o calendário da casa | Sem parcelamento no cartão; **statement** mensal com "statement balance", "minimum due" e "due date"; muita gente paga o mínimo e **rola a dívida com juros** (YNAB passou a tratar "Credit Card Interest" em 10/2026); utilização de crédito importa para o score (Monarch alerta) | "Fatura que bate" vira **"statement que bate"**: conferir o statement em PDF/CSV, mostrar juros pagos, utilização e "quanto pagar para não pagar juros". Parcelas viram **BNPL** (Affirm, Klarna, Afterpay; o YNAB tem páginas sobre BNPL) |
| **Pagamentos** | Pix (40/mês por pessoa), aproximação, boleto | Cartão de crédito/débito, **Apple Pay** muito usado, Venmo/Zelle (P2P), ACH para contas, cheque ainda existe | Apple Pay automático (Atalhos) vale **mais** nos EUA; "Pix" vira Venmo/Zelle/ACH como forma de pagamento; boleto some; `paid_by` e acerto casam com a cultura de Venmo |
| **Canal de captura** | WhatsApp é o sistema operacional social (64,8% na tela inicial) | WhatsApp pouco usado; **iMessage/SMS**, e-mail, Atalhos/Siri, widgets, Apple Watch | WhatsApp → **SMS/iMessage (Twilio) ou e-mail de captura** + Atalhos/Siri como canal principal no iPhone; widgets e Watch são expectativa (YNAB, PocketGuard, Empower têm) |
| **Renda** | Salário até o 5º dia útil; VR/VA; adiantamento | Pagamento **quinzenal ou bissemanal** (EveryDollar tem "paycheck planning"; Simplifi projeta por data) | O "seguro para gastar" precisa entender paycheck a cada 2 semanas, não "o mês" |
| **Dívida** | Cartão em 85% das famílias endividadas; parcelas | Cartão rotativo, **student loans**, financiamento de carro; snowball vs avalanche é vocabulário comum (PocketGuard, Monarch, EveryDollar) | Plano de quitação é lacuna nossa e expectativa deles |
| **Score de crédito** | Pouco central | **Cultura de score** (FICO/VantageScore); Rocket e Monarch mostram grátis | Não fazer no lançamento; dizer por quê (não lemos sua conta) |
| **Privacidade e medo** | Medo de roubo do celular e de conta mexida (16% das vítimas) | Medo de **venda de dados** e de publicidade (queixa EPIC/CFPB contra Rocket; "we don't sell data" é promessa de Monarch, PocketGuard, Copilot, YNAB) | "Seus dados são seus" ressoa; não pedir senha de banco também |
| **Família** | Mulher organiza (64%); filhos com cartão adicional dos pais (22%) | Casal como unidade de orçamento ("household"); apps de mesada e cartão para adolescentes existem à parte (Greenlight etc., não estudados) [hipótese] | Filho-convidado é novidade na categoria "budget app"; validar se o pai americano quer isso **no mesmo app** |
| **Idioma e formato** | pt-BR, R$, dd/mm, 1.234,56 | en-US, US$, **mm/dd/yyyy**, 1,234.56, fusos (4 no continente), imperial não importa | i18n completo; datas e número por locale; fuso por carteira/pessoa |
| **Impostos** | Não é tema do app | Sales tax varia por estado e cidade para a **nossa cobrança** (SaaS tributado em alguns estados); o usuário quer "tax report" (Simplifi, Monarch Plus, Empower) | Cobrar com um gateway que calcule sales tax (Stripe Tax ou Paddle/Lemon Squeezy como merchant of record) [hipótese: decisão de implementação]; relatório de imposto não entra no lançamento |
| **Lojas** | PWA aceito; IAP só obrigatório com app nativo | Expectativa forte de **app nativo** com 4,8; "está na App Store?" é confiança | PWA só pode ser beta fechado; o lançamento público pede o nativo (já no roteiro) |
| **Suporte** | Reclame Aqui; WhatsApp | E-mail e chat; telefone é diferencial; resposta pública nas lojas e Trustpilot (YNAB) | Responder em inglês em até 24 h; Trustpilot reivindicado |

---

## 9. O espaço que sobra para nós (com evidência)

1. **Família de verdade: papéis, filhos, limites, quem pagou.**
   - Monarch, a referência: "não dá para esconder conta ou transação de um
     membro"; sem papel de menor; sem "quem pagou" nem acerto; filtros por dono
     não existem em Orçamento, Recorrentes e Metas; reclamação nº 4 é "falta de
     privacidade e de recursos por pessoa". Está "explorando" privacidade por
     conta há um ano (10/2025–10/2026).
   - YNAB Together: 6 pessoas, mas é um plano compartilhado ou planos
     separados; sem convidado restrito, sem limite por pessoa, sem acerto.
   - Simplifi: **uma** pessoa extra, só pela web, sem acesso limitado
     ("podem vir no futuro").
   - PocketGuard: "everyone sees everything"; modo casal "não está no roteiro"
     (10/2026).
   - Copilot: sem recurso; Magic Link = acesso total; duas assinaturas.
   - EveryDollar: só cônjuge, um orçamento.
   - Honeydue: casal com privacidade por conta e "Splits", mas sem filho, sem
     limite, e o app está em manutenção com suporte mudo.
   - **Nosso desenho** (bloco 7): até 6 pessoas; dono/membro/convidado;
     adultos veem tudo e carteira separada é a privacidade; convidado-filho
     lança e vê só o dele, com limite mensal e sem entrar no saldo; `paid_by`,
     partes por trigger, saldo e acerto. Nenhum dos 9 tem o conjunto.
   - **Risco:** se a Monarch fechar privacidade por conta e dono em Orçamento,
     o buraco diminui; ela entrega um grande recurso por mês em 2026.

2. **Captura sem banco.**
   - O máximo do mercado é recibo por foto e e-mail (Monarch), Siri para
     consultar saldo (YNAB), recibo no plano de empresa (Simplifi). Nenhum tem
     mensagem, voz, Apple Pay automático, share do Android ou "a conferir".
   - O YNAB e o EveryDollar provam que há gente que lança à mão; o nosso
     argumento é reduzir o custo de lançar a segundos.
   - **Cuidado:** o canal precisa ser o americano (Atalhos/Apple Pay, SMS/
     iMessage, e-mail), não o WhatsApp.

3. **"O statement que bate" (a versão americana da fatura).**
   - Monarch mostra saldo da fatura e mínimo "quando o banco informa"; YNAB
     tem Reconcile e match de pagamento; Simplifi tem Bill Connect e queixa de
     "pagamento de dívida contado errado"; o resto trata cartão como conta.
   - Ninguém confere o statement em PDF/CSV contra o lançado e aponta a
     diferença. A dor "números que não batem" é a reclamação nº 2 da Simplifi.
   - **O que muda:** sem parcelas; entram juros do rotativo, utilização e
     "quanto pagar para não pagar juros". **[hipótese]** O valor percebido é
     menor que no Brasil; validar em entrevista antes de investir em leitores
     de PDF de Chase, Amex, Capital One, Citi, Discover.

4. **Transparência de cobrança.**
   - Rocket (cobrança após cancelar), Simplifi (+50% na renovação sem aviso),
     PocketGuard e Monarch (cobrança do ano ao fim de 7 dias), EveryDollar
     (reembolso só pela Apple). O YNAB, que faz 34 dias sem cartão e responde
     89% das negativas, tem 4,6 no Trustpilot.
   - Nosso desenho já tem: preço na porta, 14 dias sem cartão, aviso 7 dias
     antes de renovar, cancelar em 1 toque, "bateu ou devolvemos", conta "só
     leitura" sem plano. É o padrão do YNAB, mais barato.

5. **Privacidade de dados.**
   - Queixa EPIC/CFPB contra o Rocket (2022); Empower usa dados para
     marketing próprio; rótulos "Data Used to Track You" na Simplifi e no
     EveryDollar; NAD contra anúncios da Monarch.
   - "Não pedimos a senha do banco" + "exportar e apagar em 1 toque" + "sem
     anúncio, sem venda de dados" é uma frase que o mercado já reconhece
     (Monarch, Copilot, PocketGuard e YNAB a usam), e nós podemos ir além: não
     há agregador no meio.

6. **"Quanto ainda dá para gastar" para a casa.** PocketGuard e Simplifi
   provam que o número único vende; os dois dependem do banco e nenhum o faz
   **por pessoa** (limite) nem para a família.

---

## 10. Recomendações de entrada nos EUA

Tudo nesta seção é **julgamento** meu, salvo os números citados.

### Posicionamento e tagline

- **Posicionamento:** "The family money app that never asks for your bank
  password." A família no mesmo número, cada um com o seu papel, e lançar em
  dois segundos pelo iPhone, por mensagem ou por foto.
- **Taglines candidatas (em inglês):**
  1. **"Family money, no bank login."**
  2. "One number for the whole house. No bank sync to break."
  3. "Know what's safe to spend. Together."
  4. "Your money, your family, your data."
- **O que não dizer:** "budgeting app" (joga no comparativo com YNAB/Monarch
  onde perdemos em integrações); "manual" (soa a trabalho). Dizer "no bank
  login" e "2-second capture".

### ICP americano proposto **[hipótese a validar]**

Casal de 30 a 45 anos com um ou dois filhos (um deles adolescente com cartão
adicional ou conta de mesada), renda familiar de US$ 90 a 200 mil, que já
tentou Mint, Monarch ou YNAB e largou pelo sync que quebra ou pelo trabalho de
manter, em que uma pessoa opera o dinheiro e a outra quer "só saber quanto dá
para gastar". Usa iPhone e Apple Pay, paga contas por ACH, divide gastos por
Venmo, tem um cartão com saldo rotativo e um BNPL ativo. Desconfia de dar a
senha do banco a um app depois de ler sobre venda de dados. Está em r/ynab,
r/MonarchMoney, r/mintuit, r/personalfinance e ouve podcasts de dinheiro.
Compra anual se o teste provar que a família toda consegue usar em uma semana.

### Preço e faixa

Referências: PocketGuard US$ 74,99 · EveryDollar Premium US$ 79,99 · Simplifi
US$ 83,88 (cheio; US$ 47,88 no 1º ano) · Copilot US$ 95 · Monarch US$ 99,99
(Plus 199,99) · YNAB US$ 109. Grátis: Empower, EveryDollar manual, Honeydue.

- **Proposta: US$ 79/ano para a casa toda (até 6 pessoas), teste de 14 dias
  sem cartão, sem mensal no lançamento** (o mesmo "só anual" do Brasil; o
  mensal, se entrar, a US$ 9,99 como teto psicológico de Simplifi/YNAB).
  - Abaixo de Copilot e Monarch (individual/casal) e do YNAB; acima de
    PocketGuard. A frase: "menos que o YNAB, para a família inteira, sem dar a
    senha do banco".
  - US$ 79 cobre as taxas de loja (30% no 1º ano) sem ficar abaixo de US$ 55
    líquidos.
  - **Fundadores EUA:** US$ 59/ano congelado para a lista de espera, como no
    Brasil.
- **Não fazer "pague o que achar justo"** (Rocket): confunde e não combina
  com "preço na porta".
- **Plano grátis:** não no lançamento. O EveryDollar grátis é o concorrente
  direto do "sem banco"; a resposta é o teste de 14 dias sem cartão + "só
  leitura" para sempre (vê, exporta e apaga). Reavaliar com a conversão da
  lista de espera.
- **Vitalício** (PocketGuard US$ 149,99): não; caixa hoje contra suporte para
  sempre.

### O que adaptar no produto (o que vira o quê)

| Brasil | EUA |
|---|---|
| WhatsApp (texto, áudio, foto, PDF) | **Atalhos/Siri e Apple Pay** como canal principal no iPhone; **SMS/iMessage** via Twilio e **e-mail de captura** (encaminhar recibo, como a Monarch) para quem não tem iPhone; Web Share Target no Android continua |
| Pix, débito, boleto | Débito, **ACH**, **Venmo/Zelle**, cheque; o acerto do "quem pagou" sugere "settle up on Venmo" |
| Parcelas "em 10x" no parser | **BNPL** (Affirm, Klarna, Afterpay): 4 parcelas quinzenais ou n mensais, com a mesma projeção de impacto |
| Fatura: fechamento, vencimento, parcela | **Statement**: closing date, due date, statement balance, minimum due, **juros do rotativo**, utilização; "quanto pagar para não pagar juros" |
| Conferir fatura pelo PDF (Nubank, Itaú…) | Conferir **statement PDF/CSV** (Chase, Amex, Capital One, Citi, Discover, BofA); CSV primeiro, PDF depois, porque todo emissor exporta CSV |
| Salário mensal, VR/VA | **Paycheck** quinzenal/bissemanal como receita recorrente; "seguro para gastar" até o próximo paycheck |
| Mês do calendário | Manter; mostrar "até o próximo paycheck" como leitura alternativa |
| Dívida (fora do desenho) | **Plano de quitação** snowball/avalanche com debt-free date (PocketGuard, EveryDollar, Monarch): a lacuna mais pedida |
| LGPD art. 14 no convite do filho | **COPPA** (menores de 13: evitar; convidar a partir de 13) e termos para adolescente; consentimento dos pais no convite |
| Reclame Aqui | Trustpilot reivindicado e resposta pública nas lojas |

### O que precisa existir antes do lançamento

- **Produto:** inglês completo (app, e-mails, push, insights em modelos de
  frase en-US); US$ com formato 1,234.56; **mm/dd/yyyy**; fuso por pessoa;
  categorias americanas (Groceries, Dining, Gas, Utilities, Rent/Mortgage,
  Insurance, Childcare, Student Loans); importação CSV/OFX/QFX com modelo de
  Mint/YNAB/Monarch; Atalho de Apple Pay testado com Chase/Amex/Apple Card;
  apps nativos (o PWA não ganha a confiança "está na App Store?").
- **Legal e cobrança:**
  - entidade ou merchant of record para cobrar em US$ e recolher **sales
    tax** por estado (Paddle/Lemon Squeezy, ou Stripe Tax com entidade
    própria) [hipótese de implementação; validar com contador nos EUA];
  - termos e política de privacidade nos EUA: **CCPA/CPRA** (Califórnia:
    direito de acesso, exclusão e "do not sell"; já temos exportar e apagar
    em 1 toque), e as leis estaduais equivalentes; **GLBA** só se aplica se
    formos "financial institution" ou se agregarmos dados bancários via Plaid
    — sem conexão bancária, **[hipótese]** não se aplica, mas o advogado
    decide; COPPA para o filho-convidado;
  - renovação automática com aviso prévio (leis de auto-renewal da
    Califórnia e outros estados): o nosso aviso 7 dias antes já atende;
  - IA: contratos com ZDR já existem (Groq); manter os dados fora de
    treinamento e dizer isso.
- **A decisão do Plaid opcional:**
  - **Contra (hoje):** destrói o posicionamento ("no bank login"), traz a
    reclamação nº 1 do mercado para dentro, custo por item conectado (preço
    da Plaid não está nos dossiês; a confirmar com cotação), e exige GLBA/SOC
    2 no discurso (a Monarch anunciou SOC 2 em 01/2026 como diferencial).
  - **A favor:** parte do público pergunta "e a Plaid?" antes do preço;
    patrimônio e investimentos só existem com agregador.
  - **Recomendação:** lançar **sem** Plaid, com CSV/OFX/QFX e captura forte.
    Reabrir a decisão só se as entrevistas mostrarem que mais da metade do
    ICP recusa sem sync, e então como **opt-in por conta, só leitura, com o
    custo exposto no preço** (um tier "Connected" acima do base), nunca no
    onboarding.
- **Operação:** suporte em inglês em até 24 h; status page de importação/OCR
  (versão nossa do painel de conexões da Monarch); Trustpilot e BBB
  reivindicados.

### Canais de aquisição (o que funciona para eles)

O modelo de cada concorrente, a tabela com os números e as implicações
priorizadas estão no **§7**. Esta lista é o resumo dos canais, corrigido pelos
arquivos de aquisição.

1. **Conteúdo e SEO**: blog grande é de Quicken (~900 posts), PocketGuard,
   Ramsey e YNAB; Rocket tem o rocketmoney.com/learn. Copilot e Honeydue não
   mostraram blog nas fontes, e o tamanho do da Monarch não foi encontrado.
   SEO genérico sozinho encolhe (PocketGuard, §7). Páginas que funcionam para eles:
   "alternativa a X" (Monarch vs YNAB), calculadoras públicas (PocketGuard:
   dívida, leftover), "best budgeting app for couples/families", guias de
   método. Para nós: "best budgeting app for families", "budget app without
   linking bank", "Monarch/YNAB alternative without Plaid", calculadora
   "safe to spend".
2. **Reddit**: r/ynab (~200 mil), r/MonarchMoney (empresa responde),
   r/mintuit (refugiados do Mint), r/personalfinance, r/budget. Entrar como
   fundador, com transparência, não como anúncio.
3. **Podcasts e blogs Apple** com código: o Copilot patrocina blogs Apple
   (o MacStories, com 2 meses grátis, confirmado no arquivo A; os demais vêm
   do dossiê) e roda o código 2MFREE na Meta; o YNAB tem podcast próprio; o
   Rocket mede podcast por URL de criador (`/ramit`), sem cupom. Nosso Atalho
   de Apple Pay é história para esse público.
4. **Criadores de finanças no YouTube**: a Monarch tem ~284 criadores
   patrocinados (estimativa CreatorDB) [não confirmado]; o 50% no 1º ano dela
   vem de parceria (Walmart+), e cupom por criador não foi encontrado. A NAD
   puniu afirmações sem lastro, então as nossas precisam ser medidas.
5. **Afiliados e sites de comparação** (NerdWallet, Forbes Advisor, Penny
   Hoarder, Rob Berger): quase todos aparecem nas listas, mas **programa de
   afiliados só têm 6 dos 9** (Rocket, Monarch, YNAB, PocketGuard, Empower e
   Simplifi, todos na Impact; Copilot, EveryDollar e Honeydue não). Paga-se
   por resultado, de US$ 4–10 por cadastro (Rocket) a US$ 25 por pagante
   (PocketGuard). É lento, mas é onde o americano pesquisa.
6. **Referral**: YNAB dá 6 semanas ao amigo e 1 mês a quem indica; presente
   dá 3 meses. A Monarch mediu +64% de compartilhamento ao promover a
   indicação **durante o teste**. Família já é referral embutido (cada
   convite é um usuário), como no Honeydue.
7. **Mídia paga nas redes**: existe e é grande para Rocket (~96 anúncios na
   Meta), Monarch (~78, alguns em espanhol), EveryDollar (~150) e Quicken
   (~88) em 26/10/2026, mas cada um tem uma fonte de caixa por trás. YNAB,
   PocketGuard e Honeydue têm 0. Não é canal para nós antes do LTV medido (§7).
8. **Importação de concorrente como campanha** ("switch from Monarch/YNAB in
   5 minutes", como fizeram com o Mint).
9. **Workshops ao vivo de 20 minutos** (YNAB): barato, converte e retém.

### Riscos

1. **O "sem banco" não convence o americano pagante** e fica preso ao
   público do EveryDollar grátis. Mitigação: validar antes (§12); CSV/OFX no
   dia 1; Plaid opt-in como plano B.
2. **A Monarch fecha o buraco da família** (privacidade por conta, dono em
   Orçamento, papel de menor). Ela entrega um recurso grande por mês.
3. **A fatura que bate perde força**; o nosso argumento nº 1 do Brasil vira
   nº 3 ou 4 nos EUA.
4. **Custo de aquisição**: Rocket, Monarch e Ramsey compram mídia nas redes
   (§7) e dominam a busca pelo nome; "best budgeting app" não é ganhável no
   orgânico em 2027.
5. **Lojas e IAP**: 30% no 1º ano; preço na loja maior que na web gera a
   mesma confusão que Simplifi e Copilot vivem.
6. **Legal**: sales tax por estado, auto-renewal laws, COPPA no filho,
   CCPA. Um erro aqui custa mais que a receita do 1º ano.
7. **Equipe e suporte em inglês** em outro fuso.
8. **Dispersão**: o produto brasileiro ainda está nos blocos. Lançar nos EUA
   antes de fechar o Brasil divide um time que já é pequeno.

---

## 11. O que copiar, priorizado

Esforço: P (dias), M (semanas), G (mais de um mês). Valor: alto/médio/baixo.

| # | Ideia | De quem | Valor Brasil | Valor EUA | Esforço |
|---|---|---|---|---|---|
| 1 | **Plano de quitação de dívida** (snowball/avalanche, "data livre de dívida" que se atualiza a cada pagamento) | PocketGuard, EveryDollar, Monarch | alto (82% das famílias endividadas) | alto (expectativa da categoria) | M |
| 2 | **Importar CSV de concorrente sem editar** (Mobills/Organizze no BR; Mint/YNAB/Monarch nos EUA) com mapeamento automático e "priorizar arquivo/app" | Simplifi, PocketGuard, Monarch | alto | alto (é canal) | M |
| 3 | **Página pública de status** (nossa versão: leitores de PDF/CSV por banco, OCR, captura) | Monarch, EveryDollar | médio | alto (transparência = confiança) | P |
| 4 | **"Needs Review" atribuído a um membro** + dono por transação com filtro "meu / seu / nosso" nos relatórios | Monarch (Shared Views) | alto (já temos carteiras; falta a leitura) | alto | M |
| 5 | **Match automático do pagamento da fatura** com o débito na conta + **Card Mode** (aprovar "a conferir" por swipe) | YNAB | alto | alto | M |
| 6 | **Etiqueta Under/On/Over Pace** na previsão e "Left this month/cycle" como frase | PocketGuard, Simplifi | médio | alto (vocabulário deles) | P |
| 7 | **Recibo por e-mail** (encaminhar para um endereço de captura) | Monarch | médio | alto (substitui o WhatsApp) | M |
| 8 | **Alerta de aumento de assinatura** (já no catálogo de insights) e lista de assinaturas com ação | Rocket, Simplifi | médio | alto | P |
| 9 | **Teste longo sem cartão + referral com mês extra para os dois lados + presente** | YNAB | médio | alto | P |
| 10 | **Resposta pública e humana** nas lojas e no Trustpilot | YNAB | médio | alto | P (processo) |
| 11 | **Calculadoras públicas** (dívida, "safe to spend", juros do rotativo) como porta de SEO | PocketGuard, Empower (Fee Analyzer) | médio | alto | P |
| 12 | **Modo demo sem conta** e **Month/Year in Review** | Copilot | médio | médio | M |
| 13 | **Comentário/reação por transação e por conta a pagar**; lembrete de conta que chega aos dois | Honeydue | médio (casal) | médio | M |
| 14 | **Páginas "alternativa a X"** e comparativo honesto no blog | Monarch, PocketGuard, Ramsey | médio | alto | P |
| 15 | **Workshops ao vivo de 20 min** | YNAB | baixo (hoje) | médio | P (processo) |
| 16 | **IA com ação e aprovação** ("preparo, você aprova": recategorizar em lote, criar regra do que a pessoa corrigiu) | Simplifi, Rocket (Rowan) | médio | médio | G |
| 17 | **MCP com leitura e escrita separadas** | Monarch, Copilot | baixo | médio (nicho técnico, mídia) | M |
| 18 | **Paycheck planning** (dividir o mês por data de pagamento) | EveryDollar, Simplifi | baixo (salário mensal) | alto | M |
| 19 | **Juros do cartão como linha própria** ("Credit Card Interest") | YNAB | médio (rotativo) | alto | P |
| 20 | **"Pague o que achar justo"** | Rocket | baixo (não) | baixo (não) | — |

Prioridade sugerida para **antes** de qualquer EUA: 1, 2, 4, 5, 8, 9, 10
(servem o Brasil hoje). Só EUA: 6, 7, 18, 19.

---

## 12. Perguntas em aberto e como validar (com o mínimo de dinheiro)

| # | Pergunta | Como validar | Custo | Sinal de "sim" |
|---|---|---|---|---|
| 1 | O americano **paga** US$ 79/ano por um app de família **sem conexão bancária**? | Landing page em inglês com preço na porta, 3 telas, "no bank login" como título, lista de espera com e-mail e um botão "pre-order US$ 59 (refundable)"; tráfego de Reddit e de 2–3 posts em blogs | ~US$ 0–300 | ≥5% da lista pré-compra; ≥2% dos visitantes entram na lista |
| 2 | "Sem banco" é **virtude ou falta**? | 15–20 entrevistas de 30 min com gente que postou sobre sync quebrado em r/ynab, r/MonarchMoney, r/mintuit (oferecer US$ 25 de gift card) | ~US$ 500 | Mais da metade diz que trocaria sync por captura de 2 segundos + CSV |
| 3 | O **filho-convidado com limite** é desejado no mesmo app, ou a família americana usa Greenlight e similares à parte? | Nas mesmas entrevistas + pergunta na landing ("who would use it with you?") | 0 | ≥30% citam adolescente |
| 4 | O "**statement que bate**" tem valor nos EUA? Quanto? | Mostrar protótipo de conferência de statement (CSV do Chase/Amex) nas entrevistas; pedir nota de 1 a 5 contra "safe to spend" e "family roles" | 0 | Fica acima de 3 e não é o último |
| 5 | **Plaid opcional** ou não? | Pergunta A/B na landing: duas versões, uma "no bank login" e outra "bank sync optional"; comparar conversão da lista | ~US$ 100 | Se "optional" converte ≥1,5× mais, reabrir a decisão |
| 6 | Qual o **canal de captura** americano? Atalhos/Apple Pay, SMS, e-mail? | Perguntar nas entrevistas e medir no beta fechado (50 famílias) qual canal lança mais | 0 | Um canal com ≥50% dos lançamentos |
| 7 | **Preço**: US$ 59, 79 ou 99? | Van Westendorp com 4 perguntas na lista de espera (a `founder-pricing` já faz isso) | 0 | Faixa aceitável que contenha 79 |
| 8 | A **Monarch** vai fechar a família em 2027? | Acompanhar r/MonarchMoney e o changelog mensal; checar Shared Views e "privacidade por conta" a cada trimestre | 0 | Se lançarem papel de menor e privacidade por conta, reposicionar em captura + cobrança |
| 9 | **Sales tax, entidade e auto-renewal**: o que é obrigatório para vender SaaS B2C nos EUA a partir do Brasil? | Uma consulta com contador/advogado de SaaS nos EUA; cotação de Paddle/Lemon Squeezy como merchant of record | ~US$ 300–800 | Caminho com custo fixo < US$ 100/mês até a 1ª receita |
| 10 | **Nome e marca** funcionam em inglês? Domínio e App Store livres? | Busca de marca (USPTO TESS), domínio, nome na App Store | ~US$ 0–50 | Sem conflito |
| 11 | O **beta fechado** segura a família por 4 semanas? | 50 famílias da lista, 14 dias de teste + 2 semanas; medir: todos os adultos lançaram na semana 1, o filho lançou, "seguro para gastar" aberto ≥3×/semana | custo do suporte | ≥40% das famílias ativas na semana 4 |

Ordem: 10 → 1 → 2 e 3 (juntas) → 7 → 5 → 4 → 9 → 11. Tudo antes de escrever
uma linha de código específica para os EUA além do i18n.

---

## 13. Fontes

Este estudo não fez pesquisa nova. Todos os números vêm de:

- **Checagem (vence os dossiês):** [2026-10-26-checagem.md](2026-10-26-checagem.md)
- **Dossiês:**
  - [Rocket Money](2026-10-26-rocket-money.md)
  - [Monarch Money](2026-10-26-monarch-money.md)
  - [YNAB](2026-10-26-ynab.md)
  - [PocketGuard](2026-10-26-pocketguard.md)
  - [Empower](2026-10-26-empower.md)
  - [Quicken Simplifi](2026-10-26-quicken-simplifi.md)
  - [Honeydue](2026-10-26-honeydue.md)
  - [Copilot Money](2026-10-26-copilot-money.md)
  - [EveryDollar](2026-10-26-everydollar.md)
- **Aquisição (§7):**
  - [Aquisição A: Rocket Money, Monarch, Copilot](2026-10-26-aquisicao-a.md)
  - [Aquisição B: YNAB, EveryDollar, PocketGuard](2026-10-26-aquisicao-b.md)
  - [Aquisição C: Empower, Simplifi, Honeydue](2026-10-26-aquisicao-c.md)
  - [Anúncios ativos na Meta, lidos em 26/10/2026](2026-10-26-anuncios-meta.md)
    (vence o "não encontrado" de Meta dos três arquivos acima)
- **Nosso produto:**
  - [Estratégia de produto (21/10/2026)](../../2026-10-21-estrategia-de-produto.md)
  - [Dossiê de ICP (20/10/2026)](../../2026-10-20-icp.md)
  - [Proposta funcional (20/10/2026)](../../../superpowers/specs/2026-10-20-proposta-funcional-design.md)

Divergências aplicadas da checagem sobre os dossiês: Simplifi (promo até
25/11/2026; mensal US$ 9,99 na App Store; Plaid/Finicity via busca),
PocketGuard (CEO Savransky), Rocket (App Store 4,5 com 403 mil; Play 4,5 com
141 mil; página de preço 404), Honeydue (Play 4,2 com 2,85 mil), Copilot (sem
compartilhamento nativo; só Magic Link), Monarch (4,9 com 116 mil; cartão no
teste confirmado), YNAB (loja diz 30 dias).

O que fica sem fonte nos dossiês e está marcado como **[hipótese]** no texto:
o custo da Plaid, a aplicação da GLBA sem agregador, as regras de sales tax
por estado, o tamanho do segmento "manual" pagante, o uso de Greenlight e
similares pela família americana, e as taglines.
