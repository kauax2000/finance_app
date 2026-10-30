# Perfil de UX — Finance App (o nosso)

Branch `finance-app-2.0`, 28/10/2026. Base: `docs/JORNADAS.md`, o código em `src/` e o app rodando em `http://localhost:3000` (sessão já logada, banco de produção, só leitura: nada foi salvo, enviado ou editado).

Legenda das marcas:
- **[código]** lido no fonte (caminho:linha).
- **[tela ao vivo]** visto no app rodando (desktop 1440×900 e telefone 375×812).
- **[doc/plano]** dito em `docs/JORNADAS.md` ou na proposta funcional, sem conferência minha no código ou na tela.

Ressalva geral: quase tudo dos Blocos 2 a 9 (fatura conferida, captura, IA, planos, previsão, insights, papéis, divisão) existe no repositório **como wireframe** (caixa tracejada, `font-mono`, etiqueta "WIREFRAME · Bloco N") e **não foi publicado** em produção (`docs/JORNADAS.md:2106-2172`, lacunas 12, 14, 26, 28, 36, 40, 43, 58, 67, 69, 90, 99, 100) [doc/plano]. Na comparação com concorrentes, separe o "app de produção (main)" do "2.0 em wireframe".

---

## 1. Navegação e arquitetura

### Desktop (≥ 768px)
- **Barra lateral flutuante, recolhível** (vira trilho de 64px de ícones) [código `src/components/layout/app-sidebar.tsx:41`] [tela ao vivo].
  - Topo: seletor de carteira (nome da carteira + chevron) e o botão primário **"+ Adicionar"** em largura total [tela ao vivo].
  - Itens principais (`MAIN_NAVIGATION`, `src/config/navigation.ts:108-128`) [código] [tela ao vivo]:
    1. Painel
    2. Transações
    3. Categorias
    4. Assinaturas
    5. Contas a pagar
    6. Cartões
    7. Projetos (só adulto; Bloco 7C, wireframe)
  - Rodapé da lateral: **Membros** e **Configurações** (`navigation.ts:130-141`), e o cartão do usuário (avatar, nome, e-mail) que abre o menu da conta [código] [tela ao vivo].
  - Menu do usuário: Minha conta, Planos, Cofre aberto, Sair (o diagrama ainda cita tema) [doc/plano `docs/JORNADAS.md:409`]. Não abri o menu.
  - **Contagem de seções de primeiro nível no desktop: 9 na lateral** (7 + Membros + Configurações), mais 3–4 no menu do usuário.
- **Barra do topo** (`src/components/layout/app-header.tsx`) [tela ao vivo]:
  - Botão de recolher a lateral (à esquerda).
  - **Busca no centro**: pílula "Buscar telas e ações…" com `⌘K`. Em Configurações › Aparência a pessoa troca "Barra" por "Botão" (a lupa redonda) [tela ao vivo em `/settings`].
  - À direita: sino de notificações com contador.
  - **Não mostra o nome da tela nem trilha** (o `<h1>` é só para leitor de tela; a lateral marca onde se está) [doc/plano `docs/JORNADAS.md:485`].
- **Formulários globais**: transação e assinatura montados uma vez na casca [doc/plano `docs/JORNADAS.md:477`].

### Telefone (< 768px)
- **BottomBar flutuante** (pílula de vidro estilo iOS 26) com 4 abas + botão de ação redondo à direita [código `src/components/layout/mobile-bottom-nav.tsx:92`] [tela ao vivo]:
  1. Painel
  2. Transações
  3. Categorias
  4. **Você** (o avatar da pessoa no lugar do ícone) → `/me`
  5. **"+"** (ação primária, círculo à direita da pílula) [código `src/components/layout/quick-actions.tsx:81-92`].
- Uma aba que não cabe com folga sai da barra e entra no topo da página Você (num telefone de 320px, Categorias sai) [doc/plano `docs/JORNADAS.md:478`].
- **Cabeçalho do telefone** [tela ao vivo]: sino à esquerda (vira "voltar" nas subpáginas), **seletor de carteira no centro** como título, e à direita a lupa colada ao calendário do mês (Painel, Categorias) ou ao filtro da tela, numa cápsula.
- **Página `/me` ("Você")** [tela ao vivo] [código `src/config/mobile-navigation.ts:249`]:
  - Identidade centrada (avatar, nome, e-mail).
  - Cartão **Carteira**: Assinaturas, Contas a pagar, Cartões, Projetos, Membros e convidados.
  - Cartão **Conta**: Minha conta, Cofre aberto, Configurações.
  - Planos e o "Sair" moram dentro de Minha conta (seção Plano e menu ⋯) [doc/plano `docs/JORNADAS.md:478`] [tela ao vivo: "Planos e pagamentos" e "Mais opções da conta" em `/account`].
- **Contagem no telefone: 4 abas** + "+"; mais **8 destinos** na página Você.

