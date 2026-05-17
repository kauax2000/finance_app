# Performance work (finance-app)

This doc tracks how to measure and what shipped in the performance pass.

## Bundle analysis

```bash
npm run analyze
```

Opens the webpack bundle analyzer when `ANALYZE=true` (via `@next/bundle-analyzer`). Use after UI changes that add heavy dependencies (e.g. charts).

## Web vitals / cold load

Compare before/after on:

- `/dashboard`
- `/transactions`
- `/bills`
- `/credit-cards`
- `/subscriptions`

Use Lighthouse (Chrome DevTools) or WebPageTest. Record LCP, TBT, and total JS transferred.

## Database

After applying migrations, use **Supabase Studio → Postgres → Query performance** to confirm:

- List queries on `transactions` use `idx_transactions_workspace_date_desc` (or partial CC/subscription indexes).
- `run_subscription_billing` no longer scans every inactive row (see `20260514140000_run_subscription_billing_scope.sql`).

Run `EXPLAIN (ANALYZE, BUFFERS)` on representative `transactions` list filters from `fetch-transactions-list-page.ts`.

## RPC bundles

These RPCs collapse multiple PostgREST round-trips into one call (with legacy client fallback if the RPC is missing):

- `rpc_fetch_subscriptions_page_bundle`
- `rpc_fetch_bills_page_bundle`
- `rpc_fetch_category_detail_bundle`

## Edge / cron

- `evaluate-bills-reminders` scopes pending `bill_instances` to `due_date <= today + 120 days` to avoid full-table scans.
- `sessions` edge: parallel count queries in `assertCallerSessionAllowed`.

## Follow-ups (not done here)

- `rpc_fetch_dashboard_bundle` to replace the multi-query dashboard bootstrap.
- Optimistic updates on transaction save / bill pay.
- Denormalize `workspace_id` on `transaction_splits` if RLS cost remains high.
