import { describe, expect, it } from "vitest"

import { lerFonte } from "@/test/fonte"

const yml = lerFonte(".github/workflows/backup-db.yml")

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

  it("segredo só entra por env: a linha do pg_dump não interpola ${{ }}", () => {
    const linhas = yml.split("\n").filter((l) => l.includes("pg_dump"))
    expect(linhas.length).toBeGreaterThan(0)
    for (const l of linhas) expect(l).not.toContain("${{")
    expect(yml).toContain("DB_URL: ${{ secrets.SUPABASE_DB_URL }}")
    expect(yml).toContain("PASS: ${{ secrets.BACKUP_PASSPHRASE }}")
  })

  it("só sobe o artefato depois de cifrar", () => {
    const gpg = yml.indexOf("gpg")
    const upload = yml.indexOf("upload-artifact")
    expect(gpg).toBeGreaterThan(-1)
    expect(upload).toBeGreaterThan(gpg)
  })

  it("falha cedo se o segredo faltar, e o pipe quebra junto com o pg_dump", () => {
    expect(yml).toContain("set -euo pipefail")
    expect(yml).toContain("permissions:")
    expect(yml).toContain("contents: read")
  })
})
