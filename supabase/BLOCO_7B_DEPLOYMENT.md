# Publicar o Bloco 7B: gasto privado e titular do cartão

Reúne a compra privada entre adultos e o titular do cartão:

- a migração `20261030120000_privado.sql`:
  - a coluna `credit_cards.holder_user_id` (nula é o "cartão da casa") e os
    gatilhos `conferir_titular` e `conferir_titular_troca`: o titular é adulto
    da carteira, e só o dono o define ou troca;
  - a coluna `transactions.is_private` (padrão falso) e a tabela
    `transacoes_privadas` (a descrição, a categoria e o `capture_meta` da
    privada, que só o autor lê);
  - os gatilhos `guardar_privado`, `guardar_privado_depois` e
    `recusar_conta_na_privada`, que valem a regra de onde o privado vale, movem
    os detalhes para fora da linha da casa e deixam nela a palavra fixa
    `Gasto pessoal`, sem categoria e sem `capture_meta`;
  - as políticas de `update` e `delete` de `transactions` (só o autor mexe numa
    privada), as quatro de `credit_card_statement_totals` (a conferência do
    cartão com titular), as de `attachments` e as do storage (o anexo da
    privada de outra pessoa e o da fatura de um cartão com titular), os
    helpers `conferencia_liberada`, `anexo_oculto` e `objeto_de_anexo_oculto`, e
    `virar_assinatura` e `virar_conta` redefinidas para deixar a privada de fora;
- as Edges: os detectores de insight e a captura não leem o original da privada,
  o aviso de lançamento novo diz "{valor} — Gasto pessoal de {nome}", e os avisos
  de um cartão com titular que carregam dado do banco vão só ao titular e aos
  donos (`leitoresDoCartao`, em `_shared/destinatarios.ts`). **Nenhuma Edge
  nova, nenhum cron novo, nenhum segredo novo**;
- no front do 2.0: a chave "Privado" no lançamento, o "Gasto pessoal de {nome}"
  nas listas e na conferência, o seletor de titular no cadastro e na edição do
  cartão (só o dono) e a conferência da fatura fechada para quem não é titular
  nem dono.

**Estado em 25/10/2026: nada publicado.** O front do `finance-app-2.0` também
não: ele só vai para `main`, e para produção, quando os blocos planejados
estiverem prontos (decisão do dono).

**A migração sobe antes das Edges, e o front do 2.0 não depende dela.** Cinco
Edges leem `transactions.is_private` ou `credit_cards.holder_user_id`: com a
migração ausente, o `select` falha por coluna inexistente e o aviso, a captura ou
os insights param. Na ordem contrária nada quebra: uma Edge antiga, depois da
migração, lê a linha já mascarada e não vaza nada. O front do 2.0 foi feito para
rodar contra um banco **sem** esta migração (Ruling 8): as colunas novas só
entram em consulta `*` ou tolerante, e o corpo de escrita só cita `is_private` e
`holder_user_id` quando a pessoa muda algo. Sem a migração, a chave "Privado" e o
seletor de titular aparecem, mas marcar ou escolher falha; por isso aplique a
migração antes de o dono testar.

**O SQL nunca rodou contra um banco.** Nem o pgTAP roda nesta máquina ou na CI: a
RLS e os gatilhos são trancados por testes de fonte sobre a migração
(`src/lib/privado/migracao-privado.test.ts`), que leem o texto do SQL, não o
comportamento. Antes da produção, valide a migração num ramo de teste ou num
projeto descartável (§1.1). O ponto que mais merece olho é o `set_config`
local do caminho do upsert.

Faça na ordem. Todo SQL abaixo cabe como está no SQL Editor: ele não leva id,
chave nem URL, e nada precisa ser trocado. O SQL Editor roda como `postgres`, sem
RLS: as contagens veem todas as linhas. **Nunca** salve no repositório o resultado
de uma conferência (o repositório é público).

## 0. Pré-requisitos

