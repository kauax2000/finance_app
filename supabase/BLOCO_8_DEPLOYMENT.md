# Publicar o Bloco 8: a cobrança pelo Asaas

Reúne o assinar de verdade do Plano Família, a renovação, o cancelamento e o
reembolso:

- a migração `20261101120000_cobranca_asaas.sql`:
  - as colunas novas de `billing_subscriptions`: `reembolsavel_ate`,
    `asaas_customer_id`, `card_token`, `card_last4`, `card_brand`,
    `ultimo_ip`, `checkout_ref`, `checkout_url`, `checkout_criado_em` e
    `nfse_para`. A tabela continua só da service role, e o cliente lê só por
    `meu_plano()`;
  - a tabela `billing_events`, a idempotência do webhook (um evento do Asaas
    por `id`);
  - a tabela `billing_parcelamentos`, o registro de cada parcelamento que nós
    criamos (o checkout e a renovação do cron), com `ativado_em` e o estado do
    estorno (`pendente` ou `feito`). RLS ligada, nenhuma política;
  - `tem_plano_proprio` redefinida: a linha `active` conta também pela
    `grace_until`, a renovação cobrada que espera a confirmação;
  - `meu_plano()` redefinida: ganha `cartao_final`, `reembolsavel_ate`,
    `carencia_ate` e `checkout_url` (só com `pending` ou `past_due` e o link
    com menos de um dia);
- três Edges novas e uma estendida:
  - `billing-checkout`: o "Assinar" e o "Atualizar cartão". Recebe o nome e o
    CPF, cria o cliente no Asaas, procura e limpa as cobranças abertas da
    linha e cria a cobrança de 12x sem dado de cartão. Devolve o link da fatura
    do Asaas, onde a pessoa digita o cartão;
  - `asaas-webhook`: os eventos de pagamento do Asaas, conferidos pelo
    `asaas-access-token`. Ativa a compra e a renovação, estorna a cobrança em
    dobro e expira o plano estornado ou contestado;
  - `billing-cancel`: `cancelar`, `desfazer` e `reembolsar` (o arrependimento
    de 7 dias);
  - `billing-daily`, estendida: além do aviso do dia 12 do teste, refaz os
    estornos pendentes, avisa a renovação, renova pelo token do cartão, confere
    a renovação em espera, expira o plano e agenda a NFS-e;
- no front do 2.0: o formulário de assinar e de atualizar o cartão em `/plans`,
  o "Continuar o pagamento", a volta por `/plans?pago=1`, cancelar, desfazer e
  o reembolso, tudo no wireframe dos planos; e as frases novas em
  `/privacidade` e no Cofre aberto.

**Estado em 26/10/2026: nada publicado.** O front do `finance-app-2.0` também
não: ele só vai para `main`, e para produção, quando os blocos planejados
estiverem prontos (decisão do dono).

**Nada disto chamou o Asaas.** Os testes simulam o `fetch` (`npm run
test:edge`) e leem o texto do SQL (`src/lib/planos/migracao-cobranca.test.ts`,
`src/lib/planos/edges-planos.test.ts`). O SQL nunca rodou contra um banco, e o
que a documentação do Asaas não confirma está no §0. **O Sandbox do §1 é a
primeira vez que esse código fala com o Asaas.**

**A cobrança fica desligada até o lançamento do 2.0** (§6). Com
`billing_settings.enforced_since` nulo, todo mundo é `familia` e ninguém é
barrado. Uma coisa não depende do interruptor: os passos do Asaas no
`billing-daily` (estornos, renovação, NFS-e) rodam todo dia, de propósito,
para o Sandbox funcionar antes do lançamento. Sem linha do Asaas no banco, eles
não fazem nada.

Faça na ordem. Todo SQL abaixo roda no SQL Editor, que roda como `postgres`,
sem RLS. Os marcadores são `<USER_ID_DE_TESTE>` (o `id` da conta de teste em
`auth.users`), `<ID_DA_LINHA>` e `<CUSTOMER_ID>` (lidos da linha da conta de
teste) e `<URL_DAS_FUNCOES>` (o endereço das Edges do projeto). **Nunca** salve
no repositório o SQL preenchido, um id, uma chave, um token ou o resultado de
uma conferência: o repositório é público.

## 0. Pré-requisitos do dono

**A conta do Asaas.**

- O **CNPJ** e a **conta Asaas aprovada**, com os documentos enviados. A conta
  de produção e a do Sandbox são independentes, com chaves diferentes
  (`$aact_prod_…` e `$aact_hmlg_…`).
- **A taxa**: no cartão em 7 a 12x, R$ 0,49 por cobrança mais 3,99% do total
  (2,99% nos 3 primeiros meses da conta), sem mensalidade. A NFS-e custa
  R$ 0,49 por nota. Confira as condições da sua conta no painel.
- **A tokenização em produção.** A documentação diz que, em produção, ela
  "depende de habilitação" e passa por análise. Sem ela, o
  `PAYMENT_CONFIRMED` não traz o token, e nenhuma renovação é automática
  (§1, item 2). Peça ao suporte antes do lançamento.
- **O domínio do app nos dados comerciais da conta** (Configurações da conta ›
  Informações). O `callback.successUrl` da cobrança é
  `<APP_BASE_URL>/plans?pago=1` e precisa estar nesse domínio. Cadastre-o na
  conta de produção e na do Sandbox.
