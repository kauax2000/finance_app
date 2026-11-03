# Publicar o Bloco 7A: papéis e limites

**3/11/2026: só a migração `20261029120000_papeis.sql` subiu à produção** (para a divisão), numa transação com planos, projetos e divisão, depois de um ensaio com `rollback`. A `20261029130000_limites.sql` não subiu. Retrato anterior em `backups-prod/antes-planos-papeis-projetos-divisao-20261103-1715.json`.

Reúne o convidado, o limite por pessoa e o app do convidado:

- a migração `20261029120000_papeis.sql`: o papel `guest` em `workspace_members`
  e em `workspace_invites`, o responsável do convidado
  (`workspace_members.sponsor_user_id`), as colunas `menor` e `consentimento_em`
  do convite, os checks `workspace_invites_guest_requer_email` e
  `workspace_invites_menor_requer_consentimento`, o helper `is_workspace_adult`,
  as políticas que tiram da casa o que não é do convidado (transações dele só as
  dele, e só despesa; orçamento, contas, assinaturas, parcelamentos, faturas e conferências só
  do adulto; categorias e cartões só para ler; anexos e storage pelo autor),
  `trocar_papel`, e as RPCs `accept_workspace_invite`, `marcar_insight`,
  `registrar_insight`, `garantir_orcamentos_do_mes`,
  `complete_workspace_categories_onboarding` e
  `delete_workspace_installment_plan_cascade` redefinidas;
- a migração `20261029130000_limites.sql`: as tabelas `workspace_member_limits`
  (o limite mensal da pessoa) e `limites_avisados` (o dedupe do aviso em 80% e
  100%), e o tipo `limite_pessoa` nos checks de `insights` e
  `insights_silenciados`;
- as Edges: os avisos da casa passam a ir só aos adultos (o helper
  `_shared/destinatarios.ts`), o convite grava o papel, o menor e o
  consentimento, e o `evaluate-budgets` avalia o limite da pessoa
  (`_shared/limite-pessoa.ts`). **Nenhuma Edge nova, nenhum cron novo, nenhum
  segredo novo**;
- no front do 2.0: o papel no convite (Membro ou Convidado, "É menor de idade" e a
  caixa do responsável legal), a troca de papel na linha do membro, a seção de
  limites em Membros, a navegação e a guarda de rota do convidado, o Painel dele
  e as telas de Categorias e Cartões só para ler.

**Estado em 25/10/2026: nada publicado.** O front do `finance-app-2.0` também
não: ele só vai para `main`, e para produção, quando os blocos planejados
estiverem prontos (decisão do dono).

**A migração dos papéis sobe antes das Edges de convite, e ninguém é convidado como
`guest` antes de o front do 2.0 subir.** As duas coisas têm o mesmo motivo: as
migrações só acrescentam e as Edges mantêm o comportamento de hoje quando o corpo
não traz o campo novo, então `main` não sente nada enquanto não existir um
`guest`. No dia em que existir, `main` mostraria a ele a tela de membro inteira,
com erros da RLS no lugar do que ele não pode ver (§4).

Faça na ordem. Todo SQL abaixo cabe como está no SQL Editor: ele não leva id,
chave nem URL, e nada precisa ser trocado. **Nunca** salve no repositório o
resultado de uma conferência (o repositório é público).

## 0. Pré-requisitos

- **Os Blocos 3A, 3B, 4, 5, 6A e 6B vão antes, ou junto.** A migração do Bloco 7A
  é a última da fila; se os outros ainda não subiram, o `db push` aplica todas em
  ordem. Faça as conferências dos roteiros anteriores depois dele. A segunda
  migração mexe nos checks de `insights.kind` criados na do 6B, então a do 6B
  precisa ter sido aplicada antes (a ordem do `db push` garante).