- **Os Blocos 3A, 3B, 4, 5, 6A, 6B e 7A vão antes, ou junto.** A migração do 7B é
  a última da fila; se as outras ainda não subiram, o `db push` aplica todas em
  ordem. Duas dependências importam: ela recria políticas de `transactions`,
  `attachments`, `storage.objects` e `credit_card_statement_totals` a partir do
  estado final do 7A (`20261029120000_papeis.sql`), e redefine `virar_assinatura`
  e `virar_conta` a partir do corpo do 6B (`20261028120000_insights.sql`).
- **As Edges de cada bloco levam o código do repositório inteiro.** Se o roteiro
  do 7A (`BLOCO_7A_DEPLOYMENT.md`) ainda não foi rodado, publicar `capture`,
  `notify-transaction-created` ou `evaluate-credit-card-alerts` por ele já traz o
  código do 7B, que lê as colunas novas. Nesse caso aplique as **duas** migrações
  do 7A e a do 7B (um `db push` só) antes de qualquer Edge.
- **A CLI** do Homebrew, 2.121 ou mais nova, com o projeto ligado
  (`supabase link`, uma vez só). Sem Docker nesta máquina, as funções sobem pela
  API (`--use-api`).
- **Os tipos** (`src/types/database.ts`) foram editados à mão neste bloco, porque
  o `npm run db:types` precisa do banco local. Depois da migração aplicada num
  banco local ou de teste, rode o `db:types` e confira o diff: ele deve só
  reordenar.
- **Nenhum segredo novo.** As Edges usam a mesma service role e os mesmos
  `CRON_SECRET` de sempre. O `supabase/config.toml` não mudou.
- **O banco de desenvolvimento é o de produção.** Não rode nada disto sem o
  pedido explícito do dono.

## 1. Migração

### 1.1. Antes da produção: um ramo de teste

Valide num ramo de teste do Supabase ou num projeto descartável, com as
migrações aplicadas até a do 7B, e **só lá** (os passos abaixo gravam dado).

Primeiro, a premissa do `set_config` local, que não toca dado e pode rodar em
qualquer banco. O `guardar_privado` guarda os detalhes de um insert em
`privado.t<md5>` com `set_config(..., true)`, dentro de uma função com
`set search_path`, e o `guardar_privado_depois` os lê na mesma transação:

```sql
create function pg_temp.guarda_local() returns void
language plpgsql security definer set search_path = ''
as $$ begin perform pg_catalog.set_config('privado.tprobe', 'ok', true); end $$;

begin;
select pg_temp.guarda_local();
select current_setting('privado.tprobe', true) as sobrevive_a_funcao;
rollback;
```

Esperado: `ok`. Vazio quer dizer que o valor local não sobrevive à saída da
função com `search_path` próprio, e **a migração não pode subir**: o insert de uma
privada perderia a descrição e a categoria originais.

Depois, com o front do 2.0 apontado para o ramo, duas contas de teste (uma dona e
uma membro) numa carteira compartilhada de teste:

1. A dona lança uma despesa em **Pix** com a chave "Privado": a descrição na lista
   da membro é "Gasto pessoal de {nome}", sem categoria, e o valor entra no total
   do mês das duas. A dona vê a descrição e a categoria originais.
2. **O caminho do upsert.** O cliente grava com `upsert` em `workspace_id,client_id`.
   Lance uma privada **sem conexão** e reconecte, ou reenvie a mesma gravação (o
   mesmo `client_id`), para o `insert ... on conflict` cair no `update`. A dona
   continua vendo a descrição original, e a conferência `detalhe_igual_a_mascara`
   do §3 dá `0`.
3. A dona edita a privada (muda o valor e o texto) e depois desmarca "Privado": a
   descrição e a categoria originais voltam à linha, e o detalhe sai de
   `transacoes_privadas`.
4. A membro tenta editar e excluir a privada da dona: a tela avisa que só quem
   lançou muda um gasto privado, e a linha continua igual.
5. Pix, débito, dinheiro e o cartão de que a dona é titular marcam; o cartão da
   casa, o de outro titular, TED, uma assinatura e uma parcelada não (a chave vem
   desabilitada com o motivo, e o banco recusa a escrita direta com
   `PRIVADO_NAO_PERMITIDO`).
