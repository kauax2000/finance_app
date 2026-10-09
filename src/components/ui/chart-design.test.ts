import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

/**
 * A rodada 243: o Chart no desenho novo da casa — a ponta da barra de 8px, o
 * foco no hover no lugar do retângulo do cursor, as amostras em ponto, a
 * legenda interativa em cápsula com o realce chapado, a lista da rosca no
 * degrau linha e o mapa de calor em `rounded-sm`.
 */

const CODIGO = readFileSync(join(process.cwd(), "src/components/ui/chart.tsx"), "utf8")

describe("Chart, rodada 243", () => {
  it("a barra não tem retângulo de cursor; quem marca é a própria barra", () => {
    expect(CODIGO).not.toContain("cursor={{ fillOpacity: 0.5 }}")
    expect(CODIGO).toContain("const CHART_HOVER_DIM_OPACITY = 0.45")
    expect(CODIGO.match(/cursor=\{false\}/g)?.length).toBeGreaterThanOrEqual(2)
  })

  it("as amostras de cor são pontos, e não quadradinhos", () => {
    expect(CODIGO).not.toContain('className="size-2 shrink-0 rounded-xs"')
    expect(CODIGO.match(/className="size-2 shrink-0 rounded-full"/g)).toHaveLength(3)
    expect(CODIGO).toContain('"size-2 rounded-full": indicator === "dot"')
  })

  it("a legenda interativa é cápsula com o realce chapado", () => {
    expect(CODIGO).not.toContain("hover:bg-accent/60 active:bg-accent/60")
    expect(CODIGO).toMatch(/"rounded-full px-2 py-0\.5 -mx-1/)
  })

  it("a lista da rosca veste o degrau linha, e o mapa de calor o rounded-sm", () => {
    expect(CODIGO).toContain('"flex items-center gap-2 rounded-row px-2 py-1.5"')
    expect(CODIGO).not.toContain("size-(--heat-cell) rounded-xs")
  })
})
