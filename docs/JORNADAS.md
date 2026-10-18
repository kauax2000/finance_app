# Jornadas do app

O mapa de tudo o que uma pessoa faz no app, dividido em onze jornadas. Cada
jornada tem um fluxograma, as regras técnicas que decidem os caminhos e as
lacunas encontradas no código. Foi escrito lendo o código em 2026-09-17, na
branch `finance-app-2.0`, e a navegação global foi revista em 2026-10-01,
quando entrou a busca (⌘K), junto com o menu do botão direito nas linhas de
lançamento, nos cartões de categoria e nas contas pendentes, com o seletor
de período que confirma no próprio popover, com o rascunho protegido do
formulário de lançamento, e com os menus do telefone em gaveta. As telas de
acesso foram revistas em 2026-10-12 (a casca no layout) e em 2026-10-14 (o
painel de marca animado). Quando uma tela mudar de caminho, atualize o
diagrama dela.

## Como ler os diagramas

| Forma | Significa |
|---|---|
| `["/rota"]` retângulo | Página ou rota |
| `(["Diálogo"])` cápsula | Modal, folha, popover, menu |
| `{"Condição"}` losango | Guarda de rota ou decisão |
| `[("backend")]` cilindro | Supabase: Edge Function, RPC, trigger, tabela |
| `(("G5 Lançamentos"))` círculo | Saída para outra jornada |

O rótulo da seta é a ação da pessoa ou a condição (`sucesso`, `erro`,
`cancelar`). Os diagramas usam o tema escuro do Mermaid (`%%{init}%%` no topo
de cada bloco), em qualquer tema do leitor.

**Tudo o que decide acesso roda no navegador.** Não há `middleware.ts`,
`proxy.ts` nem rotas em `src/app/api`. A sessão é do `supabase-js`, os
redirecionamentos são do `AuthGuard` e a segurança real dos dados é a RLS do
banco.

## Sumário

