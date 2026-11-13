import { describe, expect, it } from "vitest"
import { blocoCss, lerFonte } from "@/test/fonte"

const CSS = lerFonte("src/app/globals.css")
const DIALOG = lerFonte("src/components/ui/dialog.tsx")

describe("DialogHeader translúcido (B3, 13/11/2026)", () => {
  it("vale em todas as folhas: ligado por padrão, `translucent={false}` é a saída", () => {
    expect(DIALOG).toContain("translucent = true")
    expect(DIALOG).toContain('translucent && "dialog-header-translucent"')
  })

  it("placa a 95% sem desfoque, e a borda desce num degradê de 56px, sem linha", () => {
    const u = blocoCss(CSS, "@utility dialog-header-translucent")
    expect(u).toContain("var(--background) 95%")
    expect(u).not.toContain("backdrop-filter")
    expect(u).toContain("calc(var(--spacing) * 14)")
    // A curva tem oito paradas, da placa cheia ao transparente: sem degrau na borda.
    expect(u.match(/var\(--dialog-header-tint\) \d+%, transparent\) \d+%/g)).toHaveLength(8)
  })

  it("o corpo sobe por trás pela altura medida, e a dissolução de cima sai", () => {
    const u = blocoCss(CSS, "@utility dialog-header-translucent")
    expect(u).toContain("margin-top: calc(var(--dialog-header-h, 0px) * -1)")
    expect(u).toContain("--scroll-fade-top-max: 0px")
  })

  it("o degradê só aparece ao rolar: invisível no topo, liga nos primeiros 24px", () => {
    const u = blocoCss(CSS, "@utility dialog-header-translucent")
    expect(u).toContain("@supports (animation-timeline: scroll())")
    expect(u).toContain("timeline-scope: --dialog-body-scroll")
    expect(u).toContain("scroll-timeline: --dialog-body-scroll block")
    expect(u).toContain("animation-timeline: --dialog-body-scroll")
    expect(u).toContain("animation-range: 0 24px")
    expect(CSS).toMatch(/@keyframes dialog-header-fade-in \{\s*from \{\s*opacity: 0;?\s*\}/)
  })

  it("em repouso o cabeçalho não tem tinta: a placa e o degradê acendem juntos com a rolagem", () => {
    const u = blocoCss(CSS, "@utility dialog-header-translucent")
    const sup = u.slice(u.indexOf("@supports (animation-timeline: scroll())"))
    expect(sup).toMatch(/&::before,\s*&::after \{\s*opacity: 0;/)
  })
})
