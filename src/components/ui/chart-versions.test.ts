import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

import {
  ChartBarList,
  ChartContainer,
  ChartDonut,
  ChartHeatStrip,
  ChartSplit,
  ChartStrip,
  ChartSwatch,
  ChartTooltipContent,
  waterfallSteps,
  chartContainerVariants,
  chartSeriesColor,
  dominioDaFaixa,
  formatChartValue,
  type ChartFormat,
} from "./chart"
import { esperarDistintos } from "@/test/regras"

/** As versões novas do `Chart`. */

const CODIGO = lerFonte("src/components/ui/chart.tsx")

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
      const codigo = lerFonte(arquivo)
      expect(codigo, arquivo).not.toContain("ResponsiveContainer")
      expect(codigo, arquivo).not.toMatch(/function \w*Tooltip\(/)
      expect(codigo, arquivo).not.toMatch(/<ChartTooltipContent\s*\/>/)
    }
  })
})

// A escada e as invariantes do Chart. O `CODIGO` daqui é o fonte sem comentários, e o de cima é
// o fonte inteiro.
{
  /**
   * O gráfico, trancado por defeitos medidos: o foco de teclado apagado (`outline-hidden` nas
   * camadas do Recharts e `accessibilityLayer={false}`), o tooltip formatando com `numberBR`
   * (sem `R$`), a rampa de cinco degraus para seis séries e a base da barra arredondando junto
   * com a ponta.
   */

  const FONTE = lerFonte("src/components/ui/chart.tsx")

  /**
   * O mesmo fonte sem comentários: metade das asserções pergunta o que o componente faz, e os
   * comentários citam o que ele deixou de fazer (`outline-hidden`, `Intl.NumberFormat`, `% 5`).
   */
  const CODIGO = semComentarios(FONTE)

  const ASPECTOS = ["video", "wide", "standard", "square", "auto"] as const

  const FORMATOS: ChartFormat[] = [
    "text",
    "number",
    "currency",
    "compact",
    "percent",
    "date",
    "month",
  ]

  describe("escada e invariantes do Chart", () => {
    it("1. `aspect` tem os cinco degraus, `video` é o padrão, e nenhum se chama `default`", () => {
      expect(chartContainerVariants()).toBe(
        chartContainerVariants({ aspect: "video" })
      )
      for (const aspect of ASPECTOS) {
        expect(chartContainerVariants({ aspect })).toBeTruthy()
      }
      // O nome `default` não volta: dizia o padrão em vez da medida.
      expect(CODIGO).not.toMatch(/^\s*default:\s*"aspect-/m)
    })

    it("2. nenhum par de degraus produz a mesma string", () => {
      for (const aspect of ASPECTOS) {
        const classes = chartContainerVariants({ aspect })
        const proporcao = classes
          .split(/\s+/)
          .find((c) => c.startsWith("aspect-"))
        expect(proporcao, `${aspect} não declara proporção`).toBeTruthy()
      }
    })

    it("3. o foco visível não volta a ser apagado — foi o defeito", () => {
      // Medido nas classes emitidas, e não no texto do arquivo, que cita `outline-hidden` de
      // propósito.
      expect(chartContainerVariants()).not.toContain("outline-hidden")

      // Suprimir o foco não-visível continua certo; o visível ganha o token. A supressão vai na
      // base sem pseudo: empatada em (0,2,0) com o anel ela não perde, e `outline-none` e
      // `outline-2` valeriam juntas, deixando o anel com estilo `none`.
      for (const alvo of ["recharts-sector", "recharts-surface"]) {
        expect(CODIGO).toContain(`[&_.${alvo}]:outline-none`)
        expect(CODIGO).not.toContain(`[&_.${alvo}:focus]:outline-none`)
        expect(CODIGO).toContain(`[&_.${alvo}:focus-visible]:outline-ring`)
        expect(CODIGO).toContain(`[&_.${alvo}:focus-visible]:outline-2`)
        // Sem isto o anel tem largura e nenhum traço.
        expect(CODIGO).toContain(`[&_.${alvo}:focus-visible]:outline-solid`)
      }
    })

    it("4. `format` cobre o tipo inteiro, e nenhum caminho reimplementa `Intl`", () => {
      for (const format of FORMATOS) {
        expect(() => formatChartValue(1234.5, format)).not.toThrow()
        expect(() => formatChartValue("2026-03-01", format)).not.toThrow()
        // Nenhum formato devolve `undefined` para valor ausente: um tooltip com
        // "undefined" escrito é pior que um tooltip vazio.
        expect(formatChartValue(undefined, format)).toBe("")
      }

      expect(formatChartValue(1234.5, "currency")).toContain("R$")
      // O eixo comprime e o tooltip não. Escrito com ` `: o `Intl` separa com espaço
      // inseparável, e o espaço do teclado reprovaria duas strings que se desenham iguais.
      expect(formatChartValue(1234567, "compact")).toBe("R$\u00a01,23\u00a0mi")
      // Abaixo de mil ele larga os centavos: um eixo não os quer (o zero da base não pode sair
      // "R$ 0,00").
      expect(formatChartValue(0, "compact")).toBe("R$\u00a00")
      expect(formatChartValue(600, "compact")).toBe("R$\u00a0600")
      expect(formatChartValue(600, "currency")).toBe("R$\u00a0600,00")
      expect(formatChartValue(1234567, "compact").length).toBeLessThan(
        formatChartValue(1234567, "currency").length
      )

      // A regra I do auditor: `Intl` mora em `lib/formatters` e `lib/transaction-date`.
      expect(CODIGO).not.toContain("Intl.")
    })

    it("5. a rampa tem cinco degraus, e o sexto não repete o primeiro", () => {
      const cinco = [0, 1, 2, 3, 4].map(chartSeriesColor)
      esperarDistintos(cinco)
      for (let i = 0; i < 5; i++) {
        expect(cinco[i]).toBe(`var(--chart-${i + 1})`)
      }

      // Do sexto em diante a cor lê como "não identificado". `% 5` daria
      // `var(--chart-1)` outra vez, que é o defeito de `credit-cards-history`.
      expect(chartSeriesColor(5)).not.toBe(cinco[0])
      expect(chartSeriesColor(5)).toBe("var(--color-muted-foreground)")
      expect(chartSeriesColor(9)).toBe(chartSeriesColor(5))
    })

    it("6. a ponta da barra arredonda e a base não", () => {
      // Arredondar os quatro cantos levanta a barra da linha do zero; a ponta é 8
      // (`CHART_BAR_TIP`).
      expect(CODIGO).toContain("const CHART_BAR_TIP = 8")
      expect(CODIGO).toContain("[CHART_BAR_TIP, CHART_BAR_TIP, 0, 0]")
      expect(CODIGO).toContain("[0, CHART_BAR_TIP, CHART_BAR_TIP, 0]")
      expect(CODIGO).not.toMatch(/radius=\{(4|8|CHART_BAR_TIP)\}/)
      expect(CODIGO).not.toContain("[CHART_BAR_TIP, CHART_BAR_TIP, CHART_BAR_TIP, CHART_BAR_TIP]")
    })

    it("7. o eixo de valor ancora em zero por padrão", () => {
      expect(CODIGO).toMatch(/\[0, "auto"\]/)
      // …e o eixo de categoria não herda o domínio numérico.
      expect(CODIGO).toMatch(/props\.type === "category" \? undefined/)
    })

    it("8. o vão entre marcas é pintado com uma superfície nomeada, uma vez só", () => {
      // Um `stroke` transparente mostraria a marca de trás em vez de abrir um
      // vão. A cor vem de uma variável declarada no container e herdada — não
      // de um literal repetido em cada marca.
      expect(CODIGO).toContain("[--chart-surface:var(--color-card)]")
      expect(
        (CODIGO.match(/--chart-surface:var\(/g) ?? []).length,
        "a superfície é declarada uma vez e herdada"
      ).toBe(1)
      expect(CODIGO).toContain('stroke="var(--chart-surface)"')
    })

    it("9. a legenda liga a partir de duas séries e some com uma", () => {
      // A regra da cor não ser o único canal, escrita como padrão e não como
      // conselho: `legend ?? chaves.length >= 2`.
      const regras = CODIGO.match(/legend \?\? \w+\.length >= 2/g) ?? []
      expect(regras.length).toBeGreaterThanOrEqual(4)
    })

    it("11. toda marca anima pelo Recharts, e a rosca começa sem espera", () => {
      // O Recharts 3.8 respeita `prefers-reduced-motion` (`'auto'` de fábrica), e a rosca vazia
      // vinha do `animationBegin` de 400ms somado a re-renders. Sem fases: a entrada ao montar
      // e a troca depois, por relógio.
      expect(CODIGO).not.toContain("CHART_ANIMATION")
      const marcas = CODIGO.match(/<(Area|Line|Bar|Pie|Radar|RadialBar)\b/g) ?? []
      const comMovimento =
        CODIGO.match(/\{\.\.\.(chartMarkMotion\(entrando(, (i|0|chaves\.length))?\)|movimento)\}/g) ?? []
      expect(comMovimento.length).toBe(marcas.length)
      // Nenhuma escreve o booleano à mão, que é como uma marca nova escaparia.
      expect(CODIGO).not.toMatch(/isAnimationActive=\{(true|false)\}/)
      // A rosca e os anéis não escalonam: o `begin` deles é zero.
      expect((CODIGO.match(/chartMarkMotion\(entrando\)/g) ?? []).length).toBe(3)
    })

    it("12. o anel da rosca fica centrado sobre a própria legenda", () => {
      // Com o alinhamento padrão (`stretch`) e largura própria no `ChartContainer`, o anel
      // encosta na esquerda de uma caixa que a legenda define.
      expect(CODIGO).toContain('"flex w-fit flex-col items-center"')
      // `w-fit` é `fit-content` e respeita o espaço disponível — é o que mantém
      // a legenda quebrando linha a 375px em vez de esticar o envelope.
      expect(CODIGO).not.toContain('className="flex w-fit flex-col"')
    })

    it("13. o medidor tem geometria própria, e não a da rosca", () => {
      // Com o anel da rosca a corda interna na altura do topo do texto mede 42px e `76%` ocupa
      // 43; o meio-arco num quadrado deixa 68px mortos embaixo.
      expect(CODIGO).toContain("const chartGaugeThickness")
      expect(CODIGO).toContain("const CHART_GAUGE_OUTER = 130")
      expect(CODIGO).toContain("const CHART_GAUGE_CY = 86")

      // O arco do medidor é mais fino que o anel da rosca em todos os degraus, o que abre a
      // corda de 42 para 103.
      const degraus = ["sm", "md", "lg"] as const
      const tabela = (nome: string) =>
        Object.fromEntries(
          (CODIGO.match(
            new RegExp(`const ${nome} = \\{([^}]*)\\}`)
          )?.[1] ?? "")
            .split(",")
            .map((p) => p.split(":").map((x) => x.trim()))
            .filter((p) => p.length === 2)
            .map(([k, v]) => [k, Number(v)])
        )
      const rosca = tabela("chartDonutThickness")
      const medidor = tabela("chartGaugeThickness")
      for (const d of degraus) {
        expect(medidor[d], `${d} existe nos dois`).toBeGreaterThan(0)
        // Fração maior = furo maior = anel mais fino.
        expect(medidor[d]).toBeGreaterThan(rosca[d])
      }

      // O rótulo se apoia na origem do arco por `bottom` em porcentagem, que
      // resolve contra a **altura** — é isso que faz a âncora não depender da
      // proporção da caixa.
      expect(CODIGO).toContain("bottom-(--chart-donut-label-b,19%)")
      // E quem injeta o alinhamento é o `ChartDonut`, não quem escreve o rótulo.
      expect(CODIGO).toContain('React.cloneElement(center, { align: "gauge" })')
    })

    it("10. as formas curtas cobram o nome acessível", () => {
      // `label` é obrigatório em `ChartFormProps` — sem `?`. A composição livre
      // (`ChartContainer`) não cobra, porque ela não pode.
      expect(CODIGO).toMatch(/type ChartFormProps = \{[\s\S]*?\n {2}label: string\n/)
      expect(CODIGO).toMatch(/ {4}label\?: string\n/)
      // `img` quando só se lê; `group` quando o gráfico recebe ação (`img` tornaria
      // apresentacional o que se aperta).
      expect(CODIGO).toContain('role={label ? (interactive ? "group" : "img") : undefined}')
    })
  })

  describe("ChartSparkline reference", () => {
    const trecho = semComentarios(CODIGO).split("function ChartSparkline(")[1].split("\n/* ----")[0]

    it("reference: a média tracejada da faísca", () => {
      expect(trecho).toContain("reference?: number")
      expect(trecho).toContain("<ReferenceLine")
      expect(trecho).toContain("strokeDasharray")
      expect(trecho).toContain("var(--color-muted-foreground)")
    })

    it("bleed: opt-in, zera a margem nas três formas e só com ele", () => {
      expect(trecho).toContain("bleed?: boolean")
      expect(trecho).toContain("bleed = false")
      expect(trecho).toContain("bleed ? { top: 0, right: 0, bottom: 0, left: 0 } : undefined")
      for (const c of ["BarChart", "AreaChart", "LineChart"]) {
        expect(trecho).toContain(`<${c} data={data} margin={margin}`)
      }
    })

    it("a linha da média vem antes da série", () => {
      const ref = trecho.indexOf("<ReferenceLine")
      expect(ref).toBeGreaterThan(-1)
      expect(ref).toBeLessThan(trecho.indexOf("<Area"))
      expect(ref).toBeLessThan(trecho.indexOf("<Line"))
    })

    it("zero ou ausente não desenha", () => {
      expect(trecho).toContain("Number.isFinite(reference)")
      expect(trecho).toContain("reference > 0")
    })

    it("band: o domínio prende a linha na faixa de cima", () => {
      expect(dominioDaFaixa([100, 200], 0.5)).toEqual([0, 200])
      expect(dominioDaFaixa([150, 150], 0.5)).toEqual([149, 150])
      expect(dominioDaFaixa([100, 200], 0.5, 300)).toEqual([-100, 300])
      expect(dominioDaFaixa([], 0.5)).toBeUndefined()
      expect(trecho).toContain("band?: number")
      expect(trecho).toContain("<YAxis hide domain={dominio}")
    })

    it("os cartões de categoria passam band={0.45}", () => {
      for (const f of ["expense", "income"]) {
        expect(lerFonte(`src/components/categories/${f}-category-card.tsx`)).toContain("band={0.45}")
      }
    })

    it("a página do catálogo mostra o reference", () => {
      expect(lerFonte("src/app/designsystem/docs/chart.tsx")).toContain("reference=")
    })
  })
}

describe("ChartSparkline sem dica (20/11/2026)", () => {
  it("o ponto ativo só acende quando há dica", async () => {
    const { lerFonte, semComentarios } = await import("@/test/fonte")
    const f = semComentarios(lerFonte("src/components/ui/chart.tsx"))
    const ini = f.indexOf("function ChartSparkline(")
    const trecho = f.slice(ini, f.indexOf("\nfunction ", ini + 10))
    expect(trecho.match(/activeDot=\{tooltip \? undefined : false\}/g)?.length).toBe(2)
  })
})

describe("ChartSparkline band: a área enche até o pé (20/11/2026)", () => {
  it("a base da área é o fundo do domínio da faixa", async () => {
    const { lerFonte, semComentarios } = await import("@/test/fonte")
    const f = semComentarios(lerFonte("src/components/ui/chart.tsx"))
    expect(f).toContain("baseValue={dominio ? dominio[0] : undefined}")
  })
})

describe("Chart: yAxis, selectedColor, marcador só na série cheia e a lista da rosca pela largura do cartão", () => {
  const f = semComentarios(CODIGO)
  it("yAxis esconde a régua de valor em área, linha e barras", () => {
    expect(f.match(/yAxis = true/g)?.length).toBe(3)
    expect(f.match(/hide=\{!yAxis\}/g)?.length).toBe(3)
  })
  it("selectedColor pinta só a barra escolhida e desliga o apagado", () => {
    expect(f).toContain("selected != null && !selectedColor")
    expect(f).toMatch(/selectedColor && selected != null && String\(linha\[x\]\) === selected/)
  })
  it("o marcador do último ponto pula a série tracejada na linha", () => {
    expect(f).toContain('marker === "last" && !tracejada(config, key)')
  })
  it("a lista da rosca decide pela largura do cartão (container query), e a cor declarada chega ao ponto", () => {
    expect(f).toContain("@container/chart-donut")
    expect(f).toContain("@2xs/chart-donut:flex-row")
    expect(f).not.toContain("sm:flex-row sm:gap-8")
    expect(f).toContain("<ChartSwatch color={corDoPonto(i)} />")
  })
})

describe("Chart: rótulo na linha de referência, ponto anotado e barras parciais (21/11/2026)", () => {
  const f = semComentarios(CODIGO)
  const trechoDe = (nome: string) => {
    const ini = f.indexOf(`function ${nome}(`)
    return f.slice(ini, f.indexOf("\nfunction ", ini + 10))
  }
  it("a linha de referência escreve o rótulo à esquerda, logo acima dela e sem caixa", () => {
    const t = trechoDe("ChartReferenceLine")
    expect(t).toContain("label?: string")
    expect(t).toContain('data-slot="chart-reference-label"')
    expect(t).toContain("fill-muted-foreground text-2xs")
    expect(t).toContain("(p.viewBox?.y ?? 0) - 6")
    expect(t).not.toContain("<rect")
  })
  it("o ponto anotado é vazado, com o rótulo acima e virando para dentro perto da borda", () => {
    expect(f).toMatch(/export \{[\s\S]*ChartReferenceDot,[\s\S]*\}/)
    const t = trechoDe("ChartReferenceDot")
    expect(t).toContain("<ReferenceDot")
    expect(t).toContain("r={4}")
    expect(t).toContain('fill={hollow ? "var(--chart-surface)" : traco}')
    expect(t).toContain("strokeWidth={2}")
    expect(t).toContain('tone?: "series" | "neutral"')
    const r = trechoDe("ChartReferenceDotLabel")
    expect(r).toContain("usePlotArea")
    expect(r).toContain("< 60")
    expect(r).toContain('"end"')
    expect(r).toContain('cn("text-2xs", !tinta && "fill-foreground")')
  })
  it("valueLabels aceita \"selected\": só a barra escolhida leva o valor", () => {
    const t = trechoDe("ChartBars")
    expect(t).toContain('valueLabels?: boolean | "selected"')
    expect(t).toContain('valueLabels === "selected"')
  })
  it("partial desenha a barra só com o contorno tracejado", () => {
    const t = trechoDe("ChartBars")
    expect(t).toContain("partial?: string[]")
    expect(t).toContain('...(parcial && {')
    expect(t).toContain('strokeDasharray: "4 3"')
    expect(t).toContain('fill: "transparent"')
    // Nenhum traço explícito fora da parcial: apagaria a emenda das empilhadas.
    expect(t).not.toContain("parcial ? ")
    // O contorno é neutro: na cor da série (o `--muted` do cartão) ele sumia.
    expect(t).toContain('stroke: "var(--color-muted-foreground)"')
  })
  it("barMax limita a largura e o rótulo do selected sai por extenso, longe da borda", () => {
    const t = trechoDe("ChartBars")
    expect(t).toContain("barMax?: number")
    expect(t).toContain("maxBarSize={barMax}")
    expect(t).toContain('valueLabels === "selected" ? format : axisFormatFor(format)')
    expect(t).toMatch(/valueLabels === "selected" && !horizontal \? \{ top: 20, right: 28/)
  })
  it("a página do catálogo mostra as quatro peças", () => {
    const doc = lerFonte("src/app/designsystem/docs/chart.tsx")
    expect(doc).toContain("<ChartReferenceDot")
    expect(doc).toMatch(/<ChartReferenceLine[^>]*label=/)
    expect(doc).toContain('valueLabels="selected"')
    expect(doc).toContain("partial={")
  })
})

describe("Chart: o eixo X sem a calha do Y e o rótulo do ponto no topo (21/11/2026)", () => {
  const f = semComentarios(CODIGO)
  const trechoDe = (nome: string) => {
    const ini = f.indexOf(`function ${nome}(`)
    return f.slice(ini, f.indexOf("\nfunction ", ini + 10))
  }
  it("a área sem eixo Y recua o eixo X, para o primeiro mês não sumir", () => {
    expect(f).toContain("const CHART_X_INSET = { left: 12, right: 12 }")
    expect(trechoDe("ChartArea")).toContain("padding={yAxis ? undefined : CHART_X_INSET}")
  })
  it("o rótulo do ponto desce para baixo dele quando não cabe acima", () => {
    expect(trechoDe("ChartReferenceDotLabel")).toContain("cy - 19 < 0 ? cy + 18 : cy - 10")
  })
  it("área, linha e barras tiram as linhas do fundo com grid={false}", () => {
    for (const nome of ["ChartArea", "ChartLine", "ChartBars"]) {
      const t = trechoDe(nome)
      expect(t).toContain("grid?: boolean")
      expect(t).toContain("grid = true")
      expect(t).toMatch(/\{grid \? <ChartGrid/)
    }
  })
  it("a área sem eixo Y abre 20px no topo, para o rótulo do ponto caber acima", () => {
    expect(f).toContain("const CHART_AREA_HEADROOM = { top: 20, right: 5, bottom: 5, left: 5 }")
    expect(trechoDe("ChartArea")).toContain("margin={yAxis ? undefined : CHART_AREA_HEADROOM}")
  })
})

describe("Chart: a dica enxuta de uma série, com a comparação (21/11/2026)", () => {
  const config = { total: { label: "Carro" } }
  const meses = [
    { mes: "ago", total: 100 },
    { mes: "set", total: 110 },
  ]
  const dica = (props: Record<string, unknown>) =>
    renderToStaticMarkup(
      // O `overlay` mora dentro do contexto e fora do `ResponsiveContainer`, que no servidor não desenha os filhos.
      h(ChartContainer, {
        config,
        children: h("svg"),
        overlay: h(ChartTooltipContent, {
          active: true,
          format: "currency",
          label: "set",
          payload: [{ dataKey: "total", name: "total", value: 110, payload: meses[1] }],
          ...props,
        }),
      })
    )

  it("a forma single não desenha o marcador nem o nome, e o valor sai em text-base", () => {
    const html = dica({ variant: "single" })
    expect(html).toContain('data-variant="single"')
    expect(html).not.toContain("Carro")
    expect(html).not.toContain("--indicator-bg")
    expect(html).toMatch(/text-base[^"]*font-semibold/)
    expect(html).toContain("set")
    // Sem referência nem delta, não há linha de comparação.
    expect(html).not.toContain("chart-tooltip-compare")
    // A forma padrão segue com o nome e o marcador.
    const padrao = dica({})
    expect(padrao).toContain("Carro")
    expect(padrao).toContain("--indicator-bg")
  })

  it("a comparação junta referência e anterior com ' · ', e labelText legenda o cabeçalho e o anterior", () => {
    const rotulo = (x: unknown) => ({ ago: "agosto", set: "setembro" })[String(x)] ?? String(x)
    const html = dica({
      variant: "single",
      reference: { value: 91, label: "média", better: "lower" },
      delta: { data: meses, x: "mes" },
      labelText: rotulo,
    })
    expect(html).toContain("Setembro")
    expect(html).toMatch(/\+21%<\/span> vs média<\/span> · <span><span[^>]*>\+10%<\/span> vs agosto/)
    // Referência zero não compara; só o anterior fica, sem separador.
    const soAnterior = dica({ variant: "single", reference: { value: 0, label: "média" }, delta: { data: meses, x: "mes" } })
    expect(soAnterior).not.toContain("média")
    expect(soAnterior).not.toContain(" · ")
  })

  it("o tom vem de better: pior em warning, melhor em success, sem better neutro", () => {
    const ref = (better?: "lower" | "higher") => dica({ variant: "single", reference: { value: 91, label: "média", better } })
    expect(ref("lower")).toContain("text-warning-muted-foreground")
    expect(ref("higher")).toContain("text-success-muted-foreground")
    expect(ref()).not.toMatch(/text-(warning|success)-muted-foreground/)
  })

  it("área, linha e barras passam single só com uma série; área e linha prendem a dica no topo", () => {
    expect(CODIGO.match(/variant=\{chaves\.length === 1 \? "single" : "default"\}/g)?.length).toBe(3)
    expect(CODIGO.match(/reference=\{tooltipReference\}/g)?.length).toBe(3)
    expect(CODIGO.match(/labelText=\{tooltipLabel\}/g)?.length).toBe(3)
    expect(CODIGO.match(/position=\{chaves\.length === 1 \? \{ y: 0 \} : undefined\}/g)?.length).toBe(1)
    expect(CODIGO).toContain("position={chaves.length === 1 || tooltipDifference ? { y: 0 } : undefined}")
  })
  it("a variação que arredonda a zero não leva sinal, e a referência inválida não entra", () => {
    const fonte = lerFonte("src/components/ui/chart.tsx")
    expect(fonte).toContain("=== 0) return texto")
    expect(fonte).toContain("reference && Number.isFinite(reference.value) && reference.value !== 0")
  })
})

describe("Chart: faixa, previsto, ticks e posições de rótulo no gráfico de linha (21/11/2026)", () => {
  const f = semComentarios(CODIGO)
  const trechoDe = (nome: string) => {
    const ini = f.indexOf(`function ${nome}(`)
    return f.slice(ini, f.indexOf("\nfunction ", ini + 10))
  }
  it("band é uma Area atrás das linhas, a 14%, sem traço nem ponto, fora da dica e da legenda", () => {
    const t = trechoDe("ChartLine")
    expect(t).toContain("band?: { dataKey: string; color: string }")
    const area = t.slice(t.indexOf("<Area"), t.indexOf("/>", t.indexOf("<Area")))
    expect(area).toContain("dataKey={band.dataKey}")
    expect(area).toContain("fillOpacity={0.14}")
    expect(area).toContain('stroke="none"')
    expect(area).toContain("dot={false}")
    expect(area).toContain("activeDot={false}")
    expect(area).toContain('tooltipType="none"')
    expect(area).toContain('legendType="none"')
    // O `LineChart` não desenha `Area`: com a faixa, o gráfico é `ComposedChart`.
    expect(t).toContain("const Grafico = band ? ComposedChart : LineChart")
    // Atrás: desenhada antes das linhas.
    expect(t.indexOf("<Area")).toBeLessThan(t.search(/<Line\s/))
  })
  it("ghost é a linha tracejada 3 4 a 60%, fora da dica e da legenda", () => {
    const t = trechoDe("ChartLine")
    expect(t).toContain("ghost?: { dataKey: string; color: string; label?: string }")
    expect(f).toContain('const CHART_GHOST_DASH = "3 4"')
    const ini = t.indexOf("dataKey={ghost.dataKey}")
    const linha = t.slice(ini, t.indexOf("/>", ini))
    expect(linha).toContain("strokeDasharray={CHART_GHOST_DASH}")
    expect(linha).toContain("strokeOpacity={0.6}")
    expect(linha).toContain("dot={false}")
    expect(linha).toContain('tooltipType="none"')
    expect(linha).toContain('legendType="none"')
  })
  it("xTicks chega ao ticks do eixo X, com interval 0, na linha, na área e nas barras", () => {
    expect(f).toContain("ticks: xTicks, interval: 0")
    for (const nome of ["ChartLine", "ChartArea", "ChartBars"]) {
      const t = trechoDe(nome)
      expect(t).toContain("xTicks?: (string | number)[]")
      expect(t).toContain("{...xTicksProps(xTicks)}")
    }
  })
  it("a linha sem eixo Y abre o topo e recua o X, como a área", () => {
    const t = trechoDe("ChartLine")
    expect(t).toContain("margin={yAxis ? undefined : CHART_AREA_HEADROOM}")
    expect(t).toContain("padding={yAxis ? undefined : CHART_X_INSET}")
  })
  it("o ponto anotado põe o rótulo embaixo, alinha no fim e pode ser cheio", () => {
    const t = trechoDe("ChartReferenceDot")
    expect(t).toContain('labelPosition = "top"')
    expect(t).toContain('labelAlign?: "middle" | "end"')
    expect(t).toContain("hollow = true")
    expect(t).toContain('fill={hollow ? "var(--chart-surface)" : traco}')
    expect(t).toContain('stroke={hollow ? traco : "var(--chart-surface)"}')
    const r = trechoDe("ChartReferenceDotLabel")
    expect(r).toContain('lado === "bottom" ? cy + 16')
    expect(r).toContain("textAnchor={ancora ?? (")
  })
  it("o rótulo do ponto pode ir na cor do ponto (labelTone=\"series\")", () => {
    const t = trechoDe("ChartReferenceDot")
    expect(t).toContain('labelTone = "foreground"')
    expect(t).toContain('tinta={labelTone === "series" ? traco : undefined}')
    const r = trechoDe("ChartReferenceDotLabel")
    expect(r).toContain("fill={tinta}")
    expect(r).toContain('!tinta && "fill-foreground"')
  })
  it("a anotação leva o rótulo ao pé da área com labelPosition=\"bottom\"", () => {
    const t = trechoDe("ChartAnnotation")
    expect(t).toContain('labelPosition?: "top" | "bottom"')
    expect(t).toContain("(p.viewBox?.y ?? 0) + (p.viewBox?.height ?? 0) - 4")
  })
  it("a dica de duas séries ignora as chaves fora do config", () => {
    const config = { atual: { label: "Novembro" }, anterior: { label: "Outubro" } }
    const linha = { dia: 21, atual: 3063, anterior: 3740, veu: [3063, 3740], previsto: 3063 }
    const html = renderToStaticMarkup(
      h(ChartContainer, {
        config,
        children: h("svg"),
        overlay: h(ChartTooltipContent, {
          active: true,
          format: "currency",
          label: 21,
          payload: [
            { dataKey: "veu", name: "veu", value: 3063, payload: linha },
            { dataKey: "atual", name: "atual", value: 3063, payload: linha },
            { dataKey: "anterior", name: "anterior", value: 3740, payload: linha },
            { dataKey: "previsto", name: "previsto", value: 3063, payload: linha },
          ],
        }),
      })
    )
    expect(html).toContain("Novembro")
    expect(html).toContain("Outubro")
    expect(html).not.toContain(">veu<")
    expect(html).not.toContain(">previsto<")
    expect(html.match(/--indicator-bg/g)?.length).toBe(2)
  })
  it("o rótulo numérico (o dia) é o cabeçalho da dica, e não o nome da série", () => {
    const html = renderToStaticMarkup(
      h(ChartContainer, {
        config: { atual: { label: "Novembro" } },
        children: h("svg"),
        overlay: h(ChartTooltipContent, {
          active: true,
          label: 21,
          labelText: (d: unknown) => `dia ${d}`,
          payload: [{ dataKey: "atual", name: "atual", value: 3063 }],
        }),
      })
    )
    expect(html).toContain("Dia 21")
  })
  it("a página do catálogo mostra o ritmo com as cinco peças", () => {
    const doc = lerFonte("src/app/designsystem/docs/chart.tsx")
    expect(doc).toMatch(/band=\{\{/)
    expect(doc).toMatch(/ghost=\{\{/)
    expect(doc).toContain("xTicks={")
    expect(doc).toContain('labelPosition="bottom"')
    expect(doc).toContain("hollow={false}")
  })
  describe("a dica de várias séries: respiro, traço, diferença e previsto (21/11/2026)", () => {
    const config = { atual: { label: "novembro" }, anterior: { label: "outubro", dashed: true } }
    const dica = (atual: number | null, anterior: number, props: Record<string, unknown> = {}) => {
      const linha = { dia: 17, atual, anterior, previsto: 2150 }
      return renderToStaticMarkup(
        h(ChartContainer, {
          config,
          children: h("svg"),
          overlay: h(ChartTooltipContent, {
            active: true,
            format: "currency",
            label: 17,
            indicator: "stroke",
            payload: [
              { dataKey: "atual", name: "atual", value: atual, payload: linha },
              { dataKey: "anterior", name: "anterior", value: anterior, payload: linha },
            ],
            ...props,
          }),
        })
      )
    }
    it("a dica padrão tem o respiro da enxuta", () => {
      expect(dica(2098.6, 948.3)).toMatch(/data-slot="chart-tooltip-content"[^>]*class="[^"]*gap-2 px-3\.5 py-2\.5/)
    })
    it("a amostra stroke é um traço, tracejado 4 3 na série dashed", () => {
      const html = dica(2098.6, 948.3)
      expect(html.match(/data-indicator="stroke"/g)?.length).toBe(2)
      expect(html).toContain('data-dash="4 3"')
    })
    it("o rodapé diz a diferença com sinal, no tom do veredito", () => {
      const html = dica(2098.6, 948.3, { difference: { better: "lower" } })
      const rodape = html.slice(html.indexOf('data-slot="chart-tooltip-difference"'))
      expect(rodape).toContain("diferença")
      expect(rodape).toMatch(/\+R\$\s1\.150,30/)
      expect(rodape).toContain("text-warning-muted-foreground")
      expect(dica(948.3, 2098.6, { difference: { better: "lower" } })).toContain("text-success-muted-foreground")
      expect(dica(500, 500, { difference: {} })).toContain(">igual<")
    })
    it("sem diferença pedida, ou com os dois valores zero, não há rodapé", () => {
      expect(dica(2098.6, 948.3)).not.toContain("chart-tooltip-difference")
      expect(dica(0, 0, { difference: { better: "lower" } })).not.toContain("chart-tooltip-difference")
    })
    it("com a primeira série vazia, o ghost vira a linha previsto e a diferença sai dele", () => {
      const html = dica(null, 1020, { difference: { better: "lower" }, ghost: { dataKey: "previsto" } })
      expect(html).toContain(">previsto<")
      expect(html).toMatch(/R\$\s2\.150,00/)
      expect(html).toContain('data-dash="2 3"')
      expect(html).toContain("opacity-75")
      expect(html).not.toContain(">novembro<")
      expect(html).toMatch(/\+R\$\s1\.130,00/)
    })
    it("o ChartLine liga o traço, o previsto e a diferença", () => {
      const t = trechoDe("ChartLine")
      expect(t).toContain("tooltipDifference?: { better?: \"lower\" | \"higher\"; label?: string }")
      expect(t).toContain("ghost?: { dataKey: string; color: string; label?: string }")
      expect(t).toContain('indicator={chaves.length > 1 ? "stroke" : "dot"}')
      expect(t).toContain("difference={tooltipDifference}")
      expect(t).toContain("filterNull={!ghost}")
    })
  })
  describe("a rosca com detalhe na legenda e forma arredondada", () => {
    const base = {
      nameKey: "forma",
      dataKey: "valor",
      config: { cartao: { label: "Bradesco Visa Infinity" }, pix: { label: "Pix" } },
      data: [
        { forma: "cartao", valor: 1360 },
        { forma: "pix", valor: 640 },
      ],
      legend: "list" as const,
      label: "Como foi pago",
    }
    it("legendDetail escreve o nó embaixo do nome e tira a coluna do valor", () => {
      const html = renderToStaticMarkup(
        h(ChartDonut, { ...base, legendDetail: (i: number) => (i === 0 ? "R$ 1.360 · +312" : "novo") })
      )
      expect(html).toContain("R$ 1.360 · +312")
      expect(html).toContain('data-slot="chart-donut-legend-detail"')
      expect(html).not.toContain("@max-xs/chart-donut:hidden")
      expect(html).toContain("68%")
    })
    it("sem legendDetail a linha segue com o valor", () => {
      const html = renderToStaticMarkup(h(ChartDonut, base))
      expect(html).not.toContain("chart-donut-legend-detail")
      expect(html).toContain("@max-xs/chart-donut:hidden")
    })
    it("rounded passa o raio de 4, o respiro de 3 (0 com uma fatia) e zera o traço", () => {
      const fonte = semComentarios(CODIGO)
      expect(fonte).toContain("paddingAngle={rounded ? (data.length > 1 ? 3 : 0) : 1}")
      expect(fonte).toContain("cornerRadius={rounded ? 4 : undefined}")
      expect(fonte).toContain("strokeWidth={rounded ? 0 : 2}")
      expect(fonte).toMatch(/rounded = false/)
    })
    it("a página do catálogo mostra a rosca da forma de pagamento", () => {
      const doc = lerFonte("src/app/designsystem/docs/chart.tsx")
      expect(doc).toContain("legendDetail={")
      expect(doc).toContain("Bradesco Visa Infinity")
    })
  })
  describe("a divisão só com a barra", () => {
    const base = {
      nameKey: "forma",
      dataKey: "valor",
      config: { pix: { label: "PIX", color: "var(--chart-2)" }, cartao: { label: "Bradesco Visa Infinity", color: "var(--chart-3)" } },
      data: [
        { forma: "pix", valor: 2000 },
        { forma: "cartao", valor: 1063 },
      ],
      label: "Como foi pago",
    }
    it('labels="none" desenha só a barra, sem rótulos nem legenda, e o nome acessível mantém o resumo', () => {
      const html = renderToStaticMarkup(h(ChartSplit, { ...base, labels: "none" as const }))
      expect(html).toContain('data-slot="chart-split-bar"')
      expect(html).not.toContain("chart-legend-content")
      expect(html).not.toContain('data-slot="chart-split-labels"')
      expect(html).toContain("Como foi pago: PIX 65%")
      expect(html).toContain("Bradesco Visa Infinity 35%")
    })
    it("o padrão segue com a fileira de rótulos", () => {
      const html = renderToStaticMarkup(h(ChartSplit, base))
      expect(html).toContain('data-slot="chart-split-labels"')
    })
    it("ChartSwatch é a amostra de 8px, e a legenda a usa", () => {
      const html = renderToStaticMarkup(h(ChartSwatch, { color: "var(--chart-2)" }))
      expect(html).toContain('data-slot="chart-swatch"')
      expect(html).toContain("size-2")
      expect(html).toContain("background-color:var(--chart-2)")
      const fonte = semComentarios(CODIGO)
      expect(fonte).toMatch(/<ChartSwatch color=\{item\.color\} \/>/)
    })
    it("a página do catálogo mostra a divisão da forma de pagamento sem rótulos", () => {
      const doc = lerFonte("src/app/designsystem/docs/chart.tsx")
      expect(doc).toContain('labels="none"')
      expect(doc).toContain("<ChartSwatch")
    })
  })

  describe("ChartHeatStrip", () => {
    const dias = [
      { nome: "Seg", total: 2080 },
      { nome: "Ter", total: 170 },
      { nome: "Qua", total: 0 },
    ]
    const html = renderToStaticMarkup(
      h(ChartHeatStrip, {
        data: dias,
        nameKey: "nome",
        dataKey: "total",
        color: "var(--chart-2)",
        label: "Gasto por dia da semana",
        labelText: (n: unknown) => ({ Seg: "segunda", Ter: "terça", Qua: "quarta" })[String(n)] ?? String(n),
      })
    )

    it("é exportada e desenha uma célula por linha", () => {
      expect(typeof ChartHeatStrip).toBe("function")
      expect(html.match(/data-slot="chart-heat-strip-cell"/g)).toHaveLength(3)
    })
    it("o maior dia fica a 100%, o pequeno no piso de 12%, e o zerado tracejado sem fundo", () => {
      expect(html).toContain("color-mix(in oklab, var(--chart-2) 100%, transparent)")
      expect(html).toContain("color-mix(in oklab, var(--chart-2) 12%, transparent)")
      const zerada = html.match(/<span[^>]*data-value="0"[^>]*>/)?.[0] ?? ""
      expect(zerada).toContain("border-dashed")
      expect(zerada).not.toContain("color-mix")
    })
    it("o nome acessível lista os dias com o valor", () => {
      expect(html).toContain('role="img"')
      expect(html).toMatch(/aria-label="Gasto por dia da semana: Segunda R\$\s2\.080,00, Terça R\$\s170,00, Quarta R\$\s0,00"/)
    })
  })

  describe("ChartStrip", () => {
    const compras = [
      { id: "a", valor: 2000 },
      { id: "b", valor: 240 },
      { id: "c", valor: 12 },
    ]
    const html = renderToStaticMarkup(
      h(ChartStrip, {
        data: compras,
        nameKey: "id",
        dataKey: "valor",
        color: "var(--chart-2)",
        highlight: 2,
        label: "2 de 3 compras fizeram 80% do mês",
        labelText: (id: unknown) => `compra ${String(id)}`,
      })
    )

    it("desenha um bloco por linha, na largura do valor, 28px de altura e 2px de vão", () => {
      expect(html.match(/data-slot="chart-strip-block"/g)).toHaveLength(3)
      expect(html).toContain("flex:2000 1 0")
      expect(html).toContain("flex:12 1 0")
      expect(html).toMatch(/data-slot="chart-strip"[^>]*class="[^"]*gap-0\.5/)
      const bloco = html.match(/<span[^>]*data-slot="chart-strip-block"[^>]*>/)?.[0] ?? ""
      expect(bloco).toContain("h-7")
      expect(bloco).toContain("min-w-0.5")
      expect(bloco).toContain("rounded-sm")
    })
    it("as `highlight` primeiras na cor, o resto em --muted", () => {
      const fundos = [...html.matchAll(/data-slot="chart-strip-block"[^>]*style="[^"]*background-color:([^;"]+)/g)].map((m) => m[1])
      expect(fundos).toEqual(["var(--chart-2)", "var(--chart-2)", "var(--muted)"])
    })
    it("o nome acessível é o `label`, sem listar os blocos", () => {
      expect(html).toContain('role="img"')
      expect(html).toContain('aria-label="2 de 3 compras fizeram 80% do mês"')
    })
    it("a dica é a enxuta, por bloco, no cursor e no toque", () => {
      const fonte = semComentarios(CODIGO)
      const corpo = fonte.slice(fonte.indexOf("function ChartStrip"))
      const strip = corpo.slice(0, corpo.indexOf("\nfunction ", 10))
      expect(strip).toContain('variant="single"')
      expect(strip).toContain("labelText={labelText}")
      expect(strip).toContain("onPointerEnter")
      expect(strip).toContain("onPointerDown")
    })
  })
})
