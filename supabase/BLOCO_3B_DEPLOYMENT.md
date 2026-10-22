# Publicar o Bloco 3B: IA grátis na captura e na fatura

Reúne a IA do app, só com provedores grátis que não treinam com o dado:

- a cadeia de modelos em `_shared/ia-config.ts`: Groq primeiro, Cloudflare
  Workers AI de reserva, para a frase, a foto do recibo e o texto da fatura;
- a redação do texto antes do envio (`_shared/redigir.ts`), a cota de 30
  chamadas por pessoa por dia (`ia_uso`), o cache das respostas (`ia_cache`,
  limpo pelo cron `ia-cache-limpeza`) e a contagem por provedor (`ia_eventos`);
- a Edge nova `ia-ler`, que o app chama com o JWT da pessoa ("Tentar com IA"
  na frase, a foto do recibo, o compartilhar de foto do Android e "Ler com IA"
  na conferência da fatura). Ela devolve campos e nunca grava;
- a `capture` com foto em multipart, a frase confusa lida pela IA e a compra
  parcelada que vira plano, pela RPC interna `criar_plano_parcelado`;
- a política de privacidade pública em `/privacidade` e a linha da IA em
  Configurações.

As telas novas entram como **wireframe** (`src/components/wireframe/`).

**Estado em 22/10/2026: nada publicado.** O banco e as funções dos Blocos 1 e 2
estão no ar desde 21/10/2026. **O backend do Bloco 3A também não está**
(`BLOCO_3A_DEPLOYMENT.md`). O front do `finance-app-2.0` também não: ele só vai
para `main`, e para produção, quando os Blocos 1 a 7 estiverem prontos (decisão
do dono).

**O backend do 3B pode subir antes do front.** Nada do 3B aparece para quem usa
o front de `main`:

- a `ia-ler` só é chamada pelo front do 2.0;
- a `capture` só recebe pedidos de quem tem token, e os tokens só nascem pela
  tela do 2.0;
- o `share_target` novo mora no manifesto do 2.0;
- a `create_workspace_installment_plan`, que o front de `main` chama, mantém a
  assinatura, os erros e o comportamento. Veja "Compatibilidade", abaixo.

Faça na ordem. Todo SQL abaixo leva marcadores: troque-os no SQL Editor e
**nunca** salve o SQL preenchido no repositório (ele é público). Os marcadores
são `<WORKSPACE_ID>`, `<USER_ID>`, `<EMAIL>`, `<TOKEN_ID>`, `<TX_ID>`,
`<TX_ID_FOTO>`, `<PLAN_ID>`, `<PATH>`, `<INICIO>`, `<TOKEN>`, `<URL>` e
`<PROJECT_REF>`. O `<TOKEN>` vai ao `curl` pela variável `$TOKEN` do shell,
nunca escrito no comando.

## 0. Pré-requisitos

### 0.1. O Bloco 3A vai antes, ou junto

A migração do 3B (`20261024120000_ia.sql`) vem depois da do 3A
(`20261023120000_captura.sql`), e as funções do 3B dependem dela: a `capture` e
a `ia-ler` consultam a `workspace_plan`, e a `capture` lê `capture_tokens` e
grava `capture_meta`.

- **Se o 3A já foi publicado**, siga daqui.
- **Se não foi, os dois sobem juntos, nesta ordem:**
  1. o passo **0** do 3A (o Vault);
  2. o passo **1** deste roteiro: um `db push` só aplica as duas migrações, a do
     3A antes da do 3B;
  3. as conferências do passo **2** do 3A e as do passo 2 deste roteiro;
  4. o passo **3** deste roteiro: a lista de funções já inclui as do 3A, e
     substitui o comando do passo 3 do 3A;
  5. o teste de fumaça do 3A (o passo 4 de lá) e o deste roteiro.

Atenção: rodar o `supabase db push --linked` do roteiro do 3A agora **aplica
também a migração do 3B**, porque ela já está no repositório. Faça as
conferências dos dois roteiros depois dele.

### 0.2. O projeto ligado e a CLI

A CLI do Homebrew, 2.121 ou mais nova, com o projeto ligado
(`supabase link --project-ref <PROJECT_REF>`, uma vez só). Sem Docker nesta
máquina, as funções sobem pela API (`--use-api`).

### 0.3. Os segredos

Confira só os nomes, nunca o valor:

```bash
supabase secrets list
```

