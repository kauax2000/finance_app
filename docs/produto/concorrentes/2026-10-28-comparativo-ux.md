# Comparativo de experiência: nós × Monarch, Copilot, YNAB, Rocket, Simplifi (28/10/2026)

Compara funcionalidades, divisão de telas, botões, usabilidade das tarefas,
design visual, organização e entrega de valor.

Fontes:
- **Concorrentes:** telas do Mobbin, iOS e web. A matriz completa, com o link de
  cada célula, está em
  [telas-mobbin/matriz-concorrentes.md](telas-mobbin/matriz-concorrentes.md); o
  resumo do estudo, em
  [2026-10-28-estudo-telas-mobbin.md](2026-10-28-estudo-telas-mobbin.md).
- **Nós:** código, `docs/JORNADAS.md` e o app rodando. Vimos o desktop a
  1440 px e o telefone a 375 px, só lendo. O perfil completo está em
  [telas-mobbin/nosso-app.md](telas-mobbin/nosso-app.md).

Como ler:
- **Nós (produção)** é o que está em `main` hoje. **Nós (2.0)** inclui o que está
  na branch `finance-app-2.0`, quase tudo ainda como wireframe e **nada
  publicado**. A distância entre as duas colunas é o tamanho do risco.
- **julgamento** marca opinião. Os passos são estimados: contados nas telas e no
  código, sem cronômetro.
- Abreviações: **M** Monarch, **C** Copilot, **Y** YNAB, **R** Rocket Money,
  **S** Quicken Simplifi.

---

## 1. Placar

| Dimensão | Melhor concorrente | Nós (produção) | Nós (2.0) | Leitura (**julgamento**) |
|---|---|---|---|---|
| Funcionalidades | M | atrás: falta IA, regras, relatórios e desfazer | **à frente nos diferenciais** | nenhum dos cinco tem fatura, parcela, estorno ligado à fatura, quem pagou, papéis nem captura por frase |
| Divisão de telas | M (telefone), C/Y (desktop) | no nível do M | no nível do M | Cartões, o diferencial nº 1, fica a 3 toques no telefone |
| Botões e ações | Y | atrás: excluir não tem volta, sem desfazer, lote só exclui | atrás | a paleta ⌘K é a melhor das seis |
| Tarefas-chave | C | lançar: o melhor no desktop | lançar e fatura: os melhores | "quanto sobra" não existe em produção e deu erro no 2.0 |
| Design visual | C | forte e próprio | o wireframe destoa (de propósito) | marca P&B + vidro do iOS 26 é a identidade mais distinta; o KPI trunca no telefone |
| Organização | M | bom | bom | carteiras múltiplas (Casa, Viagem…) é único; o orçamento mora na categoria |
| Entrega de valor | Y | **atrás**: painel vazio, sem caminho guiado | melhor no papel (`/comecar`, teste sem cartão) | o melhor preço e o pior "aha" |
| Telefone × desktop | M | deliberado | deliberado | a frase da IA só existe no telefone |

**Resumo:** o 2.0 ganha onde o mercado inteiro é vazio (fatura, família,
captura, cobrança). Perde no básico que todos já fazem: desfazer, revisar com
regra, "quanto sobra" na primeira tela e valor no primeiro minuto. **Julgamento:**
isso é corrigível antes do lançamento, e os itens estão no §9.

---

## 2. Funcionalidades

Sim, Parcial, Não ou WF (existe só como wireframe no 2.0). Nas colunas dos
concorrentes, "?" quer dizer que a função não foi vista nas telas, o que não
prova que não exista.

