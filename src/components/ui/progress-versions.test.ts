import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { readFileSync } from "node:fs"
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

describe("Progress highlight", () => {
  it("highlight: a fatia acesa, opcional e no trilho", () => {
    const fonte = readFileSync("src/components/ui/progress.tsx", "utf8")
    expect(fonte).toMatch(/highlight\?: \{ from: number; to: number \}/)
    expect(fonte).toContain('data-slot="progress-highlight"')
    expect(fonte).toContain("--progress-highlight")
    expect(fonte.indexOf('data-slot="progress-highlight"')).toBeLessThan(
      fonte.indexOf('data-slot="progress-marker"')
    )
    expect(readFileSync("src/app/designsystem/docs/progress.tsx", "utf8")).toContain("highlight")
  })

  it("posiciona e limita a fatia ao trilho", () => {
    const html = renderToStaticMarkup(
      createElement(Progress, { value: 920, max: 1000, highlight: { from: 700, to: 1200 } })
    )
    expect(html).toContain('data-slot="progress-highlight"')
    expect(html).toMatch(/left:\s*70%/)
    expect(html).toMatch(/width:\s*30%/)
  })

  it("não desenha vazia, nas casas nem na marca", () => {
    const h = { from: 5, to: 5 }
    expect(renderToStaticMarkup(createElement(Progress, { value: 10, highlight: h }))).not.toContain("progress-highlight")
    const ok = { from: 5, to: 9 }
    expect(renderToStaticMarkup(createElement(Progress, { value: 10, segments: 5, highlight: ok }))).not.toContain("progress-highlight")
    expect(renderToStaticMarkup(createElement(Progress, { value: 10, variant: "brand", highlight: ok }))).not.toContain("progress-highlight")
  })
})