Têm de aparecer os três:

- `GROQ_API_KEY`;
- `CLOUDFLARE_ACCOUNT_ID`;
- `CLOUDFLARE_API_TOKEN`.

Sem o `CLOUDFLARE_API_TOKEN`, a Cloudflare sai da cadeia sem erro (a Edge pula o
provedor sem chave): a IA fica só com a Groq, e uma falha dela vai direto ao
parser ou a "a conferir". Cadastre o token (Workers AI, permissão de leitura e
edição) pelo Dashboard → Edge Functions → Secrets, nunca na linha de comando nem
num arquivo do repositório.

### 0.4. O custo é zero

- **Groq:** em console.groq.com → Settings → Billing, o plano é **Free**, sem
  cartão cadastrado. Sem cartão, passar do limite dá 429, nunca cobrança, e a
  cadeia passa à Cloudflare.
- **Cloudflare:** em Workers & Pages → Plans, o plano é **Workers Free**. O
  Workers AI grátis dá 10 mil neurons por dia; acima disso a Cloudflare
  recusa, sem cobrar.

Os caminhos dos painéis foram escritos de memória: confira na tela.

### 0.5. A Groq não guarda (ZDR)

Em console.groq.com → Settings → Data Controls (confira na tela), ligue a
retenção zero (Zero Data Retention), se a opção aparecer na conta grátis. A
política de `/privacidade` diz que a Groq não guarda nada **quando o ZDR está
ligado**. Se a opção não existir no Free, registre isso e ajuste o texto de
`src/components/wireframe/privacidade-wireframe.tsx` (e a data
`ATUALIZADA_EM`) antes de o front subir.

## 1. Migração

```bash
supabase db push --linked
```

Aplica `20261024120000_ia.sql` (e, antes dela, `20261023120000_captura.sql`, se
o 3A ainda não subiu):

| Parte | O que faz |
|-------|-----------|
| `ia_uso` | As chamadas de IA por pessoa e dia (o dia de São Paulo). Só a service role lê e grava |
| `ia_cache` | A resposta já validada, pela chave `sha256` da tarefa e da entrada redigida (a foto, pelos bytes). Só a service role |
| `ia_eventos` | Quantas chamadas cada provedor e modelo atendeu, por status (`ok`, `429`, `5xx`, `4xx`, `timeout`, `rede`, `invalido`), sem pessoa. Só a service role |
| `consumir_cota_ia` | RPC `security definer`: soma 1 enquanto a pessoa está abaixo do limite; esgotada, devolve `false`. Só a service role |
| `registrar_evento_ia` | RPC `security definer`: soma 1 no contador do dia, provedor, modelo e status. Só a service role |
| `criar_plano_parcelado` | O corpo da `create_workspace_installment_plan`, com a pessoa passada por quem chama (`p_user_id`), mais `p_source` e `p_needs_review`. Confere se a pessoa é membro. Só a service role: a `capture` a chama em nome do dono do token |
| `create_workspace_installment_plan` | Mesma assinatura e mesmos erros; agora chama a interna com `auth.uid()` |
| Cron `ia-cache-limpeza` | Domingo, `30 7 * * 0` (07:30 UTC): apaga do `ia_cache` o que passou de 30 dias |

**A migração vai antes das funções.** A `capture` e a `ia-ler` deste bloco
chamam `consumir_cota_ia`, `registrar_evento_ia` e `criar_plano_parcelado`.
Publicadas antes, a cota falha (a Edge trata o erro como cota esgotada e segue
sem IA) e a compra parcelada capturada volta 500.

## 2. Conferir o banco (SQL Editor)

O SQL Editor mostra só o resultado do último comando: rode um bloco por vez.

**As três tabelas têm RLS.**

```sql
select relname, relrowsecurity from pg_class
where oid in ('public.ia_uso'::regclass, 'public.ia_cache'::regclass, 'public.ia_eventos'::regclass);
```

Três linhas, todas com `relrowsecurity = true`.

**Nem `anon` nem `authenticated` alcançam as tabelas.**

```sql
select r.papel, t.tabela,
       has_table_privilege(r.papel, 'public.' || t.tabela, 'select,insert,update,delete') as alcanca
from unnest(array['anon', 'authenticated']) as r(papel),
     unnest(array['ia_uso', 'ia_cache', 'ia_eventos']) as t(tabela);
```

