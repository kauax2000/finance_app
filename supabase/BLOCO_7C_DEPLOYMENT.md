# Publicar o Bloco 7C: projetos, modelos de carteira e divisão da conta

Reúne os projetos, os modelos de carteira e a divisão por quem pagou:

- a migração `20261031120000_projetos.sql`:
  - a tabela `projects` (nome, período e orçamento total opcionais, `archived_at`),
    com leitura para todo membro, convidado incluído, e escrita só do adulto;
  - a coluna `transactions.project_id` (`on delete set null`), o gatilho
    `same_ws_project_id` (o projeto é da mesma carteira) e o
    `recusar_projeto_arquivado` (`PROJETO_ARQUIVADO`: o vínculo novo com um
    projeto arquivado é recusado);
  - as colunas de `workspaces`: `purpose` (`everyday` ou `project`), `starts_on`,
    `ends_on`, `budget_total` e `split_mode` (`pooled` ou `split`), com o check
    `workspaces_project_fields` (período e orçamento só na carteira de projeto);
  - `copiar_orcamentos_do_mes` e `garantir_orcamentos_do_mes` redefinidas para
    pular a carteira de projeto;
  - a RPC `criar_carteira_de_modelo(p_modelo, p_nome)` (`security invoker`): os
    modelos Casa, Casal, Viagem, Reforma e Evento, com as categorias de cada um,
    e a Pessoal, que só devolve a carteira pessoal que já existe;
- a migração `20261031130000_divisao.sql`:
  - `transactions.paid_by` e `transactions.shares_manual`, e o gatilho
    `definir_quem_pagou` (o autor por padrão; o responsável, se o autor é
    convidado);
  - `workspaces.split_since` e o gatilho `carimbar_split_since`;
  - a tabela `workspace_split_weights` (os pesos da carteira; sem linha, o peso
    vale 1) e `workspace_installment_plans.split_weights` (a regra da
    parcelada, que mora no plano), com o gatilho `validar_pesos_do_plano`;
  - a tabela `transaction_shares` (as partes de cada despesa, só leitura para o
    app), o algoritmo `dividir_em_partes`, o `refazer_partes`, o gatilho
    `gerar_partes` e o `refazer_partes_do_plano`;
  - a RPC `definir_partes` (as partes escritas à mão) e a tabela `settlements`
    (o acerto entre duas pessoas do saldo, uma delas quem grava);
  - a RPC `saldos_da_carteira` (pago − partes ± acertos);
  - a saída da tabela `transaction_splits`, guardada por uma conferência de
    tabela vazia;
- **nenhuma Edge muda neste bloco** (§2);
- no front do 2.0:
  - `/projetos` e `/projetos/[id]` (criar, lançar, o resumo, arquivar);
  - os modelos no "Nova carteira" e o passo "Criar a Casa" em `/comecar`;
  - o resumo da carteira de projeto no Painel, no lugar do "seguro para gastar";
  - "Quem pagou", "Projeto" e os pesos da parcelada no formulário de despesa;
  - as partes na folha de detalhe;
  - o modo e os pesos em Configurações;
  - o saldo e o acerto no Painel.

**Estado em 25/10/2026: nada publicado.** O front do `finance-app-2.0` também
não: ele só vai para `main`, e para produção, quando os blocos planejados
estiverem prontos (decisão do dono).

**O SQL nunca rodou contra um banco.** Nem o pgTAP roda nesta máquina ou na CI:
não há Postgres local. A RLS, os gatilhos e o algoritmo são trancados por testes
de fonte sobre as migrações (`src/lib/projetos/migracao-projetos.test.ts`,
`src/lib/divisao/migracao-divisao.test.ts`), que leem o texto do SQL, não o
comportamento. **Antes da produção, valide as duas migrações num ramo de teste
ou num projeto descartável (§1.1), rodando o pgTAP `divisao.test.sql` (37 casos)
e as três conferências do algoritmo.** É a primeira vez que este SQL executa.

**A onda final de correções do bloco já está nas duas migrações** (editadas no
lugar, porque nenhuma subiu). O §1.4 confere no banco que ela entrou:

- **Sem `paid_by`, quem pagou é o autor**, no `refazer_partes` (e por ele no
  `refazer_partes_do_plano`) e no `saldos_da_carteira`. A parcela antiga, criada
  antes da migração, e a despesa de quem apagou a conta fecham Σ saldo = 0.
- **Valor, tipo ou carteira mudando zeram o `shares_manual`**, venha de onde vier
  (Ruling 10). Um update cru que liga a marca e muda o valor na mesma frase não
  congela mais partes com a soma antiga. A linha à mão que vai para antes do
  `split_since` também perde a marca e as partes.
- **Acertar com quem saiu da carteira** (Ruling 8): a política de insert de
  `settlements` aceita como partes quem aparece em `saldos_da_carteira` (os
  adultos de hoje e quem saiu mas tem parte, pagamento ou acerto na carteira).
  Quem grava continua sendo adulto atual **e uma das duas partes**. A tela de
  acerto lista quem saiu como "Ex-membro".
- **Os pesos da carteira só mudam pelo dono**: as três políticas de escrita de
  `workspace_split_weights` usam `is_workspace_owner`, e o peso guardado tem de
  ser de um adulto da carteira. A leitura continua de todo adulto.
- **`definir_partes` confere a forma antes de converter**: um id ou um valor
  malformado sai como `PARTES_INVALIDAS`, e não como o `22P02` do cast.

Faça na ordem. Todo SQL abaixo cabe como está no SQL Editor: ele não leva id,
chave nem URL, e nada precisa ser trocado. O SQL Editor roda como `postgres`,
sem RLS: as contagens veem todas as linhas. **Nunca** salve no repositório o
resultado de uma conferência (o repositório é público).

## 0. Pré-requisitos

