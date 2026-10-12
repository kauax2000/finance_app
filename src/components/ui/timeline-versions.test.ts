import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

import {
  formatDayHeadingPtBr,
  formatRelativeTimePtBr,
  groupByLocalDay,
} from "@/lib/transaction-date"
import {
  Timeline,
  TimelineActions,
  TimelineCollapsed,
  TimelineGroup,
  TimelineHeader,
  TimelineItem,
  TimelineLink,
  TimelineSeparator,
  TimelineSkeleton,
  TimelineTime,
  TimelineTitle,
  timelineMarkerVariants,
  timelineVariants,
} from "./timeline"

/** A rodada 227: o relevo, o estado, as peças, os comportamentos e o app. */

const TIMELINE = lerFonte("src/components/ui/timeline.tsx")
const CSS = lerFonte("src/app/globals.css")

const html = (...filhos: ReturnType<typeof h>[]) =>
  renderToStaticMarkup(h(Timeline, null, ...filhos))

describe("o redesenho", () => {
  it("o ponto tem o halo do próprio tom, e o poço um fio de 1px na tinta dele", () => {
    expect(timelineMarkerVariants({ marker: "dot" })).toContain(
      "[box-shadow:0_0_0_var(--tl-halo)_var(--tl-well)]"
    )
    expect(timelineMarkerVariants({ marker: "icon" })).toContain("inset_0_0_0_1px")
  })

  it("o estado: concluído forte, atual com anel, previsto vazado e tracejado, ignorado apagado", () => {
    expect(timelineMarkerVariants({ marker: "dot", state: "done" })).toContain("var(--tl-strong)")
    expect(timelineMarkerVariants({ marker: "dot", state: "current" })).toContain("after:animate-ping")
    expect(timelineMarkerVariants({ marker: "dot", state: "upcoming" })).toContain("[background:transparent]")
    expect(timelineMarkerVariants({ marker: "dot", state: "skipped" })).not.toContain("--tl-halo")
    expect(TIMELINE).toContain('state === "done" && "[--tl-line-bg:var(--tl-strong)]"')
    expect(TIMELINE).toContain("repeating-linear-gradient(var(--tl-dash-dir)")

    const marcado = html(
      h(TimelineItem, { state: "current" }, h(TimelineTitle, null, "Vence")),
      h(TimelineItem, { state: "upcoming" }, h(TimelineTitle, null, "Próximo"))
    )
    expect(marcado).toContain('aria-current="step"')
    expect(marcado).toContain('<span class="sr-only">Previsto: </span>')
  })

  it("a coluna de data é uma grade que, no telefone, põe a data embaixo", () => {
    const split = renderToStaticMarkup(
      h(Timeline, { layout: "split" },
        h(TimelineItem, { opposite: "05/04" }, h(TimelineTitle, null, "Fatura paga"))
      )
    )
    expect(split).toContain('data-layout="split"')
    expect(split).toContain('data-slot="timeline-opposite"')
    expect(TIMELINE).toContain("sm:grid-cols-[var(--tl-opposite-w)_var(--tl-rail-w)_minmax(0,1fr)]")
    expect(TIMELINE).toContain("col-start-2 row-start-2 sm:col-start-1 sm:row-start-1 sm:pe-2 sm:text-end")
    // Fora do split, o opposite não aparece.
    expect(html(h(TimelineItem, { opposite: "05/04" }, "x"))).not.toContain("timeline-opposite")
  })

  it("sem marcador, o fio é a espinha: mede 1px, afasta o texto e não para no último", () => {
    const sem = renderToStaticMarkup(
      h(Timeline, { marker: "none" }, h(TimelineItem, null, "a"), h(TimelineItem, null, "b"))
    )
    expect(sem).toContain("[--tl-marker:1px] [--tl-rail-gap:--spacing(3)]")
    // O conector do último também aparece — não há ponto para fechar a trilha.
    expect(sem).not.toContain("[display:var(--tl-conn,block)]")
    // E na deitada o texto começa no trecho, sem centrar num marcador que não há.
    expect(TIMELINE).toContain(
      'none: "[--tl-marker:1px] [--tl-content-center:0] [--tl-content-tx:none] [--tl-content-align:start]"'
    )
  })

  it("a linha compacta força o ponto pequeno e a entrelinha miúda", () => {
    const compacta = html(h(TimelineItem, { density: "compact", marker: "icon" }, "x"))
    expect(compacta).toContain('data-density="compact"')
    expect(compacta).toContain("[--tl-dot:--spacing(1.5)]")
    expect(compacta).toContain("[--tl-lead:calc(var(--text-xs)*1.625)]")
    expect(compacta).not.toContain("size-(--tl-well-size)")
  })
})

