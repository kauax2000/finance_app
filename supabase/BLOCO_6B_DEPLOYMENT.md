# Publicar o Bloco 6B: insights

Reúne o motor de insights:

- a migração `20261028120000_insights.sql`: as tabelas `insights`,
  `insights_silenciados` e `insights_push_semana`; as funções
  `reivindicar_push_de_insight`, `marcar_insight`, `registrar_insight`,
  `inserir_insights`, `virar_assinatura` e `virar_conta`; o tipo `'insight'` no
  check de `notifications`; a coluna `workspace_member_notification_prefs.
  notify_insights`; e o cron `insights-daily` (`0 13 * * *`, 10h em Brasília);
- a Edge nova `insights-daily`, que acha os fatos de cada carteira, grava os
  insights e avisa os membros;
- o `semPush` no `deliverNotification` e o tipo `insight` no
  `notification-types.ts` (o teto de push);
- no front do 2.0: a caixa de insights no Painel, as ações de um toque (criar
  assinatura ou conta ligando os lançamentos passados, atualizar o preço, apagar
  um lançamento duplicado, ver a fatura, a previsão ou os itens a conferir),
  "Dispensar este", "Não mostrar mais este tipo" e a chave "Insights" nas
  preferências de aviso.

**Estado em 25/10/2026: nada publicado.** O front do `finance-app-2.0` também
não: ele só vai para `main`, e para produção, quando os blocos planejados
estiverem prontos (decisão do dono).

**A migração sobe antes de tudo, e a Edge `insights-daily` só sobe junto com o
front do 2.0.** Os links dos avisos (`/previsao`, a caixa do Painel,
`/bills?new=1`) não existem no front de `main`: um insight avisado antes do front
levaria a uma página que não existe. É a mesma regra do aviso de fatura alta do
Bloco 5. Como a migração só acrescenta, o front de `main` continua funcionando
com ela (a tabela do §5 mostra o porquê).

Faça na ordem. Todo SQL abaixo cabe como está no SQL Editor: ele não leva id,
chave nem URL, e nada precisa ser trocado. **Nunca** salve no repositório o
resultado de uma conferência (o repositório é público).

## 0. Pré-requisitos

- **Os Blocos 3A, 3B, 4, 5 e 6A vão antes, ou junto.** A migração do Bloco 6B é
  a última da fila; se os outros ainda não subiram, o `db push` aplica todas em
  ordem. Faça as conferências dos roteiros anteriores depois dele.
- **A CLI** do Homebrew, 2.121 ou mais nova, com o projeto ligado
  (`supabase link`, uma vez só). Sem Docker nesta máquina, as funções sobem pela
  API (`--use-api`), e o pgTAP não roda aqui: as conferências do §1 cobrem o
  mesmo chão.
- **Nenhum segredo novo.** A `insights-daily` usa a mesma service role e o mesmo
  `CRON_SECRET` das outras funções de cron, e o cron usa o Vault que o
  `invoke_edge_function` já lê (`edge_functions_url` e `cron_secret`).
- **O `verify_jwt = false` da `insights-daily`** está em `supabase/config.toml`:
  só o cron a chama, com o `x-cron-secret`, e ela mesma o confere.

## 1. Migração

```bash
supabase db push --linked
```

Aplica `20261028120000_insights.sql` (e, antes dela, as que ainda não subiram).
Depois, rode as conferências **uma por vez**: o SQL Editor mostra só o resultado
do último comando.

**As três tabelas existem, com RLS ligada.**

```sql
select c.relname, c.relrowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('insights', 'insights_silenciados', 'insights_push_semana')
order by 1;
```

Esperado: três linhas, todas com `true`.

**A chave de dedupe é única.** É ela que impede o mesmo fato de virar dois
insights em dias seguidos, e o insight descartado de voltar.

```sql
select indexname, indexdef
from pg_indexes
where schemaname = 'public' and tablename = 'insights' and indexname = 'insights_dedupe_uidx';
```

Esperado: uma linha, `UNIQUE INDEX`, sobre `workspace_id`, `coalesce(user_id, …)`,
`kind` e `dedupe_key`.

**As funções têm o alcance certo.** O envio do push e a gravação do cron são só
da service role; as ações da pessoa, só de quem está logado.