- **A configuração fiscal** no painel: o município, o código do serviço e as
  alíquotas. O código do serviço vai no segredo `ASAAS_NFSE_SERVICO_CODIGO`, e
  o nome em `ASAAS_NFSE_SERVICO_NOME`. **O código manda a nota com todos os
  impostos zerados** (`iss`, `pis`, `cofins`, `csll`, `inss`, `ir` em 0 e
  `retainIss` falso, em `_shared/asaas.ts`, `agendarNota`). Confirme com o
  contador que o regime da empresa aceita isso. Se não aceitar, o código muda
  antes de ligar a cobrança.
- **A Vercel Pro** (US$ 20 por mês) antes de ligar a cobrança: o plano Hobby
  proíbe uso comercial. É uma ação do dono, no painel da Vercel.

**As perguntas ao suporte do Asaas.** A documentação pública não responde a
nenhuma delas. Cada uma tem o que o código faz hoje, e o Sandbox (§1) confirma
o que der:

1. **A fatura de uma cobrança com `installmentCount: 12`.** Uma cobrança
   parcelada (`POST /v3/payments` com `installmentCount: 12` e `totalValue`),
   no cartão e sem dado de cartão, devolve a `invoiceUrl`. Nela, a pessoa paga
   as 12 parcelas de uma vez no cartão, com uma autorização só (o "12x" do
   cartão)? Ou o Asaas cria 12 cobranças mensais, cada uma com a sua fatura?
   Se for a segunda, qual o caminho para parcelar no cartão sem receber o dado
   do cartão? **O desenho do bloco depende da primeira resposta.**
2. **O token no `PAYMENT_CONFIRMED`.** Com a tokenização habilitada, o pagamento
   feito pela pessoa na `invoiceUrl` traz `creditCard.creditCardToken` no
   webhook? Esse token serve para uma cobrança nossa, fora de sessão, um ano
   depois?
3. **O `remoteIp` fora de sessão.** Ele é obrigatório na cobrança por token, e a
   documentação proíbe mandar o IP do servidor. Na renovação anual não há
   aparelho da pessoa. O código manda o IP gravado no último checkout dela
   (`ultimo_ip`, o primeiro valor de `x-forwarded-for`). Isso é aceito? Sem
   esse IP, o código não tenta a renovação por token.
4. **As rotas de remoção.** `DELETE /v3/installments/{id}` remove todas as
   parcelas abertas de um parcelamento, e `DELETE /v3/payments/{id}` remove uma
   cobrança avulsa? As duas devolvem `{ deleted: true, id }`? A remoção de um
   parcelamento com uma parcela vencida (`OVERDUE`) funciona? A de um
   parcelamento com parcela confirmada é recusada? Se a remoção de um
   parcelamento vencido for recusada, o checkout daquela linha devolve 502 para
   sempre.
5. **O estado do estorno em `GET /v3/installments/{id}`.** O código lê o
   parcelamento antes de pedir um estorno e o conta como feito quando
   `refunds[]` tem um item que não é `CANCELLED`, ou quando há um `status`
   `REFUNDED`, `REFUND_REQUESTED` ou `REFUND_IN_PROGRESS`. O corpo traz
   `customer` e `refunds[]`? Um estorno pedido há um instante já aparece ali?
   O parcelamento tem `status`?
6. **O filtro `dateCreated[ge]`.** `GET /v3/payments?externalReference=…&dateCreated[ge]=AAAA-MM-DD`
   filtra pela data de criação e pagina por `offset` e `hasMore`? A
   verificação da renovação em espera depende disso (Ruling 19). Se o Asaas
   responder 400, toda cobrança incerta espera até `fim + 7 dias` e expira sem
   o aviso do cartão antes.
7. **A listagem por `status`.** `GET /v3/payments?externalReference=…&status=PENDING`
   aceita um `status` por chamada (o código faz uma para `PENDING` e outra
   para `OVERDUE`)? Cada parcela vem com `installment`, `customer`, `value` (o
   da parcela), `dueDate` e a própria `invoiceUrl`? A `invoiceUrl` da 1ª
   parcela paga o plano inteiro?
8. **Um parcelamento pago nunca lista parcela aberta.** Depois que a pessoa paga
   na fatura, as 12 parcelas passam juntas a `CONFIRMED` ou `RECEIVED`, e
   nenhuma fica `PENDING` ou `OVERDUE` com um vencimento futuro?
9. **A fatura de cartão vencida.** Uma fatura `OVERDUE` ainda pode ser paga na
   página do Asaas? O fluxo `PAYMENT_OVERDUE > PAYMENT_CONFIRMED` diz que sim,
   e por isso o código lista as vencidas também (e as troca por uma nova).
10. **A recusa por token.** Uma cobrança parcelada por token recusada volta 400
    e não deixa cobrança criada, como a avulsa? Como simular no Sandbox a
    recusa de um token válido (os cartões de recusa do Sandbox não geram
    token)?
11. **O estorno do parcelamento inteiro** (`POST /v3/installments/{id}/refund`)
    manda um `PAYMENT_REFUNDED` por parcela? O código expira a linha no
    primeiro e ignora os outros.
