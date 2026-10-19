import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

import {
  FIELD_CONTROL_HEIGHTS,
  fieldControlHeightClassName,
  fieldControlPaddingClassName,
  fieldFocusRingClassName,
  fieldSurfaceClassName,
  type FieldControlSize,
} from "@/lib/field-classes"
import { TABS_TRAY_HEIGHTS } from "./tabs"

/**
 * A escada de altura da família de campo, trancada. A asserção que vale é a 5: a mesma escada
 * estava escrita em cinco lugares (uma constante, um condicional no `Input`, literais no
 * `SelectTrigger` e no `ComboboxTrigger`, um registro no `InputGroup`) sem nada garantir que
 * continuassem iguais.
 */

const DEGRAUS = ["sm", "md", "lg", "xl"] as const satisfies readonly FieldControlSize[]

/**
 * Os oito que vestem a régua, em sete arquivos (o `NativeSelect` mora em `select.tsx`). O
 * `Textarea` entra pelo recuo, não pela altura.
 */
const CONTROLES = [
  "input",
  "textarea",
  "select",
  "combobox",
  "date-picker",
  "form",
  "input-group",
] as const

/** O arquivo **narra** os defeitos antigos; sem tirar os comentários, um teste
 *  de ausência proibiria o componente de explicar a própria história. */
const fonte = (nome: string) => semComentarios(lerFonte(`src/components/ui/${nome}.tsx`), "linha-inteira")

/** O `h-*` do Tailwind que corresponde a cada altura em px. */
const CLASSE_DE_ALTURA: Record<number, string> = {
  28: "h-7",
  32: "h-8",
  36: "h-9",
  40: "h-10",
}

/** O piso de toque: o degrau que a `Toolbar` publica e o `Tabs` aplica. */
const PISO_DE_TOQUE = "pointer-coarse:h-11"

describe("escada de controle da família de campo", () => {
  it("1. tem os quatro degraus, e eles são os mesmos números do Tabs", () => {
    expect(Object.keys(FIELD_CONTROL_HEIGHTS).sort()).toEqual([...DEGRAUS].sort())
    // Duas escadas do mesmo sistema não podem se separar caladas.
    expect(FIELD_CONTROL_HEIGHTS).toEqual(TABS_TRAY_HEIGHTS)
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

  it("4. todos os degraus carregam o piso de toque de 44, o xl também (rodada 332)", () => {
    for (const d of ["sm", "md", "lg", "xl"] as const) {
      expect(fieldControlHeightClassName[d], d).toContain(PISO_DE_TOQUE)
    }
    expect(fieldControlHeightClassName.xl).toBe("h-10 pointer-coarse:h-11")
  })

  it("4b. o campo é cápsula, e o degrau não carrega raio", () => {
    // O raio por degrau não existe: o campo é cápsula.
    for (const d of DEGRAUS) {
      expect(fieldControlHeightClassName[d], d).not.toMatch(/rounded-/)
    }
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
    // `px-2.5` (10px, contra os 12 do `Input`) serrilhava a borda esquerda do texto num
    // formulário.
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

const GLOBALS = lerFonte("src/app/globals.css")



const CASCAS = ["input-group", "select", "combobox", "date-picker", "form"] as const
const FOLHAS = ["input", "textarea"] as const

describe("o foco do campo é o anel do sistema", () => {
  it("7. nenhum dos oito controles veste marca", () => {
    // Marca no campo não volta (contorno estático, feixe, halo, receita do `Button brand`): o
    // foco do campo é o anel do sistema, e nada impedia a próxima tentativa.
    for (const nome of [...FOLHAS, ...CASCAS]) {
      expect(fonte(nome), nome).not.toMatch(/--brand-|field-brand|brand-rainbow/)
    }
    expect(fieldSurfaceClassName).not.toContain("brand-rainbow-image")
    expect(GLOBALS).not.toMatch(/@utility field-brand|--field-contour/)
  })

  it("8. o anel é preto no claro e branco no escuro, por `--ring`", () => {
    // As "bordas brancas e pretas" do foco nunca foram reescritas: o que as anulava era o
    // `ring-0` das constantes de marca. O anel é 30%, mais suave e fora dos 3:1 por decisão
    // registrada em `field-classes.ts`; a largura e a cor não mudam.
    for (const token of ["focus-visible:ring-3", "focus-visible:ring-ring/30", "focus-visible:border-ring"]) {
      expect(fieldFocusRingClassName.split(/\s+/), token).toContain(token)
    }
    expect(GLOBALS).toMatch(/^\s*--ring: oklch\(0\.145 0 0\);/m)
    expect(GLOBALS).toMatch(/^\s*--ring: oklch\(0\.985 0 0\);/m)
  })
})