- **A CLI** do Homebrew, 2.121 ou mais nova, com o projeto ligado
  (`supabase link`, uma vez só). Sem Docker nesta máquina, as funções sobem pela
  API (`--use-api`), e o pgTAP não roda aqui nem na CI: a RLS nova é trancada por
  testes de fonte sobre a migração (`src/lib/papeis/migracao-papeis.test.ts` e
  `src/lib/limites/migracao-limites.test.ts`), e as conferências do §1 cobrem o
  mesmo chão no banco de verdade.
- **Nenhum segredo novo.** As Edges usam a mesma service role e os mesmos
  `CRON_SECRET` de sempre. O `supabase/config.toml` não mudou.
- **O banco de desenvolvimento é o de produção.** Não rode nada disto sem o
  pedido explícito do dono.

## 1. Migrações

```bash
supabase db push --linked
```

Aplica, **nesta ordem**, `20261029120000_papeis.sql` e `20261029130000_limites.sql`
(e, antes delas, as que ainda não subiram). A ordem importa: a segunda usa o
`is_workspace_adult` que a primeira cria.

As duas só acrescentam: nenhum `drop table`, nenhum `drop column`, os checks só
crescem (`guest` entra, nada sai) e as colunas novas têm padrão. Os checks novos
entram `not valid` e são validados em seguida, por cautela: as duas etapas rodam
na mesma transação do `db push`, então o padrão não encurta o lock, e nestas
tabelas pequenas isso não pesa.

Depois, rode as conferências **uma por vez**: o SQL Editor mostra só o resultado
do último comando.

**Ninguém é convidado ainda.** Esta é a conferência que diz que a migração não
mudou nada para quem usa o app: antes do lançamento do 2.0 não pode existir
nenhuma linha com `guest`.

```sql
select role, count(*)
from public.workspace_members
group by role
order by 1;
```

Esperado: só `owner` e `member`. Uma linha `guest` antes do lançamento quer dizer
que alguém foi convidado como convidado, ou que o papel foi trocado por SQL: veja
o §4.

```sql
select role, count(*)
from public.workspace_invites
group by role
order by 1;
```

Esperado: só `member`.

**Nenhuma política de `transactions` sem o ramo do convidado.** É a política que
decide o que o convidado lê, edita e apaga; ela precisa citar o adulto e o autor
(`user_id = auth.uid()`).

```sql
select policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'transactions'
  and cmd in ('SELECT', 'UPDATE', 'DELETE', 'ALL')
  and (
    coalesce(qual, '') not like '%is_workspace_adult%'
    or coalesce(qual, '') not like '%auth.uid()%'
  );
```

Esperado: nenhuma linha. Uma linha é uma política de `select`, `update` ou
`delete` que ainda deixa o convidado ver ou mexer no que não é dele. Se vier uma,
**pare**: rode de novo a seção 4 do arquivo da migração ("transactions").

**O convidado só lança despesa.** O `insert` e o `with check` do `update` exigem
`type = 'expense'` de quem não é adulto: o convidado não cria receita nem vira uma
despesa dele em receita.

```sql
select policyname, cmd, coalesce(with_check, '') like '%''expense''%' as so_despesa
from pg_policies
where schemaname = 'public'
  and tablename = 'transactions'
  and cmd in ('INSERT', 'UPDATE')
order by 2;
```

Esperado: duas linhas (`INSERT` e `UPDATE`), as duas com `so_despesa` `true`. Um
`false` quer dizer que a seção 4 não subiu: rode-a de novo.

**As políticas de anexo do storage passaram a ser do adulto ou do autor.** O bloco
`do $$ … exception when insufficient_privilege` da seção "7. anexos" da migração
recria as duas políticas de `storage.objects`. Se o papel da migração não for
dono de `storage.objects` (o caso que o `BLOCO_2_DEPLOYMENT.md` já registrou neste
projeto), o bloco só emite o aviso `papeis: sem privilégio para as políticas de
storage.objects; aplique pelo SQL editor do Dashboard.`, é desfeito em silêncio, e
o `db push` termina sem erro.