Seis linhas, todas com `alcanca = false`. Se alguma vier `true`, pare. Rode de
novo o `revoke all on public.<tabela> from anon, authenticated;` dela (está na
seção 1 de `20261024120000_ia.sql`) e confira de novo.

**As RPCs internas são só da service role.**

```sql
select
  has_function_privilege('authenticated', 'public.criar_plano_parcelado(uuid,uuid,uuid,text,text,uuid,integer,numeric,numeric,date,text,boolean)', 'execute') as plano_authenticated,
  has_function_privilege('anon', 'public.criar_plano_parcelado(uuid,uuid,uuid,text,text,uuid,integer,numeric,numeric,date,text,boolean)', 'execute') as plano_anon,
  has_function_privilege('authenticated', 'public.consumir_cota_ia(uuid,date,integer)', 'execute') as cota_authenticated,
  has_function_privilege('authenticated', 'public.registrar_evento_ia(date,text,text,text)', 'execute') as evento_authenticated,
  has_function_privilege('service_role', 'public.criar_plano_parcelado(uuid,uuid,uuid,text,text,uuid,integer,numeric,numeric,date,text,boolean)', 'execute') as plano_service_role;
```

Esperado: as quatro primeiras `false` e `plano_service_role` `true`. Se
`plano_authenticated` vier `true`, **pare**: qualquer pessoa logada criaria um
plano em nome de outra. Rode de novo as duas linhas `revoke all` e `grant
execute` do fim da seção 4 de `20261024120000_ia.sql` (copie do arquivo) e
confira de novo.

**A função do app continua aberta para quem entrou.**

```sql
select has_function_privilege('authenticated', 'public.create_workspace_installment_plan(uuid,uuid,text,text,uuid,integer,numeric,numeric,date)', 'execute');
```

Esperado: `true`. É ela que o front de `main` chama.

**O cron existe.**

```sql
select jobname, schedule, command from cron.job where jobname = 'ia-cache-limpeza';
```

Uma linha, com `30 7 * * 0` e o `delete from public.ia_cache where created_at <
now() - interval '30 days'`. Se faltar, rode no SQL Editor o bloco
`do $cron$ ... $cron$` do fim de `20261024120000_ia.sql` (copie do arquivo).

**A compra parcelada do app continua funcionando.** O front de `main` está no
ar e chama a `create_workspace_installment_plan`, agora reescrita. Use uma
carteira de teste em que você é o único membro, uma categoria sem orçamento e
uma forma que não seja cartão (Pix). Assim nenhum aviso sai para ninguém.

1. No app em produção, crie uma compra parcelada: descrição `Teste 3B`, 3
   parcelas de R$ 1,00, primeira cobrança hoje, Pix.
2. Confira o plano e as parcelas lançadas:

   ```sql
   select id, total_installments, generated_count, installment_amount
   from public.workspace_installment_plans
   where workspace_id = '<WORKSPACE_ID>' and description = 'Teste 3B';
   ```

   Uma linha, com `total_installments = 3` e `generated_count = 1`. O `id` é o
   `<PLAN_ID>`.

   ```sql
   select source, needs_review, count(*) from public.transactions
   where installment_plan_id = '<PLAN_ID>' group by 1, 2;
   ```

   Uma linha: `app`, `false`, `1`. O caminho do app não marca nada.
3. Exclua a parcela pelo app ("Excluir" cancela a compra parcelada inteira) e
   confira que o plano saiu:

   ```sql
   select count(*) from public.workspace_installment_plans where id = '<PLAN_ID>';
   ```

   Esperado: `0`.

## 3. Funções

O `_shared` vai embutido em cada função no deploy: toda função que importa um
módulo mudado precisa ser publicada de novo. Os módulos mudados neste bloco são
`captura.ts`, `http.ts` (ganhou o `lerCorpo`), `ia-config.ts`, `ia.ts` e
`redigir.ts`.

**Como a lista foi feita:** para cada `supabase/functions/*/index.ts`, foram
seguidos os `import` relativos, diretos e através do `_shared`, até o fim, e
ficou na lista toda função que alcança um dos cinco módulos. A ela se somaram as
oito do Bloco 3A, que ainda não subiram (`capture`, `review-reminder`,
`evaluate-budgets`, `evaluate-credit-card-alerts`, `notify-transaction-created`,
`credit-card-calendar-alerts`, `evaluate-bills-reminders` e
`workspace-invites-accept`), e a `ia-ler`, nova. Se o 3A já tiver subido, as que
estão só por ele (`evaluate-budgets` e `notify-transaction-created`) podem sair
do comando.

