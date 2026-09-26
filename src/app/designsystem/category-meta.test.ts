import { describe, expect, it } from "vitest"
import { CATEGORY_META } from "./category-meta"
import { CATEGORY_ORDER } from "./registry"

describe("cada camada tem ícone e nome em português (rodada 139)", () => {
  it("cobre as cinco camadas do registry", () => {
    for (const c of CATEGORY_ORDER) {
      expect(CATEGORY_META[c]?.Icon, c).toBeTruthy()
      expect(CATEGORY_META[c]?.label, c).toBeTruthy()
      expect(CATEGORY_META[c]?.tint, c).toMatch(/^var\(--brand-[a-z]+\)$/)
    }
  })
})

it("cada camada tem uma cor diferente", () => {
  const tints = CATEGORY_ORDER.map((c) => CATEGORY_META[c].tint)
  expect(new Set(tints).size).toBe(tints.length)
})
