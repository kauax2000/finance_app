# Runbook — reconciliar produção com o baseline de migrações

> ## STATUS (atualizado 2026-08-24)
>
> **Concluído em produção:**
> - Passos 1–3: histórico reparado (baseline marcado como aplicado; as 31
>   migrações antigas marcadas como revertidas). Snapshot de rollback do
>   `migration list` original foi tirado antes.
> - Passo 4 (parcial): aplicadas as **4 migrações não-destrutivas** de
>   segurança — `20260824120000`, `121000`, `122000`, `123000`.
>   Descoberta: produção tinha apenas as políticas **permissivas** de avatar
>   (qualquer autenticado podia sobrescrever/apagar avatar alheio) — corrigido.
> - Passo 6: deploy das 11 Edge Functions alteradas.
> - Smoke de guards: `sessions` → 401 sem auth; funções de cron → 401 sem
>   `x-cron-secret`.
>
> - Passo 4 (2ª leva): pré-checagem `docs/PRE_PUSH_VERDICT.sql` rodada em prod
>   → **todos os contadores zero** ("SEGURO: nenhuma transacao sera apagada").
>   Com isso, aplicadas as 5 migrações de correção de billing:
>   `130000`, `131000`, `140000`, `141000`, `142000`. Nenhum `RAISE NOTICE`
>   de deleção foi emitido — confirmação empírica de que nada foi apagado.
>
> - Passo 4 (3ª leva): aplicadas `150000`, `151000`, `152000`, `160000`,
>   `170000`. As duas que trocavam alvos de `onConflict` do cliente foram
>   convertidas para **expand/contract**: as constraints novas entraram
>   mantendo as legadas, então o cliente ainda em produção segue funcionando.
>   Coexistência verificada localmente antes do push.
>
> **Produção está com 14 de 15 migrações.** Pendente apenas a fase CONTRACT:
> `20260824180000_drop_legacy_constraints.sql`.
>
> **Quando aplicar a 180000:** só DEPOIS de commitar e deployar o cliente
> (Vercel). Ela remove o índice único legado de budgets e as UNIQUE globais de
> `client_id` — alvos de `onConflict` que só o cliente NOVO deixou de usar.
> Aplicar antes do deploy quebraria salvar orçamento e o replay offline.
>
> ```bash
> npx supabase db push   # aplica só a 180000
> ```
>
> **Atenção:** se a senha do banco for rotacionada antes disso, rode
> `npx supabase link` de novo (com a senha nova) antes do `db push`.

**Contexto.** Até ago/2026 o schema vivia metade em `supabase/migrations/` e
metade em ~30 SQLs soltos rodados à mão — `supabase db reset` não construía um
banco do zero. A Fase 3 consolidou tudo em
`supabase/migrations/00000000000000_baseline.sql` (dump de um banco montado com
os SQLs soltos + todas as 37 migrações antigas), removeu os SQLs soltos e as
migrações antigas (o git preserva o histórico), e manteve as 6 migrações novas
das Fases 1–2 (`20260824*`), que **produção ainda não recebeu**.

O procedimento abaixo NÃO executa o baseline em produção — apenas reconcilia o
histórico de migrações do CLI. Só as 6 migrações novas são executadas de fato.

## Pré-requisitos

- `supabase link` ativo no projeto (FinHealth 2.0 / `rpgveoalgxrlsfowvixe`).
- Confirmar backup: Dashboard → Database → Backups (ou PITR) com ponto recente.
- Senha do banco em mãos (o CLI vai pedir).

## Passos

### 1. Snapshot do histórico remoto (para rollback)

```bash
npx supabase migration list --linked > /tmp/migration-history-antes.txt
```

Guarde esse arquivo. Deve listar as 31 versões antigas (20260331… a 20260531…)
como aplicadas no remoto.

### 2. Marcar o baseline como já aplicado (sem executar nada)

```bash
npx supabase migration repair --status applied 00000000000000
```

### 3. Remover as versões antigas do histórico remoto (sem executar nada)

```bash
npx supabase migration list --linked
```

Para **cada** versão antiga que aparecer só no remoto (todas as `202603xx`–`202605xx`):

```bash
npx supabase migration repair --status reverted <versao>
```

(O comando aceita várias versões: `supabase migration repair --status reverted 20260331120000 20260403120000 ...`.)

### 4. Aplicar as 6 migrações pendentes das Fases 1–2

```bash
npx supabase db push --dry-run
```

Deve listar **exatamente** as 6 migrações `20260824*` (hardening de segurança,
RPC de convites, auth_session_id, políticas de storage, índices de idempotência
de billing, guards ON CONFLICT). Se listar o baseline, **pare** — o passo 2 não
funcionou. Estando correto:

```bash
npx supabase db push
```

### 5. Verificar paridade schema × baseline

```bash
npx supabase db push --dry-run   # deve reportar nada a aplicar
npx supabase db diff --linked    # deve ser vazio (ou só ruído de extensões)
```

**Diff real ≠ vazio significa que o baseline está incompleto** (produção tem um
objeto que o baseline não tem, ou vice-versa). Corrija o arquivo
`00000000000000_baseline.sql` — nunca o banco de produção — e repita.

### 6. Deploy das Edge Functions alteradas nas Fases 1–2

```bash
npx supabase functions deploy sessions activity-logs delete-user workspace-invites-accept run-recurring-billing credit-card-calendar-alerts evaluate-bills-reminders evaluate-credit-card-alerts notify-transaction-created dispatch-notifications evaluate-budgets workspace-invites-create workspace-invites-resend
```

### 7. Smoke tests pós-deploy

1. **Sessões:** revogar a sessão de um segundo dispositivo → o dispositivo
   revogado deve falhar ao acessar (401) e não conseguir se re-registrar sem
   novo login com senha.
2. **Convites:** convite por email aceito 1× → segunda tentativa de outro
   usuário deve receber "Invite exhausted".
3. **Billing:** abrir o dashboard 2× seguidas num workspace com assinatura
   vencida → apenas 1 transação criada (checar em Transações).
4. **Alertas de cartão:** num workspace compartilhado, um membro lança despesa
   que cruza 80% do limite → **todos** os membros (com prefs ativas) recebem a
   notificação.

## Rollback

Nada de schema foi alterado além das 6 migrações novas (todas aditivas e
idempotentes). Se o histórico ficar inconsistente, restaure-o com o snapshot do
passo 1: para cada divergência, `supabase migration repair --status applied|reverted <versao>`
até `migration list` bater com o estado desejado.
