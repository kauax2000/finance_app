import { describe, expect, it } from "vitest"

import { semComentariosPreservando } from "../../scripts/lib/sem-comentarios.mjs"

describe("semComentariosPreservando", () => {
  it("tira os dois tipos e preserva o comprimento", () => {
    const t = "a // x\nb /* y */ c"
    const r = semComentariosPreservando(t)
    expect(r.length).toBe(t.length)
    expect(r).toBe("a     \nb         c")
  })
  it("não toca em strings", () => {
    const t = 'const u = "http://x"; const s = "/* nao */"'
    expect(semComentariosPreservando(t)).toBe(t)
  })
  it("entende template com ${}", () => {
    const t = "`a ${b /* c */} d` // e"
    expect(semComentariosPreservando(t)).toBe("`a ${b        } d`     ")
  })
})
