import { describe, expect, it } from "vitest"

import { shouldCloseOnScroll } from "./use-close-on-scroll"

/** Um nó falso: `inside` diz se ele está dentro de uma superfície; `triggers` são os `aria-controls` abertos nele. */
function node({
  inside = false,
  triggers = [] as string[],
  surfaces = [] as string[],
}) {
  const doc = {
    getElementById: (id: string) =>
      surfaces.includes(id) ? { closest: () => ({}) } : { closest: () => null },
  }
  return {
    ownerDocument: doc,
    closest: () => (inside ? {} : null),
    querySelectorAll: () =>
      triggers.map((id) => ({ getAttribute: () => id })),
  } as unknown as EventTarget
}

describe("shouldCloseOnScroll", () => {
  it("sem nó para inspecionar, fecha", () => {
    expect(shouldCloseOnScroll(null)).toBe(true)
  })

  it("rolar a página, com um gatilho de superfície aberto, fecha", () => {
    expect(shouldCloseOnScroll(node({ triggers: ["c1"], surfaces: ["c1"] }))).toBe(true)
  })

  it("o alvo é o próprio document (ownerDocument null), e ainda fecha", () => {
    const doc = {
      ownerDocument: null,
      querySelectorAll: () => [{ getAttribute: () => "c1" }],
      getElementById: () => ({ closest: () => ({}) }),
    } as unknown as EventTarget
    expect(shouldCloseOnScroll(doc)).toBe(true)
  })

  it("rolar a própria lista da superfície não fecha", () => {
    expect(shouldCloseOnScroll(node({ inside: true, triggers: ["c1"], surfaces: ["c1"] }))).toBe(false)
  })

  it("rolar um container que não contém o gatilho não fecha", () => {
    expect(shouldCloseOnScroll(node({ surfaces: ["c1"] }))).toBe(false)
  })

  it("um Collapsible aberto no container não conta como gatilho", () => {
    expect(shouldCloseOnScroll(node({ triggers: ["painel-lateral"] }))).toBe(false)
  })
})
