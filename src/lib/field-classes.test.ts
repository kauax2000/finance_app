import { describe, expect, it } from "vitest"

import {
  fieldDisabledClassName,
  fieldFocusRingClassName,
  fieldGroupDisabledClassName,
  fieldGroupFocusRingClassName,
  fieldGroupInvalidClassName,
  fieldInvalidClassName,
} from "./field-classes"

/**
 * A moldura do `InputGroup` lê os estados do controle de dentro por `has-…`, e
 * as classes têm de estar escritas por extenso — o Tailwind varre texto, e uma
 * variante montada por `.replace()` nunca chega ao CSS. O preço de escrever
 * duas vezes é poder divergir; este teste é o que impede. Ele derruba cada
 * token da régua do campo ao prefixo que a moldura usa, e exige que ele exista.
 */
const tokens = (s: string) => s.split(/\s+/).filter(Boolean)

/** `dark:aria-invalid:x` → `dark:has-aria-invalid:x`; `aria-invalid:x` → `has-aria-invalid:x`. */
const comoNaMoldura = (token: string, de: string, para: string) =>
  token.startsWith("dark:")
    ? `dark:${para}${token.slice("dark:".length + de.length)}`
    : `${para}${token.slice(de.length)}`

describe("field-classes: a moldura acompanha a régua do campo", () => {
  it("foco — cada token de focus-visible existe sob has-[control:focus-visible]", () => {
    const grupo = tokens(fieldGroupFocusRingClassName)
    for (const t of tokens(fieldFocusRingClassName)) {
      expect(grupo, t).toContain(
        comoNaMoldura(t, "focus-visible:", "has-[[data-slot=input-group-control]:focus-visible]:")
      )
    }
  })

  it("inválido — cada token de aria-invalid existe sob has-aria-invalid", () => {
    const grupo = tokens(fieldGroupInvalidClassName)
    for (const t of tokens(fieldInvalidClassName)) {
      expect(grupo, t).toContain(comoNaMoldura(t, "aria-invalid:", "has-aria-invalid:"))
    }
  })

  it("desabilitado — cada token de disabled existe sob has-disabled", () => {
    const grupo = tokens(fieldGroupDisabledClassName)
    for (const t of tokens(fieldDisabledClassName)) {
      expect(grupo, t).toContain(comoNaMoldura(t, "disabled:", "has-disabled:"))
    }
  })

  it("e a moldura não inventa token que a régua não tem", () => {
    const regua = new Set([
      ...tokens(fieldFocusRingClassName).map((t) =>
        comoNaMoldura(t, "focus-visible:", "has-[[data-slot=input-group-control]:focus-visible]:")
      ),
      ...tokens(fieldInvalidClassName).map((t) => comoNaMoldura(t, "aria-invalid:", "has-aria-invalid:")),
      ...tokens(fieldDisabledClassName).map((t) => comoNaMoldura(t, "disabled:", "has-disabled:")),
    ])
    const sobrando = [
      ...tokens(fieldGroupFocusRingClassName),
      ...tokens(fieldGroupInvalidClassName),
      ...tokens(fieldGroupDisabledClassName),
    ].filter((t) => !regua.has(t))
    expect(sobrando).toEqual([])
  })
})
