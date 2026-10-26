# Bloco 9 — survey of 12 lacunas (read-only, branch finance-app-2.0)

**Latest migration:** `supabase/migrations/20261101120000_cobranca_asaas.sql`. The new one must sort after it (e.g. `20261102120000_bloco9.sql`).

Test conventions found:
- SQL source tests: `src/lib/<area>/migracao-*.test.ts` (Vitest, reads the migration text): `src/lib/privado/migracao-privado.test.ts`, `src/lib/papeis/migracao-papeis.test.ts`, `src/lib/planos/migracao-planos.test.ts`, `src/lib/planos/migracao-cobranca.test.ts`, `src/lib/projetos/migracao-projetos.test.ts`.
- pgTAP: `supabase/tests/database/*.test.sql` (`npm run test:db`).
- Edge `_shared` tests run on Deno (`npm run test:edge`, `jsr:@std/assert`). `src/**/*.test.ts` runs on Vitest (`vitest.config.ts` include).

Deploy state that matters for risk: Blocks 3A, 3B, 4, 5, 6A, 6B, 7A, 7B, 7C and 8 have nothing published (LACUNAS-MAPA §C). Only Block 1 (notifications: `notify-transaction-created`, `credit-card-calendar-alerts`, `deliver-notification`) and the Block 2 DB are live and shared with `main`.

---

## #68 — notifications and insights keep the text after a transaction becomes private

**Where**
- `supabase/migrations/20261030120000_privado.sql:173-303` `guardar_privado()`. It moves description/category/capture_meta to `transacoes_privadas` and masks the row (`new.description := 'Gasto pessoal'`, :298). It does nothing outside `transactions`. Trigger at :344-349.
- `supabase/functions/_shared/process-transaction-notification.ts:114-145`:
  ```ts
  const description = tx.is_private ? `Gasto pessoal de ${actorName}` : tx.description?.trim() || 'Sem descrição'
  const msgBody = `${amountLabel} — ${description}`
  ... metadata: { kind: 'member_expense_created', transaction_id: tx.id, actor_user_id: tx.user_id, href }
  ```
  This is the only notification that embeds a transaction description. It is found by `metadata->>'kind' = 'member_expense_created' and metadata->>'transaction_id' = <id>` (the same filter as `notificationAlreadySent`, :30-37).
- Insight payloads (`supabase/functions/_shared/insights/detectores.ts`, built in `supabase/functions/insights-daily/index.ts`):

| kind | text from the description | how it references the transaction |
|---|---|---|
| `recorrencia` | `nome` (:167), `dedupe_key = rec:<normalized desc>` (:166) | `payload.lancamentos` ids (:171) |
| `duplicidade` | `descricao` (:252) | `payload.ids` [a,b] (:250); `dedupe_key dup:<id>:<id>` |
| `preco_assinatura` | none (`nome` is the subscription name) | `payload.lancamentoId` (:293) |
| `gasto_atipico`, `alvo='descricao'` | `nome` (:210), `dedupe_key atip:descricao:<normalized desc>:<ym>` (:208) | **no ids** |
| `fatura_fechou` | `maiores[].descricao` (insights-daily :228), `categorias` names | **no ids** |
| `sazonal`, `relatorio_mes`, `a_conferir`, `limite_pessoa`, `parcelas_acabando` | not transaction-specific | — |

- Insight notifications: `insights-daily/index.ts:561-584` writes `notifications` of type `insight` with `title/body = textoDoInsight(...)` (the recurrence title is `${nome} todo mês`, the duplicate body is `${descricao} · …`) and `metadata.insight_id`.
- `privado.sql:663-667` already notes that old insights keep the id in `payload.lancamentos`. `virar_*` filter with `not is_private`.

**Current behavior (confirmed):** marking private is an UPDATE through `guardar_privado`. Nothing rewrites `notifications.body` (read by each recipient adult), `insights.payload`, `insights.dedupe_key`, or the `insight` notifications. Insights created after the mark skip the row (`visiveis()`, detectores.ts:30).

