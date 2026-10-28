import { describe, expect, it } from "vitest"

import {
  ABRE_EM,
  ABSORVER,
  caixa,
  cascata,
  CASCATA_MS,
  COLADO_EM,
  insetDe,
  PECA_MIN_MS,
  quadroDoAbrir,
  quadroDoColar,
  quadroDoMais,
  recorteDoAbsorver,
  VOLTA_DA_PILULA,
} from "./lancamento-gesto"
import { TINTA_DO_VOO } from "./header-morph"

// O telefone do protótipo: o campo e a câmera acima do teclado; o painel com 16 de calha.
const campo = caixa(16, 408, 295, 48)
const camera = caixa(319, 408, 48, 48)
const C = campo
const F = caixa(16, 120, 343, 606)
const raio = { de: 24, ate: 28 }

describe("quadroDoColar", () => {
  it("em p 1 as duas pílulas estão no lugar, separadas, sem união", () => {
    const { f, uniao } = quadroDoColar(campo, camera, 1, 2)
    expect(f.vao).toBe(8)
    expect(f.dx).toBe(0)
    expect(f.xdx + 0).toBe(0)
    expect(f.icone).toBe(1)
    expect(uniao).toBeNull()
  })

  it("em p 0 a câmera está colada no campo, o ícone saiu e a união é um vidro só", () => {
    const { f, uniao } = quadroDoColar(campo, camera, 0, 2)
    expect(f.vao).toBe(0)
    expect(camera.left + f.xdx).toBe(campo.right)
    expect(f.icone).toBe(0)
    expect(f.tinta).toBe(1)
    expect(uniao).not.toBeNull()
    expect(uniao!.left).toBe(campo.left)
    expect(uniao!.width).toBe(campo.width + camera.width)
  })

  it("a união existe só com o vão zero", () => {
    for (let p = 0; p <= 1; p += 0.01) {
      const { f, uniao } = quadroDoColar(campo, camera, p, 2)
      expect(uniao !== null).toBe(f.vao === 0)
    }
  })

  it("o absorver começa quando o colar cai a 0,02 (~248ms da volta de 320)", () => {
    expect(COLADO_EM).toBe(0.02)
    expect(VOLTA_DA_PILULA).toEqual({ duration: 0.32, ease: [0.2, 0, 0, 1] })
    expect(ABSORVER).toEqual({ duration: 0.26, ease: [0.4, 0, 0.2, 1] })
    expect(ABRE_EM).toBe(0.75)
  })
})

describe("recorteDoAbsorver", () => {
  it("em 0 a cápsula vai até a ponta da câmera; em 1 é só o campo; sempre redonda", () => {
    expect(recorteDoAbsorver(0, 48, 24)).toBe("inset(0px 0px 0px 0px round 24px)")
    expect(recorteDoAbsorver(1, 48, 24)).toBe("inset(0px 48px 0px 0px round 24px)")
  })
})

describe("quadroDoAbrir", () => {
  it("em 0 o vidro é o campo, com o raio dele, a tinta cheia e a frase inteira", () => {
    const f = quadroDoAbrir(0, 0, C, F, raio)
    expect(f.vidro).toEqual({ topo: C.top, direita: C.right, base: C.bottom, esquerda: C.left })
    expect(f.raio).toBe(24)
    expect(f.tinta).toBe(TINTA_DO_VOO)
    expect(f.frase).toEqual({ opacidade: 1, desfoque: 0, dy: 0 })
  })

  it("em 1 o vidro é o painel, no raio do modal, sem tinta e sem frase", () => {
    const f = quadroDoAbrir(1, 1, C, F, raio)
    expect(f.vidro).toEqual({ topo: F.top, direita: F.right, base: F.bottom, esquerda: F.left })
    expect(f.raio).toBe(28)
    expect(f.tinta).toBe(0)
    expect(f.conteudo).toEqual({ dx: 0, dy: 0 })
    expect(f.frase.opacidade).toBe(0)
    expect(f.frase.desfoque).toBe(8)
  })

  it("o conteúdo anda com o vidro: o dy é o quanto a borda de cima ainda falta, também no passe", () => {
    for (const [py, px] of [
      [0, 0],
      [0.3, 0.1],
      [0.7, 0.5],
      [1.04, 0.98],
      [1, 1],
    ]) {
      const f = quadroDoAbrir(py, px, C, F, raio)
      expect(f.conteudo.dy).toBeCloseTo(f.vidro.topo - F.top, 9)
      expect(f.conteudo.dx).toBeCloseTo((f.vidro.esquerda + f.vidro.direita) / 2 - (F.left + F.right) / 2, 9)
    }
  })

  it("a frase sobe 35% do que a borda de cima subiu, e sai até 28% da altura", () => {
    const f = quadroDoAbrir(0.5, 0.5, C, F, raio)
    expect(f.frase.dy).toBeCloseTo((f.vidro.topo - C.top) * 0.35, 9)
    expect(quadroDoAbrir(0.28, 0, C, F, raio).frase.opacidade).toBe(0)
  })

  it("no desktop a borda de cima fica presa e o painel cresce para baixo", () => {
    const Cd = caixa(256, 120, 392, 48)
    const Fd = caixa(256, 120, 448, 520)
    for (const py of [0, 0.4, 1.03, 1]) expect(quadroDoAbrir(py, 0.5, Cd, Fd, raio).conteudo.dy).toBe(0)
  })

  it("o recorte é o vidro dentro da caixa", () => {
    expect(insetDe({ topo: 130, direita: 300, base: 500, esquerda: 20 }, F, 26)).toBe(
      "inset(10px 59px 226px 4px round 26px)"
    )
  })
})

describe("cascata", () => {
  it("começa quando a altura passa de 12% (~33ms) e a última peça termina quando as duas molas assentam", () => {
    const c = cascata(7)
    expect(c.comeca).toBeGreaterThan(25)
    expect(c.comeca).toBeLessThan(45)
    expect(c.assenta).toBeGreaterThan(400)
    expect(c.assenta).toBeLessThan(520)
    expect(c.atraso(0)).toBe(c.comeca)
    expect(c.atraso(6) - c.atraso(5)).toBe(CASCATA_MS)
    expect(c.atraso(6) + c.duracao).toBe(c.assenta)
  })

  it("cada peça dura no mínimo 160ms", () => {
    expect(cascata(40).duracao).toBe(PECA_MIN_MS)
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
