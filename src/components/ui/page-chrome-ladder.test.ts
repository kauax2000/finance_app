import { describe, expect, it } from "vitest"

import {
  containerGutters,
  containerSizes,
  containerVariants,
  DEFAULT_CONTAINER_SIZE,
} from "./container"
import { pageHeaderVariants } from "./page-header"
import { pageSectionVariants } from "./page-section"

/**
 * As escadas do chrome de página, trancadas.
 *
 * Este teste existe por causa de dois defeitos medidos nesta rodada, e cada
 * bloco abaixo tranca um deles.
 *
 * **O primeiro é a escada que não existia.** `PageHeaderTitle` oferecia um
 * corpo só (`text-2xl sm:text-3xl`) enquanto o catálogo renderizava dois — e o
 * `Item` já mostrou que dois nomes podem apontar para a **mesma string** sem
 * ninguém notar (`default` e `sm` eram `gap-2.5 px-3 py-2.5` nos dois). A
 * asserção que vale é a de que nenhum par de degraus colide.
 *
 * **O segundo é a classe montada em tempo de execução.** O Tailwind varre o
 * código como texto: uma classe que só existe depois de uma interpolação nunca
 * chega ao CSS. Por isso `containerSizes` e o `cva` são dois lugares, e este
 * teste é o que impede que eles divirjam.
 */

const HEADER_SIZES = ["sm", "md", "lg"] as const
const SECTION_SIZES = ["sm", "md", "lg"] as const

describe("PageHeader", () => {
  it("tem três degraus, e nenhum par produz a mesma string", () => {
    const classes = HEADER_SIZES.map((size) => pageHeaderVariants({ size }))
    expect(new Set(classes).size).toBe(HEADER_SIZES.length)
  })

  it("cada degrau declara --page-title nas duas larguras", () => {
    for (const size of HEADER_SIZES) {
      const cls = pageHeaderVariants({ size })
      expect(cls).toMatch(/\[--page-title:[\d.]+rem\]/)
      expect(cls).toMatch(/sm:\[--page-title:[\d.]+rem\]/)
    }
  })

  it("a escada sobe: cada degrau é maior que o anterior", () => {
    const base = HEADER_SIZES.map((size) => {
      const m = pageHeaderVariants({ size }).match(
        /(?<!sm:)\[--page-title:([\d.]+)rem\]/
      )
      return Number(m?.[1])
    })
    expect(base).toEqual([...base].sort((a, b) => a - b))
    expect(new Set(base).size).toBe(base.length)
  })

  /**
   * O degrau tem que ser um número, e não uma classe da escala do Tailwind:
   * `text-2xl` traria a entrelinha pareada junto, e quem manda na entrelinha
   * do título é `.page-title` (1.25), que está fora de `@layer` e vence.
   */
  it("o degrau é medida, e nunca uma classe de corpo do Tailwind", () => {
    for (const size of HEADER_SIZES) {
      expect(pageHeaderVariants({ size })).not.toMatch(/(?:^|[: ])text-\w/)
    }
  })

  it("o padrão é md, e ruled", () => {
    expect(pageHeaderVariants({})).toBe(
      pageHeaderVariants({ size: "md", variant: "ruled" })
    )
  })

  it("plain não desenha régua nenhuma", () => {
    // `border-b` é substring de `border-border`: a fronteira de palavra é o
    // que faz esta asserção medir o que ela diz medir.
    const BORDA_BAIXO = /(?:^|\s)border-b(?:\s|$)/
    expect(pageHeaderVariants({ variant: "plain" })).not.toMatch(BORDA_BAIXO)
    expect(pageHeaderVariants({ variant: "ruled" })).toMatch(BORDA_BAIXO)
  })

  /**
   * A trilha e a faixa de fatos atravessam as duas colunas, e isso só é
   * possível numa grade. Enquanto era `sm:flex-row` sem `flex-wrap`, a trilha
   * caía **dentro** da linha do título — medido a 1280px, com a coluna do
   * título saindo com largura zero.
   */
  it("é grade, e não uma linha de flex", () => {
    const cls = pageHeaderVariants({})
    expect(cls).toMatch(/(?:^|\s)grid(?:\s|$)/)
    expect(cls).not.toMatch(/flex-row/)
  })
})