12. **O redirecionamento** do `callback.successUrl` acontece depois do pagamento
    de uma cobrança parcelada, uma vez só?
13. **O Pix Automático**, para depois: a taxa, a elegibilidade da conta e se o
    Sandbox o oferece. A spec o prevê quando o CNPJ completar 6 meses.

Anote as respostas fora do repositório. Uma resposta que contradiz o que o
código faz é um bloqueio: o código muda antes do §6.

**A CLI** do Homebrew, 2.121 ou mais nova, com o projeto ligado
(`supabase link`). Sem Docker nesta máquina, as funções sobem pela API
(`--use-api`).

**Os Blocos 3A a 7C vão antes, ou junto.** A migração deste bloco é a última da
fila e redefine a `tem_plano_proprio` e a `meu_plano()` do Bloco 4
(`20261025120000_planos.sql`). A recusa do convidado na `billing-checkout`
lê o `role = 'guest'` do Bloco 7A.

**Os tipos** (`src/types/database.ts`) foram editados à mão. Depois de aplicar a
migração num banco local ou de teste, rode o `npm run db:types` e confira o
diff: ele deve só reordenar.

**Nenhum pgTAP neste bloco.** E, em qualquer bloco, **nunca `supabase test db
--linked`**: o projeto ligado é o de produção, e os testes gravam em
`auth.users` antes do `rollback`.

**O banco de desenvolvimento é o de produção.** Não rode nada disto sem o pedido
explícito do dono.

## 1. Sandbox, antes de qualquer cliente real

**Onde.** Num ramo de teste do Supabase ou num projeto descartável, com todas
as migrações aplicadas até esta, as quatro Edges publicadas e os segredos
apontando para o **Sandbox** do Asaas (§3, com `ASAAS_API_URL` =
`https://api-sandbox.asaas.com/v3` e a chave do Sandbox). O ramo precisa também
do Vault (`edge_functions_url` e `cron_secret`) e do `CRON_SECRET`, para o
`select public.invoke_edge_function('billing-daily')` funcionar. As migrações
chegam lá com a string de conexão do ramo, que fica fora do repositório:

```bash
supabase db push --db-url "<string de conexão do ramo>"
```

O front do 2.0 roda apontado para o ramo, num endereço do domínio cadastrado na
conta do Sandbox (um preview da Vercel, por exemplo). O `APP_BASE_URL` do ramo
é esse endereço. No painel do Sandbox, o webhook (§4) aponta para a
`asaas-webhook` do ramo.

**Se o dono preferir o projeto de produção**, faça antes o §2 e o §3 com os
segredos do Sandbox, e use **só uma conta de teste** (nunca a do dono nem a da
família: uma pessoa tem uma linha só em `billing_subscriptions`, e o vitalício
dela ocuparia a linha). Ao terminar, apague a conta de teste pelo app (Cofre
aberto › Apagar a conta): a linha dela e os parcelamentos saem em cascata. Só
depois troque os segredos para os de produção.

**As escritas desta seção** mudam só a linha da conta de teste, para simular o
tempo (o fim do período, uma espera, um estorno pendente). Depois de cada uma,
dispare o cron na mão:

```sql
select public.invoke_edge_function('billing-daily');
```

A resposta sai nos logs da função (Dashboard › Edge Functions › `billing-daily`
› Logs): `{"ok":true,"avisos":…,"failures":…,"renovadas":…,"aguardando":…,"falhas":…,"expiradas":…,"notas":…,"estornos":…}`.

O id da linha, o cliente do Asaas e o parcelamento da conta de teste:

```sql
select id, status, asaas_customer_id, provider_ref, current_period_end,
       grace_until, reembolsavel_ate, card_last4, card_token is not null as tem_token
from public.billing_subscriptions
where user_id = '<USER_ID_DE_TESTE>';
```

Os cartões de teste do Sandbox: qualquer número válido aprova, e
`5184019740373151` (Mastercard) e `4916561358240741` (Visa) recusam.

### 1.1. A compra e o que a documentação não confirma

Com a conta de teste em `/plans`, "Assinar", nome e um CPF válido de teste.

1. **A fatura de 12x.** O botão abre a fatura do Asaas. Ela mostra **12x fixo
   numa compra só**, e não 12 faturas nem a escolha do número de parcelas
   (§0, pergunta 1). Pague com um cartão de teste que aprova.
2. **O token.** Nos logs da `asaas-webhook`, o `PAYMENT_CONFIRMED` chega e a
   linha fica `active`, com `current_period_end` daqui a um ano,
   `reembolsavel_ate` daqui a 7 dias, `card_last4` preenchido e
   `tem_token = true` na consulta acima.
3. **A volta.** A fatura volta para `<APP_BASE_URL>/plans?pago=1`. A tela diz
   "Confirmando o pagamento…" e, quando o webhook chega, mostra "Renova em
   DD/MM/AAAA" e o cartão final. Sem webhook em 2 minutos, ela diz "Ainda não
   recebemos a confirmação do Asaas…".

**Se o item 2 falhar** (a linha fica sem token), a renovação cai no caminho sem
token: em `fim − 2 dias` a linha vai a `past_due`, a pessoa recebe "Não
conseguimos renovar seu plano" e paga de novo na fatura, pelo "Atualizar
cartão", mantendo o preço. **O código não muda.** Registre o resultado na
tabela do §1.4 e a lacuna 78 de `docs/JORNADAS.md` continua aberta.