- **Os Blocos 3A, 3B, 4, 5, 6A, 6B, 7A e 7B vão antes, ou junto.** As duas
  migrações do 7C são as últimas da fila; se as outras ainda não subiram, o
  `db push` aplica todas em ordem. As dependências que importam:
  - `projetos` redefine as duas funções de orçamento a partir do 7A
    (`20261029120000_papeis.sql`), e usa o `assert_same_workspace_ref` do 6A e o
    `is_workspace_adult` do 7A;
  - `divisao` usa `workspace_members.sponsor_user_id` (o responsável do
    convidado, 7A), o `garantir_escrita` do 4 e o `app_today`.
- **A CLI** do Homebrew, 2.121 ou mais nova, com o projeto ligado
  (`supabase link`, uma vez só). Sem Docker nesta máquina, as funções sobem pela
  API (`--use-api`); este bloco não tem função.
- **Os tipos** (`src/types/database.ts`) foram editados à mão neste bloco, porque
  o `npm run db:types` precisa do banco local. Depois das migrações aplicadas num
  banco local ou de teste, rode o `db:types` e confira o diff: ele deve só
  reordenar.
- **Nenhum segredo novo.** Nenhum cron novo. O `supabase/config.toml` não mudou.
- **O banco de desenvolvimento é o de produção.** Não rode nada disto sem o
  pedido explícito do dono.

**Estado em 31/10/2026: só o parcial `supabase/parciais/20261031-divisao-modo-e-pesos.sql` está em produção, aplicado por `db query`: `is_workspace_adult`, `split_mode`, `split_since` com o gatilho, e `workspace_split_weights`. As migrações `20261031120000_projetos.sql` e `20261031130000_divisao.sql` seguem pendentes, sem `migration repair`, e o parcial é idempotente diante delas. Até subirem, o diálogo Divisão trava "Dividida": ele pergunta por `saldos_da_carteira` e solta a opção sozinho quando a RPC existir. A trava é só da tela: gravar `split` por outro caminho guarda o modo sem gerar partes, e a migração não faz retroativo.**

## 1. Migrações

### 1.0. Antes de tudo: a tabela que sai tem de estar vazia

A migração `divisao` termina com `drop table public.transaction_splits`. Antes
do `drop`, um bloco confere que a tabela não tem linha e **recusa a migração
inteira** se tiver (`transaction_splits tem linhas: confira antes de remover`).
Faça a conta antes, para o `db push` não parar no meio:

```sql
select count(*) from public.transaction_splits;
```

Esperado: `0`. Nem o 2.0 nem o `main` leem ou escrevem nessa tabela (só o tipo
gerado a cita), então ela deve estar vazia. **Se vier mais que `0`, pare:** apagar
dado é decisão do dono, não da migração. Veja de onde vieram as linhas, e só
depois decida entre exportá-las e esvaziar a tabela.

Se a tabela já não existir (`relation does not exist`), o resultado é o mesmo: a
migração segue.

### 1.1. Antes da produção: um ramo de teste

Valide num ramo de teste do Supabase ou num projeto descartável, com as
migrações aplicadas até a do 7C, e **só lá**. O pgTAP desfaz o que grava; os
passos 3 e 4 gravam de verdade, por isso só no ramo.

**O projeto ligado (`supabase link`) é o de produção.** Nenhum comando desta
seção leva `--linked`. Todos apontam para a string de conexão do ramo ou do
projeto descartável, copiada do painel dele (Settings › Database), que fica
fora do repositório. Para as migrações chegarem lá:

```bash
supabase db push --db-url "<string de conexão do ramo>"
```

1. **O pgTAP da divisão.** Rode `supabase/tests/database/divisao.test.sql`
   inteiro. O arquivo abre em `begin`, planeja 32 casos (`plan(32)`) e termina
   em `rollback`. Ele supõe a cobrança sem `billing_settings.enforced_since`,
   como os outros testes. Esperado: 32 linhas `ok` e nenhuma `not ok`. Os casos:
   - o algoritmo: R$ 100,00 em três de peso igual, a soma, e os pesos 2 e 1 com
     quem pagou de peso 1 e de peso 2;
   - a carteira dividida: as partes de cada despesa, `paid_by` do convidado igual
     ao responsável, o convidado sem parte e fora de `saldos_da_carteira`;
   - `definir_partes` com `PARTES_NAO_FECHAM` e com `PARTES_INVALIDAS` (id e
     valor malformados), as partes à mão no lugar das automáticas e o `null` de
     volta ao automático;
   - os pesos do plano: `PESOS_INVALIDOS` (repetido, e peso sem a chave), e as
     parcelas automáticas refeitas quando os pesos mudam;
   - o update cru `shares_manual = true, amount = …` numa frase só: as partes
     refazem e fecham o valor novo (Ruling 10);
   - `pooled → split → pooled → split` sem duplicar as partes e sem perder o
     `split_since`, e a despesa de antes dele sem partes;
   - a linha à mão que vai para antes do `split_since` perde as partes e a marca;
   - a parcela com `paid_by` nulo (feita com o gatilho desligado, dentro do
     teste) e os pesos do plano mudando: Σ saldo = 0;
   - a soma dos saldos igual a 0 depois que um membro sai, e o acerto com ele
     aceito; o acerto gravado por quem não é uma das partes, recusado;
   - o peso da carteira escrito por um membro, e o peso de um convidado escrito
     pelo dono, recusados.

   Como rodar, sempre contra o ramo ou o projeto descartável, com a extensão
   `pgtap` criada nele:

   ```bash
   psql "<string de conexão do ramo>" -f supabase/tests/database/divisao.test.sql
   ```

   Numa máquina com Docker, `supabase test db --db-url "<string de conexão do
   ramo>"` faz o mesmo (esta não tem). **Nunca `supabase test db --linked`**: o
   projeto ligado é o de produção, e o teste grava em `auth.users` antes do
   `rollback`. Um `not ok` é o SQL fazendo o que a revisão não previu: **a
   migração não sobe**.

