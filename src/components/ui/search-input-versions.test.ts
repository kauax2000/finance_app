import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

import { SearchInput } from "./search-input"

/** As versões do `SearchInput`. A receita da pílula é do `search-field.test.ts`. */

const CODIGO = lerFonte("src/components/ui/search-input.tsx")

const render = (props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(h(SearchInput, { "aria-label": "Buscar", readOnly: true, ...props }))

describe("as versões do SearchInput", () => {
  it("caret é opt-in: sem ele, a busca é a de sempre, com o cursor nativo", () => {
    expect(CODIGO).toContain("caret?: boolean")
    expect(CODIGO).toContain("caret = false,")
    const html = render({ value: "fatura" })
    expect(html).not.toContain("caret-transparent")
    expect(html).not.toContain("type-caret")
    expect(html).not.toContain('data-slot="search-input-caret')
  })

  it("com caret, o nativo some e o traço desenhado cai depois do reflexo invisível do valor", () => {
    expect(CODIGO).toContain('caret && "col-start-1 row-start-1 caret-transparent"')
    const html = render({ value: "fatura", caret: true })
    expect(html).toMatch(/data-slot="search-input-control"[^>]*class="[^"]*caret-transparent/)
    // O reflexo é decoração: escondido do leitor de tela, sem roubar o clique.
    expect(html).toMatch(
      /<span aria-hidden="true" data-slot="search-input-caret" class="pointer-events-none col-start-1 row-start-1[^"]*"><span class="invisible whitespace-pre">fatura<\/span><span class="type-caret shrink-0"><\/span><\/span>/
    )
  })

  it("o campo e o reflexo dividem a mesma célula, no mesmo corpo de texto", () => {
    const html = render({ value: "fatura", caret: true })
    expect(html).toMatch(/data-slot="search-input-caret-field" class="grid min-w-0 flex-1 grid-cols-1"/)
    // A rampa do corpo vale para o campo e para o reflexo, nos dois degraus.
    expect(html.match(/text-base md:text-sm/g)?.length).toBe(2)
    expect(render({ value: "fatura", caret: true, size: "sm" }).match(/md:text-control-sm/g)?.length).toBe(2)
  })
})
