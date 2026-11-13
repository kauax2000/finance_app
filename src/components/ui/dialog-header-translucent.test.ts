import { describe, expect, it } from "vitest"
import { blocoCss, lerFonte } from "@/test/fonte"

const CSS = lerFonte("src/app/globals.css")
const DIALOG = lerFonte("src/components/ui/dialog.tsx")

describe("DialogHeader translúcido (B3, 13/11/2026)", () => {
  it("vale em todas as folhas: ligado por padrão, `translucent={false}` é a saída", () => {
    expect(DIALOG).toContain("translucent = true")
    expect(DIALOG).toContain('translucent && "dialog-header-translucent"')
  })

  it("placa a 88% com desfoque de 2px, e a borda desce num degradê de 40px, sem linha", () => {
    const u = blocoCss(CSS, "@utility dialog-header-translucent")
    expect(u).toContain("var(--popover) 88%")
    expect(u).toContain("blur(2px)")
    expect(u).toContain("calc(var(--spacing) * 10)")
    expect(u).toMatch(/linear-gradient\(\s*to bottom,\s*var\(--dialog-header-tint\)/)
  })

  it("o corpo sobe por trás pela altura medida, e a dissolução de cima sai", () => {
    const u = blocoCss(CSS, "@utility dialog-header-translucent")
    expect(u).toContain("margin-top: calc(var(--dialog-header-h, 0px) * -1)")
    expect(u).toContain("--scroll-fade-top-max: 0px")
  })
})
