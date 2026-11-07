# Virada do banco para sa-east-1

Do projeto antigo `rpgveoalgxrlsfowvixe` (us-west-2) para o novo
`gexvgoknthcvdnqtdukq` (sa-east-1). Nenhum valor secreto vive aqui, só nomes.

**Antes (medido em 05/11/2026, do Brasil, conexão quente,
`GET /rest/v1/profiles?select=id&limit=1`):** antigo 427–871 ms, novo 159–197 ms.

## Variáveis do app

Só duas, na Vercel (Production e Preview) e no `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Também muda `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (push): o novo usa um par VAPID novo
(06/11/2026 — a chave privada do antigo não estava guardada). Opcional:
`NEXT_PUBLIC_PWA_ENABLED`. A chave anônima do novo é outra: pegue no
painel do novo projeto.

## 1. Antes (sem pressa)

- [ ] **Dono:** cadastrar no novo os secrets das Edge Functions: `GROQ_API_KEY`,
  `RESEND_API_KEY`, `RESEND_FROM` (domínio verificado no Resend),
  `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `VAPID_PUBLIC_KEY`,
  `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `APP_BASE_URL` e `CRON_SECRET`. Os VAPID
  são um **par novo** (gerado com `npx web-push generate-vapid-keys` em
  06/11/2026; a privada do antigo não estava guardada): as assinaturas de push
  já salvas deixam de valer, e cada pessoa ativa os avisos de novo depois da
  virada. Feito em 06/11/2026: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `GROQ_*`,
  `CLOUDFLARE_*` (testados) e `CRON_SECRET`; faltam `VAPID_SUBJECT` e os do
  e-mail (`RESEND_*`, `APP_BASE_URL`), que esperam o domínio do app. Conferir:
  `supabase secrets list --project-ref gexvgoknthcvdnqtdukq` mostra pelo menos
  estes nomes (o CLI só lista nomes).
  - `APP_BASE_URL` = a origem de produção (`https://<domínio de produção>`, sem
    barra no fim). Funções publicadas o leem: o link do convite
    (`workspace-invites-create` e `workspace-invites-resend`, por
    `_shared/workspace-invite-email.ts`, que sem ele responde 500) e o link das
    notificações (`_shared/deliver-notification.ts`, usado por
    `workspace-invites-accept`, `evaluate-budgets`, `evaluate-bills-reminders`,
    `evaluate-credit-card-alerts` e `credit-card-calendar-alerts`).
  - `CRON_SECRET`: as funções publicadas `evaluate-bills-reminders`,
    `run-recurring-billing`, `credit-card-calendar-alerts`, `attachments-cleanup`
    e `reativacao` o comparam com o cabeçalho `x-cron-secret`, e
    `_shared/service-auth.ts` (de `evaluate-budgets`, `evaluate-credit-card-alerts`
    e `notify-transaction-created`) também. Quem manda o cabeçalho é o cron, que o
    lê do Vault (`cron_secret`, em `invoke_edge_function`): **o secret tem de ser
    igual ao `cron_secret` do Vault do novo**, senão todo cron recebe 401.
    Conferir que o Vault tem o valor, sem imprimi-lo (SQL Editor do novo):
    `select (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret') is not null;`
    → `true`. A igualdade só o dono confere: no painel do novo, na página
    do Vault, revelar `cron_secret` e comparar com o valor que ele
    cadastrou como `CRON_SECRET` (o painel de Edge Function Secrets só mostra o
    digest; se não lembrar, cadastrar de novo com o valor do Vault). Não copiar o
    valor para chat, arquivo nem terminal com histórico.
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` o Supabase
    já injeta. `ASAAS_*` são lidos só pelas funções de cobrança, que não estão
    publicadas (Bloco 8); fora deste roteiro.
- [ ] **Claude ou dono:** conferir que o Vault do novo chama as funções do novo
  (SQL Editor do novo, devolve só um booleano):
  `select decrypted_secret like '%gexvgoknthcvdnqtdukq%' from vault.decrypted_secrets where name = 'edge_functions_url';`
  Conferir: `true` (era `true` em 05/11/2026).
- [ ] **Dono:** desligar os crons do novo, que já estão ativos (9 em 05/11/2026)
  e rodariam sobre uma cópia velha dos dados, mandando avisos e lembretes
  repetidos a quem também recebe os do antigo. No SQL Editor do **novo**:
  `select cron.alter_job(jobid, active := false) from cron.job where active;` — marca todos os jobs do `pg_cron` como
  inativos; não apaga nenhum, o agendamento continua lá. Conferir:
  `select count(*) filter (where active) from cron.job;` → `0`. (O `update cron.job` direto dá "permission denied": o `postgres` só muda job pelo `cron.alter_job`. Feito em 05/11/2026: 0 de 9 ativos.)
- [ ] **Dono:** Auth do novo, em Authentication › URL Configuration: **Site URL**
  = a origem de produção (é para onde vão os links de confirmação e de
  recuperação de senha sem `redirectTo`) e Redirect URLs
  `http://localhost:3000/**` e `<domínio de produção>/**`. Conferir: o painel
  mostra a Site URL de produção e lista as duas.
