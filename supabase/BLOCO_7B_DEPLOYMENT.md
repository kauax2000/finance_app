# Publicar o Bloco 7B: o titular do cartão

Reúne o titular do cartão. O gasto privado entre adultos, que este bloco trazia,
**saiu antes de ser aplicado** (Bloco 9, Decisão 1): numa carteira todo adulto vê
todos os gastos, e quem quer privacidade cria outra carteira. Nada de `is_private`,
`transacoes_privadas` ou `guardar_privado` existe no banco, nas Edges ou no front.

- a migração `20261030120000_privado.sql` (o nome do arquivo ficou, porque a
  fila de migrações é ordenada por ele):
  - a coluna `credit_cards.holder_user_id` (nula é o "cartão da casa") e os
    gatilhos `conferir_titular` e `conferir_titular_troca`: o titular é adulto
    da carteira, e só o dono o define ou troca;
  - as quatro políticas de `credit_card_statement_totals` (a conferência do
    cartão com titular) e as de `attachments` e do storage (o PDF da fatura de
    um cartão com titular), pelos helpers `conferencia_liberada`,
    `anexo_oculto(uuid)` e `objeto_de_anexo_oculto`;
- as Edges: os avisos de um cartão com titular que carregam dado do banco vão só
  ao titular e aos donos (`leitoresDoCartao`, em `_shared/destinatarios.ts`).
  **Nenhuma Edge nova, nenhum cron novo, nenhum segredo novo**;
- no front do 2.0: o seletor de titular no cadastro e na edição do cartão (só o
  dono) e a conferência da fatura fechada para quem não é titular nem dono.

**Estado em 26/10/2026: nada publicado.** O front do `finance-app-2.0` também
não: ele só vai para `main`, e para produção, quando os blocos planejados
estiverem prontos (decisão do dono).

**Quem tira o titular que sai é o Bloco 9.** Aqui o titular só é conferido na
escrita. O gatilho `soltar_titular_que_sai`, que zera o titular de quem deixa a
carteira ou vira convidado, mora na migração do Bloco 9
(`BLOCO_9_DEPLOYMENT.md`).

**A migração sobe antes das Edges, e o front do 2.0 não depende dela.** Três
Edges leem `credit_cards.holder_user_id`: com a migração ausente, o `select` falha
por coluna inexistente e o aviso ou o insight para. O front do 2.0 foi feito para
rodar contra um banco **sem** esta migração (Ruling 8): a coluna nova só entra em
consulta `*` ou tolerante (`src/lib/titular/colunas-tolerantes.test.ts`), e o corpo
de escrita só cita `holder_user_id` quando a pessoa muda o titular. Sem a migração,
o seletor de titular aparece, mas escolher falha; por isso aplique a migração antes
de o dono testar.

**O SQL ainda não rodou contra um banco de verdade.** A RLS e os gatilhos são
trancados por testes de fonte sobre a migração
(`src/lib/titular/migracao-titular.test.ts`), que leem o texto do SQL, não o
comportamento. Antes da produção, valide a migração num ramo de teste ou num
projeto descartável (§1.1).

Faça na ordem. Todo SQL abaixo cabe como está no SQL Editor: ele não leva id,
chave nem URL, e nada precisa ser trocado. O SQL Editor roda como `postgres`, sem
RLS: as contagens veem todas as linhas. **Nunca** salve no repositório o resultado
de uma conferência (o repositório é público).

## 0. Pré-requisitos

- **Os Blocos 3A, 3B, 4, 5, 6A, 6B e 7A vão antes, ou junto.** A migração do 7B
  recria políticas de `attachments`, `storage.objects` e
  `credit_card_statement_totals` a partir do estado final do 7A
  (`20261029120000_papeis.sql`). Se as outras ainda não subiram, o `db push`
  aplica todas em ordem.
- **As Edges de cada bloco levam o código do repositório inteiro.** Se o roteiro
  do 7A (`BLOCO_7A_DEPLOYMENT.md`) ainda não foi rodado, publicar
  `evaluate-credit-card-alerts` por ele já traz o código do 7B, que lê a coluna
  nova. Nesse caso aplique as **duas** migrações do 7A e a do 7B (um `db push` só)
  antes de qualquer Edge.
