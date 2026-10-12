import { describe, expect, it } from "vitest"
import { rememberRecent } from "./use-command-recents"

describe("as últimas escolhas de uma paleta", () => {
  it("põe a escolha na frente, sem repetir, e corta no teto", () => {
    expect(rememberRecent([], "button", 5)).toEqual(["button"])
    expect(rememberRecent(["button", "chart"], "chart", 5)).toEqual(["chart", "button"])
    const cheia = ["a", "b", "c", "d", "e"]
    expect(rememberRecent(cheia, "f", 5)).toEqual(["f", "a", "b", "c", "d"])
  })
})
