import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

/** A lista de pares, trancada na rodada 190. */

const arquivos = (dir: string): string[] =>
  readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome)
    return statSync(caminho).isDirectory()
      ? arquivos(caminho)
      : /\.tsx$/.test(nome)
        ? [caminho]
        : []
  })

const TELAS = arquivos(join(process.cwd(), "src")).map((caminho) => ({
  caminho,
  texto: readFileSync(caminho, "utf8"),
}))

describe("a lista de pares", () => {
  it("nenhum termo escreve a caixa alta à mão", () => {
    const culpados = TELAS.filter(({ texto }) =>
      /<DescriptionTerm\b[^>]*className="[^"]*\buppercase\b/.test(texto)
    ).map(({ caminho }) => caminho)
    expect(culpados).toEqual([])
  })

  it("nenhuma lista sobrescreve as colunas da grade", () => {
    const culpados = TELAS.filter(({ texto }) =>
      // Sem prefixo: `sm:grid-cols-1` desfaz o `columns` num degrau, e vale.
      /<DescriptionList\b[^>]*className="(?:[^"]*\s)?grid-cols-\d/.test(texto)
    ).map(({ caminho }) => caminho)
    expect(culpados).toEqual([])
  })

  it("a sobrancelha vence o Caption por especificidade, um nível só", () => {
    const fonte = readFileSync(join(process.cwd(), "src/components/ui/description-list.tsx"), "utf8")
    expect(fonte).toContain("[&>*>[data-slot=description-term]]:uppercase")
    // Sem hook: o painel de acesso é server component.
    expect(fonte).not.toMatch(/React\.useContext\(|^"use client"/m)
  })
})

describe("columns implica grid (rodada 231)", () => {
  it("sem layout=\"grid\" ele não é mais ignorado calado", () => {
    const fonte = readFileSync(join(process.cwd(), "src/components/ui/description-list.tsx"), "utf8")
    expect(fonte).toContain('if (columns) layout = "grid"')
  })
})
