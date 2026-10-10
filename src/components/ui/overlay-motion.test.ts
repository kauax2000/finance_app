import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { popoverContentVariants } from "@/components/ui/popover"
import { menuSurfaceClassName } from "@/lib/menu-classes"

const fonte = (caminho: string) => readFileSync(join(process.cwd(), caminho), "utf8")
const CSS = fonte("src/app/globals.css")
const ui = (nome: string) => fonte(`src/components/ui/${nome}.tsx`)

/** O bloco da rodada 248, do título até a troca de mês do calendário. */
const BLOCO = CSS.slice(
  CSS.indexOf("/* ── O movimento do que se sobrepõe à tela (rodada 248)"),
  CSS.indexOf("/* A troca de mês (rodada 245")
)
const utility = (nome: string) => {
  const ini = BLOCO.indexOf(`@utility ${nome} {`)
  expect(ini, nome).toBeGreaterThan(-1)
  return BLOCO.slice(ini, BLOCO.indexOf("\n}\n", ini))
}

describe("O movimento do que se sobrepõe à tela, rodada 248", () => {
  it("as utilities moram depois de no-scrollbar, fora da fatia do vidro", () => {
    expect(BLOCO.length).toBeGreaterThan(0)
    expect(CSS.indexOf("@utility menu-sprout")).toBeGreaterThan(CSS.indexOf("@utility no-scrollbar"))
  })

  it("os keyframes animam transform, nunca translate e scale soltos", () => {
    const keyframes = BLOCO.match(/@keyframes [\s\S]*?\n\}\n/g) ?? []
    expect(keyframes.length).toBeGreaterThanOrEqual(8)
    for (const k of keyframes) {
      expect(k, k.slice(0, 40)).not.toMatch(/^\s*(translate|scale):/m)
    }
  })

  it("entrar é mola, sair é curva — e a mola sempre com a duração dela", () => {
    for (const nome of ["menu-sprout", "context-menu-burst", "popover-sprout", "field-bloom", "dialog-sprout"]) {
      const u = utility(nome)
      expect(u, nome).toMatch(/\[data-state="open"\][^{]*\{\s*animation: [a-z-]+ var\(--duration-spring\) var\(--ease-spring\) backwards;/)
      expect(u, nome).toMatch(/\[data-state="closed"\][^{]*\{\s*animation: [a-z-]+ \d+ms var\(--ease-in-out\) both;/)
    }
    // A prévia não pula: curva longa na entrada, dissolver no lugar na saída.
    const prévia = utility("hover-card-unveil")
    expect(prévia).toContain("animation: overlay-unveil 420ms var(--ease-out) backwards;")
    expect(prévia).toContain("animation: overlay-dissolve var(--duration-fast) var(--ease-out) both;")
  })

  it("o lado do gatilho vira o deslocamento: a placa sai de perto dele", () => {
    for (const nome of ["menu-sprout", "popover-sprout", "hover-card-unveil"]) {
      const u = utility(nome)
      expect(u, nome).toMatch(/&\[data-side="bottom"\] \{\s*--overlay-shift-y: calc\(var\(--overlay-shift\) \* -1\);/)
      expect(u, nome).toMatch(/&\[data-side="right"\] \{\s*--overlay-shift-x: calc\(var\(--overlay-shift\) \* -1\);/)
    }
    // O menu de contexto não se desloca: o gatilho é um ponto.
    expect(utility("context-menu-burst")).not.toContain("data-side")
  })

  it("o diálogo nasce do ponto do clique, e o Select alinhado ao item não desdobra", () => {
    expect(utility("dialog-sprout")).toContain("transform-origin: var(--dialog-origin, 50% 50%);")
    expect(utility("field-bloom")).toContain('&[data-state="open"]:not([data-align-trigger="true"])')
  })

  it("movimento reduzido zera os atrasos das cascatas com !important", () => {
    const zerados = BLOCO.match(/animation-delay: 0ms[^;]*;/g) ?? []
    expect(zerados.length).toBe(4)
    for (const z of zerados) expect(z).toContain("!important")
  })

  it("cada peça veste o seu gesto", () => {
    const dropdown = ui("dropdown-menu")
    expect(dropdown.match(/"menu-sprout"/g)).toHaveLength(2)
    expect(dropdown.match(/"overlay-cascade"/g)).toHaveLength(2)
    const contexto = ui("context-menu")
    expect(contexto).toContain('"context-menu-burst"')
    expect(contexto).toContain('"menu-sprout"')
    expect(contexto.match(/"overlay-cascade"/g)).toHaveLength(2)
    expect(ui("select")).toContain('"field-bloom"')
    expect(ui("select")).toContain('"overlay-cascade"')
    expect(ui("hover-card")).toContain('"hover-card-unveil"')
    expect(ui("dialog")).toContain('"dialog-sprout"')
    expect(ui("alert-dialog")).toContain("const origem = useOrigemDoClique()")
    expect(ui("dialog")).toContain("ref={juntarRefs(ref, origem)}")
    expect(ui("tooltip")).toContain("const fechada = { opacity: 0, scale: reduzido ? 1 : 0.7, ...desvio }")
  })

  it("o popover tem o eixo motion, e quem anima sozinho pede none", () => {
    expect(popoverContentVariants({})).toContain("popover-sprout")
    expect(popoverContentVariants({ motion: "field" })).toContain("field-bloom")
    expect(popoverContentVariants({ motion: "none" })).not.toMatch(/sprout|bloom|animate-in|zoom-in/)
    expect(ui("combobox").match(/motion="field"/g)).toHaveLength(2)
    expect(ui("combobox").match(/\[--command-reveal:var\(--duration-spring\)\]/g)).toHaveLength(2)
    expect(ui("form")).toContain('motion="field"')
    expect(ui("date-picker")).toContain('motion="none"')
    expect(ui("onboarding").match(/motion="none"/g)).toHaveLength(2)
  })

  it("a superfície dos menus não anima; o Menubar guarda o gesto da referência", () => {
    expect(menuSurfaceClassName).not.toMatch(/animate-in|zoom-in|slide-in/)
    expect(ui("menubar").match(/menuMotionClassName,/g)?.length).toBeGreaterThanOrEqual(2)
  })

  it("a folha desliza da borda inteira, e não 48px", () => {
    const folha = ui("sheet")
    expect(folha).not.toMatch(/slide-in-from-(top|right|bottom|left)-12/)
    for (const lado of ["top", "right", "bottom", "left"]) {
      expect(folha).toContain(`data-open:slide-in-from-${lado} data-closed:slide-out-to-${lado}`)
    }
  })
})