| Função | M | C | Y | R | S | Nós (produção) | Nós (2.0) |
|---|---|---|---|---|---|---|---|
| Painel | Sim | Sim ("$X left") | Parcial (o Plan) | Sim | Sim | Sim (4 KPIs, calendário, rosca, faturas, parcelas) | + Seguro para gastar, Insights, A conferir (WF) |
| Lançamento manual | 7 campos | só conta manual | 8 campos | 4 campos | 15+ campos | **1 obrigatório** (valor) | idem |
| Lançar por frase / foto | Não | Não | Não | Não | Não | Não | **Sim (só telefone, IA não publicada)** |
| Apple Pay / atalho / compartilhar | Não | Não | Não | Não | Apple Wallet como **conexão** | Não | Sim (não publicado) |
| Regras / auto-categorizar | Sim, com prévia | Sim | ? | Sim, "+ Rule" | Parcial | Não | Parcial ("Lembrar como este cartão") |
| Fila de revisão | Sim, com dono | Sim | Approve | Parcial | Switch | Não | A conferir (WF), sem dono |
| Orçamento | Sim (baldes) | Sim | núcleo | Sim | cascata | limite na categoria | + assistente pela renda |
| Recorrentes / assinaturas | Sim | Sim (regra em frase) | Parcial | **destaque** | Sim | Sim (vira lançamento sozinha) | idem |
| Cancelar assinatura | Não | Não | Não | Sim (pede a senha do serviço) | Não | pausar ou excluir | idem |
| Contas a pagar | Parcial | Parcial | Parcial | Sim | Sim | **Sim** (pendentes, "Pagar", lembretes) | + "Isso pagou a conta X?" (WF) |
| **Fatura com ciclo** | Não | Não | Não | Não | Não | **Sim** (Futura, Aberta, Não paga, Paga) | + Conferir PDF/CSV/OFX (WF) |
| **Parcelas** | ? | ? | ? | ? | ? | **Sim** ("k de n", restante) | + Impacto da parcela (WF) |
| Estorno / reembolso | ? | ? | ? | Parcial | Refund Tracker | Não | estorno abate a fatura (WF) |
| Metas / patrimônio | Sim | Sim | Sim | Parcial | Sim | Não (fora de propósito) | Projetos (WF) |
| Relatórios | Sankey, salvos | Parcial | Reflect | Parcial | 9 relatórios | detalhe da categoria, hábitos do cartão | + linha do tempo de 6 meses (WF) |
| Chat de IA | ? | ? | Não | Não | Sim (web, beta) | Não | MCP para IA externa (WF) |
| Família | acesso total | Não | plano inteiro | switch | Não | carteira compartilhada, Membros | **papéis Dono, Membro, Convidado** (WF) |
| **Quem pagou / acerto** | Não | Não | Não | Não | Não | Não | **Sim** (WF) |
| Limite por pessoa | Não | Não | Não | Não | Não | Não | Sim (WF) |
| Exportar | CSV | CSV | Sim | CSV | ? | CSV de assinaturas | Cofre: ZIP de tudo (WF) |
| Busca global | ⌘K | ? | ? | ? | ? | **⌘K: telas, ações e transações no banco, com escopo `/`** | idem |
| Tema escuro | Parcial | Sim | Sim | ? | Sim | **Sim, completo** | idem |
| Ocultar valores / sem depender de cor | Parcial | Parcial | **Sim** | ? | ? | não visto | não visto |
| Desfazer | toast | Undo | Undo/Redo | ? | Undo | **Não (excluir é físico)** | Não (o Piloto desfaz só o automático) |

**Leitura (julgamento):**
- Em produção, nós já somos os únicos com **fatura por ciclo, parcelas e contas
  a pagar** completos.
- O 2.0 soma aquilo que nenhum dos cinco tem: conferir a fatura, estorno na
  fatura, quem pagou, papéis, limite por pessoa e captura por frase, foto e
  Apple Pay.
- O buraco é o "básico invisível" que os cinco já têm: **desfazer, regras e
  revisão com dono**.

---

## 3. Divisão de telas e arquitetura

| | Telefone | Desktop | Detalhe abre em | Configurações |
|---|---|---|---|---|
| M | tab bar de 5 que a pessoa personaliza + gaveta "More / Household" | sidebar com 10 itens + coluna Summary | folha com ↑↓ (web), página (iOS) | Account × Household |
| C | **sem tab bar**: 8 pílulas no topo | 3 colunas, detalhe fixo | folha (iOS), painel fixo (web) | engrenagem e modal |
| Y | tab bar de 5 com "+" central e aba Help | 3 colunas com inspetor | inspetor (web), folha (iOS) | "⋯", parte em webview |
| R | tab bar de 5 + gaveta More | sidebar com 7 itens | página (iOS), modal (web) | gaveta More |
| S | **só gaveta** | trilho de ícones + árvore de contas | página (iOS), painel (web) | gaveta da direita |
| **Nós** | **BottomBar de vidro com 4 abas** (Painel, Transações, Categorias, Você) **+ "+"**; a página **Você** reúne mais 8 destinos em 2 grupos; o cabeçalho tem a carteira no centro, sino ou voltar e lupa | sidebar flutuante recolhível com 9 itens e o "+ Adicionar" no topo; busca no centro da barra | folha lateral (desktop), gaveta (telefone) | Carteira (Configurações) × Conta (Minha conta), como no M |

