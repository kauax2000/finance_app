import { describe, expect, it } from "vitest"

import { proximoEscondido } from "./hide-on-scroll"

const base = { focada: false }

describe("proximoEscondido", () => {
  it("some ao descer mais de 4px", () => {
    expect(proximoEscondido(false, { ...base, y: 200, antes: 195 })).toBe(true)
  })
  it("não some ao descer até 4px", () => {
    expect(proximoEscondido(false, { ...base, y: 200, antes: 196 })).toBe(false)
  })
  it("volta ao subir mais de 4px", () => {
    expect(proximoEscondido(true, { ...base, y: 190, antes: 200 })).toBe(false)
  })
  it("mantém o estado num movimento pequeno", () => {
    expect(proximoEscondido(true, { ...base, y: 199, antes: 200 })).toBe(true)
  })
  it("volta sempre no topo", () => {
    expect(proximoEscondido(true, { ...base, y: 0, antes: 40 })).toBe(false)
  })
  it("não some antes de passar mostrarAte", () => {
    expect(proximoEscondido(false, { ...base, y: 40, antes: 30, mostrarAte: 48 })).toBe(false)
  })
  it("nunca some com o foco dentro", () => {
    expect(proximoEscondido(false, { y: 300, antes: 200, focada: true })).toBe(false)
  })
})
