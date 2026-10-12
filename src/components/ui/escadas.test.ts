import { describe, expect, it } from "vitest"

import { lerFonte, semComentarios } from "@/test/fonte"
import {
  esperarCrescente,
  esperarDistintos,
  esperarPasso,
  esperarSemClasseMontada,
} from "@/test/regras"

import { DISCLOSURE_ROW_HEIGHTS } from "@/lib/disclosure-classes"
import { FIELD_CONTROL_HEIGHTS, fieldControlHeightClassName } from "@/lib/field-classes"
import { bottomBarVariants } from "./bottom-bar"
import { carouselGapClasses } from "./carousel"
import { chartContainerVariants } from "./chart"
import { containerSizes } from "./container"
import { fieldTextScale } from "./field"
import { itemVariants } from "./item"
import { pageHeaderVariants } from "./page-header"
import { pageSectionVariants } from "./page-section"
import { paginationSteps, paginationVariants } from "./pagination"
import { tableVariants } from "./table"
import { TABS_SIZES, TABS_TRAY_HEIGHTS } from "./tabs"
import { timelineVariants } from "./timeline"
import { TOOLBAR_CONTROL_HEIGHTS } from "./toolbar"
import { topBarVariants } from "./top-bar"

/**
 * As regras que toda escada de tamanho cumpre, numa tabela só. O que é de uma
 * peça só mora no `<peça>-versions.test.ts` dela.
 *
 * Cada linha lê o que o teste de escada de origem lia, e só liga as regras
 * que ele cobrava: uma escada sem `classes` não tinha a asserção de degraus
 * distintos, e assim por diante.
 */
type Escada = {
  nome: string
  /** O que cada degrau produz, na ordem da escada: nenhum par repete. */
  classes?: () => readonly unknown[]
  /** A medida de cada degrau (altura, calha, recuo), do menor ao maior. */
  medidas?: () => readonly number[]
  /** `false` quando a escada pode repetir degrau — o recuo da `Table` para em 16. */
  estrito?: boolean
  /** O passo exato entre dois degraus de `medidas`, em px. */
  passo?: number
  /** O código varrido atrás de classe montada por interpolação. */
  codigo?: () => string
}

const ITEM = ["sm", "md", "lg"] as const
const itemMedida = (prefixo: string) => () =>
  ITEM.map((size) =>
    Number(
      itemVariants({ size, variant: "plain" })
        .split(/\s+/)
        .find((c) => c.startsWith(prefixo))
        ?.slice(prefixo.length)
    )
  )

const TABELA = ["xs", "sm", "md", "lg", "xl"] as const
const tabelaMedida = (nome: string) => () =>
  TABELA.map((size) => {
    const m = tableVariants({ variant: "plain", size }).match(new RegExp(`--${nome}:--spacing\\(([\\d.]+)\\)`))
    return m ? Number(m[1]) : NaN
  })

const LINHA_DO_TEMPO = ["sm", "md", "lg"] as const
const linhaDoTempoMedida = (eixo: string) => () =>
  LINHA_DO_TEMPO.map((size) =>
    Number(
      timelineVariants({ size })
        .match(new RegExp(`\\[--tl-${eixo}:([^\\]]+)\\]`))?.[1]
        ?.match(/--spacing\(([\d.]+)\)/)?.[1]
    )
  )

const CALHA = ["none", "sm", "md", "lg"] as const
/** A magnitude, sem o sinal: o trilho recua o que o item avança. */
const calhaMedida = (classe: string) => {
  const m = classe.match(/(\d+(?:\.\d+)?)$/)
  return m ? Number(m[1]) : 0
}
const calha = (eixo: "horizontal" | "vertical"): Escada => ({
  nome: `Carousel ${eixo}`,
  classes: () => CALHA.map((g) => `${carouselGapClasses[eixo][g].track}|${carouselGapClasses[eixo][g].item}`),
  medidas: () => CALHA.map((g) => calhaMedida(carouselGapClasses[eixo][g].track)),
  estrito: false,
})

const TABS = ["sm", "md", "lg", "xl"] as const
const PAGINAS = ["xs", "sm", "md", "lg"] as const
const CAMPO = ["sm", "md", "lg", "xl"] as const
const CABECALHO = ["sm", "md", "lg"] as const
const BARRA_DE_BAIXO = () => [false, true].map((labels) => bottomBarVariants({ labels }))

