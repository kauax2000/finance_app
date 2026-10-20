import { describe, expect, it } from "vitest"

import { lerFonte, semComentarios } from "@/test/fonte"
import { quadroDaGotaDoFiltro, quadroDaTroca } from "./header-morph"

describe("quadroDaTroca", () => {
  it("parte do ícone que sai inteiro e fecha no que entra inteiro", () => {
    expect(quadroDaTroca(0, true)).toEqual({
      escala: 1,
      sai: { opacidade: 1, escala: 1, desfoque: 0 },
      entra: { opacidade: 0, escala: 0.7, desfoque: 4 },
    })
    const fim = quadroDaTroca(1, true)
    expect(fim.escala).toBeCloseTo(1, 9)
    expect(fim.sai.opacidade).toBe(0)
    expect(fim.entra).toEqual({ opacidade: 1, escala: 1, desfoque: 0 })
  })

  it("afunda só no meio, e só se pedido", () => {
    expect(quadroDaTroca(0.5, true).escala).toBeCloseTo(0.86, 6)
    expect(quadroDaTroca(0.5, false).escala).toBe(1)
  })

  it("o passe da mola não afunda de novo", () => {
    expect(quadroDaTroca(1.03, true).escala).toBeCloseTo(1, 9)
  })
})

describe("quadroDaGotaDoFiltro", () => {
  it("abre na lupa sozinha e fecha na cápsula inteira", () => {
    const g0 = quadroDaGotaDoFiltro(0)
    expect(g0.lupaDx).toBe(44)
    expect(g0.gota.r).toBeCloseTo(6.6, 6)
    expect(g0.gota.cx).toBe(68)
    expect(g0.cintura).toBe(0)
    expect(g0.icone.opacidade).toBe(0)
    const g1 = quadroDaGotaDoFiltro(1)
    expect(g1.lupaDx).toBe(0)
    expect(g1.gota).toEqual({ cx: 66, r: 22 })
    expect(g1.cintura).toBe(1)
    expect(g1.icone.opacidade).toBe(1)
  })

  it("a gota nunca passa da borda direita da cápsula, e a lupa só anda para a esquerda", () => {
    let antes = Infinity
    for (let i = 0; i <= 105; i++) {
      const q = quadroDaGotaDoFiltro(i / 100)
      expect(q.gota.cx + q.gota.r).toBeLessThanOrEqual(88 + 1e-9)
      expect(q.lupaDx).toBeLessThanOrEqual(antes)
      antes = q.lupaDx
    }
  })
})

describe("suave", () => {
  it("o suave é um só", () => {
    const fonte = semComentarios(lerFonte("src/components/ui/command.tsx"))
    expect(fonte).not.toContain("const suave =")
    expect(fonte).toContain('from "@/lib/header-morph"')
  })
})
