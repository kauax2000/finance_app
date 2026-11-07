# Publicar o MCP: conectar uma IA

Reúne o que o MCP (`docs/superpowers/specs/2026-10-27-mcp-conectar-ia-design.md`)
pôs no repositório:

- a Edge `mcp` (`supabase/functions/mcp/index.ts`), em
  `https://<ref>.supabase.co/functions/v1/mcp`, com `[functions.mcp]
  verify_jwt = false` no `config.toml` (a descoberta OAuth chega sem token; quem
  confere o token é o `withSupabase`). Sem token, responde 401 com
  `www-authenticate: Bearer resource_metadata=".../functions/v1/mcp/oauth-protected-resource"`;
- as oito ferramentas de leitura (`listar_carteiras`, `listar_categorias`,
  `listar_lancamentos`, `resumo_do_mes`, `orcamentos_do_mes`,
  `faturas_dos_cartoes`, `contas_a_pagar` e `assinaturas`) e a única escrita,
  `registrar_lancamento`: insere em `transactions` com `source = 'ia_externa'`,
  `needs_review = true` e `capture_meta = { via: 'mcp', client_id }`; o
  parcelado passa pela RPC `create_workspace_installment_plan`, que recebe os
  três e os grava nas parcelas; depois de uma despesa chama `evaluate-budgets` e
  `evaluate-credit-card-alerts` com o JWT da pessoa, como o formulário do app;
- a migração `20261103120000_mcp.sql`, que só acrescenta `ia_externa` ao check
  de `transactions.source`;
- a migração `20261103130000_mcp_token_somente_leitura.sql`, que deixa o token
  da IA só ler e inserir lançamento (§1a), e o `getAuthUserFromJwt`
  (`_shared/auth-user.ts`) recusando esse token nas Edges de usuário;
- a migração `20261103140000_mcp_guarda_rpc.sql`, a guarda
  `guarda_do_token_de_ia` que o PostgREST roda antes de toda requisição
  (`db_pre_request`): para o token da IA, só a RPC do parcelado e nenhum
  PATCH, PUT ou DELETE;
- no front do 2.0: a rota `/oauth/consent` (consentimento, em
  `src/app/(app)/oauth/consent/`, wireframe `mcp-consentimento-wireframe.tsx`) e
  a seção "IAs conectadas" de Configurações (no telefone, `/settings/ias`; wireframe
  `ias-conectadas-wireframe.tsx`: a URL do MCP com copiar, as instruções,
  `listGrants` e `revokeGrant`);
- a ponte: o lançamento da IA entra na conferência do Bloco 9 por causa do
  `needs_review`.

**Estado em 07/11/2026: o back está publicado no projeto de sa-east-1** (as três migrações do MCP e a Edge `mcp`, por `scripts/publicar-mcp.sh`; a URL responde 401 com `www-authenticate`). **Falta o servidor OAuth no painel (§2)**, e a rota `/oauth/consent` só chega com o 2.0. Em 27/10/2026: nada publicado. O front do `finance-app-2.0` também
não: ele só vai para `main`, e para produção, quando os blocos planejados
estiverem prontos (decisão do dono). **O banco de desenvolvimento é o de
produção:** nada deste roteiro roda sem o pedido explícito do dono.

**O fluxo OAuth nunca rodou de verdade.** Não há stack local (a CLI roda sem
Docker nesta máquina) nem banco de teste, então só os testes de lógica
(`npm run test:edge`) e o `deno check` passaram. Tudo o que depende do Auth
real está na lista do §5 e é conferido na hora da publicação.

**Nunca rode `supabase config push`.** Ele reescreve a configuração inteira do
projeto de produção a partir do `config.toml` local (que não tem o bloco
`[auth.oauth_server]`) e pode desfazer ajustes feitos no painel. O servidor
OAuth se liga **só pelo painel** (§2). O `config.toml` local ganhou apenas o
`[functions.mcp]`.

Faça na ordem. O marcador é `<ref>` (o identificador do projeto, o mesmo da URL
do Supabase). **Nunca** salve no repositório um id, uma chave, uma URL de
projeto, o SQL preenchido ou o resultado de uma conferência: o repositório é
público.

## 0. Pré-requisitos