### Busca global (paleta ⌘K)
- Abre pela lupa ou por ⌘K/Ctrl+K em qualquer tela; no telefone a lupa vira uma barra de busca no topo, com teclado aberto no mesmo toque [doc/plano `docs/JORNADAS.md:479`].
- Grupos: Recentes, Telas (com sinônimos: "gastos" → Transações, "fatura" → Cartões, "boletos" → Contas a pagar), **Ações** (Nova despesa, Nova parcelada, Nova receita, Nova assinatura, Nova categoria, Novo cartão), Transações (busca no banco por descrição, valor, data, categoria e cartão), Cartões, Categorias, Parcelas, Assinaturas, Contas, Membros, Carteiras [doc/plano `docs/JORNADAS.md:442-455`, `479`].
- Escopo com `/` (ex.: `/transacoes`) e dois Backspaces para sair do escopo [doc/plano].
- Painel, Configurações, Minha conta, Planos e Notificações ficam fora da busca, por decisão do dono [doc/plano].

### Onde ficam as configurações
- Desktop: item **Configurações** no rodapé da lateral; Minha conta no menu do usuário.
- Telefone: página Você › Conta › Configurações ou Minha conta.
- Configurações tem as seções (vistas ao vivo): **Carteira**, **Aparência** (tema Sistema/Claro/Escuro e busca Barra/Botão), **Lançamento** (interruptor do lançamento inteligente), **App no celular** (instalar PWA), **Notificações desta carteira**, e o bloco "WIREFRAME · Bloco 3 · IA" com link para a política de privacidade [tela ao vivo].

### Notificações
- O sino abre uma **folha flutuante** de 384px no desktop e uma **gaveta** no telefone. Linhas agrupadas por dia (Hoje, Ontem, data); filtro Todas / Não lidas; menu ⋯ com "Marcar todas como lidas", "Configurar notificações" e "Limpar notificações". Contador exato vindo do servidor, sondado a cada 60s [doc/plano `docs/JORNADAS.md:486-489`]. Não abri o painel.

---

## 2. Inventário de telas e rotas

Rotas de `src/app/` (lista do `find`) [código]. "WF" = a tela é wireframe ou tem bloco wireframe [tela ao vivo, salvo onde dito].

| Rota | Propósito | Estado |
|---|---|---|
| `/` | Abertura; manda a `/dashboard` ou `/login` | produção |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Acesso por e-mail e senha (login social saiu em set/2026); casca dividida com painel de marca animado | produção [doc/plano] |
| `/invites/accept` | Aceitar convite de carteira | produção (papel do convite é WF) |
| `/dashboard` | Painel do mês | produção + blocos WF |
| `/transactions` | Lista, filtros, seleção em lote, detalhe (`?txn=`), A conferir (`?conferir=1`), importar (`?importar=1`) | produção + WF |
| `/categories`, `/categories/new`, `/categories/[id]` | Categorias com limite mensal (o orçamento mora na categoria) e detalhe | produção |
| `/subscriptions` | Assinaturas (cobrança recorrente que vira lançamento sozinha) | produção |
| `/bills` | Contas a pagar (abas Contas e Pendentes) | produção + WF |
| `/credit-cards`, `/credit-cards/[id]` | Cartões e faturas por ciclo | produção + WF (Conferir fatura) |
| `/members` | Membros e convidados, convidar | produção + WF (papéis e limites) |
| `/settings` | Configurações da carteira e do aparelho | produção + WF (IA) |
| `/account`, `/account/sessions`, `/account/activity` | Perfil, segurança, sessões, atividade | produção + WF (captura e IAs conectadas) |
| `/me` | Hub "Você" do telefone | produção |
| `/plans` | Plano e pagamento | WF (Bloco 4/8) |
| `/precos` | Preços públicos, fora da casca | WF |
| `/previsao` | "Seguro para gastar" e linha do tempo de 6 meses | WF (Bloco 5) |
| `/comecar` | Jornada de 4 passos do que o app faz sozinho | WF (Bloco 4) |
| `/piloto` | Piloto Automático: o que o app lançou sozinho, com desfazer | WF |
| `/cofre` | Cofre aberto: o que guardamos, exportar tudo (ZIP de CSVs), apagar a conta | WF |
| `/projetos`, `/projetos/[id]` | Projetos da carteira (orçamento e período próprios) | WF (Bloco 7C) |
| `/oauth/consent` | Consentimento para conectar uma IA externa (MCP) | WF, servidor OAuth desligado |
| `/privacidade` | Política de privacidade pública | WF |
| `/[...slug]` | 404 ("Ir para o painel" / "Página inicial") | produção |
| `/laboratorio/*`, `/designsystem` | Laboratório e catálogo do design system (não é produto) | interno |

---

## 3. Por área

