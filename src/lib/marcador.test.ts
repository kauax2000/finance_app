import { describe, expect, it } from "vitest"

import { caixaDoAtivo } from "./marcador"

describe("caixaDoAtivo", () => {
  it("aplica o insete nos quatro lados", () => {
    expect(caixaDoAtivo({ left: 10, top: 4, width: 80, height: 32 }, 2)).toEqual({ x: 12, y: 6, w: 76, h: 28 })
  })
  it("sem insete devolve a caixa", () => {
    expect(caixaDoAtivo({ left: 0, top: 0, width: 50, height: 20 }, 0)).toEqual({ x: 0, y: 0, w: 50, h: 20 })
  })
})