**Leitura (julgamento):**
- **O telefone segue o padrão bom** (abas + hub nomeado, como o M). A página
  "Você" é mais legível que a gaveta do M e do R.
- **A escolha das 4 abas contradiz o produto.** O diferencial nº 1 é a fatura,
  e **Cartões fica a 3 toques** (Você › Cartões › cartão), enquanto Categorias
  ocupa uma aba. Trocar Categorias por Cartões, ou fazer a aba "Cartões" abrir
  direto a fatura aberta, põe a promessa a 1 toque.
- **O desktop está a meio caminho do melhor.** A lista com folha lateral funciona,
  mas C e Y mantêm o detalhe fixo ao lado da lista, e revisar em sequência não
  fecha nada. O M resolve com setas ↑↓ na folha, que é o passo menor para nós.
- **9 itens de primeiro nível** na lateral é mais que o C (6) e o R (7), e mais
  enxuto que o M (10). Projetos (WF), no meio da lista principal, empurra os
  itens diários para baixo.
- O cabeçalho do desktop **não diz em que tela a pessoa está** (o `<h1>` é
  oculto). Nenhum dos cinco faz isso. Só a lateral marca a tela atual.

---

## 4. Botões e ações

| | Ação primária | Cor | Lote | Desfazer / regra | Teclado |
|---|---|---|---|---|---|
| M | "+ Add transaction" no cabeçalho | laranja | edição em massa com "No change" e confirmação | toast que vira regra | ⌘K, ⌘A, Esc |
| C | "+" flutuante em cada seção | azul | caixa por linha | Undo / Recalcular | ? |
| Y | "+" central na tab bar (cinza) | lima/verde | barra flutuante + **soma da seleção** | Undo/Redo fixos | C, M, ⇧U, ⇧D |
| R | ⊕ no cabeçalho | vinho/vermelho | ? | "+ Rule" | ? |
| S | ⊕ e ✦ da IA | roxo | ? | Undo | ⌘⇧0 |
| **Nós** | **"+ Adicionar"** no topo da lateral (desktop) e **"+" redondo** ao lado da pílula (telefone); "Nova transação" partido com "Mais tipos" na lista | **preto** (branco no escuro); o arco-íris só numa peça de marca | barra flutuante: Editar (só com 1), Excluir, Limpar; Shift para faixa; menu de botão direito | **nenhum**: excluir é físico; toast "Transação criada · Ver" | **⌘K com escopo `/`** |

**Leitura (julgamento):**
- **A hierarquia é a mais disciplinada das seis**: um `primary` por tela, par
  primary + tertiary e o "+" sempre no mesmo lugar. O preto da tecla lê como
  ação sem disputar com o vermelho e o verde do dinheiro, que o laranja do M e o
  vermelho do R disputam.
- **O lote é o mais pobre.** Só exclui, ou edita uma. Faltam categorizar em lote
  e marcar conferido (M, Y), e a soma da seleção (Y).
- **Desfazer é a lacuna mais cara.** Todos os outros têm, e o nosso único
  "excluir" não tem volta (lacuna 6 do `JORNADAS.md`).
- **Corrigir sem regra.** O M e o R transformam a correção em regra no toast.
  Para nós isso pesa mais, porque a captura por frase vai gerar correções
  repetidas.
- **A paleta ⌘K é a melhor das seis.** Ela busca transações no banco por valor e
  data, tem escopo `/` e as ações "Nova despesa", "Nova parcelada"…

---

## 5. Usabilidade das tarefas-chave (passos estimados)