```sql
select policyname, cmd,
  coalesce(qual, '') || coalesce(with_check, '') like '%is_workspace_adult%' as adulto
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname in ('Workspace members can view attachments', 'Workspace members can delete attachments')
order by 1;
```

Esperado: duas linhas, as duas com `adulto` `true`.

Se vier `false`, faltar uma linha ou o log do `db push` trouxer o aviso acima,
**as políticas antigas continuam valendo**: as de qualquer membro da pasta da
carteira. Com elas, o convidado lista, baixa e apaga pelo storage todo recibo da
carteira, inclusive os anexos de contas e faturas e os das transações dos outros.
A RLS de `attachments` não o protege, porque o `list`, o `download` e o `remove` são
do bucket. Rode no SQL Editor o bloco `do $$ ... $$` da seção "7. anexos" de
`20261029120000_papeis.sql` (copie do arquivo; é só o trecho de `storage.objects`,
depois das políticas de `public.attachments`) e confira de novo. **Ninguém é
convidado antes de esta conferência dar `true` nas duas.**

**As tabelas só do adulto não têm política só de membro.** Orçamento, contas,
assinaturas, parcelamentos, pagamentos de fatura, alertas de categoria do cartão e
totais da fatura:

```sql
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'budgets', 'bills', 'bill_instances', 'workspace_subscriptions',
    'workspace_installment_plans', 'credit_card_invoice_payments',
    'credit_card_category_spend_alerts', 'credit_card_statement_totals'
  )
  and (coalesce(qual, '') || coalesce(with_check, '')) not like '%is_workspace_adult%'
order by 1, 2;
```

Esperado: nenhuma linha.

**Os checks de papel e do convite existem e foram validados.**

```sql
select conrelid::regclass as tabela, conname, convalidated, pg_get_constraintdef(oid) as definicao
from pg_constraint
where conname in (
  'workspace_members_role_check',
  'workspace_invites_role_check',
  'workspace_invites_guest_requer_email',
  'workspace_invites_menor_requer_consentimento'
)
order by 1, 2;
```

Esperado: quatro linhas, todas com `convalidated` `true`. O papel de membro aceita
`owner`, `member` e `guest`; o do convite, `member` e `guest`; o convidado exige
e-mail; o menor exige `guest` e `consentimento_em`.

**Ninguém vira dono por `update`, e a troca de papel é só do dono.**

```sql
select
  has_function_privilege('authenticated', 'public.trocar_papel(uuid, uuid, text)', 'execute') as trocar_authenticated,
  has_function_privilege('anon', 'public.trocar_papel(uuid, uuid, text)', 'execute') as trocar_anon,
  has_function_privilege('authenticated', 'public.accept_workspace_invite(text, uuid, text)', 'execute') as aceitar_authenticated,
  has_function_privilege('service_role', 'public.accept_workspace_invite(text, uuid, text)', 'execute') as aceitar_service,
  has_function_privilege('anon', 'public.is_workspace_adult(uuid)', 'execute') as adulto_anon;
```

Esperado, na ordem: `true`, `false`, `false`, `true`, `true`. O `trocar_papel`
confere dentro dele que quem chama é o dono. O `accept_workspace_invite` só abre
para a service role (é a Edge de aceite que o chama). O `is_workspace_adult` abre
para o `anon` de propósito: como o `is_workspace_member`, ele devolve falso, e a
política responde vazio em vez de dar erro.

```sql
select policyname, cmd, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'workspace_members'
  and policyname = 'Owners can update member roles';
```

Esperado: uma linha, e o `with_check` cita `is_workspace_owner` e a lista
`member`, `guest`: um `update` direto de `role` para `owner` falha.

**As duas tabelas do limite existem, com RLS, e estão vazias.**

```sql
select c.relname, c.relrowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('workspace_member_limits', 'limites_avisados')
order by 1;
```

