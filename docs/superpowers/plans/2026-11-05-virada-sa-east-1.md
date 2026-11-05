# Virada para sa-east-1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deixar pronta, medida e reversível a troca do banco do app do projeto antigo (`rpgveoalgxrlsfowvixe`, us-west-2) para o novo (`gexvgoknthcvdnqtdukq`, sa-east-1), que responde em ~3× menos tempo.

**Architecture:** Três peças no repositório: um medidor de latência que roda contra os dois projetos (antes e depois), um script que recopia os dados do antigo para o novo na hora da virada e confere as contagens, e o roteiro da virada (passos do dono, verificação e volta). A virada em si — trocar as variáveis do app publicado e do `.env.local` — é do dono, com o roteiro.

**Tech Stack:** Node (scripts `.mjs`, como os de `scripts/`), Supabase CLI 2.121 (`link`, `db dump`, `db query`), bash, vitest.

**Spec:** pedido do dono em 05/11/2026: "um planejamento detalhado para melhorar a performance e o tempo de resposta do banco de dados. Talvez falte terminar a migração ou alguma outra coisa." Ele pulou as perguntas. Levantamento do controlador, no mesmo dia:
- Conexão aquecida, do Brasil, `GET /rest/v1/profiles?select=id&limit=1`: antigo 427–871 ms, novo 159–197 ms.
- Esquema igual nos dois (funções, tabelas, políticas, gatilhos e cron comparados: 298 itens, só o `rolconfig` do `authenticator` difere por `supautils`). Storage vazio nos dois.
- Dados pequenos (613 transações, 309 sessões). Políticas com `auth.uid()` solto (16) e índices de FK faltando (4) não pesam nesse volume: **fora do plano** (decisão do controlador).
- Já feito no novo: esquema, dados de antes, usuários do auth, gatilhos, cron, vault, `CRON_SECRET`, as 18 Edge Functions.

## Global Constraints

- O banco antigo é produção e é só **lido** pelos scripts. Toda escrita é no projeto novo, e só no script de dados (Task 2), que o **dono** roda.
- Nenhuma credencial em arquivo versionado nem em saída de script: a chave `anon` vem de variável de ambiente ou de `supabase projects api-keys -o json` lida em memória; a de serviço nunca é lida.
- Os scripts deixam o projeto ligado (`supabase/.temp/project-ref`) como estava antes de rodar.
- Commits só com os arquivos da tarefa (`git add <arquivos>`, nunca `-A`); trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sem `git stash`. Depois de código, `graphify update .` (sem commitar o grafo).
- Textos e comentários em português.

## Review Focus

1. O script de dados roda com o link apontando para o antigo e para no meio → ele precisa religar o projeto original mesmo com erro (`trap`). Teste de fonte na Task 2.
2. A recópia apaga no novo um dado que só existe no novo (escrito por quem já usava o novo) → o roteiro manda congelar a escrita antes, e o script avisa e pede confirmação digitada (`virar`). Teste de fonte na Task 2.
3. Contagens diferentes depois da carga → o script sai com código ≠ 0 e lista as tabelas. Teste do comparador na Task 2.
4. Medidor com um pedido que falha (rede, 401) → conta como falha, não entra na mediana, e o resumo mostra quantas falharam. Teste na Task 1.
5. Volta atrás depois da virada (o novo deu problema) → o roteiro tem a volta, e ela diz o que se perde (o que foi escrito no novo). Task 3.

---

### Task 1: O medidor de latência

**Files:**
- Create: `scripts/medir-latencia.mjs`
- Create: `scripts/lib/latencia.mjs` (as contas, puras)
- Test: `src/test/latencia.test.ts` (o vitest só lê `src/**/*.test.ts`; importa `../../scripts/lib/latencia.mjs`, como `src/test/sem-comentarios-scripts.test.ts`)

