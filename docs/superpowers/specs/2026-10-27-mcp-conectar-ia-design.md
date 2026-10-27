# MCP do Finance App — conectar os dados a Claude e ChatGPT

Data: 2026-10-27. O dono pediu um MCP para "conectar os dados do aplicativo a
uma inteligência artificial como o Claude ou o ChatGPT" e dispensou as
perguntas do brainstorm ("siga"). Tudo que não está nessa frase é **decisão
minha**, marcada como tal, para o dono revisar.

## Intenção

A pessoa abre o Claude (claude.ai, Desktop, Code) ou o ChatGPT, adiciona o
Finance App como conector colando **uma URL**, faz login com a conta do app,
aprova o acesso uma vez e passa a perguntar em linguagem natural: "quanto
gastei com mercado este mês?", "qual a fatura do Nubank?", "o que vence esta
semana?", "anota 42 reais de padaria no débito". A IA lê os dados **da
própria pessoa**, com as mesmas regras de acesso do app.

## Objetivos

1. Servidor MCP remoto (Streamable HTTP) que Claude e ChatGPT conectam só com
   a URL, sem token colado à mão.
2. Login pelo OAuth 2.1 do próprio Supabase Auth, com a tela de consentimento
   no app.
3. Toda chamada de ferramenta roda **como a pessoa** (JWT dela): o RLS decide o
   que ela vê; o convidado vê o que vê no app, e nada mais.
4. Ferramentas de leitura cobrindo as perguntas comuns e **uma** de escrita:
   registrar um lançamento.
5. A pessoa vê e revoga as IAs conectadas dentro do app.

## Não objetivos (v1)

- Editar ou excluir lançamentos, mexer em orçamento, cartão, conta, carteira,
  membros ou plano pela IA.
- Prompts/resources MCP, sampling, notificações do servidor.
- Domínio próprio para a URL do MCP (fica a URL do projeto Supabase).
- Cobrar à parte ou limitar por plano (ver "Decisões minhas").
- Mercado dos EUA / inglês (o estudo está guardado; ferramentas falam
  português).

## Antiobjetivos (falha mesmo se "funcionar")

- Qualquer caminho de ferramenta usar a `service_role` e furar o RLS.
- A IA apagar ou alterar dado que já existe.
- Um lançamento criado pela IA ficar indistinguível de um feito à mão.
- Mexer na configuração de produção do Auth por `supabase config push`
  (sobrescreveria Site URL, redirects e provedores).
- Publicar/deployar em produção sem o dono pedir (regra da memória do projeto).

## Como funciona (decidido)

### Peças

| Peça | Onde |
| --- | --- |
| Edge Function `mcp` | `supabase/functions/mcp/index.ts` |
| Lógica pura das ferramentas (testável) | `supabase/functions/_shared/mcp/*.ts` + `*.test.ts` |
| Tela de consentimento | rota `src/app/(app)/oauth/consent/` + wireframe |
| "IAs conectadas" (listar, revogar, URL e instruções) | página Minha conta, ao lado do `CapturaTokensWireframe` |
| Migração | `source = 'ia_externa'` aceito em `transactions_source_check` |
| Roteiro de publicação | `supabase/MCP_DEPLOYMENT.md` |

### Servidor

- Segue o guia oficial "Deploy MCP servers" do Supabase
  (supabase.com/docs/guides/ai-tools/byo-mcp): `createMcpHandler` +
  `McpServer` de `npm:@modelcontextprotocol/server@^2`, dentro de
  `pipeline([withOAuthProtectedResource(), withSupabase({ auth: 'user' })], …)`
  de `npm:@supabase/middleware@1` e `npm:@supabase/server@^1.6`, `zod@4` nos
  esquemas. Um `McpServer` novo por requisição (função sem estado).
- `[functions.mcp] verify_jwt = false` em `supabase/config.toml` (a descoberta
  OAuth chega sem token; quem confere é o `withSupabase`).
- O projeto já assina JWT em **ES256** (o JWKS público responde uma chave EC),
  requisito do `withSupabase`. Conferido em 2026-10-27.
- O servidor OAuth do Auth está **desligado** em produção hoje
  (`/.well-known/oauth-authorization-server` → `feature_disabled`). Ligá-lo é
  passo do dono no painel (ver Publicação).

### Ferramentas

