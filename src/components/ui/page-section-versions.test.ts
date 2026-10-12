import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { esperarDepoisDeNoScrollbar } from "@/test/regras"

import { pageSectionVariants } from "./page-section"

/** A rodada 233: o redesenho, as peças e os comportamentos do `PageSection`. */

const CODIGO = semComentarios(lerFonte("src/components/ui/page-section.tsx"), "linha-inteira")
const CSS = lerFonte("src/app/globals.css")

describe("o redesenho", () => {
  it("a ação desce ao degrau sm sozinha, e sobe a 40 no dedo", () => {
    expect(CODIGO).toContain('<ButtonSizeContext value="sm">{actions}</ButtonSizeContext>')
    expect(CODIGO).toContain("pointer-coarse:[&>[data-slot=button]]:min-h-10")
  })

  it("no telefone a ação de ícone fica quadrada, com o rótulo como nome", () => {
    expect(CODIGO).toContain("max-sm:[&>[data-slot=button]:has(>svg)]:aspect-square")
    expect(CODIGO).toContain("max-sm:[&>[data-slot=button]:has(>svg)>[data-slot=button-label]]:sr-only")
  })

  it("a cascata é opt-in e mora numa @utility depois do no-scrollbar", () => {
    expect(pageSectionVariants({})).not.toContain("page-section-reveal")
    expect(pageSectionVariants({ reveal: true })).toContain("page-section-reveal")
    const bloco = esperarDepoisDeNoScrollbar(CSS, "@utility page-section-reveal")
    // A subida é a dela, fora do `rise` das cascatas: o desfoque não cabe lá.
    expect(bloco).toContain("animation: page-section-rise 520ms")
    expect(CSS).toMatch(/@keyframes page-section-rise \{[^}]*translate: 0 12px;\s*filter: blur\(4px\);/)
    expect(bloco).toContain("prefers-reduced-motion")
  })

  it("o ícone vem antes do nome, e a contagem depois, com o espaço de verdade", () => {
    expect(CODIGO).toContain('data-slot="page-section-title-icon"')
    expect(CODIGO).toMatch(/\{" "\}\s*<span data-slot="page-section-count"/)
  })
})

describe("as peças", () => {
  it("link, meta, rodapé e esqueleto", () => {
    for (const peca of ["PageSectionLink", "PageSectionMeta", "PageSectionFooter", "PageSectionSkeleton"]) {
      expect(CODIGO).toContain(`function ${peca}(`)
    }
  })

  it("o link é tertiary com a seta, e o rodapé dá o degrau aos botões", () => {
    const link = CODIGO.slice(CODIGO.indexOf("function PageSectionLink"), CODIGO.indexOf("function PageSectionMeta"))
    expect(link).toContain('variant="tertiary"')
    expect(link).toContain("<ArrowRightIcon")
    const rodape = CODIGO.slice(CODIGO.indexOf("function PageSectionFooter"), CODIGO.indexOf("function PageSectionSkeleton"))
    expect(rodape).toContain('<ButtonSizeContext value="sm">')
  })

  it("o esqueleto anuncia, e cala dentro de outro esqueleto", () => {
    const esqueleto = CODIGO.slice(CODIGO.indexOf("function PageSectionSkeleton"))
    expect(esqueleto).toContain("<SkeletonGroup")
    expect(esqueleto).toContain("group ?")
  })
})

describe("os comportamentos", () => {
  it("a região só aponta para um título que existe", () => {
    expect(CODIGO).toContain("aria-labelledby={nome}")
    expect(CODIGO).toContain("registrar(id)")
    expect(CODIGO).toContain("return () => registrar(null)")
  })

  it("o nível é da profundidade, até h6", () => {
    expect(CODIGO).toContain("depth: (pai?.depth ?? 0) + 1")
    expect(CODIGO).toContain("Math.min((secao?.depth ?? 1) + 1, 6)")
  })

  it("recolher: o título é o gatilho e o resto recolhe, com o estado guardado", () => {
    expect(CODIGO).toContain("<Collapsible asChild open={aberto} onOpenChange={trocar}>")
    expect(CODIGO).toContain("<CollapsibleTrigger")
    expect(CODIGO).toContain("<CollapsibleContent")
    expect(CODIGO).toContain("window.localStorage.setItem(chave")
    // Só o nome sublinha no cursor, e não a contagem.
    expect(CODIGO).toContain("hover:[&_[data-slot=page-section-title-label]]:underline")
  })

  it("preso: o mecanismo e a placa da Toolbar sticky, só presa", () => {
    expect(CODIGO).toContain("useStickyBar(ref, preso, false, topo)")
    expect(CODIGO).toContain("group-data-stuck/page-section-header:opacity-100")
    expect(lerFonte("src/components/ui/toolbar.tsx")).toContain("usePresa as useStickyBar")
  })
})

/** As medidas da seção. Os degraus distintos estão em `escadas.test.ts`. */
const SECTION_SIZES = ["sm", "md", "lg"] as const

describe("PageSection", () => {
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