### 1.2. A renovação, a recusa e a espera

4. **A renovação pelo token.** Leve o fim do período para amanhã:

   ```sql
   update public.billing_subscriptions
   set current_period_end = now() + interval '1 day', reembolsavel_ate = null, updated_at = now()
   where user_id = '<USER_ID_DE_TESTE>' and provider = 'asaas' and status = 'active';
   ```

   Dispare o cron. Esperado: `renovadas: 1` (ou `aguardando: 1`, e depois o
   webhook). A linha fica com `current_period_end` um ano depois do fim antigo
   (o aniversário se mantém), um `provider_ref` novo e `grace_until` nulo. No
   painel do Sandbox há um parcelamento novo, pago sem a pessoa digitar o
   cartão. Enquanto espera a confirmação, `/plans` mostra "Renovação em
   confirmação." e não oferece cancelar.
5. **A recusa não deixa cobrança.** Troque o token por um inválido e repita:

   ```sql
   update public.billing_subscriptions
   set card_token = 'token-invalido-de-teste', current_period_end = now() + interval '1 day',
       checkout_criado_em = null, updated_at = now()
   where user_id = '<USER_ID_DE_TESTE>' and provider = 'asaas' and status = 'active';
   ```

   Esperado: `falhas: 1`, nos logs "renovação recusada" com um 4xx, a linha em
   `past_due` com `grace_until` = fim + 7 dias, e o aviso "Não conseguimos
   renovar seu plano" no sino. No painel, **nenhuma cobrança nova** para esse
   cliente. Em `/plans`: "Não conseguimos renovar", "Atualize o cartão até
   DD/MM.", "Atualizar cartão" e "Cancelar a renovação". "Atualizar cartão"
   abre uma fatura com o preço da linha. Paga, a linha volta a `active` com o
   fim antigo + 1 ano.
6. **A cobrança incerta, conferida no dia seguinte** (Ruling 19). A
   verificação conta as cobranças da linha criadas desde o dia da tentativa, e
   as dos itens 4 e 5 contariam: use uma conta com uma compra só (uma conta
   nova, ou dois dias depois). Simule uma cobrança aceita há mais de um dia que
   nunca foi criada:

   ```sql
   update public.billing_subscriptions
   set status = 'active', grace_until = current_period_end + interval '7 days',
       checkout_criado_em = now() - interval '25 hours', updated_at = now()
   where user_id = '<USER_ID_DE_TESTE>';
   ```

   Dispare o cron. Esperado: a verificação lê `GET /payments` com
   `dateCreated[ge]`, não acha cobrança nova, e a linha vai a `past_due` com o
   aviso do cartão. Se os logs mostrarem "verificação" com um 400, o filtro não
   existe (§0, pergunta 6): a linha fica esperando até `grace_until`.

### 1.3. O reembolso, o dobro e o checkout que não duplica

Para estes itens, a conta de teste precisa de uma compra nova, feita há menos de
7 dias. Se ela já passou pelos itens de cima, apague-a pelo app, crie outra e
compre de novo.

7. **O reembolso na hora.** Em `/plans`, "Pedir reembolso (7 dias)" pede uma
   confirmação. Esperado: a linha fica `expired`, o painel mostra o
   parcelamento estornado, chega o `PAYMENT_REFUNDED` (a linha já expirada não
   muda) e o aviso "Reembolso confirmado". A conta volta ao estado de antes da
   compra (o teste, se ainda estiver nele; senão, só leitura).
8. **O reembolso pendente, concluído pelo cron** (Ruling 13). Numa compra nova,
   simule o estorno que estourou o prazo:

   ```sql
   update public.billing_parcelamentos p
   set estorno_status = 'pendente', estorno_tentado_em = now() - interval '2 hours'
   from public.billing_subscriptions b
   where b.user_id = '<USER_ID_DE_TESTE>' and p.installment = b.provider_ref
     and p.estorno_status is null;
   ```

   "Pedir reembolso" agora responde na hora "Pedimos o reembolso ao Asaas.
   Avisamos quando ele for confirmado.", sem chamar o Asaas. Dispare o cron.
   Esperado: `estornos: 1`, o parcelamento estornado no painel, a linha
   `expired` e o aviso "Reembolso confirmado".
9. **A cobrança em dobro é devolvida** (Ruling 8). Numa linha `active` dentro do
   período, crie pela API do Sandbox uma segunda cobrança de 12x para o mesmo
   cliente, com a referência da linha. A chave do Sandbox fica numa variável da
   sessão do terminal, nunca num arquivo:

   ```bash
   curl -s -X POST "https://api-sandbox.asaas.com/v3/payments" \
     -H "access_token: $ASAAS_SANDBOX_KEY" -H "Content-Type: application/json" -H "User-Agent: finance-app" \
     -d '{"customer":"<CUSTOMER_ID>","billingType":"CREDIT_CARD","installmentCount":12,"totalValue":<TOTAL>,"dueDate":"<AAAA-MM-DD de hoje>","externalReference":"<ID_DA_LINHA>"}'
   ```

   `<TOTAL>` é o preço da linha em reais (`238.80` no de fundador, `358.80` no
   Família).

   Abra a `invoiceUrl` da resposta e pague. Esperado: o webhook registra o
   parcelamento (Ruling 15), vê que a linha já está paga no período e o estorna.
   O registro dele em `billing_parcelamentos` fica `feito`, o painel mostra o
   estorno, o período da linha não muda, e chega o aviso "Cobrança em dobro
   devolvida".
