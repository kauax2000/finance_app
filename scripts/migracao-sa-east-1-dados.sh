#!/usr/bin/env bash
# Recopia os dados de public e auth do projeto antigo (us-west-2, produção, só
# lido) para o novo (sa-east-1) na hora da virada, e confere as contagens.
# Esquema, funções, cron, vault, storage e Edge Functions já estão no novo e
# não são tocados. Quem roda é o dono. Rodar duas vezes dá o mesmo resultado.
set -euo pipefail
cd "$(dirname "$0")/.."

ANTIGO=rpgveoalgxrlsfowvixe
NOVO=gexvgoknthcvdnqtdukq
VOLTAR=$(cat supabase/.temp/project-ref 2>/dev/null || true)
TMP=$(mktemp -d)

religar() {
  rm -rf "$TMP"
  if [ -n "$VOLTAR" ]; then supabase link --project-ref "$VOLTAR" >/dev/null 2>&1 || true; fi
}
trap religar EXIT

echo "1. Copia os dados de public e auth do projeto antigo ($ANTIGO), só lendo."
echo "2. APAGA e recarrega public e os usuários (auth) no projeto novo ($NOVO)."
echo "3. Confere a contagem de linhas de cada tabela nos dois lados."
read -r -p "Digite virar para seguir: " RESPOSTA
if [ "$RESPOSTA" != "virar" ]; then echo "Nada foi feito."; exit 1; fi

# A consulta que monta o count(*) de cada tabela de public e de auth.users.
GERAR_CONTAGEM="select string_agg(format('select %L as tabela, count(*)::bigint as n from %I.%I', table_schema || '.' || table_name, table_schema, table_name), ' union all ' order by table_schema, table_name) as sql from information_schema.tables where table_type = 'BASE TABLE' and (table_schema = 'public' or (table_schema = 'auth' and table_name = 'users'))"

# Lê as linhas da saída JSON do db query ({"boundary", "rows", "warning"}),
# pulando os avisos que o CLI escreve antes do JSON.
linhas_json() {
  python3 -c '
import json, re, sys
texto = sys.stdin.read()
inicio = re.search(r"[{\[]", texto)
if not inicio:
    sys.exit("o db query não devolveu JSON")
d = json.JSONDecoder().raw_decode(texto[inicio.start():])[0]
rows = d["rows"] if isinstance(d, dict) else d
print(json.dumps(rows))'
}

# Escreve em $1 o mapa { "<schema>.<tabela>": n } do projeto ligado.
contar() {
  supabase db query --linked -o json "$GERAR_CONTAGEM" | linhas_json \
    | python3 -c 'import json, sys; print(json.load(sys.stdin)[0]["sql"])' > "$TMP/contar.sql"
  supabase db query --linked -o json -f "$TMP/contar.sql" | linhas_json \
    | python3 -c 'import json, sys; print(json.dumps({r["tabela"]: int(r["n"]) for r in json.load(sys.stdin)}, sort_keys=True))' > "$1"
}

echo "== antigo: $ANTIGO (só leitura)"
supabase link --project-ref rpgveoalgxrlsfowvixe >/dev/null
# Sem --use-copy: o db query manda o arquivo pela API, que não tem o stdin do COPY.
if ! supabase db dump --linked --data-only -s public,auth -f "$TMP/dump.sql" 2> "$TMP/dump.err"; then
  if grep -qi docker "$TMP/dump.err"; then
    echo "O db dump precisa do Docker: rode \`colima start\` e tente de novo."
  else
    cat "$TMP/dump.err" >&2
  fi
  exit 1
fi
contar "$TMP/antigo.json"

echo "== novo: $NOVO (apaga e recarrega)"
supabase link --project-ref gexvgoknthcvdnqtdukq >/dev/null
# Esvazia todas as tabelas de public e de auth que o dump traz (o dump não traz
# auth.schema_migrations), para a carga não esbarrar em chave repetida. É
# delete: o postgres não tem o privilégio de esvaziar de vez as tabelas do auth, e
# com session_replication_role = replica as chaves estrangeiras não disparam.
{
  echo "begin;"
  echo "set session_replication_role = replica;"
  cat <<'SQL'
do $$
declare t text;
begin
  for t in
    select format('%I.%I', table_schema, table_name) from information_schema.tables
    where table_type = 'BASE TABLE'
      and (table_schema = 'public' or (table_schema = 'auth' and table_name <> 'schema_migrations'))
  loop
    execute 'delete from ' || t;
  end loop;
end $$;
SQL
  # A API recusa os meta-comandos do psql (\restrict e companhia).
  grep -v '^\\' "$TMP/dump.sql" || true
  echo
  echo "set session_replication_role = origin;"
  echo "commit;"
} > "$TMP/carga.sql"
supabase db query --linked -f "$TMP/carga.sql" >/dev/null
contar "$TMP/novo.json"

echo "== conferência"
if node scripts/lib/contagens.mjs "$TMP/antigo.json" "$TMP/novo.json"; then
  echo "pronto: as contagens batem"
else
  echo "as contagens acima não batem" >&2
  exit 1
fi
