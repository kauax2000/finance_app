import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

const fonte = readFileSync("scripts/migracao-sa-east-1-dados.sh", "utf8")

describe("migracao-sa-east-1-dados.sh", () => {
  it("pede confirmação e religa o projeto de antes", () => {
    for (const trecho of ["trap", "read", "virar", "--data-only", "session_replication_role = replica"]) {
      expect(fonte).toContain(trecho)
    }
  })
  it("conhece os dois projetos", () => {
    expect(fonte).toContain("rpgveoalgxrlsfowvixe")
    expect(fonte).toContain("gexvgoknthcvdnqtdukq")
  })
  it("não usa a chave de serviço nem empurra migração", () => {
    expect(fonte).not.toContain("SERVICE_ROLE")
    expect(fonte).not.toContain("db push")
  })
  it("só apaga com o projeto novo ligado", () => {
    const novo = fonte.indexOf("link --project-ref gexvgoknthcvdnqtdukq")
    const antigo = fonte.indexOf("link --project-ref rpgveoalgxrlsfowvixe")
    const apaga = fonte.indexOf("delete from")
    expect(antigo).toBeGreaterThan(-1)
    expect(novo).toBeGreaterThan(antigo)
    expect(apaga).toBeGreaterThan(novo)
    expect(fonte.toLowerCase()).not.toContain("truncate")
  })
  it("confere o projeto ligado logo antes de mandar a carga", () => {
    const trava = fonte.indexOf('[ "$(cat supabase/.temp/project-ref)" = "$NOVO" ] || { echo "Ligado no projeto errado: nada foi apagado."; exit 1; }')
    const carga = fonte.indexOf('supabase db query --linked -f "$TMP/carga.sql"')
    expect(trava).toBeGreaterThan(fonte.indexOf("link --project-ref gexvgoknthcvdnqtdukq"))
    expect(carga).toBeGreaterThan(trava)
    expect(fonte.slice(trava, carga).split("\n").length).toBe(2)
  })
  it("tira os meta-comandos do psql do dump antes de mandar à API", () => {
    expect(fonte).toContain(`grep -v '^\\\\' "$TMP/dump.sql"`)
  })
  it("lê as linhas do JSON do CLI pulando os avisos, mesmo com colchete", () => {
    expect(fonte).toContain("python3 scripts/lib/linhas-json.py")
    const entrada =
      'A new version [v2.1] available\nInitialising login role...\n{"boundary":"x","rows":[{"tabela":"public.a","n":1}],"warning":"w"}\n'
    const saida = execFileSync("python3", ["scripts/lib/linhas-json.py"], { input: entrada, encoding: "utf8" })
    expect(JSON.parse(saida)).toEqual([{ tabela: "public.a", n: 1 }])
  })
})