Esperado: duas linhas, as duas com `true`.

```sql
select
  (select count(*) from public.workspace_member_limits) as limites,
  (select count(*) from public.limites_avisados) as avisados;
```

Esperado: `0` e `0`. **`limites_avisados` fica vazio até alguém definir um limite
e passar de 80%**: ninguém define limite antes do front do 2.0, e a tabela só é
escrita pela Edge `evaluate-budgets`. Uma linha em `limites_avisados` sem limite
definido é problema.

```sql
select policyname, cmd
from pg_policies
where schemaname = 'public' and tablename = 'limites_avisados';
```

Esperado: nenhuma linha. A RLS está ligada e **não há política de propósito**: só
a service role escreve e lê.

```sql
select
  has_table_privilege('authenticated', 'public.limites_avisados', 'select') as avisados_select,
  has_table_privilege('authenticated', 'public.workspace_member_limits', 'insert') as limites_insert,
  has_table_privilege('anon', 'public.workspace_member_limits', 'select') as limites_anon;
```

Esperado, na ordem: `false`, `true`, `false`. O `insert` do limite existe como
privilégio, mas a política só o deixa passar para o dono (o `with check` é
`is_workspace_owner`).

**O tipo `limite_pessoa` entrou nos dois checks, sem tirar nenhum.**

```sql
select conname, pg_get_constraintdef(oid) like '%limite_pessoa%' as tem_limite_pessoa
from pg_constraint
where conname in ('insights_kind_check', 'insights_silenciados_kind_check')
order by 1;
```

Esperado: duas linhas, as duas com `true`.

## 2. Funções

O `_shared` vai embutido em cada função no deploy: toda função que importa um
módulo mudado, direta ou indiretamente, precisa ser publicada de novo. Os módulos
mudados neste bloco são:

| Módulo | O que mudou |
|--------|-------------|
| `destinatarios.ts` | Novo, sem import: `adultosDaCarteira` (dono e membro, sem repetir e sem o autor) e `donosDaCarteira` |
| `limite-pessoa.ts` | Novo, sem import: o nível do limite (80 e 100), o gasto da pessoa no mês (o crédito pelo mês do fechamento) e quem recebe o aviso |
| `insights/textos.ts` | Ganhou o modelo `limite_pessoa` (só o `evaluate-budgets` o usa) |
| `process-transaction-notification.ts` | O aviso de lançamento vai aos adultos, menos o autor |
| `workspace-invite-email.ts` | Ganhou o parágrafo do responsável legal, só no convite de menor |

**Como a lista foi feita:** para cada `supabase/functions/*/index.ts`, foram
seguidos os `import` relativos, diretos e através do `_shared`, até o fim, e ficou
na lista toda função que alcança um desses módulos **ou** teve o próprio
`index.ts` mudado. A conferência é refazer a conta:

```bash
git log --oneline -- supabase/migrations/20261029120000_papeis.sql
git diff <o commit antes dessa migração>..HEAD --name-only -- supabase/functions
```

(e seguir os imports de cada `index.ts`; `grep -rn "destinatarios\|limite-pessoa\|insights/textos\|process-transaction-notification\|workspace-invite-email" supabase/functions` mostra quem importa os cinco módulos).

