import { describe, expect, it } from "vitest"

import { lerFonte, semComentarios } from "@/test/fonte"

const botao = semComentarios(lerFonte("src/components/ui/button.tsx"))
const dialogo = semComentarios(lerFonte("src/components/ui/dialog.tsx"))
const form = semComentarios(lerFonte("src/components/ui/form.tsx"))

describe("três ações juntas: três pesos (regra do dono, 07/11/2026)", () => {
  it("o Button sobe o tertiary a secondary dentro de um rodapé de três ações", () => {
    expect(botao).toContain("const TresAcoesContext = React.createContext(false)")
    expect(botao).toContain('const variant = tresAcoes && variantProp === "tertiary" ? "secondary" : variantProp')
  })

  it("o DialogFooter liga o contexto com start e mais duas, e a do start fica de fora", () => {
    expect(dialogo).toContain("<TresAcoesContext.Provider value={false}>{start}</TresAcoesContext.Provider>")
    expect(dialogo).toMatch(/value=\{Boolean\(start\) && contarAcoes\(children\) \+ \(showCloseButton \? 1 : 0\) >= 2\}/)
  })

  it("o FormActions segue a mesma regra", () => {
    expect(form).toContain("<TresAcoesContext.Provider value={false}>{start}</TresAcoesContext.Provider>")
    expect(form).toContain("<TresAcoesContext.Provider value={Boolean(start) && contarAcoes(children) >= 2}>")
  })
})
