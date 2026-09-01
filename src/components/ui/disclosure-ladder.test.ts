import { describe, expect, it } from "vitest"

import {
  DISCLOSURE_ROW_HEIGHT_CLASS,
  DISCLOSURE_ROW_HEIGHTS,
  disclosureMarkerClassName,
  disclosureLabelClassName,
  disclosureRowClassName,
} from "@/lib/disclosure-classes"

/**
 * A escada da linha de divulgação, trancada.
 *
 * Este projeto já mediu o mesmo defeito duas vezes, nos dois componentes que
 * **ancoravam a escada no contêiner**: o `Menubar` entregou um gatilho de 24px
 * dentro de uma barra de 32, e o `Tabs` entregou 27 dentro de uma bandeja de 36.
 * Nos dois casos a altura do gatilho era um **resto de subtração**, e resto de
 * subtração não tem nome para ninguém conferir.
 *
 * O `Accordion` era a terceira porta: a linha media um `py-2.5` sem nome nenhum,
 * o que dá ~40px por acidente de tipografia — mude o corpo do texto e a linha
 * muda de altura sem que nada no código diga que mudou.
 *
 * Segue o idioma de [`tabs-size-ladder.test.ts`](./tabs-size-ladder.test.ts) e
 * de `src/lib/tailwind-hover-policy.test.ts`: política do design system trancada
 * por asserção, e não por captura de tela.
 */

const DEGRAUS = ["md", "lg", "xl"] as const

/**
 * O piso desta escada é 32, e não os 28 da escada de controles.
 *
 * Uma linha de divulgação carrega uma **frase** — "Quando a fatura fecha?" —, e
 * não o rótulo de um botão. A 28 o texto encosta nas duas bordas.
 */
const PISO = 32

describe("a escada mede a linha", () => {
  it("nenhum degrau abaixo do piso de 32px", () => {
    for (const degrau of DEGRAUS) {
      expect(DISCLOSURE_ROW_HEIGHTS[degrau]).toBeGreaterThanOrEqual(PISO)
    }
  })

  it("degraus de 4px, estritamente crescentes", () => {
    const alturas = DEGRAUS.map((d) => DISCLOSURE_ROW_HEIGHTS[d])
    for (let i = 1; i < alturas.length; i++) {
      expect(alturas[i] - alturas[i - 1]).toBe(4)
    }
  })

  /**
   * A asserção que de fato vale.
   *
   * O AGENTS.md é explícito: "nem todo controle oferece todos os degraus, mas
   * nenhum usa um nome para uma altura diferente". `md` é 32 no `Button`, no
   * `Input`, no `SelectTrigger` e no `Tabs` — e tem que ser 32 aqui. Um `md` de
   * 40 nesta escada faria um acordeão desalinhar de um botão ao lado dele sem
   * que ninguém conseguisse dizer por quê.
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
   * `min-h` e nunca `h`.
   *
   * O rótulo de um acordeão é uma frase, e frase quebra: num telefone, "O
   * orçamento considera parcelas?" ocupa duas linhas. Com `h-8` a segunda linha
   * é **recortada** — e o recorte só aparece na largura em que a quebra
   * acontece, que é exatamente a largura que ninguém olha ao revisar.
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
   * O `Accordion` trazia dois ícones — `ChevronDown` e `ChevronUp` — se
   * revezando por `hidden`/`inline`. É a mesma decisão que a rodada do `Tabs`
   * julgou e reverteu: dois marcadores piscando não dizem o que um marcador se
   * movendo diz. Aqui o conserto era de graça, porque a seta para baixo girada
   * em 180° **é** a seta para cima.
   */
  it("o estado aberto é uma rotação, e não uma troca de glifo", () => {
    expect(disclosureMarkerClassName).toContain("rotate-180")
    expect(disclosureMarkerClassName).not.toContain("hidden")
  })

  /**
   * A transição nomeia as propriedades por extenso, e não `transition-transform`.
   *
   * No Tailwind v4 `rotate` e `translate` são propriedades **independentes** — e
   * `transition-transform` de fato cobre as duas —, mas ele **não** cobre `color`,
   * e a tinta do marcador também muda no cursor. Antes ela trocava de estalo
   * enquanto a seta girava suave, no mesmo elemento.
   */
  it("a rotação tem trajeto, e a tinta viaja junto", () => {
    expect(disclosureMarkerClassName).toContain("transition-[rotate,translate,color]")
    expect(disclosureMarkerClassName).toContain("duration-(--duration-base)")
  })
})

describe("o realce não troca a cor de fundo", () => {
  /**
   * A asserção que vale nesta seção, e ela tranca uma decisão de design.
   *
   * Um acordeão não sabe sobre o que está pousado: ele mora dentro de `Card`,
   * dentro de `muted`, dentro de diálogo e direto na página. Um realce que pinta
   * fundo precisa combinar com a superfície de baixo — e essa é uma informação
   * que o componente não tem. Sobre `bg-muted` o `accent` quase some; sobre
   * `bg-card` num dos temas ele é quase o próprio cartão.
   *
   * Então o realce mora no **rótulo** (sublinhado) e no **marcador** (tinta mais
   * o empurrão), e nenhum dos dois depende do fundo.
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
   * O empurrão depende de dois estados ao mesmo tempo — cursor **e** aberto —, e
   * variante empilhada apontando para o mesmo elemento compila uma cadeia de
   * descendente que não casa com nada. A saída registrada no `AppThemeToggle` é
   * a variável na raiz; este teste impede a volta da forma que não funciona.
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
})
