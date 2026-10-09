import { readFileSync } from "node:fs"
import { join } from "node:path"
import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import {
  StatCard,
  StatCardDelta,
  StatCardLabel,
  StatCardRange,
  StatCardValue,
  statCardDelta,
  statCardGroupVariants,
  statCardVariants,
} from "./stat-card"

/** A rodada 223: o redesenho do `StatCard` e as versões novas. */

const fonte = (caminho: string) => readFileSync(join(process.cwd(), caminho), "utf8")
const CSS = fonte("src/app/globals.css")

describe("as versões do StatCard", () => {
  it("o tom mora no detalhe: a superfície não é tingida", () => {
    for (const tone of ["income", "expense", "warning", "info"] as const) {
      const c = statCardVariants({ tone })
      expect(c, tone).not.toMatch(/\bbg-(income|expense|warning|info)-muted/)
      expect(c, tone).toContain("[--stat-tile:var(--")
    }
    expect(statCardVariants({ tone: "expense" })).toContain("[--stat-figure:var(--expense)]")
    // Os tons de estado deixam o número neutro.
    expect(statCardVariants({ tone: "warning" })).toContain("[--stat-figure:var(--foreground)]")
  })

  it("a escada vai até o herói, e o md sobe um degrau a partir de sm:", () => {
    expect(statCardVariants({ size: "md" })).toContain("sm:[--stat-card-value:var(--text-2xl)]")
    expect(statCardVariants({ size: "lg" })).toContain("[--stat-card-value:var(--text-3xl)]")
  })

  it("a linha compacta põe o ladrilho à esquerda e a variação na ponta", () => {
    const c = statCardVariants({ layout: "horizontal" })
    expect(c).toContain("grid-cols-[auto_minmax(0,1fr)_auto]")
    expect(c).toContain("[&>[data-slot=stat-card-icon]]:row-span-2")
  })

  it("a variação calculada decide sentido, tom, zero e sem base", () => {
    expect(statCardDelta(0, 0)).toBeNull()
    expect(statCardDelta(120, 0)).toEqual({ kind: "sem-base" })
    expect(statCardDelta(500, 500)).toEqual({ kind: "igual" })
    const despesaCaiu = statCardDelta(90, 100, "down")
    expect(despesaCaiu).toMatchObject({ kind: "variou", direction: "down", good: true })
    const receitaCaiu = statCardDelta(90, 100, "up")
    expect(receitaCaiu).toMatchObject({ kind: "variou", direction: "down", good: false })
    // O tom é de estado: "melhorou" não é "entrou dinheiro".
    const html = renderToStaticMarkup(h(StatCardDelta, { current: 90, previous: 100, better: "down" }))
    expect(html).toContain('data-tone="success"')
    expect(html).toContain("Caiu 10% em relação ao período anterior")
  })

  it("o rótulo embrulha o texto para truncar ao lado da variação", () => {
    const html = renderToStaticMarkup(h(StatCardLabel, null, "Resultado"))
    expect(html).toContain('<span class="min-w-0 truncate">Resultado</span>')
  })

  it("o valor escreve o número final já no HTML do servidor", () => {
    const html = renderToStaticMarkup(
      h(StatCard, { tone: "income" }, h(StatCardValue, { value: 8432.15 }))
    )
    expect(html).toContain('data-slot="stat-card-number"')
    expect(html).toMatch(/R\$\s8\.432,15/)
    expect(html).toContain("text-(--stat-figure)")
  })

  it("a faixa diz de-a para o leitor de tela", () => {
    const html = renderToStaticMarkup(h(StatCardRange, { min: 10, max: 20 }))
    expect(html).toContain('<span class="sr-only">de </span>')
    expect(html).toContain('<span class="sr-only"> a </span>')
  })

  it("o grupo: solto ou um painel só, e a cascata", () => {
    expect(statCardGroupVariants({})).toContain("stat-card-reveal")
    expect(statCardGroupVariants({ variant: "joined" })).toContain("gap-px overflow-hidden rounded-surface border border-border bg-border")
    expect(CSS).toMatch(/@utility stat-card-reveal \{\s*& > \[data-slot="stat-card"\] \{\s*animation: menubar-rise 280ms/)
  })

  it("o dashboard não declara mais cartão nem variação à mão", () => {
    const kpi = fonte("src/components/dashboard/dashboard-kpi-cards.tsx")
    expect(kpi).not.toMatch(/function (DeltaBadge|KpiCard)/)
    expect(kpi).toContain("StatCardGroup")
    expect(kpi).toMatch(/better="down"/)
  })

  it("o resumo da categoria e as contas usam as peças", () => {
    const categoria = fonte("src/components/categories/detail/category-detail-summary-section.tsx")
    expect(categoria).not.toContain("function SummaryMetricCard")
    expect(categoria).not.toContain("function buildMomBadgeModel")
    expect(categoria).toContain("StatCardDelta")
    const analise = fonte("src/components/bills/bill-history-analytics.tsx")
    expect(analise).toContain("<StatCardRange")
    expect(analise).not.toContain('className="flex flex-wrap gap-x-2 text-xs sm:text-sm"')
  })
})
