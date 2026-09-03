import { describe, expect, it } from "vitest"

import { itemVariants } from "./item"

/**
 * A escada do `Item`, trancada.
 *
 * Este teste existe por causa de um defeito específico e medido: `size` tinha
 * `default` e `sm` com **a mesma string** — `gap-2.5 px-3 py-2.5`. Dois nomes,
 * uma medida, e nenhuma forma de perceber isso lendo o `cva`: as duas linhas
 * ficavam uma embaixo da outra, e o olho lê "escada" onde havia degrau
 * repetido.
 *
 * É o terceiro parente do mesmo defeito neste design system. `Menubar`
 * entregava 24px e `Tabs` entregava 27, os dois por ancorar a escada no
 * contêiner. Aqui a âncora está certa — a medida é do próprio `Item` —, mas o
 * degrau não existia. A asserção que de fato vale é a de número 2: **nenhum par
 * de degraus pode produzir a mesma string**.
 */
const DEGRAUS = ["sm", "md", "lg"] as const

/** Extrai `px-*` / `py-*` / `gap-*` da string de classes de um degrau. */
function medidas(size: (typeof DEGRAUS)[number]) {
  const classes = itemVariants({ size, variant: "plain" })
  const pegar = (prefixo: string) =>
    classes
      .split(/\s+/)
      .find((c) => c.startsWith(prefixo))
      ?.slice(prefixo.length)
  return { gap: pegar("gap-"), px: pegar("px-"), py: pegar("py-") }
}

describe("escada do Item", () => {
  it("1. tem exatamente os três degraus do sistema, e `md` é o padrão", () => {
    const padrao = itemVariants({ variant: "plain" })
    expect(padrao).toBe(itemVariants({ size: "md", variant: "plain" }))

    // `default` e `xs` saíram do tipo. Se voltarem, este teste não os pega —
    // quem pega é `tsc`. O que ele garante é que o padrão continua sendo `md`.
    for (const size of DEGRAUS) {
      expect(itemVariants({ size, variant: "plain" })).toBeTruthy()
    }
  })

  it("2. nenhum par de degraus produz a mesma string — foi o defeito", () => {
    const strings = DEGRAUS.map((s) => itemVariants({ size: s, variant: "plain" }))
    expect(new Set(strings).size).toBe(DEGRAUS.length)
  })

  it("3. as medidas crescem monotonicamente do menor para o maior", () => {
    const valores = DEGRAUS.map(medidas)
    const num = (v: string | undefined) => Number(v)

    for (const eixo of ["gap", "px", "py"] as const) {
      const seq = valores.map((v) => num(v[eixo]))
      expect(seq.every(Number.isFinite)).toBe(true)
      expect(seq).toStrictEqual([...seq].sort((a, b) => a - b))
      expect(new Set(seq).size).toBe(seq.length)
    }
  })

  it("4. o `Item` não declara altura — uma linha de lista cresce com o conteúdo", () => {
    for (const size of DEGRAUS) {
      const classes = itemVariants({ size, variant: "plain" })
      expect(classes).not.toMatch(/(?:^|\s)h-\d/)
      expect(classes).not.toMatch(/(?:^|\s)h-\[/)
    }
  })

  it("5. `interactive` traz hover, o par de toque e o alvo de dedo", () => {
    const ligado = itemVariants({ interactive: true, variant: "plain" })
    expect(ligado).toContain("hover:bg-muted")
    // O par `active:` é o que faz a resposta existir no telefone: o `hover:`
    // compila dentro de `@media (hover: hover)`.
    expect(ligado).toContain("active:bg-muted")
    expect(ligado).toContain("pointer-coarse:min-h-11")
    expect(ligado).toContain("focus-visible:ring-3")

    const desligado = itemVariants({ interactive: false, variant: "plain" })
    expect(desligado).not.toContain("hover:bg-muted")
  })
})
