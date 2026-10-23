# Publicar o Bloco 4: planos, só leitura e confiança

Reúne o direito de uso do app, em desligado, e as telas de confiança:

- a migração `20261025120000_planos.sql`: `billing_settings` (o interruptor
  `enforced_since`), `billing_subscriptions` (uma linha por pessoa) e
  `billing_avisos`; as funções `tem_plano_proprio`, `tem_cobertura`,
  `plano_do_usuario`, `workspace_plan` (agora de verdade), `meu_plano()` e
  `avisos_de_teste_pendentes`; o gatilho `garantir_escrita` (o "só leitura") e o
  `origem_do_cron` (`source = 'recurring'`); a coluna
  `user_settings.jornada_concluida_em`; o cron `billing-daily`;
- a Edge nova `billing-daily` (o aviso do dia 12 do teste) e o campo `essencial`
  do `deliverNotification`, que o aviso de plano usa;
- no front do 2.0: `/precos` (pública), `/plans` com a situação do plano, a
  faixa de "só leitura", `/piloto`, `/cofre` e `/comecar`.

**O gateway de pagamento não está neste bloco.** Ele é do Bloco 8 (Asaas).
Até lá ninguém consegue assinar, o botão "Assinar" aparece desabilitado e
`enforced_since` continua nulo: **ninguém é barrado**.

**Estado em 23/10/2026: nada publicado.** O front do `finance-app-2.0` também
não: ele só vai para `main`, e para produção, quando os blocos planejados
estiverem prontos (decisão do dono).

**O backend do Bloco 4 pode subir antes do front.** Nada dele muda o que o
front de `main` faz:

- com `billing_settings.enforced_since` nulo, `plano_do_usuario` e
  `workspace_plan` devolvem `familia` antes de ler qualquer outra coisa, e o
  gatilho `garantir_escrita` nunca lança erro;
- o `origem_do_cron` passa a gravar `recurring` nos lançamentos de plano ou
  assinatura que já existiam, mas nenhuma tela de `main` lê a origem;
- o `billing-daily` sai cedo (`pulado: 'desligado'`) enquanto não há
  lançamento;
- `capture` e `ia-ler` já devolvem 402 quando `workspace_plan <> 'familia'`, e
  isso só acontece depois do lançamento.

Faça na ordem. Todo SQL abaixo leva marcadores: troque-os no SQL Editor e
**nunca** salve o SQL preenchido no repositório (ele é público). O único
marcador deste roteiro é o `<USER_ID>`.

## 0. Pré-requisitos

- **Os Blocos 3A e 3B vão antes, ou junto.** A `workspace_plan` substitui o stub
  do 3A (mesma assinatura, mesmos grants), e o `origem_do_cron` e o
  `garantir_escrita` leem `workspace_installment_plans` e
  `workspace_subscriptions`. Se eles ainda não subiram, o `db push` aplica as
  migrações em ordem (captura, ia, planos): faça as conferências dos três
  roteiros depois dele.
- **A CLI** do Homebrew, 2.121 ou mais nova, com o projeto ligado
  (`supabase link`, uma vez só). Sem Docker nesta máquina, as funções sobem pela
  API (`--use-api`).
- **O Vault** com `edge_functions_url` e `cron_secret` (Bloco 1), e a Edge com o
  segredo `CRON_SECRET`: o cron `billing-daily` chama a Edge pela
  `public.invoke_edge_function`, como o `review-reminder`. Confira só os nomes:

  ```sql
  select name from vault.secrets where name in ('edge_functions_url', 'cron_secret');
  ```

  Duas linhas. E, na CLI, `supabase secrets list` com `CRON_SECRET` (só o nome,
  nunca o valor).

## 1. Migração

```bash
supabase db push --linked
```

Aplica `20261025120000_planos.sql` (e, antes dela, as do 3A e do 3B, se ainda
não subiram). Depois, rode as conferências **uma por vez**: o SQL Editor mostra
só o resultado do último comando.

**O interruptor está desligado.** Este é o passo mais importante do roteiro:

```sql
select enforced_since from billing_settings;
```

Uma linha, com `enforced_since` **nulo**. Se vier com data, **pare**: o app já
barraria quem não tem plano. Não rode nada do passo 5.

**Todo mundo é `familia` enquanto estiver desligado.**

```sql
select public.plano_do_usuario('<USER_ID>'), public.workspace_plan(w.id)
from public.workspaces w
limit 1;
```

Esperado: `familia` nas duas colunas.

**As três tabelas têm RLS e nenhuma é alcançada por `anon` ou `authenticated`.**