- [ ] **Dono:** igualar o resto do Auth ao antigo, que não viaja com esquema nem
  dados: SMTP próprio (Authentication › Emails › SMTP Settings), os modelos de
  e-mail (confirmação, convite, link mágico, troca de e-mail, recuperação) e os
  provedores ligados (Sign In / Providers). Conferir: lado a lado com o antigo,
  as três telas batem (a senha do SMTP se digita de novo, ela não aparece).
- [ ] **Dono:** remover a integração com o GitHub do projeto novo (Settings ›
  Integrations). Conferir: a lista de integrações fica vazia.
- [ ] **Claude ou dono:** medir os dois e anotar (chave em
  `SUPABASE_ANON_KEY`, a de cada projeto):
  `node scripts/medir-latencia.mjs https://rpgveoalgxrlsfowvixe.supabase.co`
  e
  `node scripts/medir-latencia.mjs https://gexvgoknthcvdnqtdukq.supabase.co`.
  Conferir: imprime mediana e p95; o novo fica perto de 160–200 ms.
- [ ] **Dono:** conferir que as 18 Edge Functions estão no novo
  (`bash scripts/migracao-sa-east-1-funcoes.sh` publica; `supabase functions list
  --project-ref gexvgoknthcvdnqtdukq` confere).
- [ ] **Dono:** ensaio da cópia dos dados, um dia antes da virada (com os crons
  do novo já desligados): `time bash scripts/migracao-sa-east-1-dados.sh`. O novo
  ainda não está em uso e o script dá o mesmo resultado a cada vez, então o
  ensaio não estraga nada. Conferir: termina com `pronto: as contagens batem` e
  código de saída 0, e anotar o tempo (é a janela da virada). Isso valida, antes
  do dia, o `session_replication_role = replica` pela API, o filtro do dump e a
  leitura do JSON do CLI. Feito em 06/11/2026: contagens batem, 3min55s.
- [ ] **Dono (só para as prévias da 2.0 e o dev):** o atalho do iPhone. O guia
  de Você › Lançar pelo iPhone baixa o arquivo versionado
  `public/atalho/Lançar gasto.shortcut`, com o host do Supabase gravado dentro.
  Deixar pronto para o passo 3: com `NEXT_PUBLIC_SUPABASE_URL` do novo, rodar
  `python3 scripts/atalho/gerar-atalho.py` (só no macOS: assina com o
  `shortcuts sign`). O `main` (produção) não tem código de atalho, captura nem IA
  (`git ls-tree -r --name-only main | grep -E "capture|atalho|mcp"` não acha
  nada), então este passo e os de atalho e IAs abaixo valem só para as prévias
  da 2.0 e o dev.

## 2. Na virada (uns 15 min, fora do horário de uso)

- [ ] **Dono:** avisar quem usa o app. Conferir: ninguém lança nada daqui até o fim.
- [ ] **Dono:** parar a escrita (não usar o app, nem o atalho do iPhone) **até o
  deploy novo estar no ar e conferido** (o último passo desta seção), e não só
  até o script acabar: o que for escrito pelo app velho nesse meio vai para o
  antigo e não volta.
- [ ] **Dono:** não rodar outro script do Supabase nem abrir outra sessão de CLI
  (outro terminal, outro agente) durante a virada: o script troca o projeto
  ligado (`supabase link`), e outra sessão pode religar o CLI no meio. O script
  confere o projeto ligado logo antes de apagar e para com `Ligado no projeto
  errado: nada foi apagado.`
- [ ] **Dono:** rodar `bash scripts/migracao-sa-east-1-dados.sh`. Precisa do
  Docker (`colima start`) para o `supabase db dump`. Ele apaga e recarrega
  `public` e todo o `auth` (menos `auth.schema_migrations`) no **novo**, só lê o
  antigo. Digitar `virar`. Conferir:
  termina com `pronto: as contagens batem` e código de saída 0; saída 1 é
  contagem diferente, **não seguir** — rodar de novo (dá o mesmo resultado).
- [ ] **Dono:** trocar os crons de lado, logo depois do script. No SQL Editor do
  **novo**: `select cron.alter_job(jobid, active := true) from cron.job;` (liga os 9 que o passo 1
  desligou). No SQL Editor do **antigo**: antes, anotar
  `select jobname from cron.job where active;` (é a lista que a volta atrás
  religa); depois, `select cron.alter_job(jobid, active := false) from cron.job where active;`. **Esta é uma escrita do
  dono no banco de produção**: só muda o `active` dos jobs, sem apagar nenhum.
  Conferir: `select count(*) filter (where active) from cron.job;` dá `9` no novo
  e `0` no antigo.