6. O dono define a dona como titular de um cartão: só o titular e o dono veem o
   total do banco e abrem o PDF da conferência; a membro vê "Só o titular do
   cartão e o dono da carteira conferem esta fatura." e não recebe o aviso de
   fatura com total do banco.
7. Rode as conferências do §1.3 e do §3.

### 1.2. Aplicar

```bash
supabase db push --linked
```

Aplica `20261030120000_privado.sql` (e, antes dela, as que ainda não subiram).

Ela só acrescenta: duas colunas com padrão (`is_private` falso, titular nulo), uma
tabela nova, gatilhos e helpers novos, e as políticas e as duas RPCs recriadas
com um ramo a mais. Nenhum `drop table`, nenhum `drop column`. Os gatilhos de
`guardar_privado` saem na primeira linha com `is_private` falso e não leem mais
nada, e os de `credit_cards` só disparam com titular. Até o 2.0 marcar uma compra
ou escolher um titular, nada muda para quem usa o `main` (§5).

### 1.3. Conferir, uma por vez

O SQL Editor mostra só o resultado do último comando.

**Nada mudou para quem usa o app.** Logo depois do `db push` nenhuma compra é
privada e nenhum cartão tem titular.

```sql
select
  (select count(*) from public.transactions where is_private) as privadas,
  (select count(*) from public.transacoes_privadas) as detalhes,
  (select count(*) from public.credit_cards where holder_user_id is not null) as cartoes_com_titular;
```

Esperado: `0`, `0` e `0`. Depois que alguém marcar uma privada ou escolher um
titular, esta é a conferência de contagem do §3.

**As colunas existem, com os padrões.**

```sql
select table_name, column_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'credit_cards' and column_name = 'holder_user_id')
    or (table_name = 'transactions' and column_name = 'is_private')
  )
order by 1, 2;
```

Esperado: duas linhas. `holder_user_id` aceita nulo, sem padrão; `is_private` é
`NO` e o padrão é `false`.

**Os cinco gatilhos existem e estão ligados.**

```sql
select c.relname as tabela, t.tgname as gatilho, t.tgenabled as ligado
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
where not t.tgisinternal
  and t.tgname in (
    'guardar_privado', 'guardar_privado_depois', 'recusar_conta_na_privada',
    'conferir_titular', 'conferir_titular_troca'
  )
order by 1, 2;
```

Esperado: cinco linhas (`bill_instances`/`recusar_conta_na_privada`,
`credit_cards`/`conferir_titular` e `conferir_titular_troca`,
`transactions`/`guardar_privado` e `guardar_privado_depois`), todas com `ligado`
`O`.

**As funções são `security definer` e têm o `search_path` vazio.**

```sql
select proname, prosecdef as definer, coalesce(proconfig::text, '') like '%search_path%' as com_search_path
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in (
    'guardar_privado', 'guardar_privado_depois', 'recusar_conta_na_privada',
    'conferir_titular', 'conferencia_liberada', 'anexo_oculto', 'objeto_de_anexo_oculto'
  )
order by 1;
```

Esperado: sete linhas, as duas colunas `true`.

**Os gatilhos do titular guardam a regra.** O titular é adulto da carteira, e só o
dono o define:

```sql
select
  pg_get_functiondef('public.conferir_titular()'::regprocedure) like '%TITULAR_SO_DONO%' as so_dono,
  pg_get_functiondef('public.conferir_titular()'::regprocedure) like '%TITULAR_NAO_ADULTO%' as so_adulto,
  pg_get_functiondef('public.guardar_privado()'::regprocedure) like '%PRIVADO_NAO_PERMITIDO%' as recusa_privado,
  pg_get_functiondef('public.guardar_privado()'::regprocedure) like '%set_config%' as guarda_o_upsert;
```

Esperado: `true` nas quatro. Um `false` quer dizer que a função antiga continua no
banco: rode o `db push` de novo.

**Quem tem titular tem um titular adulto.** Só leitura:

```sql
select count(*) as titular_fora_da_carteira
from public.credit_cards c
where c.holder_user_id is not null
  and not exists (
    select 1 from public.workspace_members m
    where m.workspace_id = c.workspace_id
      and m.user_id = c.holder_user_id
      and m.role in ('owner', 'member')
  );
```

