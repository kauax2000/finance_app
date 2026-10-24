# Publicar o Bloco 6A: contas a pagar

Reúne a revisão de "Contas a pagar":

- a migração `20261027120000_contas.sql`: a coluna `bills.valor_variavel` e o
  gatilho `media_da_conta` (a estimativa pela média das 3 últimas pagas); o
  gatilho `same_ws_bill_id` (a parcela só aponta para uma conta da própria
  carteira); as funções `pular_instancia_da_conta` e `ligar_pagamento_da_conta`;
  os gatilhos de `transactions` `reabrir_instancia_ao_apagar` e
  `acompanhar_valor_pago`;
- a Edge `evaluate-bills-reminders`, que ganha o **passo 0** (cria a pendência de
  cada vencimento que já chegou) e o aviso por janela;
- no front do 2.0: a edição que reprograma a pendente, o pular atômico, os
  estados Encerrada e Concluída, o valor variável, o casamento automático do
  pagamento ("Isso pagou a conta X?"), o boleto no pagamento e no lançamento
  pago, a explicação "conta ou assinatura" nos dois formulários e `/bills?new=1`.

**Estado em 24/10/2026: nada publicado.** O front do `finance-app-2.0` também
não: ele só vai para `main`, e para produção, quando os blocos planejados
estiverem prontos (decisão do dono).

**A migração sobe antes do front, e o front do 2.0 depende dela:** ele chama as
duas funções novas e manda `valor_variavel` no cadastro da conta. Como a
migração só acrescenta, o front de `main` continua funcionando com ela (a tabela
do §5 mostra o porquê). O contrário, o front do 2.0 sem a migração, quebra o
cadastro e o "Ignorar parcela".

Faça na ordem. Todo SQL abaixo cabe como está no SQL Editor: ele não leva id,
chave nem URL, e nada precisa ser trocado. **Nunca** salve no repositório o
resultado de uma conferência (o repositório é público).

## 0. Pré-requisitos

- **Os Blocos 3A, 3B, 4 e 5 vão antes, ou junto.** A migração do Bloco 6A é a
  última da fila; se os outros ainda não subiram, o `db push` aplica todas em
  ordem. Faça as conferências dos roteiros anteriores depois dele.
- **A CLI** do Homebrew, 2.121 ou mais nova, com o projeto ligado
  (`supabase link`, uma vez só). Sem Docker nesta máquina, as funções sobem pela
  API (`--use-api`), e o pgTAP (`supabase/tests/database/schema_integrity.test.sql`,
  que o bloco atualizou) não roda aqui: as conferências do §1 cobrem o mesmo chão.
- **Nenhum segredo novo.** O passo 0 usa a mesma service role e o mesmo
  `x-cron-secret` do lembrete que já roda. O cron `bills-reminders-daily`
  (12:00 UTC) é o de sempre.

## 1. Migração

```bash
supabase db push --linked
```

Aplica `20261027120000_contas.sql` (e, antes dela, as que ainda não subiram).
Depois, rode as conferências **uma por vez**: o SQL Editor mostra só o resultado
do último comando.

**A coluna do valor variável existe e todas as contas começam fixas.**

```sql
select valor_variavel, count(*) from public.bills group by valor_variavel;
```

Esperado: uma linha só, `false`, com a contagem de contas. Uma linha `true` logo
depois da migração quer dizer que alguém já usou o front novo (o banco de
desenvolvimento é o de produção).

**Os gatilhos existem.**

```sql
select tgrelid::regclass as tabela, tgname
from pg_trigger
where not tgisinternal
  and tgname in (
    'media_da_conta', 'media_da_conta_ao_apagar', 'same_ws_bill_id',
    'reabrir_instancia_ao_apagar', 'acompanhar_valor_pago'
  )
order by 1, 2;
```

Cinco linhas: três em `bill_instances` (`media_da_conta`,
`media_da_conta_ao_apagar` e `same_ws_bill_id`) e duas em `transactions`
(`acompanhar_valor_pago` e `reabrir_instancia_ao_apagar`). Se faltar uma, rode de
novo o `create trigger` dela, copiando do arquivo da migração.

