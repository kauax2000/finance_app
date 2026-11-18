import { describe, expect, it } from "vitest"

import { trocaDoDia } from "./troca-do-dia"

describe("trocaDoDia", () => {
  it("parado enquanto o próximo está a uma altura ou mais", () => {
    expect(trocaDoDia(40, 40)).toEqual({ giro: 0, opacidade: 1 })
    expect(trocaDoDia(120, 40)).toEqual({ giro: 0, opacidade: 1 })
  })

  it("no meio do caminho, meio giro e meia tinta", () => {
    expect(trocaDoDia(20, 40)).toEqual({ giro: 45, opacidade: 0.5 })
  })

  it("coberto, deitado e apagado", () => {
    expect(trocaDoDia(0, 40)).toEqual({ giro: 90, opacidade: 0 })
    expect(trocaDoDia(-5, 40)).toEqual({ giro: 90, opacidade: 0 })
  })

  it("com movimento reduzido, só esmaece", () => {
    expect(trocaDoDia(20, 40, true)).toEqual({ giro: 0, opacidade: 0.5 })
  })

  it("sem altura medida, nada gira", () => {
    expect(trocaDoDia(10, 0)).toEqual({ giro: 0, opacidade: 1 })
  })
})
