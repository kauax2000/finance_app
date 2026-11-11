import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { Progress } from "./progress"

describe("Progress marker", () => {
  it("desenha o traço do ritmo na posição", () => {
    const html = renderToStaticMarkup(
      createElement(Progress, { value: 82, bands: [85, 100], marker: 33 })
    )
    expect(html).toContain('data-slot="progress-marker"')
    expect(html).toMatch(/left:\s*33%/)
  })

  it("fora de 0–100 não desenha", () => {
    for (const marker of [140, -1, Number.NaN]) {
      expect(renderToStaticMarkup(createElement(Progress, { value: 10, marker }))).not.toContain(
        "progress-marker"
      )
    }
  })
})