describe("as peças", () => {
  it("o cabeçalho põe a hora na ponta, e as ações recebem o degrau sm", () => {
    const item = html(
      h(TimelineItem, null,
        h(TimelineHeader, { end: h(TimelineTime, { dateTime: "2026-04-05" }, "05/04") },
          h(TimelineTitle, null, "Fatura paga")),
        h(TimelineActions, null, "botões")
      )
    )
    expect(item).toMatch(/data-slot="timeline-header"[\s\S]*Fatura paga[\s\S]*<time/)
    expect(TIMELINE).toContain('<ButtonSizeContext.Provider value="sm">')
  })

  it("o recolhido diz quantos são, e o link estica sobre o evento", () => {
    const recolhido = html(
      h(TimelineCollapsed, null, h(TimelineItem, { key: 1 }, "a"), h(TimelineItem, { key: 2 }, "b"))
    )
    expect(recolhido).toContain("2 eventos ocultos")
    expect(recolhido).not.toContain('data-slot="timeline-item"')

    expect(renderToStaticMarkup(h(TimelineLink, { href: "#" }, "x"))).toContain("after:absolute")
    expect(TIMELINE).toContain("has-[[data-slot=timeline-link]]:relative")
  })

  it("o esqueleto anuncia uma vez, e some do grupo dentro de um esqueleto de página", () => {
    expect(renderToStaticMarkup(h(TimelineSkeleton, {}))).toContain('role="status"')
    expect(renderToStaticMarkup(h(TimelineSkeleton, { group: false }))).not.toContain('role="status"')
  })

  it("o grupo põe cada dia no próprio contêiner, para a faixa seguinte empurrar a anterior", () => {
    const dias = html(
      h(TimelineGroup, { key: "a", label: "Hoje", sticky: true }, h(TimelineItem, null, "a")),
      h(TimelineGroup, { key: "b", label: "Ontem", sticky: true }, h(TimelineItem, null, "b"))
    )
    // A faixa mora dentro do grupo: o `sticky` só prende dentro do pai.
    expect(dias).toMatch(/data-slot="timeline-group"[^>]*><ol[^>]*><li data-slot="timeline-separator" data-sticky="true"/)
    // O fio atravessa os dias, e o vão entre eles mora dentro do grupo.
    expect(TIMELINE).toContain("[&:not(:last-child)>ol>li:last-child]:[--tl-conn:block]")
    expect(TIMELINE).toContain("not-last:-mb-(--tl-gap)")
    // O fio que se desenha acha os eventos em qualquer nível.
    expect(TIMELINE).toContain('"[data-slot=timeline-item] > [data-slot=timeline-rail]"')
  })

  it("a faixa presa é a pílula flutuante, com um véu que só existe presa, e traz o resumo do dia", () => {
    const presa = html(h(TimelineSeparator, { sticky: true, end: "−R$ 162,55" }, "Hoje"))
    expect(presa).toContain("sticky top-(--tl-sticky-top) z-10 [container-type:scroll-state]")
    expect(presa).toContain("rounded-full bg-popover px-2 py-0.5 ring-1 ring-foreground/10")
    // O véu: a cor da superfície em rampa, apagado até a faixa prender.
    expect(presa).toContain('data-slot="timeline-separator-veil"')
    expect(presa).toContain("[@container_scroll-state(stuck:top)]:opacity-100")
    expect(presa).toContain("linear-gradient(to_bottom,var(--tl-surface)_50%")
    // A faixa em si não pinta: a opaca escondia o conteúdo de vez, e saiu.
    expect(presa).not.toMatch(/sticky[^"]*bg-\(--tl-surface\)/)
    expect(presa).toMatch(/data-slot="timeline-separator-end"[^>]*>−R\$ 162,55/)
    expect(timelineVariants({})).toContain("[--tl-surface:var(--color-background)]")
  })})

describe("o tempo", () => {
  const agora = new Date(2026, 3, 5, 12, 0).getTime()
  const antes = (min: number) => new Date(agora - min * 60_000).toISOString()

  it("o relativo diz agora, minutos, horas, ontem, dias e depois a data", () => {
    expect(formatRelativeTimePtBr(antes(0.2), agora)).toBe("Agora")
    expect(formatRelativeTimePtBr(antes(5), agora)).toBe("Há 5 min")
    expect(formatRelativeTimePtBr(antes(180), agora)).toBe("Há 3 h")
    expect(formatRelativeTimePtBr(new Date(2026, 3, 3, 23, 0).toISOString(), agora)).toBe("Há 2 dias")
    expect(formatRelativeTimePtBr(new Date(2026, 3, 6, 9, 0).toISOString(), agora)).toBe("Amanhã")
    expect(formatRelativeTimePtBr(new Date(2026, 2, 1, 9, 0).toISOString(), agora)).toBe("01/03")
    expect(formatRelativeTimePtBr(new Date(2025, 2, 1, 9, 0).toISOString(), agora)).toBe("01/03/2025")
  })

  it("a faixa de dia e o agrupamento pelo dia local, na ordem", () => {
    expect(formatDayHeadingPtBr(new Date(2026, 3, 5, 1).toISOString(), agora)).toBe("Hoje")
    expect(formatDayHeadingPtBr(new Date(2026, 3, 4, 23).toISOString(), agora)).toBe("Ontem")
    const grupos = groupByLocalDay(
      [new Date(2026, 3, 5, 9), new Date(2026, 3, 5, 1), new Date(2026, 3, 4, 23)].map((d) => d.toISOString()),
      (iso) => iso
    )
    expect(grupos.map((g) => g.itens.length)).toStrictEqual([2, 1])
  })

  it("o servidor mostra os filhos, e o relativo entra no cliente", () => {
    const servidor = renderToStaticMarkup(
      h(TimelineTime, { dateTime: "2026-04-05T09:12", relative: true }, "05/04 · 09:12")
    )
    expect(servidor).toContain("05/04 · 09:12")
    expect(TIMELINE).toContain("React.useSyncExternalStore(")
  })
})

describe("os comportamentos", () => {
  it("a cascata mora numa @utility, e o fio que se desenha fica fora dela", () => {
    expect(CSS).toContain("@utility timeline-reveal {")
    expect(CSS).toContain('& > li:not([data-slot="timeline-progress"])')
    expect(TIMELINE).toContain('reveal && "timeline-reveal"')
  })

  it("a chegada só anima o que entra depois da primeira pintura", () => {
    expect(TIMELINE).toContain("<AnimatePresence initial={false}>")
    expect(TIMELINE).toContain("const chegada = lista.live && !reduzir")
    // O recorte é só durante o crescer: o `transitionEnd` do motion não o
    // tirava, e o halo dos pontos revelados ficava cortado para sempre.
    expect(TIMELINE).not.toMatch(/transitionEnd: \{ overflow/)
    expect(TIMELINE).toContain('if (no.current) no.current.style.overflowY = ""')
    // E só no eixo que cresce: de lado o halo nunca é aparado, nem na abertura.
    expect(TIMELINE).toContain('initial={chegada ? { height: 0, opacity: 0, overflowY: "clip" } : false}')
  })

  it("o fio que se desenha vem primeiro, para não virar o último filho", () => {
    const comFio = renderToStaticMarkup(
      h(Timeline, { progress: "scroll" }, h(TimelineItem, null, "a"), h(TimelineItem, null, "b"))
    )
    expect(comFio.indexOf("timeline-progress")).toBeLessThan(comFio.indexOf("timeline-item"))
    expect(TIMELINE).toContain("style={{ scaleY: reduzir ? 1 : progresso }}")
  })
})

describe("o app", () => {
  it("a atividade da conta e o histórico de cobranças são Timeline, sem o marcador à mão", () => {
    const atividade = lerFonte("src/app/(app)/account/activity/page-client.tsx")
    expect(atividade).toContain("<Timeline")
    expect(atividade).toContain("groupByLocalDay(")
    expect(atividade).not.toMatch(/h-8 w-8 shrink-0 items-center justify-center rounded-full/)

    const cobrancas = lerFonte("src/components/bills/bill-detail-history-list.tsx")
    expect(cobrancas).toContain("<TimelineActions>")
    expect(cobrancas).not.toContain("instanceDotClass")
    expect(cobrancas).not.toMatch(/size-2 shrink-0 rounded-full/)
  })
})
