import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

/** O bloco que expande, trancado. */

const FONTE = lerFonte("src/components/ui/collapsible.tsx")

describe("o collapsible", () => {
  it("o estado aberto vem do useControllableState do Radix", () => {
    const fonte = semComentarios(FONTE, "tudo")
    expect(fonte).toMatch(/useControllableState/)
    expect(fonte).toMatch(/from "radix-ui\/internal"/)
  })

  it("a linha é a régua do Accordion", () => {
    for (const c of ["disclosureRowClassName", "disclosureRowFocusClassName", "disclosureLabelClassName"]) {
      expect(FONTE, c).toContain(c)
    }
  })

  it("o encontrável sai do until-found antes de o Radix medir", () => {
    // Com o atributo ainda lá, `content-visibility: hidden` mede 0 e o bloco
    // abre sem trajeto.
    expect(FONTE).toMatch(/if \(proximo\) \{\s*raiz\.current[\s\S]{0,120}removeAttribute\("hidden"\)/)
    // A mecânica mora no hook dividido com o `Accordion`.
    expect(FONTE).toContain("useUntilFound(")
    const HOOK = lerFonte("src/hooks/use-until-found.ts")
    expect(HOOK).toContain('el.setAttribute("hidden", "until-found")')
    expect(HOOK).toContain('addEventListener("beforematch"')
    // Só o `animationend` do próprio nó: a cascata dos filhos também dispara.
    expect(HOOK).toContain("if (e.target === el) esconder()")
  })

  it("o cartão recua embaixo por pseudo, não por padding", () => {
    expect(FONTE).toContain("after:block after:h-(--collapsible-px)")
    expect(FONTE).not.toMatch(/cartao && "[^"]*\bpb-/)
  })
})
