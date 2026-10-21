import { describe, expect, it } from "vitest"

import { lerFonte } from "@/test/fonte"

const yml = lerFonte(".github/workflows/backup-db.yml")
// do nome do passo do dump até o `upload-artifact`
const passoDoDump = yml.slice(yml.indexOf("- name: Dump cifrado"), yml.indexOf("uses: actions/upload-artifact"))

describe("backup-db.yml", () => {
  it("roda semanal, no domingo, e sob demanda", () => {
    expect(yml).toContain("schedule:")
    expect(yml).toContain('cron: "0 6 * * 0"')
    expect(yml).toContain("workflow_dispatch:")
  })

  it("faz o dump com o cliente 17, cifra com AES256 e guarda 90 dias", () => {
    for (const trecho of ["postgres:17", "pg_dump", "--symmetric", "--cipher-algo AES256", "retention-days: 90"]) {
      expect(yml).toContain(trecho)
    }
  })

  it("segredo só entra por env: nenhum comando de um run: interpola ${{ }}", () => {
    const linhas = yml.split("\n")
    let dentroDoRun = false
    let recuoDoRun = 0
    const interpolando: string[] = []
    for (const l of linhas) {
      const recuo = l.length - l.trimStart().length
      if (dentroDoRun && l.trim() !== "" && recuo <= recuoDoRun) dentroDoRun = false
      if (dentroDoRun && l.includes("${{")) interpolando.push(l.trim())
      if (/^\s*run:\s*\|/.test(l)) {
        dentroDoRun = true
        recuoDoRun = recuo
      }
    }
    expect(interpolando).toEqual([])
    expect(yml).toContain("DB_URL: ${{ secrets.SUPABASE_DB_URL }}")
    expect(yml).toContain("PASS: ${{ secrets.BACKUP_PASSPHRASE }}")
  })

  it("o job tem timeout de 30 minutos", () => {
    expect(yml).toContain("timeout-minutes: 30")
  })

  it("só sobe o artefato depois de cifrar", () => {
    expect(yml).toContain("uses: actions/upload-artifact")
    // a fatia termina no upload: um gpg que fosse para depois dele não estaria nela
    expect(passoDoDump).toMatch(/\|\s*gpg\s+--batch/)
  })

  it("falha cedo se o segredo faltar, e o pipe quebra junto com o pg_dump", () => {
    expect(passoDoDump).toContain("set -euo pipefail")
    expect(yml).toContain("permissions:")
    expect(yml).toContain("contents: read")
  })

  it("o stderr do pg_dump vai a um arquivo, e a falha imprime só o erro genérico", () => {
    expect(passoDoDump).toContain('err="$(mktemp)"')
    expect(passoDoDump).toContain('2>"$err"')
    expect(passoDoDump).toContain("::error::pg_dump falhou (veja a conexão/segredo SUPABASE_DB_URL)")
    expect(passoDoDump).not.toMatch(/cat\s+"?\$err/)
  })
})