### 3.1 Painel (`/dashboard`)
Ordem vista ao vivo (desktop e telefone iguais, empilhado no telefone) [tela ao vivo]:
1. Cartão WF "Veja o que o app faz por você" (só enquanto a jornada não foi concluída; não apareceu nesta conta) [código `src/app/(app)/dashboard/page-client.tsx:307`].
2. Seletor de mês (no desktop na barra da tela; no telefone no cabeçalho, com "Este mês", anterior e próximo).
3. **WF "Seguro para gastar"**: valor, valor por dia e regime de caixa, com "Ver a previsão" [código `page-client.tsx:321`]. **Ao vivo mostrou "Não foi possível carregar a previsão."** (provável migração do Bloco 5 ausente no banco).
4. **WF "Insights"**: lista até 20, cada um com ação ou "Entendi". Ao vivo: "Nenhum insight agora."
5. WF "Saldo e acerto" (só carteira dividida) e "A conferir: N" (só com N > 0) [código `page-client.tsx:325`, `338`].
6. **4 KPIs (StatCard)**: Despesas, Receitas, Resultado (com variação % contra o mês anterior) e Faturas abertas [tela ao vivo]. No telefone a 375px eles ficam em grade de 2 e os rótulos aparecem truncados ("D…", "RECEI…") [tela ao vivo].
7. **Calendário de pagamentos**: resumo Previsto / Despesas lançadas / Fechamentos, próximos lançamentos e a grade do mês com fichas por dia; abaixo de 40rem vira lista. Dia abre popover; evento previsto abre prévia com "Ver origem" [tela ao vivo] [doc/plano `docs/JORNADAS.md:572`].
8. **Despesas por categoria** (rosca) com "Ver categorias".
9. **Faturas do mês** (linha por cartão) com "Ver cartões".
10. **Compras parceladas** (barra de progresso por plano, "N parcelas restantes") com "Ver em transações".
- Estados: carregando ("Carregando o dashboard…" + esqueleto), erro com "Tentar novamente", sem carteira [doc/plano] [tela ao vivo: o texto de carregamento].
- Botão primário: não há CTA dentro do Painel; o primário é o "+ Adicionar" da casca.
- O convidado vê outro Painel (WF): o limite dele, total do mês, últimas 10 transações e "Lançar despesa" [doc/plano `docs/JORNADAS.md:579`].

### 3.2 Transações (`/transactions`)
- **Lista** [tela ao vivo]:
  - Desktop: tabela agrupada por mês, com caixa de seleção por linha e por mês, colunas ordenáveis Data e Valor, chips "Parcelada" e de fatura ("Fechada"), e lápis e lixeira por linha.
  - Telefone: lista com data · bolinha da categoria, valor em vermelho/verde e ⋯ por linha.
  - Paginação de 100 em 100 [doc/plano `docs/JORNADAS.md:614`].
- **Barra** [tela ao vivo]: segmentado Todas / Despesas / Receitas; "Filtros"; "Importar extrato ou planilha" (WF Bloco 2); **"Nova transação"** (primário) com um botão partido "Mais tipos de lançamento" [código `src/components/transactions/transaction-new-split-button.tsx:53`].
- **Filtros**: período (7d, 15d, 30d, Mês ou personalizado), forma, cartões, categorias, sem categoria, valor min/máx, descrição e origem; chips com ✕ e "limpar tudo"; tudo vai para a URL [doc/plano `docs/JORNADAS.md:613-626`].
- **Ações em lote**: Shift seleciona faixa; barra flutuante com Editar (só com 1), Excluir e Limpar; menu de botão direito ou toque longo com Abrir, Editar, Selecionar e Excluir [doc/plano `docs/JORNADAS.md:633-643`].
- **Detalhe**: folha lateral (gaveta no telefone) com valor, data, categoria, forma e dica da fatura; se for parcela, "Parcela k de n", total, lançado e restante. ⋯ com Editar e Excluir. Na parcela, a edição pergunta "esta parcela ou o plano". WF: A conferir (Confirmar, "Lembrar como este cartão"), Anexos (foto/PDF até 10 MB, cota 25 MB), Partes da despesa [doc/plano `docs/JORNADAS.md:723-751`].
- **Excluir é físico e sem volta** (sem lixeira/desfazer) [doc/plano, lacuna 6].
- Estados vazios: sem filtros → "Nova transação"; com filtros → "Limpar filtros" [doc/plano].
- Hover sobre o chip de fatura mostra prévia (cartão, estado, fecha, vence); sobre "Parcelada" mostra parcela N de M [doc/plano].

