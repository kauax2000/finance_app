import { describe, expect, it } from "vitest"

import { mesmoTitulo } from "./use-page-title-dock"

describe("a loja do título que sobe", () => {
  it("compara o voltar e a mídia por identidade, além do texto", () => {
    const voltar = ["‹"]
    const base = { text: "Carro", docked: true, back: voltar, media: null }
    expect(mesmoTitulo(base, { ...base })).toBe(true)
    expect(mesmoTitulo(base, { ...base, back: ["‹"] })).toBe(false)
    expect(mesmoTitulo(base, { ...base, media: "x" })).toBe(false)
    expect(mesmoTitulo(base, { ...base, docked: false })).toBe(false)
    expect(mesmoTitulo(base, null)).toBe(false)
    expect(mesmoTitulo(null, null)).toBe(true)
  })
})