const ESCADAS: Escada[] = [
  {
    nome: "BottomBar",
    classes: BARRA_DE_BAIXO,
    medidas: () =>
      BARRA_DE_BAIXO().map((classes) => {
        const m = classes.match(/\[--bottom-bar-h:([\d.]+)rem\]/)
        return m ? Number(m[1]) : NaN
      }),
    // O marcador escreve a própria caixa em `setProperty(…, `${…}px`)`: valor
    // de variável em runtime, e não classe. Essas linhas saem da varredura.
    codigo: () =>
      semComentarios(lerFonte("src/components/ui/bottom-bar.tsx")).replace(/^.*\.setProperty\(.*$/gm, ""),
  },
  calha("horizontal"),
  calha("vertical"),
  {
    nome: "Chart",
    classes: () =>
      (["video", "wide", "standard", "square", "auto"] as const).map((aspect) =>
        chartContainerVariants({ aspect })
          .split(/\s+/)
          .find((c) => c.startsWith("aspect-"))
      ),
  },
  { nome: "Container", classes: () => Object.values(containerSizes) },
  {
    nome: "Disclosure",
    medidas: () => (["md", "lg", "xl"] as const).map((d) => DISCLOSURE_ROW_HEIGHTS[d]),
    passo: 4,
  },
  {
    nome: "Field",
    classes: () => (["sm", "md"] as const).map((d) => JSON.stringify(fieldTextScale[d])),
  },
  {
    nome: "campo (field-classes)",
    classes: () => CAMPO.map((d) => fieldControlHeightClassName[d]),
    medidas: () => CAMPO.map((d) => FIELD_CONTROL_HEIGHTS[d]),
    passo: 4,
  },
  { nome: "Item", classes: () => ITEM.map((size) => itemVariants({ size, variant: "plain" })) },
  { nome: "Item · gap", medidas: itemMedida("gap-") },
  { nome: "Item · px", medidas: itemMedida("px-") },
  { nome: "Item · py", medidas: itemMedida("py-") },
  {
    nome: "PageHeader",
    classes: () => CABECALHO.map((size) => pageHeaderVariants({ size })),
    medidas: () =>
      CABECALHO.map((size) =>
        Number(pageHeaderVariants({ size }).match(/(?<!sm:)\[--page-title:([\d.]+)rem\]/)?.[1])
      ),
  },
  { nome: "PageSection", classes: () => CABECALHO.map((size) => pageSectionVariants({ size })) },
  { nome: "Pagination", classes: () => PAGINAS.map((size) => paginationVariants({ size })) },
  { nome: "Pagination · geometria", classes: () => PAGINAS.map((s) => JSON.stringify(paginationSteps[s])) },
  { nome: "Table", classes: () => TABELA.map((size) => tableVariants({ variant: "plain", size })) },
  { nome: "Table · cabeçalho", medidas: tabelaMedida("table-head-h") },
  // Do `md` para cima o recuo fica em 16, o `--card-strip-px`: não desce, e repete.
  { nome: "Table · recuo", medidas: tabelaMedida("table-px"), estrito: false },
  {
    nome: "Tabs · bandeja",
    classes: () => TABS.map((s) => TABS_SIZES[s].tray),
    medidas: () => TABS.map((s) => TABS_SIZES[s].tray),
    estrito: false,
  },
  { nome: "Tabs · gatilho", classes: () => TABS.map((s) => TABS_SIZES[s].trigger) },
  { nome: "Tabs · TABS_TRAY_HEIGHTS", medidas: () => TABS.map((s) => TABS_TRAY_HEIGHTS[s]), passo: 4 },
  { nome: "Timeline", classes: () => LINHA_DO_TEMPO.map((size) => timelineVariants({ size })) },
  ...["dot", "well-size", "icon", "pad", "rail-gap"].map(
    (eixo): Escada => ({ nome: `Timeline · ${eixo}`, medidas: linhaDoTempoMedida(eixo) })
  ),
  {
    nome: "Toolbar",
    medidas: () => [TOOLBAR_CONTROL_HEIGHTS.fine, TOOLBAR_CONTROL_HEIGHTS.coarse],
  },
  {
    nome: "TopBar",
    classes: () => (["sm", "md"] as const).map((size) => topBarVariants({ size })),
    codigo: () => semComentarios(lerFonte("src/components/ui/top-bar.tsx")),
  },
]

describe.each(ESCADAS)("escada $nome", (e) => {
  if (e.classes) it("os degraus são distintos", () => esperarDistintos(e.classes!()))
  if (e.medidas)
    it("a medida cresce", () => {
      const medidas = e.medidas!()
      expect(medidas.every(Number.isFinite), "degrau ilegível").toBe(true)
      esperarCrescente(medidas, { estrito: e.estrito ?? true })
    })
  if (e.passo) it(`o passo é de ${e.passo}px`, () => esperarPasso(e.medidas!(), e.passo!))
  if (e.codigo) it("nenhuma classe é montada em tempo de execução", () => esperarSemClasseMontada(e.codigo!()))
})