| Tarefa | Melhor concorrente | Nós (desktop) | Nós (telefone) |
|---|---|---|---|
| **Lançar um gasto de cartão** | C: ~4 (só conta manual); R: ~5 com 4 campos | **3 cliques + 1 campo** (valor; o cartão vem pré-escolhido) | **2 toques + 1 frase** ("42 mercado nubank"), não publicado. Apple Pay: **0** (não publicado) |
| **Ver quanto sobra no mês** | C: **0** ("$577 left" contra a reta do ritmo) | 2.0: 0 ("Seguro para gastar"), mas **ao vivo deu "Não foi possível carregar a previsão."** Produção: não existe; o KPI "Resultado" é receita − despesa | igual |
| **Ver a fatura atual** | nenhum tem fatura | **2 cliques** (Cartões › cartão); 1 pelo bloco "Faturas do mês" do Painel | **3 toques** (Você › Cartões › cartão); 1 rolando o Painel |
| **Revisar ou corrigir** | C: bloco TO REVIEW no painel; M: fila com dono e ↑↓ | lápis na linha › Salvar = 3; A conferir (WF) › Confirmar = 2 | 5 toques (Transações › linha › ⋯ › Editar › Salvar) |
| **Convidar o parceiro** | Y: ~4 (só na web); M: ~5 com aviso de acesso total | 3 cliques + e-mail, **mas só numa carteira compartilhada**. Na pessoal, criar a carteira antes (+3 e um nome); o erro só aparece no servidor (lacuna 1) | 4 toques + e-mail, com o mesmo pré-requisito |
| **Cancelar assinatura** | R: ~5, pedindo a senha do serviço | pausar = 3; excluir = 4 | 4 |
| **Criar orçamento** | C: vem sugerido no onboarding; S: guiado em 4 passos | assistente de 3 passos com "Sugerir pela renda", **só ao abrir Categorias** | igual |

**Leitura (julgamento):**
- **Lançar é o nosso melhor momento**: um campo obrigatório no desktop e uma frase
  no telefone, contra 4 a 15 campos nos outros.
- **"Quanto sobra" é o pior.** O C ganha por pôr o número na primeira linha, e
  nós ainda não temos esse número em produção. No 2.0 ele existe, mas quebrou ao
  vivo.
- **O convite tem um degrau escondido**: a carteira pessoal não aceita convite e
  avisa tarde. Ao convidar da carteira pessoal, o certo seria criar a
  compartilhada no próprio fluxo.
- **Corrigir no telefone custa 5 toques.** O C resolve com a folha que abre ao
  tocar na linha, e o M com ↑↓.

---

## 6. Design visual

| | Marca e cor | Densidade | Gráfico | Escuro | Vermelho e verde |
|---|---|---|---|---|---|
| M | creme + laranja | web densa, iOS arejado | área, Sankey | parcial | vermelho grande no orçamento novo |
| C | azul-marinho + azul | alta | linha contra o ritmo, anéis | **destaque** | muito vermelho cheio |
| Y | creme, lima, roxo | web muito densa | barra sob cada linha | sim | **cor sempre com frase** |
| R | degradê vinho | média | anel com ícones | ? | negativo em laranja |
| S | roxo chapado | web densa | rosca e cascata | sim | salmão |
| **Nós** | **preto e branco; arco-íris só em peça de marca**; vidro estilo iOS 26; cápsulas; Inter + Ledger serifada nos títulos | média-alta no desktop; lista e 2 KPIs no telefone | rosca, barras de parcelas, calendário em grade | **completo, com todo token em par** | `income`/`expense` separados de `success`/`destructive` |

**Leitura (julgamento):**
- É a identidade **mais distinta** das seis e a mais "nativa" no telefone
  (pílula de vidro, alvos de 44, borrão de borda). O preto como cor de ação
  deixa o dinheiro falar.
- **O que piora a leitura hoje:**
  - **Os rótulos dos KPIs truncam a 375 px** ("D…", "RECEI…"). Num painel de
    números, o rótulo é a metade da informação.
  - **A cor não vem com frase.** O Y escreve "Funded. Spent $50 of $200" sob a
    barra; nós temos a barra de risco em 85/100% sem a frase.
  - **O wireframe tracejado convive com a tela pronta** no Painel, nos Cartões e
    em Membros. É proposital (`AGENTS.md`), mas um usuário real não pode ver isso
    em produção: a revisão de tela precisa vir antes de publicar.
- **Ilustração:** o Y e o C usam ilustração para ensinar; nós só usamos o
  `EmptyStateGhost`, sem cena. **Julgamento:** combina com a marca sóbria, desde
  que o vazio diga o próximo passo.

---

## 7. Organização da informação e linguagem