```sql
select r.papel, t.tabela,
       has_table_privilege(r.papel, 'public.' || t.tabela, 'select,insert,update,delete') as alcanca
from unnest(array['anon', 'authenticated']) as r(papel),
     unnest(array['billing_settings', 'billing_subscriptions', 'billing_avisos']) as t(tabela);
```

Seis linhas, todas com `alcanca = false`. Se alguma vier `true`, pare e rode de
novo o `revoke all on public.<tabela> from anon, authenticated;` dela (seção 1
de `20261025120000_planos.sql`).

**As funções internas são só da service role.**

```sql
select
  has_function_privilege('authenticated', 'public.plano_do_usuario(uuid)', 'execute') as plano_authenticated,
  has_function_privilege('authenticated', 'public.billing_lancar()', 'execute') as lancar_authenticated,
  has_function_privilege('authenticated', 'public.avisos_de_teste_pendentes()', 'execute') as avisos_authenticated,
  has_function_privilege('service_role', 'public.billing_lancar()', 'execute') as lancar_service_role;
```

Esperado: as três primeiras `false` e `lancar_service_role` `true`. Se alguma
das três vier `true`, **pare**: qualquer pessoa logada ligaria a cobrança ou
leria o plano de outra. Rode de novo o `revoke` e o `grant` da função na
migração.

**A pessoa logada alcança só o `meu_plano()` e a `workspace_plan`.**

```sql
select
  has_function_privilege('authenticated', 'public.meu_plano()', 'execute') as meu_plano,
  has_function_privilege('authenticated', 'public.workspace_plan(uuid)', 'execute') as workspace_plan,
  has_function_privilege('anon', 'public.meu_plano()', 'execute') as meu_plano_anon;
```

Esperado: `true`, `true`, `false`.

**Os gatilhos existem.**

```sql
select tgrelid::regclass as tabela, tgname
from pg_trigger
where tgname in ('garantir_escrita', 'origem_do_cron') and not tgisinternal
order by 1, 2;
```

Cinco linhas: `garantir_escrita` em `transactions`,
`workspace_installment_plans`, `workspace_subscriptions` e `attachments`, e
`origem_do_cron` em `transactions`.

**O cron existe.**

```sql
select jobname, schedule, command from cron.job where jobname = 'billing-daily';
```

Uma linha, com `0 12 * * *` (12h UTC, 9h em Brasília) e
`select public.invoke_edge_function('billing-daily')`. Se faltar, ligue o
`pg_cron` (Database → Extensions) e rode no SQL Editor o bloco
`do $cron$ ... $cron$` do fim de `20261025120000_planos.sql` (copie do arquivo).

**A coluna da jornada existe.**

```sql
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'user_settings' and column_name = 'jornada_concluida_em';
```

Uma linha.

## 2. Funções

O `_shared` vai embutido em cada função no deploy: toda função que importa um
módulo mudado precisa ser publicada de novo. Os módulos mudados neste bloco são
`deliver-notification.ts` (ganhou o `essencial`) e `notification-types.ts`
(ganhou o `canaisDoAviso`), e o `plano.ts` é novo.

**Como a lista foi feita:** para cada `supabase/functions/*/index.ts`, foram
seguidos os `import` relativos, diretos e através do `_shared`, até o fim, e
ficou na lista toda função que alcança `_shared/deliver-notification.ts` ou
`_shared/notification-types.ts`. Entram oito, e a `billing-daily` é a nova:

```bash
supabase functions deploy billing-daily credit-card-calendar-alerts evaluate-bills-reminders evaluate-budgets evaluate-credit-card-alerts notify-transaction-created review-reminder workspace-invites-accept --use-api
```

| Função | Por quê |
|--------|---------|
| `billing-daily` | Nova. O aviso do dia 12 do teste, pelo `deliverNotification` com `essencial: true` |
| `credit-card-calendar-alerts` | Importa `deliver-notification.ts` |
| `evaluate-bills-reminders` | Importa `deliver-notification.ts` |
| `evaluate-budgets` | Importa `deliver-notification.ts` |
| `evaluate-credit-card-alerts` | Importa `deliver-notification.ts` |
| `notify-transaction-created` | Importa `deliver-notification.ts` |
| `review-reminder` | Importa `deliver-notification.ts` |
| `workspace-invites-accept` | Importa `deliver-notification.ts` |

A mudança no `deliverNotification` só acrescenta o `essencial`, desligado por
padrão: publicar de novo as outras sete não muda o que elas fazem, mas deixa o
código no ar igual ao do repositório.