| Função | Alcança | O que muda para ela |
|--------|---------|---------------------|
| `workspace-invites-create` | `workspace-invite-email`; o `index.ts` mudou | **Obrigatória, e depois da migração dos papéis.** Aceita `role`, `menor` e `consentimento`, e grava `menor` e `consentimento_em`. Um corpo sem `role` continua `member`, sem menor e sem consentimento: o mesmo convite de hoje |
| `workspace-invites-resend` | `workspace-invite-email`; o `index.ts` mudou | **Obrigatória, e depois da migração dos papéis.** Lê `menor` do convite para decidir o parágrafo do e-mail |
| `evaluate-budgets` | `destinatarios`, `limite-pessoa`, `insights/textos`; o `index.ts` mudou | **Obrigatória, e depois da migração dos limites.** Avalia o limite da pessoa e avisa. Sem limite definido, só faz uma leitura a mais. O corpo antigo (sem `transaction_id` nem `workspace_id`) responde como hoje |
| `capture` | só o `index.ts` mudou | Passa o `transaction_id` ao `evaluate-budgets` (sempre, com ou sem categoria) e, se o dono do token é convidado, limita o histórico que casa aos lançamentos dele |
| `notify-transaction-created` | `destinatarios`, `process-transaction-notification` (o `index.ts` não mudou) | O aviso de despesa vai aos adultos; a despesa do convidado avisa o dono e os membros |
| `evaluate-credit-card-alerts` | `destinatarios`; o `index.ts` mudou | Avisa só os adultos; ao convidado responde `{ ok: true }`, sem dado da casa |
| `evaluate-bills-reminders` | `destinatarios`; o `index.ts` mudou | Avisa só os adultos (sobe com a migração do 6A) |
| `credit-card-calendar-alerts` | `destinatarios`; o `index.ts` mudou | Avisa só os adultos. **Só sobe com o front** (§7 de `BLOCO_5_DEPLOYMENT.md`) |
| `insights-daily` | `destinatarios`, `insights/textos`; o `index.ts` mudou | Avisa só os adultos. **Só sobe com o front** (`BLOCO_6B_DEPLOYMENT.md`) |

**O que é obrigatório e o que não é.** A conta tem três níveis:

- **Obrigatórias para o bloco existir:** `workspace-invites-create`,
  `workspace-invites-resend` e `evaluate-budgets`. Sem as duas primeiras o
  front do 2.0 não consegue convidar ninguém como convidado (a Edge antiga
  **ignora `role` e cria um convite de membro, sem erro**); sem a terceira, o
  limite não avisa.
- **Obrigatórias antes do primeiro convidado, neutras até lá:** `capture`,
  `notify-transaction-created`, `evaluate-credit-card-alerts`,
  `evaluate-bills-reminders`, `credit-card-calendar-alerts` e `insights-daily`.
  Enquanto só existem donos e membros, o filtro de adultos devolve a mesma lista
  de antes e nada muda. Depois do primeiro `guest`, sem elas o convidado recebe
  o aviso de orçamento, de fatura, de conta e de insight da casa.
- **Só ganhou um trecho sem uso:** o `insights/textos.ts` chega à `insights-daily`
  com o modelo `limite_pessoa`, que ela nunca produz (quem o produz é o
  `evaluate-budgets`). Nenhuma função da lista ganhou *apenas* um import sem uso:
  as nove usam o que importam. As que **não** entram, porque não alcançam nenhum
  módulo mudado e o `index.ts` delas não mudou, são `activity-logs`,
  `attachments-cleanup`, `billing-daily`, `delete-user`, `ia-ler`,
  `push-subscribe`, `push-unsubscribe`, `review-reminder`, `run-recurring-billing`,
  `sessions` e `workspace-invites-accept`. O `review-reminder` está fora **de
  propósito**: ele lembra cada pessoa dos próprios itens a conferir, e o convidado
  que lançou tem o lembrete dos dele. O `workspace-invites-accept` não muda
  porque o papel e o responsável são gravados dentro da RPC
  `accept_workspace_invite`.

**O código de cada função é o do repositório inteiro.** Se os Blocos 5, 6A e 6B
ainda não subiram, publicar uma função traz também o que esses blocos mudaram
nela, e valem as restrições dos roteiros deles: o `evaluate-budgets` do Bloco 5
soma pelo mês do fechamento da fatura (e o aviso de orçamento de `main` avalia
mais de um mês), o `evaluate-bills-reminders` sobe com a migração do 6A, e a
`credit-card-calendar-alerts` e a `insights-daily` só sobem com o front.

