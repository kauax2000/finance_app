import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

import { DateTile, DateTileSkeleton } from "./date-tile"

const FONTE = semComentarios(lerFonte("src/components/ui/date-tile.tsx"))

describe("DateTile", () => {
  it("diz a data por extenso no nome, e o desenho fica aria-hidden", () => {
    const html = renderToStaticMarkup(h(DateTile, { date: "2026-12-10", caption: "vence" }))
    expect(html).toContain('data-slot="date-tile"')
    expect(html).toContain('dateTime="2026-12-10"')
    expect(html).toContain('aria-label="vence em 10 de dezembro"')
    expect(html).toMatch(/aria-hidden="true"[^>]*>dez</)
    expect(html).toMatch(/>10</)
  })

  it("sem legenda o nome é só a data; aceita Date e ignora a hora da string", () => {
    expect(renderToStaticMarkup(h(DateTile, { date: new Date(2026, 0, 3) }))).toContain('aria-label="3 de janeiro"')
    expect(renderToStaticMarkup(h(DateTile, { date: "2026-03-09T12:00:00Z" }))).toContain('aria-label="9 de março"')
  })

  it("data inválida não desenha nada", () => {
    expect(renderToStaticMarkup(h(DateTile, { date: "" }))).toBe("")
    expect(renderToStaticMarkup(h(DateTile, { date: new Date(Number.NaN) }))).toBe("")
  })

  it("o vencido pinta só o mês, por token", () => {
    const html = renderToStaticMarkup(h(DateTile, { date: "2026-12-10", tone: "overdue" }))
    expect(html).toContain('data-tone="overdue"')
    expect(html).toContain("text-destructive")
    expect(FONTE).not.toMatch(/#[0-9a-f]{3,6}\b|rgb\(|text-red-|bg-white/i)
  })

  it("veste o degrau da escala de raio e a escada md/lg por extenso", () => {
    expect(FONTE).toContain("rounded-row-lg")
    expect(FONTE).not.toMatch(/rounded-\[|rounded-(xl|2xl)/)
    expect(FONTE).toContain('md: "w-14 py-1.5"')
    expect(FONTE).toContain('lg: "w-16 py-2"')
  })

  it("o esqueleto anuncia e sai do grupo com group={false}", () => {
    expect(renderToStaticMarkup(h(DateTileSkeleton))).toContain('data-slot="skeleton-group"')
    expect(renderToStaticMarkup(h(DateTileSkeleton, { group: false }))).not.toContain("skeleton-group")
  })
})
