import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import { TABS_TRAY_HEIGHTS } from "@/components/ui/tabs"
import {
  FIELD_CONTROL_HEIGHTS,
  fieldControlHeightClassName,
  fieldControlPaddingClassName,
  fieldFocusRingClassName,
  fieldSurfaceClassName,
  type FieldControlSize,
} from "./field-classes"

/**
 * A escada de altura da família de campo, trancada — e a sexta grafia trancada
 * fora.
 *
 * **A asserção que de fato vale é a de número 5.** Antes desta rodada a mesma
 * escada estava escrita em **cinco** lugares: uma constante em
 * `field-classes`, um condicional em JS no `Input`, literais inline no
 * `SelectTrigger` e no `ComboboxTrigger`, e um registro local no `InputGroup`.
 * Nada garantia que continuassem iguais, e nenhum teste as via — um grep por
 * `h-7` em todo `*.test.ts` não achava nada. Cinco cópias de uma decisão não
 * são cinco decisões: são uma decisão sem dono.
 */

const DEGRAUS = ["sm", "md", "lg", "xl"] as const satisfies readonly FieldControlSize[]

/** Os oito que vestem a régua. O `Textarea` entra pelo recuo, não pela altura. */
const CONTROLES = [
  "input",
  "textarea",
  "native-select",
  "select",
  "combobox",
  "date-picker",
  "form-picker-popover",
  "input-group",
] as const

/** O arquivo **narra** os defeitos antigos; sem tirar os comentários, um teste
 *  de ausência proibiria o componente de explicar a própria história. */
const fonte = (nome: string) =>
  readFileSync(new URL(`../components/ui/${nome}.tsx`, import.meta.url), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")

/** O `h-*` do Tailwind que corresponde a cada altura em px. */
const CLASSE_DE_ALTURA: Record<number, string> = {
  28: "h-7",
  32: "h-8",
  36: "h-9",
  40: "h-10",
}

/** O piso de toque: o degrau que a `Toolbar` publica e o `Tabs` aplica. */
const PISO_DE_TOQUE = "pointer-coarse:h-10"

describe("escada de controle da família de campo", () => {
  it("1. tem os quatro degraus, e eles são os mesmos números do Tabs", () => {
    expect(Object.keys(FIELD_CONTROL_HEIGHTS).sort()).toEqual([...DEGRAUS].sort())
    // Duas escadas do mesmo sistema não podem se separar caladas.
    expect(FIELD_CONTROL_HEIGHTS).toEqual(TABS_TRAY_HEIGHTS)
  })

  it("2. os degraus sobem de 4 em 4, e nenhum par repete a mesma string", () => {
    const alturas = DEGRAUS.map((d) => FIELD_CONTROL_HEIGHTS[d])
    for (let i = 1; i < alturas.length; i += 1) {
      expect(alturas[i] - alturas[i - 1], `${DEGRAUS[i - 1]} → ${DEGRAUS[i]}`).toBe(4)
    }
    // O defeito do `Item`: dois degraus com a mesma string.
    const classes = DEGRAUS.map((d) => fieldControlHeightClassName[d])
    expect(new Set(classes).size).toBe(DEGRAUS.length)
  })

  it("3. cada degrau contém o `h-*` literal do seu número", () => {
    // Literal, e nunca template: o Tailwind varre o código como texto, e uma
    // classe montada em runtime nunca chega ao CSS.
    for (const d of DEGRAUS) {
      expect(fieldControlHeightClassName[d].split(/\s+/), d).toContain(
        CLASSE_DE_ALTURA[FIELD_CONTROL_HEIGHTS[d]]
      )
    }
  })

  it("4. sm, md e lg carregam o piso de toque; xl não, porque já é 40", () => {
    for (const d of ["sm", "md", "lg"] as const) {
      expect(fieldControlHeightClassName[d], d).toContain(PISO_DE_TOQUE)
    }
    // Um piso redundante é uma segunda grafia esperando para divergir.
    expect(fieldControlHeightClassName.xl).not.toContain("pointer-coarse")
    expect(fieldControlHeightClassName.xl).toBe("h-10")
  })

  it("5. nenhum dos oito controles reescreve a escada por conta própria", () => {
    // A asserção que teria impedido as cinco cópias.
    for (const nome of CONTROLES) {
      const codigo = fonte(nome)
      expect(codigo, `${nome}: escada por data-size`).not.toMatch(
        /data-\[size=\w+\]:h-\d/
      )
      expect(codigo, `${nome}: altura de degrau escrita à mão`).not.toMatch(
        /\bh-(?:7|8|9|10)\b/
      )
    }
  })

  it("6. o recuo é um só, e a ponta final fica de fora", () => {
    // `px-2.5` era o `Textarea` e o `NativeSelect` — 10px contra os 12 do
    // `Input`, e a borda esquerda do texto serrilhava num formulário.
    for (const d of DEGRAUS) {
      expect(fieldControlPaddingClassName[d], d).toMatch(/\bpx-(?:2|3)\b/)
      expect(fieldControlPaddingClassName[d], d).not.toMatch(/\bp[re]-\d/)
    }
    // O degrau curto encolhe o corpo do texto, e só ele.
    expect(fieldControlPaddingClassName.sm).toContain("md:text-control-sm")
    for (const d of ["md", "lg", "xl"] as const) {
      expect(fieldControlPaddingClassName[d], d).not.toContain("text-")
    }
  })
})

const GLOBALS = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8")



const CASCAS = ["input-group", "select", "combobox", "date-picker", "form-picker-popover"] as const
const FOLHAS = ["input", "textarea", "native-select"] as const

describe("o foco do campo é o anel do sistema", () => {
  it("7. nenhum dos oito controles veste marca", () => {
    // **Cinco rodadas puseram arco-íris aqui** — contorno estático, feixe
    // animado (o `border-beam` do 21st portado em CSS), halo por `box-shadow`,
    // a receita do `Button variant="brand"`, e ela com teto de croma e de luz.
    // O dono recusou todas na tela: marca no campo não funciona neste app, e
    // o que sempre esteve certo é o anel do sistema. Esta asserção existe
    // porque nada impedia a sexta tentativa.
    for (const nome of [...FOLHAS, ...CASCAS]) {
      expect(fonte(nome), nome).not.toMatch(/--brand-|field-brand|brand-rainbow/)
    }
    expect(fieldSurfaceClassName).not.toContain("brand-rainbow-image")
    expect(GLOBALS).not.toMatch(/@utility field-brand|--field-contour/)
  })

  it("8. o anel é preto no claro e branco no escuro, por `--ring`", () => {
    // É o que o dono chamou de "as bordas brancas e pretas", e ele nunca foi
    // reescrito: o que o anulava era o `ring-0` que as constantes de marca
    // carregavam para não cobrir a cor de 1px.
    // Rodada 162: 30%, mais suave a pedido do dono e fora dos 3:1 por decisão
    // registrada em `field-classes.ts`. A largura e a cor não mudaram.
    for (const token of ["focus-visible:ring-3", "focus-visible:ring-ring/30", "focus-visible:border-ring"]) {
      expect(fieldFocusRingClassName.split(/\s+/), token).toContain(token)
    }
    expect(GLOBALS).toMatch(/^\s*--ring: oklch\(0\.145 0 0\);/m)
    expect(GLOBALS).toMatch(/^\s*--ring: oklch\(0\.985 0 0\);/m)
  })
})
