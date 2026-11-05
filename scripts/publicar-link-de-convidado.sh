#!/usr/bin/env bash
# Publica o link de convite com papel (05/11/2026) nos dois projetos: a migração
# 20261105120000_link_de_convidado.sql (tira o check que exigia e-mail do
# convidado) e a Edge workspace-invites-create (papel no link, link ativo
# visível pelo action get). Compatível com o front de main: ele não manda papel
# no link, e o link continua de membro.
set -euo pipefail
cd "$(dirname "$0")/.."

MIGRACAO=supabase/migrations/20261105120000_link_de_convidado.sql
VOLTAR=$(cat supabase/.temp/project-ref 2>/dev/null || true)

for REF in rpgveoalgxrlsfowvixe gexvgoknthcvdnqtdukq; do
  echo "== $REF"
  supabase link --project-ref "$REF" >/dev/null
  supabase db query --linked -f "$MIGRACAO"
  supabase db query --linked "insert into supabase_migrations.schema_migrations(version, name, statements) values ('20261105120000', 'link_de_convidado', array['alter table public.workspace_invites drop constraint if exists workspace_invites_guest_requer_email']) on conflict (version) do nothing"
  supabase functions deploy workspace-invites-create --project-ref "$REF" --use-api --no-verify-jwt
done

if [ -n "$VOLTAR" ]; then supabase link --project-ref "$VOLTAR" >/dev/null; fi
echo "pronto"