Todas recebem/retornam português, valores em reais como número (`numeric`,
duas casas) **e** a string formatada BRL. Datas `YYYY-MM-DD`; mês `YYYY-MM`.
Resposta: `structuredContent` com o objeto + `content` texto com o mesmo JSON.
Leitura leva `annotations.readOnlyHint: true`. Quando a pessoa tem mais de uma
carteira e não passa `carteira_id`, a ferramenta usa a carteira pessoal (ou a
primeira) e diz qual usou.

| Ferramenta | O que devolve | Fonte |
| --- | --- | --- |
| `listar_carteiras` | id, nome, tipo, papel da pessoa | `workspace_members` + `workspaces` |
| `listar_categorias` | id, nome, tipo | `categories` |
| `listar_lancamentos` | filtros: período (padrão mês atual), tipo, categoria, cartão, texto na descrição, `limite` ≤ 100 (padrão 50) | `transactions` |
| `resumo_do_mes` | receitas, despesas, saldo, despesa por categoria (ordenada), comparação com o mês anterior | `transactions`, com o sinal de estorno de `_shared/credit-card-cycle.ts` |
| `orcamentos_do_mes` | por categoria: orçado, gasto, % | `budgets` + `transactions` |
| `faturas_dos_cartoes` | por cartão ativo: fatura aberta (janela, total, vencimento) e a última fechada | helpers de ciclo de `_shared/credit-card-cycle.ts` (`invoiceWindowEndingAt`, `cardInvoiceNetInWindow`, `escolherTotal` com `credit_card_statement_totals`) |
| `contas_a_pagar` | `bill_instances` vencidas e dos próximos N dias (padrão 30), com status | `bills` + `bill_instances` |
| `assinaturas` | ativas, valor, próxima cobrança, total mensal | `workspace_subscriptions` |
| `registrar_lancamento` | cria um lançamento | ver abaixo |

O cálculo (somas, agrupamentos, sinais, janelas de fatura, formatação) mora em
`_shared/mcp/` como funções puras com testes Deno; o `index.ts` só consulta e
chama.

### `registrar_lancamento`

- Entrada: **só campos** (`valor`, `descricao`, `tipo`, `data`, `categoria`,
  `cartao`, `forma_de_pagamento`, `parcelas`), mais `carteira_id` opcional.
  Sem frase livre e sem Groq: quem chama já é uma IA e manda os campos
  separados (decisão minha; evita a cota e o cliente admin do `interpretar`).
- Reaproveita as peças puras de `_shared/captura.ts` / `_shared/frase.ts`
  (`casarCartao`, `preencherPeloHistorico`, `normalizarDescricao`) para casar
  cartão e sugerir categoria pelo nome/histórico, montando o contexto com o
  cliente **da pessoa** (RLS), nunca o admin.
- Grava com `source = 'ia_externa'`, **`needs_review = true`** (entra na
  conferência do Bloco 9) e `capture_meta = { "via": "mcp", "client_id":
  <claim client_id do JWT> }`, para a conferência poder dizer quem lançou.
- **Parcelado** usa a mesma RPC do formulário do app,
  `create_workspace_installment_plan` (chamável por `authenticated`, RLS), e
  não `criar_plano_parcelado` (só `service_role`). As parcelas seguem o
  comportamento do formulário (decisão minha: o plano parcelado não ganha
  `needs_review`).
- Efeitos depois de salvar: os mesmos que o formulário do app dispara com o
  JWT da pessoa (o trigger `transactions_notify_created` vale para qualquer
  insert). Os avaliadores que a captura chama com `service_role` **não** são
  chamados pelo MCP; quem constrói confere em `src/lib/transactions/` se o
  app chama algum avaliador com o JWT do usuário e repete só esse.
- Devolve o resumo (`resumoDoLancamento`) e o id. A escrita bloqueada pelo
  plano (`garantir_escrita` → `workspace_somente_leitura`) vira mensagem clara
  ("sua carteira está só leitura no plano atual"), não erro cru.
- Sem idempotência por `client_id` na v1 (a IA chama uma vez por pedido; o
  `needs_review` cobre o engano).

### Consentimento (`/oauth/consent`)

- Rota dentro de `(app)`, então o `AuthGuard` já leva quem não está logado ao
  login com `next` preservando `?authorization_id=…` (conferido em
  `src/components/layout/auth-guard.tsx:34`).
- Chama `supabase.auth.oauth.getAuthorizationDetails(id)`. Se a resposta já
  traz `redirect_url` (cliente aprovado antes), redireciona direto.
