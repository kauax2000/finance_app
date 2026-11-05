# Lê da entrada a saída JSON do `supabase db query -o json`
# ({"boundary", "rows", "warning"}) e imprime só as linhas (rows) em JSON.
# Os avisos que o CLI escreve antes do JSON podem ter colchetes, por isso a
# leitura tenta cada linha que começa com { ou [, e não o primeiro colchete.
import json
import sys

texto = sys.stdin.read()
linhas = texto.splitlines(keepends=True)
decodificador = json.JSONDecoder()
for i, linha in enumerate(linhas):
    if not linha.lstrip().startswith(("{", "[")):
        continue
    resto = "".join(linhas[i:]).lstrip()
    try:
        d = decodificador.raw_decode(resto)[0]
    except json.JSONDecodeError:
        continue
    if isinstance(d, dict) and "rows" in d:
        print(json.dumps(d["rows"]))
        sys.exit(0)
    if isinstance(d, list):
        print(json.dumps(d))
        sys.exit(0)
sys.exit("o db query não devolveu JSON")