```sql
select
  has_function_privilege('service_role', 'public.reivindicar_push_de_insight(uuid, date)', 'execute') as reivindicar_service,
  has_function_privilege('authenticated', 'public.reivindicar_push_de_insight(uuid, date)', 'execute') as reivindicar_authenticated,
  has_function_privilege('service_role', 'public.inserir_insights(jsonb)', 'execute') as inserir_service,
  has_function_privilege('authenticated', 'public.inserir_insights(jsonb)', 'execute') as inserir_authenticated,
  has_function_privilege('authenticated', 'public.marcar_insight(uuid, text)', 'execute') as marcar_authenticated,
  has_function_privilege('anon', 'public.marcar_insight(uuid, text)', 'execute') as marcar_anon,
  has_function_privilege('authenticated', 'public.registrar_insight(uuid, text, text, jsonb)', 'execute') as registrar_authenticated,
  has_function_privilege('anon', 'public.registrar_insight(uuid, text, text, jsonb)', 'execute') as registrar_anon,
  has_function_privilege('authenticated', 'public.virar_assinatura(uuid, text, numeric, smallint, text, uuid, uuid)', 'execute') as assinatura_authenticated,
  has_function_privilege('anon', 'public.virar_assinatura(uuid, text, numeric, smallint, text, uuid, uuid)', 'execute') as assinatura_anon,
  has_function_privilege('authenticated', 'public.virar_conta(uuid, text, smallint, boolean, uuid, date)', 'execute') as conta_authenticated,
  has_function_privilege('anon', 'public.virar_conta(uuid, text, smallint, boolean, uuid, date)', 'execute') as conta_anon;
```

Esperado, na ordem: `true`, `false`, `true`, `false`, `true`, `false`, `true`,
`false`, `true`, `false`, `true`, `false`. Se `reivindicar_authenticated` ou
`inserir_authenticated` vier `true`, **pare**: as duas são `security definer`, e
qualquer pessoa logada poderia gastar o teto de push de outra ou gravar insight
em qualquer carteira. Rode de novo os `revoke` do arquivo da migração.

**Ninguém escreve direto na tabela.**

```sql
select
  has_table_privilege('authenticated', 'public.insights', 'insert') as insert_authenticated,
  has_table_privilege('authenticated', 'public.insights', 'update') as update_authenticated,
  has_table_privilege('authenticated', 'public.insights', 'delete') as delete_authenticated,
  has_table_privilege('authenticated', 'public.insights_push_semana', 'select') as teto_authenticated;
```

Esperado: quatro `false`.

**O tipo `insight` entrou no check, sem tirar nenhum.**

```sql
select pg_get_constraintdef(oid) as definicao
from pg_constraint
where conrelid = 'public.notifications'::regclass and conname = 'notifications_type_check';
```

Esperado: a lista traz `transaction`, `budget`, `system`, `promotion`,
`credit_card`, `bill`, `review` e `insight`.

**A preferência nasce ligada.**

```sql
select notify_insights, count(*)
from public.workspace_member_notification_prefs
group by notify_insights;
```

Esperado: uma linha só, `true`, com a contagem de preferências. Uma linha `false`
logo depois da migração quer dizer que alguém já desligou pelo front novo (o
banco de desenvolvimento é o de produção).

**O cron está agendado.**

```sql
select jobname, schedule, command
from cron.job
where jobname = 'insights-daily';
```

Uma linha, com `0 13 * * *` e `select public.invoke_edge_function('insights-daily')`.

### O cron fica na migração

O `invoke_edge_function` é assíncrono (`pg_net`) e captura qualquer erro: ele
devolve o id do pedido e nunca falha o job. Enquanto a Edge `insights-daily` não
existe, a chamada só deixa uma linha com status 404 em `net._http_response` (o
`pg_net` guarda as respostas por pouco tempo). **Nenhum erro entra no log do cron
e nada acontece no banco.** Por isso o cron não precisa esperar o lançamento: ele
já nasce com a migração, e a Edge, quando subir junto com o front, é apanhada na
próxima rodada das 13h UTC.

Para ver isso, só leitura, depois da primeira 13h UTC com a migração e sem a Edge:

```sql
select status, count(*)
from cron.job_run_details d
join cron.job j on j.jobid = d.jobid
where j.jobname = 'insights-daily'
group by status;
```

Esperado: só `succeeded`. E, se quiser ver o 404:

```sql
select status_code, count(*) from net._http_response group by status_code;
```

Um `404` entre as linhas é a chamada à função ainda ausente (ou a de outro cron
cuja função ainda não subiu). Sem sinal de erro em lugar nenhum.