**Ordem:** primeiro as migrações (§1), depois as Edges, e o front por último.

Depois das migrações, as obrigatórias e as neutras que não esperam o front:

```bash
supabase functions deploy workspace-invites-create workspace-invites-resend evaluate-budgets capture notify-transaction-created evaluate-credit-card-alerts evaluate-bills-reminders --use-api
```

**Neste repositório, `evaluate-credit-card-alerts` já lê coluna do 7B** (`holder_user_id`): aplique `20261030120000_privado.sql` antes (`BLOCO_7B_DEPLOYMENT.md` §0), ou elas param até a migração subir.

Quando o front do 2.0 subir, publique as duas que esperam por ele (se as outras já
subiram por um roteiro anterior, estas são as únicas pendentes):

```bash
supabase functions deploy credit-card-calendar-alerts insights-daily --use-api
```

**As Edges de convite sobem antes do front, não junto.** O front do 2.0 manda
`role: 'guest'`; com a Edge antiga no ar, o convite sai como de membro e a tela
mostra o papel pedido, não o criado.

**Confirme que o convite sem `role` continua `member`.** Depois de publicar as
duas Edges de convite, e com o front de `main` ainda no ar, crie um convite
pelo front de `main` e rode. Use o **link** (ou o seu próprio e-mail): o convite
por e-mail envia uma mensagem de verdade, e o banco de desenvolvimento é o de
produção. O link não prova o ramo do e-mail, então, se quiser prová-lo, convide
um endereço seu:

```sql
select role, menor, consentimento_em, invited_email, created_at
from public.workspace_invites
order by created_at desc
limit 1;
```

Esperado: `member`, `false` e `consentimento_em` nulo. Apague o convite de teste
pela tela (Revogar).

## 3. Conferência pós-deploy

Só leitura.

**A avaliação do limite não deixou rastro sem limite definido.**

```sql
select count(*) from public.limites_avisados;
```

Esperado: `0` até alguém definir um limite pelo front do 2.0 e passar de 80%. Se
vier mais que zero sem limite definido, veja os logs de `evaluate-budgets`.

**As políticas de anexo do storage continuam do adulto ou do autor.** A mesma
conferência do §1, de novo depois do deploy: um `db push` posterior, ou alguém no
Dashboard, pode ter recriado as de membro.

```sql
select policyname, cmd,
  coalesce(qual, '') || coalesce(with_check, '') like '%is_workspace_adult%' as adulto
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname in ('Workspace members can view attachments', 'Workspace members can delete attachments')
order by 1;
```

Esperado: duas linhas, as duas com `adulto` `true`. Um `false` deixa o convidado
ler e apagar todo recibo da carteira pelo storage: rode no SQL Editor o bloco
`do $$ ... $$` da seção "7. anexos" da migração, como no §1.

**Os logs das Edges.** Em Dashboard → Edge Functions → `evaluate-budgets` →
Logs, uma falha do limite aparece como `evaluate-budgets: limite ...` e **não
muda** a resposta do orçamento: o limite é um acréscimo, e o aviso de orçamento
de sempre sai igual. As causas esperadas são a tabela ausente (a migração
`20261029130000_limites.sql` não subiu) e a entrega do aviso.

**Nenhum aviso da casa chegou a um convidado.** Só dá para ver depois do primeiro
convidado (§6):

```sql
select n.type, n.metadata->>'kind' as kind, count(*)
from public.notifications n
join public.workspace_members m on m.user_id = n.user_id and m.workspace_id = n.workspace_id
where m.role = 'guest'
group by 1, 2;
```

Esperado: no máximo uma linha, `budget` / `member_limit` (o aviso do limite dele).
O insight do limite é uma linha de `insights`, sem notificação própria. Qualquer
outra linha (`bill`, `credit_card`, `insight`, ou um `budget` de outro `kind`) é
aviso da casa que vazou: confira se a Edge daquele aviso foi republicada.

