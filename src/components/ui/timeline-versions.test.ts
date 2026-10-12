import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

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
  TIMELINE_TONES,
  timelineToneVariants,
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

/**
 * A escada da `Timeline`, trancada.
 *
 * Cada asserção existe por causa de um defeito **medido**, e quase todos já
 * tinham sido pagos noutro componente desta casa antes de aparecerem aqui:
 *
 * - o ponto a **4,4px** do centro óptico do título (`mt-0.5` cravado contra uma
 *   caixa de 22,75px) — a família do ícone do `Alert`;
 * - `isLast` como prop de quem chama — o defeito que o `Stepper` e a
 *   `BreadcrumbList` já tinham corrigido, e que aqui sobreviveu **com a página
 *   do catálogo afirmando o contrário**;
 * - `ring-4 ring-background` supondo a superfície — a régua do `Accordion`;
 * - `in-*` para propagar orientação, que compila com `:where()` e perde para a
 *   classe base — o defeito do `DescriptionList`;
 * - classe montada em tempo de execução, que o Tailwind nunca emite — esta base
 *   já pagou essa lição **cinco** vezes.
 *
 * O arquivo é lido **sem comentários**: a prosa acima cita de propósito o que o
 * componente deixou de fazer, e uma varredura ingênua se acusaria sozinha. É o
 * conserto que o auditor já tinha feito em `lineOf`, e que os testes do `Chart`
 * e do `Sheet` repetem.
 */

const FONTE = lerFonte("src/components/ui/timeline.tsx")

/** Sem blocos `/* *\/` e sem linhas `//`. Comentário não é código. */
const CODIGO = semComentarios(FONTE, "linha-inteira")

const DEGRAUS = ["sm", "md", "lg"] as const
const MARCADORES = ["dot", "icon", "avatar", "none"] as const

/** Extrai o valor de uma variável `--tl-*` da string de um degrau. */
function medida(size: (typeof DEGRAUS)[number], nome: string) {
  const classes = timelineVariants({ size })
  const achado = classes.match(
    new RegExp(`\\[--tl-${nome}:([^\\]]+)\\]`)
  )?.[1]
  return achado
}

/** `--spacing(2.5)` → 2.5. O sistema mede em passos de 4px. */
function passos(valor: string | undefined) {
  return Number(valor?.match(/--spacing\(([\d.]+)\)/)?.[1])
}