2. **As três conferências do algoritmo.** Estão comentadas no fim da migração
   `divisao`, com ids de brinquedo, e rodam em qualquer banco que já tenha a
   função, sem tocar dado. Rode uma por vez (o SQL Editor mostra só o último
   resultado):

   R$ 100,00 entre três adultos de peso igual, o `…002` pagou:

   ```sql
   select * from public.dividir_em_partes(10000, '[
     {"user_id":"00000000-0000-0000-0000-000000000001","weight":1},
     {"user_id":"00000000-0000-0000-0000-000000000002","weight":1},
     {"user_id":"00000000-0000-0000-0000-000000000003","weight":1}
   ]'::jsonb, '00000000-0000-0000-0000-000000000002') order by user_id;
   ```

   Esperado, em centavos: `3333`, `3334` e `3333` (o centavo que sobra vai
   inteiro para quem pagou, o `…002`). A soma é `10000`.

   Pesos 2 e 1 em R$ 10,00, quem pagou tem **peso 1** (o `…002`):

   ```sql
   select * from public.dividir_em_partes(1000, '[
     {"user_id":"00000000-0000-0000-0000-000000000001","weight":2},
     {"user_id":"00000000-0000-0000-0000-000000000002","weight":1}
   ]'::jsonb, '00000000-0000-0000-0000-000000000002') order by user_id;
   ```

   Esperado: `666` e `334` (R$ 6,66 e R$ 3,34).

   O mesmo, quem pagou tem **peso 2** (o `…001`):

   ```sql
   select * from public.dividir_em_partes(1000, '[
     {"user_id":"00000000-0000-0000-0000-000000000001","weight":2},
     {"user_id":"00000000-0000-0000-0000-000000000002","weight":1}
   ]'::jsonb, '00000000-0000-0000-0000-000000000001') order by user_id;
   ```

   Esperado: `667` e `333` (R$ 6,67 e R$ 3,33).

3. **Com o front do 2.0 apontado para o ramo**, duas contas de teste (uma dona e
   uma membro) e uma convidada da dona. Faça o §6 inteiro.

4. Rode as conferências do §1.3 e do §3.

### 1.2. Aplicar

```bash
supabase db push --linked
```

Este, sim, é o de produção: só com o pedido explícito do dono, depois do §1.1.
Aplica, **nesta ordem**, `20261031120000_projetos.sql` e
`20261031130000_divisao.sql` (e, antes delas, as que ainda não subiram). A
ordem importa: a segunda usa `workspaces.split_mode`, que a primeira cria.

**Não rode as migrações aos pedaços pelo SQL Editor.** O `add constraint
workspaces_project_fields` da primeira não é reexecutável: se ela parar no meio
e for rodada de novo à mão, esse `add constraint workspaces_project_fields`
falha com "already exists". O `db push` roda
cada arquivo numa transação só, e uma falha desfaz o arquivo.

As duas só acrescentam, com uma exceção: a `divisao` termina com o `drop table
public.transaction_splits`, guardado pela conferência de tabela vazia (§1.0). Os
outros `drop` são `drop trigger` e `drop policy if exists` seguidos do `create`
da versão nova. Nenhum `drop column`. As colunas novas têm padrão, e **nenhuma
carteira existente muda**: todas ficam `everyday`, `pooled` e sem `split_since`.