**Smallest correct fix**
1. New migration: `public.apagar_rastros_da_privada()`, an AFTER UPDATE trigger function, `security definer`, on `transactions` `when (new.is_private and not old.is_private)`:
   - `update notifications set body = split_part(body, ' — ', 1) || ' — Gasto pessoal' where metadata->>'kind' = 'member_expense_created' and metadata->>'transaction_id' = new.id::text;` The title already names the actor.
   - Delete the insights that reference the id:
     ```sql
     delete from insights where workspace_id = new.workspace_id and (
       payload->'lancamentos' ? new.id::text or payload->'ids' ? new.id::text
       or payload->>'lancamentoId' = new.id::text or payload->'maiores' @> jsonb_build_array(jsonb_build_object('id', new.id::text)))
     returning id
     ```
     Then delete the `notifications` where `metadata->>'insight_id'` is in those ids. Deleting is cleaner than scrubbing: the recurrence title is the description, and `dedupe_key` holds it too. The next run re-detects without the private row, because the detectors skip it.
2. `insights-daily` / detectors: add ids where they are missing.
   - `fatura_fechou.maiores` gets `{ id, descricao, valor }` (index.ts:228; `resumoDaFatura` keeps the field).
   - `detectarAtipicos` with `alvo='descricao'` returns `lancamentos` (the ids of the current-month group).
   - No insight is in production yet (6B is unpublished), so no backfill is needed.
3. Optional ponytail: the `categorias` names in `fatura_fechou` are not transaction-specific, so leave them.

**Tests**
- Source test in `src/lib/privado/migracao-privado.test.ts`: the trigger exists, its condition is `new.is_private and not old.is_private`, and it touches `member_expense_created` and `insight_id`.
- Deno tests in `_shared/insights/detectores.test.ts`: the atípico payload has `lancamentos`, and `resumoDaFatura` keeps `maiores[].id`.
- Ideally a pgTAP case (mark private, assert the body no longer contains the description).

**Risks**
- `main` never sends `is_private`, so the trigger never fires from `main`.
- If the migration is not applied, the 2.0 front still works and the leak stays.
- `notify-transaction-created` is shared and live. It does not change, but there is a race: if it read the row before the mark and inserted after it, the old body survives. That is rare; accept it.
- Push and e-mail already delivered cannot be recalled. Say so in the copy or the Cofre.

---

## #57 — guest creates an `attachments` row pointing at an existing wallet object

**Where**
- `20261022130000_anexos.sql:25` `path text not null unique`. :34 `attachments_path_na_carteira check (split_part(path,'/',1) = workspace_id::text)`.
- :62-96 `attachments_enforce_quota()` (security definer) already reads the object by name: `select (o.metadata->>'size')::bigint ... where o.bucket_id='attachments' and o.name = new.path`.
- `20261030120000_privado.sql:533-552` (current insert policy). The guest branch is `is_workspace_member and bill_instance_id is null and statement_total_id is null and exists(transaction of auth.uid())`. It never checks who owns the object.
- `privado.sql:584-620` storage SELECT/DELETE. The guest branch passes through `exists (attachments a where a.path = objects.name and (a.created_by = auth.uid() or tx.user_id = auth.uid()))`.