```bash
supabase functions deploy capture ia-ler activity-logs attachments-cleanup credit-card-calendar-alerts evaluate-bills-reminders evaluate-budgets evaluate-credit-card-alerts notify-transaction-created push-unsubscribe review-reminder run-recurring-billing sessions workspace-invites-accept workspace-invites-create workspace-invites-resend --use-api
```

| Função | Por quê |
|--------|---------|
| `capture` | Importa os cinco módulos: a foto em multipart, a IA da frase e o plano parcelado. Também do 3A |
| `ia-ler` | Nova. Importa os cinco módulos |
| `activity-logs` | Importa `http.ts` |
| `attachments-cleanup` | Importa `http.ts` |
| `credit-card-calendar-alerts` | Importa `http.ts`. Também do 3A |
| `evaluate-bills-reminders` | Importa `http.ts`. Também do 3A |
| `evaluate-credit-card-alerts` | Importa `http.ts`. Também do 3A |
| `push-unsubscribe` | Importa `http.ts` |
| `review-reminder` | Importa `http.ts`. Também do 3A (nova lá) |
| `run-recurring-billing` | Importa `http.ts` |
| `sessions` | Importa `http.ts` |
| `workspace-invites-accept` | Importa `http.ts`. Também do 3A |
| `workspace-invites-create` | Importa `http.ts` |
| `workspace-invites-resend` | Importa `http.ts` |
| `evaluate-budgets` | Só pelo 3A (não importa módulo mudado no 3B) |
| `notify-transaction-created` | Só pelo 3A (não importa módulo mudado no 3B) |

A mudança no `http.ts` só acrescenta o `lerCorpo`, que só a `capture` e a
`ia-ler` usam. Publicar de novo as outras não muda o que elas fazem, mas deixa
o código no ar igual ao do repositório.

As outras duas funções (`delete-user` e `push-subscribe`) não importam nenhum
desses módulos e não precisam de deploy.

O `verify_jwt = false` de `ia-ler` está em `supabase/config.toml`, como o de
`capture`. A `ia-ler` confere ela mesma o JWT, o membro e o plano. A `capture`
recebe o token `fac_…`, não um JWT.

## 4. Teste de fumaça

**Só com dado de teste** (o banco é o de produção). Use a carteira de teste do
passo 2, em que você é o único membro.

`<URL>` é o endereço da captura: o Project URL (Settings → API) seguido de
`/functions/v1/capture`.

### 4.1. Preparar

Anote a hora de início **uma vez só** (é o `<INICIO>`, usado na limpeza). Se você
acabou de rodar o teste do 3A e já anotou o `<INICIO>` no passo 4.1 de lá, use
o mesmo e pule este `select`:

```sql
select now();
```

Crie um token de teste como no passo **4.1 de `BLOCO_3A_DEPLOYMENT.md`**, com o
nome `Teste de fumaça 3B`. O `token_id` é o `<TOKEN_ID>`.

> **O texto do token nunca é salvo em lugar nenhum**: nem no repositório, nem
> num arquivo, nem no histórico do shell. Guarde-o com `read -rs TOKEN` (cole e
> tecle Enter; nada aparece), e o `curl` o lê como `$TOKEN`. Se parar no meio,
> rode a limpeza do passo 4.7: um token de teste esquecido continua lançando na
> carteira.

### 4.2. Frase confusa

Uma frase sem número, que o parser não lê e a IA lê:

```bash
read -rs TOKEN
curl -sS -i -X POST '<URL>' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"text":"paguei quarenta e dois reais e noventa centavos no almoço de hoje no débito","id":"fumaca-3b-frase"}'
```

Esperado: `200` com `"ia":true`, `"needs_review":true` e `"anexo":null`. O
`id` é o `<TX_ID>`. Confira o provedor que respondeu:

```sql
select capture_meta -> 'ia' from public.transactions where id = '<TX_ID>';
```

Esperado: `{"provedor":"groq","modelo":"openai/gpt-oss-20b"}` (ou a
Cloudflare, se a Groq falhou).

### 4.3. Foto de recibo

Faça uma foto de recibo **sintética**, sem dado real: escreva num papel (ou numa
nota no celular) `PADARIA TESTE` e `TOTAL R$ 12,34`, fotografe e exporte em JPEG
com menos de 4 MB. Não salve a imagem no repositório.