## 4. O que não fazer neste bloco

**Não convide ninguém como `guest` antes do front do 2.0 subir.** No front de
`main` o papel `guest` vira `member` na leitura (`fetch-workspaces-data.ts`), então
o convidado veria a tela de membro inteira (Orçamento, Contas a pagar, Membros,
faturas), e a RLS responderia vazio ou com erro onde `main` espera dado. Isso vale para as duas
portas: o convite por e-mail com papel (só o front do 2.0 manda `role`) e a troca
de papel por SQL (`update public.workspace_members set role = 'guest'`). **Não troque
papel por SQL**: o `trocar_papel` preenche o responsável (`sponsor_user_id`) e
grava o histórico, e o `update` direto não.

**Não defina limite por SQL antes do front.** A linha em
`workspace_member_limits` faz o `evaluate-budgets` avisar a pessoa e o dono, e
`main` não tem tela para ver o limite.

**Não apague linhas de `limites_avisados` para "reenviar" o aviso.** Ela é o
dedupe: sem a linha, o aviso de 80% e o de 100% saem de novo no próximo
lançamento do mês. Apagar e regravar o limite **não** limpa o dedupe: a linha de `limites_avisados`
só sai quando a pessoa sai da carteira. Para recomeçar um mês de propósito (e
reenviar os avisos), apague só a linha daquela pessoa e daquele mês:

```sql
delete from public.limites_avisados
where workspace_id = '<carteira>' and user_id = '<pessoa>' and ym = '<AAAA-MM>';
```

**Não deixe um link de membro ativo ao convidar um convidado.** O link de convite
é sempre de membro, sem limite de usos, por 7 dias, e funciona como portador:
quem saiu da carteira como convidado e ainda tem o link entra de novo como
membro. Para um menor, prefira sempre o convite por e-mail, e revogue em Membros
os links de membro que ele possa ter visto (lacuna 60 de `docs/JORNADAS.md`).

**Para desfazer um convidado**, sem apagar nada: o dono troca o papel de volta
para membro pela tela (`trocar_papel` com `member`, que também zera o
responsável).

## 5. Compatibilidade com o front de `main`

Conferido no código de `main` (`git grep` de `guest`, `sponsor_user_id`, `menor`,
`consentimento_em`, `workspace_member_limits`, `limites_avisados`, `trocar_papel` e
`is_workspace_adult` em `src/` e `supabase/`): **nada lê, escreve ou chama o que
este bloco cria.**

| O que muda no banco | Por que `main` não sente |
|---|---|
| Checks de papel em `workspace_members` e `workspace_invites` | Só crescem: `guest` entra, nada sai. `main` só grava `member` |
| `workspace_members.sponsor_user_id` | Coluna nova e nula; `main` lê as colunas por lista explícita e não a pede |
| `workspace_invites.menor` e `consentimento_em` | Colunas novas; `menor` tem padrão `false`, e o `insert` de `main` não as manda. Os checks novos valem para o que já existe (`role` é `member`, o e-mail não importa para o membro) |
| Políticas das tabelas da casa, `transactions` e `attachments` | Passam a chamar `is_workspace_adult`, que vale para `owner` e `member`: **o resultado é o de hoje para toda carteira sem convidado** |
| Políticas de `categories` e `credit_cards` | A escrita passa a pedir adulto; a leitura segue de membro. Igual para dono e membro |
| RPCs redefinidas | Dono e membro seguem passando; o convidado recebe `0` ou `null` em silêncio nas duas que o Painel chama (`garantir_orcamentos_do_mes`, `registrar_insight`). O `search_path` das redefinidas passou a ser vazio, com tudo qualificado |
| `workspace_member_limits`, `limites_avisados` | Tabelas novas; `main` não as consulta. Sem limite definido, o `evaluate-budgets` só lê uma linha a mais por chamada |
| Tipo `limite_pessoa` nos checks de `insights` | Os checks só crescem |
| Edges | O filtro de adultos devolve a mesma lista de antes enquanto só existem donos e membros; o convite sem `role` é `member`; o `evaluate-budgets` com o corpo antigo responde como antes |

