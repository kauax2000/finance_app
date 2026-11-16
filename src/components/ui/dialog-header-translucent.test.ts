import { describe, expect, it } from "vitest"
import { blocoCss, lerFonte } from "@/test/fonte"

const CSS = lerFonte("src/app/globals.css")
const DIALOG = lerFonte("src/components/ui/dialog.tsx")
const DRAWER = lerFonte("src/components/ui/drawer.tsx")

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

  it("na gaveta, a placa cobre o puxador e o corpo sobe até a borda (16/11/2026)", () => {
    const u = blocoCss(CSS, "@utility dialog-header-translucent")
    const i = u.indexOf('[data-slot="drag-handle"] + &')
    expect(i).toBeGreaterThan(-1)
    // O cabeçalho dentro do `form` que segue o puxador (o Importar) também conta.
    expect(u).toContain('[data-slot="drag-handle"] + form > &:first-child')
    const puxador = u.slice(i)
    expect(puxador).toMatch(/&::before \{[^}]*var\(--drawer-handle-h\)/)
    expect(puxador).toMatch(/margin-top: calc\([^;]*var\(--drawer-handle-h\)/)
    expect(puxador).toMatch(/padding-top: calc\([^;]*var\(--drawer-handle-h\)/)
    expect(puxador).toMatch(/scroll-padding-block-start: calc\([^;]*var\(--drawer-handle-h\)/)
    // A variável é a soma do puxador: `h-1.5` (6) + `my-2.5` dos dois lados (20) = 26.
    expect(DRAWER).toContain("[--drawer-handle-h:calc(var(--spacing)*6.5)]")
    expect(DRAWER).toContain('"!mx-auto my-2.5 shrink-0"')
    expect(DRAWER).toContain('"!h-1.5 !w-12 !rounded-full"')
    // O puxador fica por cima da placa (o cabeçalho é `z-10`).
    expect(DRAWER).toMatch(/dragHandleClassName = cn\([\s\S]*"relative z-20"/)
  })
})
