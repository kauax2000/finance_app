import { describe, expect, it } from "vitest"
import { blocoCss, lerFonte, semComentarios } from "@/test/fonte"

/**
 * O cabeçalho de vidro das folhas e diálogos (decisão do dono, 12/11/2026): o
 * corpo rola por trás dele e aparece borrado; sem fio, e o vidro se apaga numa
 * rampa em vez de acabar numa borda reta.
 */

const CSS = lerFonte("src/app/globals.css")
const UTILITY = semComentarios(blocoCss(CSS, "@utility dialog-header-glass {", "\n}\n"), "bloco")
const DIALOG = semComentarios(lerFonte("src/components/ui/dialog.tsx"), "bloco")

describe("o cabeçalho de vidro", () => {
  it("o DialogHeader veste a utility e publica a própria altura", () => {
    expect(DIALOG).toMatch(/data-slot="dialog-header"[\s\S]*?"dialog-header-glass"/)
    expect(DIALOG).toContain('setProperty("--dialog-header-h"')
  })

  it("só onde o corpo rola logo abaixo, e com saída", () => {
    expect(UTILITY).toContain('[data-layout="fixed"]')
    expect(UTILITY).toContain('+ [data-slot="dialog-body"]')
    expect(UTILITY).toContain(':not([data-glass="off"])')
  })

  it("o vidro é a tinta flutuante com o borrão, e fica por cima do corpo", () => {
    expect(UTILITY).toMatch(/--dialog-header-tint: color-mix\(in oklab, var\(--popover\) 60%, transparent\)/)
    expect(UTILITY).toMatch(/&::before \{[^}]*backdrop-filter: blur\(var\(--glass-surface-blur/)
    expect(UTILITY).toContain("z-index: 10")
  })

  it("sem fio, e a rampa desce além do cabeçalho até sumir", () => {
    expect(UTILITY).not.toMatch(/border(-bottom|-block-end)?\s*:/)
    expect(UTILITY).toMatch(/&::after \{[^}]*top: 100%;[^}]*height: var\(--dialog-header-fade-h\)/)
    expect(UTILITY).toMatch(/var\(--dialog-header-shade\), transparent\)/)
    // Nenhuma máscara num elemento com borrão: o Chrome a descarta dentro da placa arredondada.
    expect(UTILITY).not.toContain("mask-image")
  })

  it("o escurecido é token com par escuro", () => {
    const claro = CSS.slice(0, CSS.indexOf(".dark {"))
    const escuro = blocoCss(CSS, ".dark {", "\n}")
    expect(claro).toMatch(/--dialog-header-shade: oklch\(/)
    expect(escuro).toMatch(/--dialog-header-shade: oklch\(/)
  })

  it("o corpo sobe por trás e perde só a dissolução de cima", () => {
    expect(UTILITY).toContain("margin-top: calc(var(--dialog-header-h, 0px) * -1)")
    expect(UTILITY).toContain("--scroll-fade-top-max: 0px")
    expect(UTILITY).not.toContain("--scroll-fade-bottom")
  })

  it("o × flutuante fica acima do vidro", () => {
    expect(DIALOG).toMatch(/floating: "absolute top-2\.5 right-2\.5 z-20"/)
  })
})