- **Unidade da casa.** O M tem uma "Household" por conta. Nós temos **várias
  carteiras** (Pessoal, Casa, Casal, Viagem, Reforma, Evento), e privacidade se
  faz com outra carteira. **Julgamento:** é o modelo mais flexível das seis, mas
  o seletor de carteira no centro do cabeçalho precisa deixar claro **em qual
  carteira se está lançando**. O lançamento cai na carteira ativa.
- **Orçamento.** No C, no Y e no M ele é uma tela própria. Nós pusemos o limite
  na categoria. **Julgamento:** é mais simples e no estilo do C. O risco é que a
  pessoa não ache "orçamento"; a busca com sinônimos já cobre.
- **Configurações:** Carteira × Conta, a mesma divisão que o M faz entre
  Household e Account.
- **Linguagem.** "A conferir", "Seguro para gastar", "Você", "Cofre aberto" e
  "Piloto Automático" são português direto, sem jargão. O Y é o oposto (Ready to
  Assign, Cleared, Age of Money). **Julgamento:** é uma vantagem, se os nomes
  ficarem estáveis. "Cofre aberto" e "Piloto" precisam de uma frase de apoio na
  primeira vez.

---

## 8. Entrega de valor

| | Antes do valor, pede | Paywall | "Aha" | Vazio |
|---|---|---|---|---|
| M | e-mail, código, perguntas, **cartão** | antes dos dados | a casa inteira + Needs review | cartões fantasma |
| C | banco via Plaid | App Store; a web pede pagamento | "esses números estão certos?" + "$X left"; **Demo Mode** | "30 transações para liberar" |
| Y | nome e quem mora na casa | iOS depois do plano; web sem cartão | **plano pronto antes da conta** | pergunta do método |
| R | **conta corrente obrigatória** | "pague o que acha justo" + débito | "Economize até $768/ano" | checklist 5/7 |
| S | e-mail, **celular** | **antes do app** | "Available per day" | ilustrado |
| **Nós** | **nome, e-mail, senha**: sem banco, sem cartão, sem celular | grátis para sempre; teste de 14 dias **sem cartão**; o só-leitura está desligado | **não há um definido.** O Painel nasce quase vazio; `/comecar` (WF) explica em 4 passos | 12 categorias e a carteira prontas, mas sem dado |

**Leitura (julgamento):**
- **Pedimos menos que todos e entregamos o "aha" mais tarde.** Sem banco
  conectado, o valor depende de a pessoa lançar. Os outros resolvem com o banco
  (C, R), com o método (Y) ou com o demo (C).
- **O nosso "aha" é a fatura que bate.** O primeiro minuto devia ser: "envie o
  PDF da fatura do seu cartão" (ou "diga um gasto") → a fatura aparece separada
  em parcelas, com o total conferido. Isso já existe no repositório (Conferir
  fatura, Importar extrato e frase), mas está atrás de wireframe e fora do
  primeiro caminho.
- **Cobrança é onde vencemos sem disputa:** nenhum dos cinco oferece teste sem
  cartão no iOS. A linha do tempo do teste (C, M) com o final "volta ao grátis,
  nada é cobrado" seria a versão mais forte do mercado.

---

## 9. Telefone × desktop

| | Divisão |
|---|---|
| M, Y | o mesmo modelo, com a forma nativa de cada plataforma; a web concentra o trabalho pesado |
| C, S | uma das plataformas perde funções: no C, Goals e Cash flow somem da web; no S, a IA não está no iOS |
| **Nós** | o mesmo modelo. **Telefone:** a frase e a foto, a BottomBar e a página Você. **Desktop:** o formulário de um campo, a tabela com lote e o ⌘K. A frase da IA **só existe no telefone**, e o desktop usa sempre o formulário (commit `8534311d`) |

**Julgamento:** a divisão é deliberada, como no M e no Y. A frase pode entrar no
desktop pela paleta ⌘K ("42 mercado nubank" → revisão), sem tirar o formulário.

---

## 10. Fintechs famosas (Revolut, Wise e outras)

Os estudos completos estão em
[telas-mobbin/neobancos.md](telas-mobbin/neobancos.md) e
[telas-mobbin/pagamentos.md](telas-mobbin/pagamentos.md), e as telas em
[telas-mobbin/fintechs/](telas-mobbin/fintechs/).