Esperado: `0`. Uma linha é um titular que saiu da carteira ou virou convidado
depois de ser escolhido (lacuna 66 de `docs/JORNADAS.md`): troque o titular pela
tela, como dono.

**A política de `transactions` protege a privada.** A mudança do 7B no `update` e
no `delete` é o ramo do adulto `(not is_private or user_id = auth.uid())`:

```sql
select policyname, cmd,
  (coalesce(qual, '') || coalesce(with_check, '')) like '%is_private%' as protege_privada
from pg_policies
where schemaname = 'public'
  and tablename = 'transactions'
  and cmd in ('UPDATE', 'DELETE', 'ALL')
order by 2;
```

Esperado: `UPDATE` e `DELETE`, as duas com `protege_privada` `true`. Um `false`
quer dizer que a seção 5 da migração não subiu, e um membro no `main` mexeria na
privada de outro pelo `update` direto: rode-a de novo.

**O ramo do convidado do 7A continua inteiro.** A migração recriou as mesmas
políticas, então repita as duas conferências de `transactions` do §1 de
`BLOCO_7A_DEPLOYMENT.md` ("Nenhuma política de `transactions` sem o ramo do
convidado" e "O convidado só lança despesa"). O esperado não mudou: nenhuma linha
na primeira, e `so_despesa` `true` no `INSERT` e no `UPDATE` na segunda.

**A tabela dos detalhes tem RLS, e só o autor a lê.**

```sql
select c.relrowsecurity as rls,
  has_table_privilege('anon', 'public.transacoes_privadas', 'select') as anon_le,
  has_table_privilege('authenticated', 'public.transacoes_privadas', 'truncate') as authenticated_trunca
from pg_class c
where c.oid = 'public.transacoes_privadas'::regclass;
```

Esperado: `true`, `false` e `false`.

```sql
select policyname, cmd, roles::text as papeis,
  (coalesce(qual, '') || coalesce(with_check, '')) like '%auth.uid()%' as do_autor
from pg_policies
where schemaname = 'public' and tablename = 'transacoes_privadas'
order by 2;
```

Esperado: quatro linhas (`DELETE`, `INSERT`, `SELECT`, `UPDATE`), todas para
`authenticated` e com `do_autor` `true`. Nenhuma política deixa outro adulto ler
o detalhe.

**A conferência do cartão com titular.** Os totais do banco e o PDF:

```sql
select cmd,
  (coalesce(qual, '') || coalesce(with_check, '')) like '%conferencia_liberada%' as so_titular_e_dono
from pg_policies
where schemaname = 'public' and tablename = 'credit_card_statement_totals'
order by 1;
```

Esperado: quatro linhas (`DELETE`, `INSERT`, `SELECT`, `UPDATE`), todas `true`.

```sql
select policyname, cmd,
  (coalesce(qual, '') || coalesce(with_check, '')) like '%anexo_oculto%' as esconde_o_oculto
from pg_policies
where schemaname = 'public' and tablename = 'attachments'
order by 2;
```

Esperado: três linhas (`DELETE`, `INSERT`, `SELECT`), todas `true`.

**Os helpers não abrem para o `anon`.**

```sql
select
  has_function_privilege('anon', 'public.conferencia_liberada(uuid, uuid)', 'execute') as conferencia_anon,
  has_function_privilege('authenticated', 'public.conferencia_liberada(uuid, uuid)', 'execute') as conferencia_authenticated,
  has_function_privilege('anon', 'public.anexo_oculto(uuid, uuid)', 'execute') as anexo_anon,
  has_function_privilege('anon', 'public.objeto_de_anexo_oculto(text)', 'execute') as objeto_anon,
  has_function_privilege('authenticated', 'public.guardar_privado()', 'execute') as gatilho_authenticated;
```

Esperado, na ordem: `false`, `true`, `false`, `false`, `false`. Os gatilhos não são
chamáveis pelo app; só disparam.

**As políticas do storage subiram.** O bloco `do $$ … exception when
insufficient_privilege` da seção "7. anexos" recria as duas políticas de
`storage.objects`. Se o papel da migração não for dono de `storage.objects` (o
caso que o `BLOCO_2_DEPLOYMENT.md` já registrou neste projeto), o bloco só emite o
aviso `privado: sem privilégio para as políticas de storage.objects; aplique pelo
SQL editor do Dashboard.`, é desfeito em silêncio, e o `db push` termina sem erro.

```sql
select policyname, cmd,
  coalesce(qual, '') like '%objeto_de_anexo_oculto%' as esconde_o_oculto,
  coalesce(qual, '') like '%is_workspace_adult%' as adulto
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname in ('Workspace members can view attachments', 'Workspace members can delete attachments')
order by 1;
```

Esperado: duas linhas, com `esconde_o_oculto` e `adulto` `true` nas duas.

Se vier `false`, faltar uma linha ou o log do `db push` trouxer o aviso acima, **as
políticas do 7A continuam valendo**: o anexo de uma privada, e o PDF de um cartão
com titular, ficam legíveis e apagáveis por todo adulto pelo storage (o `list`, o
`download` e o `remove` são do bucket, e a RLS de `attachments` não os protege).
Rode no SQL Editor o bloco `do $$ ... $$` da seção "7. anexos" de
`20261030120000_privado.sql` (copie do arquivo; é só o trecho de
`storage.objects`, depois das políticas de `public.attachments`) e confira de
novo. **Ninguém marca uma privada com anexo nem escolhe um titular antes de esta
conferência dar `true` nas duas.**

## 2. Funções

O `_shared` vai embutido em cada função no deploy: toda função que importa um
módulo mudado, direta ou indiretamente, precisa ser publicada de novo. Os módulos
mudados neste bloco são:

| Módulo | O que mudou |
|--------|-------------|
| `destinatarios.ts` | Ganhou `leitoresDoCartao(membros, titular, usaBanco)`: os adultos e, com titular e dado do banco, só o titular e os donos (o titular que saiu da carteira some). Continua sem import |
| `insights/detectores.ts` | `Lanc.is_private`: recorrência, atípico, duplicidade, preço e sazonal ignoram a privada (a fatura e os totais a contam) |
| `process-transaction-notification.ts` | O select ganhou `is_private`, e na privada o corpo é `{valor} — Gasto pessoal de {nome}` |
| `transaction-notify-rules.ts` | O tipo da linha ganhou `is_private` |

**Como a lista foi feita:** para cada `supabase/functions/*/index.ts`, foram
seguidos os `import` relativos, diretos e através do `_shared`, até o fim, e o
resultado foi cruzado com os arquivos mudados desde o fim do 7A:

```bash
git diff d79e35d7..HEAD --name-only -- supabase/functions
```

(`d79e35d7` é o último commit do 7A; refaça a conta com os imports de cada
`index.ts`, ou com `grep -rn "destinatarios\|detectores\|process-transaction-notification\|transaction-notify-rules" supabase/functions`.)

| Função | Alcança | O que muda para ela |
|--------|---------|---------------------|
| `notify-transaction-created` | `process-transaction-notification`, `transaction-notify-rules` e `destinatarios` (o `index.ts` não mudou) | **Depois da migração.** Lê `is_private`; o aviso de uma privada diz "{valor} — Gasto pessoal de {nome}". Uma despesa comum sai igual |
| `capture` | o `index.ts` mudou | **Depois da migração.** O histórico que casa a frase ignora as privadas (`.eq('is_private', false)`), as do autor também: elas chegam mascaradas e não têm nada para casar |
| `evaluate-credit-card-alerts` | `destinatarios`; o `index.ts` mudou | **Depois da migração.** Lê `holder_user_id`; o aviso de limite com o total do banco, de um cartão com titular, vai só ao titular e aos donos. O alerta por categoria e o cartão da casa seguem a todos os adultos |
| `credit-card-calendar-alerts` | `destinatarios`; o `index.ts` mudou | **Depois da migração, e só com o front** (§7 de `BLOCO_5_DEPLOYMENT.md`). Os avisos de um cartão com titular que carregam o total do banco (fechou, vence, vence hoje e fatura alta) vão só ao titular e aos donos; o "fecha em breve" e a fechada sem total gravado vão a todos |
| `insights-daily` | `destinatarios`, `insights/detectores`; o `index.ts` mudou | **Depois da migração, e só com o front** (`BLOCO_6B_DEPLOYMENT.md`). Os detectores ignoram a privada, e o `fatura_fechou` de um cartão com titular vira um insight do titular e de cada dono (`user_id`), e não da carteira |

**As duas que não entram.** `evaluate-budgets` e `evaluate-bills-reminders`
alcançam o `destinatarios.ts`, mas só ganharam o `leitoresDoCartao` embutido,
que nenhuma das duas usa: o comportamento é o mesmo, e a publicação não é
necessária. As demais (`activity-logs`, `attachments-cleanup`, `billing-daily`,
`delete-user`, `ia-ler`, `push-subscribe`, `push-unsubscribe`, `review-reminder`,
`run-recurring-billing`, `sessions` e as três de convite) não alcançam nenhum
módulo mudado e não tiveram o `index.ts` mudado.

**O código de cada função é o do repositório inteiro.** Se os Blocos 5, 6A, 6B e
7A ainda não subiram, publicar uma função traz também o que esses blocos mudaram
nela, e valem as restrições dos roteiros deles. A `credit-card-calendar-alerts` e
a `insights-daily` só sobem com o front do 2.0.

**Ordem:** primeiro as migrações (§1), depois as Edges, e o front por último.
Depois da migração, as três que não esperam o front:

```bash
supabase functions deploy capture notify-transaction-created evaluate-credit-card-alerts --use-api
```

Quando o front do 2.0 subir (se as outras duas já subiram por um roteiro anterior,
estas são as únicas pendentes):

```bash
supabase functions deploy credit-card-calendar-alerts insights-daily --use-api
```

**Até o front subir, nada daqui aparece para ninguém**, porque nenhuma compra é
privada nem nenhum cartão tem titular. As três Edges do primeiro comando só
passam a ler as colunas novas.

## 3. Conferência pós-deploy

Só leitura. Estas são as conferências que valem a partir do momento em que
alguém marca a primeira privada ou escolhe o primeiro titular.

**A privada está mascarada na linha.** Nenhuma linha de `transactions` com
`is_private` pode ter outra descrição, uma categoria ou um `capture_meta`:

```sql
select count(*) as privadas_sem_mascara
from public.transactions
where is_private
  and (description is distinct from 'Gasto pessoal' or category_id is not null or capture_meta is not null);
```

Esperado: `0`. Qualquer número acima disso é o original à mostra para todo
adulto: pare, e veja se o gatilho `guardar_privado` está ligado (§1.3).

**Cada privada tem o seu detalhe, e só ela.**

```sql
select
  (select count(*) from public.transactions where is_private) as privadas,
  (select count(*) from public.transacoes_privadas) as detalhes,
  (select count(*) from public.transactions t
     where t.is_private
       and not exists (select 1 from public.transacoes_privadas d where d.transaction_id = t.id)) as sem_detalhe,
  (select count(*) from public.transacoes_privadas d
     join public.transactions t on t.id = d.transaction_id
     where not t.is_private) as detalhe_solto;
```

Esperado: `privadas` igual a `detalhes`, e `0` nas duas últimas. Uma privada sem
detalhe perdeu o original; um detalhe solto sobrou de uma privada desmarcada.

**O detalhe guarda o original, e não a máscara.** É a conferência do caminho do
upsert (§1.1): no conflito, o `update` recebe o `excluded` já mascarado.

```sql
select count(*) as detalhe_igual_a_mascara
from public.transacoes_privadas
where description is null or description = 'Gasto pessoal';
```

Esperado: `0`. No ramo de teste, qualquer valor acima é o bug do upsert: a
descrição original foi trocada pela máscara. Em produção, só vale se alguém
digitou literalmente "Gasto pessoal" como descrição.

**Toda privada está onde o privado vale.**

```sql
select count(*) as privada_fora_da_regra
from public.transactions t
left join public.credit_cards c on c.id = t.payment_credit_card_id
where t.is_private
  and not (
    t.type = 'expense'
    and t.subscription_id is null
    and t.installment_plan_id is null
    and not exists (select 1 from public.bill_instances b where b.transaction_id = t.id)
    and (
      t.payment_method in ('pix', 'debit_card', 'cash')
      or (t.payment_method = 'credit_card' and c.holder_user_id = t.user_id)
    )
  );
```

Esperado: `0`. Uma linha é, quase sempre, um cartão que perdeu o titular depois de
a compra ser marcada (a privada continua privada: lacuna 66); o gatilho só confere
na escrita. Qualquer outro motivo é um caminho de escrita que passou sem o gatilho.

**O titular e as políticas, de novo.** As conferências de `holder_user_id`,
`transactions`, `credit_card_statement_totals`, `attachments` e `storage.objects`
do §1.3, na mesma ordem: um `db push` posterior, ou alguém no Dashboard, pode ter
recriado as políticas do 7A. Em especial as duas do storage.

**Os logs das Edges.** Em Dashboard → Edge Functions → `notify-transaction-created`,
`capture` e `evaluate-credit-card-alerts` → Logs, um `column ... does not exist`
com `is_private` ou `holder_user_id` quer dizer que a Edge subiu antes da
migração: aplique a migração (§1.2), e a próxima execução volta ao normal.

**Nenhum aviso de fatura com o total do banco chegou a quem não é titular nem
dono.** Não há consulta para isso: o `metadata` do aviso varia por tipo. Depois do
primeiro cartão com titular e da primeira fatura fechada com total gravado, abra o
sino da conta de um membro adulto que não é titular nem dono: ele não deve ter o
aviso de fatura fechada, de vencimento, de fatura acima do normal nem de limite
daquele cartão. O "fecha em breve" chega a todos, de propósito (Ruling 6).

## 4. O que não fazer neste bloco

**Não marque, nem desmarque, privado por SQL, e não mexa em
`transacoes_privadas` de gente de verdade.** O SQL Editor roda como `postgres`,
sem `auth.uid()`, e o gatilho deixa passar a checagem de "só o autor". Para
desfazer uma privada marcada por engano, a pessoa desmarca "Privado" na tela. Em
emergência, como `postgres`: `update public.transactions set is_private = false
where id = '<id>';` devolve a descrição, a categoria e o `capture_meta` e apaga o
detalhe.

**Não escolha o titular por SQL.** O gatilho do titular confere o adulto, mas o
SQL Editor passa pela regra do dono. Escolha pela tela, como dono.

**Tire o titular do cartão antes de tirar a pessoa da carteira, ou de rebaixá-la
a convidada.** O titular só é conferido na escrita: quem sai continua titular no
banco (lacuna 66). Sem o titular, só o dono confere a fatura daquele cartão.

**Não apague o detalhe de uma privada a mão.** A linha de `transactions` fica
`Gasto pessoal` para sempre, sem o original. Desmarque pela tela.

**Limpar a categoria de uma privada não faz nada.** Para a linha, nulo já é a
máscara; quem precisa dessa mudança desmarca, edita e marca de novo.

**Não publique o `credit-card-calendar-alerts` nem o `insights-daily` antes do
front do 2.0**, como nos Blocos 5 e 6B: os links dos avisos não existem no `main`.

## 5. Compatibilidade com o front de `main`

Conferido no código de `main` (`git grep` de `is_private`, `holder_user_id`,
`transacoes_privadas`, `conferencia_liberada`, `anexo_oculto` e `guardar_privado`
em `src/` e `supabase/`): **nada lê, escreve ou chama o que este bloco cria.**

| O que muda no banco | Por que `main` não sente |
|---|---|
| `credit_cards.holder_user_id` (nula) | Coluna nova; `main` lê os cartões por lista explícita e não a pede. O cartão sem titular é "da casa": a conferência e o PDF seguem abertos a todo adulto |
| `transactions.is_private` (padrão falso) | Coluna nova com padrão; o insert de `main` não a manda, e o gatilho `guardar_privado` sai na primeira linha com a coluna falsa, sem ler nada |
| `transacoes_privadas` | Tabela nova; `main` não a consulta. Ninguém escreve nela sem marcar uma privada |
| Políticas de `transactions` | O ramo do adulto ganhou `(not is_private or user_id = auth.uid())`: sem privada, é verdadeiro sempre, e o resultado é o de hoje. O ramo do convidado não mudou |
| Políticas de `credit_card_statement_totals`, `attachments` e `storage.objects` | A conferência (`conferencia_liberada`) é verdadeira para o cartão da casa, e o `anexo_oculto` é falso sem privada: o resultado é o de hoje para toda carteira sem titular |
| `virar_assinatura` e `virar_conta` | Os mesmos corpos do 6B, com `not is_private` entre os candidatos: sem privada, o mesmo resultado |
| Edges | Sem privada e sem titular, as cinco Edges respondem como antes; a única diferença é uma coluna a mais no `select` |

**Depois que existir uma privada** (só o front do 2.0 a cria), o `main` a vê como
"Gasto pessoal", sem categoria, com o valor em todos os totais, e não consegue
editar nem excluir a de outra pessoa nem pelo `update` direto. Na edição da
própria privada pelo `main`, ele devolve a máscara, e o gatilho a trata como "sem
mudança": o original fica. Mudar o método de uma privada para TED ou outro pelo
`main` é recusado com `PRIVADO_NAO_PERMITIDO`.

## 6. Com o front

Quando o front do 2.0 subir e as Edges estiverem no ar (§2), confira com duas
contas de teste (uma dona e uma membro), numa carteira compartilhada de teste:

- **A chave "Privado".** No formulário de despesa da dona, a chave aparece com
  Pix, débito, dinheiro e com o cartão de que ela é titular. No cartão da casa, no
  de outro titular, no TED, na parcelada e na assinatura, ela vem desabilitada, com
  o motivo embaixo. Na receita e no lançamento do convidado, não aparece;
- **O que a outra pessoa vê.** A membro lê "Gasto pessoal de {nome da dona}" e o
  valor, sem categoria, na lista, no Painel, no cartão, no sino e na conferência
  da fatura. O total do mês, o seguro para gastar e a fatura são os mesmos antes e
  depois de marcar. A tela de categoria perde a linha (lacuna 62). A membro não
  edita nem exclui a privada, e a tela diz que só quem lançou muda um gasto
  privado;
- **O que a dona vê.** A descrição e a categoria originais, em todas as telas, e
  o Cofre exporta o original. Desmarcar devolve tudo à linha;
- **Os anexos.** O anexo de uma privada some para a membro (a lista e o storage);
- **O titular.** Só a dona vê o seletor, no cadastro e na edição do cartão, com os
  adultos da carteira e "Cartão da casa". A membro que tenta definir o titular
  pelo app não vê o seletor, e pela API recebe `TITULAR_SO_DONO`. Num cartão com
  titular, a membro que não é titular nem dona vê "Só o titular do cartão e o dono
  da carteira conferem esta fatura." e não vê o total do banco;
- **Os avisos.** A despesa privada da dona avisa a membro com "{valor} — Gasto
  pessoal de {nome}". O aviso de fatura fechada, de limite e o insight "fatura
  fechou" de um cartão com titular chegam só ao titular e aos donos;
- **Os insights.** Uma privada repetida (três meses do mesmo gasto pessoal) não
  vira recorrência, atípico nem duplicidade, e o texto "Gasto pessoal" não vira
  assinatura nem conta;
- **A captura.** O Atalho do iPhone lança normalmente, e a frase não casa o
  histórico com uma privada.

**O que fica de fora, de propósito.** O `project_id` (a divisão do 7C) entra na
regra do gatilho quando existir a coluna (Ruling 2); a divisão por quem pagou e o
responsável que paga pelo convidado também são do 7C. A carteira pessoal continua
sendo a privacidade total, e a chave não a distingue. As lacunas conhecidas (o
filtro e a busca pelo original, a categoria e o orçamento, o titular que não se
tira sozinho, o objeto do anexo que fica até a limpeza, o insight da fatura só
com o titular e os donos, o titular que saiu) estão na seção 18 de
`docs/JORNADAS.md`.
