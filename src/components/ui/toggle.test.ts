import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { arquivosTsx, lerFonte } from "@/test/fonte"

/** A amostra de cor e o toggle, trancados. */

const TOGGLE = lerFonte("src/components/ui/toggle.tsx")

describe("o toggle", () => {
  it("a amostra escolhida tem contorno de verdade", () => {
    // A base declara `outline-none`, e `outline-2` só mexe na largura: sem o estilo explícito a
    // escolhida saía sem contorno.
    expect(TOGGLE).toContain("data-[state=on]:outline-solid")
    // A superfície é a do `ColorTile` (`tile-vivid` e `tile-soft` publicam a variável), não o
    // hex cru.
    expect(TOGGLE).toContain("p-0 bg-(--tile-surface) text-(--tile-ink)")
    expect(TOGGLE).toContain('vivid: "tile-vivid"')
  })

  it("nenhuma tela pinta amostra à mão num item de grupo", () => {
    // Os dois seletores pintavam o hex cru por `style`, e o ladrilho mostrava
    // outra cor. Quem precisa de amostra usa `variant="swatch"` com `color`.
    const culpados = arquivosTsx(join(process.cwd(), "src")).filter((f) =>
      /<ToggleGroupItem\b[^>]*style=\{\{\s*backgroundColor/.test(lerFonte(f))
    )
    expect(culpados).toEqual([])
  })
})
