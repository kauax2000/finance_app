import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { Kbd } from "./kbd"
import { KbdGroup } from "./kbd-group"

/** O grupo de teclas, trancado na rodada 195. */
describe("KbdGroup", () => {
  it("a sequência diz “depois”, e as alternativas dizem “ou”", () => {
    const seq = renderToStaticMarkup(h(KbdGroup, { keys: ["g", "h"] }))
    expect(seq).toContain(" depois ")
    expect(seq).not.toContain("›")
    const alt = renderToStaticMarkup(h(KbdGroup, { mode: "either", keys: ["up", "down"] }))
    expect(alt).toContain(" ou ")
    expect(alt).toContain(">/<")
    expect(alt).toContain("↑")
  })

  it("o separador é opcional e só da sequência", () => {
    const html = renderToStaticMarkup(h(KbdGroup, { keys: ["g", "h"], separator: true }))
    expect(html).toContain("›")
  })

  it("um passo com modificadora não sai escrito cru", () => {
    // Ele passava só por `formatKey`, e "mod+k" virava o texto "mod+k". Agora
    // vai para o `Kbd keys`, que espera a plataforma (e não pinta no servidor).
    const html = renderToStaticMarkup(h(KbdGroup, { keys: ["mod+k", "s"] }))
    expect(html).not.toContain("mod+k")
    expect(html).toContain(">S<")
  })

  it("com filhos, o separador entra entre eles também", () => {
    const html = renderToStaticMarkup(
      h(KbdGroup, { mode: "either" }, h(Kbd, { key: 1 }, "Fn"), h(Kbd, { key: 2 }, "F5"))
    )
    expect(html).toContain(" ou ")
  })
})
