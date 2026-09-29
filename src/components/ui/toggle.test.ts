import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

/** A amostra de cor e o toggle, trancados na rodada 183. */

const TOGGLE = readFileSync(join(process.cwd(), "src/components/ui/toggle.tsx"), "utf8")

const arquivos = (dir: string): string[] =>
  readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome)
    return statSync(caminho).isDirectory()
      ? arquivos(caminho)
      : /\.tsx$/.test(nome)
        ? [caminho]
        : []
  })

describe("o toggle", () => {
  it("a amostra escolhida tem contorno de verdade", () => {
    // A base declara `outline-none`, e `outline-2` só mexe na largura: sem o
    // estilo explícito a escolhida saía sem contorno (medido, `none`).
    expect(TOGGLE).toContain("data-[state=on]:outline-solid")
    // E a superfície é a do `ColorTile`, não o hex cru.
    expect(TOGGLE).toContain("bg-[oklch(from_var(--tile-color)_0.86_min(c,_0.12)_h)]")
  })

  it("nenhuma tela pinta amostra à mão num item de grupo", () => {
    // Os dois seletores pintavam o hex cru por `style`, e o ladrilho mostrava
    // outra cor. Quem precisa de amostra usa `variant="swatch"` com `color`.
    const culpados = arquivos(join(process.cwd(), "src")).filter((f) =>
      /<ToggleGroupItem\b[^>]*style=\{\{\s*backgroundColor/s.test(readFileSync(f, "utf8"))
    )
    expect(culpados).toEqual([])
  })
})
