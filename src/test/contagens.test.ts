import { describe, expect, it } from "vitest"

import { compararContagens } from "../../scripts/lib/contagens.mjs"

describe("compararContagens", () => {
  it("acusa a contagem diferente", () => {
    expect(compararContagens({ a: 1, b: 2 }, { a: 1, b: 3 })).toEqual(["b: antigo=2 novo=3"])
  })
  it("acusa a tabela que falta de um lado, em ordem alfabética", () => {
    expect(compararContagens({ c: 4, a: 1 }, { a: 1, b: 0 })).toEqual([
      "b: antigo=- novo=0",
      "c: antigo=4 novo=-",
    ])
  })
  it("iguais não dão diferença", () => {
    expect(compararContagens({ a: 1 }, { a: 1 })).toEqual([])
  })
})