0. [Mapa geral](#0-mapa-geral)
1. [Acesso: entrar, criar conta, senha e sair](#1-acesso-entrar-criar-conta-senha-e-sair)
2. [Carteiras e colaboração](#2-carteiras-e-colaboração)
3. [Navegação e ações globais](#3-navegação-e-ações-globais)
4. [Painel](#4-painel)
5. [Lançamentos](#5-lançamentos)
6. [Cartões e faturas](#6-cartões-e-faturas)
7. [Contas a pagar](#7-contas-a-pagar)
8. [Assinaturas](#8-assinaturas)
9. [Categorias e orçamentos](#9-categorias-e-orçamentos)
10. [Conta e segurança](#10-conta-e-segurança)
11. [Lacunas encontradas](#11-lacunas-encontradas)

---

## 0. Mapa geral

Como as jornadas se ligam. O Painel é o centro; Lançamentos é para onde quase
tudo desagua, porque assinatura, parcela e conta paga viram lançamento.

```mermaid
%%{init: {"theme": "dark"}}%%
flowchart LR
    start(["Abrir o app"]) --> boot{"Tem sessão?"}
    boot -->|"não"| G1(("G1 Acesso"))
    boot -->|"sim"| G4(("G4 Painel"))
    G1 -->|"entrou"| G4
    G1 -->|"link de convite"| G2(("G2 Carteiras"))
    G2 -->|"convite aceito"| G4

    G3(("G3 Navegação global")) --- G4
    G3 --> G5(("G5 Lançamentos"))
    G3 --> G6(("G6 Cartões"))
    G3 --> G7(("G7 Contas a pagar"))
    G3 --> G8(("G8 Assinaturas"))
    G3 --> G9(("G9 Categorias"))
    G3 --> G2
    G3 --> G10(("G10 Conta"))

    G4 -->|"lançamento, parcela, assinatura"| G5
    G4 -->|"fatura do mês"| G6
    G4 -->|"conta prevista"| G7
    G4 -->|"despesas por categoria"| G9

    G6 -->|"ver transações do cartão"| G5
    G6 -->|"gasto por categoria"| G9
    G6 <-->|"fatura fechada em aberto"| G7
    G7 -->|"pagar conta cria despesa"| G5
    G8 -->|"cobrança vira lançamento"| G5
    G9 -->|"ver em transações"| G5
    G5 -->|"gerenciar categorias"| G9
    G5 -->|"cadastrar cartão, prévia da fatura"| G6

    G10 -->|"sair ou excluir conta"| G1
```

---

## 1. Acesso: entrar, criar conta, senha e sair

Tudo o que acontece antes de a pessoa estar dentro do app, e a volta para fora.
Criar conta e entrar são a mesma jornada: as duas telas se ligam e dividem o
parâmetro `next`. **O login social saiu** em set/2026; a autenticação é
e-mail e senha.

As cinco telas dividem uma casca só, e **a casca vive no layout de `(auth)`; o
formulário publica o id da cena.** O `AuthFrame` (`src/components/layout/auth-frame.tsx`)
monta o `SplitShellRoot` com o painel de marca uma vez, então o painel é o
mesmo nó entre as cinco rotas e troca de cena em vez de remontar: a partir de
48rem do próprio casco (container query); no telefone só o wordmark
(`asideMobile="logo"`); coluna de formulário à esquerda, painel à direita
(`side="end"`). Cada formulário devolve só a coluna, o `AuthShell`, com o id
da cena (`scene`), porque o título e a cena mudam com o estado (o cadastro vira
"Confira seu e-mail", a recuperação troca a cada passo). Sem id publicado, a
cena sai do caminho (`defaultSceneFor`). Todo estado devolve o `AuthShell` no
mesmo lugar da árvore, e a troca de `step` leva o foco ao título.

**O painel é um palco animado, e a família da cena decide o aparelho.** Desde
14/out/2026 o painel desenha o próprio app num aparelho (`AuthShowcase`, sobre
o `Showcase` do design system), com uma colagem de depoimentos ilustrativos em
volta e uma legenda no pé; os números e os nomes são de exemplo, e a tela diz
isso. Login no **navegador** (a busca ⌘K se digita sozinha até a fatura, e a
janela vira celular e volta), convite no **tablet** da casa, cadastro e
recuperação no **celular** (o fim da recuperação volta ao navegador). Trocar
de rota troca a cena no mesmo nó: o aparelho muda de forma e gira, sem
remontar e sem tocar a entrada de novo. O palco é `inert` e `aria-hidden`,
repousa em até 5 s, nasce no quadro final com movimento reduzido e não roda
no telefone, onde fica só o wordmark. **Nenhum caminho mudou**: o palco não tem link, campo nem foco, e
as cenas são uma tabela só (`src/components/auth/showcase/scenes.ts`).

### 1a. Entrada, login e cadastro

```mermaid
%%{init: {"theme": "dark"}}%%
flowchart TD
    root["/"] --> loading{"Sessão carregada?"}
    loading -->|"carregando"| bootscreen(["Tela de abertura"])
    loading -->|"com usuário"| dash["/dashboard"]
    loading -->|"sem usuário"| login["/login"]

    protected["Qualquer rota do app"] --> guard{"AuthGuard: tem usuário?"}
    guard -->|"sim"| page(["Renderiza a página"])
    guard -->|"não"| loginNext["/login?next=rota atual"]

    authRoute["Rota de (auth)"] --> backGuard{"AuthSignedInRedirect: já entrou?"}
    backGuard -->|"não"| form(["Renderiza o formulário"])
    backGuard -->|"sim, e a rota é isenta"| form
    backGuard -->|"sim"| dash

    login -->|"e-mail e senha"| signin[("signInWithPassword")]
    signin -->|"erro"| loginErr(["Alerta em português"]) --> login
    signin -->|"sucesso"| nextOk{"Tem next seguro?"}
    nextOk -->|"sim"| back["Rota do next"]
    nextOk -->|"não"| dash
    login -->|"Esqueceu a senha?"| forgot["/forgot-password?next"]
    login -->|"Criar conta"| register["/register?next"]
    revoked(["reason=session-expired"]) -.->|"aviso no topo"| login

    register -->|"nome, e-mail, senha"| valid{"Senha cumpre a política e campos válidos?"}
    valid -->|"não"| register
    valid -->|"sim"| signup[("signUp")]
    signup -->|"erro"| regErr(["Alerta"]) --> register
    signup -->|"sucesso"| trigger[("Trigger handle_new_user: perfil, carteira pessoal, 12 categorias")]
    trigger --> hasSession{"Voltou com sessão?"}
    hasSession -->|"sim"| back
    hasSession -->|"não"| confirm(["Confira seu e-mail"])
    confirm -->|"Reenviar e-mail, 60 s"| resendSignup[("auth.resend signup")] --> confirm
    confirm -->|"Usar outro e-mail"| register
    confirm -->|"Já confirmou? Entrar, com next"| login
    confirm -.->|"link do e-mail"| nextOk
    register -->|"Entrar"| login
```

### 1b. Senha e saída

```mermaid
%%{init: {"theme": "dark"}}%%
flowchart TD
    forgot["/forgot-password?next: passo e-mail"] -->|"Enviar código"| resetMail[("resetPasswordForEmail redirectTo /reset-password?next")]
    resetMail -->|"erro"| forgotErr(["Alerta em português"]) --> forgot
    resetMail -->|"sucesso"| code(["Passo código: 6 dígitos"])
    code -->|"Usar outro e-mail"| forgot
    code -->|"Reenviar código, 60 s"| resetMail
    code -->|"Continuar"| verify[("verifyOtp recovery")]
    verify -->|"erro"| code
    verify -->|"sucesso"| newPass(["Passo senha nova"])
    newPass -->|"Salvar senha"| update[("updateUser; depois signOut")]
    update -->|"erro"| newPass
    update -->|"sucesso"| done(["Senha atualizada"]) -->|"3 s ou Entrar agora"| loginPwd["/login?reason=password-updated&next"]

    mailLink["Link do e-mail"] --> reset["/reset-password?next#access_token"]
    reset --> token{"Token no hash ou sessão de recuperação?"}
    token -->|"não"| expired(["Link expirado"])
    expired -->|"Pedir novo código"| forgot
    expired -->|"Entrar"| loginPlain["/login?next"]
    token -->|"sim"| newPass

    menus(["Menu do usuário no desktop ou /account (no telefone, só /account)"]) -->|"Sair"| signout[("Limpa sessão, React Query, IndexedDB, fila offline, push e caches do SW; signOut")]
    signout --> guardOut{"AuthGuard sem usuário"}
    guardOut --> loginNext["/login?next=página onde estava"]

    other(["Sessão encerrada em outro aparelho"]) --> check[("Edge sessions: sessão revogada")]
    check -->|"ao abrir o app"| reason[("setAuthSignOutReason")] --> signout
    guardOut -.->|"com motivo"| loginReason["/login?next=…&reason=session-expired"]
```

### Regras técnicas

| Ponto | Regra | Onde |
|---|---|---|
| Bootstrap | `/` manda para `/dashboard` ou `/login` depois de a sessão carregar; o sinal de carregando só aparece depois de 600 ms | `src/app/page-client.tsx`, `src/components/layout/app-bootstrap-screen.tsx` |
| Guarda | Toda rota de `(app)` sem usuário vai para `/login?next=` com `replace`. Sem exceções: `/invites/accept` saiu do grupo | `src/components/layout/auth-guard.tsx` |
| Guarda invertida | Quem já entrou em `(auth)` vai para o `next` ou o Painel. Isentas: `/forgot-password` e `/reset-password` (o `verifyOtp` cria sessão antes da troca de senha) e `/invites/accept` | `src/components/layout/auth-signed-in-redirect.tsx` |
| `next` | Só caminho interno começando com `/`; o padrão é `/dashboard` | `src/lib/auth-return-path.ts` |
| Casca | A casca vive no layout de `(auth)` (`AuthFrame`: `SplitShellRoot` e painel de marca, o mesmo nó entre as rotas); o formulário devolve só a coluna (`AuthShell`, um `SplitShellMain`) e publica o id da cena por `useAuthScene`. Sem publicação, `defaultSceneFor(pathname)`; o frame nunca lê a query. O `AuthStatus` saiu: a tela de status é o `AuthShell` com `icon` e `step` próprio. O painel desenha a cena pela tabela `SCENES`: navegador no login, tablet no convite, celular no cadastro e na recuperação | `src/app/(auth)/layout.tsx`, `src/components/layout/auth-frame.tsx`, `src/components/layout/auth-shell.tsx`, `src/components/auth/showcase/scene-context.tsx`, `src/components/auth/showcase/scenes.ts` |
| Senha | Uma política só — 8+, minúscula, maiúscula, número e símbolo — aplicada no cadastro e na redefinição | `src/lib/password-policy.ts` |
| Recuperação | Um formulário, duas portas: `/forgot-password` começa no código de 6 dígitos, `/reset-password` entra no passo da senha lendo o token do hash. O `resetPasswordForEmail` manda `redirectTo` para `/reset-password`, senão o link do e-mail cai na Site URL do projeto, que mora fora deste repositório | `src/components/password-recovery-form.tsx` |
| `next` na recuperação | `/forgot-password?next` e `/reset-password?next` leem o `next` por `recoveryLinks`, que usa `getSafeInternalNextPath`; o `redirectTo` do e-mail vira `/reset-password?next=…` e "Senha atualizada" leva a `/login?reason=password-updated&next=…`. "Pedir novo código" volta a `/forgot-password?next=…`. Sem `next` a URL não muda. Depende de a allowlist de redirecionamento do Supabase (fora do repositório) aceitar a query string | `src/lib/recovery-links.ts`, `src/components/password-recovery-form.tsx` |
| Reenviar | "Reenviar e-mail" (cadastro, `auth.resend({type:"signup"})`) e "Reenviar código" (recuperação, novo `resetPasswordForEmail`) esperam 60 s; a falha não zera a espera | `src/components/signup-form.tsx`, `src/components/password-recovery-form.tsx` |
| Convite aceito | Depois do `workspace-invites-accept` a página mostra o status "Convite aceito" com "Abrir a carteira" para `/dashboard`; não há redirecionamento automático. O fallback de carregamento já veste o `AuthShell` | `src/app/(auth)/invites/accept/page-client.tsx` |
| Erros | Tudo passa por `formatAuthErrorMessagePt`, inclusive esqueci e redefinir senha | `src/lib/supabase-errors.ts` |
| Primeira conta | Trigger `on_auth_user_created` → `handle_new_user` cria perfil, carteira "Carteira pessoal de Nome" e 7 categorias de despesa + 5 de receita | `supabase/migrations/00000000000000_baseline.sql` |
| Sessões | Ao entrar registra o aparelho; ao abrir confere se foi revogado | `src/components/providers.tsx`, edge `sessions` |
| Sair | Não navega: limpa tudo e deixa o `AuthGuard` redirecionar | `src/components/providers.tsx` |
| Motivo da saída | Sessão revogada grava o motivo em memória; o `AuthGuard` o anexa como `reason=` e o login o mostra | `src/lib/auth-signout-reason.ts` |

---

## 2. Carteiras e colaboração

A carteira é o espaço onde moram os dados. A pessoa ganha uma pessoal ao criar
a conta, pode criar carteiras compartilhadas e convidar gente para elas.

### 2a. Trocar, criar e ajustar carteira

```mermaid
%%{init: {"theme": "dark"}}%%
flowchart TD
    load[("fetch-workspaces-data: carteiras e convites pendentes")] --> current{"user_settings.current_workspace_id válido?"}
    current -->|"sim"| use(["Carteira atual"])
    current -->|"não"| first(["Primeira carteira, a pessoal"]) --> save[("Grava em user_settings")] --> use

    switcher(["Seletor de carteira: lateral ou topo mobile"]) -->|"escolher carteira"| save2[("Grava em user_settings")] --> same(["Continua na mesma página, dados da nova carteira"])
    switcher -->|"convite pendente"| accept(("G2b Aceitar convite"))
    switcher -->|"Criar carteira"| createDlg(["Nome, ícone, cor"])
    createDlg -->|"Salvar"| createRpc[("RPC create_shared_workspace")] --> newCurrent(["Nova carteira vira a atual"])
    createDlg -->|"Cancelar"| switcher

    settings["/settings"] --> owner{"É dona da carteira?"}
    owner -->|"sim"| edit(["Editar nome, ícone, cor"])
    owner -->|"sim, e não é pessoal"| del(["Excluir carteira: digitar o nome"])
    del --> impact[("RPC get_workspace_delete_impact")]
    del -->|"Excluir"| delRpc[("RPC delete_workspace")] --> fallback(["Se era a atual, volta para a pessoal"])
    owner -->|"não"| leave(["Sair da carteira: confirmação"]) -->|"Sair"| fallback
    settings --> pwa(["Instalar app: folha de instalação"])
    settings --> notif(["Preferências de notificação: canais e tópicos"])
    settings -.->|"sem carteira"| empty(["Crie ou entre numa carteira"])
```

### 2b. Convidar e aceitar convite

```mermaid
%%{init: {"theme": "dark"}}%%
flowchart TD
    members["/members"] --> isOwner{"É dona?"}
    isOwner -->|"não"| readonly(["Alerta e campos desativados"])
    isOwner -->|"sim"| actions(["Seção Convidar"])
    actions -->|"convidar por email"| create[("Edge workspace-invites-create")]
    create -->|"carteira pessoal"| rejected(["Servidor recusa: carteira pessoal não se compartilha"])
    create -->|"sucesso"| mail(["Email com /invites/accept?token=..."])
    actions -->|"gerar link"| link(["Link copiável, substitui o anterior"])
    actions -->|"reenviar"| resend[("Edge workspace-invites-resend")]
    actions -->|"revogar"| revoke(["Confirmação"])
    actions -->|"remover membro"| remove(["Confirmação"])

    mail --> acceptPage["/invites/accept?token="]
    link --> acceptPage
    picker(["Convite no seletor de carteira"]) --> acceptById["/invites/accept?invite=id"]
    acceptById --> hasToken
    acceptPage --> hasToken{"Tem token ou id?"}
    hasToken -->|"não"| invalid(["Convite inválido"])
    hasToken -->|"sim"| logged{"Tem sessão?"}
    logged -->|"não"| gate(["Cartão: Entrar ou Criar conta"])
    gate -->|"Entrar"| login(("G1 /login?next=convite"))
    gate -->|"Criar conta"| register(("G1 /register?next=convite"))
    login -.->|"volta pelo next"| acceptPage
    register -.->|"volta pelo next"| acceptPage
    logged -->|"sim"| acceptFn[("Edge workspace-invites-accept")]
    acceptFn -->|"erro: usado, expirado, outro email"| fail(["Mensagem e Tentar depois de entrar"])
    acceptFn -->|"sucesso"| switched(["Atualiza carteiras e troca para a convidada"])
    switched --> accepted(["Status Convite aceito"])
    accepted -->|"Abrir a carteira"| dash(("G4 Painel"))
```

### Regras técnicas

| Ponto | Regra | Onde |
|---|---|---|
| Carteira atual | `user_settings.current_workspace_id`; inválida cai na primeira, com a pessoal ordenada antes | `src/lib/queries/fetch-workspaces-data.ts` |
| Criar e excluir | RPCs `create_shared_workspace`, `get_workspace_delete_impact`, `delete_workspace` | `src/components/workspace-provider.tsx` |
| Sair da carteira | Diálogo próprio de confirmação | `src/components/settings/workspace-leave-dialog.tsx` |
| Membros | RPC `workspace_member_directory`; só a dona convida, revoga e remove | `src/app/(app)/members/page-client.tsx` |
| Convite | Edges `workspace-invites-create`, `-resend`, `-accept`; o email é montado no servidor | `supabase/functions/_shared/workspace-invite-email.ts` |
| Página de convite | Fica no grupo `(auth)`: veste o `AuthShell` e não atravessa a casca do app. O `WorkspaceProvider` é global, então a mudança de grupo não custou nada | `src/app/(auth)/invites/accept/page-client.tsx` |

---

## 3. Navegação e ações globais

O que está disponível em qualquer tela: a casca, o "+" de adicionar, a busca
(⌘K) e as notificações.

```mermaid
%%{init: {"theme": "dark"}}%%
flowchart TD
    shell(["Casca do app"]) --> desktop{"Largura"}
    desktop -->|"desktop"| sidebar(["Lateral recolhível"])
    desktop -->|"mobile"| bottom(["Barra inferior: Painel, Transações, Categorias, +, conta"])

    sidebar --> nav1["/dashboard"]
    sidebar --> nav2["/transactions"]
    sidebar --> nav3["/categories"]
    sidebar --> nav4["/subscriptions"]
    sidebar --> nav5["/bills (Beta)"]
    sidebar --> nav6["/credit-cards"]
    sidebar --> nav7["/members"]
    sidebar --> nav8["/settings"]
    sidebar --> userMenu(["Menu do usuário: tema, Minha conta, Planos, Sair"])
    bottom --> accountMenu(["Menu da conta, painel que brota da aba: Assinaturas, Contas, Cartões, Membros · Minha conta, Configurações"])
    userMenu --> G10(("G10 Conta"))
    accountMenu --> G10

    sidebar -->|"+ Adicionar, direto, com Despesa"| txForm(("G5b Formulário de transação"))
    bottom -->|"+, a gaveta do formulário"| txForm
    txForm -.->|"formulário global indisponível"| fallback["/transactions?new= ou /subscriptions?new=1"]

    topbar(["Barra do topo: lupa"]) -->|"clicar"| palette(["Paleta de busca: Recentes, Telas, Ações, Transações, Cartões, Categorias, Parcelas, Assinaturas, Contas, Membros, Carteiras"])
    shell -->|"⌘K ou Ctrl+K"| palette
    palette -->|"Telas ou Recentes: as da lateral menos o Painel"| nav2
    palette -->|"Ações: Nova despesa, parcelada, receita"| txForm
    palette -->|"Ações: Nova assinatura"| subForm(("G8 Formulário de assinatura"))
    palette -->|"Ações: Nova categoria, Novo cartão"| createDialogs(["Diálogos de criar categoria e cartão"])
    palette -->|"Transações, consulta no banco"| txnDetail["/transactions?txn=id"]
    palette -->|"Ver todas em Transações"| txnList["/transactions?q, from, to, min, max"]
    palette -->|"Cartões"| cardDetail["/credit-cards/id"]
    palette -->|"Categorias"| catDetail["/categories/id"]
    palette -->|"Compras parceladas"| planPage["/transactions?plan=id"]
    palette -->|"Assinaturas"| subPage["/transactions?sub=id"]
    palette -->|"Contas a pagar"| billPage["/bills?detail=id"]
    palette -->|"Membros"| nav7
    palette -->|"Carteiras"| walletSwitch[("Troca a carteira atual")]

    bell(["Sino de notificações"]) -->|"clicar"| read[("Marca como lida")] --> dest{"Tipo da notificação"}
    dest -->|"href explícito"| explicit["Rota do metadata.href"]
    dest -->|"category_created"| n1["/categories"]
    dest -->|"invite_accepted"| n2["/members"]
    dest -->|"cc_*"| n3["/credit-cards/id"]
    dest -->|"budget_threshold"| n4["/categories/id"]
    dest -->|"bill_reminder"| n5["/bills"]
    dest -->|"member_expense_created"| n6["/transactions?txn=id"]
    dest -->|"outros"| n7["/dashboard"]
    bell -->|"engrenagem"| nav8
    bell -->|"marcar lida, excluir, limpar tudo"| bell

    old["Rotas antigas"] -->|"next.config.ts"| redirects["/dashboard/settings → /settings; /wallets → /dashboard; /assets → /credit-cards; /notifications → /dashboard?notifications=1"]
    unknown["Rota desconhecida"] --> notFound(["404: Ir para o painel ou Página inicial"])
```

### Regras técnicas

| Ponto | Regra | Onde |
|---|---|---|
| Itens de navegação | Lateral e mobile vêm de configuração, não de JSX solto | `src/config/navigation.ts`, `src/config/mobile-navigation.ts` |
| Formulários globais | Transação e assinatura montados uma vez na casca; salvar invalida as listas abertas | `src/components/layout/global-shell-dialogs-provider.tsx` |
| Menus do telefone | O "+" abre direto a gaveta do formulário de lançamento, com Despesa marcada (o seletor do formulário troca para Parcelada e Receita; assinatura fica na tela dela e na paleta). Era uma folha de ações (`Drawer` com `DrawerActions`) antes do formulário, e no desktop um menu: um passo a mais na jornada mais comum. A aba "Mais" (fixa: não troca de ícone nem de rótulo e não fica ativa nas páginas do menu; era o avatar) abre o menu da conta num painel (`DropdownMenu variant="panel"`) que brota dela para cima, só com as telas que não cabem na barra; cada link fecha o painel e leva à tela. Em cima as telas da carteira, embaixo Minha conta e Configurações. O tema mora em Configurações (seção Aparência); o sair (o menu ⋯ do perfil) e Planos e pagamentos (a seção Plano, só no telefone) moram em Minha conta. Antes foi uma gaveta de 625px com identidade, tema e sair, e antes dela um `Popover` de vidro escrito à mão | `src/components/layout/quick-actions.tsx`, `src/components/layout/mobile-account-menu.tsx` |
| Busca global (⌘K) | Montada uma vez no `AppHeader`, com a lupa nas duas árvores da barra; no telefone abre como gaveta. A raiz busca tudo, sem sub-página: o filtro é da paleta (`shouldFilter: false`) e cada grupo vem ranqueado por `ranquear` (`lib/app-search`), até 5 linhas. Telas (com sinônimos: "gastos" acha Transações, "fatura" Cartões, "boletos" Contas a pagar) são as da barra lateral menos o Painel, mais Membros (`navigation.ts`); Painel, Configurações, Minha conta, Planos e pagamentos, Sessões ativas, Atividade e Notificações ficam fora da busca, por decisão do dono. Ações chamam os mesmos ganchos do "+ Adicionar" (`useQuickCreateTransaction`, `useQuickCreateSubscription`) e os diálogos da casca (Nova categoria, Novo cartão). Transações são uma consulta de leitura ao banco (descrição, valor, data, nome da categoria e do cartão; as 8 mais recentes; espera de 250ms depois da digitação) e abrem `/transactions?txn=id`; "Ver todas em Transações" leva `q`, `from`, `to`, `min` e `max` na URL, e a lista filtra o texto só pela descrição. Transação nunca vira recente. Cartões e categorias leem o cache da casca (`useCategoriesQuery`, `useCreditCardsQuery`); parcelas (`?plan=id`), assinaturas (`?sub=id`) e membros (`/members`) saem das listas do espaço; contas a pagar vêm de uma consulta leve (`useBillsListQuery`) e abrem `/bills?detail=id`; escolher uma carteira troca a carteira atual. Os recentes ficam no `localStorage` (`app:busca`). Digitar `/` escolhe onde buscar (`/transacoes`, `/membros`…, `lib/app-search-scopes`): o nome entra no campo como escopo, só aquele grupo aparece (até 50 linhas; 20 transações), e dois Backspaces com o campo vazio voltam à busca em tudo | `src/components/layout/app-command-palette.tsx`, `src/lib/app-search-scopes.ts`, `src/components/layout/app-search-sources.ts`, `src/lib/app-search.ts`, `src/lib/transaction-search.ts`, `src/lib/queries/use-transactions-search.ts`, `src/lib/queries/use-bills-list.ts` |
| Nome da tela e voltar | No telefone a barra do topo mostra o título e o voltar das subpáginas (`/categories/id`, `/categories/new`, `/credit-cards/id`, as de `/account`), pelo `usePageChromeSlot`. No desktop ela não mostra o nome da tela (o `<h1>` fica só para o leitor de tela) nem a trilha: a lateral marca onde se está e é o caminho de volta. A trilha com o link para a tela de cima ("Categorias", "Cartões de crédito") saiu em 2026-10-16 | `src/components/layout/app-header.tsx` |
| Destino da notificação | `metadata.href` seguro vence; senão, o tipo decide. Espelha o servidor para o push | `src/lib/notification-href.ts`, `supabase/functions/_shared/notification-types.ts` |
| Notificações no servidor | Edges `dispatch-notifications`, `evaluate-budgets`, `evaluate-credit-card-alerts`, `evaluate-bills-reminders`, `credit-card-calendar-alerts`, `notify-transaction-created` | `supabase/functions/` |
| Push | Edges `push-subscribe` e `push-unsubscribe` | `supabase/functions/` |
| Redirecionamentos | Os únicos que acontecem no servidor | `next.config.ts` |

---

## 4. Painel

`/dashboard`: o resumo do mês e a porta para o resto. Ao abrir, ele também
recupera cobranças atrasadas de assinaturas e parcelas.

```mermaid
%%{init: {"theme": "dark"}}%%
flowchart TD
    dash["/dashboard"] --> state{"Carteiras carregadas?"}
    state -->|"erro"| retry(["Tentar novamente"]) --> dash
    state -->|"sem carteira"| pick(["Escolha uma carteira na lateral"])
    state -->|"ok"| catchup[("RPC catch_up_recurring_billing")]
    catchup -->|"gerou lançamentos"| invalidate(["Recarrega transações, assinaturas e parcelas"])
    state -->|"ok"| blocks(["Seletor de mês, KPIs: despesas, receitas, resultado, faturas abertas"])

    blocks --> calendar(["Calendário de pagamentos"])
    calendar -->|"grade: dia com eventos"| dayPop(["Popover do dia"])
    calendar -->|"lista, abaixo de 40rem: evento"| eventPick{"Evento lançado?"}
    eventPick -->|"sim"| detail
    eventPick -->|"não"| preview
    dayPop -->|"evento já lançado"| detail(("G5b Detalhe da transação"))
    dayPop -->|"evento previsto"| preview(["Prévia do pagamento"])
    preview -->|"Ver origem: assinatura"| s["/transactions?sub=id"]
    preview -->|"Ver origem: parcela"| p["/transactions?plan=id"]
    preview -->|"Ver origem: fechamento ou vencimento"| c["/credit-cards/id"]
    preview -->|"Ver origem: conta"| b["/bills?detail=id"]

    blocks --> donut(["Despesas por categoria"]) -->|"Ver categorias"| cat(("G9 /categories"))
    blocks --> invoices(["Faturas do mês"])
    invoices -->|"linha do cartão"| c
    invoices -->|"Ver cartões ou Ir para cartões"| cards(("G6 /credit-cards"))
    blocks --> inst(["Compras parceladas"])
    inst -->|"linha"| detail
    inst -->|"Ver em transações"| instList["/transactions?type=expense&inst=1"]

    s --> G5(("G5 Lançamentos"))
    p --> G5
    instList --> G5
    c --> G6(("G6 Cartões"))
    b --> G7(("G7 Contas a pagar"))
```

### Regras técnicas

| Ponto | Regra | Onde |
|---|---|---|
| Dados | Um hook agrega os blocos por mês e carteira | `src/components/dashboard/use-dashboard-data.ts` |
| Cobranças atrasadas | `catch_up_recurring_billing` roda uma vez por carteira ao montar; é idempotente com o cron | `src/lib/queries/use-recurring-billing-catchup.ts` |
| Calendário | Eventos: assinatura, parcela, fechamento, vencimento de cartão, vencimento de conta, receita e despesa lançadas. É a agenda do `Calendar` (rodada 242): na grade, o dia abre o popover e fica marcado (com a janela abaixo de 768px o popover abre como gaveta); abaixo de 40rem da largura da própria agenda ela vira a lista do mês — no telefone, e também num laptop estreito com a barra lateral aberta e o painel de próximos ao lado —, e o evento abre direto o detalhe ou a prévia, sem o popover. A lista mostra os últimos 5 dias passados com evento e todos os que vêm, com o selo do tipo. A grade de pontos do telefone saiu | `src/components/dashboard/dashboard-payments-calendar.tsx` |
| Prévia | "Ver origem" monta a rota pelo tipo do evento | `src/components/dashboard/dashboard-payment-event-preview-sheet.tsx` |

---

## 5. Lançamentos

`/transactions`: a lista de despesas e receitas, e o formulário que as cria.
É a jornada para onde as outras mandam a pessoa quando querem mostrar dinheiro
que já se mexeu.

### 5a. Lista e filtros

```mermaid
%%{init: {"theme": "dark"}}%%
flowchart TD
    entry["/transactions?params"] --> parse{"Parâmetros da URL"}
    parse -->|"type, inst, preset, from, to, pm, card, cats, uncat, min, max, q, plan, sub"| filters(["Filtros aplicados"])
    parse -->|"sort, page"| order(["Ordenação e página"]) --> list
    parse -->|"new=1, parcelada, receita"| form(("G5b Formulário"))
    parse -->|"txn=id"| detail(("G5b Detalhe"))

    filters --> list(["Tabela paginada de 100 em 100; no telefone, a lista com o mês"])
    list -->|"cabeçalho Data ou Valor; página"| order
    order -.->|"grava de volta"| url
    list -->|"Todas, Despesas, Receitas; 7d, 15d, 30d, Mês"| filters
    list -->|"Filtros"| panel(["Painel: período, forma, cartões, categorias, valor, descrição, origem"]) --> filters
    panel -->|"período personalizado"| rangePick(["Seletor de período: rascunho até Aplicar"])
    rangePick -->|"Aplicar ou Limpar"| filters
    rangePick -.->|"Cancelar ou Esc"| panel
    filters -->|"chip ✕ ou limpar tudo"| filters
    filters -.->|"grava de volta"| url["URL"]

    list --> empty{"Vazio?"}
    empty -->|"sem filtros"| newTx(["Nova transação"]) --> form
    empty -->|"com filtros"| clear(["Limpar filtros"]) --> filters

    list -->|"Nova"| form
    list -->|"linha"| detail
    list -->|"lápis"| detailEdit(("G5b Detalhe em edição"))
    list -->|"lixeira"| delConfirm(("G5b Confirmação de exclusão"))
    list -->|"caixas de seleção, Shift para a faixa, a caixa do mês"| selection(["Barra flutuante de seleção"])
    selection -->|"Editar, só com 1"| detailEdit
    selection -->|"Excluir"| bulk(["Exclusão em lote"])
    selection -->|"Limpar"| list
    list -.->|"botão direito ou toque longo na linha"| rowMenu(["Menu: Abrir, Editar, Selecionar, Excluir"])
    rowMenu -.-> detail
    rowMenu -.-> detailEdit
    rowMenu -.-> selection
    rowMenu -.-> delConfirm
    list -.->|"botão direito numa linha selecionada"| selMenu(["Menu da seleção: Limpar, Excluir N"])
    selMenu -.-> bulk
    list -.->|"pousar, focar ou segurar o chip de fatura"| invoicePeek(["Prévia da fatura: cartão, estado, fecha, vence"])
    invoicePeek -->|"Ver cartão"| cardPage(("G6 /credit-cards/id"))
    list -.->|"pousar, focar ou segurar o chip Parcelada"| planPeek(["Prévia do parcelamento: parcela N de M, total, última"])
```

### 5b. Criar, editar e excluir

```mermaid
%%{init: {"theme": "dark"}}%%
flowchart TD
    open(["Formulário: modal no desktop, folha no mobile"]) --> type{"Tipo"}
    type -->|"Despesa"| expense(["Valor, descrição, categoria, data, forma de pagamento"])
    type -->|"Receita"| income(["Valor, descrição, categoria, data"])
    type -->|"Parcelada"| inst(["Valor total ou por parcela, nº de parcelas, 1ª cobrança"])

    expense --> catPick(["Seletor de categoria"])
    income --> catPick
    catPick -->|"Gerenciar categorias"| G9(("G9 /categories"))
    expense -->|"forma: cartão de crédito"| cardPick(["Seletor de cartão"])
    cardPick -->|"Cadastrar cartão ou sem cartões"| G6(("G6 /credit-cards"))
    cardPick -.->|"sem cartão escolhido"| disabled(["Salvar desativado"])

    expense -->|"Salvar"| saveTx[("Insere transação")]
    income -->|"Salvar"| saveTx
    inst -->|"Salvar"| savePlan[("RPC create_workspace_installment_plan")]
    saveTx -->|"offline"| queued(["Salva na fila offline"])
    saveTx -->|"erro"| keep(["Aviso; formulário continua aberto"])
    saveTx -->|"sucesso"| after[("Edges notify-transaction-created, evaluate-budgets, evaluate-credit-card-alerts")]
    after --> toast(["Transação criada; listas recarregam"])
    toast -->|"Ver, só online"| txOpen(("G5b Detalhe /transactions?txn=id"))
    savePlan -->|"sucesso"| toastPlan(["Compra parcelada registrada"])
    toastPlan -->|"Ver, só online"| planList(("G5 /transactions?plan=id"))
    open -->|"Cancelar, Esc ou fora, sem alterações"| closed(["Fecha e descarta"])
    open -->|"fechar com alterações"| discard(["Descartar alterações?"])
    discard -->|"Descartar"| closed
    discard -->|"Continuar editando"| open
    saveTx -.->|"salvando: nada fecha"| open

    detail(["Detalhe da transação"]) --> view(["Valor, data, categoria, forma, dica da fatura"])
    view -->|"é parcela"| planInfo(["Parcela k de n, total, lançado, restante"])
    view -->|"tem assinatura"| G8(("G8 /subscriptions"))
    view -->|"⋯ Editar"| editWhat{"É parcela?"}
    editWhat -->|"não"| editForm(["Editar campos"])
    editWhat -->|"sim"| scope(["O que editar: esta parcela ou plano da compra"]) --> editForm
    editForm -->|"Salvar"| updated(["Transação ou plano atualizado"]) --> view
    editForm -->|"Cancelar"| view
    view -->|"⋯ Excluir"| confirm(["Excluir transação?"])
    confirm -->|"Cancelar"| view
    confirm -->|"Excluir"| isInst{"É parcela?"}
    isInst -->|"não"| delTx[("Remove transação")] --> deleted(["Transação excluída"])
    isInst -->|"sim"| cascade[("RPC delete_workspace_installment_plan_cascade")] --> cancelled(["Compra parcelada cancelada"])
    confirm -.->|"offline"| queuedDel(["Exclusão enfileirada"])
```

### Regras técnicas

| Ponto | Regra | Onde |
|---|---|---|
| Parâmetros | Lidos e gravados na URL; `new` e `txn` são consumidos e removidos | `src/lib/transactions-list-search-params.ts` |
| Ordenação e página | `sort=date.desc` · `date.asc` · `amount.desc` · `amount.asc` e `page=N` (a partir de 1) vão para a URL e voltam dela, também no voltar e avançar; o padrão (`date.desc`, página 1) não é escrito. Trocar um filtro volta à página 1. Só na página, não no modo embutido | `src/components/transactions/use-transactions-list-controller.ts`, `src/lib/transactions-list-search-params.ts` |
| Tabela | `DataTable` em modo `manual` (o banco ordena e pagina): a seleção não alcança as projetadas, que também não abrem nem têm menu; o mês só agrupa ordenado por data; a barra de seleção é flutuante e cancelar a exclusão mantém a seleção; no telefone, a lista gerada das colunas | `src/components/transactions/transactions-table.tsx`, `src/components/ui/data-table.tsx` |
| Formulário | Um componente para criar, e o mesmo campo a campo na edição | `src/components/transactions/transaction-form-dialog.tsx`, `transaction-form-use.tsx` |
| Parcelada | RPC `create_workspace_installment_plan`; editar o plano não muda parcelas já lançadas | `src/components/transactions/transaction-form-persistence.ts` |
| Detalhe | Mesmo painel no Painel, em Cartões e em Categorias | `src/components/transactions/transaction-detail-sheet.tsx` |
| Exclusão | Parcela cancela o plano inteiro por `delete_workspace_installment_plan_cascade`. Continua com confirmação, e não com o Desfazer do toast: a exclusão é física (`delete`), sem `deleted_at` nem RPC de restaurar, e recriar mudaria o id e quebraria parcelas, recorrência e faturas (verificado na rodada 228) | `src/lib/transactions/mutations.ts` |
| "Ver" do toast | Criar uma transação (não editar) mostra "Ver", que leva a `/transactions?txn=id` e abre o detalhe; a compra parcelada leva a `?plan=id`. Offline não há id, e o toast sai sem "Ver". A trava que abre o `txn` uma vez só volta a soltar quando a URL perde o parâmetro — antes, com `/transactions` aberta, o segundo `?txn=` não abria nada | `persistTransactionSave` em `src/lib/transaction-detail-sheet-mutations.ts`, `transaction-form-persistence.ts`, `use-transactions-list-controller.ts` |
| Offline | Criar e excluir entram na fila; pagar conta exige conexão | `src/lib/offline/` |
| Rascunho | Fechar o formulário alterado (Cancelar, Esc, toque fora, ×, arrastar a gaveta) pergunta "Descartar alterações?"; salvar fecha sem perguntar. Trocar só a aba ou o tipo não conta como alteração. Enquanto salva, nada fecha (`Dialog pending`) | `isDirty` em `src/components/transactions/transaction-form-use.tsx`, `src/components/transactions/transaction-form-dialog.tsx` |
| Enter | O `Enter` na busca do seletor não salva a transação: o popover é portalizado, e a submissão implícita do navegador só conta os campos cujo dono no DOM é o `<form>` | `Form` em `src/components/ui/form.tsx` |
| Período personalizado | Um `DatePicker` de intervalo com `confirm`: as pontas ficam em rascunho até Aplicar, Limpar tira o filtro, Cancelar e Esc descartam. Era um formulário à parte (`transactions-date-range-form.tsx`, removido) | `src/components/transactions/transactions-filters-panel.tsx` |
| Prévias dos chips | O chip de fatura e o "Parcelada" abrem uma prévia ao pousar, no foco e no toque longo (`HoverCard`); o clique no chip continua abrindo o detalhe da linha. A da fatura leva a "Ver cartão" (o ciclo atual: a página do cartão não abre uma fatura passada por parâmetro). O chip de fatura só existe a partir de `md` | `CreditInvoiceChip` e `InstallmentChip` em `src/components/transactions/transactions-table.tsx` |
| Botão direito na linha | Atalho das ações da linha (os botões da coluna Ações continuam); sobre uma linha selecionada age na seleção inteira (`contextMenuTargets`); linhas projetadas não têm menu | `TransactionRowContextMenu` em `src/components/transactions/transactions-table.tsx` |

---

## 6. Cartões e faturas

`/credit-cards` e `/credit-cards/[cardId]`: cadastro dos cartões e o ciclo de
cada fatura.

```mermaid
%%{init: {"theme": "dark"}}%%
flowchart TD
    list["/credit-cards"] -->|"aba Cartões"| tiles(["Cartões: fatura, fechamento, vencimento, limite"])
    list -->|"aba Histórico"| chart(["Faturas dos últimos 12 meses"])
    list -->|"Novo cartão, estado vazio ou ?new=1"| newCard(["Cadastro: apelido, número, validade, limite, fechamento, vencimento, bandeira"])
    newCard -->|"Salvar"| valid{"Dias 1 a 31 e validade ok?"}
    valid -->|"não"| newCard
    valid -->|"sim"| created(["Cartão cadastrado"]) --> list
    created -->|"Ver, só online"| detail
    newCard -->|"Cancelar"| list
    tiles -->|"cartão"| detail["/credit-cards/id"]

    detail --> found{"Cartão existe?"}
    found -->|"não"| missing(["Ver todos os cartões"]) --> list
    found -->|"sim"| top(["Dados do cartão"])
    top -->|"Ver transações neste cartão"| G5(("G5 /transactions?card=id&preset=last30"))
    top -->|"⋯ Editar"| editCard(["Editar cartão"]) --> top
    top -->|"⋯ Desativar ou Ativar"| toggle(["Cartão desativado ou ativado"]) --> top
    top -->|"⋯ Excluir"| delCard(["Excluir cartão?"])
    delCard -->|"Excluir"| list
    delCard -->|"Cancelar"| top

    top --> cycle(["Seletor de ciclo da fatura"]) --> status{"Qual ciclo?"}
    status -->|"futuro"| future(["Futura"])
    status -->|"atual"| openInv(["Aberta: período, fechamento, uso do limite"])
    status -->|"passado sem pagamento"| unpaid(["Não paga; vermelha se venceu"])
    status -->|"passado pago"| paid(["Paga"])
    unpaid -->|"Marcar como paga"| payRow[("Grava credit_card_invoice_payments")] --> paid
    paid -->|"Desmarcar pagamento"| undo(["Confirmação: volta para Contas a pagar"])
    undo -->|"Desmarcar"| unpaid
    unpaid -.->|"fechada com valor em aberto"| G7(("G7 Pendentes"))

    top --> byCat(["Gasto por categoria da fatura"]) -->|"linha"| G9(("G9 /categories/id?type=expense&month="))
    top --> installments(["Parcelas e compromissos"]) -->|"linha"| txDetail(("G5b Detalhe"))
    top --> recent(["Últimos lançamentos"])
    recent -->|"linha"| txDetail
    recent -->|"Ver todas"| G5
```

### Regras técnicas

| Ponto | Regra | Onde |
|---|---|---|
| Status no detalhe | `Futura`, `Aberta`, `Não paga`, `Paga`, pelo ciclo selecionado | `src/app/(app)/credit-cards/[cardId]/page-client.tsx` |
| Selo na tabela de transações | `Aberta`, `Fechada`, `Anterior`, `Paga`; Aberta é verde, Fechada âmbar, Anterior vermelha | `src/lib/credit-card-display.ts` |
| Pagamento de fatura | Linha em `credit_card_invoice_payments`, sem criar despesa | `src/lib/bills/pay-bill-flow.ts` |
| "Ver" do toast | Cadastrar um cartão (pela página ou pelo diálogo do "+ Adicionar") mostra "Ver", que leva a `/credit-cards/id`; na fila offline, sem "Ver" | `src/app/(app)/credit-cards/page-client.tsx`, `src/components/credit-cards/credit-card-create-dialog.tsx` |
| Alertas | Limite, fechamento e vencimento geram notificações `cc_*` | edges `evaluate-credit-card-alerts`, `credit-card-calendar-alerts` |

---

## 7. Contas a pagar

`/bills` (Beta): contas recorrentes e o que está pendente, incluindo as faturas
de cartão que fecharam em aberto.

```mermaid
%%{init: {"theme": "dark"}}%%
flowchart TD
    bills["/bills?detail=id"] -->|"detail presente"| sheet(["Painel da conta"])
    bills --> tabs{"Aba"}
    tabs -->|"Contas: todas, ativas, inativas"| summary(["Cartões de conta"])
    tabs -->|"Pendentes: todas, atrasadas, 30 dias"| pending(["Itens pendentes"])
    bills -->|"Nova conta"| form(["Formulário: nome, categoria, periodicidade, vencimento, valor, início, fim, forma, cartão, lembretes, ativa"])
    form -->|"Salvar"| saved(["Conta criada ou atualizada"])
    saved -->|"Ver, ao criar e online"| bills
    form -->|"Cancelar"| bills

    bills --> empty{"Vazio?"}
    empty -->|"nenhuma conta"| form
    empty -->|"filtro sem resultado"| clear(["Limpar filtros"])
    empty -->|"nada pendente, com histórico"| goContas(["Ver contas"]) --> summary

    summary -->|"clique"| sheet
    pending --> kind{"Tipo do item"}
    kind -->|"parcela de conta"| regular(["Parcela"])
    kind -->|"fatura de cartão fechada"| virtual(["Fatura"])

    regular -->|"clique"| sheet
    regular -->|"Pagar"| payRegular(["Pagar: valor, data, categoria, forma, cartão, descrição"])
    regular -->|"⋯ Editar modelo"| form
    regular -->|"⋯ Ignorar parcela"| skip(["Parcela ignorada; próxima gerada"])
    regular -->|"⋯ Excluir conta"| del(["Excluir conta?"])

    virtual -->|"clique"| G6(("G6 /credit-cards/id"))
    virtual -->|"Pagar"| payVirtual(["Pagar fatura: Marcar como paga"])
    pending -.->|"botão direito ou toque longo"| billMenu(["Menu: Abrir, Pagar; na parcela também Editar modelo, Ignorar, Excluir conta"])
    billMenu -.-> sheet
    billMenu -.-> payRegular
    billMenu -.-> form
    billMenu -.-> skip
    billMenu -.-> del

    sheet -->|"Pagar parcela"| payRegular
    sheet -->|"Editar"| form
    sheet -->|"Excluir"| del
    sheet -->|"Ignorar parcela"| skip
    sheet --> stats(["Total pago 90d, média, atrasos, pendentes, histórico"])

    payRegular -->|"Registrar pagamento"| online{"Online?"}
    online -->|"não"| needNet(["Requer conexão"])
    online -->|"sim"| payRpc[("RPC pay_bill_instance: cria despesa")]
    payRpc --> alerts[("Edges evaluate-budgets e alertas de cartão")] --> G5(("G5 Lançamentos"))
    payVirtual -->|"Marcar como paga"| invPay[("credit_card_invoice_payments, sem despesa")] --> G6
    del -->|"Excluir"| removed(["Conta removida com todas as parcelas"])
    del -->|"Cancelar"| bills

    reminders[("Edge evaluate-bills-reminders")] -.->|"3 dias antes ou no dia"| notif(("G3 Notificação bill_reminder"))
```

### Regras técnicas

| Ponto | Regra | Onde |
|---|---|---|
| Dados | Um RPC traz a página inteira | `rpc_fetch_bills_page_bundle` em `src/lib/queries/fetch-bills-page-bundle.ts` |
| Fatura como pendência | Projetada no cliente a partir dos ciclos fechados com valor em aberto | `src/lib/bills/credit-card-bill-projector.ts` |
| Pagar conta | `pay_bill_instance` cria a despesa e avança a recorrência; bloqueado offline | `src/lib/bills/pay-bill-flow.ts` |
| Pagar fatura | Só marca como paga: as compras já estão lançadas no cartão | `src/lib/bills/pay-bill-flow.ts` |
| Recorrência | Mensal, Bimestral, Trimestral, Anual, Única | `src/lib/bills/recurrence.ts` |
| Botão direito | No cartão de pendência, repete o "Pagar" e o menu de três pontos, que continuam à vista | `src/components/bills/bill-pending-card.tsx` |
| "Ver" do toast | Criar uma conta mostra "Ver", que leva a `/bills?detail=id` e abre o painel dela (sem levar os outros filtros da URL); na fila offline, sem "Ver" | `src/app/(app)/bills/page-client.tsx` |

---

## 8. Assinaturas

`/subscriptions`: cobranças recorrentes que viram lançamentos sozinhas.

```mermaid
%%{init: {"theme": "dark"}}%%
flowchart TD
    subs["/subscriptions?new=1&sort&page&q&status"] -->|"new presente"| form(["Formulário: nome, valor, periodicidade, próxima cobrança, forma, cartão, categoria, observações"])
    subs --> list(["Lista: todas, ativas, inativas; ordenar; buscar; colunas e densidade"])
    list -.->|"ordenar, página, busca, status"| url["URL"]
    list -->|"Exportar"| csv(["CSV da lista filtrada"])
    list -->|"Nova assinatura"| form
    list -->|"vazio"| emptyNew(["Cadastre suas assinaturas"]) --> form
    list -->|"filtro sem resultado"| clear(["Limpar filtros"]) --> list
    form -->|"link do cartão"| G6(("G6 /credit-cards"))
    form -->|"link da categoria"| G9(("G9 /categories"))
    form -->|"Salvar"| saved(["Assinatura cadastrada ou atualizada"]) --> list
    form -->|"Cancelar"| list

    list -->|"linha"| sheet(["Painel: resumo, detalhes, cobranças, observações"])
    sheet -->|"cobrança em transações"| txDetail(("G5b Detalhe"))
    sheet -->|"⋯ Editar"| editInline(["Edição dentro do painel"]) --> sheet
    sheet -->|"⋯ Excluir"| del(["Excluir assinatura?"])
    list -->|"lápis"| editInline
    list -->|"⋯ Excluir"| del
    list -.->|"botão direito ou toque longo"| rowMenu(["Menu: Editar, Excluir"])
    rowMenu -.-> editInline
    rowMenu -.-> del
    list -->|"seleção múltipla"| bar(["Barra flutuante: Editar só com 1, Excluir em lote, Limpar"])
    bar -->|"Editar"| sheet
    bar -->|"Excluir"| del
    del -->|"Excluir"| removed(["Assinatura removida"]) --> list

    cron[("Edge run-recurring-billing, via cron")] --> billed(["Cobrança vira lançamento"])
    catchup[("RPC catch_up_recurring_billing ao abrir o Painel")] --> billed
    billed --> G5(("G5 Lançamentos"))
```

### Regras técnicas

| Ponto | Regra | Onde |
|---|---|---|
| Dados | `rpc_fetch_subscriptions_page_bundle` | `src/lib/queries/fetch-subscriptions-page-bundle.ts` |
| Periodicidade | Semanal, Mensal, Bimestral, Anual | `src/components/subscriptions/subscription-form-dialog.tsx` |
| Cobrança | `run-recurring-billing` só aceita chamada com `CRON_SECRET`; o Painel recupera o atraso | `supabase/functions/run-recurring-billing/index.ts` |
| Filtro por assinatura | `/transactions?sub=id` | `src/lib/transactions-list-search-params.ts` |
| Estado na URL | `sort=<coluna>.<asc\|desc>`, `page=N` (a partir de 1), `q` (a busca) e `status=active` ou `inactive`, lidos ao abrir e gravados a cada troca; trocar de carteira zera os quatro | `urlState` do `DataTable` em `src/app/(app)/subscriptions/page-client.tsx` |
| Tabela | `DataTable` no cliente: busca sem acento, exportar CSV, colunas e densidade guardadas; Excluir da linha está no ⋯ (Editar fica à vista); cancelar a exclusão em lote mantém a seleção | `src/app/(app)/subscriptions/page-client.tsx` |

---

## 9. Categorias e orçamentos

`/categories`: as categorias da carteira e o limite mensal de cada uma. Não há
tela separada de orçamento: o limite mora na categoria. Na primeira visita de
cada carteira aparece um assistente.

```mermaid
%%{init: {"theme": "dark"}}%%
flowchart TD
    cats["/categories?month="] --> onboarded{"categories_onboarding_completed_at preenchido?"}
    onboarded -->|"não"| step0(["Assistente 1: renda mensal, opcional"])
    step0 -->|"Continuar"| step1(["Assistente 2: categorias e limites"])
    step1 -->|"Voltar"| step0
    step1 -->|"Sugerir pela renda"| step1
    step1 -->|"adicionar, editar, excluir"| step1
    step1 -->|"Revisar, com 1+ categoria de despesa"| step2(["Assistente 3: confirmar"])
    step2 -->|"Voltar"| step1
    step2 -->|"Concluir"| complete[("Grava orçamentos; RPC complete_workspace_categories_onboarding")]
    step1 -->|"Configurar depois"| complete
    complete --> listView
    onboarded -->|"sim"| listView(["Lista: Despesas ou Receitas; mês só em Despesas"])

    newRoute["/categories/new"] --> catForm
    listView -->|"Nova categoria"| catForm(["Formulário: tipo, nome, cor, ícone; limite do mês se despesa"])
    catForm -->|"Salvar"| savedCat[("Categoria e orçamento do mês")] --> notifCat(("G3 Notificação category_created"))
    savedCat -->|"toast Ver, ao criar e online"| detail
    savedCat --> listView
    catForm -->|"valor inválido"| catForm
    listView -->|"⋯ Editar"| catForm
    listView -->|"⋯ Excluir"| delCat(["Excluir categoria?"])
    delCat -->|"Excluir ou Cancelar"| listView
    listView -.->|"botão direito ou toque longo no cartão"| catMenu(["Menu: Abrir, Abrir em nova aba, Editar, Excluir"])
    catMenu -.-> detail
    catMenu -.-> catForm
    catMenu -.-> delCat

    listView -->|"cartão de despesa"| detail["/categories/id?type=expense&month="]
    listView -->|"cartão de receita"| detailIn["/categories/id?type=income"]
    detailIn --> detail

    detail -->|"voltar, no telefone; no desktop, a lateral"| cats
    detail --> summary(["Orçamento, restante, estouro, lançado x projetado, média, maior e menor, % do total"])
    detail --> trend(["Tendências"])
    detail -->|"⋯ Editar"| catForm
    detail -->|"⋯ Excluir"| delDetail(["Excluir categoria?"]) -->|"Excluir"| listView
    detail --> embedded(["Lançamentos do mês com a categoria travada"])
    embedded -->|"Ver em Transações"| G5(("G5 /transactions?cats=id"))
    embedded -->|"linha"| txDetail(("G5b Detalhe"))
    embedded -->|"vazio: Nova transação"| txForm(("G5b Formulário"))

    budget[("Edge evaluate-budgets")] -.->|"limite atingido"| notifBudget(("G3 Notificação budget_threshold"))
```

### Regras técnicas

| Ponto | Regra | Onde |
|---|---|---|
| Assistente | Só em `/categories`, por carteira; nada redireciona para ele | `src/components/categories/categories-onboarding-wizard.tsx` |
| Detalhe | `rpc_fetch_category_detail_bundle` | `src/lib/queries/fetch-category-detail-bundle.ts` |
| "Ver" do toast | Criar uma categoria (pela tela ou pelo diálogo do "+ Adicionar") mostra "Categoria criada" com "Ver", que leva a `/categories/id?type=`; se o orçamento falhar, o aviso "Categoria criada, mas o orçamento não foi salvo" leva ao mesmo detalhe. Na fila offline, sem "Ver". A tela de categorias não mostrava toast nenhum ao criar | `src/components/categories/category-create-dialog.tsx`, `src/app/(app)/categories/page-client.tsx` |
| Entradas no detalhe | Lista de categorias, gasto por categoria do cartão, notificação de orçamento | `src/components/categories/detail/` |
| Orçamento | Avaliado depois de cada despesa e de cada conta paga | edge `evaluate-budgets` |
| Botão direito | No cartão de categoria, o menu toma o lugar do menu do navegador sobre o link, por isso traz "Abrir em nova aba"; o ⋯ continua | `src/components/categories/category-card-context-menu.tsx` |

---

## 10. Conta e segurança

`/account` e subpáginas: o que é da pessoa, não da carteira.

```mermaid
%%{init: {"theme": "dark"}}%%
flowchart TD
    account["/account"] --> card(["Perfil: avatar, nome, email, membro desde"])
    account -->|"⋯ Editar perfil"| profile(["Nome e avatar"])
    profile -->|"enviar ou remover avatar, até 5 MB"| storage[("Storage avatars")]
    profile -->|"Salvar nome e avatar"| profileOk(["Perfil atualizado"])
    profile -->|"trocar email"| emailPwd{"Senha atual confere?"}
    emailPwd -->|"não"| profile
    emailPwd -->|"sim"| emailUpd[("updateUser email")] --> emailSent(["Link de confirmação enviado ao novo email"])
    profileOk --> log[("Edge activity-logs")]
    emailSent --> log

    account -->|"⋯ Alterar senha"| pwd(["Senha atual, nova, confirmação"])
    pwd --> pwdCheck{"Senha atual confere e nova é forte?"}
    pwdCheck -->|"não"| pwd
    pwdCheck -->|"sim"| pwdUpd[("updateUser password")] --> pwdOk(["Fecha em 2 s; outras sessões continuam"])
    pwdOk --> log

    account -->|"⋯ Sair"| G1(("G1 Sair"))
    account -->|"⋯ Excluir conta"| warn(["Aviso: carteiras compartilhadas que você é dona"])
    warn -->|"Continuar"| confirmDel(["Digitar email e senha"])
    confirmDel -->|"Excluir"| delUser[("Edge delete-user, confere a senha")]
    delUser -->|"erro"| confirmDel
    delUser -->|"sucesso"| gone(["Conta excluída; limpa caches e signOut"]) -->|"2 s"| root["/"] --> login(("G1 /login"))

    account -->|"Sessões"| sessions["/account/sessions"]
    sessions -->|"Encerrar ou Encerrar todas"| sessFn[("Edge sessions")]
    sessions -.->|"sem sessão"| plainLogin["/login sem next"]
    account -->|"Atividade"| activity["/account/activity"]
    activity -->|"filtros: todas, família, segurança, perfil"| activity
    activity -.->|"sem sessão"| plainLogin

    userMenu(("G3 Menu do usuário")) --> plans["/plans"]
    plans --> placeholder(["Plano padrão, histórico vazio; sem ações"])
```

### Regras técnicas

| Ponto | Regra | Onde |
|---|---|---|
| Troca de email e senha | Confere a senha atual entrando de novo antes de `updateUser` | `src/components/account/edit-profile-dialog.tsx`, `src/components/security/ChangePasswordDialog.tsx` |
| Excluir conta | Dois passos; a senha é conferida na Edge Function | `src/components/security/DeleteAccountDialog.tsx`, `src/lib/delete-account.ts` |
| Sessões | Listar e encerrar pela edge `sessions` | `src/lib/sessions.ts` |
| Atividade | Perfil, email e senha gravam log | edge `activity-logs` |

---

## 11. Lacunas encontradas

Coisas que o mapeamento achou no caminho. As de acesso foram corrigidas na
rodada de set/2026 e estão registradas abaixo da tabela; as que sobraram
continuam aqui para registro.

| # | Jornada | Lacuna |
|---|---|---|
| 1 | G2 | `/members` mostra o formulário de convite numa carteira pessoal, e o servidor recusa só depois do envio. |
| 2 | G3 | O provider global expõe abrir convite, mas nada chama essa função. (Nova categoria e novo cartão saem da paleta ⌘K desde 16/out/2026.) |
| 3 | G10 | `/account/sessions` e `/account/activity` redirecionam para `/login` sem `next`, então a pessoa não volta para a página depois de entrar. |
| 4 | G1 | A política de senha não vale para a troca de senha de dentro do app (`ChangePasswordDialog`), que ainda confere só o comprimento. |
| 5 | G8 | O detalhe de uma assinatura só abre pelo estado da tela; nenhum parâmetro de URL o abre (só existe `?new=1`). Por isso o toast de assinatura criada não tem "Ver", ao contrário de transação, cartão, conta e categoria (rodada 228). |
| 6 | G5 | Excluir uma transação é físico e sem volta: não há `deleted_at` nem RPC de restaurar, então o "Desfazer" do toast não substitui a confirmação. Ter o desfazer exige exclusão lógica no banco. |
| 7 | G2 | Os erros de carga do diretório de membros mostram ao usuário o arquivo SQL e a RPC a aplicar — texto de desenvolvedor (`members/page-client.tsx`). |

### Fechadas na rodada de acesso (set/2026)

| Era | Lacuna | O que fechou |
|---|---|---|
| 1 | "Confirme seu e-mail" aparecia mesmo quando o `signUp` voltava com sessão | A condição passou a ser só `data.session`, sem exigir `next` |
| 2 | `/login` e `/register` sem guarda para quem já entrou | `AuthSignedInRedirect`, com `/forgot-password`, `/reset-password` e `/invites/accept` isentas |
| 3 | Dois fluxos de redefinir senha que não se conversavam | Um formulário só, com duas portas de entrada |
| 4 | Erro de esqueci/redefinir senha em inglês | Tudo passa por `formatAuthErrorMessagePt` |
| 5 | `/invites/accept` cercada pela casca do app para quem não entrou | A rota foi para o grupo `(auth)` |

### Fechadas em 12/out/2026

| Era | Lacuna | O que fechou |
|---|---|---|
| 1 | O `next` se perdia na recuperação de senha | `recoveryLinks` o leva do pedido ao `redirectTo`, a "Pedir novo código" e ao login final |
| 2 | Sem como reenviar o código ou o e-mail de confirmação | "Reenviar código" e "Reenviar e-mail", com espera de 60 s |
| 3 | O fallback de carregamento do convite ficava fora do casco | Passou a vestir o `AuthShell` |

Risco conhecido: o `redirectTo` com `?next=` só funciona se a allowlist de
redirecionamento do Supabase, configurada fora do repositório, aceitar a query
string. Se recusar, o link cai na Site URL como antes.
