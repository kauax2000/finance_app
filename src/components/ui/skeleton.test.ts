import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

/**
 * O `Skeleton` (rodada 176). A linha de texto depende de uma `@utility` do
 * `globals.css`, e ela já sumiu uma vez sem erro nenhum: a classe continuou no
 * elemento, a regra deixou de existir, e todo `shape="text"` ficou com altura
 * zero — buracos no lugar das linhas.
 */
const CSS = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8")
const SRC = readFileSync(join(process.cwd(), "src/components/ui/skeleton.tsx"), "utf8")

describe("Skeleton", () => {
  it("1. a linha de texto tem a utility que lhe dá altura", () => {
    expect(SRC).toContain('base: "skeleton-text rounded-sm"')
    const i = CSS.indexOf("@utility skeleton-text {")
    expect(i, "a @utility skeleton-text sumiu do globals.css").toBeGreaterThan(-1)
    const bloco = CSS.slice(i, CSS.indexOf("}", i))
    expect(bloco).toContain("height: 0.8em")
    expect(bloco).toContain("margin-block: calc((1lh - 0.8em) / 2)")
  })

  it("2. um movimento só: o pulso", () => {
    expect(SRC).toContain('"animate-pulse bg-skeleton"')
    expect(CSS).not.toMatch(/skeleton-shimmer|--skeleton-highlight/)
  })
})