describe("escada da Timeline", () => {
  it("2. as medidas sobem monotonicamente, e `md` é o padrão", () => {
    // O poço `md` é 32px — 8 passos —, que é a medida que `account/activity`
    // já renderiza à mão. Âncora real, e não escala inventada.
    expect(passos(medida("md", "well-size"))).toBe(8)
    expect(timelineVariants({})).toBe(
      timelineVariants({ orientation: "vertical", marker: "dot", size: "md" })
    )
  })

  it("3. nada é montado em tempo de execução — o Tailwind varre o código como texto", () => {
    // Interpolação só fora de classe: o `${a.x}px` do fio medido é um valor
    // de estilo, e o "N eventos ocultos" é texto. Nenhum prefixo de utilitário
    // (`bg-${…}`, `size-${…}`) pode ser montado.
    expect(CODIGO).not.toMatch(/`[^`]*[a-z]-\$\{[^`]*`/)
    expect(CODIGO).not.toMatch(/className=\{`/)
  })

  it("4. o deslocamento do marcador deriva do degrau, e não é número mágico", () => {
    // A conta do `Alert`: `(entrelinha − marcador) / 2`. O `max(0px, …)` é o
    // que faz o poço — maior que uma linha — alinhar pelo topo em vez de subir
    // para fora do bloco, com uma fórmula só.
    expect(CODIGO).toMatch(/margin-block-start:max\(0px,calc\(/)
    expect(CODIGO).toContain("var(--tl-lead)")

    // `--tl-lead` é fonte única: o título a veste como `line-height` e a
    // fórmula a lê como entrelinha. Foram duas fontes por uma medição — o
    // `text-(length:…)` derrubou o `leading-relaxed` do `P`, e o ponto saiu
    // 0,88px fora do centro com o código "certo".
    expect(CODIGO).toMatch(/leading-\(--tl-lead\)/)
    for (const size of DEGRAUS) {
      expect(timelineVariants({ size }), `${size} não publica --tl-lead`).toMatch(
        /\[--tl-lead:calc\(var\(--text-(?:xs|sm)\)\*1\.625\)\]/
      )
    }
    expect(CODIGO).toContain("var(--tl-center)")

    // Todo `-` binário dentro de um `calc()` arbitrário se escreve `_-_`: o
    // Tailwind normaliza espaço em torno de `+`, `*` e `/`, mas não de `-`.
    const formula = CODIGO.match(/\[margin-block-start:[^\]]+\]/)?.[0] ?? ""
    expect(formula).toContain("_-_")
    expect(formula).not.toMatch(/\s/)

    // O `mt-0.5` cravado não volta: era ele que punha o ponto 4,4px acima.
    expect(CODIGO).not.toMatch(/(?:^|\s)mt-0\.5(?:\s|"|')/)

    // E a centragem é ligada pela orientação, nunca por um segundo `mt`.
    expect(timelineVariants({ orientation: "vertical" })).toContain("[--tl-center:1]")
    expect(timelineVariants({ orientation: "horizontal" })).toContain("[--tl-center:0]")
  })

  it("5. o anel não volta — um componente não sabe sobre que superfície está", () => {
    expect(CODIGO).not.toContain("ring-background")
    // O anel de 1px da pílula presa (`TimelineSeparator sticky`) é a placa
    // flutuante, não um furo no fio; o que não volta é o anel grosso.
    expect(CODIGO).not.toMatch(/ring-[2-9]/)
    // O relevo é halo do próprio tom, nunca a cor da página.
    expect(CODIGO).toContain("[box-shadow:0_0_0_var(--tl-halo)_var(--tl-well)]")
  })

  it("6. todo `hover:` tem par `active:` — a regra H não alcança `cva`", () => {
    const familias = (fonte: string, variante: "hover" | "active") =>
      new Set(
        [...fonte.matchAll(new RegExp(`${variante}:([a-z]+)-`, "g"))].map(
          (m) => m[1]
        )
      )
    for (const f of familias(CODIGO, "hover")) {
      expect(familias(CODIGO, "active"), `hover:${f}- sem par de toque`).toContain(f)
    }
  })

  it("7. a lista decide o fim pelo CSS e a forma pelo contexto — sem clone", () => {
    // Rodada 227: o clone derramava props na faixa de data e não alcançava um
    // filho que não fosse elemento direto. O fim é `:last-child`, com a
    // exceção `isLast={false}` no mesmo variante.
    expect(CODIGO).not.toContain("cloneElement")
    expect(CODIGO).toContain("last:not-data-[end=false]:[--tl-conn:none]")
    expect(CODIGO).toContain("data-[end=true]:[--tl-conn:none]")
    expect(CODIGO).toContain("[display:var(--tl-conn,block)]")
    // E um `marker` escrito no item vence o da lista.
    expect(CODIGO).toMatch(/marker \?\? lista\.marker/)
  })

  it("8. a orientação viaja por variável, e o último não estica", () => {
    // `in-*` compila com `:where()`, que não soma especificidade: ele perderia
    // para a classe base no mesmo elemento. É o defeito do `DescriptionList`.
    expect(CODIGO).not.toMatch(/in-data-\[orientation/)
    expect(CODIGO).not.toMatch(/group-data-\[orientation/)

    expect(timelineVariants({ orientation: "horizontal" })).toContain(
      "[--tl-grow:1_1_0%]"
    )
    // ~192px de vão morto foi o que o `Stepper` mediu com o último esticado.
    expect(CODIGO).toContain("[--tl-grow:0_0_auto]")

    // As duas orientações declaram o mesmo conjunto de variáveis: uma que
    // faltasse de um lado só falharia calada, e num eixo só.
    const vars = (o: "vertical" | "horizontal") =>
      new Set(
        [...timelineVariants({ orientation: o }).matchAll(/\[(--tl-[a-z-]+):/g)].map(
          (m) => m[1]
        )
      )
    expect([...vars("vertical")].sort()).toStrictEqual([...vars("horizontal")].sort())
  })

  it("9. o separador não desenha fio e tinta — regra J", () => {
    const sep = CODIGO.slice(
      CODIGO.indexOf("function TimelineSeparator"),
      CODIGO.indexOf("function TimelineTitle")
    )
    expect(sep.length).toBeGreaterThan(200)
    expect(sep).not.toMatch(/\bborder-[bty]\b|\bborder-b\b/)
    expect(sep).not.toMatch(/\bbg-(muted|card|accent)/)
    // O fio da calha continua através dela: a data rotula a cronologia, não a
    // interrompe.
    expect(sep).toContain("bg-border")

    // Sem clone, a faixa não recebe mais `isLast` nem `marker` — eram eles que
    // vazavam para o `<li>`, três vezes na mesma página.
    expect(sep).not.toMatch(/_isLast|_marker/)
  })

  it("12. o vidro saiu, e nenhuma forma o veste (rodada 227)", () => {
    // O eixo `glass` entrou na rodada 70 e saiu a pedido do dono: com o relevo
    // (o halo do tom no ponto, o fio no poço) ele era um terceiro acabamento
    // que nenhuma tela pedia. Nem prop, nem utility, nem a régua do vidro.
    expect(CODIGO).not.toMatch(/\bglass\b/)
    expect(CODIGO).not.toContain("glassRoundSurfaceClassName")
    for (const marker of MARCADORES) {
      expect(timelineMarkerVariants({ marker })).not.toContain("glass")
    }
  })

  it("13. o chapado escreve o fundo de cada forma", () => {
    expect(timelineMarkerVariants({ marker: "dot" })).toContain(
      "[background:var(--tl-fill)]"
    )
    expect(timelineMarkerVariants({ marker: "icon" })).toContain(
      "[background:var(--tl-well)]"
    )
  })

  it("14. o tom sai da própria peça, e o avatar não tem tom", () => {
    // O corpo vem da família `-muted`, que é opaca nos dois temas.
    expect(timelineToneVariants({ tone: "income" })).toContain(
      "[--tl-well:var(--color-income-muted)]"
    )
    // O avatar é o único sem tom: a cor dele é a identidade da pessoa, que mora
    // dentro do avatar. Tingir a moldura competiria com ela.
    expect(timelineMarkerVariants({ marker: "avatar" })).not.toContain("var(--tl-well)")
    expect(timelineMarkerVariants({ marker: "avatar" })).not.toContain("var(--tl-fill)")
  })

  it("17. a calha alinha ao topo — o último marcador não se centra", () => {
    // O conector é `flex-1`: com ele não sobra espaço livre, e `justify-content`
    // não decide nada. Sem ele — no último item — um `justify-center` centrava
    // o marcador sozinho na altura da calha: medido, **23,44px** abaixo do
    // centro do título, contra 0 nos outros três. O defeito só existia na
    // última linha de cada trilha, que é o que o fez atravessar a rodada 69.
    //
    // Quem alinha o marcador é `MARCADOR_OFFSET`. Um `justify` que só age
    // quando falta um irmão sobrescreve a fórmula pelas costas.
    // Uma calha só, que o evento, a faixa e o recolhido vestem.
    const calhas = CODIGO.match(
      /flex shrink-0 items-center justify-\w+ \[flex-direction/g
    ) ?? []
    expect(calhas.length).toBe(1)
    for (const c of calhas) expect(c).toContain("justify-start")
    expect(CODIGO.match(/className=\{cn\(CALHA/g)?.length).toBe(3)

    // E o poço **mantém** o dele: ali `justify-center` centra o glifo dentro do
    // marcador, que é outro eixo e está certo.
    expect(CODIGO).toContain(
      '"relative z-2 flex shrink-0 items-center justify-center rounded-full"'
    )
  })

  it("18. a medida do marcador mora no item, e o conteúdo a enxerga", () => {
    // A raiz publica `--tl-marker` como largura da **calha**, uniforme para a
    // faixa de data alinhar. Mas o deslocamento vertical e a centragem
    // horizontal precisam da medida do marcador **renderizado** — e as duas
    // divergem no item que sobrescreve o `marker`: um ponto de 10px numa
    // trilha de poço lia 32 e saía 6,38px acima do centro do título.
    //
    // Ela mora no `<li>` e não no marcador porque o conteúdo é **irmão** do
    // marcador, e custom property não atravessa para o lado.
    expect(CODIGO).toMatch(/const MEDIDA_DO_MARCADOR/)
    expect(CODIGO).toMatch(/MEDIDA_DO_MARCADOR\[forma\]/)
    for (const m of MARCADORES) {
      expect(
        timelineMarkerVariants({ marker: m }),
        `${m} não pode declarar a medida no marcador — o conteúdo não a veria`
      ).not.toContain("[--tl-marker:")
    }
    expect(timelineVariants({ orientation: "vertical" })).toContain(
      "[--tl-rail-w:var(--tl-marker)]"
    )
  })

  it("19. na horizontal o texto se centra no marcador; na vertical é no-op", () => {
    // Medido antes: o centro da caixa de texto ficava a **161,4px** do centro
    // do marcador — o olho lia a palavra pendurada na trilha em vez de presa
    // ao evento. É o defeito que o `Stepper` mediu em 127px.
    const h = timelineVariants({ orientation: "horizontal" })
    const v = timelineVariants({ orientation: "vertical" })

    expect(h).toContain("[--tl-content-center:1]")
    expect(h).toContain("[--tl-content-tx:-50%]")
    expect(h).toContain("[--tl-content-align:center]")
    // `max-content` é o que encolhe a caixa até o texto; sem isso ela ocupa a
    // célula inteira e não há o que centrar.
    expect(h).toContain("[--tl-content-w:max-content]")

    // Na vertical os quatro são o neutro, e o `translate` é **`none`** e não
    // `0`: qualquer valor cria bloco de contenção e mudaria o significado de
    // um filho absoluto que a tela ponha no conteúdo.
    expect(v).toContain("[--tl-content-center:0]")
    expect(v).toContain("[--tl-content-tx:none]")
    expect(v).toContain("[--tl-content-align:start]")
    expect(v).toContain("[--tl-content-w:auto]")

    // O recuo é `calc(medida/2 * centro)` **no conteúdo**, e não uma variável
    // pronta da raiz: `var(--tl-marker)` precisa resolver no item, com a
    // medida do marcador dele.
    expect(CODIGO).toContain(
      "[margin-inline-start:calc(var(--tl-marker)/2*var(--tl-content-center))]"
    )
    // O mesmo conjunto de variáveis nas duas orientações é a asserção 8.
  })

  it("11. o `cva` da raiz vem primeiro — o `ds:catalog` lê só o primeiro", () => {
    // O `Item` passou uma rodada inteira reportando os eixos do grupo como se
    // fossem os dele, por causa da ordem no arquivo. Escrever o comentário
    // "este é o primeiro de propósito" não basta: nesta mesma rodada ele foi
    // escrito acima do `cva` errado, e o catálogo saiu reportando `tone`.
    const ordem = [...CODIGO.matchAll(/const (\w+) = cva\(/g)].map((m) => m[1])
    expect(ordem[0]).toBe("timelineVariants")

    // E os três eixos da raiz são de fato três eixos: cada um muda a string.
    const base = timelineVariants({})
    expect(timelineVariants({ orientation: "horizontal" })).not.toBe(base)
    expect(timelineVariants({ size: "lg" })).not.toBe(base)
    expect(timelineVariants({ marker: "icon" })).not.toBe(base)
  })

  it("10. os sete tons publicam as quatro variáveis, e o poço desfaz o colapso", () => {
    expect(TIMELINE_TONES).toHaveLength(7)

    for (const tone of TIMELINE_TONES) {
      const s = timelineToneVariants({ tone })
      for (const v of ["--tl-fill", "--tl-ink", "--tl-well", "--tl-strong"]) {
        expect(s, `${tone} não publica ${v}`).toContain(`[${v}:`)
      }
    }

    // `--income` é declarado como `var(--success)`, então na cor cheia os dois
    // saem idênticos — é o colapso que o catálogo documentava. Na família
    // `-muted` eles divergem, e é por isso que o poço é onde sete tons rendem
    // sete cores.
    const poço = (t: (typeof TIMELINE_TONES)[number]) =>
      timelineToneVariants({ tone: t }).match(/\[--tl-well:([^\]]+)\]/)?.[1]
    expect(poço("income")).not.toBe(poço("success"))
    expect(poço("expense")).not.toBe(poço("destructive"))

    // E o ponto usa a cor cheia, o poço usa a superfície tingida com a tinta
    // dela — nunca o contrário.
    expect(timelineMarkerVariants({ marker: "dot" })).toContain("var(--tl-fill)")
    expect(timelineMarkerVariants({ marker: "icon" })).toContain("var(--tl-well)")
    expect(timelineMarkerVariants({ marker: "icon" })).toContain("var(--tl-ink)")
    // O avatar não tinge: a identidade traz a cor dela.
    expect(timelineMarkerVariants({ marker: "avatar" })).not.toContain("--tl-well)")
    for (const m of MARCADORES) expect(timelineMarkerVariants({ marker: m })).toBeTruthy()
  })
})
