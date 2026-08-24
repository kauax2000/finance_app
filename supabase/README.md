# Supabase — regras de operação

## Schema: só migrações

Todo o schema evolui **exclusivamente** via `supabase/migrations/`
(`supabase db push`). Não rode SQL manual no SQL Editor para mudar schema.

- `00000000000000_baseline.sql` — schema completo consolidado (Fase 3 da
  revisão de backend). Substituiu as 31 migrações antigas e os ~30 SQLs soltos
  que viviam neste diretório (histórico completo no git).
- Migrações novas entram com timestamp normal (`YYYYMMDDHHMMSS_nome.sql`) e
  devem ser idempotentes quando possível (`if not exists`, `create or replace`,
  `drop ... if exists`).
- Produção foi reconciliada via `supabase migration repair` — procedimento e
  smoke tests em [docs/BASELINE_RUNBOOK.md](../docs/BASELINE_RUNBOOK.md).

## Desenvolvimento local

```bash
supabase start        # sobe o stack local (constrói o banco do baseline)
supabase db reset     # reconstrói do zero (migrations/ é autossuficiente)
npm run test:db       # pgTAP (supabase test db)
npm run test:edge     # Deno tests de supabase/functions/_shared (requer deno)
```

`config.toml` desabilita o container de analytics (incompatível com colima).

## Edge Functions

- `verify_jwt = false` em todas — cada função valida o caller internamente
  (JWT via `_shared/auth-user.ts`, `x-cron-secret` com comparação
  constant-time, ou service-role).
- Helpers compartilhados em `_shared/` (session-guard, token-hash,
  timing-safe-equal, deliver-notification, supabase-admin).
- Deploy: `npm run supabase:deploy:functions`.
