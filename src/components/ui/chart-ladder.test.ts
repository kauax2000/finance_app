import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

import {
  chartContainerVariants,
  chartSeriesColor,
  formatChartValue,
  type ChartFormat,
} from "./chart"

/**
 * O gráfico, trancado.
 *
 * Este teste existe por causa de defeitos medidos, não por completude:
 *
 * - **O foco de teclado estava apagado.** A versão anterior escrevia
 *   `outline-hidden` em `.recharts-layer`, `.recharts-sector` e
 *   `.recharts-surface` — e o que isso apagava era o anel que o
 *   `accessibilityLayer` do Recharts v3 desenha, ligado de fábrica na 3.8.0
 *   instalada aqui. Uma tela chegava a passar `accessibilityLayer={false}`.
 * - **O tooltip formatava com `numberBR`.** Num app de finanças, uma série em
 *   reais saía `8.432`, sem `R$` — e foi por isso que sete das oito telas
 *   escreveram a própria tooltip, com o próprio `Intl` redeclarado.
 * - **A rampa tem cinco degraus e o app pedia seis.** `BAR_COLORS[idx % 5]`
 *   dá duas barras da mesma cor a quem tem seis cartões.
 * - **A base da barra arredondava junto com a ponta**, o que levanta a marca
 *   da linha do zero — que é justamente onde um gráfico de barras diz a
 *   magnitude.
 */

const FONTE = readFileSync(new URL("./chart.tsx", import.meta.url), "utf8")

/**
 * O mesmo fonte sem comentários. Metade das asserções abaixo pergunta o que o
 * componente **faz**, e os comentários dele citam de propósito o que ele
 * deixou de fazer — `outline-hidden`, `Intl.NumberFormat`, `% 5`. Sem esta
 * separação, cada defeito documentado reprovaria o teste que existe para
 * impedi-lo de voltar. É a mesma correção que o auditor já fez em `lineOf`.
 */
