import { readFileSync } from "node:fs"
import { join } from "node:path"
import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { Calendar } from "./calendar"

/** As versões da rodada 203. */

const fonte = (caminho: string) => readFileSync(join(process.cwd(), caminho), "utf8")
const MARCO = new Date(2026, 2, 1)
const render = (props: Record<string, unknown>) =>
  renderToStaticMarkup(h(Calendar, { month: MARCO, ...props } as never))

describe("Calendar, rodada 203", () => {
  it("os marcadores aparecem até num calendário só de leitura, com legenda e nome", () => {
    const html = render({
      markers: [
        { dates: [new Date(2026, 2, 5)], tone: "info", label: "Assinatura" },
        { dates: [new Date(2026, 2, 5)], tone: "warning", label: "Parcela" },
      ],
    })
    const dia5 = html.match(/<td[^>]*data-day="2026-03-05"[\s\S]*?<\/td>/)![0]
    expect(dia5).toContain('aria-label="5 de março de 2026, Assinatura, Parcela"')
    expect(dia5.match(/class="size-1 rounded-full bg-(info|warning)"/g)).toHaveLength(2)
    expect(html).toMatch(/data-slot="calendar-legend"[\s\S]*Assinatura[\s\S]*Parcela/)
  })

  it("os pontos usam os tokens semânticos, nunca a paleta crua", () => {
    const codigo = fonte("src/components/ui/calendar.tsx")
    const tabela = codigo.slice(codigo.indexOf("const MARCADOR_TOM"), codigo.indexOf("} as const", codigo.indexOf("const MARCADOR_TOM")))
    expect(tabela).not.toMatch(/bg-(red|green|blue|amber|sky|emerald|rose)-\d/)
  })

  it("a agenda põe o conteúdo do dia na célula, e estica", () => {
    const html = render({
      variant: "agenda",
      renderDay: (d: Date) => (d.getDate() === 12 && d.getMonth() === 2 ? "Parcela 3/10" : null),
    })
    expect(html).toMatch(/data-day="2026-03-12"[\s\S]*?data-slot="calendar-day-content"[^>]*>Parcela 3\/10</)
    expect(html).toMatch(/data-slot="calendar"[^>]*class="[^"]*w-full/)
  })

  it("o Hoje e os atalhos", () => {
    expect(render({ mode: "single", showToday: true })).toMatch(/<button[^>]*>.*hoje/)
    const html = render({
      mode: "range",
      presets: [{ label: "Este mês", range: { from: MARCO, to: new Date(2026, 2, 20) } }],
      selected: { from: MARCO, to: new Date(2026, 2, 20) },
    })
    expect(html).toMatch(/data-slot="calendar-presets"[^>]*aria-label="Atalhos de período"/)
    expect(html).toMatch(/aria-pressed="true"[^>]*>Este mês|aria-pressed="true"[\s\S]{0,400}Este mês/)
    // Com atalhos, o intervalo mostra dois meses (o desktop é o padrão sem janela).
    expect(html.match(/class="[^"]*rdp-month /g)?.length ?? html.match(/rdp-month_grid/g)?.length).toBe(2)
  })

  it("o calendário de pagamentos é o Calendar, e não uma grade à mão", () => {
    const tela = fonte("src/components/dashboard/dashboard-payments-calendar.tsx")
    expect(tela).toContain("<Calendar")
    expect(tela).toContain('variant={isMobile ? "default" : "agenda"}')
    expect(tela).not.toMatch(/grid-cols-7|MOBILE_DAY_MODIFIER_DOT|function buildCells|after:bg-/)
  })
})