- **A CLI** do Homebrew, 2.121 ou mais nova, com o projeto ligado
  (`supabase link`, uma vez só). Sem Docker nesta máquina, as funções sobem pela
  API (`--use-api`).
- **Nenhum segredo novo.** As Edges usam a mesma service role e os mesmos
  `CRON_SECRET` de sempre. O `supabase/config.toml` não mudou.
- **O banco de desenvolvimento é o de produção.** Não rode nada disto sem o
  pedido explícito do dono.

## 1. Migração

### 1.1. Antes da produção: um ramo de teste

Valide num ramo de teste do Supabase ou num projeto descartável, com as
migrações aplicadas até a do 7B, e **só lá** (os passos abaixo gravam dado). Com o
front do 2.0 apontado para o ramo, duas contas de teste (uma dona e uma membro)
numa carteira compartilhada de teste:

1. O dono define a dona como titular de um cartão: só o titular e o dono veem o
   total do banco e abrem o PDF da conferência; a membro vê "Só o titular do
   cartão e o dono da carteira conferem esta fatura." e não recebe o aviso de
   fatura com total do banco.
2. A membro tenta definir o titular pela API: recebe `TITULAR_SO_DONO`. Escolher
   como titular alguém que é convidado dá `TITULAR_NAO_ADULTO`.
3. Rode as conferências do §1.3 e do §3.

### 1.2. Aplicar

```bash
supabase db push --linked
```

Aplica `20261030120000_privado.sql` (e, antes dela, as que ainda não subiram).

Ela só acrescenta: uma coluna que nasce nula, gatilhos e helpers novos, e as
políticas recriadas com um ramo a mais. Nenhum `drop table`, nenhum `drop column`.
`conferir_titular` só dispara no insert com titular, e `conferir_titular_troca`,
quando o titular ou a carteira do cartão mudam (mudar de carteira qualquer cartão
pede o dono). Até o 2.0 escolher um titular, nada muda para quem usa o `main` (§5).

### 1.3. Conferir, uma por vez

O SQL Editor mostra só o resultado do último comando.

**Nada mudou para quem usa o app.** Logo depois do `db push` nenhum cartão tem
titular.

```sql
select count(*) as cartoes_com_titular
from public.credit_cards
where holder_user_id is not null;
```

Esperado: `0`. Depois que alguém escolher um titular, esta é a conferência de
contagem do §3.

**A coluna existe, com o padrão.**

```sql
select column_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'credit_cards'
  and column_name = 'holder_user_id';
```

Esperado: uma linha. `holder_user_id` aceita nulo, sem padrão.

**Os dois gatilhos do titular existem e estão ligados.**

```sql
select c.relname as tabela, t.tgname as gatilho, t.tgenabled as ligado
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
where not t.tgisinternal
  and t.tgname in ('conferir_titular', 'conferir_titular_troca')
order by 2;
```

Esperado: duas linhas (`credit_cards`/`conferir_titular` e
`conferir_titular_troca`), as duas com `ligado` `O`.

**As funções são `security definer` e têm o `search_path` vazio.**

```sql
select proname, prosecdef as definer, coalesce(proconfig::text, '') like '%search_path%' as com_search_path
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in (
    'conferir_titular', 'conferencia_liberada', 'anexo_oculto', 'objeto_de_anexo_oculto'
  )
order by 1;
```

Esperado: quatro linhas, as duas colunas `true`.

**O gatilho do titular guarda a regra.** O titular é adulto da carteira, e só o
dono o define:

```sql
select
  pg_get_functiondef('public.conferir_titular()'::regprocedure) like '%TITULAR_SO_DONO%' as so_dono,
  pg_get_functiondef('public.conferir_titular()'::regprocedure) like '%TITULAR_NAO_ADULTO%' as so_adulto;
```

Esperado: `true` nas duas. Um `false` quer dizer que a função antiga continua no
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

Esperado: `0`. Com o Bloco 9 aplicado, o titular que sai da carteira, ou que vira
convidado, é zerado pelo gatilho `soltar_titular_que_sai`. Uma linha é um titular
que saiu **antes** dessa migração: troque o titular pela tela, como dono.

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

