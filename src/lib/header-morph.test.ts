import { describe, expect, it } from "vitest"

import { lerFonte, semComentarios } from "@/test/fonte"
import { quadroDaTroca, quadroDoVidroQueEstica } from "./header-morph"

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

describe("quadroDoVidroQueEstica", () => {
  it("abre na lupa sozinha e fecha na cápsula inteira", () => {
    const g0 = quadroDoVidroQueEstica(0)
    expect(g0).toMatchObject({ lupaDx: 44, costura: 88, esquerda: 44, largura: 44, esticaFiltro: 1 })
    expect(g0.icone.opacidade).toBe(0)
    const g1 = quadroDoVidroQueEstica(1)
    expect(g1).toMatchObject({ lupaDx: 0, costura: 44, esquerda: 0, largura: 88, esticaFiltro: 1 })
    expect(g1.icone).toEqual({ opacidade: 1, escala: 1, desfoque: 0 })
  })

  it("o balanço aparece nos dois sentidos, sem abrir a costura", () => {
    // Além da cápsula: a borda passa da ponta, e o filtro estica até a lupa.
    const alem = quadroDoVidroQueEstica(1.127)
    expect(alem.esquerda).toBeCloseTo(-5.588, 3)
    expect(alem.largura).toBeCloseTo(88 + 5.588, 3)
    expect(alem.costura).toBe(44)
    expect(88 - 44 * alem.esticaFiltro).toBeCloseTo(alem.lupaDx + 44, 9)
    // Aquém da lupa: o círculo passa para a direita, inteiro, e o filtro some.
    const aquem = quadroDoVidroQueEstica(-0.127)
    expect(aquem.esquerda).toBeCloseTo(49.588, 3)
    expect(aquem.largura).toBeCloseTo(44, 9)
    expect(aquem.costura).toBeGreaterThan(88)
    expect(aquem.icone.opacidade).toBe(0)
  })

  it("em todo quadro cada ícone fica inteiro no seu vidro, e a borda só anda para a esquerda", () => {
    let antes = Infinity
    for (let i = -15; i <= 115; i++) {
      const q = quadroDoVidroQueEstica(i / 100)
      // A lupa (16 de largura, centrada em lupaDx + 22) cabe à esquerda da costura.
      expect(q.costura).toBeGreaterThanOrEqual(q.lupaDx + 30 - 1e-9)
      // A costura começa no filtro e não passa do fim da lupa (fora do balanço além da cápsula).
      expect(q.costura).toBeGreaterThanOrEqual(44)
      if (q.lupaDx >= 0) expect(q.costura).toBeLessThanOrEqual(q.lupaDx + 44)
      // O calendário aceso (centrado em 66) cabe à direita dela.
      if (q.icone.opacidade > 0.02) expect(q.costura).toBeLessThanOrEqual(58)
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