As outras funções não alcançam esses módulos e não precisam de deploy
(`capture` e `ia-ler` já respondem 402 quando `workspace_plan <> 'familia'`;
a migração é que passa a decidir isso). O `verify_jwt = false` da
`billing-daily` está em `supabase/config.toml`: ela se autentica pelo
`x-cron-secret` e só o cron a chama.

**Teste de fumaça da Edge**, com a cobrança ainda desligada. Dispare o cron na
mão, pelo SQL Editor:

```sql
select public.invoke_edge_function('billing-daily');
```

Nos logs da função (Dashboard → Edge Functions → `billing-daily` → Logs), a
resposta é `{"ok":true,"pulado":"desligado"}`. Nenhum aviso sai.

## 3. O vitalício do dono e da família

O vitalício é uma linha `manual`, `active`, com `current_period_end` nulo. Só
tem efeito depois do lançamento; pode (e deve) ser inserido antes. Uma linha por
pessoa, e o `<USER_ID>` é o `id` dela em `auth.users` (Dashboard →
Authentication → Users):

```sql
insert into public.billing_subscriptions (user_id, provider, status, current_period_end)
values ('<USER_ID>', 'manual', 'active', null);
```

Repita para cada pessoa que fica de graça. A migração cria a linha com
`plan = 'familia'` e `interval = 'year'` por padrão. Uma pessoa não entra duas
vezes (`user_id` é único).

Confira:

```sql
select user_id, provider, status, current_period_end
from public.billing_subscriptions
order by created_at;
```

E, depois do lançamento, a pessoa logada vê "Plano Família vitalício" em `/plans`
(`meu_plano()` devolve `origem = 'vitalicio'`).

## 4. Região do Supabase e o Cofre

O Cofre aberto (`/cofre`) diz onde cada dado mora. Hoje o texto é "região a
confirmar". Confira em Dashboard → Project Settings → General → Region.

- **Se for `sa-east-1` (São Paulo)**, troque, em
  `src/components/wireframe/cofre-aberto-wireframe.tsx`, "região a confirmar"
  por "no Brasil", nas seis linhas, e a data da política em
  `privacidade-wireframe.tsx` (`ATUALIZADA_EM`) se o texto de lá mudar.
- **Se for outra**, escreva o nome da região no lugar de "a confirmar" e diga na
  privacidade que o armazenamento também é uma transferência internacional.

Isso é uma mudança de código: vai no front do 2.0, antes de ele subir.

## 5. O que não fazer neste bloco

**Não rode `billing_lancar()`.** Ele liga a cobrança (`enforced_since = now()`),
começa o teste de 14 dias de todo mundo e passa a barrar a escrita de quem não
tem plano. Ele é do **Bloco 8**, junto com o gateway, o botão "Assinar" ligado e
o front de `main` já trocado pelo do 2.0. Rodá-lo agora barraria, no front de
`main` (que não tem a faixa de "só leitura" nem a mensagem), quem não tem plano,
sem caminho para assinar.

Se rodou por engano, desligue na hora:

```sql
update public.billing_settings set enforced_since = null;
```

## 6. Compatibilidade com o front de `main`

| O que muda no banco | Por que `main` não sente |
|---|---|
| `workspace_plan` deixa de ser o stub | Com `enforced_since` nulo devolve `familia`, como o stub |
| Gatilho `garantir_escrita` em 4 tabelas | Nunca lança com a cobrança desligada; sem `auth.uid()` (crons, `delete-user`) e em cascata passa sempre |
| Gatilho `origem_do_cron` | Só troca `app` por `recurring` em lançamento de plano ou assinatura que já existia; `main` não lê a origem |
| `user_settings.jornada_concluida_em` | Coluna nova, opcional |
| Tabelas `billing_*` | Só a service role alcança |
| `deliverNotification` com `essencial` | Desligado por padrão |

## 7. Depois do front

Quando o front do 2.0 subir, confira com a cobrança ainda desligada:

- `/precos` abre sem entrar, com os links para `/register` e `/login`;
- `/plans` mostra "Plano Família" e "Tudo liberado até o lançamento da
  assinatura" (sem o botão "Assinar" enquanto a origem é `livre`; depois do
  lançamento ele aparece desabilitado, com "A assinatura abre no lançamento",
  até o Bloco 8);
- a faixa de "só leitura" **não** aparece em nenhuma conta;
- `/cofre` baixa o ZIP e `/piloto` lista o que o app lançou sozinho;
- o cartão "Veja o que o app faz por você" aparece no Painel de quem ainda não
  concluiu, e some depois de "Concluir", "Pular" ou "Agora não".