**O ramo do convidado do 7A continua inteiro.** A migração recriou as políticas de
`attachments`, então repita as conferências de `attachments` do §1 de
`BLOCO_7A_DEPLOYMENT.md`. O esperado não mudou.

**Os helpers não abrem para o `anon`.**

```sql
select
  has_function_privilege('anon', 'public.conferencia_liberada(uuid, uuid)', 'execute') as conferencia_anon,
  has_function_privilege('authenticated', 'public.conferencia_liberada(uuid, uuid)', 'execute') as conferencia_authenticated,
  has_function_privilege('anon', 'public.anexo_oculto(uuid)', 'execute') as anexo_anon,
  has_function_privilege('anon', 'public.objeto_de_anexo_oculto(text)', 'execute') as objeto_anon;
```

Esperado, na ordem: `false`, `true`, `false`, `false`.

**As políticas do storage subiram.** O bloco `do $$ … exception when
insufficient_privilege` da seção "anexos" recria as duas políticas de
`storage.objects`. Se o papel da migração não for dono de `storage.objects` (o
caso que o `BLOCO_2_DEPLOYMENT.md` já registrou neste projeto), o bloco só emite um
aviso, é desfeito em silêncio, e o `db push` termina sem erro.

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

Se vier `false`, faltar uma linha ou o log do `db push` trouxer o aviso, **as
políticas do 7A continuam valendo**: o PDF de um cartão com titular fica legível e
apagável por todo adulto pelo storage (o `list`, o `download` e o `remove` são do
bucket, e a RLS de `attachments` não os protege). Rode no SQL Editor o bloco
`do $$ ... $$` da seção "anexos" de `20261030120000_privado.sql` (copie do
arquivo; é só o trecho de `storage.objects`, depois das políticas de
`public.attachments`) e confira de novo. **Ninguém escolhe um titular antes de esta
conferência dar `true` nas duas.**

## 2. Funções

O `_shared` vai embutido em cada função no deploy: toda função que importa um
módulo mudado, direta ou indiretamente, precisa ser publicada de novo. O módulo
mudado neste bloco:

| Módulo | O que mudou |
|--------|-------------|
| `destinatarios.ts` | Ganhou `leitoresDoCartao(membros, titular, usaBanco)`: os adultos e, com titular e dado do banco, só o titular e os donos (o titular que saiu da carteira some). Continua sem import |

| Função | O que muda para ela |
|--------|---------------------|
| `evaluate-credit-card-alerts` | **Depois da migração.** Lê `holder_user_id`; o aviso de limite com o total do banco, de um cartão com titular, vai só ao titular e aos donos. O alerta por categoria e o cartão da casa seguem a todos os adultos |
| `credit-card-calendar-alerts` | **Depois da migração, e só com o front** (§7 de `BLOCO_5_DEPLOYMENT.md`). Os avisos de um cartão com titular que carregam o total do banco (fechou, vence, vence hoje, e a fatura alta quando alguma fechada da média usou o total do banco) vão só ao titular e aos donos; o "fecha em breve" e a fechada sem total gravado vão a todos |
| `insights-daily` | **Depois da migração, e só com o front** (`BLOCO_6B_DEPLOYMENT.md`). O `fatura_fechou` de um cartão com titular vira um insight do titular e de cada dono (`user_id`), e não da carteira. O `relatorio_mes` não conta a diferença para o banco de um cartão com titular |

`capture` e `notify-transaction-created` **não** leem mais nada do 7B (eles liam
`is_private`, que saiu). `evaluate-budgets` e `evaluate-bills-reminders`
alcançam o `destinatarios.ts`, mas não usam o `leitoresDoCartao`: a publicação não
é necessária.

**O código de cada função é o do repositório inteiro.** Se os Blocos 5, 6A, 6B e
7A ainda não subiram, publicar uma função traz também o que esses blocos mudaram
nela, e valem as restrições dos roteiros deles. Hoje, com o Bloco 9, as três
acima só sobem com o front do 2.0 (veja `BLOCO_9_DEPLOYMENT.md`).

