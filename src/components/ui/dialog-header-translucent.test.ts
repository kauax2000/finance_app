import { describe, expect, it } from "vitest"
import { blocoCss, lerFonte } from "@/test/fonte"

const CSS = lerFonte("src/app/globals.css")
const DIALOG = lerFonte("src/components/ui/dialog.tsx")

describe("DialogHeader translucent (B3, 13/11/2026)", () => {
  it("é opt-in: sem a prop, o cabeçalho não ganha a utility", () => {
    expect(DIALOG).toContain("translucent = false")
    expect(DIALOG).toContain('translucent && "dialog-header-translucent"')
  })

  it("placa a 75% com desfoque de 2px, e a borda desce num degradê de 40px, sem linha", () => {
    const u = blocoCss(CSS, "@utility dialog-header-translucent")
    expect(u).toContain("var(--popover) 75%")
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