- **A CLI** do Homebrew, 2.121 ou mais nova, com o projeto ligado
  (`supabase link`, uma vez só). Sem Docker nesta máquina, as funções sobem pela
  API (`--use-api`).
- **O JWT em ES256.** O `withSupabase` exige a chave assimétrica. O projeto já
  assina em ES256 (o JWKS público responde uma chave EC, conferido em
  2026-10-27): nada a fazer, só reconferir se o projeto tiver mudado.
- **O OAuth Server está desligado hoje.**
  `/auth/v1/.well-known/oauth-authorization-server` responde `feature_disabled`.
  É o §2 que o liga.
- **Antes de publicar, localmente:**

  ```bash
  deno check --node-modules-dir=none supabase/functions/mcp/index.ts
  npm run test:edge
  npx tsc --noEmit && npm run lint && npm run test:unit
  ```

  Os três passam no repositório. O `--node-modules-dir=none` evita que o Deno
  procure o `node_modules` do Next.

## 1. As migrações

A primeira só acrescenta `ia_externa` ao check de `source`. A segunda põe as
políticas `ia_somente_leitura_*` e troca a assinatura do
`create_workspace_installment_plan` (9 argumentos → 12, os três novos com
`default`). As duas são compatíveis com o front de `main`: ele não escreve
`ia_externa`, a sessão do app não tem `client_id`, e a chamada dele à RPC (por
nome, com os 9) cai na nova.

```bash
supabase db push
```

Aplica `20261103120000_mcp.sql`, `20261103130000_mcp_token_somente_leitura.sql`
e `20261103140000_mcp_guarda_rpc.sql` (e qualquer migração anterior ainda
pendente, em ordem: confira `supabase migration list` antes). **O SQL da
segunda e da terceira nunca rodou**: sem banco
de teste, foi conferido só lendo. Conferência no SQL Editor:

```sql
select pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.transactions'::regclass
  and conname like '%source%';
```

Esperado: a lista de origens inclui `'ia_externa'`. Não salve o resultado no
repositório.

```sql
select tablename, policyname, cmd
from pg_policies
where policyname like 'ia_%'
order by tablename, cmd;

select pg_get_function_identity_arguments('public.create_workspace_installment_plan'::regproc);
```

Esperado: 74 políticas `ia_somente_leitura_*` em `public` (25 tabelas × 3, menos
o insert de `transactions`), `ia_lancamento_marcado` em `transactions`, as três
de `storage.objects`; e a RPC com 12 argumentos, terminando em
`p_source text, p_needs_review boolean, p_capture_meta jsonb`. Depois, crie um
parcelado pelo app (sessão normal) e confira que ele entra com `source = 'app'`.

## 1a. O que o token da IA pode

O token OAuth que o Auth emite para a IA é um JWT da pessoa com a claim
`client_id`. Com a chave anônima, ele chega ao `/rest/v1` e às Edges como a
própria pessoa. O que o fecha:

- **Lê** o que a pessoa lê (o RLS de sempre).
- **Insere só lançamento**: `transactions`, e só marcado (`source =
  'ia_externa'` e `needs_review`, política `ia_lancamento_marcado`); o
  parcelado pela RPC, que força a marca quando o token é de IA.
- **Não altera nem apaga** nada: políticas `as restrictive`
  `ia_somente_leitura_insert|update|delete` (para `authenticated`, com
  `public.eh_token_de_ia()`) em toda tabela de `public` com política de
  escrita, e em `storage.objects`.
- **As Edges de usuário recusam** o token (`getAuthUserFromJwt` devolve
  `token_de_ia` → 401), menos `evaluate-budgets` e `evaluate-credit-card-alerts`,
  que o MCP chama depois de lançar (`permitirTokenDeIA: true`). Para valer, toda
  Edge que importa `_shared/auth-user.ts` sobe de novo: `activity-logs`,
  `billing-cancel`, `billing-checkout`, `delete-user`, `evaluate-budgets`,
  `evaluate-credit-card-alerts`, `ia-ler`, `push-subscribe`,
  `push-unsubscribe`, `sessions`, `workspace-invites-accept`,
  `workspace-invites-create` e `workspace-invites-resend`.