## 2. Funções

O `_shared` vai embutido em cada função no deploy: toda função que importa um
módulo mudado precisa ser publicada de novo. Os módulos mudados neste bloco são:

| Módulo | O que mudou |
|--------|-------------|
| `deliver-notification.ts` | A opção `semPush` (só in-app) e a coluna `notify_insights` na leitura das preferências |
| `notification-types.ts` | O tipo `insight` e a preferência `notify_insights` |
| `credit-card-cycle.ts` | Ganhou a `invoiceWindowEndingAt`, que a `credit-card-calendar-alerts` tinha por dentro (só moveu, o comportamento é o mesmo) |
| `todas-as-paginas.ts` | Novo: a leitura paginada que a `credit-card-calendar-alerts` tinha por dentro |
| `insights/*.ts` | Novos: só a `insights-daily` os importa |

**Como a lista foi feita:** para cada `supabase/functions/*/index.ts`, foram
seguidos os `import` relativos, diretos e através do `_shared`, até o fim, e
ficou na lista toda função que alcança um desses módulos.

| Função | Alcança | O que muda para ela |
|--------|---------|---------------------|
| `insights-daily` | todos | **Nova.** É o motor |
| `credit-card-calendar-alerts` | `deliver-notification`, `notification-types`, `credit-card-cycle`, `todas-as-paginas` | Só o código movido; o comportamento é o mesmo. **Já sobe só com o front** (§7 de `BLOCO_5_DEPLOYMENT.md`) |
| `billing-daily` | `deliver-notification`, `notification-types` | Nenhum |
| `evaluate-bills-reminders` | `deliver-notification`, `notification-types`, `credit-card-cycle` | Nenhum (sobe com a migração do 6A) |
| `evaluate-budgets` | `deliver-notification`, `notification-types`, `credit-card-cycle` | Nenhum |
| `evaluate-credit-card-alerts` | `deliver-notification`, `notification-types`, `credit-card-cycle` | Nenhum |
| `notify-transaction-created` | `deliver-notification`, `notification-types` | Nenhum |
| `review-reminder` | `deliver-notification`, `notification-types`, `credit-card-cycle` | Nenhum |
| `workspace-invites-accept` | `deliver-notification`, `notification-types` | Nenhum |

`capture` e `ia-ler` alcançam só o `credit-card-cycle.ts`, que apenas ganhou uma
exportação que elas não usam: **não precisam de deploy**. As demais (`activity-logs`,
`attachments-cleanup`, `delete-user`, `push-subscribe`, `push-unsubscribe`,
`run-recurring-billing`, `sessions`, `workspace-invites-create`,
`workspace-invites-resend`) não alcançam nenhum dos módulos.

**Por que as oito existentes ainda assim vão depois da migração.** O
`deliver-notification.ts` novo lê a coluna `notify_insights`, que só a migração
cria. Com a migração aplicada, o comportamento delas é o de antes: o tipo
`insight` só é produzido pela `insights-daily`. Sem republicar, elas seguem
corretas (o bundle antigo não pede a coluna); republicar só alinha o que está no
ar com o repositório. **Não há pressa nem ordem entre elas.**

Quando o front do 2.0 subir, publique tudo de uma vez, depois da migração:

```bash
supabase functions deploy insights-daily credit-card-calendar-alerts evaluate-bills-reminders evaluate-budgets evaluate-credit-card-alerts notify-transaction-created review-reminder billing-daily workspace-invites-accept --use-api
```

Se as outras já subiram com o front por um roteiro anterior, o único comando
indispensável deste bloco é:

```bash
supabase functions deploy insights-daily --use-api
```

O `verify_jwt = false` da `insights-daily` vem do `supabase/config.toml`.

### O que a primeira execução faz

A primeira rodada das 13h UTC depois do deploy olha todas as carteiras. Os
limites do primeiro dia existem para ela não despejar o histórico:

- a **duplicidade** só olha os últimos 30 dias e lançamentos de R$ 10 ou mais;
- **cada carteira recebe no máximo 5 insights novos por execução**, primeiro o
  que mais vale (a fatura e o relatório antes do resto) e, no mesmo tipo, o mais
  recente. O que sobra volta
  nos dias seguintes, enquanto continuar verdade; o que já foi gravado, aceito ou
  descartado não volta;
- **o push tem teto de 3 por semana por pessoa**, somando todas as carteiras
  dela. O quarto aviso da semana chega só no app, no sino e na caixa do Painel.
  Quem não tem aparelho inscrito não gasta o teto.

