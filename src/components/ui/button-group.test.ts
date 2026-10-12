import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

/** O grupo de botões, trancado na rodada 188. */

const GRUPO = lerFonte("src/components/ui/button-group.tsx")
const BOTAO = lerFonte("src/components/ui/button.tsx")

describe("o grupo de botões", () => {
  it("o degrau desce por contexto, e o do botão vence", () => {
    expect(GRUPO).toContain("<ButtonSizeContext value={size}>")
    // O `useContext` fica fora do `??`: hook não pode ser condicional.
    expect(BOTAO).toContain("const groupSize = React.useContext(ButtonSizeContext)")
    expect(BOTAO).toContain('const size = sizeProp ?? groupSize ?? "md"')
  })

  it("o texto e o contorno desenham a própria emenda", () => {
    expect(GRUPO).toContain("[&>[data-slot=button-group-text]]:before:hidden")
    expect(GRUPO).toContain("[&>[data-variant=outline]]:before:hidden")
  })

  it("o campo ocupa a sobra e, no dedo, leva os botões aos 40", () => {
    expect(GRUPO).toContain("[&>[data-slot=input]]:flex-1")
    expect(GRUPO).toContain("pointer-coarse:has-[>[data-slot=input]]:*:h-10")
  })

  it("em pé, a emenda deita", () => {
    for (const c of ["[&>*:not(:first-child)]:-mt-px", "[&>*:not(:first-child)]:rounded-t-none", "[&>*:not(:first-child)]:before:h-px"]) {
      expect(GRUPO, c).toContain(c)
    }
  })
})