```bash
curl -sS -i -X POST '<URL>' \
  -H "Authorization: Bearer $TOKEN" \
  -F 'file=@<CAMINHO_DA_FOTO>;type=image/jpeg' \
  -F 'source=share' \
  -F 'id=fumaca-3b-foto'
```

Esperado: `200` com `"ia":true`, `"needs_review":true`, `"anexo":true` e o
resumo com R$ 12,34. O `id` é o `<TX_ID_FOTO>`. Ache o caminho do anexo (é o
`<PATH>`):

```sql
select path, size_bytes from public.attachments where transaction_id = '<TX_ID_FOTO>';
```

Uma linha. `anexo: false` quer dizer que o lançamento foi salvo, mas a foto não
(cota de anexos da carteira cheia, por exemplo).

### 4.4. Cota

Sem gastar 30 chamadas: ponha a sua linha do dia no limite.

```sql
update public.ia_uso set chamadas = 30
where user_id = '<USER_ID>' and dia = (now() at time zone 'America/Sao_Paulo')::date;
```

Uma linha atualizada (os passos 4.2 e 4.3 a criaram). Mande uma frase confusa
**nova** (uma frase repetida viria do cache, sem gastar cota):

```bash
curl -sS -i -X POST '<URL>' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"text":"gastei uns trinta e poucos na farmácia","id":"fumaca-3b-cota"}'
```

Esperado: `422` com `{"error":"Não entendi o valor. Ex.: 42 mercado"}`, e nada
gravado. A `capture` não diz `cota` na resposta: com a cota esgotada, a IA
devolve `motivo: 'cota'` sem chamar o provedor, e a `capture` segue com o
parser, que não acha o valor. Confirme de dois jeitos:

- o log da função (Dashboard → Edge Functions → `capture` → Logs) mostra
  `capture: ia cota`;
- a contagem não passou do limite:

  ```sql
  select chamadas from public.ia_uso
  where user_id = '<USER_ID>' and dia = (now() at time zone 'America/Sao_Paulo')::date;
  ```

  Esperado: `30`.

No app do 2.0, a mesma cota volta da `ia-ler` como `{"ok":false,"motivo":"cota"}`
e aparece como "Você usou a IA 30 vezes hoje. Amanhã volta.". Confira isso
quando o front subir.

Devolva a sua cota do dia:

```sql
delete from public.ia_uso
where user_id = '<USER_ID>' and dia = (now() at time zone 'America/Sao_Paulo')::date;
```

### 4.5. Os provedores

```sql
select * from public.ia_eventos order by dia desc;
```

Esperado: linhas de hoje com `groq` e status `ok` (uma do `openai/gpt-oss-20b`,
da frase, e uma do `qwen/qwen3.8-27b`, da foto). Uma linha `cloudflare` diz que a
Groq falhou naquela chamada, e o `status` da linha `groq` do mesmo dia diz por
quê. `401` e `403` aparecem como `4xx`: confira a chave daquele provedor.

### 4.6. O custo

Depois do teste, confira de novo o passo 0.4: a Groq continua no Free sem
cartão, e a Cloudflare no Workers Free. No painel de uso da Groq (o caminho é
de memória, confira na tela; `console.groq.com/settings/limits` mostra os
limites, não o uso), o uso do dia subiu e está longe do limite.

### 4.7. Limpar

Revogue o token antes de tudo:

```sql
update public.capture_tokens set revoked_at = now() where id = '<TOKEN_ID>';
```

Apague os lançamentos do teste:

```sql
delete from public.transactions where id in ('<TX_ID>', '<TX_ID_FOTO>');
```

A linha do anexo sai em cascata, mas o objeto fica no bucket. Apague-o em
Dashboard → Storage → `attachments`, pelo `<PATH>`; esquecido, o cron
`attachments-cleanup-weekly` o apaga no domingo seguinte.

```sql
delete from public.capture_tokens where id = '<TOKEN_ID>';
```

O cache da IA guarda as respostas do teste, sem pessoa. Enquanto o front do 2.0
não sobe, ninguém mais usa a IA, então dá para apagar tudo o que nasceu desde o
início:

```sql
delete from public.ia_cache where created_at >= '<INICIO>';
```

A `ia_eventos` só conta chamadas, sem pessoa, e pode ficar.