### 3.3 Lançar transação
- **Desktop: sempre o formulário clássico** (desde o commit `8534311d`, 28/10) [código `src/components/transactions/transaction-form-dialog.tsx:107`]. Diálogo **"Nova despesa"** [tela ao vivo]:
  - Segmentado **Despesa · Parcelada · Receita** (Despesa marcada) [código `src/components/transactions/transaction-type-segment.tsx:31-33`].
  - Campos, nesta ordem: **Valor** (foco automático; o único obrigatório), **Categoria** (seletor com busca), **Descrição** (placeholder "Ex: Supermercado"), separador "Detalhes", **Data** ("Hoje · 28 de outubro", com atalhos), **Forma de pagamento (opcional)** em 6 fichas 3×2: Pix, Crédito, Débito, Dinheiro, Transferência, Outro [tela ao vivo] [código `src/lib/payment-methods.ts:40-48`].
  - Escolher **Crédito** revela o campo Cartão e **pré-escolhe** o cartão: o único ativo ou o último usado na carteira [código `src/lib/ultimo-cartao.ts:26-31`]. Sem cartão escolhido (com cartões ativos), Salvar fica desativado [código `src/components/transactions/transaction-form-use.tsx:813-823`].
  - Validação: só o valor gera erro ("Informe um valor válido em reais") [código `transaction-form-use.tsx:656`]. Categoria e descrição são opcionais.
  - Rodapé: Cancelar (terciário) e **Salvar** (primário, canto inferior direito) [tela ao vivo].
  - Parcelada: valor total ou por parcela, nº de parcelas com −/+, 1ª cobrança, e o quadro WF "Impacto da parcela" (pico, próximas faturas, mês no vermelho) antes de salvar [código `transaction-form-fields.tsx:625-700`] [doc/plano].
  - Receita: pergunta "É estorno de compra no cartão?" (WF), que abate a fatura [código `transaction-form-fields.tsx:794`].
  - Condicionais: "Projeto" (se a carteira tem projeto ativo) e "Quem pagou" (carteira dividida), ambos WF [doc/plano].
  - Fechar com alterações pergunta "Descartar alterações?" [doc/plano].
  - Depois de salvar: toast "Transação criada" com "Ver"; offline vai para fila [doc/plano].
- **Telefone: "Lançamento inteligente"** (padrão ligado, por aparelho; desliga em Configurações › Lançamento) [código `src/components/settings/lancamento-settings.tsx:20`] [tela ao vivo]:
  - O "+" abre um diálogo sem casca: só a **pílula da frase** ("Frase do lançamento") e a pílula redonda **"Adicionar recibo"** (foto), 12px acima do teclado [tela ao vivo].
  - Enter lê a frase pelo parser local (ex.: "42 mercado nubank em 3x"). Com dúvida no valor ou na descrição, chama a IA uma vez por frase (Groq, Cloudflare como reserva; cota de 30/dia) [doc/plano `docs/JORNADAS.md:677-680`].
  - O campo **vira o painel de revisão**: tipo com o motivo, valor em destaque, descrição, categoria, forma/cartão, data, parcelas. As linhas levam "Não identificado", "Confira" ou "IA". Tocar numa linha edita no lugar [doc/plano].
  - Rodapé: **"Aprovar"** (único submit; travado com "Falta o valor"/"Falta o cartão") e "Formulário completo" [doc/plano].
  - Foto: pela pílula, por colar ou por soltar → IA lê → revisão abre sozinha com a miniatura; a foto vira anexo [doc/plano].
  - Fechar descarta sem perguntar [doc/plano, lacuna 104].
  - **A IA ainda não está publicada** (Bloco 3B) [doc/plano, lacuna 26]. Não digitei frase ao vivo para não gastar a cota da IA.
- Editar é sempre o formulário clássico; "Nova receita"/"Nova parcelada" do ⌘K também [doc/plano].

### 3.4 Categorias e orçamento (`/categories`)
- Abas Despesas / Receitas; mês (só em Despesas); **"Nova categoria"** (primário); um cartão por categoria com ⋯ (Abrir, Abrir em nova aba, Editar, Excluir) [tela ao vivo] [doc/plano].
- **Não há tela de orçamento**: o limite mensal mora na categoria, com "Repetir todo mês" [doc/plano `docs/JORNADAS.md:1121`, `1150`].
- **Assistente na 1ª visita de cada carteira**, em 3 passos: renda mensal (opcional), categorias e limites ("Sugerir pela renda"), confirmar; ou "Configurar depois" [doc/plano `docs/JORNADAS.md:1129-1140`].
- **Detalhe** `/categories/[id]`: orçamento, restante, estouro, lançado × projetado, média, maior e menor, % do total, tendências, e os lançamentos do mês com a categoria travada ("Ver em Transações") [doc/plano].
- Barra de progresso com faixas de risco em 85% e 100% [código `src/lib/budget-bands.ts`, via AGENTS.md].
- Cadastro cria **12 categorias padrão** [doc/plano `docs/JORNADAS.md:226`].

### 3.5 Cartões e fatura (`/credit-cards`)
- **Lista**: abas **Cartões** (cartão com fatura, fechamento, vencimento e limite) e **Histórico** (faturas de 12 meses); **"Novo cartão"** [tela ao vivo].
- **Cadastro**: apelido, número, validade, limite, dia de fechamento, dia de vencimento, bandeira; WF "Titular do cartão" (só o dono) [doc/plano `docs/JORNADAS.md:885`].
- **Detalhe** `/credit-cards/[id]`, seções vistas ao vivo [tela ao vivo]:
  1. Cabeçalho com "Ver transações neste cartão" e ⋯ "Mais opções" (Editar, Desativar, Excluir [doc/plano]).
  2. **Fatura**: seletor de ciclo por mês; estados Futura, Aberta (período, fechamento, uso do limite), Não paga (vermelha se venceu), Paga; "Marcar como paga" / "Desmarcar pagamento" [doc/plano `docs/JORNADAS.md:904-911`].
  3. Gastos por categoria; Composição; **Hábitos de consumo** (dias úteis × fim de semana, perfil, ticket médio e mediano).
  4. **Parcelas e compromissos** (cada compra parcelada abre o detalhe).
  5. **WF "Conferir fatura"**: digitar o total do banco e "Gravar", ou enviar **PDF** (pede senha se protegido), CSV ou OFX. A conferência separa em Bate / Falta no app / Só no app / Valor diferente / Parcela fora de sequência; "Importar selecionados" e, se o PDF vier incompleto, "Ler com IA" [doc/plano `docs/JORNADAS.md:919-935`] [tela ao vivo: bloco e botão "Gravar"].
  6. Últimos lançamentos com "Ver em transações".