10. **Listar antes de criar** (Ruling 7). Com uma conta de teste sem plano,
    "Assinar" e feche a fatura sem pagar. `/plans` mostra "Continuar o
    pagamento", com o mesmo link. Agora finja que o link venceu:

    ```sql
    update public.billing_subscriptions
    set checkout_criado_em = now() - interval '25 hours'
    where user_id = '<USER_ID_DE_TESTE>' and status = 'pending';
    ```

    "Continuar o pagamento" some. "Assinar" de novo devolve **a mesma fatura**
    (o parcelamento todo `PENDING`, com o mesmo total, é reaproveitado), e o
    painel continua com um parcelamento só. No dia seguinte, com a 1ª parcela
    já `OVERDUE`, repita o `update` e "Assinar" de novo: o checkout remove o
    parcelamento vencido e cria outro, e o painel mostra o antigo removido
    (§0, perguntas 4 e 9).
11. **A NFS-e.** Com a configuração fiscal do Sandbox e os dois segredos da
    nota, leve o fim da janela de arrependimento para o passado:

    ```sql
    update public.billing_subscriptions
    set reembolsavel_ate = now() - interval '1 minute'
    where user_id = '<USER_ID_DE_TESTE>' and status = 'active';
    ```

    Dispare o cron. Esperado: `notas: 1`, a nota agendada no painel (Notas
    fiscais) com o valor total do plano, e `nfse_para` igual ao
    `provider_ref`. Um segundo disparo não agenda outra.

### 1.4. O que o Sandbox respondeu

Preencha a coluna da direita fora do repositório e passe ao código só o que
mudar uma regra. Um "não" no item 1 é um bloqueio.

| # | O que | Esperado |
|---|---|---|
| 1 | A fatura de `installmentCount: 12` | 12x fixo numa compra só |
| 2 | `creditCardToken` no `PAYMENT_CONFIRMED` | Presente |
| 3 | Cobrança pelo token | Renova sem pedir o cartão |
| 4 | Recusa pelo token | 4xx, nenhuma cobrança criada |
| 5 | Estorno do parcelamento | Dispara `PAYMENT_REFUNDED` |
| 6 | `callback.successUrl` | Volta para `/plans?pago=1` |
| 7 | `dateCreated[ge]` | Filtra e pagina |
| 8 | `DELETE /installments/{id}` com parcela `OVERDUE` | Remove |

## 2. Banco

```bash
supabase db push --linked
```

Este é o de produção: só com o pedido explícito do dono, depois do §1. Aplica
`20261101120000_cobranca_asaas.sql` (e, antes dela, as que ainda não subiram).
**A migração vai antes de qualquer uma das quatro Edges**: todas leem as colunas
e as tabelas novas.

Ela só acrescenta: `add column if not exists`, `create table if not exists` e
o `create or replace` das duas funções. Nenhum `drop`, nenhum dado muda, e a
lista de gatilhos do `garantir_escrita` não é tocada.

Depois, as conferências, **uma por vez**: o SQL Editor mostra só o resultado do
último comando. Todas só leem.

**O interruptor continua desligado.** O passo mais importante:

```sql
select enforced_since from public.billing_settings;
```

Uma linha, com `enforced_since` **nulo**. Se vier com data, **pare**: a cobrança
já estaria ligada. Volte com o §7.

**As colunas novas existem.**

```sql
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'billing_subscriptions'
  and column_name in ('reembolsavel_ate', 'asaas_customer_id', 'card_token', 'card_last4', 'card_brand',
                      'ultimo_ip', 'checkout_ref', 'checkout_url', 'checkout_criado_em', 'nfse_para')
order by 1;
```

Dez linhas.

**As três tabelas têm RLS e nenhuma política.**

```sql
select c.relname as tabela, c.relrowsecurity as rls,
       (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname) as politicas
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('billing_subscriptions', 'billing_events', 'billing_parcelamentos')
order by 1;
```

Três linhas, com `rls = true` e `politicas = 0`.

**Nenhuma é alcançada por `anon` ou `authenticated`.**

```sql
select r.papel, t.tabela,
       has_table_privilege(r.papel, 'public.' || t.tabela, 'select,insert,update,delete') as alcanca
from unnest(array['anon', 'authenticated']) as r(papel),
     unnest(array['billing_subscriptions', 'billing_events', 'billing_parcelamentos']) as t(tabela);
```

Seis linhas, todas com `alcanca = false`.

**O token, o cliente do Asaas e o IP não são legíveis pelo cliente.**

```sql
select r.papel, c.coluna,
       has_column_privilege(r.papel, 'public.billing_subscriptions', c.coluna, 'select') as le
from unnest(array['anon', 'authenticated']) as r(papel),
     unnest(array['card_token', 'asaas_customer_id', 'ultimo_ip', 'checkout_ref']) as c(coluna);
```