**As duas funções novas têm o alcance certo, e as dos gatilhos não são
chamáveis.**

```sql
select
  has_function_privilege('authenticated', 'public.pular_instancia_da_conta(uuid, date)', 'execute') as pular_authenticated,
  has_function_privilege('anon', 'public.pular_instancia_da_conta(uuid, date)', 'execute') as pular_anon,
  has_function_privilege('authenticated', 'public.ligar_pagamento_da_conta(uuid, uuid, date)', 'execute') as ligar_authenticated,
  has_function_privilege('anon', 'public.ligar_pagamento_da_conta(uuid, uuid, date)', 'execute') as ligar_anon,
  has_function_privilege('authenticated', 'public.media_da_conta()', 'execute') as media_authenticated,
  has_function_privilege('authenticated', 'public.reabrir_instancia_ao_apagar()', 'execute') as reabrir_authenticated,
  has_function_privilege('authenticated', 'public.acompanhar_valor_pago()', 'execute') as acompanhar_authenticated;
```

Esperado: `true`, `false`, `true`, `false`, `false`, `false`, `false`. Se uma das
três funções de gatilho vier `true`, **pare**: elas são `security definer` e
qualquer pessoa logada poderia chamá-las. Rode de novo os `revoke` do fim da
migração.

**O `pay_bill_instance` não mudou.**

```sql
select pg_get_function_identity_arguments('public.pay_bill_instance'::regproc) as assinatura;
```

Uma linha. É a mesma assinatura de antes da migração: o front de `main` o
chama como sempre.

**Parcelas pagas sem lançamento (só para saber, não precisa corrigir).**

```sql
select count(*) from public.bill_instances where status = 'paid' and transaction_id is null;
```

O gatilho novo reabre a parcela quando o lançamento é apagado, mas não conserta
as que já ficaram assim antes dele. Um número maior que zero é histórico: elas
continuam pagas.

## 2. Funções

O `_shared` vai embutido em cada função no deploy: toda função que importa um
módulo mudado precisa ser publicada de novo. Os módulos mudados neste bloco são
`notification-schedule.ts` (ganhou `offsetDaJanela`) e o novo
`recorrencia-conta.ts`.

**Como a lista foi feita:** para cada `supabase/functions/*/index.ts`, foram
seguidos os `import` relativos, diretos e através do `_shared`, até o fim, e
ficou na lista toda função que alcança um desses dois módulos. Nenhum outro
arquivo do `_shared` os reimporta, então o fecho é de duas funções, e só uma sobe
agora (ver abaixo).

```bash
supabase functions deploy evaluate-bills-reminders --use-api
```

| Função | Por quê |
|--------|---------|
| `evaluate-bills-reminders` | **Muda de comportamento.** Importa os dois módulos: ganha o passo 0 (cria as pendências que faltam) e o aviso por janela, e deixa de avisar depois do `end_date` |

**`credit-card-calendar-alerts` fica fora deste comando.** Ela também importa o
`notification-schedule.ts`, mas só ganhou uma função nova que ela não chama: a
mudança do 6A nela é opcional. O que pesa é outra coisa: o código dela já traz o
aviso de fatura alta do Bloco 5, cujo link é `/previsao`, que não existe em
`main`. Por isso ela **só sobe junto com o front do 2.0**, como manda o §7 de
`BLOCO_5_DEPLOYMENT.md`; quando subir, já leva o `_shared` novo.

Não precisam de deploy: as demais funções, que não alcançam nenhum dos dois
módulos. O `pay_bill_instance` e as RPCs são do banco, e a migração já os trocou.

### O que o passo 0 faz no primeiro dia

Todo dia, antes de avisar, o `evaluate-bills-reminders` cria, para cada conta
**ativa e não `one_time`** com ao menos uma instância, a pendência de cada
vencimento que já chegou, contando da última instância, até hoje e sem passar do
`end_date`. Uma conta esquecida há três meses ganha três pendências vencidas, uma
por mês. Rodar o cron duas vezes no mesmo dia não cria nada a mais: a chave é
`(bill_id, due_date)`.