- **Estorno** = receita no crédito com o cartão e a categoria da compra (WF): abate a fatura do ciclo e a categoria [doc/plano].
- Fatura fechada em aberto aparece em Contas a pagar › Pendentes [doc/plano].

### 3.6 Contas a pagar (`/bills`)
- Abas **Contas** (todas/ativas/inativas) e **Pendentes** (todas/atrasadas/30 dias); "Filtrar", "Ordenar", **"Nova conta"** [tela ao vivo].
- Formulário: nome, categoria, periodicidade, vencimento, valor, valor variável (WF: média das 3 últimas), início, fim, forma, cartão, lembretes, ativa. Inclui o WF "Conta ou assinatura?", que explica a diferença [doc/plano `docs/JORNADAS.md:968-973`].
- Pendente: **"Pagar"** abre valor, data, categoria, forma, cartão e descrição → "Registrar pagamento" cria a despesa (exige conexão). ⋯ Editar modelo, Ignorar parcela, Excluir conta. A fatura fechada de cartão aparece como pendente e o "Pagar" a marca paga [doc/plano].
- WF "Isso pagou a conta X?": casa uma despesa recente com a pendente (Sim/Não). WF anexos de boleto [doc/plano].
- Painel lateral da conta: total pago em 90 dias, média, atrasos, histórico [doc/plano].
- Lembretes por cron e notificação `bill_reminder` [doc/plano].

### 3.7 Assinaturas (`/subscriptions`)
- Abas Todas / Ativas / Inativas; "Ordenar"; **"Nova assinatura"**; "exportar" (CSV); "exibir" (colunas e densidade); tabela Assinatura / Valor / Próxima, com caixa de seleção, lápis e ⋯ por linha [tela ao vivo].
- Formulário: nome, tipo Despesa/Receita (receita recorrente é WF), valor, periodicidade, próxima cobrança, forma, cartão, categoria, observações [doc/plano `docs/JORNADAS.md:1072`].
- Painel lateral: resumo, detalhes, cobranças, observações e um **Switch "Ativa/Pausada"** [código `src/components/subscriptions/subscription-detail-sheet.tsx:377-382`].
- A cobrança vira lançamento sozinha (cron e recuperação ao abrir o Painel) [doc/plano].
- Não há URL que abra o detalhe de uma assinatura (lacuna 5) [doc/plano].

### 3.8 Membros e família (`/members`)
- Seções vistas ao vivo: **Membros** (Remover membro, WF "Trocar papel"), WF **"Limites por pessoa"**, **Convidar** (e-mail, WF "Papel do convite": Membro ou Convidado; "Convidar"; **"Gerar link de convite"**), e **Convites pendentes** (reenviar, revogar) [tela ao vivo] [doc/plano].
- **Papéis**: Dono, Membro (adulto, vê tudo) e **Convidado** (WF: só lança despesa, vê só as dele, app mais curto). Convidado menor exige o consentimento do responsável (LGPD art. 14) [doc/plano `docs/JORNADAS.md:342-350`, `1584-1660`].
- **Não há gasto privado entre adultos**; privacidade é outra carteira [doc/plano `docs/JORNADAS.md:1600`].
- **Quem pagou e acerto** (WF, Bloco 7C): numa carteira "dividida", cada despesa tem "Quem pagou" e partes por peso; o Painel mostra "Saldo e acerto" (quem deve a quem, sugestão, "Acertar" grava o registro). **O Pix acontece fora do app** [doc/plano `docs/JORNADAS.md:1915-1960`, lacuna 75].
- **Carteiras**: seletor no topo; "Criar carteira" com modelos WF Casa, Casal, Pessoal, Viagem, Reforma, Evento [doc/plano].
- Erro conhecido: o formulário de convite aparece na carteira pessoal e o servidor recusa só depois (lacuna 1) [doc/plano].

