import { describe, expect, it } from "vitest"
import { assentarDeslize, larguraDaFaixa, progressoDoDeslize, travarDirecao } from "./deslize"

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

  it("mede a faixa: círculos de 44 com 8px em volta", () => {
    expect(larguraDaFaixa(2)).toBe(112)
    expect(larguraDaFaixa(3)).toBe(164)
  })

  it("o progresso vai de 0 a 1 e não passa dos extremos", () => {
    expect(progressoDoDeslize(0, 112)).toBe(0)
    expect(progressoDoDeslize(-56, 112)).toBe(0.5)
    expect(progressoDoDeslize(-200, 112)).toBe(1)
    expect(progressoDoDeslize(10, 112)).toBe(0)
  })
})
