import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

describe("a pilha: pílula, placa e legenda (rodadas 140–143)", () => {
  const paleta = lerFonte("src/components/ui/command.tsx")

  it("a pilha é a variante panel: o diálogo e o Combobox a montam", () => {
    const dialogo = paleta.slice(paleta.indexOf("function CommandDialog"), paleta.indexOf("function CommandInput"))
    // Sem o `DialogContent`: ali a placa é o próprio `Content`, e a legenda
    // ficaria recortada ou dentro de uma raiz de fundo.
    expect(dialogo).not.toContain("<DialogContent")
    expect(dialogo).toContain('variant="panel"')
    // A raiz provê o contexto quando é `panel`, e a variante é a coluna.
    expect(paleta).toContain('const pilha = resolvida === "panel" ? (density ?? "palette") : null')
    expect(paleta).toContain("<CommandStackContext.Provider value={pilha}>")
    // O Combobox **saiu da pilha** na rodada 198: uma placa só, a do popover,
    // com a pílula `plate` e a lista dentro — a forma do `SearchInput` num
    // popover, que o dono pediu "exatamente a mesma".
    const combobox = lerFonte("src/components/ui/combobox.tsx")
    expect(combobox).not.toContain('variant="panel"')
    expect(combobox).not.toContain('surface="none"')
    expect(combobox).toMatch(/<CommandInput[\s\S]*surface="plate"/)
    expect(paleta).toMatch(/naPaleta && "min-h-9"/)
    expect(paleta).toMatch(/panel: "gap-3 overflow-visible/)
    // A placa é da lista, num embrulho: a lista é o elemento mascarado, e a
    // máscara recortaria a placa junto.
    const lista = paleta.slice(paleta.indexOf("function CommandList"), paleta.indexOf("function CommandEmpty"))
    expect(lista).toContain('data-slot="command-dialog-panel"')
    expect(lista).toContain("[--scroll-fade-band-h:0px]")
    // E o campo é uma pílula de vidro solta.
    const campo = paleta.slice(paleta.indexOf("function CommandInput"), paleta.indexOf("function CommandScope"))
    // Desde a rodada 198 a pílula é o `SearchInput`, na superfície `plate`
    // dentro da pilha; a receita é que é pílula e vidro.
    expect(campo).toMatch(/<SearchInput\s+surface=\{surface \?\? \(naPilha \? "plate" : "field"\)\}/)
    expect(lerFonte("src/components/ui/search-input.tsx")).toContain("searchFieldSurfaceClassName[surface]")
    const receita = lerFonte("src/lib/search-field-classes.ts")
    expect(receita).toMatch(/searchFieldShapeClassName = "[^"]*rounded-full/)
    expect(receita).toMatch(/plate: `[^`]*\$\{menuPanelTintClassName\}`/)
    // O popover do Combobox pinta a placa da régua, e o `Command` de dentro não.
    const popover = lerFonte("src/components/ui/popover.tsx")
    expect(popover).toMatch(/plate: menuPanelSurfaceClassName/)
    expect(popover).toMatch(/defaultVariants: \{ surface: "plate"/)
  })

  it("cada cápsula tem o próprio vidro, e a linha some no toque", () => {
    const dock = paleta.slice(paleta.indexOf("function CommandDock"), paleta.indexOf("function CommandShortcut"))
    expect(dock).toContain("pointer-coarse:hidden")
    const item = dock.slice(dock.indexOf("function CommandDockItem"))
    expect(item).toContain("menuPanelTintClassName")
    expect(item).toContain("rounded-full")
  })

  it("a legenda é o último filho, e a linha é do componente, não da tela", () => {
    const busca = lerFonte("src/app/designsystem/ds-search.tsx")
    expect(busca).toContain("<CommandDock>")
    expect(busca).not.toContain("dock={")
    expect(paleta).not.toContain("function CommandFooter")
    expect(paleta).not.toContain("function CommandHint")
    // O que a tela escrevia à mão (rodada 143) mora na pilha e nas peças.
    expect(busca).not.toMatch(/min-h-9|size-6|className="px-2"/)
    expect(busca).toContain("<CommandItemIcon>")
    expect(busca).toContain("<CommandItemArrow />")
  })
})