### 3.9 Onboarding, cadastro, teste e planos
- **Cadastro**: nome, e-mail e senha (com política de senha) → "Confira seu e-mail" se a confirmação for exigida → Painel. O trigger cria perfil, carteira pessoal e 12 categorias [doc/plano `docs/JORNADAS.md:220-232`]. Não vi as telas de acesso (sessão logada).
- Telas de acesso: casca dividida, formulário à esquerda e um **palco animado** do próprio app num aparelho (navegador, tablet ou celular), com depoimentos ilustrativos. No telefone só o wordmark [doc/plano `docs/JORNADAS.md:184-193`].
- **Primeiro uso**: não há redirecionamento. O cartão WF do Painel leva a **`/comecar`**, 4 passos: "O que eu lanço por você" (Frase rápida, Importar extrato, Atalho do iPhone, Compartilhar no Android, PDF da fatura) → "Como eu decido" → "O que eu aviso" → "Quem vê o quê" (Convidar), com Anterior/Próximo/Pular [tela ao vivo] [doc/plano `docs/JORNADAS.md:1388-1410`]. Também tem o assistente de categorias.
- **Teste de 14 dias sem cartão**; preço em 12x, com preço de fundador até 31/01/2027; plano Família cobre até 6 pessoas [doc/plano `docs/JORNADAS.md:1266-1278`, spec §9]. Não achei os valores no fonte.
- **Paywall**: sem plano, a conta fica em **só leitura** (faixa no topo; exportar e apagar continuam). **Hoje está desligado**: todo mundo é `familia` e ninguém é barrado [doc/plano `docs/JORNADAS.md:1250-1256`].
- `/plans` (WF): origem do plano, preço, "Ver preços e garantias"; Assinar abre o formulário de nome e CPF → fatura hospedada no Asaas (12x no cartão). Há cancelamento da renovação e reembolso em 7 dias. **Nada disso chamou o Asaas ainda** [doc/plano, lacuna 90] [tela ao vivo: só "Ver preços e garantias"].
- `/precos` não tem link a partir das telas de acesso (lacuna 30) [doc/plano].

### 3.10 Configurações e conta
- `/settings`: veja §1. Dono edita nome, ícone e cor da carteira e pode excluí-la (digitando o nome); quem não é dono só pode sair. Ainda: instalar o app, preferências de notificação por canal e tópico, e os WF de modo e pesos da divisão e de datas/orçamento da carteira de projeto [doc/plano `docs/JORNADAS.md:313-322`] [tela ao vivo].
- `/account`: Perfil (⋯ Editar perfil, Alterar senha, Sair, Excluir conta), **Segurança** (Sessões ativas, Histórico de atividades), **Plano** (Planos e pagamentos), WF "Captura sem abrir o app" (tokens, "Novo token", guia do Atalho) e WF "IAs conectadas" (URL do MCP, Revogar) [tela ao vivo].

### 3.11 Captura: o que existe hoje e o que é só plano

| Canal | Situação | Marca |
|---|---|---|
| Formulário no app | Existe, em produção | [código] |
| Frase no "+" (parser local, só no telefone) | Existe no 2.0, não publicado | [código] [tela ao vivo] |
| IA na frase e na foto do recibo (Groq/Cloudflare, 30/dia) | No repositório, não publicado | [doc/plano, lacuna 26] |
| Atalho do iPhone (ditar a frase, foto) e automação do **Apple Pay** pela Wallet, via token pessoal | No repositório; token em WF; Edge `capture` não publicada | [doc/plano `docs/JORNADAS.md:769-797`, lacuna 14] |
| Compartilhar do Android (texto, foto, PDF) via `share_target` | No repositório, não publicado | [doc/plano] |
| Atalhos do ícone (Nova despesa, A conferir, Painel) | No manifest | [doc/plano] |
| Importar extrato CSV/OFX e planilha | WF (Bloco 2) | [tela ao vivo] |
| PDF da fatura com conferência | WF (Bloco 2) | [tela ao vivo] |
| IA externa por MCP (Claude/ChatGPT lançam) | WF; OAuth desligado | [doc/plano, lacuna 100] |
| **WhatsApp** | **Adiado** pelo dono (22/10); só na proposta | [doc/plano, lacuna 20] |
| **Voz dentro do app** | **Não existe**: nenhum `getUserMedia`/`SpeechRecognition` em `src/`. A voz só passa pelo ditado do Atalho do iPhone | [código, grep] |
| Open Finance / conexão com o banco | **Fora de propósito**: posicionamento "sem conectar o banco" | [doc/plano, spec §2] |

Tudo que entra por captura com dúvida cai em **"A conferir"** (`needs_review`): contagem no Painel, lista acima de Transações e lembrete às 20h [doc/plano].

---

## 4. Tarefas-chave: contagem de passos

Contagem a partir do Painel aberto, sem rolagem salvo quando dito. "Campo" = digitar. Não executei nenhuma até o fim (não salvei nada); as contagens saem do código e do que vi aberto.

