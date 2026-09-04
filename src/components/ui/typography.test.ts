import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

/**
 * Os nove átomos de texto são a base que o resto do sistema veste —
 * `PageHeaderTitle` sobre `H1`, `PageSectionTitle` sobre `H2`, dezessete
 * arquivos ao todo. Duas coisas têm de continuar verdadeiras para isso valer.
 */
const CODIGO = readFileSync(new URL("./typography.tsx", import.meta.url), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "")

describe("typography: a base que o sistema veste", () => {
  it("os nove aceitam asChild — é assim que o template troca o nível sem perder o estilo", () => {
    expect(CODIGO.match(/asChild = false/g)?.length).toBe(9)
    expect(CODIGO.match(/asChild \? Slot\.Root :/g)?.length).toBe(9)
  })

  it("H2 não traz régua — PageSectionTitle é um h2 sem régua, e vesti-lo não pode exigir desfazer", () => {
    expect(CODIGO).not.toContain("border-b")
    expect(CODIGO).not.toContain("first:mt-0")
  })
})