- **As RPCs não escrevem por ele.** As `security definer` não passam pelo RLS,
  então a guarda `guarda_do_token_de_ia` (`db_pre_request` do PostgREST, em
  `20261103140000`) recusa ao token da IA toda `/rpc/*` fora
  `create_workspace_installment_plan`, e todo PATCH, PUT e DELETE, com
  `42501 token_de_ia_somente_leitura`. A sessão do app, o anon e a service role
  saem na primeira linha da função. **Ela roda em toda requisição da API**: um
  erro nela derruba o app inteiro. Logo depois do `db push`, abra o app e
  confira que lista e salva normalmente; se não, o desfazer está no §7.

**Residual conhecido:**

- **`PUT /auth/v1/user` com o token da IA** (trocar e-mail, senha, metadados)
  não foi verificado. Teste antes de ligar o Dynamic Client Registration: com o
  token de uma IA de teste, um `PUT` em `/auth/v1/user` tem de ser recusado.

## 2. Ligar o servidor OAuth (passo do dono, no painel)

Painel do Supabase › Authentication › OAuth Server:

1. **Ligar** o OAuth Server.
2. **Authorization Path:** `/oauth/consent`.
3. **Ligar o Dynamic Client Registration.**
4. Conferir **Site URL** (Authentication › URL Configuration) = a origem de
   produção do app. O consentimento mora lá: o Auth manda a pessoa para
   `<Site URL>/oauth/consent?authorization_id=…`.

Conferência (sem token, de qualquer lugar):

```bash
curl -s https://<ref>.supabase.co/auth/v1/.well-known/oauth-authorization-server
```

Esperado: um JSON com `issuer`, `authorization_endpoint`, `token_endpoint` e
`registration_endpoint`. **Não** pode mais responder `feature_disabled`.

## 3. A Edge Function

Depois do §1 (a `mcp` nova manda `p_source`, que a RPC antiga não conhece).
Acrescente `mcp` ao `supabase:deploy:functions` do `package.json` (já está) e
publique só ela:

```bash
supabase functions deploy mcp
```

A função importa `npm:@modelcontextprotocol/server`, `npm:@supabase/server`,
`npm:@supabase/middleware` e `npm:zod`. **Não está conferido** que o `deploy`
resolve esses imports `npm:` sem um `deno.json`. Se o empacotamento falhar,
tente de novo pela API, como as outras Edges desta máquina:

```bash
supabase functions deploy mcp --use-api
```

Se ainda assim falhar, pare e leve o erro ao dono: a saída provável é um
`deno.json` com `imports` ao lado da função, que é mudança de código.

Conferência da função no ar:

```bash
# sem token: 401 com o cabeçalho que aponta para a descoberta
curl -si https://<ref>.supabase.co/functions/v1/mcp | head -n 12

# a descoberta do recurso protegido
curl -s https://<ref>.supabase.co/functions/v1/mcp/oauth-protected-resource
```

Esperado no primeiro: `HTTP/2 401` e um
`www-authenticate: Bearer resource_metadata="https://<ref>.supabase.co/functions/v1/mcp/oauth-protected-resource"`.
Esperado no segundo: um JSON com `resource` e `authorization_servers`. **Não
está conferido** que o caminho `/functions/v1/mcp/oauth-protected-resource`
responde (o `withOAuthProtectedResource` o monta, mas nunca foi chamado no ar):
se der 404, o problema é o roteamento da função, não o Auth.

## 4. O front

O front do 2.0 (a rota `/oauth/consent` e o bloco "IAs conectadas") só vai
quando o 2.0 for para `main`. Sem ele, o §2 funciona, mas o Auth manda a pessoa
para uma rota que não existe. **Não conecte nenhuma IA antes do front.**

Depois do deploy do front, conferência:

```bash
curl -sI https://<origem do app>/oauth/consent | head -n 5
```

Esperado: 200 (a página existe; sem `authorization_id` ela mostra o erro, e sem
sessão leva ao login).

## 5. O que ainda não foi conferido

Isto é o que as revisões das tarefas deixaram como não verificado. Cada item é
uma checagem desta publicação:

1. **O `deploy` com os imports `npm:`** sem `deno.json` (§3). Se falhar, tente
   `--use-api`.