- [ ] **Dono:** trocar `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (a mesma
  pública do secret `VAPID_PUBLIC_KEY` do novo) pelos do novo na Vercel
  (Production e Preview) e no `.env.local`.
- [ ] **Dono:** refazer o deploy na Vercel. `touch` não basta: o Next lê as
  variáveis `NEXT_PUBLIC_*` no build. Conferir: a aba Network do app publicado
  chama `gexvgoknthcvdnqtdukq.supabase.co`.

## 3. Logo depois

- [ ] **Dono:** entrar de novo. As sessões do antigo não valem no novo; a senha
  vale. Conferir: login funciona.
- [ ] **Dono:** abrir Painel, Transações e Membros. Conferir: os números batem
  com o que se via antes.
- [ ] **Dono:** **atalho do iPhone.** A URL de captura é
  `<NEXT_PUBLIC_SUPABASE_URL>/functions/v1/capture` e fica gravada dentro do
  arquivo do atalho (`scripts/atalho/gerar-atalho.py` lê a variável). Os
  aparelhos conectados (tabela `capture_tokens`) vieram na cópia dos dados, mas o
  atalho instalado ainda aponta para o host antigo. Refazer: com
  `NEXT_PUBLIC_SUPABASE_URL` já no novo, gerar o atalho de novo
  (`python3 scripts/atalho/gerar-atalho.py`; sem a variável ele lê o
  `.env.local`) e reinstalar no iPhone, ou seguir o guia de Você › Lançar pelo
  iPhone. O arquivo que o guia baixa é o versionado em `public/atalho/`, então
  ele só traz o host novo depois de gerado (passo 1), commitado e publicado num
  deploy: só então reinstalar. Conferir: um lançamento pelo atalho aparece no app
  e no novo projeto. A Edge `capture` já está publicada no novo pelo script de
  funções. **O que for mandado pelo atalho velho depois da virada cai no banco
  antigo e se perde.** Vale só para as prévias da 2.0 e o dev (o `main` não tem
  atalho).
- [ ] **Dono:** **IAs conectadas.** A URL do MCP é
  `<NEXT_PUBLIC_SUPABASE_URL>/functions/v1/mcp` (`urlDoMcp`, mostrada no diálogo
  de conectar IA). Quem já conectou uma IA guardou a URL do host antigo:
  remover a conexão e conectar de novo, copiando a URL nova. **Atenção:** a Edge
  `mcp` não está entre as 18 publicadas (nem no antigo); enquanto não for
  publicada, não há IA conectada que funcione, e este passo só vale depois disso.
- [ ] **Claude ou dono:** medir de novo com `scripts/medir-latencia.mjs` apontando
  para o novo e anotar ao lado do "antes".

## 4. Volta atrás (se precisar)

- [ ] **Dono:** devolver as duas variáveis para o antigo na Vercel e no
  `.env.local` e refazer o deploy. Conferir: o app chama `rpgveoalgxrlsfowvixe`.
- [ ] **Dono:** trocar os crons de volta. No **antigo** (escrita do dono em
  produção): religar os jobs anotados na virada, por exemplo
  `select cron.alter_job(jobid, active := true) from cron.job where jobname in (<os anotados>);`. No
  **novo**: `select cron.alter_job(jobid, active := false) from cron.job where active;`. Conferir: a contagem de ativos
  volta à de antes no antigo e dá `0` no novo.
- [ ] **Dono:** o que foi escrito no novo depois da virada **não volta** sozinho.
  Anotar o que foi feito no novo para refazer no antigo. Atalho do iPhone e IAs
  voltam a precisar da URL do antigo.
- [ ] **Dono:** uma segunda virada depois de uma volta atrás roda o script de
  novo, que **apaga tudo o que foi escrito no novo** nesse meio e recopia do
  antigo. Antes dela, levar ao antigo o que precisar ficar.

## 5. Depois de uma semana estável

> Feito em 07/11/2026, antes da semana, a pedido do dono: virada e site publicado em sa-east-1, os 3 registros que caíram no antigo depois da recópia (Lentes, o parcelamento dele e Mercado) copiados para o novo, e o antigo **pausado** (vale por até 90 dias). Apagar depois de um mês.

- [ ] **Dono:** pausar o projeto antigo (não apagar).
- [ ] **Dono:** só apagar depois de mais um mês.

## 6. Fora deste roteiro, anotado para depois

- Políticas com `auth.uid()` solto (16) e índices de chave estrangeira faltando
  (4): sem ganho no volume de hoje.
- O front do `main` chama `dispatch-notifications` (categorias), que não está
  publicada em nenhum dos dois projetos (fica fora das 18). A chamada é
  disparar e esquecer (`void invokeEdgeJson`), então falha igual antes e depois:
  não é regressão da virada.
- A migração `20261103140000_mcp_guarda_rpc.sql` (o `db_pre_request` do token da
  IA) não está aplicada em nenhum dos dois projetos.
- O `scripts/publicar-link-de-convidado.sh` publica a migração do link de
  convite nos **dois** projetos; rode-o antes da virada se ainda não rodou, para
  o esquema dos dois ficar igual.