**Confira, só lendo, quantas instâncias o primeiro passo 0 vai criar.** As contas
ativas cuja última instância já venceu:

```sql
select count(*) as contas_com_ultima_vencida
from public.bills b
where b.is_active
  and b.frequency <> 'one_time'
  and (b.end_date is null or b.end_date > (
    select max(i.due_date) from public.bill_instances i where i.bill_id = b.id))
  and (select max(i.due_date) from public.bill_instances i where i.bill_id = b.id) < public.app_today();
```

E uma estimativa de quantas pendências nascem (por mês corrido; fica a menos de
uma de diferença por conta, conforme o dia do vencimento):

```sql
with ultima as (
  select b.id, b.frequency, max(i.due_date) as ultimo,
         least(public.app_today(), coalesce(b.end_date, public.app_today())) as ate
  from public.bills b
  join public.bill_instances i on i.bill_id = b.id
  where b.is_active and b.frequency <> 'one_time'
  group by b.id, b.frequency, b.end_date
)
select
  count(*) filter (where ultimo < ate) as contas,
  sum(
    greatest(
      0,
      floor(
        (extract(year from age(ate, ultimo)) * 12 + extract(month from age(ate, ultimo)))
        / case frequency when 'monthly' then 1 when 'bimonthly' then 2 when 'quarterly' then 3 else 12 end
      )
    )
  ) as instancias_estimadas
from ultima
where ultimo < ate;
```

Os dois números são só leitura e servem para o dono decidir **se roda o passo 0
antes do cron do dia ou deixa o cron criar**. Para rodar na mão, antes do
horário (12:00 UTC):

```sql
select public.invoke_edge_function('evaluate-bills-reminders');
```

(a mesma chamada que o cron faz; o passo 0 e os avisos do dia saem juntos).
Deixar o cron criar dá o mesmo resultado, só mais tarde.

**O que a pessoa vê no primeiro dia.** As instâncias geradas são pendências
vencidas de verdade: no front de `main`, e no novo, aparecem como **Atrasada**.
Isso é verdade (a conta não foi paga), e é o conserto do problema "a recorrência
travava sem pagamento". Quem não quer ver uma conta antiga cobrada pode **pular**
a parcela ou **desativar** a conta antes. Contas sem nenhuma instância não são
tocadas.

**Os avisos do primeiro dia.** Dois efeitos de uma vez só, ambos esperados:

- no primeiro dia depois do deploy, uma conta atrasada pode receber até **2 avisos
  de atraso** (um por instância atrasada que cai numa janela de aviso; os atrasos
  não são agrupados por conta);
- o `sent_on` da chave de dedupe passou a ser o **vencimento** também na
  parcela a vencer. Uma parcela que já foi avisada pelo código antigo (com o
  `sent_on` do dia do aviso) e ainda não venceu pode receber **uma vez mais** o
  mesmo aviso. Para evitar as duas coisas, publique **logo depois** do cron do
  dia, e não antes dele.

## 3. Conferência pós-deploy

Só leitura.

**O passo 0 rodou.** Nos logs de `evaluate-bills-reminders` (Dashboard → Edge
Functions → `evaluate-bills-reminders` → Logs), a resposta do dia traz `ok: true`
e o número `geradas`. Uma lista `errors` com `step: "gerar"` quer dizer que uma
conta não foi gerada; as outras seguem, e o cron do dia seguinte tenta de novo.

**Nenhuma data duplicada.**

```sql
select bill_id, due_date, count(*)
from public.bill_instances
group by bill_id, due_date
having count(*) > 1;
```

Esperado: nenhuma linha (a chave `(bill_id, due_date)` é única).

**Nenhuma conta ativa e recorrente ficou sem pendente depois do passo 0**, a
não ser as que terminaram:

```sql
select count(*) from public.bills b
where b.is_active
  and b.frequency <> 'one_time'
  and (b.end_date is null or b.end_date >= public.app_today())
  and exists (select 1 from public.bill_instances i where i.bill_id = b.id)
  and not exists (select 1 from public.bill_instances i where i.bill_id = b.id and i.status = 'pending');
```

Esperado, no dia seguinte ao deploy: `0`.

**A média do valor variável.** Só depois de o front novo estar no ar e alguém
marcar uma conta como variável e pagá-la:

```sql
select b.name, b.amount_estimated
from public.bills b
where b.valor_variavel;
```

O `amount_estimated` deve ser a média das últimas pagas dela (até 3), arredondada
a centavo.

## 4. O que não fazer neste bloco

**Não apague instâncias geradas pelo passo 0 em massa.** Cada uma é um
vencimento que a pessoa deixou passar; apagar a última de uma conta faz o passo
0 recriá-la no dia seguinte. Quem não quer a cobrança desativa a conta ou
ignora a parcela.

**Não rode o passo 0 mais de uma vez por dia "para testar" com o corpo alterado.**
Ele é idempotente, mas os avisos do dia seguem a mesma dedupe, e uma chamada
manual depois do horário antecipa o aviso de quem ainda ia recebê-lo.

## 5. Compatibilidade com o front de `main`

| O que muda no banco | Por que `main` não sente |
|---|---|
| `bills.valor_variavel`, padrão `false` | Coluna nova; o `insert` de `main` não a manda, e toda conta nasce fixa |
| `media_da_conta` | Só age em conta com `valor_variavel`, que `main` nunca liga |
| `same_ws_bill_id` | Só roda quando `bill_id` ou `workspace_id` é escrito; `main` grava a instância na carteira da própria conta |
| `pular_instancia_da_conta`, `ligar_pagamento_da_conta` | Funções novas; só o front do 2.0 as chama. `main` segue pulando e pagando como antes |
| `pay_bill_instance` | Não mudou (assinatura e comportamento) |
| `reabrir_instancia_ao_apagar` | **Muda o que `main` vê:** apagar o lançamento de uma conta paga volta a parcela para Pendentes (antes ela ficava "paga" sem lançamento). É a correção, e `main` a mostra como pendente sem precisar de código novo |
| `acompanhar_valor_pago` | Editar o valor do lançamento passa a atualizar o valor pago da parcela; `main` mostra o número novo |
| `evaluate-bills-reminders` | O passo 0 cria as pendências que faltam; `main` as mostra como **Atrasada**, que é o que elas são. O aviso por janela e o fim da conta não dependem do front |

**O ponto de atenção.** Em `main`, a conta esquecida volta a aparecer como
atrasada, uma pendência por vencimento, e a edição da agenda **não** reprograma a
pendente (isso é do front novo). Some quando o 2.0 vai para `main`.

## 6. Com o front

Quando o front do 2.0 subir, confira também:

- a aba Contas mostra Ativa, Encerrada, Concluída ou Inativa (uma conta única
  paga é Concluída; uma recorrente cujo fim passou e sem pendente é Encerrada);
- editar o dia ou a periodicidade de uma conta move a pendente que ainda não
  venceu; a vencida não muda;
- o formulário da conta tem "Valor variável" e a explicação "Conta ou assinatura",
  que leva a `/subscriptions?new=1`; o da assinatura tem a mesma explicação, e o
  link leva a `/bills?new=1`, que abre o cadastro da conta;
- na aba Pendentes, uma despesa dos últimos 40 dias parecida com uma pendente
  (valor ±15%, data ±5 dias) pergunta "Isso pagou a conta X?"; "Sim" liga sem
  lançar de novo, e "Não" não pergunta mais neste aparelho;
- o diálogo de pagar mostra o boleto, só para abrir, e não aceita data depois de
  hoje; o detalhe do lançamento pago mostra o boleto da parcela, sem "Apagar";
- apagar o lançamento de uma conta paga devolve a parcela às Pendentes.