**Cobertura.** Revolut (iOS 24, web 8), Monzo (iOS 27), N26 (15), Starling
(17), Chime (13), Wise (iOS 20, web 16), Cash App (25), PayPal (iOS 10, web 8),
Venmo (7), Klarna (20), Apple Wallet/Card (12), Cleo (18), Splitwise (18) e
Expensify (web 10). Nubank, Robinhood, Ramp e Brex não estão no Mobbin. Nenhum
deles tem fatura de cartão com parcelas como a nossa.

**O que dá para aplicar.** Cada item vem com o diferencial que reforça e o
esforço. Tudo é **julgamento**.

| # | Padrão | De quem | No nosso contexto | Diferencial | Esforço |
|---|---|---|---|---|---|
| F1 | **Fatura montada linha a linha**: saldo anterior + compras + juros − pagamentos e estornos = total, com "Baixar PDF" | Apple Card | o total da fatura auditável; a diferença com o PDF aparece como uma linha a mais | fatura que bate | M |
| F2 | **"Aparece na fatura como"**: o texto cru do extrato ao lado do nome limpo | Apple, Mercury | casa a linha do PDF com o lançamento e é a base da regra "sempre que vier X, é Y" | fatura que bate, captura | P |
| F3 | **Meta de gasto que nasce do histórico**: "você gasta em média R$ X", com 12 barras, "Manter / 5% a menos / 10% a menos" e "Isto não parece certo?" | Monzo | o assistente de categorias deixa de pedir número do zero | quanto sobra | M |
| F4 | **Calendário das contas**: "Total do mês · Ainda a pagar · próxima em 2 dias", com o logo e o valor dentro do dia | Monzo | a fatura entra no dia do vencimento e o fechamento vira marca; é o `Calendar variant="agenda"` que já existe | contas a pagar, fatura | M |
| F5 | **Status em etapas com horário** | Wise | o lançamento por frase ou Apple Pay (recebido → lido pela IA → a conferir → conferido), o estorno esperado e a parcela | captura, estorno | M |
| F6 | **Divisão numa frase**: um botão-frase "Pago por você, dividido igualmente" abre 4 atalhos escritos por extenso, e cada carteira tem a divisão padrão por cotas | Splitwise; Wise (dividir a partir de um lançamento) | o "Quem pagou" do Bloco 7C sem formulário | família | M |
| F7 | **Simulação do juro de pagar menos** | roda de pagamento do Apple Card | "Pagando R$ X, o rotativo deve custar ~R$ Y", sempre marcado como estimativa quando a taxa do cartão é desconhecida | fatura, honestidade | M |
| F8 | **O ciclo reinicia no dia do salário**: dia escolhido em chips, prévia do intervalo, joga para o dia útil seguinte | Klarna, Monzo, Revolut, Starling | o mês da casa pode começar no salário (com a opção "5º dia útil"); o do cartão já é o ciclo da fatura | quanto sobra | M–G (mexe nas somas) |
| F9 | **A transação como central de ações**: dividir em categorias, dividir com pessoas, comprovante, notas e #tags, e "é recorrente" que manda para Contas a pagar | Monzo | a folha de detalhe vira o lugar de transformar um gasto em assinatura ou conta | captura, família | M |
| F10 | **Assinatura "não cobrou na data esperada"** | Revolut | "não lançada na data esperada", com "lançar agora / pular / cancelei" | assinaturas | P–M |
| F11 | **Contar só uma parte do valor**, e escolher se a exclusão vale "só para esta / todas deste comerciante" | Revolut | a fatura soma o total e o orçamento da casa soma só a parte da casa | família, fatura | M |
| F12 | **IA que responde com prova**: primeiro o lançamento ou gráfico que embasa, depois a frase ("Pode gastar R$ 20"), depois a ação; 3 perguntas sugeridas no vazio e "a IA pode errar" fixo | Cash App, Cleo (a forma, não o tom) | os Insights e uma futura pergunta à IA | IA | M |
| F13 | **Teste que mostra o uso**: "faltam 6 dias", "não vamos cobrar" e "o que você mais usou", com números reais | Monzo Extra, N26 | soma-se à linha do tempo do teste sem cartão (§11, item 13) | cobrança honesta | P–M |
| F14 | **A privacidade do filho explicada a ele** | Starling | a tela do Convidado diz o que ele vê e o que os pais veem | família | P |
| F15 | **Busca que já devolve a soma** | N26 | o ⌘K com "mercado outubro" mostra o total do recorte | — | P |
| F16 | **Pendente acima do confirmado, com desfazer** | Wise, Cash App | "A conferir" no topo da lista de transações | captura | P |
| F17 | **Teclado de valor que faz conta** ("12+8,50") | Revolut, Venmo | mexe no `Input money`, componente do design system: **pede o ok do dono** | captura | M |