Oito linhas, todas com `le = false`. Se alguma vier `true`, **pare**: alguém deu
um `grant` na tabela. Rode `revoke all on public.billing_subscriptions from
anon, authenticated;` e confira de novo.

**`meu_plano()` não devolve esses campos.**

```sql
select pg_get_functiondef('public.meu_plano()'::regprocedure)
       ~ '(card_token|ultimo_ip|asaas_customer_id|checkout_ref)' as vaza;
```

Esperado: `false`.

**As funções seguem com os mesmos donos.**

```sql
select
  has_function_privilege('authenticated', 'public.meu_plano()', 'execute') as meu_plano,
  has_function_privilege('anon', 'public.meu_plano()', 'execute') as meu_plano_anon,
  has_function_privilege('authenticated', 'public.tem_plano_proprio(uuid)', 'execute') as proprio_authenticated,
  has_function_privilege('authenticated', 'public.billing_lancar()', 'execute') as lancar_authenticated;
```

Esperado: `true`, `false`, `false`, `false`. Se `lancar_authenticated` vier
`true`, **pare**: qualquer pessoa logada ligaria a cobrança.

**A `tem_plano_proprio` conta a renovação em espera.**

```sql
select pg_get_functiondef('public.tem_plano_proprio(uuid)'::regprocedure)
       like '%b.current_period_end > now() or b.grace_until > now()%' as conta_a_espera;
```

Esperado: `true`.

**As linhas que já existiam não mudaram.**

```sql
select provider, status, count(*) from public.billing_subscriptions group by 1, 2 order by 1, 2;
```

Antes do lançamento, só os vitalícios do Bloco 4 (`manual`, `active`), ou
nenhuma linha.

**O cron é o do Bloco 4.**

```sql
select jobname, schedule, command from cron.job where jobname = 'billing-daily';
```

Uma linha, com `0 12 * * *` (9h em Brasília) e
`select public.invoke_edge_function('billing-daily')`. A migração deste bloco
não mexe no cron.

## 3. Segredos e funções

**Os segredos.** Cadastre os valores no painel (Dashboard › Edge Functions ›
Secrets), não na linha de comando: o histórico do terminal guardaria a chave.

| Segredo | Valor | Quem lê |
|---|---|---|
| `ASAAS_API_URL` | `https://api-sandbox.asaas.com/v3` no Sandbox, `https://api.asaas.com/v3` em produção | `billing-checkout`, `billing-cancel`, `asaas-webhook` (estorno), `billing-daily` |
| `ASAAS_API_KEY` | A chave da conta (Sandbox ou produção) | As mesmas |
| `ASAAS_WEBHOOK_TOKEN` | De 32 a 255 caracteres, sem espaço, sem sequência simples e diferente da chave | `asaas-webhook` |
| `ASAAS_NFSE_SERVICO_CODIGO` | O código do serviço da configuração fiscal | `billing-daily` |
| `ASAAS_NFSE_SERVICO_NOME` | O nome do serviço | `billing-daily` |

`APP_BASE_URL`, `CRON_SECRET` e os do Resend já existem. Confira só os nomes:

```bash
supabase secrets list
```

**Sem os segredos, nada quebra:** a `billing-checkout` responde 503 "A
assinatura ainda não está disponível.", o reembolso responde 503, a
`asaas-webhook` responde 401 a tudo, e o `billing-daily` registra o que pulou
nos logs. Sem os dois segredos da nota, ele escreve um `console.error` por dia
("NFS-e pulada") e segue.

**Em produção, antes do lançamento**, cadastre o `ASAAS_WEBHOOK_TOKEN` e
publique as funções. A chave de produção (`ASAAS_API_URL` e `ASAAS_API_KEY`)
pode esperar a tokenização aprovada: até o 2.0 ir para `main`, ninguém chega ao
"Assinar".

**As funções.** O `_shared` vai embutido em cada função no deploy. Os módulos
novos deste bloco são `_shared/billing.ts` e `_shared/asaas.ts`, e só estas
quatro funções os importam. Nenhum módulo antigo do `_shared` mudou.

```bash
supabase functions deploy billing-checkout asaas-webhook billing-cancel billing-daily --use-api
```

| Função | Por quê |
|---|---|
| `billing-checkout` | Nova. O checkout (JWT da pessoa; recusa o convidado antes de chamar o Asaas) |
| `asaas-webhook` | Nova. Os eventos do Asaas (o `asaas-access-token`) |
| `billing-cancel` | Nova. Cancelar, desfazer e reembolsar (JWT da pessoa) |
| `billing-daily` | Estendida. Lê as colunas novas: por isso sobe depois da migração |

As três novas têm `verify_jwt = false` em `supabase/config.toml` e fazem a
própria autenticação.

**Teste de fumaça**, com a cobrança ainda desligada:

```sql
select public.invoke_edge_function('billing-daily');
```

Nos logs da `billing-daily`, a resposta agora é
`{"ok":true,"avisos":0,"failures":0,"renovadas":0,"aguardando":0,"falhas":0,"expiradas":0,"notas":0,"estornos":0}`.
O `{"pulado":"desligado"}` do Bloco 4 saiu: com o interruptor desligado, só o
aviso do teste fica de fora.