2. **O `oauth-protected-resource`** responde em
   `/functions/v1/mcp/oauth-protected-resource` (§3).
3. **O token OAuth nos avaliadores.** `evaluate-budgets` e
   `evaluate-credit-card-alerts` são chamados pelo `registrar_lancamento` com o
   token OAuth da IA, e a falha é engolida de propósito (o lançamento já está
   salvo). Se as duas recusarem esse token, o aviso de orçamento ou de fatura
   não sai e **nada acusa**. Confira no teste do §6: lance uma despesa que
   cruze 80% de um orçamento e veja o aviso no sino; veja também os logs das
   duas funções (Edge Functions › Logs) por 401/403 vindos do `mcp`.
4. **O residual do token da IA** (§1a): o `PUT /auth/v1/user`. E a guarda das
   RPCs no ar: com o token de uma IA de teste, `POST /rest/v1/rpc/delete_workspace`
   volta 403 com `token_de_ia_somente_leitura`, e o app da pessoa segue normal.
5. **As políticas `ia_somente_leitura_*` no ar**: com o token de uma IA de
   teste e a chave anônima, um `PATCH` e um `DELETE` em
   `/rest/v1/transactions?id=eq.<id>` voltam sem linha alterada, e um `POST` em
   `/functions/v1/delete-user` volta 401.
6. **O primeiro teste de ponta a ponta** no Claude e no ChatGPT (§6): o registro
   dinâmico, o consentimento e a troca do código pelo token nunca rodaram.

## 6. O teste, no Claude e no ChatGPT

Use uma carteira de teste e uma conta sua. O lançamento de teste cai na
conferência: apague-o depois.

1. **Claude** (claude.ai): Configurações › Conectores › Adicionar conector
   personalizado › a URL `https://<ref>.supabase.co/functions/v1/mcp` (o bloco
   "IAs conectadas", em Configurações no desktop e em `/settings/ias` no telefone, a mostra e copia). Conectar abre o login e o
   consentimento do app: confira o nome do cliente e **Permitir**.
2. **ChatGPT:** Configurações › Conectores, com o modo desenvolvedor ligado ›
   criar um conector com a mesma URL, autenticação OAuth.
3. **Claude Code:** `claude mcp add --transport http finance-app https://<ref>.supabase.co/functions/v1/mcp`
   e `/mcp` para autenticar.
4. Peça uma leitura ("quanto gastei este mês por categoria?") e confira o
   número contra o app.
5. Peça `registrar_lancamento` ("registre uma despesa de R$ 1,00 chamada teste
   MCP"). Confira em Lançamentos › A conferir: o lançamento está lá, com a
   origem da IA. Apague-o.
6. Peça um parcelado ("em 3x") e confira as três parcelas, todas marcadas a
   conferir; apague o plano.
7. Em Configurações › IAs conectadas (`/settings/ias` no telefone), a IA aparece com a data. **Revogar**: a
   próxima chamada da IA tem de voltar 401 e pedir o consentimento de novo.
8. Recuse uma vez (**Recusar** no consentimento) e confirme que a IA volta com
   o erro de acesso negado, sem criar conexão na lista.

## 7. Desfazer

- **A IA some:** `Revogar` em Minha conta, ou desligar o OAuth Server no painel
  (nenhuma IA consegue mais um token novo).
- **A Edge:** `supabase functions delete mcp` tira o endpoint do ar. O
  lançamento que a IA criou fica, e é apagado pela conferência.
- **A migração** `20261103120000` só acrescenta um valor ao check: não precisa
  de volta. Se alguma linha já usa `ia_externa`, tirar o valor do check
  reprovaria a linha.
- **A migração** `20261103130000` não tem volta a fazer: para a sessão do app as
  políticas não mudam nada. Desligar o OAuth Server já tira o token da IA.
- **A guarda** `20261103140000`: se o app quebrar depois dela, no SQL Editor
  `alter role authenticator reset pgrst.db_pre_request; notify pgrst, 'reload config';`
  desliga na hora (o token da IA volta a chamar as RPCs: desligue também o
  OAuth Server).
- **Nunca** `supabase config push`, nem para desfazer.
