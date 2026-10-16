import { describe, expect, it } from "vitest"
import { blocoCss, lerFonte, semComentarios } from "@/test/fonte"
import { esperarDepoisDeNoScrollbar } from "@/test/regras"

import { popoverContentVariants } from "@/components/ui/popover"
import { menuSurfaceClassName } from "@/lib/menu-classes"
import { DIALOG_OVERLAY_CLASS, overlayClassName } from "@/components/ui/dialog"
import { SHEET_OVERLAY_CLASS } from "@/components/ui/drawer"

const CSS = lerFonte("src/app/globals.css")
const ui = (nome: string) => lerFonte(`src/components/ui/${nome}.tsx`)

/** O movimento das superfícies sobrepostas, do título até a troca de mês do calendário. */
const BLOCO = CSS.slice(
  CSS.indexOf("/* ── O movimento do que se sobrepõe à tela"),
  CSS.indexOf("/* A troca de mês. O `react-day-picker`")
)
const utility = (nome: string) => {
  expect(BLOCO.indexOf(`@utility ${nome} {`), nome).toBeGreaterThan(-1)
  return blocoCss(BLOCO, `@utility ${nome} {`)
}

describe("O movimento do que se sobrepõe à tela", () => {
  it("as utilities moram depois de no-scrollbar, fora da fatia do vidro", () => {
    expect(BLOCO.length).toBeGreaterThan(0)
    esperarDepoisDeNoScrollbar(CSS, "@utility menu-sprout")
  })

  it("os keyframes animam transform, nunca translate e scale soltos", () => {
    const keyframes = BLOCO.match(/@keyframes [\s\S]*?\n\}\n/g) ?? []
    expect(keyframes.length).toBeGreaterThanOrEqual(4)
    for (const k of keyframes) {
      expect(k, k.slice(0, 40)).not.toMatch(/^\s*(translate|scale):/m)
    }
  })

  it("toda sobreposição brota no gesto do menu da barra de baixo, e volta a ele", () => {
    for (const nome of ["menu-sprout", "context-menu-burst", "popover-sprout", "field-bloom", "hover-card-unveil", "dialog-sprout"]) {
      const u = utility(nome)
      expect(u, nome).toMatch(/\[data-state="open"\][^{]*\{\s*animation: menu-morph 380ms linear backwards;/)
      expect(u, nome).toMatch(/\[data-state="closed"\][^{]*\{\s*animation: menu-unmorph 210ms linear both;/)
    }
    // O diálogo chega no raio dele, não no da superfície.
    expect(utility("dialog-sprout")).toContain("--morph-radius: var(--radius-modal);")
    // A dica também: o Radix escreve `delayed-open`/`instant-open`.
    expect(utility("menu-sprout")).toContain('&[data-state="delayed-open"]')
    for (const peça of ["menubar", "navigation-menu", "tooltip"]) {
      expect(ui(peça), peça).toContain("menu-sprout")
    }
    // A paleta do `CommandDialog` é a exceção: abre na mola e fecha curto, como antes
    // da rodada 287 (pedido do dono).
    expect(ui("command")).not.toContain('"menu-sprout"')
    expect(ui("command")).toContain("data-open:zoom-in-95 data-open:animation-duration-(--duration-spring) data-open:ease-(--ease-spring)")
    expect(ui("command")).toContain("data-closed:zoom-out-95 data-closed:animation-duration-(--duration-fast) data-closed:ease-(--ease-out)")
  })

  it("o menu brota do botão nos quadros do menu do iOS 26", () => {
    // A mola dele amostrada a 60fps: os quadros são a curva, `linear` entre eles.
    const menu = utility("menu-sprout")
    expect(menu).toContain("animation: menu-morph 380ms linear backwards;")
    expect(menu).toContain("animation: menu-unmorph 210ms linear both;")
    // Sem deslocamento: a origem do Radix já é o canto do botão.
    expect(menu).not.toContain("data-side")
    // O que se escolhe num campo brota no mesmo gesto (rodada 287).
    const campo = utility("field-bloom")
    expect(campo).toContain("animation: menu-morph 380ms linear backwards;")
    expect(campo).toContain("animation: menu-unmorph 210ms linear both;")
    const abre = blocoCss(BLOCO, "@keyframes menu-morph {")
    // Nasce em elipse a 20% e cresce primeiro na altura, que passa 8% do tamanho.
    expect(abre).toMatch(/0% \{\s*opacity: 0;\s*border-radius: 50%;\s*transform: scale\(0\.2, 0\.2\);/)
    expect(abre).toContain("transform: scale(0.93, 1.08);")
    expect(abre).toMatch(/100% \{\s*opacity: 1;\s*border-radius: var\(--morph-radius, var\(--radius-surface\)\);\s*transform: none;/)
    // Sem filtro sobre o vidro: o desfoque é das linhas.
    expect(abre).not.toContain("filter")
    const fecha = blocoCss(BLOCO, "@keyframes menu-unmorph {")
    expect(fecha).toMatch(/100% \{\s*opacity: 0;\s*border-radius: 50%;/)
    expect(fecha).not.toContain("filter")
  })

  it("o diálogo cresce do próprio centro, e o Select alinhado ao item não desdobra", () => {
    // Nascia do ponto do clique; aberto pela barra lateral, surgia da esquerda.
    expect(utility("dialog-sprout")).not.toContain("transform-origin")
    expect(ui("dialog")).not.toContain("dialog-origin")
    expect(utility("field-bloom")).toContain('&[data-state="open"]:not([data-align-trigger="true"])')
  })

  it("as linhas da lista flutuante surgem do desfoque: nada se desloca dentro do rolável", () => {
    // Linha transladada conta como transbordo: os 4px do `rise` acendiam a dissolução,
    // a seta e a barra no painel da conta, que não rola (o viewport do `panel` não tem
    // recuo). O desfoque é transbordo de tinta, que não rola.
    const c = utility("overlay-cascade")
    expect(c).toContain("animation: menu-content-in 170ms var(--ease-out) 30ms backwards;")
    expect(c).toContain("animation: menu-content-out 90ms var(--ease-in-out) both;")
    expect(c).not.toMatch(/rise|translate|transform|scale|stagger-ladder/)
    for (const k of ["@keyframes menu-content-in {", "@keyframes menu-content-out {"]) {
      expect(blocoCss(BLOCO, k), k).not.toMatch(/translate|transform|scale/)
    }
  })

  it("as faixas do popover e da prévia surgem do desfoque; as do diálogo sobem 0.25rem", () => {
    // O popover e a prévia rolam, e com `padding="none"` os 4px da subida eram 4px de
    // transbordo até a faixa pousar. O casco do diálogo é `overflow-hidden`, sem dissolução.
    for (const nome of ["popover-sprout", "hover-card-unveil"]) {
      const u = utility(nome)
      expect(u, nome).toMatch(/animation: menu-content-in \d+ms var\(--ease-out\) \d+ms backwards;\s*--stagger-base/)
      expect(u, nome).not.toMatch(/\brise\b|--rise-distance/)
    }
    expect(utility("dialog-sprout")).toMatch(/animation: rise \d+ms var\(--ease-[a-z]+\) \d+ms both;\s*--rise-distance: 0\.25rem;/)
  })

  it("nenhum filho de rolável com dissolução se desloca ao abrir", () => {
    // Filho transladado conta como transbordo do rolável: onde o recuo do fim é menor que a
    // subida, a dissolução, a seta e a barra acendiam até ele pousar. A paleta e o `Menubar`
    // estavam seguros só pelo recuo; o rodapé do `DatePicker` encosta no fim, sem recuo.
    const regras = semComentarios(CSS, "bloco")
    const cascatas = {
      "command-reveal": blocoCss(regras, "@utility command-reveal {"),
      "menubar-reveal": blocoCss(regras, "@utility menubar-reveal {"),
    }
    for (const [nome, bloco] of Object.entries(cascatas)) {
      expect(bloco, nome).toContain("animation: menu-content-in ")
      expect(bloco, nome).not.toMatch(/\brise\b|translate|--rise-distance/)
    }
    const calendario = blocoCss(regras, "@utility date-picker-bloom {")
    expect(calendario).toMatch(/&\[data-state="open"\] \[data-slot="date-picker-footer"\] \{\s*animation: menu-content-in var\(--duration-spring\) var\(--ease-out\) 200ms backwards;\s*\}/)
    // O rodapé não está em nenhuma outra regra do calendário (a da subida, a do atraso).
    expect(calendario.match(/date-picker-footer/g)).toHaveLength(1)
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
    expect(ui("alert-dialog")).toContain("dialogContentVariants({ size, layout: \"auto\" })")
    expect(ui("tooltip")).toContain('"menu-sprout"')
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

  it("a superfície dos menus não anima: quem anima é o gesto de cada peça", () => {
    expect(menuSurfaceClassName).not.toMatch(/animate-in|zoom-in|slide-in/)
    expect(ui("menubar")).not.toContain("menuMotionClassName")
  })

  it("a folha desliza da borda inteira, e não 48px", () => {
    const folha = ui("sheet")
    expect(folha).not.toMatch(/slide-in-from-(top|right|bottom|left)-12/)
    for (const lado of ["top", "right", "bottom", "left"]) {
      expect(folha).toContain(`data-open:slide-in-from-${lado} data-closed:slide-out-to-${lado}`)
    }
  })
})

describe("Um keyframe de subir", () => {
  it("o `rise` lê a distância por variável, e os três antigos saíram", () => {
    const rise = esperarDepoisDeNoScrollbar(CSS, "@keyframes rise {")
    // Sem `filter`: nem padrão (`blur(0px)`) nem `var()` sem padrão, os dois animam filtro em
    // toda linha. O desfoque da seção é dela.
    expect(rise).toMatch(/from \{\s*opacity: 0;\s*translate: 0 var\(--rise-distance, 3px\);\s*\}/)
    expect(rise).not.toContain("filter")
    expect(CSS.match(/@keyframes rise \{/g)).toHaveLength(1)
    const regras = semComentarios(CSS, "bloco")
    for (const antigo of ["disclosure-rise", "menubar-rise", "overlay-rise"]) {
      expect(regras, antigo).not.toContain(antigo)
    }
  })
})

describe("Os véus", () => {
  it("o véu é um só, com a camada como parâmetro", () => {
    expect(overlayClassName("modal")).toContain("z-(--z-modal)")
    expect(overlayClassName("sheet")).toContain("z-(--z-sheet)")
    for (const c of ["modal", "sheet"] as const) {
      expect(overlayClassName(c)).toContain("bg-overlay")
      expect(overlayClassName(c)).toContain("backdrop-blur-xs")
    }
  })

  it("as constantes antigas saem dele, e o descarte veste o véu de sheet", () => {
    expect(DIALOG_OVERLAY_CLASS).toBe(overlayClassName("modal"))
    expect(SHEET_OVERLAY_CLASS).toBe(overlayClassName("sheet", false))
    expect(overlayClassName("sheet")).toContain("data-open:fade-in-0")
    expect(SHEET_OVERLAY_CLASS).not.toContain("animate-in")
    expect(ui("dialog")).toContain('className={overlayClassName("sheet")}')
  })
})