Confira se o teste gerou algum aviso para você nessa carteira e apague-o, como
no passo 4.5 do 3A:

```sql
select id, type, title, created_at from public.notifications
where workspace_id = '<WORKSPACE_ID>' and user_id = '<USER_ID>'
  and created_at >= '<INICIO>';
```

```sql
delete from public.notifications
where workspace_id = '<WORKSPACE_ID>' and user_id = '<USER_ID>'
  and created_at >= '<INICIO>';
```

Apague a foto sintética do seu computador.

## 5. O que confirmar com os provedores (spec §8)

**A política de privacidade e o front só vão ao ar depois deste passo.** A
página `/privacidade` afirma o que está abaixo; se algo não se confirmar, o
texto muda antes (com a data `ATUALIZADA_EM`).

Ficaram para conferir no painel e nos termos de cada um:

- **Groq, ZDR:** o passo 0.5 já ligou a retenção zero, ou registrou que ela não
  existe no Free e o texto foi ajustado.
- **Sem treino:** os termos da Groq (a proibição de treinar com o dado do
  cliente) e os da Cloudflare Workers AI dizem que a entrada e a saída não
  treinam modelos. A página, a linha de Configurações e o Atlas afirmam "sem
  treino".
- **Groq, limites reais:** em console.groq.com/settings/limits (confira na
  tela), anote as
  chamadas por minuto e por dia de `openai/gpt-oss-20b`, `openai/gpt-oss-120b` e
  `qwen/qwen3.8-27b`. A cota do app (30 por pessoa por dia) tem de caber com
  folga.
- **Cloudflare, DPA e retenção:** confira o DPA da Cloudflare e por quanto tempo
  o Workers AI guarda a entrada e a saída. A política diz que a Cloudflare
  "guarda pelo prazo da política dela".
- **O modelo de visão da Groq é *preview*:** o `qwen/qwen3.8-27b` pode sair sem
  aviso. A Cloudflare (`@cf/meta/llama-4-scout-17b-16e-instruct`) cobre a foto
  enquanto isso. A troca é num lugar só, `supabase/functions/_shared/ia-config.ts`,
  e pede o deploy de novo de `capture` e `ia-ler`.

## Compatibilidade

- **A `create_workspace_installment_plan` não mudou para quem chama.** Mesma
  assinatura, mesmos erros (`Not authenticated`, `Forbidden`, `Invalid
  total_installments`), mesmo grant, e as parcelas nascem como antes, com
  `source` `app` e sem marca. O front de `main` a usa todo dia: por isso a
  conferência do passo 2.
- **As Edges existentes aceitam os mesmos pedidos de antes.** A `capture` só
  ganhou o multipart; o JSON de 16 KB continua igual. As que só importam o
  `http.ts` não mudaram de comportamento.
- **O compartilhar do Android só muda com o front do 2.0.** O `share_target`
  passou a `POST` multipart em `/transactions/compartilhar`, e essa rota mora no
  service worker e no front do 2.0. O manifesto de `main` continua com o `GET`
  do texto.
- **Nada novo é legível pelo app.** As três tabelas da IA ficam fora do alcance
  de `anon` e `authenticated`.

## Segredos

Três, todos só nas Edge Functions, nunca no cliente: `GROQ_API_KEY`,
`CLOUDFLARE_ACCOUNT_ID` e `CLOUDFLARE_API_TOKEN` (passo 0.3). A `capture` e a
`ia-ler` usam também `SUPABASE_URL`, `SUPABASE_ANON_KEY` e
`SUPABASE_SERVICE_ROLE_KEY`, que o Supabase já fornece.

## Ordem com o front

**Migração, funções e o passo 5 antes do front.** O front do 2.0 chama a `ia-ler` ("Tentar
com IA", a foto do recibo, a foto compartilhada e "Ler com IA") e lê
`capture_meta.ia`. Publicado antes, a IA do app volta com um aviso de erro e o
formulário segue sem ela: nada quebra, mas nada é lido.

Com o front no ar, refaça pela tela:

1. a frase sem valor e "Tentar com IA" no formulário;
2. a foto do recibo, salvar e conferir o anexo no detalhe;
3. uma foto e um PDF compartilhados de um Android com o app instalado (o PDF
   leva ao aviso de abrir o cartão);
4. "Ler com IA" numa fatura em PDF cuja leitura ficou incompleta;
5. a linha da IA em Configurações e a página `/privacidade`, sem sessão.