**Interfaces:**
- Produces: `export function resumo(amostras: Array<number | null>): { n: number; falhas: number; mediana: number | null; p95: number | null; min: number | null; max: number | null }` — `null` é falha; os números em ms, arredondados.
- CLI: `node scripts/medir-latencia.mjs <url-do-projeto> [vezes=20]`, chave em `SUPABASE_ANON_KEY` (ou `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Faz um pedido de aquecimento descartado e depois `vezes` pedidos em série a `/rest/v1/profiles?select=id&limit=1` com `fetch` (o `keep-alive` do Node), mede cada um com `performance.now()` e imprime uma linha: `<host> n=<n> falhas=<f> mediana=<ms> p95=<ms> min=<ms> max=<ms>`.

- [ ] **Step 1: Testes que falham** — `resumo([100, 200, 300])` → `{ n: 3, falhas: 0, mediana: 200, p95: 300, min: 100, max: 300 }`; `resumo([100, null, 300, 200])` → `falhas: 1`, `n: 4`, `mediana: 200`; `resumo([null])` → `mediana: null, p95: null, min: null, max: null, falhas: 1`; p95 por índice `ceil(0.95·k) − 1` sobre as `k` amostras ordenadas.
- [ ] **Step 2:** rodar o teste → FAIL.
- [ ] **Step 3:** implementar `resumo` e o CLI. Sem dependência nova.
- [ ] **Step 4:** teste passa; `node scripts/medir-latencia.mjs https://gexvgoknthcvdnqtdukq.supabase.co 5` sem chave sai com código 1 e a frase "Defina SUPABASE_ANON_KEY".
- [ ] **Step 5: Commit** — `chore(scripts): medidor de latência do Supabase`.

### Task 2: A recópia dos dados na hora da virada

**Files:**
- Create: `scripts/migracao-sa-east-1-dados.sh`
- Create: `scripts/lib/contagens.mjs` (compara contagens, puro)
- Test: `src/test/contagens.test.ts` e `src/test/migracao-sa-east-1-dados.test.ts` (teste de fonte do script, com `readFileSync`)

**Interfaces:**
- Produces: `export function compararContagens(antigo: Record<string, number>, novo: Record<string, number>): string[]` — as tabelas cuja contagem difere ou que faltam de um lado, em ordem alfabética, no formato `"<tabela>: antigo=<a> novo=<b>"` (lado que falta = `-`).
- O script, nesta ordem:
  1. Guarda o projeto ligado e arma `trap` para religá-lo na saída (sucesso ou erro).
  2. Explica em 3 linhas o que vai fazer, avisa que **apaga e recarrega** `public` e `auth` (usuários) no novo, e só segue se a pessoa digitar `virar`.
  3. Liga o antigo e faz `supabase db dump --linked --data-only --use-copy -s public,auth -f <tmp>/dados.sql` (pasta temporária `mktemp -d`, apagada no fim pelo `trap`). Se o `db dump` precisar do Docker (Colima), diz isso e para.
  4. Lê as contagens do antigo (`select relname, n_live_tup` não serve: use `count(*)` por tabela de `public` e de `auth.users`, montado por uma consulta que gera o SQL) para `<tmp>/antigo.json`.
  5. Liga o novo e roda num arquivo só: `set session_replication_role = replica;` + `truncate` de todas as tabelas de `public` e de `auth.users`, `auth.identities`, `auth.sessions`, `auth.refresh_tokens`, `auth.mfa_factors` com `cascade` + o conteúdo do dump + `set session_replication_role = origin;`, via `supabase db query --linked -f`.
  6. Lê as contagens do novo, compara com `node scripts/lib/contagens.mjs <antigo.json> <novo.json>` (o módulo também é CLI) e sai com 1 se houver diferença, listando-a.
- Não mexe em `storage`, `vault`, `cron`, `supabase_migrations` (já estão certos no novo).

- [ ] **Step 1: Testes que falham** — `compararContagens({a:1,b:2},{a:1,b:3})` → `["b: antigo=2 novo=3"]`; tabela só no antigo → `"c: antigo=4 novo=-"`; iguais → `[]`. Teste de fonte do script: contém `trap`, `read`, `virar`, `--data-only`, `session_replication_role = replica`, `rpgveoalgxrlsfowvixe`, `gexvgoknthcvdnqtdukq`, e **não** contém `SERVICE_ROLE`, `db push` nem `--project-ref rpgveoalgxrlsfowvixe` seguido de `query` com `truncate` (a escrita só acontece com o novo ligado: o `truncate` aparece depois do `link --project-ref gexvgoknthcvdnqtdukq`).
- [ ] **Step 2:** rodar → FAIL.
- [ ] **Step 3:** implementar. `bash -n scripts/migracao-sa-east-1-dados.sh` limpo. **Não rodar o script** (escreve no novo e lê produção; quem roda é o dono).
- [ ] **Step 4:** testes passam.
- [ ] **Step 5: Commit** — `chore(scripts): recópia dos dados para sa-east-1 com conferência`.

### Task 3: O roteiro da virada

**Files:**
- Create: `docs/operacao/virada-sa-east-1.md`

Conteúdo, nesta ordem, em listas de verificação (`- [ ]`), cada passo dizendo **quem** faz (dono ou Claude) e **como conferir**:
1. **Antes (sem pressa):** secrets das Edge Functions no novo (`GROQ_API_KEY`, `RESEND_API_KEY`, `RESEND_FROM` com domínio verificado, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` — os VAPID iguais aos do antigo, senão os avisos do celular param); conferir com `supabase secrets list --project-ref gexvgoknthcvdnqtdukq` (só os nomes). Redirect URLs do Auth no novo (`http://localhost:3000/**` e o domínio de produção `/**`). Integração com o GitHub removida do projeto novo. Medir com `node scripts/medir-latencia.mjs` os dois projetos e anotar.
2. **Na virada (uns 15 min, fora do horário de uso):** avisar quem usa; parar a escrita (não usar o app); `bash scripts/migracao-sa-east-1-dados.sh` (digitar `virar`; sair com 0); trocar `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` na Vercel (Production e Preview) e no `.env.local`, e refazer o deploy; `touch` não basta: o Next lê as variáveis no build.
3. **Logo depois:** entrar de novo (as sessões do antigo não valem no novo; a senha vale); conferir Painel, Transações, Membros; publicar de novo a Edge `capture` se o atalho do iPhone mudar de URL e refazer o atalho (a URL tem o host do projeto); reconectar as IAs (o MCP aponta para o host do projeto); medir de novo e anotar.
4. **Volta atrás (se precisar):** devolver as duas variáveis para o antigo na Vercel e no `.env.local` e refazer o deploy. O que foi escrito no novo depois da virada **não volta** sozinho: anotar o que foi feito no novo para refazer no antigo.
5. **Depois de uma semana estável:** pausar o projeto antigo (não apagar), e só apagar depois de mais um mês.
6. **Fora deste roteiro, anotado para depois:** políticas com `auth.uid()` solto (16) e índices de FK faltando (4) — sem ganho no volume de hoje; a migração `20261103140000_mcp_guarda_rpc.sql` (o `db_pre_request` do token da IA) não está aplicada em nenhum dos dois projetos.

- [ ] **Step 1:** escrever o documento; conferir que todo comando citado existe no repositório (`ls scripts/…`) e que os nomes dos secrets batem com `supabase/functions/**` (`grep -rho "Deno.env.get('[A-Z_]*')" supabase/functions | sort -u`).
- [ ] **Step 2: Commit** — `docs(operacao): roteiro da virada para sa-east-1`.

### Fora das tarefas (controlador, com o dono)

A virada em si (passos 1 a 3 do roteiro) muda o app publicado e é feita pelo dono, com o controlador acompanhando e medindo. O controlador para e pede o ok antes.
