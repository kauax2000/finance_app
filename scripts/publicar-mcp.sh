#!/usr/bin/env bash
# Publica o MCP (conectar Claude/ChatGPT) no projeto de produção (sa-east-1),
# seguindo supabase/MCP_DEPLOYMENT.md:
#   1. retrato do que muda (função do parcelado e config do authenticator) em
#      ~/Desktop/Finance App/backups-prod/, fora do repositório;
#   2. as três migrações do MCP (20261103120000, …130000, …140000), aplicadas
#      uma a uma e registradas no histórico. As outras pendentes (Contas 6A,
#      titular 7B, Asaas 8, Bloco 9) NÃO sobem aqui: o MCP não depende delas;
#   3. a Edge `mcp`, com --no-verify-jwt (a descoberta OAuth chega sem token);
#   4. as conferências: 401 com WWW-Authenticate na URL do MCP.
# O servidor OAuth se liga só pelo painel (passo do dono, antes ou depois):
#   Authentication › OAuth Server: ligar; Authorization Path /oauth/consent;
#   Dynamic Client Registration ligado. Nunca `supabase config push`.
set -euo pipefail
cd "$(dirname "$0")/.."

# O projeto ligado (supabase/.temp, fora do git): o repositório é público.
REF=$(cat supabase/.temp/project-ref)
[ -n "$REF" ] || { echo "rode supabase link antes"; exit 1; }
BACKUP="$HOME/Desktop/Finance App/backups-prod/mcp-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP"

echo "== retrato em $BACKUP"
supabase db query --linked "select pg_get_functiondef(p.oid) as def from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'create_workspace_installment_plan'" > "$BACKUP/create_workspace_installment_plan.json"
supabase db query --linked "select rolconfig::text from pg_roles where rolname = 'authenticator'" > "$BACKUP/authenticator.json"
supabase db query --linked "select pg_get_constraintdef(oid) from pg_constraint where conname = 'transactions_source_check'" > "$BACKUP/transactions_source_check.json"

for M in 20261103120000_mcp 20261103130000_mcp_token_somente_leitura 20261103140000_mcp_guarda_rpc; do
  VERSAO=${M%%_*}
  NOME=${M#*_}
  JA=$(supabase db query --linked "select count(*) as n from supabase_migrations.schema_migrations where version = '$VERSAO'" | grep -o '"n": *[0-9]*' | grep -o '[0-9]*$')
  if [ "$JA" != "0" ]; then echo "== $M já aplicada"; continue; fi
  echo "== aplicando $M"
  supabase db query --linked -f "supabase/migrations/$M.sql"
  supabase db query --linked "insert into supabase_migrations.schema_migrations(version, name) values ('$VERSAO', '$NOME') on conflict (version) do nothing"
done

echo "== publicando a Edge mcp"
supabase functions deploy mcp --project-ref "$REF" --use-api --no-verify-jwt

echo "== conferência (espera 401 com www-authenticate)"
URL="https://$REF.supabase.co/functions/v1/mcp"
curl -s -o /dev/null -D - -X POST "$URL" -H 'content-type: application/json' -d '{}' | grep -iE '^HTTP|www-authenticate' || true
curl -s -o /dev/null -w "oauth server: %{http_code} (200 = ligado no painel; 404 = ainda desligado)\n" "https://$REF.supabase.co/.well-known/oauth-authorization-server/auth/v1"

echo "pronto. Retrato em: $BACKUP"