**Current behavior (confirmed, narrower than the claim):** because `path` is UNIQUE, the guest can only claim an **orphan** object: one with no `attachments` row. Examples:
- an object whose row an adult deleted (#64 and #9: objects stay until the Sunday cron);
- a capture upload whose row insert failed;
- a row cascaded away by a deleted statement or bill.

The path is `workspace/<uuid>.<ext>`, so it is unguessable. Once the guest has a row, the storage policies let them read and delete the object.

**Smallest correct fix:** in the quota trigger, also read `o.owner_id`. In the new migration, use `create or replace function public.attachments_enforce_quota()` with the same body plus:
```sql
select (o.metadata->>'size')::bigint, o.owner_id into v_tamanho, v_dono ...;
if auth.uid() is not null and not public.is_workspace_adult(new.workspace_id)
   and v_dono is distinct from auth.uid()::text then
  raise exception 'anexo_de_outro' using errcode = '42501';
end if;
```
Capture and service role have `auth.uid()` null, so they pass. An adult attaches only what they uploaded anyway. Restricting to non-adults keeps the change minimal.

**Tests:** source test in `src/lib/papeis/migracao-papeis.test.ts` (or a new block-9 test) asserting the `owner_id` check in `attachments_enforce_quota`. Add a pgTAP case if a test branch exists.

**Risks:** no guest exists on `main` (7A is unpublished), so there is no change for `main` users. With the migration unapplied, nothing breaks. The Edges are not affected.

---

## #60 — someone who left as a guest rejoins as a member through a link invite

**Where**
- `20261029120000_papeis.sql:622-706` `accept_workspace_invite`. The only checks are already-member (:655-663), status, expiry, `invited_email` match (:674-677, so a link has no email) and `max_uses` (:681). The insert takes `v_invite.role` (:694-697), and a link is always `member` (comment :31-32).
- Leaving or removal is a raw delete: policy `"Members can leave workspace"` (:541-544), `src/app/(app)/members/page-client.tsx:545-549` (owner removes), and the leave dialog goes through `workspace-provider.tsx:451`. No RPC, no log.
- Logs: `trocar_papel` writes `user_activity_logs` type `family_role_changed` (:598-611), but on the **owner's** `user_id` and only when the owner changes a role. `family_member_removed` exists in the baseline check (baseline.sql:1862) but nothing writes it. **There is no record that a user was a guest once their `workspace_members` row is gone.**
- The Edge `supabase/functions/workspace-invites-accept/index.ts:98-116` maps the statuses, and its `default:` is a 500 "Unexpected invite acceptance result".

**Smallest correct fix (new migration)**
1. Table `public.workspace_ex_convidados (workspace_id uuid, user_id uuid, saiu_em timestamptz default now(), primary key (workspace_id, user_id))`. Use **no FKs**, or `on delete cascade` on workspace only. Enable RLS, grant nothing.
2. AFTER DELETE trigger on `workspace_members` `when (old.role = 'guest')`. It inserts with `on conflict do update set saiu_em = now()`. Skip when the workspace no longer exists, with the same test as `workspace_members_guard` (`20260915100000_security_privileges_policies.sql:139`: `exists (select 1 from workspaces w where w.id = old.workspace_id)`). Otherwise the cascade from deleting a workspace would insert into a parent being deleted.
3. In `accept_workspace_invite`, after the already-member check:
   ```sql
   if v_invite.invited_email is null and v_invite.role = 'member' and exists (select 1 from workspace_ex_convidados where workspace_id = v_invite.workspace_id and user_id = p_user_id) then
     return jsonb_build_object('status','ex_convidado','workspace_id',v_invite.workspace_id);
   end if;
   ```
   An e-mail invite is the owner's explicit choice and is allowed. On a successful accept, delete the row.
4. Edge `workspace-invites-accept`: add `case 'ex_convidado': return json(403, {error: 'Peça um convite por e-mail ao dono.'})`. The front invite screen shows that message.

**Tests:** source test (papeis or block-9) for the table, the trigger, and the new status in the RPC; Deno or source test for the Edge switch. Also pgTAP, since `invite_claim_max_uses.test.sql` exists as a model.

**Risks**
- **`workspace-invites-accept` is shared with `main` and is live.** If the migration ships before the Edge, the new status falls into `default` and returns a 500. That still refuses entry, but with the wrong message. Deploy the Edge with the case **before or together with** the migration. The Edge tolerates the old RPC.
- Guests who left before the migration have no row, because history can't be reconstructed. That's acceptable, since no guest exists in production.

---

## #66 — holder and private author are checked only at write time

**Where**
- `privado.sql:28-57` `conferir_titular()` (holder must be owner/member) runs only on insert or update of `holder_user_id`/`workspace_id` (:64-75).
- `guardar_privado` checks the author's adult role only when the row is written (:238-243).
- `privado.sql:419-433` `conferencia_liberada`: a holder who is not `auth.uid()` hides the statement totals and PDF from everyone except the owner.
- `_shared/destinatarios.ts:28-33` `leitoresDoCartao`: when the holder is no longer an adult, bank-backed card notices go **only to the owners**.
- Policies `privado.sql:395-413`: an adult updates or deletes a private row only if it is theirs.
- The only trigger on `workspace_members` is `workspace_members_guard` (`20260915100000_security_privileges_policies.sql:113-157`), which covers immutable keys and the last owner. Nothing reacts to leave or demote.

**Current behavior (confirmed)**
- Holder leaves or is demoted: `credit_cards.holder_user_id` keeps them. Members (non-owner) lose the card's statement total, PDF and attachments (`conferencia_liberada`, `anexo_oculto`), and the card's bank notices go only to the owners.
- Private author leaves: their private rows stay masked. **Nobody can edit or delete them**: adults are blocked by the policy, the ex-author by membership. Only the service role can.
- Private author demoted to guest: the guest still edits amount and date, but any update of a guarded column raises `PRIVADO_NAO_PERMITIDO` (`v_pode` requires an adult). Unmarking still works.

**Smallest correct fix (new migration):** an AFTER UPDATE OF role / AFTER DELETE trigger on `workspace_members`, `security definer`, `when (old.role in ('owner','member'))`, active only when `tg_op='DELETE' or new.role='guest'`. Skip it when the workspace is gone or `pg_trigger_depth() > 1`.
- `update credit_cards set holder_user_id = null where workspace_id = old.workspace_id and holder_user_id = old.user_id;` `conferir_titular` passes: the owner demotes or removes, the member clears their own when leaving, and the service role has `auth.uid()` null.
- Private rows: **this needs a product decision.** Option A, the minimal one: keep them masked (the privacy promise survives the person leaving) and accept they are frozen. Option B: on leave, unmark through a bypass flag (`set_config('privado.sistema','on',true)` read by `guardar_privado` before the author check), which reveals the description to the house. I'd recommend A plus the holder fix. Write it in JORNADAS §17.

**Tests:** source test in `src/lib/privado/migracao-privado.test.ts` for the trigger and the `holder_user_id = null` update; pgTAP: demote the holder, then `holder_user_id` is null.

**Risks:** `main` has no holder (7B is unpublished), so the update affects 0 rows. Without the migration, behavior stays as now. No Edge change: `leitoresDoCartao` already handles a null holder.

---

## #35 — the category budget doesn't subtract card refunds

**Where**
- How the invoice and forecast recognize a refund: **`type = 'income'` + `payment_method = 'credit_card'` + `payment_credit_card_id`**. There is no flag. See `_shared/credit-card-cycle.ts:154-173` `sumCardRefundsInWindow` (`if (t.type !== 'income') continue; if (t.payment_method !== 'credit_card') continue; ...`), and the front `src/lib/credit-card-billing.ts:343-362` `sumCreditCardRefundsInWindow` / `netCreditCardInvoiceInWindow`.
- Budget: `_shared/orcamento-mes.ts:5-6` ("A receita (o estorno no cartão inclusive) não entra: a tela também não a abate") and :21 `if (t.type !== 'expense' || t.category_id !== categoryId) continue`. The client is `src/lib/category-commitments.ts:91-97` (`if (t.type !== "expense") continue`). Parity vectors: `src/lib/fixtures/orcamento-mes-vectors.json`.
- **The blocker:** the refund is an income, and the form offers only categories of its own type: `src/components/transactions/transaction-form-fields.tsx:389` `categories.filter((c) => c.type === type)`. `src/components/wireframe/estorno-wireframe.tsx:9` only adds the card. So a refund carries an **income** category, or none, and has no link to the expense category or the original purchase. The DB doesn't enforce category type against transaction type (only `categories_type_check`, baseline.sql:1667).

**Current behavior (confirmed):** the budget counts only expenses. Refunds can't be attributed to a budget category with today's data.

**Smallest correct fix (bigger than expected, needs a product call):**
1. The refund picks an **expense** category: when `estornoCartaoId` is set, filter `c.type === 'expense'`. No migration is needed, since there is no constraint.
2. `gastoDaCategoriaNoMes` and `buildCategoryCommitmentsForMonth` subtract `type='income' && payment_method='credit_card' && category_id = cat`, attributed by the same close month (`statementCloseYmdForPurchaseYmd`).
3. Update the parity vectors.
4. Every income-by-category reader (the income card, reports, `relatorio`, insights) must ignore income rows whose category is an expense category. Otherwise a refund shows up as "income" under Mercado.

The alternative is a new column `transactions.estorno_de uuid` (the original purchase) and inheriting its category, which is a bigger change. The import, IA and capture paths that create refunds also need the category choice.

**Tests:** Vitest `src/lib/category-commitments.test.ts` and the orcamento parity test with a refund vector; Deno `_shared/orcamento-mes.test.ts` with the same vector.

**Risks:**
- `evaluate-budgets` is in Edges and is called by the `main` front. Changing `orcamento-mes.ts` and redeploying changes the budget alerts for `main` users, while the `main` category screen still doesn't subtract. That's harmless today (no refund in `main` has an expense category).
- Without the change, the alert stays inflated.

---

## #23 — two concurrent capture re-sends create two installment plans

**Where**
- `supabase/functions/capture/index.ts:193-209`: the retry lookup by `client_id` on `transactions`.
- :269-317: `rpc('criar_plano_parcelado', …)`, then reads the 1st installment, then a **separate** update writes `client_id` on it:
  ```ts
  // ponytail: dois retries simultâneos criam dois planos (o 2º update esbarra na chave única e só vira log)
  const meta = { client_id: clientId, capture_meta: linha.capture_meta }
  await admin.from('transactions').update(meta).eq('id', primeira.id)
  ```
- `20261024120000_ia.sql:112-191` `criar_plano_parcelado` (security definer, service_role only). It takes no client key. `workspace_installment_plans` has no `client_id` (baseline :2050-2215 list the `client_id` uniques, and plans are not among them).
- `create_workspace_installment_plan` (ia.sql:200-240) is the app RPC and calls it **positionally with 10 args**.

**Current behavior (confirmed):** two concurrent requests both miss the lookup, so both create a plan. The second `client_id` update fails on the unique key and is only logged.

**Smallest correct fix (new migration + Edge)**
- `drop function public.criar_plano_parcelado(uuid,uuid,uuid,text,text,uuid,integer,numeric,numeric,date,text,boolean)` and re-create it with an extra `p_client_id uuid default null`. Re-grant to service_role only.
- When `p_client_id` is not null:
  1. `perform pg_advisory_xact_lock(hashtext('plano:' || p_client_id::text));`
  2. If a transaction with `client_id = p_client_id` exists, return its `installment_plan_id`.
  3. Otherwise create the plan as today. Inside the RPC, write `client_id` on the first installment (`order by date, id limit 1`).
- The second caller waits on the lock, then finds the first caller's row.
- Edge: pass `p_client_id: clientId` and drop the separate update, keeping `capture_meta` in the update or passing it in the RPC as well.
- `create_workspace_installment_plan`'s positional call resolves to the new signature through the default. Re-create it anyway, so the dependency is explicit.
- `novo` in the Edge stays `true` for both, so `evaluate-budgets` and `evaluate-limite` may run twice. Their notifications have dedupe; accept it, or return `jsonb` with `{id, novo}`, which costs a bigger signature change.

**Tests:** source test (migration: `p_client_id`, `pg_advisory_xact_lock`, `client_id` written inside). Deno test of the capture flow if one exists (`_shared/captura.test.ts` is pure). A pgTAP concurrency test isn't practical; assert the second call returns the same plan id.

**Risks:**
- `create_workspace_installment_plan` **is used by the live `main` front**. Keep its signature and behavior unchanged; the default param keeps it compatible.
- Drop and create run in one migration transaction, so there is no window.
- Capture (3A) is unpublished, so there is no Edge risk.

---

## #48 — "Apagar um" deletes the higher uuid

**Where:** `src/lib/insights/acoes.ts:136-148`:
```ts
/** Dos dois lançamentos iguais, apaga o de id maior (o outro fica). */
const alvo = ids(insight.payload.ids).sort().at(-1)
```
The detector sorts by id too (`detectores.ts:244`).

**Current behavior (confirmed):** it deletes the higher random uuid, with no regard for attachments, review state or age.

**Smallest correct fix (client only):** read both rows before deleting:
```ts
supabase.from('transactions').select('id, created_at, needs_review, attachments(count)').in('id', ids)
```
Then pick the one to delete with a pure function `qualApagar(linhas)`:
- prefer to keep the one with an attachment;
- then the one already reviewed (`needs_review = false`);
- then the older `created_at`;
- delete the other.

If only one row still exists, don't delete; just mark the insight `acted`. The confirmation text can name what stays ("o que tem anexo fica").

**Tests:** Vitest for `qualApagar` in `src/lib/insights/acoes.test.ts`.

**Risks:** none for `main` (insights are 6B, unpublished). No migration and no Edge change.

---

## #46 — "Atualizar valor" can update the wrong subscription

**Where**
- `_shared/insights/detectores.ts:267-297` `detectarPrecoDeAssinatura`:
  ```ts
  const nome = normalizarDescricao(s.name)
  const l = soltos.find((x) => contem(normalizarDescricao(x.description), nome))
  if (dif <= 1 || dif >= centavos(s.amount) / 2) continue
  ```
  "Amazon" 14,90 matches "Amazon compra" 19,90 (the difference is under 50%).
- The subscriptions are selected without payment fields: `insights-daily/index.ts:346` `select ... id, name, amount, is_active, kind`.
- The action applies `payload.para` blindly: `src/lib/insights/acoes.ts:127-134`.

**Current behavior (confirmed):** a word-contained match on name alone.

**Smallest correct fix:** in the detector, accept the match only if
- `normalizarDescricao(x.description) === nome` (the same description), **or**
- `contem(...)` **and** the same `payment_method` **and** (when the subscription has a card) the same `payment_credit_card_id`.

Add `payment_method, payment_credit_card_id` to the select at index.ts:346 and to the detector's input type. The app reexports the detector (`src/lib/insights/insights.ts`), so update its types.

**Tests:** Deno `_shared/insights/detectores.test.ts`: the Amazon case is no longer emitted, and the same card or the exact name still is.

**Risks:** insights-daily is unpublished, and no insights exist in prod. No migration.

---

## #79 — read-only (`garantir_escrita`) doesn't cover `projects`, `workspace_split_weights`, `workspace_member_limits`

**Where:** `20261025120000_planos.sql:225-267` `garantir_escrita()`. It is generic: it uses `coalesce(new.workspace_id, old.workspace_id)` and skips when `auth.uid()` is null or `pg_trigger_depth() > 1`. It is attached at :269-283 to transactions (I/U/D), and to installment_plans, subscriptions and attachments (insert). `20261031130000_divisao.sql:636-638` attaches it to settlements. The three tables all have `workspace_id`:
- `20261031120000_projetos.sql:11` `projects`;
- `20261031130000_divisao.sql:155` `workspace_split_weights`;
- `20261029130000_limites.sql:13` `workspace_member_limits`.

All three are written by the client directly under RLS policies.

**Current behavior (confirmed):** no trigger on those three tables.

**Smallest correct fix (new migration):**
```sql
create trigger garantir_escrita before insert or update on public.projects for each row execute function public.garantir_escrita();
create trigger garantir_escrita before insert or update or delete on public.workspace_split_weights for each row execute function public.garantir_escrita();
create trigger garantir_escrita before insert or update or delete on public.workspace_member_limits for each row execute function public.garantir_escrita();
```
The member-delete cascade (limits FK to `workspace_members`) and user deletion pass, through depth > 1 or a null uid. Archiving a project is an update and should be blocked too.

**Tests:** source test in `src/lib/planos/migracao-planos.test.ts` or `migracao-cobranca.test.ts`. They already lock the `garantir_escrita` list; extend it. The front already translates `workspace_somente_leitura` (`src/lib/supabase-errors.ts`).

**Risks:** `billing_settings.enforced_since` null means everyone is `familia`, so nothing changes until billing is enforced. The tables don't exist on `main`'s DB until 7A and 7C ship; order the migration after them (it already is).

---

## #81 — the Asaas customer is not updated after the first purchase

**Where**
- `supabase/functions/billing-checkout/index.ts:177-195`: `let cliente = linha.asaas_customer_id; if (!cliente) { criarCliente(...) ... }`. With a stored customer, the new `nomeLimpo`/`cpf` (:109-111) are ignored.
- `_shared/asaas.ts:31-36`: the `asaas()` client supports only `'GET' | 'POST' | 'DELETE'`. :63-73 `criarCliente` → `POST /customers`.

**Current behavior (confirmed):** name and CPF from later checkouts never reach Asaas, so the NFS-e uses the first registration.

**Smallest correct fix (Edge only):**
- Add `atualizarCliente(cfg, id, {nome, cpf, email})` in `_shared/asaas.ts`, with the same body as `criarCliente` minus `externalReference`.
- In `billing-checkout`, call it when `cliente` was already set, before creating the charge. On failure, log only the status (not the CPF) and continue; the purchase isn't blocked.
- **Confirm the HTTP verb in the Sandbox.** Asaas docs have shown `POST /v3/customers/{id}`; newer docs say `PUT`. If it's `PUT`, widen the method union. Add it to the §0 list of `BLOCO_8` deployment questions.
- No column is needed: name and CPF aren't stored, and re-sending every time is the simplest path.

**Tests:** Deno `_shared/asaas.test.ts` (stubbed fetch; it already exists): the path, the verb, and a body without `externalReference`.

**Risks:** billing (Bloco 8) is unpublished, with no `main` impact. One extra call per checkout.

---

## #87 — billing notices

**Where**
- `billing-daily/index.ts:143-158` `entregar`: it claims `billing_avisos (user_id,tipo,referencia)` and **releases on failure** (`releaseDedupe`). Retry depends on the caller running again the next day.
- `:481-491` `expirar` → `avisar(..., 'fim', AVISOS.fim())` runs after the status is already `expired`. The next run selects only `active`/`past_due` (:500), so **a failed 'fim' is never retried**.
- `:569-609` `refazerEstornos`: it marks `estorno_status='feito'` first, then notifies. A failed 'reembolso' or 'estorno' notice is never retried, because the row is no longer `pendente`. The 'estorno' branch (:605-609) uses `enviar` with no dedupe at all.
- `asaas-webhook/index.ts:291, 296-321` `avisarDoEstorno`: log only. `billing-cancel` (lines ~233-281 of the file): it claims the `'reembolso'` dedupe and releases on failure, and nobody retries.
- No personal wallet: `billing-daily/index.ts:161-176` `destinoDe` (`.eq('type','personal')`, otherwise `erro(...)`, `return null`). The same lookup is copied in `asaas-webhook` :298-309 and `billing-cancel` :~250-258. `notifications.workspace_id` is **NOT NULL** (baseline.sql:1756), and `deliverNotification` requires `workspaceId`.
- Wrong refund text: `:579` `if (p.installment === linha.provider_ref) { …reembolso… } else { …AVISOS.estorno()… }`. After a refund stays pending and the PAYMENT_REFUNDED webhook expires the row, a new purchase changes `provider_ref`. The cron then concludes the old refund through the "dobro" branch and sends "Cobrança em dobro devolvida". **Confirmed.**
- `_shared/billing.ts:248-279`: `pagamentoEmDobro` requires `registro.ativado_em === null`. The withdrawal refund is always on the activated `provider_ref`, because `marcarAtivado` sets `ativado_em`.
- `20261025120000_planos.sql:51-57` `billing_avisos(user_id, tipo, referencia, enviado_em not null default now(), pk(user_id,tipo,referencia))`.

**Smallest correct fixes**

(c) Wrong text: decide by the record instead of the current row: `if (p.ativado_em) { reembolso path } else { estorno path }`. `p` is already the `billing_parcelamentos` row (select `*`). Keep the `.eq('provider_ref', p.installment)` guard on the expire update. No migration.

(a) Retry: an outbox in `billing_avisos`.
- New migration: `alter table billing_avisos add column pendente boolean not null default false`.
- For fixed-text kinds (`fim`, `reembolso`, and a new `estorno` with referencia = installment), claim with `pendente = true` and set it to `false` on success. On failure, **keep** the row instead of releasing it.
- New `reenviarAvisos(ctx)` in billing-daily: `select * from billing_avisos where pendente and enviado_em < now() - 1h`, rebuild the text from `tipo` (`AVISOS.fim()/reembolso()/estorno()`), and resend.
- `renovacao`, `cartao` and `teste` keep today's release behavior: their text depends on the row, and the daily loop already retries them.
- Route the webhook's `avisarDoEstorno`, the cron's `estorno` branch and billing-cancel's notice through the same claim.

(b) No personal wallet: move `destinoDe` into `_shared/billing` (one copy instead of three). Fall back to the oldest workspace where the user is `owner`, then any membership. With none, send e-mail directly; `renderEmailHtml` and the e-mail sender are already in `_shared`. Otherwise log.

**Tests**
- Deno: the pure picker of the refund text from `ativado_em` (extract `textoDoEstornoConcluido(p)` to `_shared/billing.ts`, tested in `billing.test.ts`), and `destinoDe` fallback ordering (pure ranking).
- Source test for the `pendente` column in `migracao-cobranca.test.ts`.

**Risks:** all four Edges are Bloco 8, unpublished; `deliver-notification` is unchanged. The migration's default `false` keeps today's semantics if the Edges ship later.

---

## #33 — due date assumes "close month + 1"

**Where**
- `src/lib/credit-card-billing.ts:205-220`:
  ```ts
  // Heuristic: due in the month after the close month, on min(dueDay, daysInMonth).
  let dueM0 = m0 + 1
  ```
- `supabase/functions/_shared/credit-card-cycle.ts:212-222` `estimatedDueYmdForClose` (`let m = closeYmd.m + 1`).
- `:243-263` `nextPaymentDueCycleOnOrAfter`: it starts one cycle before the last close and loops forward, so it stays correct with the new rule. Its doc example "fecha 3, vence 10: em 05/11 vence 10/11, da fatura de 03/10" becomes "da fatura de 03/11"; update the comment.
- Fixture `src/lib/fixtures/billing-calendar-vectors.json:33-37` `estimated_due_for_close`. All 4 vectors keep their value under the new rule, because each `due_day` is ≤ the close day. It is consumed by `src/lib/billing-calendar-parity.test.ts` and `supabase/functions/_shared/credit-card-cycle.test.ts`. The SQL parity test covers subscriptions only, and no SQL computes the card due date.

**Fix rule:** due = the first `min(due_day, daysInMonth)` strictly after the close: the close month if `clamp(due_day, closeMonth) > close.d`, otherwise the next month (clamped).

**Edge case to decide:** in February, when the close is clamped and `due_day` is clamped to the same day (closing 30/31, due 30/31), the due date moves to March, about 31 days later. Pick a vector and document it.

**Callers that only need the function fixed**
- `credit-card-billing.ts:232` (`isEstimatedDuePastForClose`), :475 (`buildCardMonthlyInvoiceSnapshot`), :523 (purchase hint), :718 (`estimatedDueLastClose`);
- `transactions-table.tsx:119,143`;
- `credit-card-billing-form-preview.ts:34`;
- `credit-card-invoice-analytics-panel.tsx:586`;
- `previsao/fluxo.ts:188`. Also `fluxo.ts:117-118` already scans the closes of `[ym-1, ym]` and filters by `noMes(dueYmd)`; fix the comment at :114;
- Edge `credit-card-calendar-alerts/index.ts:158` (closed notice) and :179.

**Callers that also assume "+1 month" and need code changes (more than expected)**
1. `src/components/dashboard/payment-events.ts:253-284`: for month `ym` it takes **only that month's close** (`statementCloseInMonth(y, m0, …)`) and emits `card_due` only if the due date falls in the month. Under today's rule, the Painel calendar **never shows the card due date** (a latent bug). After the fix it would show only same-month dues. Iterate the closes of `ym-1` and `ym`.
2. `src/lib/jornada/jornada.ts:66-71` `datasDoCartao`: a two-step choice (the due of the previous close, otherwise the due of `fecha`). With a same-month due it can return a past date (close 5, due 25, today 26/10 → 25/10). Use the loop from `nextPaymentDueCycleOnOrAfter`: port the front twin or loop forward.
3. `supabase/functions/insights-daily/index.ts:261-292` `relatorioDoMes`: "A fatura que vence no mês fechou no mês antes dele". `fechouAntes = inicioDoMes(hoje, 2)` reads only the payments of invoices closed 2 months back. Widen to closes from `inicioDoMes(hoje,2)` through `fim` and filter by `estimatedDueYmdForClose(close) in mes` (it already computes this at :314).
4. User-facing copy: `src/lib/credit-card-billing-copy.ts:42` ("O app estima essa data no mês seguinte ao fechamento"), plus the comment at `transactions-table.tsx:92`.

**Tests**
- Add vectors to the shared fixture: close 2026-10-05 with due 25 → 2026-10-25; close 03 with due 10 → same month; due == close day → next month; the February clamp collision.
- Vitest `billing-calendar-parity.test.ts`, Deno `credit-card-cycle.test.ts` (both read the fixture), `nextPaymentDueCycleOnOrAfter` cases, a `payment-events` test for the previous-month close, and `jornada` tests.
- Expect existing tests with `due_day > closing_day` to change their expected dates (fluxo, jornada, payment-events, previsao). Run the full suites.

**Risks**
- **`credit-card-calendar-alerts` is live and shared with `main`.** Redeploying it with the new `_shared/credit-card-cycle.ts` moves the "due soon" and "due today" alerts (dedupe key `cal:due_soon:<due>`) to the correct earlier date for `main` users. Meanwhile the `main` UI still shows month+1, so the two are inconsistent until 2.0 ships. Either hold the Edge redeploy until the front ships, or accept the correction.
- No migration and no SQL involved.
