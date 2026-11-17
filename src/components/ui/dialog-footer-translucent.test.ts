import { describe, expect, it } from "vitest"
import { blocoCss, lerFonte } from "@/test/fonte"

const CSS = lerFonte("src/app/globals.css")
const DIALOG = lerFonte("src/components/ui/dialog.tsx")

describe("DialogFooter translúcido (rodada 382, 17/11/2026)", () => {
  it("vale em todas as folhas: ligado por padrão, `translucent={false}` é a saída", () => {
    const rodape = DIALOG.slice(DIALOG.indexOf("function DialogFooter("))
    expect(rodape).toContain("translucent = true")
    expect(rodape).toContain('translucent && "dialog-footer-translucent"')
    expect(DIALOG).toContain('"--dialog-footer-h"')
  })

  it("placa a 95% sem desfoque, e a borda sobe num degradê de 56px, sem linha", () => {
    const u = blocoCss(CSS, "@utility dialog-footer-translucent")
    expect(u).toContain("--dialog-footer-tint: color-mix(in oklab, var(--background) 95%, transparent)")
    expect(u).toContain("--dialog-footer-fade-h: calc(var(--spacing) * 14)")
    expect(u).not.toContain("backdrop-filter")
    expect(u).toContain("bottom: 100%")
    expect(u.match(/var\(--dialog-footer-tint\) \d+%, transparent\) \d+%/g)).toHaveLength(8)
  })

  it("o corpo desce por trás pela altura medida, e a dissolução de baixo sai", () => {
    const u = blocoCss(CSS, "@utility dialog-footer-translucent")
    expect(u).toContain("margin-bottom: calc(var(--dialog-footer-h, 0px) * -1)")
    expect(u).toContain("--scroll-fade-foot-h: var(--dialog-footer-h, 0px)")
    expect(u).toContain("--scroll-fade-bottom-max: calc(var(--spacing) * 14)")
    expect(u).toContain("--scroll-fade-band-a: 0.15")
    expect(DIALOG).toContain("rgb(0_0_0/var(--scroll-fade-band-a,0))")
    expect(u).toMatch(/scroll-padding-block-end: calc\(var\(--dialog-footer-h, 0px\)/)
    // O corpo lê o teto: sem ele a variável não faria nada.
    expect(DIALOG).toContain("var(--scroll-fade-bottom-max,var(--scroll-fade-end-h))")
  })

  it("sem tinta, como o cabeçalho (rodada 384)", () => {
    const u = blocoCss(CSS, "@utility dialog-footer-translucent")
    expect(u).toContain("content: none")
    expect(u).not.toContain("animation-timeline")
    expect(CSS).not.toContain("@keyframes dialog-footer-fade-out")
  })

  it("na gaveta de baixo, a placa desce até a borda e cobre a área segura", () => {
    const u = blocoCss(CSS, "@utility dialog-footer-translucent")
    expect(u).toContain('[data-vaul-drawer-direction="bottom"] > form > &')
    expect(u).toMatch(/&::before \{[^}]*var\(--drawer-safe, 0px\)/)
  })

  it("mora logo depois do cabeçalho translúcido", () => {
    const cab = CSS.indexOf("@utility dialog-header-translucent")
    expect(cab).toBeGreaterThan(-1)
    expect(CSS.indexOf("@utility dialog-footer-translucent")).toBeGreaterThan(cab)
  })
})
