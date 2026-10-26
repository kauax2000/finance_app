# Publicar o Bloco 9: correções antes do lançamento

Reúne as correções que o levantamento do Bloco 9 pediu antes de o 2.0 ir para
`main` (`docs/superpowers/plans/2026-10-26-bloco-9-levantamento.md`):

- a migração `20261102120000_bloco9.sql`, que só acrescenta:
  - o gatilho `soltar_titular_que_sai` em `workspace_members` (#66): quem deixa a
    carteira, ou deixa de ser adulto, deixa de ser titular dos cartões dela, e o
    cartão volta a ser "da casa". Pula a carteira sendo apagada e a cascata
    (`pg_trigger_depth() > 1`);
  - o `attachments_enforce_quota` com o dono do objeto (#57): quem não é adulto só
    cria a linha de um objeto que ele mesmo subiu, senão `anexo_de_outro`
    (`42501`). A captura e a service role passam;
  - a tabela `workspace_ex_convidados` (RLS ligada, sem grant) e o gatilho
    `lembrar_ex_convidado` (#60). O `accept_workspace_invite` devolve o status
    `ex_convidado` para um convite **por link** de quem está nela, e apaga a linha
    num aceite com sucesso. O convite por e-mail passa;
  - o `criar_plano_parcelado` com `p_client_id` e `p_capture_meta` (#23): a
    captura reenviada devolve o plano que já existe. A assinatura antiga sai
    (`drop function`), e o `create_workspace_installment_plan` do `main`, que a
    chama por posição, cai na nova pelos `default`s;
  - o `garantir_escrita` em `projects`, `workspace_split_weights` e
    `workspace_member_limits` (#79): a carteira em só leitura deixa de aceitar
    escrita também ali;
  - a coluna `billing_avisos.pendente` (#87): o aviso de texto fixo fica pendente
    até a entrega dar certo;
- as Edges (a lista e a ordem estão no §2):
  - `workspace-invites-accept`: o `case 'ex_convidado'` devolve 403 "Peça ao dono
    um convite por e-mail.";
  - `capture`: passa o `client_id` e a `capture_meta` ao `criar_plano_parcelado`,
    sem o `update` à parte;
  - `credit-card-calendar-alerts`, `insights-daily`, `evaluate-credit-card-alerts`
    e `evaluate-budgets`: o vencimento do cartão é o primeiro `min(due_day, dias do
    mês)` estritamente depois do fechamento (#33), e o estorno no cartão abate a
    categoria da despesa (#35);
  - `insights-daily`: o "Apagar um" da duplicidade mantém o que tem anexo, depois
    o já revisado, depois o mais antigo (#48), e a mudança de preço só casa com a
    assinatura certa (#46);
  - `billing-checkout`: atualiza o nome e o CPF do cliente que já existe no Asaas
    (#81). `billing-daily`, `asaas-webhook` e `billing-cancel`: o destino do aviso
    é uma função só, os avisos de texto fixo pendentes são reenviados depois de 1
    hora, e o texto do estorno decide pelo `ativado_em` (#87);
  - `notify-transaction-created`: voltou ao corpo de antes do 7B, sem o gasto
    privado. **Não é igual ao de `main`**: leva também o que os Blocos 1 e 2
    mudaram nele;
- no front do 2.0: o formulário de estorno no cartão pede uma categoria de
  despesa, o Painel mostra o vencimento no mês certo, e o aviso "Vencimento …
  incomum" saiu do formulário do cartão. Cada lacuna e o arquivo dela estão em
  `docs/superpowers/plans/2026-10-26-bloco-9-levantamento.md`.

**Estado em 26/10/2026: nada publicado.** O front do `finance-app-2.0` também
não: ele só vai para `main`, e para produção, quando os blocos planejados
estiverem prontos (decisão do dono). **O banco de desenvolvimento é o de
produção:** nada deste roteiro roda sem o pedido explícito do dono.

**O SQL ainda não rodou contra um banco de verdade.** Os testes de fonte
(`src/lib/**/migracao-*.test.ts`) leem o texto da migração, não o comportamento.
O pgTAP `bloco9.test.sql` roda no projeto de teste (§1), nunca na CI.

Faça na ordem. Os marcadores são `<URL_DAS_FUNCOES>` (o endereço das Edges do
projeto) e `<CONVITE_POR_LINK>` (o link de um convite de teste). **Nunca** salve
no repositório um id, uma chave, uma URL, o SQL preenchido ou o resultado de uma
conferência: o repositório é público.

## 0. Pré-requisitos

- **Os Blocos 1 a 8 vão antes, ou junto.** A migração do Bloco 9 é a última da
  fila; se as outras ainda não subiram, o `db push` aplica todas em ordem (a do
  Bloco 8, `20261101120000_cobranca_asaas.sql`, cria o `billing_avisos` que ela
  estende). O Bloco 7B agora é só o titular (`BLOCO_7B_DEPLOYMENT.md`).
- **A CLI** do Homebrew, 2.121 ou mais nova, com o projeto ligado
  (`supabase link`, uma vez só). Sem Docker nesta máquina, as funções sobem pela
  API (`--use-api`).
- **Os tipos** (`src/types/database.ts`) foram editados à mão. Depois da migração
  aplicada num banco local ou de teste, rode o `npm run db:types` e confira o
  diff: ele deve só reordenar.
- **Nenhum segredo novo.** O `supabase/config.toml` não mudou.

## 1. O pgTAP, no projeto de teste

Rode **só no projeto de teste** (o mesmo do Sandbox do Bloco 8), com a string de
conexão copiada do painel dele (Settings › Database), que fica fora do
repositório. O projeto ligado por `supabase link` é o de produção: nenhum comando
desta seção leva `--linked`.

```bash
supabase db push --db-url "<string de conexão do projeto de teste>"
```

Aplica as migrações até `20261102120000_bloco9.sql`. Depois, rode no SQL Editor
do projeto de teste, um arquivo por vez, junto com os dos Blocos 7B a 8:

1. `supabase/tests/database/bloco9.test.sql`: 20 asserções, abre em `begin` e
   termina em `rollback`. Os casos: o plano parcelado que não duplica no
   reenvio, o titular que sai (o dono rebaixado a membro continua titular; o
   membro tirado e o rebaixado a convidado deixam o cartão da casa), o link que
   recusa o ex-convidado e o e-mail que aceita, a carteira apagada com convidado
   e titular sem quebrar, e a só leitura recusando insert e update em `projects`
   e insert, update e delete em pesos e limites. Esperado: 20 linhas `ok` e
   nenhuma `not ok`;
2. `supabase/tests/database/divisao.test.sql`: ajustado no Bloco 9 (sem o gasto
   privado). Esperado: 32 linhas `ok`;
3. os pgTAP dos Blocos 7B a 8 que já existiam (`security_privileges_policies`,
   `schema_integrity`, `security_definer_functions` e os demais da pasta). O
   esperado de cada um não mudou.

Qualquer `not ok` pára a publicação: leia a mensagem do teste, ela diz a
asserção.

## 2. A ordem de publicação

As Edges levam o `_shared` embutido: toda função que importa um módulo mudado,
direta ou indiretamente, tem de ser publicada de novo. Os módulos mudados no
Bloco 9 são `asaas`, `aviso-de-cobranca`, `billing`, `captura`,
`credit-card-cycle`, `insights/detectores`, `orcamento-mes`,
`process-transaction-notification` e `transaction-notify-rules`. As funções que
alcançam algum deles, ou cujo `index.ts` mudou:

| Função | Quando sobe | O que muda para ela |
|---|---|---|
| `workspace-invites-accept` | **1º, antes da migração.** Pode subir já | O `case 'ex_convidado'` → 403 "Peça ao dono um convite por e-mail.". Sem ele, depois da migração o status novo cai no `default` e vira 500 |
| `capture` | **Depois da migração** | Manda `p_client_id` e `p_capture_meta` ao `criar_plano_parcelado`. Antes da migração, a compra parcelada capturada dá 500: a função antiga não conhece os argumentos |
| `billing-checkout`, `billing-daily`, `asaas-webhook`, `billing-cancel` | **Depois da migração, e só com o front 2.0** (§6 de `BLOCO_8_DEPLOYMENT.md`) | Leem `billing_avisos.pendente`. O `billing-checkout` atualiza o cliente no Asaas |
| `credit-card-calendar-alerts`, `insights-daily`, `evaluate-budgets`, `evaluate-credit-card-alerts` | **Só com o front 2.0** | O vencimento e o estorno. Veja a nota abaixo |
| `notify-transaction-created` | **Só com o front 2.0** | Corpo de antes do 7B, mais o que os Blocos 1 e 2 mudaram |

**Não precisam subir:** `evaluate-bills-reminders`, `ia-ler` e `review-reminder`
alcançam o `credit-card-cycle.ts`, mas só usam funções que não mudaram.

**A `credit-card-calendar-alerts` publicada hoje só sobe de novo junto com o front
2.0.** O vencimento novo muda o mês do aviso para o cartão que fecha antes do
dia de vencer (fecha no dia 5, vence no 25): o `main` ainda conta "o mês
seguinte".

**O estorno no `evaluate-budgets` e no `evaluate-credit-card-alerts`.** Republicadas,
as duas passam a abater do gasto da categoria os estornos no cartão que o front
2.0 grava **no mesmo banco**. É intencional, e só diminui o gasto. Antes do front
2.0 ninguém grava estorno com categoria de despesa, então nada muda.

**Primeiro, a Edge do convite** (pode subir já, sem esperar o resto):

```bash
supabase functions deploy workspace-invites-accept --use-api
```

Os comandos desta seção não levam `--project-ref`: vão para o projeto ligado,
**que é o de produção**. Só com o pedido explícito do dono.

**Depois, a migração:**

```bash
supabase db push --linked
```

Aplica `20261102120000_bloco9.sql` (e, antes dela, as que ainda não subiram). Só
acrescenta: o único `drop` é o da assinatura antiga do `criar_plano_parcelado`,
que só a service role chama.

**Depois da migração, a captura:**

```bash
supabase functions deploy capture --use-api
```

**Com o front 2.0** (e as quatro de cobrança só depois de seguir o §6 do Bloco 8):

```bash
supabase functions deploy credit-card-calendar-alerts insights-daily evaluate-budgets evaluate-credit-card-alerts notify-transaction-created --use-api
supabase functions deploy billing-checkout billing-daily asaas-webhook billing-cancel --use-api
```

## 3. Conferências, uma por vez

O SQL Editor roda como `postgres` e mostra só o resultado do último comando.
Todas só leem.

**Os gatilhos existem e estão ligados.**

```sql
select c.relname as tabela, t.tgname as gatilho, t.tgenabled as ligado
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
where not t.tgisinternal
  and (
    (c.relname = 'workspace_members' and t.tgname in ('soltar_titular_que_sai', 'lembrar_ex_convidado'))
    or (c.relname in ('projects', 'workspace_split_weights', 'workspace_member_limits') and t.tgname = 'garantir_escrita')
  )
order by 1, 2;
```

Esperado: cinco linhas (`projects`, `workspace_member_limits` e
`workspace_split_weights` com `garantir_escrita`, `workspace_members` com os dois
gatilhos), todas com `ligado` `O`.

**As funções novas são `security definer`, com `search_path` vazio, e não abrem
para o `anon`.**

```sql
select proname, prosecdef as definer,
  coalesce(proconfig::text, '') like '%search_path%' as com_search_path,
  has_function_privilege('anon', oid, 'execute') as anon_executa,
  has_function_privilege('authenticated', oid, 'execute') as authenticated_executa
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in (
    'soltar_titular_que_sai', 'lembrar_ex_convidado', 'attachments_enforce_quota',
    'accept_workspace_invite', 'criar_plano_parcelado'
  )
order by 1;
```

Esperado: cinco linhas, com `definer` e `com_search_path` `true` e as duas últimas
colunas `false`. Só a service role executa.

**O `criar_plano_parcelado` é um só, com a chave do reenvio.**

```sql
select count(*) as assinaturas,
  bool_and(pg_get_function_identity_arguments(oid) like '%p_client_id uuid%'
    and pg_get_function_identity_arguments(oid) like '%p_capture_meta jsonb%') as com_a_chave
from pg_proc
where pronamespace = 'public'::regnamespace and proname = 'criar_plano_parcelado';
```

Esperado: `1` e `true`. `2` quer dizer que a assinatura antiga sobrou: o `drop
function` da seção 4 da migração não rodou, e o `create_workspace_installment_plan`
do `main` pode chamar a errada. Rode a seção de novo.

**O convite, o anexo e o aviso.**

```sql
select
  pg_get_functiondef('public.accept_workspace_invite(text, uuid, text)'::regprocedure) like '%ex_convidado%' as convite_recusa_ex_convidado,
  pg_get_functiondef('public.attachments_enforce_quota()'::regprocedure) like '%anexo_de_outro%' as anexo_de_outro,
  pg_get_functiondef('public.soltar_titular_que_sai()'::regprocedure) like '%pg_trigger_depth%' as titular_pula_cascata;
```

Esperado: `true` nas três. Um `false` quer dizer que a função antiga continua no
banco: rode o `db push` de novo.

**A tabela dos ex-convidados tem RLS e ninguém do app a lê.**

```sql
select c.relrowsecurity as rls,
  has_table_privilege('anon', 'public.workspace_ex_convidados', 'select') as anon_le,
  has_table_privilege('authenticated', 'public.workspace_ex_convidados', 'select') as authenticated_le
from pg_class c
where c.oid = 'public.workspace_ex_convidados'::regclass;
```

Esperado: `true`, `false` e `false`.

**A coluna do aviso, e nenhum aviso pendente de antes.**

```sql
select
  (select column_default from information_schema.columns
    where table_schema = 'public' and table_name = 'billing_avisos' and column_name = 'pendente') as padrao,
  (select count(*) from public.billing_avisos where pendente) as pendentes;
```

Esperado: o padrão `false` e `0` pendentes logo depois da migração. Depois, o
`billing-daily` reenvia o que ficar pendente por mais de 1 hora.

**Nenhum titular fora da carteira.**

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

Esperado: `0`. A migração **não** limpa os que já estavam fora antes dela; se vier
acima de `0`, troque o titular pela tela, como dono.

**O plano parcelado não duplica.** Cada `client_id` identifica um plano só:

```sql
select count(*) as client_id_com_mais_de_um_plano
from (
  select workspace_id, client_id
  from public.transactions
  where client_id is not null and installment_plan_id is not null
  group by workspace_id, client_id
  having count(distinct installment_plan_id) > 1
) d;
```

Esperado: `0`.

**A Edge do convite recusa o link do ex-convidado.** Com uma conta de teste que
já foi convidada e saiu (a linha dela está em `workspace_ex_convidados`) e um
convite **por link** de teste, abra o link logada: a resposta é 403 e a tela diz
"Peça ao dono um convite por e-mail.". O mesmo usuário aceita o convite **por
e-mail**, e a linha dele some da tabela.

## 4. O que não fazer neste bloco

**Não suba a migração antes do `workspace-invites-accept`.** Na ordem contrária,
o convite por link do ex-convidado vira 500 até a Edge subir.

**Não suba a `capture` antes da migração.** A compra parcelada capturada dá 500
(a função antiga não conhece `p_client_id`). As outras capturas funcionam.

**Não publique as Edges do §2 marcadas "só com o front 2.0" antes dele.** O `main`
ainda conta o vencimento como "o mês seguinte" e os links dos avisos não existem
nele.

**Não preencha `workspace_ex_convidados` à mão.** Quem escreve é o gatilho, na
saída de um convidado. Uma linha a mais nega o convite por link a quem não
devia.

**Não mexa em `billing_avisos.pendente` à mão.** Um aviso marcado `true` é
reenviado todo dia, sem teto (lacuna 97 de `docs/LACUNAS-MAPA.md`).

## 5. Compatibilidade com o front de `main`

| O que muda no banco | Por que `main` não sente |
|---|---|
| `soltar_titular_que_sai` | `main` não tem titular de cartão; o gatilho só mexe em `credit_cards.holder_user_id`, que ele não lê |
| `attachments_enforce_quota` | O adulto passa como antes; a conta de quem não é adulto (convidado) só vale para o app novo, que sobe o objeto antes da linha |
| `workspace_ex_convidados` e o `accept_workspace_invite` | A tabela é nova e ninguém a lê. O status `ex_convidado` só nasce para um convite por link de quem saiu como convidado; a Edge publicada antes da migração (§2) já o trata |
| `criar_plano_parcelado` | O `create_workspace_installment_plan` do `main` chama por posição e cai na assinatura nova pelos `default`s (`p_client_id` e `p_capture_meta` nulos) |
| `garantir_escrita` em `projects`, pesos e limites | Só vale na carteira em só leitura, que `main` já respeita nas outras tabelas |
| `billing_avisos.pendente` | Coluna nova com padrão `false`; `main` não a lê |
| `evaluate-budgets` e `evaluate-credit-card-alerts` republicadas | Abatem o estorno com categoria de despesa, que só o 2.0 grava |

## 6. Com o front

Quando o front do 2.0 subir e as Edges estiverem no ar (§2), confira com duas ou
três contas de teste, numa carteira compartilhada de teste:

- **O vencimento.** Um cartão que fecha no dia 5 e vence no 25 mostra o
  vencimento de 25 do **mesmo** mês: na previsão, no Painel, na jornada do cartão,
  nos avisos e no relatório do mês. Um que fecha no 28 e vence no 10 continua em 10
  do mês seguinte. O formulário do cartão não mostra mais o aviso "Vencimento …
  incomum";
- **O estorno.** Lance um estorno no cartão: o formulário pede uma categoria de
  **despesa**. O orçamento dessa categoria cai no mês da fatura, a fatura e a
  previsão não mudam, e o estorno não aparece como renda em nenhuma lista por
  categoria;
- **O convite.** Um convidado que saiu e tenta voltar pelo link recebe "Peça ao dono
  um convite por e-mail.". O convite por e-mail entra;
- **O titular.** Tirar o titular da carteira, ou torná-lo convidado, devolve o cartão
  à casa;
- **A só leitura.** Numa carteira em só leitura, criar ou arquivar um projeto, e
  mudar os pesos da divisão ou o limite de uma pessoa, respondem "workspace_somente_leitura";
- **A captura.** Reenvie a mesma compra parcelada do Atalho do iPhone: um plano só;
- **A duplicidade.** "Apagar um" mantém o lançamento com anexo, depois o já
  revisado, depois o mais antigo;
- **A cobrança.** Com a cobrança ligada, um aviso de texto fixo que não saiu fica
  pendente e é reenviado em até um dia.

**O que fica de fora, de propósito.** As lacunas que o bloco abre (o estorno
lançado antes do Bloco 9, o aviso já entregue que não se recolhe, as faturas que
vencem no mesmo dia, a captura simultânea com foto, o "Apagar um" do convidado, o
aviso de cobrança sem destino e a sugestão de categoria da importação) estão na
seção 19 de `docs/JORNADAS.md` e em `docs/LACUNAS-MAPA.md`.