**Não se aplica:**
- Potes e cofres que movem dinheiro, bloquear cobrança, pagar por chat, Flex,
  score, perks, tabela de quatro planos e upsell dentro da lista. Nós não somos
  banco nem movemos dinheiro.
- O "ocultar esta compra" do Klarna: entre adultos a carteira é pública.
- O tom provocador do Cleo.

**Leitura (julgamento):** os neobancos e as fintechs de pagamento reforçam os
nossos diferenciais mais que os apps de orçamento. O Apple Card dá a fatura
auditável (F1, F2, F7), o Splitwise dá a divisão (F6), o Wise dá a captura com
status (F5) e o Monzo dá o orçamento e o calendário (F3, F4). Os quatro cabem
sem conectar banco nenhum.

---

## 11. O que fazer, por impacto

Cada item diz de quem é o padrão. Os que mudam tela entram como wireframe
primeiro, conforme o `AGENTS.md`.

| # | O quê | Por quê | Padrão de | Esforço |
|---|---|---|---|---|
| 1 | **Consertar o "Seguro para gastar"** e torná-lo o número-herói do Painel, com o valor por dia, a reta do ritmo e o mesmo trecho do mês passado | é a pergunta nº 1 e o único quesito em que estamos zerados | C, S, Monzo | M |
| 2 | **Desfazer no lugar de excluir físico** (toast "Excluída · Desfazer" e lixeira de 30 dias) | todos têm; perder dado contradiz "seus dados são seus" | Y, C, S | M |
| 3 | **Cartões na BottomBar** (no lugar de Categorias), abrindo direto na fatura aberta | o diferencial nº 1 sai de 3 toques para 1 | **julgamento** | P |
| 4 | **O primeiro minuto é a fatura**: no `/comecar` ou no Painel vazio, "envie o PDF da fatura" ou "diga um gasto" | o "aha" que só nós podemos dar | Y (valor antes), C (revisão) | M |
| 5 | **Frase de estado sob cada barra** (categoria e fatura): "Faltam R$ 320 para a fatura de 10/nov" | a cor sem frase não explica | Y | P |
| 6 | **A conferir com dono + "criar regra" no toast** depois de corrigir | a captura por frase vai gerar correções repetidas | M, R | M |
| 7 | **Lote completo**: categorizar, marcar conferido e a soma da seleção | o lote de hoje só exclui | Y, M | P |
| 8 | **Convite que cria a carteira compartilhada** quando a pessoa está na pessoal | o degrau escondido de hoje falha no servidor | **julgamento** | P |
| 9 | **Setas ↑↓ na folha de detalhe** (desktop) e folha ao tocar na linha (telefone) | corrigir custa 5 toques | M, C | P |
| 10 | **Rótulos dos KPIs inteiros a 375 px** | metade da informação some | — | P |
| 11 | **Frase no ⌘K do desktop** | a IA não deve existir só no telefone | — | P |
| 12 | **Ocultar valores** (o olho) e "sem depender de cor" | uso em público e acessibilidade | Y | P |
| 13 | **Linha do tempo do teste sem cartão** no paywall | a cobrança honesta vista, não só dita | C, M, Y | P |
| 14 | Detalhe fixo ao lado da lista no desktop | revisar em sequência sem fechar | C, Y | G |
| 15 | **Fatura montada linha a linha + "aparece na fatura como"** | o total que bate e a casa com o PDF à vista | Apple Card (F1, F2) | M |
| 16 | **Divisão numa frase, com cotas por carteira** | o "Quem pagou" sem formulário | Splitwise (F6) | M |
| 17 | **Meta pela média + calendário das contas** | orçamento e contas a pagar com menos digitação | Monzo (F3, F4) | M |

**Não copiar:** cartão no teste, paywall antes do app, celular obrigatório,
senha de terceiros para cancelar, formulário de 7 a 15 campos, jargão contábil,
vermelho gritante no primeiro dia e navegação só por gaveta ou só por pílulas.