O webhook sem o token recusa sem tocar no banco:

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST "<URL_DAS_FUNCOES>/asaas-webhook" -d '{}'
```

Esperado: `401`.

## 4. O webhook no painel do Asaas

Em Integrações › Webhooks, um webhook novo (um no Sandbox, para o ramo, e outro
em produção):

- **URL:** `<URL_DAS_FUNCOES>/asaas-webhook`;
- **Token de autenticação** (`authToken`): o mesmo valor de
  `ASAAS_WEBHOOK_TOKEN`. O painel só o mostra na criação;
- **Tipo de envio:** `SEQUENTIALLY` (sequencial). O código depende de o
  `PAYMENT_CONFIRMED` chegar antes do `PAYMENT_REFUNDED`;
- **Eventos:** `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_REFUNDED` e
  `PAYMENT_CHARGEBACK_REQUESTED`. Outro evento não faz mal (o webhook responde
  200 e não muda nada), mas ocupa a fila.

**Cadastre o segredo e publique a função antes de criar o webhook.** Sem eles, o
Asaas recebe 401, e depois de 15 falhas seguidas a fila daquele webhook pausa.
Os eventos ficam guardados por 14 dias. Para reativar: Integrações › Webhooks ›
o webhook › reativar a fila.

Só o 200 conta como entregue. O código responde 200 a tudo o que repetir não
resolveria (evento de outra pessoa, corpo ilegível, evento repetido, estorno
que falhou) e 500 só a erro do banco, que o Asaas reenvia.

## 5. "Bateu ou devolvemos"

No 1º mês pago, a garantia é um processo manual do suporte. O app não tem botão
para ela.

1. **O estorno sai pelo painel do Asaas**: Cobranças › o parcelamento da pessoa ›
   estornar **o parcelamento inteiro**. Não estorne uma parcela só: qualquer
   `PAYMENT_REFUNDED` do parcelamento do plano expira a conta, e o resto ficaria
   cobrado.
2. **O webhook faz o resto.** O `PAYMENT_REFUNDED` leva a linha a `expired`, com
   o fim do período em agora. A conta volta ao teste, se ainda estiver nele, ou
   à só leitura.
3. **O app não avisa a pessoa nesse caminho**: o aviso "Reembolso confirmado" só
   sai do reembolso pela tela. Escreva para ela.
4. **A nota fiscal.** Depois dos 7 dias de arrependimento, a NFS-e daquele
   período já foi agendada. Cancele-a no painel (Notas fiscais › cancelar). O
   cron não emite de novo para uma linha expirada.

Uma contestação no cartão (`PAYMENT_CHARGEBACK_REQUESTED`) também expira a
linha.

## 6. Ligar a cobrança: só no lançamento do 2.0

**Só quando o front do 2.0 estiver em `main`**, em produção, e com tudo isto
pronto:

- a Vercel Pro (§0);
- a tokenização aprovada em produção e as respostas do §0 sem bloqueio;
- `ASAAS_API_URL` e `ASAAS_API_KEY` de produção, e o webhook de produção (§4);
- os segredos da nota e a configuração fiscal;
- os vitalícios do dono e da família inseridos (Bloco 4, §3);
- a região do Supabase conferida no Cofre (Bloco 4, §4).

No SQL Editor do painel (a função é só da service role, e o SQL Editor roda
como `postgres`):

```sql
select public.billing_lancar();
```

Ele grava `enforced_since = now()` uma vez só. **Quem já usa o app ganha 14 dias
a partir desse instante**, e quem se cadastrar depois, 14 dias a partir do
cadastro. A partir daí, o `billing-daily` manda o aviso do dia 12, e quem não
assinar fica em só leitura no 15º dia.

Confira:

```sql
select enforced_since from public.billing_settings;
```

Uma linha, com a data de agora.

## 7. Reverter

```sql
update public.billing_settings set enforced_since = null;
```

Todo mundo volta ao `familia` na hora, ninguém é barrado e o aviso do teste
para. Três cuidados:

- **Quem já assina continua sendo cobrado.** Os passos do Asaas no
  `billing-daily` não leem o interruptor: a renovação pelo token segue. Para
  parar a cobrança também, apague o `ASAAS_API_KEY` dos segredos (o checkout e o
  reembolso respondem 503, e as linhas com token são puladas, com log) e
  devolva o que for preciso pelo painel (§5).
- **Ligar de novo recomeça o teste de todo mundo**: o `billing_lancar()` grava
  um instante novo, e os 14 dias contam dele.
- Nada se apaga: as linhas, os parcelamentos e os eventos ficam.

## 8. Acompanhar

Depois do lançamento, uma vez por semana, e sempre depois de um problema no
Asaas. Tudo só lê.

**Nenhum estorno pendente parado.**

```sql
select count(*) as parados from public.billing_parcelamentos
where estorno_status = 'pendente' and estorno_tentado_em < now() - interval '2 days';
```

Esperado: `0`. A tabela não guarda quando o estorno foi pedido:
`estorno_tentado_em` é a última tentativa, que o cron renova a cada execução.
Um pendente com a tentativa velha quer dizer que o cron não está tentando (o
cron parado, ou a Edge sem `ASAAS_API_URL`/`ASAAS_API_KEY`). Um pendente que o
cron tenta todo dia e não conclui aparece nos logs como "estorno cliente" ou
"estorno estorno". Veja a lista:

```sql
select installment, subscription_id, criado_em, estorno_tentado_em
from public.billing_parcelamentos where estorno_status = 'pendente' order by criado_em;
```

O que ficar mais de dois dias se resolve à mão: estorne pelo painel do Asaas, e
o cron seguinte vê o estorno feito, marca `feito` e avisa a pessoa.

**Nenhuma espera vencida.**

```sql
select count(*) as espera_vencida from public.billing_subscriptions
where status = 'active' and grace_until < now() - interval '1 day';
```

Esperado: `0`. O cron expira a espera no fim da tolerância.

**As notas saíram.**

```sql
select count(*) as sem_nota from public.billing_subscriptions
where provider = 'asaas' and status = 'active' and provider_ref is not null
  and nfse_para is distinct from provider_ref
  and (reembolsavel_ate is null or reembolsavel_ate < now() - interval '2 days');
