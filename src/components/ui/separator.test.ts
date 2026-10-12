import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { arquivosTsx, lerFonte } from "@/test/fonte"

/**
 * A régua (rodada 175): peso por `tone`, desenho por `variant`, o recuo
 * atravessado por `bleed` e o rótulo do meio por `children`.
 */
const SRC = lerFonte("src/components/ui/separator.tsx")
const RAIZ = join(process.cwd(), "src")
const TELAS = arquivosTsx(RAIZ, ["ui", "designsystem"]).map((f) => [f, lerFonte(f)] as const)

describe("Separator", () => {
  it("1. o peso é uma variável, lida pelos três desenhos", () => {
    expect(SRC).toContain("[--separator-color:var(--border)]")
    expect(SRC).toContain("bg-(--separator-color)")
    expect(SRC).toContain("border-dashed border-(--separator-color)")
    expect(SRC).toContain("via-(--separator-color)")
  })

  it("2. bleed lê o recuo que a superfície publica, cartão antes de folha", () => {
    expect(SRC).toContain("var(--separator-bleed,var(--card-px,var(--dialog-px,0px)))")
    // Todo `-` binário num calc arbitrário se escreve com `_` em volta.
    expect(SRC).toContain("w-[calc(100%_+_2*var(--separator-bleed-x))]")
  })

  it("3. nenhuma tela desenha a régua à mão nem pesa por alfa", () => {
    for (const [f, src] of TELAS) {
      expect(src, f).not.toMatch(/role="separator"/)
      for (const m of src.matchAll(/<Separator\b[^>]*className=(?:"([^"]*)"|\{cn\(([^)]*)\)\})/g)) {
        expect(m[1] ?? m[2], f).not.toMatch(/bg-border\/|opacity-|-mx-\d|w-\[calc/)
      }
    }
  })
})