- Mostra: nome do cliente (ex.: "Claude"), o que ele poderá fazer ("ler seus
  lançamentos, cartões, contas e orçamentos de todas as carteiras em que você
  participa; registrar lançamentos que ficam para você conferir"), conta
  logada, e dois botões: **Permitir** (`approveAuthorization`) e **Recusar**
  (`denyAuthorization`); segue o `redirect_url` devolvido.
- É funcionalidade nova → **wireframe** (`src/components/wireframe/mcp-consentimento-wireframe.tsx`),
  regra do `AGENTS.md`.

### IAs conectadas (Minha conta)

- Wireframe `src/components/wireframe/ias-conectadas-wireframe.tsx`, montado
  em `src/app/(app)/account/page-client.tsx` ao lado do `CapturaTokensWireframe`.
- Lista `supabase.auth.oauth.listGrants()` (cliente, desde quando) e revoga
  com `revokeGrant()` com confirmação.
- Mostra a URL do MCP (`${NEXT_PUBLIC_SUPABASE_URL}/functions/v1/mcp`) com
  copiar, e três linhas de instrução: Claude (Configurações › Conectores ›
  Adicionar conector personalizado), ChatGPT (Configurações › Conectores, com
  modo desenvolvedor), Claude Code (`claude mcp add --transport http
  finance-app <url>`).

### Jornada

Rota nova e fluxo novo = mudança de jornada: nova jornada "Conectar uma IA" em
`docs/JORNADAS.md`, a mesma no `docs/atlas/template.html`, `python3
docs/atlas/build.py` e republicar o Atlas no mesmo URL.

## Publicação (passos do dono, documentados em `supabase/MCP_DEPLOYMENT.md`)

1. Painel › Authentication › OAuth Server: ligar; Authorization Path
   `/oauth/consent`; ligar Dynamic Client Registration.
2. Conferir Site URL = origem de produção do app (o consentimento mora lá).
3. `supabase db push` da migração do `source`.
4. `supabase functions deploy mcp` (e acrescentar `mcp` ao
   `supabase:deploy:functions` do `package.json`).
5. Deploy do front (rota de consentimento e Minha conta).
6. Teste: `curl` da URL sem token → 401 com `WWW-Authenticate`; conectar no
   Claude e no ChatGPT.

Nada disso roda sem o dono pedir. **Não** usar `supabase config push`.
Localmente, `config.toml` ganha só `[functions.mcp]`; o bloco
`[auth.oauth_server]` local fica no roteiro, não no arquivo (o projeto roda o
CLI sem Docker, então não há stack local para testar o fluxo OAuth).

## Restrições

- Edge Functions em Deno, imports por URL como o resto (`npm:` aqui, como o
  guia oficial; o resto do repo usa `esm.sh` para o supabase-js — o
  `withSupabase` traz o próprio cliente).
- Testes: `npm run test:edge` cobre `_shared` (a lógica de `_shared/mcp/`
  entra lá); `deno check supabase/functions/mcp/index.ts`.
- Front: `npx tsc --noEmit && npm run lint && npm run test:unit`;
  `form-submit-owner.test.ts` vale para os wireframes (botões com `type`).
- Banco de dev é o de produção (memória): nenhum teste grava dado real.

## Decisões minhas (para o dono conferir)

1. Supabase Auth como servidor OAuth + Edge Function, e não rota Next.js nem
   token colado (Claude.ai e ChatGPT exigem OAuth para conector remoto).
2. Ler é liberado em qualquer plano; escrever segue o trigger de plano que já
   existe. Nenhum bloqueio extra por plano.
3. Uma escrita só (`registrar_lancamento`), sempre com `needs_review = true`
   e `source = 'ia_externa'`.
4. O acesso cobre todas as carteiras em que a pessoa participa, sem escolher
   carteira no consentimento.
5. Consentimento dentro de `(app)` e lista de IAs conectadas em Minha conta,
   ambos como wireframe.
6. URL do MCP é a do projeto Supabase (`…supabase.co/functions/v1/mcp`).
7. `registrar_lancamento` recebe só campos (sem frase livre, sem Groq) e
   parcela pela RPC do formulário do app.
8. "Pronto" neste bloco = testes Deno da lógica, `deno check` da função,
   `tsc`/`lint`/`test:unit` do front e o roteiro de publicação. O fluxo OAuth
   real só roda depois que o dono ligar o OAuth Server e autorizar o deploy
   (não há stack local nem banco de teste).

## Para quem constrói decidir

- Nomes e textos exatos das descrições das ferramentas (curtos, em português,
  dizendo quando usar).
- Forma interna dos módulos em `_shared/mcp/`.
- Como achar a "carteira padrão" (tipo `personal` primeiro).