**O ponto de atenção.** Um único: o primeiro `guest`. Enquanto ele não existe,
nenhuma política nova muda nada para ninguém. Quando existir, só o front do 2.0 sabe
o que mostrar a ele (§4).

## 6. Com o front

Quando o front do 2.0 subir e as Edges estiverem no ar (§2), confira com duas
contas de teste (uma dona e uma convidada, de um e-mail que o dono controla), numa
carteira compartilhada de teste:

- em Membros, o convite por e-mail traz **Membro** e **Convidado**; com Convidado
  aparece "É menor de idade", e marcá-lo mostra a caixa "Sou o responsável legal
  e autorizo o uso do app (LGPD, art. 14).", obrigatória; o link de convite é sempre
  de membro (a nota diz isso). Convidar um convidado sem e-mail, ou um menor sem a
  caixa marcada, é recusado com a frase em português;
- o e-mail de um convite de menor traz o parágrafo "… criou este convite como
  responsável legal e autorizou o uso do app por você, como pede a LGPD (art. 14).";
- aceito o convite, a linha do membro mostra "Convidado" e, no banco,
  `sponsor_user_id` é quem convidou:

  ```sql
  select role, sponsor_user_id is not null as tem_responsavel
  from public.workspace_members
  where role = 'guest';
  ```

  Esperado: `guest` e `true`;
- **o convidado vê** o Painel dele (o limite, o gasto do mês, as transações dele e
  "Lançar despesa"), Transações (só as dele; o "Nova transação", a paleta e o
  formulário não oferecem receita, e o Atalho com uma receita responde "Convidado
  lança só despesa…"), Categorias e Cartões só para ler (sem
  criar, editar nem excluir; o cartão não é link), Minha conta, Configurações,
  Planos e o Cofre aberto. **Não vê** Orçamento, Previsão, Contas a pagar,
  Assinaturas, Membros, a fatura e a conferência. Digitar o endereço de uma tela
  fora da lista leva ao Painel;
- a despesa do convidado avisa o dono e os membros, e o lançamento de um membro
  **não** avisa o convidado;
- o dono define o limite do convidado em Membros → Limites; a despesa que leva o
  gasto a 80% avisa a pessoa e o dono (sino e insight "Limite de {nome}" / "Seu
  limite do mês"), e a que leva a 100% avisa de novo, uma vez por nível e por mês.
  Um segundo lançamento acima de 80% no mesmo mês não repete. Uma compra no cartão
  de crédito depois do fechamento conta no mês seguinte;
- o dono que define limite para si recebe **um** aviso, não dois;
- "Trocar papel" na linha de um membro: só o dono a vê, e nunca na linha de um dono
  nem na própria. Rebaixar um membro a convidado ou promovê-lo de volta funciona, e
  o histórico de atividade traz `family_role_changed`;
- o convidado ocupa um assento do Plano Família (a cobertura é dos 5 primeiros
  membros de quem assina, de qualquer papel; `tem_cobertura` não mudou).

**O que fica de fora, de propósito.** O titular do cartão e a divisão (`paid_by`)
são do Bloco 7B e 7C; a coluna `sponsor_user_id` já nasce para o 7C, que a usa como
o responsável que paga pelo convidado. Sem plano, nada que protege alguém se
desliga: `garantir_escrita` não mexe em RLS, o convidado continua restrito e o
limite continua visível. As lacunas conhecidas (a meta de poupança legível pela API,
o limite que sobe no meio do mês sem reabrir o aviso, a importação que não avalia o
limite, o e-mail que ainda diz "workspace") estão na seção 20 de `docs/JORNADAS.md`.
