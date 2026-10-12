import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggleAll,
  AccordionTrigger,
} from "./accordion"
import { esperarDepoisDeNoScrollbar } from "@/test/regras"
import {
  DISCLOSURE_ROW_HEIGHT_CLASS,
  DISCLOSURE_ROW_HEIGHTS,
  disclosureMarkerClassName,
  disclosureLabelClassName,
  disclosureRevealClassName,
  disclosureRowClassName,
} from "@/lib/disclosure-classes"

/** As versões do `Accordion` e do `Collapsible`. */

const FONTE = lerFonte("src/components/ui/accordion.tsx")

const item = (value: string, trigger: Record<string, unknown>, content: Record<string, unknown> = {}) =>
  h(
    AccordionItem,
    { key: value, value },
    h(AccordionTrigger, trigger as never),
    h(AccordionContent, { children: "Resposta.", ...content } as never)
  )

const render = (props: Record<string, unknown>, ...filhos: ReturnType<typeof h>[]) =>
  renderToStaticMarkup(h(Accordion, props as never, ...filhos))

describe("Accordion", () => {
  it("o gatilho leva ícone e descrição, e só o rótulo sublinha", () => {
    const html = render(
      { type: "single", collapsible: true },
      item("a", { icon: h("svg"), description: "4 transações", children: "Mercado" })
    )
    expect(html).toMatch(/data-slot="accordion-trigger-icon" aria-hidden="true"/)
    expect(html).toMatch(/data-slot="accordion-trigger-content" class="flex min-w-0 flex-1 flex-col"/)
    expect(html).toMatch(/data-slot="accordion-trigger-description" class="[^"]*font-normal/)
    expect(html).not.toMatch(/data-slot="accordion-trigger-description" class="[^"]*underline/)
  })

  it("o conteúdo alinha com o rótulo, somando a seta e o ícone", () => {
    expect(FONTE).toContain(
      "ps-[calc(var(--accordion-px)+var(--accordion-marker-ps,0px)+var(--accordion-icon-ps,0px))]"
    )
    const html = render(
      { type: "single", markerSide: "start" },
      item("a", { icon: h("svg"), children: "Mercado" })
    )
    expect(html).toContain("[--accordion-marker-ps:--spacing(7)]")
    expect(html).toContain("has-[[data-slot=accordion-trigger-icon]]:[--accordion-icon-ps:--spacing(7)]")
  })

  it("o abrir todos só existe no multiple, e lê o estado", () => {
    const unico = render({ type: "single" }, h(AccordionToggleAll, { key: "t" }), item("a", { children: "A" }))
    expect(unico).not.toContain('data-slot="accordion-toggle-all"')
    const varios = render(
      { type: "multiple", defaultValue: [] },
      h(AccordionToggleAll, { key: "t" }),
      item("a", { children: "A" })
    )
    expect(varios).toContain('data-slot="accordion-toggle-all"')
    expect(varios).toContain("Abrir todos")
    expect(varios).toContain('aria-expanded="false"')
  })

  it("o encontrável fica montado, e a mecânica é a do hook", () => {
    const html = render({ type: "single", collapsible: true }, item("a", { children: "A" }, { findable: true }))
    // Fechado e montado: a resposta está no HTML para o ⌘F achar.
    expect(html).toContain("Resposta.")
    expect(FONTE).toContain("useUntilFound(")
    expect(FONTE).toContain("forceMount={findable ? true : forceMount}")
    // Quem abre tira o atributo antes de o Radix medir.
    expect(FONTE).toMatch(/revelar\(raiz\.current, proximo\.filter/)
  })

  it("o estado mora na raiz, com defaultValue como semente", () => {
    const html = render(
      { type: "multiple", defaultValue: ["b"] },
      item("a", { children: "A" }),
      item("b", { children: "B" })
    )
    expect(html).toMatch(/data-value="b"[^>]*data-state="open"|data-state="open"[^>]*data-value="b"/)
    expect(html).toMatch(/data-value="a"[^>]*data-state="closed"|data-state="closed"[^>]*data-value="a"/)
  })
})

/**
 * A escada da linha de divulgação, trancada. Ancorar a escada no contêiner (como `Menubar` e
 * `Tabs`) deixa a altura do gatilho um resto de subtração; a linha do `Accordion` media um
 * `py-2.5` sem nome, e mudar o corpo do texto mudaria a altura. Segue o idioma de `tabs-
 * versions.test.ts`.
 */

const DEGRAUS = ["md", "lg", "xl"] as const

/**
 * O piso desta escada é 32, e não os 28 da escada de controles: a linha carrega uma frase, e a
 * 28 o texto encosta nas bordas.
 */
const PISO = 32

