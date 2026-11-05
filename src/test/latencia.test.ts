import { describe, expect, it } from "vitest"

import { resumo } from "../../scripts/lib/latencia.mjs"

describe("resumo", () => {
  it("calcula mediana, p95, min e max", () => {
    expect(resumo([100, 200, 300])).toEqual({ n: 3, falhas: 0, mediana: 200, p95: 300, min: 100, max: 300 })
  })
  it("conta falhas e ignora null nas contas", () => {
    const r = resumo([100, null, 300, 200])
    expect(r).toMatchObject({ n: 4, falhas: 1, mediana: 200 })
  })
  it("só falhas dá tudo null", () => {
    expect(resumo([null])).toEqual({ n: 1, falhas: 1, mediana: null, p95: null, min: null, max: null })
  })
  it("p95 por índice ceil(0.95k)-1", () => {
    const a = Array.from({ length: 20 }, (_, i) => i + 1)
    expect(resumo(a).p95).toBe(19)
  })
})