Uma carteira com muito histórico, portanto, enche a caixa em poucos dias e não de
uma vez. Para rodar na mão, antes do horário (13:00 UTC):

```sql
select public.invoke_edge_function('insights-daily');
```

(a mesma chamada que o cron faz). Rodar duas vezes no mesmo dia não duplica
nada: a chave de dedupe é única. Mas cada execução pode trazer até 5 novos
por carteira, então a segunda rodada do dia pode trazer mais cinco do histórico
que sobrou. Deixar o cron rodar dá o mesmo resultado, só
mais tarde. Uma rodada manual gasta o teto de push da semana como qualquer
outra.

## 3. Conferência pós-deploy

Só leitura.

**A execução rodou.** Nos logs de `insights-daily` (Dashboard → Edge Functions →
`insights-daily` → Logs), a resposta do dia traz `ok: true` e os números
`carteiras`, `novos`, `push`, `inApp` e `falhas`. Uma `falhas` maior que zero
quer dizer que uma carteira ou um aviso falhou; as outras seguem, e o cron do
dia seguinte tenta de novo (o insight já gravado não repete). O relatório do mês
sai no dia 1; se a carteira falhar nesse dia, ele sai no dia 2 (a chave
`rel:{mes}` não deixa repetir).

**Insight gravado sem aviso.** Se a leitura dos membros, das preferências, dos
silêncios ou das inscrições falhar depois do `inserir_insights`, os insights
daquela rodada ficam na caixa do Painel, mas ninguém é avisado deles: amanhã o
`inserir_insights` não os devolve. O log traz `insights-daily: insights sem
aviso` com a carteira e os ids. Não há nova tentativa de propósito: a pessoa
pode ter apagado a notificação, então "sem notificação" não quer dizer "não
avisado". Se o log mostrar isso com frequência, o caminho é uma coluna de
"avisado" no insight.

**Os insights por tipo e estado.**

```sql
select kind, status, count(*)
from public.insights
group by kind, status
order by 1, 2;
```

**Nenhuma carteira passou de 5 insights do cron em uma execução.** O teto é por
execução, não por dia: uma rodada manual mais o cron do mesmo dia são duas
execuções, e juntas podem passar de 5 sem nada errado. Por isso a conferência
agrupa por minuto, que separa as execuções (os insights de uma carteira são
gravados em segundos):

```sql
select workspace_id, date_trunc('minute', created_at) as minuto, count(*)
from public.insights
where kind <> 'seguro_baixo'
group by 1, 2
having count(*) > 5;
```

Esperado: nenhuma linha. O `seguro_baixo` fica de fora porque é o cliente que o
grava, ao abrir o Painel, um por pessoa e mês. Uma linha só quer dizer problema
se vier de uma execução isolada: duas execuções no mesmo minuto se somariam.

**O teto de push vale.**

```sql
select max(enviados) as maximo from public.insights_push_semana;
```

Esperado: `3` no máximo.

**Nenhum insight de carteira repetido.** A chave única impede, e a conferência
mostra se um dia ela foi removida:

```sql
select workspace_id, kind, dedupe_key, count(*)
from public.insights
where user_id is null
group by 1, 2, 3
having count(*) > 1;
```

Esperado: nenhuma linha.

**Nenhum tipo silenciado gerou insight pessoal depois de silenciado** (só o
`seguro_baixo` é pessoal):

```sql
select count(*)
from public.insights i
join public.insights_silenciados s on s.user_id = i.user_id and s.kind = i.kind
where i.created_at > s.criado_em;
```

Esperado: `0`.

## 4. O que não fazer neste bloco

**Não apague insights em massa para "limpar a caixa".** Um insight descartado
fica na tabela de propósito: é a linha dele que impede o mesmo fato de voltar no
dia seguinte. Apagar a linha o faz reaparecer na próxima rodada.

**Não mexa em `insights_push_semana` para "devolver" push.** O contador é o teto
de 3 por pessoa e semana; zerar à mão libera avisos que a pessoa pediu para não
receber em excesso.

**Para parar os insights**, sem apagar nada: tire o cron (a Edge e as tabelas
ficam).

```sql
select cron.unschedule('insights-daily');
```

Para voltar, rode de novo o bloco `do $cron$` do fim da migração.

## 5. Compatibilidade com o front de `main`

