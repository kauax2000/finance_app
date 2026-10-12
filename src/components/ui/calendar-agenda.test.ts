import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

import { Calendar, CalendarEvent, CalendarEvents, CalendarSkeleton } from "./calendar"

/**
 * A agenda da rodada 242: a grade de fios, as peças do dia (`CalendarEvent`,
 * `CalendarEvents`), a lista quando estreita, o fim de semana, o dia escolhido
 * e o esqueleto — e o dashboard sem as fichas escritas à mão.
 */

const MARCO = new Date(2026, 2, 1)
const DIA_12 = new Date(2026, 2, 12)

const eventos = (n: number) =>
  h(
    CalendarEvents,
    { max: 2 } as never,
    Array.from({ length: n }, (_, i) =>
      h(CalendarEvent, { key: i, tone: "info", amount: -10 * (i + 1), onSelect: () => {} } as never, `Evento ${i + 1}`)
    )
  )

const agenda = (props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(
    h(Calendar, {
      month: MARCO,
      variant: "agenda",
      weekStartsOn: 1,
      renderDay: (d: Date) => (d.getMonth() === 2 && d.getDate() === 12 ? eventos(4) : null),
      ...props,
    } as never)
  )

describe("Calendar agenda, rodada 242", () => {
  it("é uma moldura só, com as células separadas por fios e sem caixa", () => {
    const html = agenda()
    expect(html).toMatch(/<table[^>]*class="[^"]*rounded-surface[^"]*border-border[^"]*bg-card/)
    const celula = html.match(/<td[^>]*data-day="2026-03-12"[^>]*>/)![0]
    expect(celula).toContain("border-e")
    expect(celula).toContain("border-b")
    expect(celula).toContain("rounded-none")
    // A caixinha de antes não volta.
    const codigo = lerFonte("src/components/ui/calendar.tsx")
    const celulaAgenda = codigo.slice(codigo.indexOf("const AGENDA_CELULA"), codigo.indexOf("const AGENDA_SELECIONADO"))
    expect(celulaAgenda).not.toMatch(/rounded-lg|border-border\/60 bg-card/)
  })

  it("a raiz é o contêiner da virada, e a grade some abaixo de 40rem", () => {
    const html = agenda()
    expect(html).toMatch(/data-slot="calendar"[^>]*class="[^"]*@container\/calendar/)
    expect(html).toMatch(/<table[^>]*@max-\[40rem\]\/calendar:hidden/)
    expect(html).toMatch(/data-slot="calendar-agenda-list"[^>]*class="[^"]*hidden[^"]*@max-\[40rem\]\/calendar:flex/)
  })

  it("na grade, até `max` fichas e o “+N mais”; o evento não é botão", () => {
    const html = agenda()
    const dia = html.match(/data-day="2026-03-12"[\s\S]*?<\/td>/)![0]
    expect(dia.match(/data-slot="calendar-event"/g)).toHaveLength(2)
    expect(dia).toContain("+2 mais")
    expect(dia).not.toMatch(/<button[^>]*data-slot="calendar-event"/)
  })

  it("na lista, todos os eventos, e cada um é botão quando tem onSelect", () => {
    const html = agenda()
    const lista = html.match(/data-slot="calendar-agenda-list"[\s\S]*$/)![0]
    expect(lista.match(/<button[^>]*data-slot="calendar-event"/g)).toHaveLength(4)
    expect(lista).not.toContain("+2 mais")
    expect(agenda({ renderDay: () => null, listEmpty: "Nada aqui" })).toContain("Nada aqui")
  })

  it("o fim de semana tem véu, e o dia escolhido não acende em primary", () => {
    const html = agenda({ mode: "single", selected: DIA_12, onSelect: () => {} })
    const sabado = html.match(/<td[^>]*data-day="2026-03-14"[^>]*>/)![0]
    expect(sabado).toContain("bg-muted/15")
    // O botão que sai, depois do `cn`: o `muted` venceu o `primary`, e o
    // realce de 5% voltou (o dia escolhido do calendário pequeno o zera).
    const botao = html.match(/<button[^>]*data-selected-single="true"[^>]*>/)![0]
    expect(botao).toContain("data-[selected-single=true]:bg-muted")
    expect(botao).not.toContain("data-[selected-single=true]:bg-primary ")
    expect(botao).toContain("data-[selected-single=true]:[--button-hover-fill:color-mix(in_oklab,var(--foreground)_5%,transparent)]")
    expect(botao).not.toContain("data-[selected-single=true]:[--button-hover-fill:transparent]")
  })

  it("o Hoje mora no cabeçalho da agenda — e volta para baixo sem a navegação", () => {
    const html = agenda({ showToday: true })
    expect(html.match(/>hoje</g)).toHaveLength(1)
    expect(html).toMatch(/data-slot="calendar-nav"[\s\S]*?>hoje</)
    // Com `hideNavigation` o cabeçalho não monta, e o "Hoje" não pode sumir.
    const semNav = agenda({ showToday: true, hideNavigation: true })
    expect(semNav).not.toContain('data-slot="calendar-nav"')
    expect(semNav.match(/>hoje</g)).toHaveLength(1)
  })

  it("a lista filtra pelos dias de `listDays`, e cada dia é grupo, não região", () => {
    const html = agenda({
      renderDay: (d: Date) => (d.getMonth() === 2 && [5, 12].includes(d.getDate()) ? eventos(1) : null),
      listDays: (d: Date) => d.getDate() === 12,
    })
    const lista = html.match(/data-slot="calendar-agenda-list"[\s\S]*$/)![0]
    expect(lista).toContain('data-day="2026-03-12"')
    expect(lista).not.toContain('data-day="2026-03-05"')
    expect(lista).not.toContain("<section")
    expect(lista).toMatch(/role="group"[^>]*data-day="2026-03-12"/)
  })

  it("na lista o evento leva o tipo depois do título, e o valor sai neutro", () => {
    const html = agenda({
      renderDay: (d: Date) =>
        d.getDate() === 12 && d.getMonth() === 2
          ? h(CalendarEvents, null, h(CalendarEvent, { tone: "expense", amount: -55.9, meta: h("span", null, "Assinatura") } as never, "Netflix"))
          : null,
    })
    const lista = html.match(/data-slot="calendar-agenda-list"[\s\S]*$/)![0]
    expect(lista).toMatch(/Netflix<\/span><span>Assinatura<\/span>/)
    expect(lista).not.toMatch(/text-expense/)
  })

  it("o esqueleto da agenda tem a grade de fios", () => {
    const html = renderToStaticMarkup(h(CalendarSkeleton, { variant: "agenda" }))
    expect(html).toContain('data-variant="agenda"')
    expect(html).toContain('role="status"')
    expect(html.match(/min-h-24/g)).toHaveLength(42)
  })

  it("o dashboard veste as peças, sem fichas à mão nem troca por isMobile", () => {
    const tela = lerFonte("src/components/dashboard/dashboard-payments-calendar.tsx")
    expect(tela).toContain("<CalendarEvents")
    expect(tela).toContain("<CalendarEvent")
    expect(tela).not.toMatch(/function EventChips|isMobile \?|mobileGroupedForList/)
  })
})