| Tarefa | Desktop | Telefone |
|---|---|---|
| **Lançar um gasto de cartão** | "+ Adicionar" → Valor (campo) → ficha "Crédito" (cartão pré-escolhido se é o único ativo ou o último usado) → Salvar = **3 cliques + 1 campo**. Com categoria e descrição: +2 cliques (abrir e escolher) e +1 campo = **5 cliques + 2 campos**. Mais 1 clique para escolher o cartão quando há vários e nenhum foi o último usado [código] [tela ao vivo] | Inteligente: "+" → frase "42 mercado nubank" (1 campo) + Enter → revisão → **Aprovar** = **2 toques + 1 campo + Enter**, se o parser achar o cartão pelo nome; senão, +2 toques na linha Cartão [código] [doc/plano]. Desligado: igual ao desktop, numa gaveta. No 2.0 o Apple Pay lança com **0 toques** (não publicado) |
| **Ver quanto ainda dá para gastar no mês** | **0 cliques**: WF "Seguro para gastar" no topo do Painel; detalhe em `/previsao` (+1). **Ao vivo deu erro de carga.** Hoje, sem o WF: o KPI "Resultado" (receitas − despesas) no Painel, ou Categorias (+1) para o restante de cada limite [tela ao vivo] | Igual: 0 toques no Painel, +1 para `/previsao`; Categorias é aba (+1) |
| **Ver a fatura atual do cartão** | Lateral "Cartões" → cartão = **2 cliques** (o ciclo atual abre como "Aberta"). Ou pelo Painel: rolar até "Faturas do mês" → linha = **1 clique + rolagem**. Ou ⌘K "fatura" [tela ao vivo] [doc/plano] | Você → Cartões → cartão = **3 toques**. Ou rolar o Painel até "Faturas do mês" → **1 toque** |
| **Convidar um membro** | Lateral "Membros" → e-mail (campo) → papel (WF, 1) → "Convidar" = **3 cliques + 1 campo**, e só numa carteira compartilhada da qual a pessoa é dona. Se só tem a pessoal: criar carteira antes (seletor → Criar carteira → nome → Salvar, +3 cliques + 1 campo). Alternativa: "Gerar link de convite" (2 cliques, sempre de membro) [tela ao vivo] [doc/plano] | Você → Membros e convidados → e-mail → papel → Convidar = **4 toques + 1 campo** |
| **Conferir/corrigir uma transação** | Lápis da linha em Transações (1) → editar → Salvar = **3 cliques** desde a lista (+1 para chegar a Transações). Pelo detalhe: linha → ⋯ → Editar → Salvar = 4. Itens com dúvida: "A conferir: N" no Painel (WF) → **Confirmar** = 2 cliques [tela ao vivo] [doc/plano] | Transações (1) → linha (1) → ⋯ (1) → Editar (1) → Salvar (1) = **5 toques**. Pelo ⋯ da linha na lista: -1 |
| **Cadastrar uma assinatura** | ⌘K "Nova assinatura" (2) ou lateral Assinaturas → "Nova assinatura" (2) → ~6 campos/seletores (nome, valor, periodicidade, próxima cobrança, categoria e forma; cartão se crédito) → Salvar ≈ **7–9 cliques + 3 campos** [doc/plano] | Você → Assinaturas → Nova assinatura → mesmo formulário ≈ **8–10 toques + 3 campos** |
| **Cancelar uma assinatura** | Não existe "Cancelar". Pausar: Assinaturas → linha → Switch "Ativa" = **3 cliques**. Excluir: Assinaturas → ⋯ → Excluir → confirmar = **4 cliques**. O app não cancela no serviço [código] [tela ao vivo] | Você → Assinaturas → linha → Switch = **4 toques** |
| **Primeiro valor depois do cadastro** | /register: 3 campos + "Criar conta"; confirmar o e-mail se pedido (sair do app) → Painel, com 12 categorias e a carteira pessoal prontas → "+ Adicionar" → valor → Salvar = **~4 cliques + 4 campos** até o 1º lançamento. Sem dados, o Painel fica quase vazio; o valor real exige lançamentos, importar extrato (WF) ou o PDF da fatura (WF). O assistente de categorias aparece só ao abrir Categorias [doc/plano] | Igual; o 1º lançamento pela frase = 2 toques + 1 campo. **Não verifiquei ao vivo** (sessão logada) |

---

## 5. Linguagem visual

