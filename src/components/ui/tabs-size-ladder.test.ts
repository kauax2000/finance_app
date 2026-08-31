import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import {
  TABS_TRIGGER_HEIGHTS,
  tabsIndicatorVariants,
  tabsListFrameVariants,
  tabsListTrackVariants,
  tabsTriggerVariants,
} from "./tabs"

/**
 * A escada do `Tabs`, trancada.
 *
 * Este teste existe por causa de um defeito específico e medido: o gatilho das
 * abas media **27px**. A lista era `h-9` (36) com `p-1` (8), o que deixa 28 de
 * caixa de conteúdo, e o gatilho era `h-[calc(100%-1px)]` — 27, um pixel abaixo
 * do piso da escada de controles do projeto.
 *
 * O que o deixou passar não foi a falta de teste; foi a **direção da âncora**.
 * Com a altura declarada no contêiner, a do gatilho é um resto de subtração, e
 * um resto de subtração não tem nome para ninguém conferir. É o mesmo defeito
 * que o `Menubar` teve (lá, 24px), e o conserto é o mesmo: a escada nomeia o
 * gatilho, e o contêiner cresce em volta.
 *
 * Por isso a asserção que de fato vale é a de número 4 — **a lista não pode
 * declarar altura nenhuma**. As outras são baratas e ficam; essa é a que
 * impediria a regressão de voltar pela mesma porta.
 *
 * Segue o idioma de `src/lib/tailwind-hover-policy.test.ts`: uma política do
 * design system trancada por asserção, e não por captura de tela.
 */

const SIZES = ["sm", "md", "lg"] as const
const VARIANTS = ["solid", "underline", "ghost"] as const

/** O piso da escada de controles: `xs` (24) é para dentro de outro controle. */
const PISO = 28

/** `(?:^|\s)` e não `\b`: `\b` casaria dentro de `min-h-11`. */
const DECLARA_ALTURA = /(?:^|\s)h-(?!full\b)/

describe("a escada mede o gatilho", () => {
  it("nenhum degrau abaixo do piso de 28px", () => {
    for (const size of SIZES) {
      expect(TABS_TRIGGER_HEIGHTS[size]).toBeGreaterThanOrEqual(PISO)
    }
  })

  it("degraus de 4px, estritamente crescentes", () => {
    const alturas = SIZES.map((s) => TABS_TRIGGER_HEIGHTS[s])
    for (let i = 1; i < alturas.length; i++) {
      expect(alturas[i] - alturas[i - 1]).toBe(4)
    }
  })

  it("os nomes batem com os do resto do sistema", () => {
    // `sm` 28, `md` 32, `lg` 36 — os mesmos números que `Button`, `Input`,
    // `SelectTrigger` e `MenubarTrigger` chamam pelos mesmos nomes.
    expect(TABS_TRIGGER_HEIGHTS).toEqual({ sm: 28, md: 32, lg: 36 })
  })

  it("o gatilho declara a classe de altura do seu degrau", () => {
    const classe = { 28: "h-7", 32: "h-8", 36: "h-9" } as const
    for (const size of SIZES) {
      expect(tabsTriggerVariants({ size })).toContain(
        classe[TABS_TRIGGER_HEIGHTS[size]]
      )
    }
  })
})

describe("a bandeja deriva, nunca declara", () => {
  it("nem a moldura nem a trilha declaram altura, em variante nenhuma", () => {
    for (const variant of VARIANTS) {
      expect(tabsListFrameVariants({ variant })).not.toMatch(DECLARA_ALTURA)
      expect(tabsListTrackVariants({ variant })).not.toMatch(DECLARA_ALTURA)
    }
  })

  it("o gatilho não mede por porcentagem do pai — a forma exata do defeito", () => {
    for (const variant of VARIANTS) {
      for (const size of SIZES) {
        expect(tabsTriggerVariants({ variant, size })).not.toContain("calc(100%")
      }
    }
  })

  it("`h-[calc(100%…)]` não volta ao fonte por outro caminho", () => {
    // Sem os comentários: o arquivo **descreve** o defeito antigo, e um guarda
    // que lê prosa proibiria o componente de explicar a própria história.
    const codigo = readFileSync(join(__dirname, "tabs.tsx"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "")
    expect(codigo).not.toMatch(/h-\[calc\(100%/)
  })
})

describe("o anel de foco é o do sistema", () => {
  it("`ring-3`, e não o `ring-2` que só o Tabs usava", () => {
    const classes = tabsTriggerVariants({})
    expect(classes).toContain("focus-visible:ring-3")
    expect(classes).not.toContain("focus-visible:ring-2")
  })
})

describe("o marcador viaja com os tokens do sistema", () => {
  const VARIANTS_ = ["solid", "underline", "ghost"] as const

  it("a duração e a curva vêm de token, nunca de um número solto", () => {
    // A página de Movimento é explícita: "não invente um número novo em
    // milissegundos". Um `duration-200` aqui teria o mesmo valor de hoje e
    // deixaria de acompanhar o sistema no dia em que o token mudar.
    for (const variant of VARIANTS_) {
      const classes = tabsIndicatorVariants({ variant })
      expect(classes).toContain("duration-(--duration-base)")
      expect(classes).toContain("ease-(--ease-out)")
      expect(classes).not.toMatch(/\bduration-\d/)
      expect(classes).not.toMatch(/\bease-\[/)
    }
  })

  it("a caixa vem das quatro variáveis publicadas pela trilha", () => {
    const classes = tabsIndicatorVariants({})
    for (const eixo of ["x", "y", "w", "h"]) {
      expect(classes).toContain(`--tabs-indicator-${eixo}`)
    }
  })

  it("não usa camada negativa — ela o esconderia atrás da moldura", () => {
    // A moldura pinta `bg-muted` e não cria contexto de empilhamento, então um
    // `-z-*` mandaria o marcador para trás dela. A ordem no DOM já resolve.
    for (const variant of VARIANTS_) {
      expect(tabsIndicatorVariants({ variant })).not.toMatch(/-z-\d/)
    }
  })

  it("o rótulo do gatilho compartilha o relógio do marcador", () => {
    // Relógios diferentes fariam a aba acender antes de o realce chegar.
    const classes = tabsTriggerVariants({})
    expect(classes).toContain("duration-(--duration-base)")
    expect(classes).toContain("ease-(--ease-out)")
  })
})