const CODIGO = FONTE.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")

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
    // O nome `default` dizia *o padrão* em vez de dizer a medida, e saiu de
    // `Button`, `Input`, `SelectTrigger`, `NativeSelect` e `Container`.
    expect(CODIGO).not.toMatch(/^\s*default:\s*"aspect-/m)
  })

  it("2. nenhum par de degraus produz a mesma string", () => {
    const vistos = new Map<string, string>()
    for (const aspect of ASPECTOS) {
      const classes = chartContainerVariants({ aspect })
      const proporcao = classes
        .split(/\s+/)
        .find((c) => c.startsWith("aspect-"))
      expect(proporcao, `${aspect} não declara proporção`).toBeTruthy()
      const anterior = vistos.get(proporcao!)
      expect(
        anterior,
        `"${aspect}" e "${anterior}" produzem ${proporcao}`
      ).toBeUndefined()
      vistos.set(proporcao!, aspect)
    }
  })

  it("3. o foco visível não volta a ser apagado — foi o defeito", () => {
    // Medido nas classes emitidas, e não no texto do arquivo: o comentário
    // acima cita `outline-hidden` de propósito, e uma asserção que casasse o
    // fonte estaria testando a digitação em vez do comportamento.
    expect(chartContainerVariants()).not.toContain("outline-hidden")

    // Suprimir o foco não-visível continua certo; o visível ganha o token.
    // A supressão vai na base **sem pseudo**, e não em `:focus`: empatada em
    // (0,2,0) com o anel, ela não perde — e como `outline-none` escreve
    // `outline-style` e `outline-2` escreve `outline-width`, as duas valiam
    // ao mesmo tempo e o anel saía com 2px de estilo `none`. Medido com `Tab`.
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
    // O eixo comprime e o tooltip não: são medidas diferentes, de propósito.
    // A 1.234,50 as duas escrevem 11 caracteres e o teste não diria nada; o
    // ganho aparece na ordem de grandeza em que um rótulo de eixo estoura.
    // Escrito com `\u00a0`, e isso não é preciosismo: o `Intl` separa com
    // espaço inseparável nos dois vãos, e uma asserção com o espaço do teclado
    // reprova comparando duas strings que se desenham iguais na tela.
    expect(formatChartValue(1234567, "compact")).toBe("R$\u00a01,23\u00a0mi")
    // E abaixo de mil ele larga os centavos: um eixo não os quer, e era o que
    // fazia o zero da base sair como "R$ 0,00".
    expect(formatChartValue(0, "compact")).toBe("R$\u00a00")
    expect(formatChartValue(600, "compact")).toBe("R$\u00a0600")
    expect(formatChartValue(600, "currency")).toBe("R$\u00a0600,00")
    expect(formatChartValue(1234567, "compact").length).toBeLessThan(
      formatChartValue(1234567, "currency").length
    )

    // A regra I do auditor: `Intl` mora em `lib/formatters` e
    // `lib/transaction-date`, e este arquivo era onde ela vazava.
    expect(CODIGO).not.toContain("Intl.")
  })

  it("5. a rampa tem cinco degraus, e o sexto não repete o primeiro", () => {
    const cinco = [0, 1, 2, 3, 4].map(chartSeriesColor)
    expect(new Set(cinco).size).toBe(5)
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
    // Arredondar os quatro cantos levanta a barra da linha do zero.
    expect(CODIGO).toContain("[4, 4, 0, 0]")
    expect(CODIGO).toContain("[0, 4, 4, 0]")
    expect(CODIGO).not.toMatch(/radius=\{4\}/)
    expect(CODIGO).not.toContain("[4, 4, 4, 4]")
  })

  it("7. o eixo de valor ancora em zero por padrão", () => {
    expect(CODIGO).toMatch(/domain = \[0, "auto"\]/)
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

  it("11. nenhuma marca anima ao montar — foi o que escondia as roscas", () => {
    // O Recharts anima de fábrica e não olha `prefers-reduced-motion`. Além de
    // hostil num app de finanças, era um defeito visível: medido, com a
    // animação ligada as barras e as áreas desenhavam na carga da página e as
    // roscas **só apareciam quando a pessoa rolava até elas**. Depois: 12
    // setores presentes sem rolagem nenhuma.
    expect(CODIGO).toContain("const CHART_ANIMATION = false")
    const marcas = CODIGO.match(/<(Area|Line|Bar|Pie)\b/g) ?? []
    const desligadas = CODIGO.match(/isAnimationActive=\{CHART_ANIMATION\}/g) ?? []
    expect(desligadas.length).toBe(marcas.length)
    // E nenhuma escreve o booleano à mão, que é como uma marca nova escaparia.
    expect(CODIGO).not.toMatch(/isAnimationActive=\{(true|false)\}/)
  })

  it("12. o anel da rosca fica centrado sobre a própria legenda", () => {
    // Com o alinhamento padrão (`stretch`) e uma largura própria no
    // `ChartContainer`, o anel encosta na esquerda de uma caixa que a legenda
    // define: medido, 208px de rosca num envelope de 412 saíam 102px fora do
    // centro. O medidor escondia o defeito, porque a legenda de dois itens é
    // mais estreita que o anel.
    expect(CODIGO).toContain('className="flex w-fit flex-col items-center"')
    // `w-fit` é `fit-content` e respeita o espaço disponível — é o que mantém
    // a legenda quebrando linha a 375px em vez de esticar o envelope.
    expect(CODIGO).not.toContain('className="flex w-fit flex-col"')
  })

  it("13. o medidor tem geometria própria, e não a da rosca", () => {
    // Com o anel da rosca a corda interna na altura do topo do texto media
    // 42px e `76%` já ocupava 43 — encostava no arco. E o meio-arco num
    // quadrado deixava 68px mortos embaixo, que era o que afastava a legenda.
    expect(CODIGO).toContain("const chartGaugeThickness")
    expect(CODIGO).toContain("const CHART_GAUGE_OUTER = 130")
    expect(CODIGO).toContain("const CHART_GAUGE_CY = 86")

    // O arco do medidor é mais fino que o anel da rosca em todos os degraus —
    // é o que abre a corda de 42 para 103.
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

  it("10. as cinco formas curtas cobram o nome acessível", () => {
    // `label` é obrigatório em `ChartFormProps` — sem `?`. A composição livre
    // (`ChartContainer`) não cobra, porque ela não pode.
    expect(CODIGO).toMatch(/type ChartFormProps = \{[\s\S]*?\n {2}label: string\n/)
    expect(CODIGO).toMatch(/ {4}label\?: string\n/)
    expect(CODIGO).toContain('role={label ? "img" : undefined}')
  })
})
