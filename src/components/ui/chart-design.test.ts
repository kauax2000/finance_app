import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

/**
 * O Chart no desenho novo da casa: a ponta da barra de 8px, o foco no hover no lugar do
 * retângulo do cursor, as amostras em ponto, a legenda interativa em cápsula com o realce
 * chapado, a lista da rosca no degrau linha e o mapa de calor em `rounded-sm`.
 */

const CODIGO = lerFonte("src/components/ui/chart.tsx")

describe("Chart", () => {
  it("a barra não tem retângulo de cursor; quem marca é a própria barra", () => {
    expect(CODIGO).not.toContain("cursor={{ fillOpacity: 0.5 }}")
    expect(CODIGO).toContain("const CHART_HOVER_DIM_OPACITY = 0.45")
    expect(CODIGO.match(/cursor=\{false\}/g)?.length).toBeGreaterThanOrEqual(2)
  })

  it("as amostras de cor são pontos, e não quadradinhos", () => {
    expect(CODIGO).not.toContain('className="size-2 shrink-0 rounded-xs"')
    // As três listas (legenda, lista da rosca, anéis) vestem a mesma amostra, a `ChartSwatch`.
    expect(CODIGO).toContain('cn("size-2 shrink-0 rounded-full", className)')
    expect(CODIGO.match(/<ChartSwatch color=/g)).toHaveLength(3)
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

  it("no telefone o toque não abre dica nem acende ponto, em todo gráfico (27/11/2026)", () => {
    // Os sete do Recharts desligam a dica abaixo de 768px.
    expect(CODIGO.match(/tooltip = tooltip && !noTelefone/g)?.length).toBe(7)
    // As peças HTML não abrem a dica no toque.
    expect(CODIGO.match(/!ehCursor\(e\) && !noTelefone\) setAtivo/g)?.length).toBe(2)
    expect(CODIGO).toContain("if (!noTelefone) setLido(dia)")
    // A camada focada pelo toque não desenha o retângulo do navegador.
    expect(CODIGO).toContain(`"[&_g[tabindex='-1']]:outline-none"`)
  })

  it("sem régua, no telefone a área e a linha vão do zero ao maior valor (27/11/2026)", () => {
    expect(CODIGO.match(/domain=\{!yAxis && noTelefone \? \[0, "dataMax"\] : undefined\}/g)?.length).toBe(2)
  })
})