**Ordem:** primeiro as migrações (§1), depois as Edges, e o front por último.

```bash
supabase functions deploy evaluate-credit-card-alerts credit-card-calendar-alerts insights-daily --use-api
```

**Até o front subir, nada daqui aparece para ninguém**, porque nenhum cartão tem
titular.

## 3. Conferência pós-deploy

Só leitura. Estas valem a partir do momento em que alguém escolhe o primeiro
titular.

**O titular e as políticas, de novo.** As conferências de `holder_user_id`,
`credit_card_statement_totals`, `attachments` e `storage.objects` do §1.3, na
mesma ordem: um `db push` posterior, ou alguém no Dashboard, pode ter recriado as
políticas do 7A. Em especial as duas do storage.

**Os logs das Edges.** Em Dashboard → Edge Functions → `evaluate-credit-card-alerts`
→ Logs, um `column ... does not exist` com `holder_user_id` quer dizer que a Edge
subiu antes da migração: aplique a migração (§1.2), e a próxima execução volta ao
normal.

**Nenhum aviso de fatura com o total do banco chegou a quem não é titular nem
dono.** Não há consulta para isso: o `metadata` do aviso varia por tipo. Depois do
primeiro cartão com titular e da primeira fatura fechada com total gravado, abra o
sino da conta de um membro adulto que não é titular nem dono: ele não deve ter o
aviso de fatura fechada, de vencimento, de fatura acima do normal nem de limite
daquele cartão. O "fecha em breve" chega a todos, de propósito (Ruling 6).

## 4. O que não fazer neste bloco

**Não escolha o titular por SQL.** O gatilho do titular confere o adulto, mas o
SQL Editor roda sem `auth.uid()` e passa pela regra do dono. Escolha pela tela,
como dono.

**Não publique o `credit-card-calendar-alerts` nem o `insights-daily` antes do
front do 2.0**, como nos Blocos 5 e 6B: os links dos avisos não existem no `main`.

## 5. Compatibilidade com o front de `main`

Conferido no código de `main` (`git grep` de `holder_user_id`,
`conferencia_liberada` e `anexo_oculto` em `src/` e `supabase/`): **nada lê,
escreve ou chama o que este bloco cria.**

| O que muda no banco | Por que `main` não sente |
|---|---|
| `credit_cards.holder_user_id` (nula) | Coluna nova; `main` lê os cartões por lista explícita e não a pede. O cartão sem titular é "da casa": a conferência e o PDF seguem abertos a todo adulto |
| Políticas de `credit_card_statement_totals`, `attachments` e `storage.objects` | A conferência (`conferencia_liberada`) é verdadeira para o cartão da casa, e o `anexo_oculto` é falso sem titular: o resultado é o de hoje para toda carteira sem titular |
| Edges | Sem titular, as três Edges respondem como antes; a única diferença é uma coluna a mais no `select` |

## 6. Com o front

Quando o front do 2.0 subir e as Edges estiverem no ar (§2), confira com duas
contas de teste (uma dona e uma membro), numa carteira compartilhada de teste:

- **O titular.** Só a dona vê o seletor, no cadastro e na edição do cartão, com os
  adultos da carteira e "Cartão da casa". A membro que tenta definir o titular
  pelo app não vê o seletor, e pela API recebe `TITULAR_SO_DONO`. Num cartão com
  titular, a membro que não é titular nem dona vê "Só o titular do cartão e o dono
  da carteira conferem esta fatura." e não vê o total do banco;
- **Os anexos.** O PDF da fatura de um cartão com titular some para a membro (a
  lista e o storage);
- **Os avisos.** O aviso de fatura fechada, de limite e o insight "fatura fechou"
  de um cartão com titular chegam só ao titular e aos donos;
- **O titular que sai.** Depois do Bloco 9, tirar o titular da carteira (ou
  torná-lo convidado) devolve o cartão à casa.

**O que fica de fora, de propósito.** A carteira pessoal continua sendo a
privacidade total. As lacunas conhecidas (o objeto do anexo que fica até a
limpeza, o insight da fatura só com o titular e os donos) estão na seção 19 de
`docs/JORNADAS.md`.
