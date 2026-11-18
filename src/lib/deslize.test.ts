import { describe, expect, it } from "vitest"
import { assentarDeslize, travarDirecao } from "./deslize"

describe("deslize", () => {
  it("trava a direção depois de 8px", () => {
    expect(travarDirecao(3, 2)).toBeNull()
    expect(travarDirecao(-10, 2)).toBe("x")
    expect(travarDirecao(2, 12)).toBe("y")
  })

  it("abre só depois da metade das ações", () => {
    expect(assentarDeslize(-80, 144)).toBe(-144)
    expect(assentarDeslize(-60, 144)).toBe(0)
    expect(assentarDeslize(20, 144)).toBe(0)
  })
})