```

Esperado: `0`. Uma linha com estorno no parcelamento também conta aqui, de
propósito: nota de venda devolvida não se emite.

**Os logs que pedem atenção**, nas Edges `billing-daily` e `asaas-webhook`:

| Log | O que é |
|---|---|
| `renovação recusada` | O Asaas devolveu 4xx na cobrança por token. Um 401 ou 403 é chave errada, e um 429 é limite de requisições: nenhum é cartão recusado, mas a linha vai a `past_due` e a pessoa recebe o aviso do cartão (lacuna 85) |
| `cobrança incerta` | Rede, 5xx ou prazo estourado na cobrança por token: a linha espera e é conferida no dia seguinte |
| `fatura do checkout paga, esperando o webhook` | O cron não cobra o token porque a fatura já foi paga. Se repetir por dias, o webhook se perdeu: reenvie o evento pelo painel do Asaas |
| `parcelamento desconhecido` | Um pagamento de outra linha com a nossa referência. Não ativa nada |
| `pagamento em dobro, estornando` | A Ruling 8 em ação: confira o estorno no painel |
| `NFS-e pulada` · `agendarNota` | A nota não saiu: segredo faltando, ou o Asaas recusou |
| `aviso sem carteira pessoal` | A pessoa não tem carteira pessoal, e o aviso não saiu |

## 9. Compatibilidade com o front de `main`

Conferido no código de `main` (`git grep` de `meu_plano`, `billing_` e `asaas`
em `src/` e `supabase/functions`): **nada lê, escreve ou chama o que este bloco
cria.** O front de `main` não chama a `meu_plano()`.

| O que muda no banco | Por que `main` não sente |
|---|---|
| Colunas novas em `billing_subscriptions` | Só a service role alcança a tabela |
| `billing_events`, `billing_parcelamentos` | Tabelas novas, só da service role |
| `tem_plano_proprio` | Com `enforced_since` nulo, `plano_do_usuario` e `workspace_plan` devolvem `familia` antes de chamá-la |
| `meu_plano()` com quatro campos a mais | `main` não a chama |
| Edges novas | `main` não as chama |
| `billing-daily` estendida | Sem linha do Asaas, os passos novos não fazem nada; o aviso do teste segue desligado |

**O 2.0 roda contra um banco sem esta migração** (Ruling 8 do 7B). Os campos
novos de `meu_plano()` são lidos com `?? null`, e uma Edge que ainda não subiu
(o 404 do gateway) aparece como "Ainda não disponível.".

## 10. Com o front

Com o front do 2.0 no ar (ou no ramo de teste), confira com uma conta de teste:

- **`/plans` com origem `teste` ou `nenhuma`** mostra o formulário (nome como no
  cartão e CPF) e "Assinar". O CPF some do campo depois do envio, e uma recusa
  do servidor aparece em português;
- **o convidado** (Bloco 7A) não vê "Assinar". Quem é dono de uma carteira e
  convidado noutra vê o botão e recebe "Seu acesso vem de quem te convidou. Peça
  para essa pessoa cuidar do plano." (lacuna 84);
- **com uma fatura aberta há menos de um dia**, "Continuar o pagamento" abre a
  mesma fatura;
- **a volta** por `/plans?pago=1` consulta o plano a cada 5 segundos, por até 2
  minutos;
- **com o plano ativo**, "Renova em DD/MM/AAAA: 12x de R$ …", o cartão final,
  "Cancelar a renovação" e, nos 7 primeiros dias, "Pedir reembolso (7 dias)";
- **cancelar** mostra "Termina em DD/MM/AAAA" e "Desfazer o cancelamento";
- **o reembolso** pede a confirmação "O valor volta para o cartão em até 10 dias
  úteis e a conta volta ao estado de antes da compra.";
- **`/privacidade`** diz que o CPF e o cartão vão direto ao Asaas, o que
  guardamos e que a NFS-e é emitida pelo Asaas, e **`/cofre`** tem a linha do
  plano e da cobrança.

**O que fica de fora, de propósito.** O Pix Automático (depois de o CNPJ
completar 6 meses), o mensal, o "bateu ou devolvemos" automático (§5) e a
troca de cartão sem pagar (o cartão novo só entra pela fatura). As lacunas
conhecidas estão na seção 19 de `docs/JORNADAS.md`, da 78 à 90.