describe("PageSection", () => {
  it("tem três degraus, e nenhum par produz a mesma string", () => {
    const classes = SECTION_SIZES.map((size) => pageSectionVariants({ size }))
    expect(new Set(classes).size).toBe(SECTION_SIZES.length)
  })

  /**
   * O corpo vem em par com a entrelinha porque `text-(length:…)` declara só o
   * tamanho: sem a segunda variável o título herdaria a entrelinha do
   * parágrafo em volta.
   */
  it("cada degrau declara corpo e entrelinha", () => {
    for (const size of SECTION_SIZES) {
      const cls = pageSectionVariants({ size })
      expect(cls).toMatch(/\[--page-section-title:[\d.]+rem\]/)
      expect(cls).toMatch(/\[--page-section-title-line:[\d.]+rem\]/)
    }
  })

  it("a régua da seção é em cima, e nunca embaixo", () => {
    const ruled = pageSectionVariants({ variant: "ruled" })
    expect(ruled).toMatch(/(?:^|\s)border-t(?:\s|$)/)
    expect(ruled).not.toMatch(/(?:^|\s)border-b(?:\s|$)/)
  })

  it("o padrão é md, e sem régua", () => {
    expect(pageSectionVariants({})).toBe(
      pageSectionVariants({ size: "md", variant: "plain" })
    )
  })

  /**
   * Medido: uma seção usada como item de uma **linha** de flex estoura para o
   * próprio min-content — 5241px dentro de um pai de 400 —, e leva a rolagem
   * interna junto. O `min-w-0` é da seção; no conteúdo ele não fazia nada,
   * porque o tamanho mínimo automático vale no eixo principal, e numa coluna o
   * eixo principal é o vertical.
   */
  it("declara min-w-0, que é o que a impede de estourar numa linha de flex", () => {
    expect(pageSectionVariants({})).toMatch(/(?:^|\s)min-w-0(?:\s|$)/)
  })
})

describe("Container", () => {
  /**
   * As tabelas existem para as páginas que desenham a régua poderem iterá-las;
   * o `cva` existe porque só literal chega ao CSS. Divergir é o defeito.
   */
  it("as tabelas e o cva não divergem", () => {
    for (const [size, esperado] of Object.entries(containerSizes)) {
      const cls = containerVariants({
        size: size as keyof typeof containerSizes,
      })
      expect(cls.split(" ")).toContain(esperado)
    }
    for (const [gutter, esperado] of Object.entries(containerGutters)) {
      if (!esperado) continue
      const cls = containerVariants({
        gutter: gutter as keyof typeof containerGutters,
      })
      for (const parte of esperado.split(" ")) {
        expect(cls.split(" ")).toContain(parte)
      }
    }
  })

  it("nenhum par de degraus produz a mesma largura", () => {
    expect(new Set(Object.values(containerSizes)).size).toBe(
      Object.keys(containerSizes).length
    )
  })

  /**
   * `default` dizia *o padrão* em vez de dizer a medida — o nome que já saiu
   * de `Button`, `Input`, `SelectTrigger` e `NativeSelect`.
   */
  it("não existe um degrau chamado default", () => {
    expect(Object.keys(containerSizes)).not.toContain("default")
  })

  /**
   * O padrão é declarado uma vez, no `cva`. `DEFAULT_CONTAINER_SIZE` existe
   * para o `data-size` não o adivinhar, e este teste é o que impede os dois de
   * se separarem.
   */
  it("o padrão é md, e a constante concorda com o cva", () => {
    expect(DEFAULT_CONTAINER_SIZE).toBe("md")
    expect(containerVariants({})).toBe(
      containerVariants({ size: DEFAULT_CONTAINER_SIZE, gutter: "none" })
    )
  })

  /**
   * 1024 tinha zero usos no repositório e era o padrão. Ele saiu, e esta
   * asserção é o que impede que volte pela porta dos fundos — como o
   * `in-data-[variant=dialog]` do `Command`, que sobreviveu à remoção da
   * variante e passou a não casar com nada.
   */
  it("max-w-5xl não voltou para a escada", () => {
    expect(Object.values(containerSizes)).not.toContain("max-w-5xl")
  })

  /**
   * A calha é o que tornava o componente inadotável: a casca do app já é dona
   * dela, e somar a do `Container` derrubava o conteúdo de 343 para 311px a
   * 375. `none` de padrão é o que faz as nove cascas do app poderem adotá-lo.
   */
  it("a calha é opt-in, e o padrão não desenha recuo nenhum", () => {
    expect(containerGutters.none).toBe("")
    expect(containerVariants({})).not.toMatch(/(?:^|\s)px-\d/)
    expect(containerVariants({ gutter: "page" })).toMatch(/(?:^|\s)px-4(?:\s|$)/)
  })

  /**
   * A gramática é a que o app renderiza — um degrau, quebrando em 768 —, e não
   * a que este arquivo inventava, com dois degraus em 640 e 1024.
   */
  it("a calha quebra em md, e em mais nenhum ponto", () => {
    const page = containerGutters.page
    expect(page).toMatch(/(?:^|\s)md:px-\d/)
    expect(page).not.toMatch(/(?:^|\s)(?:sm|lg|xl):px-/)
  })
})
