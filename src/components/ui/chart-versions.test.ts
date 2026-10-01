import { readFileSync } from "node:fs"
import { join } from "node:path"
import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ChartBarList, waterfallSteps } from "./chart"

/** A rodada 206: as versões novas do `Chart`. */

const fonte = (caminho: string) => readFileSync(join(process.cwd(), caminho), "utf8")
const CODIGO = fonte("src/components/ui/chart.tsx")

describe("as versões do Chart", () => {
  it("a cascata flutua cada degrau do acumulado, e o total sem valor fecha nele", () => {
    const d = waterfallSteps([
      { name: "Início", value: 1000, total: true },
      { name: "Salário", value: 500 },
      { name: "Aluguel", value: -2000 },
      { name: "Final", total: true },
    ])
    expect(d.map((x) => x.faixa)).toEqual([
      [0, 1000],
      [1000, 1500],
      [-500, 1500],
      [-500, 0],
    ])
    expect(d.map((x) => x.tipo)).toEqual(["total", "up", "down", "total"])
    expect(d[3].value).toBe(-500)
  })

  it("o ranking é texto: figura com nome, lista de verdade e porcentagens que somam 100", () => {
    const html = renderToStaticMarkup(
      h(ChartBarList, {
        data: [
          { nome: "Aluguel", valor: 2 },
          { nome: "Mercado", valor: 1 },
        ],
        nameKey: "nome",
        dataKey: "valor",
        label: "Maiores gastos",
        share: true,
      })
    )
    expect(html).toMatch(/role="figure"[^>]*aria-label="Maiores gastos"|aria-label="Maiores gastos"[^>]*role="figure"/)
    expect(html).not.toContain('role="img"')
    expect(html).toContain("<ul")
    expect(html).toContain("67%")
    expect(html).toContain("33%")
    // O nome quebra, não corta.
    expect(html).toContain("break-words")
  })

  it("barras com sinal: income acima, expense abaixo, e o zero no domínio pela linha", () => {
    expect(CODIGO).toContain('? "var(--color-chart-expense)"')
    expect(CODIGO).toContain(': "var(--color-chart-income)"')
    expect(CODIGO).toContain('<ChartReferenceLine y={0} tone="zero" ifOverflow="extendDomain" />')
  })

  it("a seleção de barra apaga as outras e é alcançável pelo teclado", () => {
    expect(CODIGO).toContain("CHART_DIM_OPACITY = 0.35")
    expect(CODIGO).toContain("useActiveTooltipLabel()")
    expect(CODIGO).toMatch(/e\.key !== "Enter" && e\.key !== " "/)
    // Quem recebe ação não é `img`.
    expect(CODIGO).toContain('role={label ? (interactive ? "group" : "img") : undefined}')
    expect(CODIGO).toContain("interactive={!!onSelect}")
  })

  it("a rosca ativa vem do tooltip (ponteiro e teclado), da lista e de quem chama", () => {
    expect(CODIGO).toContain("useActiveTooltipDataPoints()")
    expect(CODIGO).toMatch(/active\?: string \| null/)
    expect(CODIGO).toMatch(/onActiveChange\?: \(nome: string \| null\) => void/)
    // O tooltip da rosca diz a fatia em % do total.
    expect(CODIGO).toContain("share={total}")
  })

  it("o medidor com faixas pinta o estado no usado e o trilho no resto", () => {
    expect(CODIGO).toMatch(/medidor && bands\s*\?\s*i === 0\s*\?\s*chartRadialColor\(pctUsado, bands/)
    expect(CODIGO).toContain(': "var(--color-muted)"')
  })

  it("a série tracejada é traço no gráfico e na legenda, e sem volume na área", () => {
    expect(CODIGO).toContain('const CHART_DASH = "5 4"')
    expect(CODIGO).toContain("fillOpacity={tracejada(config, key) ? 0")
    expect(CODIGO).toMatch(/itemConfig\?\.dashed \? \(/)
  })

  it("o ponto da linha tem o miolo da série — sem fill, o Recharts abria um buraco no traço", () => {
    expect(CODIGO).toContain('stroke: "var(--chart-surface)", fill: serieColor(key, i, config)')
  })

  it("nenhuma tela do app monta tooltip de gráfico à mão nem esquece o formato de dinheiro", () => {
    for (const arquivo of [
      "src/components/bills/bill-history-analytics.tsx",
      "src/components/credit-cards/credit-cards-history-chart.tsx",
      "src/components/credit-cards/credit-card-invoice-category-spend-section.tsx",
      "src/components/dashboard/dashboard-expense-categories.tsx",
    ]) {
      const codigo = fonte(arquivo)
      expect(codigo, arquivo).not.toContain("ResponsiveContainer")
      expect(codigo, arquivo).not.toMatch(/function \w*Tooltip\(/)
      expect(codigo, arquivo).not.toMatch(/<ChartTooltipContent\s*\/>/)
    }
  })
})
