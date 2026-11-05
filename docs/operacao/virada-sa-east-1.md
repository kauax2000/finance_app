# Virada do banco para sa-east-1

Do projeto antigo `rpgveoalgxrlsfowvixe` (us-west-2) para o novo
`gexvgoknthcvdnqtdukq` (sa-east-1). Nenhum valor secreto vive aqui, só nomes.

**Antes (medido em 05/11/2026, do Brasil, conexão quente,
`GET /rest/v1/profiles?select=id&limit=1`):** antigo 427–871 ms, novo 159–197 ms.

## Variáveis do app

Só duas, na Vercel (Production e Preview) e no `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Opcionais: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (push; **não muda**, a chave VAPID é a
mesma) e `NEXT_PUBLIC_PWA_ENABLED`. A chave anônima do novo é outra: pegue no
painel do novo projeto.

## 1. Antes (sem pressa)

- [ ] **Dono:** cadastrar no novo os secrets das Edge Functions: `GROQ_API_KEY`,
  `RESEND_API_KEY`, `RESEND_FROM` (domínio verificado no Resend),
  `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `VAPID_PUBLIC_KEY`,
  `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`. Os três VAPID **iguais aos do antigo**,
  senão as assinaturas de push já salvas deixam de valer e os avisos do celular
  param. Conferir: `supabase secrets list --project-ref gexvgoknthcvdnqtdukq`
  mostra os oito nomes (o CLI só lista nomes).
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` o Supabase
    já injeta. `APP_BASE_URL`, `CRON_SECRET` e `ASAAS_*` são lidos no código, mas
    pertencem às funções que não estão publicadas (cobrança, Bloco 8); fora deste
    roteiro.
- [ ] **Dono:** Auth do novo, em Authentication › URL Configuration, Redirect
  URLs: `http://localhost:3000/**` e `<domínio de produção>/**`. Conferir: o
  painel lista as duas.
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

## 2. Na virada (uns 15 min, fora do horário de uso)

- [ ] **Dono:** avisar quem usa o app. Conferir: ninguém lança nada daqui até o fim.
- [ ] **Dono:** parar a escrita (não usar o app, nem o atalho do iPhone).
- [ ] **Dono:** rodar `bash scripts/migracao-sa-east-1-dados.sh`. Precisa do
  Docker (`colima start`) para o `supabase db dump`. Ele apaga e recarrega
  `public` e `auth` no **novo**, só lê o antigo. Digitar `virar`. Conferir:
  termina com `pronto: as contagens batem` e código de saída 0; saída 1 é
  contagem diferente, **não seguir** — rodar de novo (dá o mesmo resultado).
- [ ] **Dono:** trocar `NEXT_PUBLIC_SUPABASE_URL` e
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` pelos do novo na Vercel (Production e Preview)
  e no `.env.local`.
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
  iPhone. Conferir: um lançamento pelo atalho aparece no app e no novo projeto.
  A Edge `capture` já está publicada no novo pelo script de funções.
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
- [ ] **Dono:** o que foi escrito no novo depois da virada **não volta** sozinho.
  Anotar o que foi feito no novo para refazer no antigo. Atalho do iPhone e IAs
  voltam a precisar da URL do antigo.

## 5. Depois de uma semana estável

- [ ] **Dono:** pausar o projeto antigo (não apagar).
- [ ] **Dono:** só apagar depois de mais um mês.

## 6. Fora deste roteiro, anotado para depois

- Políticas com `auth.uid()` solto (16) e índices de chave estrangeira faltando
  (4): sem ganho no volume de hoje.
- A migração `20261103140000_mcp_guarda_rpc.sql` (o `db_pre_request` do token da
  IA) não está aplicada em nenhum dos dois projetos.
- O `scripts/publicar-link-de-convidado.sh` publica a migração do link de
  convite nos **dois** projetos; rode-o antes da virada se ainda não rodou, para
  o esquema dos dois ficar igual.