Resumo do `AGENTS.md` (o design system) [doc/plano], com o que confirmei ao vivo [tela ao vivo].
- **Marca preta e branca.** `--primary` é a tecla preta no claro e branca no escuro. A **única cor da marca é um arco-íris** de 7 matizes, que mora **só** em peças de marca (wordmark, `Button brand`, brilho de borda que acende ao aproximar o cursor, feixe da busca), **uma peça de marca por tela**, nunca sob texto nem em gráfico.
- **Dinheiro tem token próprio**: `income`/`expense` (mais saturados) separados de `success`/`destructive`. Ao vivo: despesas em vermelho, receitas em verde, valores com sinal.
- **Tema escuro de primeira classe**: todo token tem par escuro; tema Sistema/Claro/Escuro em Configurações. As capturas ao vivo estão no escuro.
- **Raios**: controles são **cápsula** (botão, campo, abas, chips); superfícies 22px (cartões, tabelas); modais 28px; linhas de lista 12/16px.
- **Vidro**: barras e menus translúcidos com desfoque. A `BottomBar` é uma pílula de vidro no estilo do iOS 26; o topo do telefone tem borrão de borda, sem barra chapada.
- **Tipografia**: **Inter** para tudo, **Ledger** (serifada) só no título de página, no wordmark e no numeral do 404; números tabulares (`.nums`) [código `src/app/layout.tsx:2-14`]. Os blocos WF usam `font-mono` (Geist Mono) de propósito, para parecerem provisórios.
- **Ícones**: só Heroicons (outline 24; mini 20; micro 16); na aba ativa da `BottomBar` o ícone fica sólido.
- **Escada de controles**: 24/28/32/**36 (padrão no desktop)**/40; **no dedo tudo sobe a 44** (alvo de toque do iOS), também abaixo de 48rem de largura.
- **Hierarquia de botões**: um `primary` por tela; o par de ações é primary + tertiary; não existe "ghost".
- **Densidade**: média-alta no desktop (tabela com 44px por linha, KPIs de 4 colunas, calendário em grade com fichas por dia, detalhe do cartão com 6+ seções). No telefone vira lista e grade de 2 KPIs, com rótulos truncando a 375px [tela ao vivo].
- **Gráficos**: Recharts no `ChartContainer` (área, linha, barras, rosca, faísca, mapa de calor, cascata). Rampa neutra `--chart-1..5`; verde/vermelho só quando é entrada/saída. Ao vivo: rosca de despesas por categoria e barras de progresso das parcelas.
- **Movimento**: menus brotam do gatilho (`menu-morph`), marcador líquido que viaja nas abas, modais abrem em mola.
- **Copy**: pt-BR, informal e direto ("Seguro para gastar", "A conferir", "Você", "Cofre aberto", "Piloto Automático").

---

## 6. Lacunas e o que está em wireframe ou não existe

### Em wireframe (44 arquivos em `src/components/wireframe/`) [código]
- A conferir: `a-conferir-*.tsx` (contagem, lista, lembrete, detalhe).
- Fatura e importação: `conferir-fatura-wireframe.tsx`, `importar-extrato-wireframe.tsx`, `mapeamento-csv.tsx`, `estorno-wireframe.tsx`, `anexos-wireframe.tsx`.
- Captura: `captura-tokens-wireframe.tsx`, `compartilhado-aviso-wireframe.tsx`, `ia-configuracoes-wireframe.tsx`; e os antigos sem uso `frase-rapida-` e `foto-recibo-wireframe.tsx` (lacuna 105).
- Previsão: `seguro-para-gastar-`, `linha-do-tempo-`, `impacto-parcela-`, `orcamento-repete-`, `receita-recorrente-wireframe.tsx`.
- Insights: `insights-wireframe.tsx`.
- Contas a pagar: `casamento-conta-`, `conta-ou-assinatura-`, `conta-valor-variavel-wireframe.tsx`.
- Planos e confiança: `planos-`, `precos-`, `somente-leitura-`, `jornada-`, `jornada-cartao-`, `piloto-automatico-`, `cofre-aberto-`, `privacidade-wireframe.tsx`.
- Família: `papeis-`, `convidado-painel-`, `limites-`, `titular-do-cartao-`, `projetos-`, `divisao-`, `modelos-de-carteira-wireframe.tsx`.
- IA externa: `mcp-consentimento-`, `ias-conectadas-wireframe.tsx`.

### Não implementado ou fora de propósito
- WhatsApp (adiado), voz dentro do app, Open Finance, saldo de contas bancárias, metas de poupança e investimentos (não-objetivos do spec §2) [doc/plano] [código para a voz].
- App nativo: só PWA; os nativos vêm depois [doc/plano].
- Cobrança real (Asaas) e só leitura: código pronto e desligado [doc/plano].

### Lacunas de UX relevantes para a comparação [doc/plano, `docs/JORNADAS.md:2096-2172`]
- Excluir transação é sem volta, sem desfazer (6).
- Assinatura sem link direto para o detalhe (5).
- Convite numa carteira pessoal só falha no servidor (1).
- Lançamento inteligente descarta sem perguntar (104).
- Os números da fatura "em aberto" no Painel e da "prevista" em `/previsao` diferem (31).
- `/precos` sem porta de entrada antes do cadastro (30).
- Não há como desfazer "Não mostrar mais este tipo" de insight (45).
- A compra parcelada aparece duas vezes no quadro de impacto (34).

### Observado ao vivo [tela ao vivo]
- O WF "Seguro para gastar" do Painel mostrou "Não foi possível carregar a previsão." (desktop e telefone).
- No telefone a 375px, os rótulos dos KPIs truncam ("D…", "RECEI…", "R…").
- O overlay de desenvolvimento do Next mostrava "1 Issue" (um `console.error` vazio).
- `PageHeader` e o desenho do telefone estão marcados como "primeiro desenho" (devem mudar na revisão de tela) [doc/plano, memória do projeto].

### O que não verifiquei
- As telas de acesso, o cadastro e o assistente de categorias (sessão logada).
- O painel de notificações, o menu do usuário, a paleta ⌘K aberta e o formulário de assinatura (não abri).
- A frase do lançamento inteligente digitada (para não gastar a cota da IA nem arriscar gravar).
- Os preços em reais (não estão no fonte do front).