describe("a escada mede a linha", () => {
  it("nenhum degrau abaixo do piso de 32px", () => {
    for (const degrau of DEGRAUS) {
      expect(DISCLOSURE_ROW_HEIGHTS[degrau]).toBeGreaterThanOrEqual(PISO)
    }
  })

  /**
   * `md` é 32 no `Button`, no `Input`, no `SelectTrigger` e no `Tabs`, e tem que ser 32 aqui:
   * nenhum controle usa um nome para uma altura diferente.
   */
  it("os nomes batem com os do resto do sistema", () => {
    expect(DISCLOSURE_ROW_HEIGHTS).toEqual({ md: 32, lg: 36, xl: 40 })
  })

  it("cada degrau tem a classe da sua altura", () => {
    for (const degrau of DEGRAUS) {
      expect(DISCLOSURE_ROW_HEIGHT_CLASS[DISCLOSURE_ROW_HEIGHTS[degrau]]).toBe(
        `min-h-${DISCLOSURE_ROW_HEIGHTS[degrau] / 4}`
      )
    }
  })

  /**
   * `min-h` e nunca `h`: a frase quebra no telefone, e com `h-8` a segunda linha seria
   * recortada justo na largura que ninguém olha.
   */
  it("a altura é piso, não medida fixa", () => {
    for (const classe of Object.values(DISCLOSURE_ROW_HEIGHT_CLASS)) {
      expect(classe).toMatch(/^min-h-/)
    }
    // `(?:^|\s)h-` e não `\bh-`: `\b` casaria dentro de `min-h-11`.
    expect(disclosureRowClassName).not.toMatch(/(?:^|\s)h-(?!full\b)/)
  })
})

describe("o marcador é um só, e ele gira", () => {
  /**
   * Um marcador que gira, e não dois (`ChevronDown`/`ChevronUp`) se revezando: a seta para
   * baixo girada em 180° é a seta para cima.
   */
  it("o estado aberto é uma rotação, e não uma troca de glifo", () => {
    expect(disclosureMarkerClassName).toContain("rotate-180")
    expect(disclosureMarkerClassName).not.toContain("hidden")
  })

  /**
   * A transição nomeia as propriedades por extenso: `transition-transform` não cobre `color`, e
   * a tinta do marcador também muda no cursor.
   */
  it("a rotação tem trajeto, e a tinta viaja junto", () => {
    expect(disclosureMarkerClassName).toContain("transition-[rotate,translate,color]")
    expect(disclosureMarkerClassName).toContain("duration-(--duration-base)")
  })
})

describe("o realce não troca a cor de fundo", () => {
  /**
   * O realce não pinta fundo: o acordeão não sabe sobre o que está pousado (`Card`, `muted`,
   * diálogo, página). Mora no rótulo (sublinhado) e no marcador (tinta e empurrão), que não
   * dependem do fundo.
   */
  it("nenhuma classe de fundo em hover ou toque", () => {
    for (const classe of [disclosureRowClassName, disclosureLabelClassName]) {
      expect(classe).not.toMatch(/(?:hover|active):bg-/)
      expect(classe).not.toMatch(/group-(?:hover|active)\/disclosure:bg-/)
    }
  })

  /**
   * O sublinhado é do **rótulo**, e não da linha. O original ficava no botão, e
   * `text-decoration` desce para todo descendente em linha: o total em dinheiro
   * do slot `trailing` vinha sublinhado junto, o que lê como rasura.
   */
  it("o sublinhado é escopado ao rótulo, com par de toque", () => {
    expect(disclosureLabelClassName).toContain("group-hover/disclosure:underline")
    expect(disclosureLabelClassName).toContain("group-active/disclosure:underline")
    expect(disclosureRowClassName).not.toContain("underline")
  })

  /**
   * O empurrão depende de dois estados (cursor e aberto), e variante empilhada no mesmo
   * elemento compila uma cadeia que não casa com nada: a saída é a variável na raiz, como no
   * `ThemeToggle`.
   */
  it("a direção do empurrão vem de variável, não de variante empilhada", () => {
    expect(disclosureRowClassName).toContain("[--disclosure-nudge:")
    expect(disclosureMarkerClassName).toContain(
      "group-hover/disclosure:translate-y-(--disclosure-nudge)"
    )
    expect(disclosureMarkerClassName).not.toMatch(
      /group-hover\/disclosure:group-data-|group-data-\[state=open\]\/disclosure:group-hover/
    )
  })

  it("o alvo cresce em apontador grosso", () => {
    expect(disclosureRowClassName).toContain("pointer-coarse:min-h-11")
  })

  /**
   * O conteúdo sobe em cascata nos dois, e a regra do texto solto não pode alcançar a `Content`
   * do `Collapsible`: a animação dela é a de altura, a que o Radix espera para desmontar.
   */
  it("o conteúdo aparece em cascata, nos dois componentes", () => {
    for (const nome of ["accordion", "collapsible"]) {
      expect(lerFonte(`src/components/ui/${nome}.tsx`), nome).toContain(
        "disclosureRevealClassName"
      )
    }
    const css = lerFonte("src/app/globals.css")
    const bloco = esperarDepoisDeNoScrollbar(css, `@utility ${disclosureRevealClassName} {`, {
      fecha: "@utility",
    })
    expect(bloco).toMatch(/:not\(\[data-slot="collapsible-content"\]\)/)
    // A abertura anda na mola da casa, e o fechamento não: uma mola até zero
    // passaria por baixo de zero, e a altura seria cortada seca.
    expect(bloco).toMatch(/rise var\(--duration-spring\) var\(--ease-spring\) both;\s*--rise-distance: 6px;/)
    expect(css).toMatch(/--ease-spring: linear\(/)
  })
})
