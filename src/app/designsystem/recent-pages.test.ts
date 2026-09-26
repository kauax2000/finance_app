import { describe, expect, it } from "vitest"
import { RECENTES_MAX, lembrar } from "./recent-pages"

describe("as últimas páginas abertas pela paleta (rodada 139)", () => {
  it("põe a página na frente, sem repetir, e corta no teto", () => {
    expect(lembrar([], "button")).toEqual(["button"])
    expect(lembrar(["button", "chart"], "chart")).toEqual(["chart", "button"])
    const cheia = ["a", "b", "c", "d", "e"]
    expect(lembrar(cheia, "f")).toEqual(["f", "a", "b", "c", "d"])
    expect(lembrar(cheia, "f")).toHaveLength(RECENTES_MAX)
  })
})
