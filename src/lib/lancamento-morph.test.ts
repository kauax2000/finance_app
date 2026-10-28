import { describe, expect, it } from "vitest"

import { quadroDaFusao, quadroDaPlaca, quadroDoMais, RAIO_DA_PLACA, VAO_DAS_PILULAS } from "./lancamento-morph"

const W = 400
const H = 600
const h = 44
const placa = { esquerda: 0, topo: 0, direita: W, base: H }
const pilulaEmBaixo = { esquerda: 0, topo: H - h, direita: W, base: H }
const pilulaEmCima = { esquerda: 0, topo: 0, direita: W, base: h }

describe("quadroDaPlaca", () => {
  it("em 0 é a pílula, com o raio de cápsula", () => {
    for (const [de, telefone] of [
      [pilulaEmBaixo, true],
      [pilulaEmCima, false],
    ] as const) {
      const f = quadroDaPlaca(0, de, placa, telefone)
      expect(f.recorte).toEqual({ esquerda: 0, topo: de.topo, direita: 0, base: H - de.base })
      expect(f.raio).toBe(h / 2)
      expect(f.ty).toBe(0)
      expect(f.cabeca).toBe(de.topo)
    }
  })

  it("em 1 é a placa inteira, no raio da superfície", () => {
    for (const [de, telefone] of [
      [pilulaEmBaixo, true],
      [pilulaEmCima, false],
    ] as const) {
      const f = quadroDaPlaca(1, de, placa, telefone)
      for (const lado of Object.values(f.recorte)) expect(lado).toBeCloseTo(0, 9)
      expect(f.raio).toBe(RAIO_DA_PLACA)
      expect(f.cabeca).toBeCloseTo(0, 9)
      expect(f.tinta).toBe(0)
    }
  })

  it("no telefone, no meio da subida, afina até 4% e fica mais alto que a reta", () => {
    const f = quadroDaPlaca(0.5, pilulaEmBaixo, placa, true)
    const largura = W - f.recorte.esquerda - f.recorte.direita
    expect(largura).toBeLessThan(W)
    expect(largura).toBeGreaterThanOrEqual(W * 0.96 - 1e-9)
    const altura = H - f.recorte.topo - f.recorte.base
    expect(altura).toBeGreaterThan(h + (H - h) * 0.5)
  })

  it("no telefone a borda de baixo fica presa (acima do teclado), e o passe da mola sobe o vidro", () => {
    for (const g of [0, 0.3, 0.7, 1]) expect(quadroDaPlaca(g, pilulaEmBaixo, placa, true).recorte.base).toBe(0)
    expect(quadroDaPlaca(1.01, pilulaEmBaixo, placa, true).ty).toBeLessThan(0)
  })

  it("no desktop a borda de cima fica presa, a largura nunca afina e o passe não aparece", () => {
    for (const g of [0, 0.2, 0.5, 0.8, 1, 1.05]) {
      const f = quadroDaPlaca(g, pilulaEmCima, placa, false)
      expect(f.recorte.topo).toBe(0)
      expect(f.recorte.esquerda).toBe(0)
      expect(f.recorte.direita).toBe(0)
      expect(f.ty).toBe(0)
    }
    expect(quadroDaPlaca(1.05, pilulaEmCima, placa, false).recorte.base).toBe(0)
  })
})

describe("quadroDaFusao", () => {
  it("separadas em 0; em 1 a câmera encostou, a costura é reta e o ícone saiu", () => {
    const de = quadroDaFusao(0, { largura: 44, raio: 22 })
    expect(de).toMatchObject({ escalaX: 1, emenda: 22, fundida: false })
    expect(de.icone.opacidade).toBe(1)
    const fim = quadroDaFusao(1, { largura: 44, raio: 22 })
    expect(fim.escalaX).toBeCloseTo(1 + VAO_DAS_PILULAS / 44, 9)
    expect(fim.emenda).toBe(0)
    expect(fim.icone.opacidade).toBe(0)
    expect(fim.fundida).toBe(true)
  })
})

describe("quadroDoMais", () => {
  const m = {
    mais: { left: 300, top: 700, right: 364, bottom: 764 },
    campo: { left: 16, top: 400, right: 324, bottom: 444 },
    camera: { left: 332, top: 400, right: 376, bottom: 444 },
  }

  it("em 0 as duas gotas estão no centro do +, e o campo é só o círculo da ponta", () => {
    const f = quadroDoMais(0, m)
    expect(324 - 22 + f.campo.dx).toBe(332)
    expect(422 + f.campo.dy).toBe(732)
    expect(f.campo.esquerda).toBe(308 - 44)
    expect(354 + f.camera.dx).toBe(332)
    expect(422 + f.camera.dy).toBe(732)
    expect(f.camera.opacidade).toBe(0)
  })

  it("em 1 a linha está pousada, inteira", () => {
    const f = quadroDoMais(1, m)
    expect(f.campo).toEqual({ dx: 0, dy: 0, esquerda: 0, conteudo: 1 })
    expect(f.camera.dx).toBeCloseTo(0, 9)
    expect(f.camera.dy).toBeCloseTo(0, 9)
    expect(f.camera.escala).toBe(1)
  })
})
