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

  it("a placa só existe quando o corpo rola, e aí fica acesa do começo ao fim (rodadas 385 e 386)", () => {
    const u = blocoCss(CSS, "@utility dialog-header-translucent")
    expect(u).toContain("@supports (animation-timeline: scroll())")
    expect(u).toContain("scroll-timeline: --dialog-body-scroll block")
    expect(u).toContain("animation: dialog-placa-com-rolagem linear both")
    // A sombra mora dentro da faixa e termina na borda do cabeçalho (rodada 388): sem linha reta.
    expect(u).toContain("height: calc(100% - var(--dialog-header-fade-h) + var(--dialog-header-fade-over))")
    expect(u).toContain("--dialog-header-fade-over: calc(var(--spacing) * 4)")
    expect(u).toContain("top: calc(100% - var(--dialog-header-fade-h) + var(--dialog-header-fade-over))")
    expect(u).not.toContain("animation-range")
    expect(CSS).toMatch(/@keyframes dialog-placa-com-rolagem \{\s*from \{\s*opacity: 1;\s*\}\s*to \{\s*opacity: 1;/)
  })

  it("na gaveta, a placa cobre o puxador e o corpo sobe até a borda (16/11/2026)", () => {
    const u = blocoCss(CSS, "@utility dialog-header-translucent")
    const i = u.indexOf('[data-slot="drag-handle"] + &')
    expect(i).toBeGreaterThan(-1)
    // O cabeçalho dentro de um `form` (o Importar), de um `div` (o detalhe do lançamento) ou de outro invólucro.
    expect(u).toContain('[data-slot="drag-handle"] + * > &:first-child')
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

describe("dentro do form seguinte, só o corpo que abre o form passa por baixo do cabeçalho", () => {
  it("com a busca ou as abas entre os dois, o corpo não sobe por cima delas", () => {
    const css = lerFonte("src/app/globals.css")
    const bloco = css.slice(css.indexOf("@utility dialog-header-translucent"), css.indexOf("@utility dialog-footer-translucent"))
    expect(bloco).toContain('& + form > [data-slot="dialog-body"]:first-child')
    expect(bloco).not.toMatch(/form > \[data-slot="dialog-body"\](?!:first-child)/)
  })
})
