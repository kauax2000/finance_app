import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

/** O bloco que expande, trancado na rodada 189. */

const FONTE = readFileSync(join(process.cwd(), "src/components/ui/collapsible.tsx"), "utf8")

describe("o collapsible", () => {
  it("a linha é a régua do Accordion", () => {
    for (const c of ["disclosureRowClassName", "disclosureRowFocusClassName", "disclosureLabelClassName"]) {
      expect(FONTE, c).toContain(c)
    }
  })

  it("o encontrável sai do until-found antes de o Radix medir", () => {
    // Com o atributo ainda lá, `content-visibility: hidden` mede 0 e o bloco
    // abre sem trajeto.
    expect(FONTE).toMatch(/if \(proximo\) \{\s*raiz\.current[\s\S]{0,120}removeAttribute\("hidden"\)/)
    expect(FONTE).toContain('el.setAttribute("hidden", "until-found")')
    expect(FONTE).toContain('addEventListener("beforematch"')
    // Só o `animationend` do próprio nó: a cascata dos filhos também dispara.
    expect(FONTE).toContain("if (e.target === el) esconder()")
  })

  it("o cartão recua embaixo por pseudo, não por padding", () => {
    expect(FONTE).toContain("after:block after:h-(--collapsible-px)")
    expect(FONTE).not.toMatch(/cartao && "[^"]*\bpb-/)
  })
})