Até o 2.0 criar um projeto, escolher um modelo ou virar uma carteira para `split`,
nada muda para quem usa o `main` (§5). Um gatilho muda de verdade, e para todo
mundo: o `definir_quem_pagou` roda em todo insert e update de `transactions` e
preenche o `paid_by` da linha nova com o autor (§1.3, "Toda origem ganha
`paid_by`").

### 1.3. Conferir, uma por vez

O SQL Editor mostra só o resultado do último comando.

**Nada mudou para quem usa o app.** Logo depois do `db push` nenhuma carteira
divide, nenhum projeto existe e ninguém acertou nada.

```sql
select
  (select count(*) from public.workspaces
     where purpose <> 'everyday' or split_mode <> 'pooled' or split_since is not null) as carteiras_fora_do_padrao,
  (select count(*) from public.projects) as projetos,
  (select count(*) from public.transactions where project_id is not null) as lancamentos_em_projeto,
  (select count(*) from public.transaction_shares) as partes,
  (select count(*) from public.settlements) as acertos,
  (select count(*) from public.workspace_split_weights) as pesos;
```

Esperado: `0` em todas. Qualquer número acima disso quer dizer que alguém usou a
divisão ou os projetos (o 2.0 já está no ar?), ou que um modelo foi criado por
SQL.

**A tabela antiga saiu.**

```sql
select to_regclass('public.transaction_splits') is null as saiu;
```

Esperado: `true`.

**As colunas existem, com os padrões.**

```sql
select table_name, column_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'transactions' and column_name in ('project_id', 'paid_by', 'shares_manual'))
    or (table_name = 'workspaces' and column_name in ('purpose', 'starts_on', 'ends_on', 'budget_total', 'split_mode', 'split_since'))
    or (table_name = 'workspace_installment_plans' and column_name = 'split_weights')
  )
order by 1, 2;
```

Esperado: dez linhas. Só `shares_manual` (padrão `false`), `purpose` (padrão
`'everyday'`) e `split_mode` (padrão `'pooled'`) são `NO` e têm padrão; as outras
sete aceitam nulo e não têm padrão.

**As quatro tabelas têm RLS, e o app só escreve onde deve.**

```sql
select c.relname as tabela, c.relrowsecurity as rls,
  has_table_privilege('anon', c.oid, 'select') as anon_le,
  has_table_privilege('authenticated', c.oid, 'truncate') as authenticated_trunca,
  has_table_privilege('authenticated', c.oid, 'insert') as authenticated_insere,
  has_table_privilege('authenticated', c.oid, 'update') as authenticated_atualiza
from pg_class c
where c.oid in (
  'public.projects'::regclass, 'public.transaction_shares'::regclass,
  'public.settlements'::regclass, 'public.workspace_split_weights'::regclass
)
order by 1;
```

Esperado, tabela a tabela (`rls`, `anon_le`, `authenticated_trunca`, insere,
atualiza):

| Tabela | rls | anon | trunca | insere | atualiza |
|---|---|---|---|---|---|
| `projects` | `true` | `false` | `false` | `true` | `false` (só por coluna) |
| `settlements` | `true` | `false` | `false` | `true` | `false` |
| `transaction_shares` | `true` | `false` | `false` | `false` | `false` |
| `workspace_split_weights` | `true` | `false` | `false` | `true` | `true` |

`projects` só deixa atualizar `name`, `starts_on`, `ends_on`, `budget_total` e
`archived_at`: a carteira e o autor não se trocam. `transaction_shares` não tem
escrita direta: só o gatilho e o `definir_partes` gravam.

**As políticas.**

```sql
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('projects', 'transaction_shares', 'settlements', 'workspace_split_weights')
order by 1, 3, 2;
```

Esperado: quatro de `projects` (`DELETE`, `INSERT`, `SELECT`, `UPDATE`), uma de
`transaction_shares` (`SELECT`), três de `settlements` (`DELETE`, `INSERT`,
`SELECT`; não há `UPDATE`, o acerto não se edita) e quatro de
`workspace_split_weights`.

O convidado lê `projects` (para marcar a despesa dele), e só nisso:

```sql
select policyname,
  coalesce(qual, '') like '%is_workspace_member%' as de_membro,
  coalesce(qual, '') like '%is_workspace_adult%' as de_adulto
from pg_policies
where schemaname = 'public'
  and tablename in ('projects', 'transaction_shares', 'settlements')
  and cmd = 'SELECT'
order by 1;
```

Esperado: `projects_select` com `de_membro` `true` e `de_adulto` `false`;
`settlements_select` e `transaction_shares_select` com `de_adulto` `true` (a
segunda chega ao adulto por uma subconsulta em `transactions`).

**Os gatilhos existem e estão ligados.**

```sql
select c.relname as tabela, t.tgname as gatilho, t.tgenabled as ligado
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
where not t.tgisinternal
  and (
    (c.relname = 'transactions' and t.tgname in (
      'same_ws_project_id', 'recusar_projeto_arquivado', 'definir_quem_pagou', 'gerar_partes'
    ))
    or (c.relname = 'workspaces' and t.tgname = 'carimbar_split_since')
    or (c.relname = 'workspace_installment_plans' and t.tgname in ('validar_pesos_do_plano', 'refazer_partes_do_plano'))
    or (c.relname = 'projects' and t.tgname = 'set_projects_updated_at')
    or (c.relname = 'settlements' and t.tgname = 'garantir_escrita')
  )
order by 1, 2;
```

Esperado: nove linhas, todas com `ligado` `O`. O `gerar_partes` é o único `after` em `transactions` (o
`refazer_partes_do_plano`, em `workspace_installment_plans`, também é `after`).

**As funções são `security definer` (menos duas) e têm o `search_path` vazio.**

```sql
select proname, prosecdef as definer, coalesce(proconfig::text, '') like '%search_path%' as com_search_path
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in (
    'recusar_projeto_arquivado', 'criar_carteira_de_modelo',
    'definir_quem_pagou', 'carimbar_split_since', 'validar_pesos_do_plano', 'dividir_em_partes',
    'refazer_partes', 'gerar_partes', 'refazer_partes_do_plano', 'definir_partes', 'saldos_da_carteira'
  )
order by 1;
```

Esperado: onze linhas, `com_search_path` `true` em todas. `definer` é `true` em
todas menos `criar_carteira_de_modelo` (de propósito `security invoker`: a RLS e
o `created_by = auth.uid()` valem na criação, como no `create_shared_workspace`)
e `dividir_em_partes` (SQL puro e `immutable`, sem acesso a tabela).

**Quem pode chamar o quê.**

```sql
select
  has_function_privilege('anon', 'public.criar_carteira_de_modelo(text, text)', 'execute') as modelo_anon,
  has_function_privilege('authenticated', 'public.criar_carteira_de_modelo(text, text)', 'execute') as modelo_authenticated,
  has_function_privilege('anon', 'public.definir_partes(uuid, jsonb)', 'execute') as partes_anon,
  has_function_privilege('authenticated', 'public.definir_partes(uuid, jsonb)', 'execute') as partes_authenticated,
  has_function_privilege('anon', 'public.saldos_da_carteira(uuid)', 'execute') as saldos_anon,
  has_function_privilege('authenticated', 'public.saldos_da_carteira(uuid)', 'execute') as saldos_authenticated,
  has_function_privilege('authenticated', 'public.dividir_em_partes(bigint, jsonb, uuid)', 'execute') as algoritmo_authenticated,
  has_function_privilege('authenticated', 'public.refazer_partes(uuid)', 'execute') as refazer_authenticated,
  has_function_privilege('authenticated', 'public.gerar_partes()', 'execute') as gatilho_authenticated;
```

Esperado, na ordem: `false`, `true`, `false`, `true`, `false`, `true`, `false`,
`false`, `false`. Só as três RPCs do app são chamáveis (e só por quem tem
sessão); o algoritmo, o `refazer_partes` e os gatilhos não.

**A divisão confere o adulto, e o orçamento pula a carteira de projeto.** Só
leitura do texto das funções:

```sql
select
  pg_get_functiondef('public.saldos_da_carteira(uuid)'::regprocedure) like '%is_workspace_adult%' as saldo_so_adulto,
  pg_get_functiondef('public.definir_partes(uuid, jsonb)'::regprocedure) like '%PARTES_NAO_FECHAM%' as partes_conferem_a_soma,
  pg_get_functiondef('public.definir_quem_pagou()'::regprocedure) like '%PAGADOR_INVALIDO%' as pagador_so_adulto,
  pg_get_functiondef('public.copiar_orcamentos_do_mes(date, uuid)'::regprocedure) like '%purpose%' as copia_pula_projeto,
  pg_get_functiondef('public.garantir_orcamentos_do_mes(uuid)'::regprocedure) like '%purpose%' as garante_pula_projeto;
```

Esperado: `true` nas cinco. Um `false` quer dizer que a função antiga continua no
banco: rode o `db push` de novo.

**Toda origem ganha `paid_by`.** É o foco de revisão 3: o `main` não manda
`paid_by`, e o lançamento da captura, o da assinatura, o da parcela e o do
cron também não. O gatilho é `before insert or update` em `transactions`, então
o preenchimento não depende de RPC nenhuma. Depois de lançar uma despesa de teste
(pelo app de `main` ou pelo Atalho do iPhone), e uma hora depois da aplicação:

```sql
select count(*) as sem_pagador_recente
from public.transactions
where paid_by is null
  and created_at > now() - interval '1 hour';
```

Esperado: `0`. Se o `db push` terminou há menos de uma hora, a conta pega
linhas de antes dele (que ficam sem `paid_by` até a primeira edição, de
propósito: não há backfill). A linha antiga ganha o autor na primeira vez em que
for editada.

### 1.4. A onda final entrou

Confirme no banco as correções da onda final (veja o topo). Só leitura do texto
das políticas e das funções:

```sql
select policyname,
  with_check like '%saldos_da_carteira%' as aceita_quem_saiu,
  with_check like '%ARRAY[%from_user%to_user%]%' as quem_grava_e_parte,
  with_check not like '%role%' as sem_dois_adultos
from pg_policies
where schemaname = 'public' and tablename = 'settlements' and cmd = 'INSERT';
```

Esperado: uma linha, `settlements_insert`, com `true` nas três. O Postgres
guarda o `(select auth.uid()) in (from_user, to_user)` da migração reescrito
como `= ANY (ARRAY[from_user, to_user])`, por isso a segunda conta procura o
`ARRAY`. A terceira confirma que a exigência antiga, dos dois adultos atuais
(`wm.role in ('owner', 'member')`), saiu. Se alguma vier `false`, leia o
`with_check` inteiro contra o `settlements_insert` da migração.

```sql
select cmd,
  (coalesce(qual, '') || coalesce(with_check, '')) like '%is_workspace_owner%' as so_dono,
  coalesce(with_check, '') like '%workspace_members%' as so_peso_de_adulto
from pg_policies
where schemaname = 'public' and tablename = 'workspace_split_weights'
order by 1;
```

Esperado: quatro linhas. `DELETE` com `so_dono` `true`; `INSERT` e `UPDATE` com
`true` e `true`; `SELECT` com `false` e `false` (todo adulto lê os pesos).

```sql
select
  pg_get_functiondef('public.refazer_partes(uuid)'::regprocedure) like '%coalesce(t.paid_by, t.user_id)%' as partes_com_autor,
  pg_get_functiondef('public.saldos_da_carteira(uuid)'::regprocedure) like '%coalesce(t.paid_by, t.user_id)%' as saldo_com_autor,
  pg_get_functiondef('public.definir_quem_pagou()'::regprocedure) not like '%old.shares_manual%' as manual_zera_sempre,
  pg_get_functiondef('public.definir_partes(uuid, jsonb)'::regprocedure) like '%jsonb_typeof(e -> ''amount'')%' as partes_conferem_a_forma;
```

Esperado: `true` nas quatro. Um `false` quer dizer que a versão de antes da onda
continua no banco: rode o `db push` de novo.

Para ver a política de acerto agindo, no ramo e logado como adulto pelo app: tire
um membro com saldo da carteira e registre um acerto com ele (ele aparece como
"Ex-membro" nas duas listas). O acerto entra, e o saldo dele vai a zero.

## 2. Funções

**Nenhuma Edge muda neste bloco, e nenhuma precisa ser publicada de novo.** O
`_shared` vai embutido em cada função no deploy, então o que conta é se algum
arquivo de `supabase/functions` mudou. Confirme pelo repositório:

```bash
git diff f46be83e..HEAD --name-only -- supabase/functions
```

(`f46be83e` é o último commit antes do 7C, no ramo do bloco. Depois de um
squash ele some: use o commit de `main` anterior ao merge do 7C.) Esperado:
**nenhuma linha**. E nenhuma Edge
lê nem escreve o que este bloco cria:

```bash
grep -rnE "paid_by|project_id|transaction_shares|transaction_splits|split_mode|split_since|settlements|saldos_da_carteira|criar_carteira_de_modelo" supabase/functions
```

Esperado: uma linha só, um **comentário** em `_shared/limite-pessoa.ts` que diz
que o `paid_by` não muda a régua do limite. O limite da pessoa continua contando
as despesas que ela **lançou** (`user_id`), não as que pagou.

As Edges que gravam `transactions` (`capture`, `run-recurring-billing`, a
cobrança de assinatura e de parcela, `notify-transaction-created`) seguem como
antes: elas passam pelos gatilhos do banco, que não leem `auth.uid()` para
preencher o `paid_by` (o autor vem da linha, não da sessão), então a service role
ganha `paid_by` e partes como qualquer cliente.

## 3. Conferência pós-deploy

Só leitura. Estas são as conferências que valem a partir do momento em que
existe a primeira carteira dividida (`split_mode = 'split'`), por modelo ou por
Configurações. Antes disso, todas dão `0`.

**O saldo não sai pela `saldos_da_carteira`.** Ela exige um adulto logado
(`is_workspace_adult`), e o SQL Editor roda sem `auth.uid()`: chamá-la lá dá
`not a workspace adult`. Por isso as conferências abaixo refazem a conta nas
tabelas.

**A soma das partes fecha o valor, em toda despesa.**

```sql
select count(*) as despesa_com_soma_errada
from public.transactions t
where exists (select 1 from public.transaction_shares s where s.transaction_id = t.id)
  and t.amount is distinct from (
    select sum(s.amount) from public.transaction_shares s where s.transaction_id = t.id
  );
```

Esperado: `0`. Vale para as automáticas e para as escritas à mão. Qualquer
número acima disso é uma parte que não fecha: pare e veja o `gerar_partes`.

**Toda despesa de uma carteira dividida tem partes.**

```sql
select count(*) as despesa_dividida_sem_partes
from public.transactions t
join public.workspaces w on w.id = t.workspace_id
where w.split_mode = 'split'
  and w.split_since is not null
  and t.type = 'expense'
  and t.amount > 0
  and (t.date at time zone 'America/Sao_Paulo')::date >= w.split_since
  and not exists (select 1 from public.transaction_shares s where s.transaction_id = t.id);
```

Esperado: `0` numa carteira que nasceu `split` (os modelos Casal, Viagem, Reforma
e Evento). **Numa carteira que virou `split` depois, pode vir acima de `0`**, e
não é bug: a divisão vale para a frente, sem retroativo. São as despesas lançadas
no dia da virada, antes dela, e as lançadas no pote único depois de a carteira
voltar a `split` (lacuna 76). Elas ganham partes na próxima vez em que forem
editadas (valor, data, quem pagou).

**Carteira de pote único não ganha parte nova.**

```sql
select count(*) as parte_em_carteira_sem_divisao
from public.transaction_shares s
join public.transactions t on t.id = s.transaction_id
join public.workspaces w on w.id = t.workspace_id
where w.split_since is null;
```

Esperado: `0`. Uma carteira que nunca foi `split` nunca tem parte. (A que foi
`split` e voltou a `pooled` **guarda** as partes que já tinha: trocar o modo não
apaga nada, e elas não entram nesta conta, porque a carteira tem `split_since`.)

**O convidado nunca tem parte e nunca paga.**

```sql
select
  (select count(*) from public.transaction_shares s
     join public.transactions t on t.id = s.transaction_id
     join public.workspace_members m on m.workspace_id = t.workspace_id and m.user_id = s.user_id
   where m.role = 'guest') as parte_de_convidado,
  (select count(*) from public.transactions t
     join public.workspace_members m on m.workspace_id = t.workspace_id and m.user_id = t.paid_by
   where m.role = 'guest') as convidado_que_pagou;
```

Esperado: `0` e `0`. A despesa do convidado tem `paid_by` igual ao responsável
dele (ou ao dono mais antigo, se o responsável saiu). Se vier acima de `0`, quase
sempre é alguém que tinha parte ou pagou e foi **rebaixado** a convidado depois:
a parte antiga fica (a divisão só vale para a frente), e ele aparece no saldo
como quem saiu (lacuna 72).

**Os saldos fecham em 0, por carteira.** O pago, as partes e os acertos:
`saldo = pago − partes ± acertos`, e cada acerto soma `+x` a quem pagou e `−x` a
quem recebeu, então os acertos não mexem na soma. Sobra conferir que o pago e as
partes são iguais:

```sql
with despesas as (
  select t.id, t.workspace_id, t.amount, coalesce(t.paid_by, t.user_id) as paid_by
  from public.transactions t
  join public.workspaces w on w.id = t.workspace_id
  where t.type = 'expense'
    and w.split_since is not null
    and (t.date at time zone 'America/Sao_Paulo')::date >= w.split_since
    and exists (select 1 from public.transaction_shares s where s.transaction_id = t.id)
), pago as (
  select d.workspace_id, sum(d.amount) as total from despesas d where d.paid_by is not null group by d.workspace_id
), partes as (
  select d.workspace_id, sum(s.amount) as total
  from public.transaction_shares s join despesas d on d.id = s.transaction_id
  group by d.workspace_id
)
select count(*) as carteira_com_saldo_que_nao_fecha
from pago p
full join partes q on q.workspace_id = p.workspace_id
where coalesce(p.total, 0) <> coalesce(q.total, 0);
```

Esperado: `0`. Sem `paid_by`, quem pagou é o autor, a mesma regra do
`refazer_partes` e do `saldos_da_carteira`; uma carteira aqui tem parte que não
fecha o valor. No app, o mesmo conferido de outro jeito:
no Painel da carteira dividida, a soma dos saldos mostrados é zero.

**Os acertos.**

```sql
select
  (select count(*) from public.settlements st
     join public.workspace_members m
       on m.workspace_id = st.workspace_id and m.user_id in (st.from_user, st.to_user)
   where m.role = 'guest') as acerto_com_convidado,
  (select count(*) from public.settlements where from_user = to_user or amount <= 0) as acerto_invalido;
```

Esperado: `0` e `0`. A segunda os checks da tabela já garantem; ela fica para o
caso de alguém ter solto o check.

**Quem saiu, mas ainda tem saldo.** Informativo, não é erro: conta quem aparece
nas partes, nos pagamentos ou nos acertos de uma carteira e já não é adulto dela.

```sql
select count(*) as pessoa_que_saiu_com_saldo
from (
  select t.workspace_id, s.user_id
  from public.transaction_shares s join public.transactions t on t.id = s.transaction_id
  union
  select t.workspace_id, coalesce(t.paid_by, t.user_id)
  from public.transactions t
  where exists (select 1 from public.transaction_shares s where s.transaction_id = t.id)
  union
  select st.workspace_id, st.from_user from public.settlements st
  union
  select st.workspace_id, st.to_user from public.settlements st
) x
where not exists (
  select 1 from public.workspace_members m
  where m.workspace_id = x.workspace_id and m.user_id = x.user_id and m.role in ('owner', 'member')
);
```

Esperado: `0` até alguém sair de uma carteira dividida. Depois disso, é a pessoa
que a tela mostra como "Ex-membro" (lacuna 72). O acerto com ela é aceito
(Ruling 8): quem lança é um adulto atual que paga ou recebe dela.

**Os projetos.**

```sql
select
  (select count(*) from public.transactions t
     join public.projects p on p.id = t.project_id
   where p.workspace_id <> t.workspace_id) as projeto_de_outra_carteira,
  (select count(*) from public.orcamentos_copiados oc
     join public.workspaces w on w.id = oc.workspace_id
   where w.purpose = 'project') as orcamento_copiado_em_projeto;
```

Esperado: `0` e `0`. A primeira é o `same_ws_project_id`; a segunda, o orçamento
do dia 1 que a carteira de projeto não recebe. Se alguém trocou o `purpose` de
uma carteira para `project` depois de ela ter tido orçamento copiado, a segunda
vem acima de `0` sem ser erro.

**O resumo do projeto bate com a soma das transações dele.** O resumo da tela
soma as despesas (`type = 'expense'`) do projeto, em centavos. Para o projeto de
teste mexido por último, a mesma conta no banco:

```sql
select count(*) filter (where t.type = 'expense') as despesas,
  coalesce(sum(t.amount) filter (where t.type = 'expense'), 0) as gasto,
  p.budget_total - coalesce(sum(t.amount) filter (where t.type = 'expense'), 0) as falta
from (select * from public.projects order by updated_at desc limit 1) p
left join public.transactions t on t.project_id = p.id
group by p.id, p.budget_total;
```

Esperado: o `gasto` e o `falta` iguais aos do resumo em `/projetos/{id}` (o
`falta` é nulo sem orçamento).

**Os logs das Edges.** Nada novo: nenhuma Edge muda. Um `column ... does not
exist` com `paid_by`, `project_id` ou `split_mode` num log de Edge é de uma
versão antiga do repositório publicada por engano: confira o §2.

## 4. O que não fazer neste bloco

**Não escreva `paid_by`, partes ou acertos por SQL em dado de gente de
verdade.** O SQL Editor roda como `postgres`, sem `auth.uid()`: o
`definir_partes` e a `saldos_da_carteira` recusam (`not a workspace adult`), e a
`settlements` perderia o `created_by`, que é quem pode apagar o acerto. Para
corrigir uma parte, edite a despesa pela tela.

**Não mude o `split_mode` ou o `split_since` por SQL esperando um retroativo.**
Não há backfill: a divisão vale para as despesas lançadas ou editadas depois que
a carteira virou `split`, a partir de `split_since`. O `split_since` é carimbado
na primeira vez que o modo vira `split` e nunca se perde; quem puder atualizar
`workspaces` (o dono) consegue reescrevê-lo, mas as despesas de antes não ganham
partes por isso, e as de depois mudam de lado só quando forem editadas.

**Não troque o modo de uma carteira com saldo aberto sem avisar quem divide.**
Trocar de `split` para `pooled` não apaga nada (as partes ficam guardadas e o
saldo some da tela); de volta a `split`, elas valem de novo. A despesa lançada no
pote único nesse meio-tempo, porém, não entra (lacuna 76).

**Acerte o saldo antes de tirar alguém da carteira ou de rebaixá-lo a convidado.**
As partes e os pagamentos dele ficam, e ele aparece no saldo como "Ex-membro"
(lacuna 72). Dá para acertar depois, pelo Painel, mas só quem paga ou recebe
dele registra o acerto, e ele mesmo não entra mais no app para conferir.

**Não apague um projeto esperando apagar os lançamentos dele.** O `on delete set
null` solta os lançamentos do projeto, sem apagá-los. A tela só arquiva; a API
deixa apagar.

**Não edite um lançamento antigo para "consertar" o `paid_by` nulo em massa.** A
linha anterior à migração ganha o autor sozinha na primeira edição; um `update`
em massa por SQL passa pelo gatilho e faz o mesmo, mas também refaz as partes de
toda despesa de carteira dividida que ele tocar.

**Não crie carteira de projeto por SQL.** A `workspaces_project_fields` exige
`purpose = 'project'` para aceitar período e orçamento, e o `criar_carteira_de_modelo`
é quem semeia as categorias e marca o assistente como concluído. Use o app, ou a
própria RPC logado.

## 5. Compatibilidade com o front de `main`

Conferido no código de `main` (`git grep` de `paid_by`, `project_id`,
`split_mode`, `split_since`, `split_weights`, `purpose`, `transaction_shares`,
`settlements`, `workspace_split_weights`, `saldos_da_carteira` e
`criar_carteira_de_modelo` em `src/` e `supabase/functions`): **nada lê,
escreve ou chama o que este bloco cria.** As únicas citações são o tipo gerado
de `transaction_splits` em `src/types/database.ts`, que não é lido em tempo de
execução, e duas palavras sem relação (o `purpose` do manifesto do PWA e um
texto de erro do Auth).

| O que muda no banco | Por que `main` não sente |
|---|---|
| `transactions.paid_by`, `shares_manual`, `project_id` | Colunas novas, nulas ou com padrão. O insert de `main` não as manda; o `definir_quem_pagou` preenche o `paid_by` com o autor, e o `project_id` fica nulo |
| `definir_quem_pagou` (todo insert e update) | Só preenche o que veio nulo e recusa um pagador fora dos adultos (`PAGADOR_INVALIDO`), que `main` nunca manda. Numa edição que não mexe em `paid_by` nem na carteira, não toca em nada |
| `gerar_partes` | Sai cedo: numa carteira `pooled` sem `split_since` não cria nem apaga parte. Para `main`, toda carteira é assim |
| `workspaces.purpose`, `starts_on`, `ends_on`, `budget_total`, `split_mode`, `split_since` | Colunas novas com padrão (`everyday`, `pooled`, nulo). `main` as lê em `select *` sem usá-las |
| `copiar_orcamentos_do_mes`, `garantir_orcamentos_do_mes` | Mesmos corpos, com o `purpose = 'everyday'` a mais: toda carteira existente é `everyday`, e o resultado é o de hoje |
| `projects`, `transaction_shares`, `settlements`, `workspace_split_weights` | Tabelas novas; `main` não as consulta. Ninguém escreve nelas sem usar o 2.0 |
| `workspace_installment_plans.split_weights` | Coluna nova, nula: o plano criado por `main` usa os pesos da carteira, e numa carteira `pooled` nem isso |
| `transaction_splits` sai | Vazia (§1.0), e nem `main` nem o 2.0 a leem |
| Edges | Nenhuma muda (§2) |

**Depois que existir uma carteira dividida** (só o 2.0 a cria), uma despesa
lançada pelo `main` nela também ganha `paid_by` (o autor) e partes, porque quem
faz isso é o banco. O `main` não mostra as partes nem o saldo.

**O 2.0 roda contra um banco sem esta migração** (Ruling 8 do 7B). As colunas
novas só entram em consulta `*` ou tolerante, o corpo de escrita só cita a coluna
nova quando ela muda algo (`paid_by` só se a pessoa escolheu outro pagador;
`project_id` só se escolheu ou tirou o projeto), e as tabelas e as RPCs novas são
chamadas por `tabelaTolerante` e `rpcTolerante`, que devolvem "Ainda não
disponível" para `PGRST205`, `PGRST204`, `PGRST200`, `42P01`, `42703`, `PGRST202`
e `42883`. O `src/lib/titular/colunas-tolerantes.test.ts` tranca. Por isso o
front do 2.0 **não fica bloqueado** por esta migração, e as telas novas só
mostram o aviso até ela subir. Aplique as migrações antes de o dono testar.

## 6. Com o front

Quando o front do 2.0 subir (ou apontado para o ramo de teste), confira com duas
contas de teste (uma dona e uma membro) e uma convidada da dona:

- **Criar uma carteira.** Em "Nova carteira" aparece a regra ("Vai usar o cartão
  da casa e são as mesmas pessoas? É um projeto. Gente de fora ou dinheiro
  separado? É uma carteira.") e os modelos: Casa, Casal, Pessoal, Viagem, Reforma
  e Evento. Cada um cria a carteira com as categorias dele e sem abrir o assistente
  de categorias; Casa é `pooled`, e Casal, Viagem, Reforma e Evento nascem `split`.
  Viagem, Reforma e Evento são carteiras de projeto e abrem o passo das datas e do
  orçamento total ("Agora não" pula). A Pessoal não pede nome e abre a carteira
  pessoal que já existe;
- **Primeiro uso: a Casa.** Em `/comecar`, quem ainda não é dono de nenhuma
  carteira compartilhada vê "Criar a Casa"; o toque cria a carteira e a troca para
  ela. Quem já é dono não vê o passo;
- **Projetos.** Em `/projetos` (só dono e membro; o convidado não tem a rota nem o
  item), criar um projeto com nome, período e orçamento. No formulário de despesa
  aparece "Projeto (opcional)". Em
  `/projetos/{id}` o resumo mostra o gasto, o que falta do orçamento (ou "Passou
  do orçamento em…"), a quebra por categoria e a por pessoa. **Arquivar** pede
  confirmação; depois, lançar naquele projeto responde "Este projeto está
  arquivado e não aceita lançamento novo." Desarquivar libera. Um projeto
  arquivado continua aparecendo na despesa que já era dele;
- **Carteira de projeto.** O Painel mostra o resumo da carteira no lugar do
  "seguro para gastar"; o convidado não o vê. Em Configurações, o dono edita as
  datas e o orçamento total. No dia 1, nenhum orçamento é copiado para ela;
- **Quem pagou.** Numa carteira `split`, a despesa de um adulto mostra "Quem
  pagou", só com os adultos, e o padrão é quem lança. A despesa da convidada sai
  com `paid_by` igual à responsável. A parcelada e a receita não
  oferecem a escolha;
- **As partes.** Na folha de detalhe, "Partes desta despesa" lista cada adulto, o
  centavo que sobra fica com quem pagou, e "Editar à mão" só deixa salvar com a
  soma igual ao valor. "Voltar ao automático" desfaz;
- **O modo e os pesos.** Em Configurações, o dono troca `pooled` e `split` e dá
  um peso por adulto. Trocar de modo avisa que não apaga nada. A membro não vê o
  editor, e o banco recusa um peso escrito por ela pela API. A parcelada nova
  oferece "Pesos desta parcelada" (a regra mora no plano);
- **O saldo e o acerto.** No Painel da carteira dividida (só para adultos), cada
  pessoa tem "a receber", "deve" ou "em dia", a sugestão de quem paga quem e o
  "Acertar". As duas listas trazem também quem saiu ("Ex-membro"), e quem
  registra tem de ser uma das duas pessoas. Registrar um acerto muda o saldo na
  hora, e só quem o criou o apaga.
  O app **não faz o Pix**: o pagamento acontece fora (lacuna 75);
- **O convidado** não vê projetos, resumo, partes, saldo nem modo da carteira; a
  despesa dele entra na divisão pelo responsável.

**O que fica de fora, de propósito.** O Pix do acerto (lacuna 75), a divisão
retroativa, quem saiu da carteira continuar no saldo até alguém acertar com ele
(lacuna 72) e a
Previsão de uma carteira de projeto aberta direto (lacuna 73). As lacunas
conhecidas estão na seção 20 de `docs/JORNADAS.md`.