Conferido no código de `main` (`git grep` de `insights`, `insights_silenciados`,
`registrar_insight`, `marcar_insight` e `notify_insights` em `src/` e
`supabase/`): **nada lê, escreve ou chama o que este bloco cria.** As únicas
ocorrências da palavra são nomes locais de variável e de componente de texto
("insight" de participação e de fatura), sem relação com a tabela.

| O que muda no banco | Por que `main` não sente |
|---|---|
| Tabelas `insights`, `insights_silenciados`, `insights_push_semana` | Novas; `main` não as consulta |
| As seis funções | Novas; só o front do 2.0 as chama |
| Tipo `insight` no check de `notifications` | O check só aumenta: nenhum tipo antigo sai. Uma notificação desse tipo, se existisse, apareceria no sino de `main` com o ícone padrão (o `fallbackIconByType` cai no sino) e a ação padrão. Como a Edge só sobe com o front, não existe nenhuma |
| `workspace_member_notification_prefs.notify_insights`, padrão `true` | Coluna nova; `main` lê as preferências com a lista explícita de colunas, sem esta, e o `insert` dele não a manda |
| Cron `insights-daily` | Chama uma função que ainda não existe: só deixa um 404 (§1) |

**O ponto de atenção.** Nenhum. Enquanto a Edge não sobe, a migração é
invisível para `main`. O contrário, o front do 2.0 sem a migração, deixa a caixa
vazia (a leitura de uma tabela ausente é tratada) e quebra a chave "Insights" das
preferências de aviso, que pede a coluna `notify_insights`.

## 6. Com o front

Quando o front do 2.0 subir, publique a `insights-daily` (§2) e confira também:

- o Painel mostra a caixa "Insights" (wireframe), com "Nenhum insight agora"
  enquanto a Edge não rodou;
- depois da primeira rodada, cada insight tem **uma ação** ou "Entendi", e "Mais"
  abre "Dispensar este" e "Não mostrar mais este tipo". Nenhum texto usa "culpado"
  nem tom de sermão;
- numa recorrência, "Criar" abre o diálogo com o destino sugerido (cartão ou
  débito automático vira assinatura; Pix, boleto ou dinheiro vira conta a pagar),
  e confirmar liga os lançamentos passados. O insight some e a assinatura ou a
  conta aparece em `/subscriptions` ou `/bills`. Um gasto com o nome de uma
  conta ou assinatura ativa (o "Aluguel" pago por Pix sem ligar à conta
  "Aluguel") não vira recorrência. Na conta, o dia fora de 1–31 e a próxima
  pendente antes de hoje são recusados (`INSIGHT_DIA_INVALIDO`,
  `INSIGHT_DATA_INVALIDA`);
- "Atualizar valor" muda o preço da assinatura; "Apagar um" pede confirmação e
  apaga só um dos dois lançamentos iguais;
- "Ver fatura" abre o cartão, "Ver mês", "Ver previsão" e "Ver o que pesa" (o
  seguro baixo) abrem `/previsao`,
  "Ver lançamentos" abre `/transactions` já filtrado, "Conferir agora" abre
  `/transactions?conferir=1` e "Criar conta a pagar" (o sazonal) abre
  `/bills?new=1`;
- "Entendi" num insight da **carteira** some para todos os membros (o estado é
  um só); "Não mostrar mais este tipo" vale só para quem silenciou, em todas as
  carteiras dela;
- o seguro baixo aparece só no mês corrente, quando o "seguro para gastar" está
  abaixo de 10% da renda do mês, e some quando deixa de estar;
- em Configurações, no bloco tracejado "Insights" logo abaixo das preferências de aviso, a chave liga e desliga os avisos
  desta carteira (a caixa do Painel não depende dela);
- o sino traz "Ver no Painel" nos avisos de insight, ou o link da ação;
- o "a conferir" (mais de 5 itens) aparece no máximo uma vez por semana: a chave
  dele é a segunda-feira da semana, então o mesmo acúmulo não avisa de novo no
  dia seguinte.

**O que fica de fora, de propósito.** O "limite da pessoa" (o gasto passou do
limite de alguém da família) e o "convidado recebe só os insights do próprio
limite" ficam para o Bloco 7, porque o limite por pessoa e o papel `guest` ainda
não existem. O motor já nasce com `user_id` opcional para servi-los. E um
lançamento novo é visto pelo cron do **dia seguinte**, não na hora: é desvio
consciente, para o caminho do lançamento não ganhar mais uma chamada.
