import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import {
  TOOLBAR_CONTROL_HEIGHTS,
  toolbarClassName,
  toolbarControlClassName,
  toolbarFilterIndicatorClassName,
  toolbarIconControlClassName,
  toolbarRowClassName,
} from "./toolbar"

/**
 * A densidade da barra, trancada.
 *
 * A asserção que de fato vale é a de número 2, e ela é descendente direta do
 * teste do `Tabs` ("a lista não declara altura nenhuma"): quatro rodadas da
 * história deste design system são um contêiner nomeando a altura de um
 * controle — `Menubar` entregou 24px, `Tabs` entregou 27, `Item` teve dois
 * degraus com a mesma string, `Calendar` prometeu 36 e mediu 28.
 */
const ESCADA = { xs: 24, sm: 28, md: 32, lg: 36, xl: 40 } as const

/** `\b` casaria dentro de `min-h-11`; `h-full` não é medida da escada. */
const DECLARA_ALTURA = /(?:^|\s)(?:min-)?h-(?!full\b)/

const FONTE = readFileSync(new URL("./toolbar.tsx", import.meta.url), "utf8")
/** O arquivo narra o defeito antigo, inclusive as strings que ele proíbe. */
const CODIGO = FONTE.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")

const PECAS = [
  toolbarRowClassName,
  toolbarControlClassName,
  toolbarIconControlClassName,
  toolbarFilterIndicatorClassName,
]

describe("densidade do Toolbar", () => {
  it("1. os dois degraus têm nome na escada do sistema", () => {
    const degraus = Object.values(ESCADA)
    expect(degraus).toContain(TOOLBAR_CONTROL_HEIGHTS.fine)
    expect(degraus).toContain(TOOLBAR_CONTROL_HEIGHTS.coarse)
    expect([TOOLBAR_CONTROL_HEIGHTS.fine, TOOLBAR_CONTROL_HEIGHTS.coarse]).toEqual([
      ESCADA.md,
      ESCADA.xl,
    ])
    expect(TOOLBAR_CONTROL_HEIGHTS.fine).not.toBe(TOOLBAR_CONTROL_HEIGHTS.coarse)
  })

  it("2. a raiz não declara altura nenhuma — ela declara a dos filhos", () => {
    expect(toolbarClassName).not.toMatch(DECLARA_ALTURA)
    expect(toolbarClassName).not.toMatch(/(?:^|\s)size-\d/)
  })

  it("3. a variável é declarada só na raiz", () => {
    expect(toolbarClassName).toContain("[--toolbar-control:")
    for (const peca of PECAS) {
      expect(peca).not.toContain("[--toolbar-control:")
    }
  })

  it("4. as réguas leem a variável, e mais nada", () => {
    expect(toolbarControlClassName).toBe("h-(--toolbar-control)")
    expect(toolbarIconControlClassName).toBe("size-(--toolbar-control)")
    expect(toolbarControlClassName).not.toContain("md:")
    expect(toolbarIconControlClassName).not.toContain("md:")
  })

  it("5. nenhuma altura literal sobreviveu no fonte", () => {
    // `--spacing(8)` e `--spacing(10)` são a declaração da variável, não uma
    // classe de altura — por isso a borda de palavra em `-`.
    expect(CODIGO).not.toMatch(/(?:^|\s|:)(?:md:)?(?:h|size)-(?:8|9|10|11)\b/)
  })

  it("6. uma margem automática, e ela é lógica", () => {
    // Duas `ms-auto` na mesma linha dividem a sobra em partes iguais em vez de
    // empurrar a segunda para a borda — a medição do `AccordionTrigger`.
    expect(CODIGO.match(/\bm[sleritxy]?-auto\b/g)).toEqual(["ms-auto"])
    expect(CODIGO).not.toContain("ml-auto")
  })

  it("7. a raiz não declara `justify-*` — as 4 grafias não voltam por ali", () => {
    expect(toolbarClassName).not.toMatch(/\bjustify-/)
  })

  it("8. `role=\"toolbar\"` não é carimbado", () => {
    expect(CODIGO).not.toContain('role="toolbar"')
  })

  it("9. o ponto não pinta hover, e não intercepta o ponteiro", () => {
    expect(toolbarFilterIndicatorClassName).toContain("pointer-events-none")
    expect(toolbarFilterIndicatorClassName).not.toContain("hover:")
    // Traço/marca que precisa ser vista contra a página é acento, não fill.
    expect(toolbarFilterIndicatorClassName).toContain("bg-primary-accent")
  })

  it("10. o indicador cabe dentro do canto arredondado, e sai da frente do ícone", () => {
    // A geometria, trancada em aritmética — foi ela que originou esta rodada, e
    // a primeira medição a leu ao contrário (confundiu folga com sobreposição).
    const RAIO = 10 // `rounded-lg` do Button, medido
    const BORDA = 1
    const DIAMETRO = 8 // `size-2`
    const ancora = Number(
      /top-(\d+(?:\.\d+)?)/.exec(toolbarFilterIndicatorClassName)?.[1]
    )
    expect(ancora).toBe(1)
    expect(toolbarFilterIndicatorClassName).toContain("right-1 ")
    expect(toolbarFilterIndicatorClassName).toContain("size-2")

    const px = ancora * 4 + BORDA // do canto da caixa de borda
    const centro = px + DIAMETRO / 2
    const distAoCentroDoArco = Math.hypot(RAIO - centro, RAIO - centro)
    const folgaAteACurva = RAIO - (distAoCentroDoArco + DIAMETRO / 2)

    // Dentro do botão: a borda do ponto não alcança a curva.
    expect(folgaAteACurva).toBeGreaterThan(0)
    expect(+folgaAteACurva.toFixed(2)).toBe(4.59)

    // E longe o bastante do ícone no botão de 40 (o do telefone, onde esta
    // peça vive). No de 32 a invasão seria de 5px — por isso ela é documentada
    // como marca de botão sem rótulo na barra do telefone, e não em geral.
    const invasaoDoIcone = px + DIAMETRO - (40 - 16) / 2
    expect(invasaoDoIcone).toBeLessThanOrEqual(1)
  })

  it("11. a pergunta é o ponteiro, e não a largura", () => {
    // "A linha do menu cresce no toque, não no telefone." O `Calendar` já
    // resolve assim: `pointer-coarse:[--cell-size:--spacing(11)]`.
    expect(toolbarClassName).toContain("pointer-coarse:[--toolbar-control:")
    expect(toolbarClassName).not.toMatch(/md:\[--toolbar-control:/)
  })
})
