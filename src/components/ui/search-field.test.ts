import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

import { SearchInput } from "./search-input"

/** A rodada 198: uma receita de busca, três peças. */

const trecho = (texto: string, de: string, ate: string) =>
  texto.slice(texto.indexOf(de), texto.indexOf(ate, texto.indexOf(de)))

const render = (props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(h(SearchInput, { "aria-label": "Buscar", ...props }))

describe("o campo de busca é um desenho só", () => {
  it("o CommandInput — a busca do CommandDialog e do Combobox — é o SearchInput", () => {
    const campo = trecho(lerFonte("src/components/ui/command.tsx"), "function CommandInput", "function CommandScope")
    // O campo do cmdk entra como filho; a pílula, o × e a lupa são do SearchInput.
    expect(campo).toMatch(/<SearchInput[\s\S]*<CommandPrimitive\.Input[\s\S]*<\/SearchInput>/)
    expect(campo).not.toMatch(/MagnifyingGlassIcon|XMarkIcon|searchField\w+ClassName/)
    // Na paleta, sem anel; no Combobox e solto, com. O piso de toque é
    // opcional e desligado por padrão (rodada 245): a raiz publica a altura da
    // faixa de busca (32 + 16), e quem o liga leva a faixa junto (40 + 16).
    expect(campo).toContain('focusRing={pilha !== "palette"}')
    expect(campo).toContain("touchFloor = false,")
    expect(campo).toContain("data-touch-floor={touchFloor || undefined}")
    expect(lerFonte("src/components/ui/command.tsx")).toContain(
      "pointer-coarse:has-[[data-slot=command-input-wrapper][data-touch-floor][data-size]]:[--scroll-fade-band-h:calc(--spacing(10)+--spacing(4))]"
    )
  })

  it("o SearchInput e o gatilho do cabeçalho vestem a receita", () => {
    const pecas = {
      SearchInput: lerFonte("src/components/ui/search-input.tsx"),
      // Desde a rodada 237 o gatilho do cabeçalho é o `TopBarSearch`.
      gatilho: trecho(lerFonte("src/components/ui/top-bar.tsx"), "function TopBarSearch", "\n}\n"),
    }
    for (const [nome, codigo] of Object.entries(pecas)) {
      expect(codigo, nome).toContain("searchFieldShapeClassName")
      expect(codigo, nome).toContain("searchFieldIconClassName")
      expect(codigo, nome).toMatch(/searchFieldSizeClassName(\[|\.)/)
      expect(codigo, nome).toMatch(/searchFieldSurfaceClassName(\[|\.)/)
      // Nada da geometria escrita à mão de novo.
      expect(codigo, nome).not.toMatch(/"h-9 gap-2\.5 px-3\.5|lg:h-8|rounded-lg border border-border/)
    }
  })

  it("a pílula de campo é a do cabeçalho, e não o grupo de campo", () => {
    const html = render()
    expect(html).toMatch(/data-slot="search-input"[^>]*class="[^"]*rounded-full[^"]*h-8[^"]*border-border[^"]*bg-input-fill\/30/)
    expect(html).not.toContain('data-slot="input-group"')
    expect(html).toContain('type="search"')
    expect(html).toContain("[&amp;::-webkit-search-cancel-button]:appearance-none")
  })

  it("a placa é o vidro da pilha, sem fio de campo", () => {
    const html = render({ surface: "plate" })
    expect(html).toContain('data-surface="plate"')
    expect(html).toMatch(/class="[^"]*ring-1 ring-foreground\/10[^"]*bg-popover\/85/)
    expect(html).not.toMatch(/data-slot="search-input"[^>]*border-border/)
  })

  it("o × só existe com onClear e com texto", () => {
    const limpar = () => undefined
    expect(render({ value: "mercado", onChange: limpar })).not.toContain("Limpar busca")
    expect(render({ value: "", onChange: limpar, onClear: limpar })).not.toContain("Limpar busca")
    expect(render({ value: "mercado", onChange: limpar, onClear: limpar })).toContain('aria-label="Limpar busca"')
  })

  it("o atalho escreve aria-keyshortcuts e a tecla sem pastilha, que cede ao ×", () => {
    expect(render({ shortcut: "mod+k" })).toContain('aria-keyshortcuts="Meta+K Control+K"')
    expect(render({ shortcut: "/" })).toContain('aria-keyshortcuts="/"')
    const fn = () => undefined
    expect(render({ shortcut: "/", value: "x", onChange: fn, onClear: fn })).toContain("Limpar busca")
    // Antes da plataforma ser lida o `Kbd` não renderiza; a guarda é no fonte.
    expect(lerFonte("src/components/ui/search-input.tsx")).toMatch(/<Kbd keys=\{shortcut\} aria-hidden className=\{searchFieldShortcutClassName\}/)
  })

  it("pending troca a lupa pela roda e marca aria-busy", () => {
    const html = render({ pending: true })
    expect(html).toContain('aria-busy="true"')
    expect(html).toContain('data-slot="spinner"')
  })

  it("a marca só acende na superfície de campo", () => {
    expect(render({ variant: "brand" })).toMatch(/data-slot="search-input"[^>]*brand-glow/)
    const codigo = lerFonte("src/components/ui/search-input.tsx")
    expect(codigo).toMatch(/surface: Extract<SearchFieldSurface, "plate">; variant\?: "default"/)
  })
})
