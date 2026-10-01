import { readFileSync } from "node:fs"
import { join } from "node:path"
import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { Combobox, ComboboxChips, ComboboxValue } from "./combobox"

/** A rodada 207: as versões novas do `Combobox`. */

const fonte = (caminho: string) => readFileSync(join(process.cwd(), caminho), "utf8")
const CODIGO = fonte("src/components/ui/combobox.tsx")

describe("as versões do Combobox", () => {
  it("o ladrilho do valor é prop, fora do texto que trunca", () => {
    const html = renderToStaticMarkup(
      h(ComboboxValue, { media: h("i", { id: "tile" }) }, "Mercado")
    )
    expect(html).toMatch(/data-slot="combobox-value-media"[^>]*><i id="tile"><\/i><\/span><span class="min-w-0 truncate[^"]*">Mercado/)
    // Sem valor, nada de ladrilho: o placeholder não leva cor.
    expect(renderToStaticMarkup(h(ComboboxValue, { media: h("i") }))).not.toContain("combobox-value-media")
    // A ausência esmaece.
    expect(renderToStaticMarkup(h(ComboboxValue, { none: true }, "Sem categoria"))).toContain("text-muted-foreground")
  })

  it("as fichas recolhem em +N, levam o tom e nomeiam o ×", () => {
    const html = renderToStaticMarkup(
      h(Combobox, {
        multiple: true,
        value: ["a", "b", "c", "d"],
        children: h(ComboboxChips, { labelFor: (v: string) => v.toUpperCase(), max: 2, tone: "success" }),
      })
    )
    expect(html).toContain('aria-label="Remover A"')
    expect(html).not.toContain('aria-label="Remover C"')
    expect(html).toContain("+2")
    expect(html).toContain("bg-success-muted")
    expect(html).toMatch(/<span data-slot="button-label">\+2<\/span>/)
  })

  it("a ausência é exclusiva em multiple, nos dois sentidos", () => {
    expect(CODIGO).toMatch(/options\?\.exclusive\s*\?\s*\[value\]\s*:\s*\[\.\.\.selected\.filter\(\(v\) => !exclusivos\.current\.has\(v\)\), value\]/)
  })

  it("selecionar tudo filtra os valores registrados, e não o mapa de ids do cmdk", () => {
    // O `filtered.items` do cmdk é indexado pelo id da linha: medido, o
    // "Selecionar tudo" escolhia `radix-_r_k_`.
    expect(CODIGO).not.toMatch(/filtered\.items\.entries\(\)/)
    expect(CODIGO).toContain("commandFilter(valor, busca, palavras) > 0")
  })

  it("a linha de criar desconta a si mesma da contagem", () => {
    expect(CODIGO).toContain("const outras = mostrando ? contagem - 1 : contagem")
  })

  it("com ações, a faixa de cima soma a linha delas — senão a lista as cobre", () => {
    expect(CODIGO).toContain("has-[[data-slot=command-input-wrapper]~[data-slot=combobox-actions]]:[--scroll-fade-band-h:calc(--spacing(8)+--spacing(4)+--spacing(7))]")
    expect(CODIGO).toMatch(/relative z-10 flex items-center gap-1 px-2 pb-1/)
  })

  it("o campo que digita mora dentro da raiz do cmdk, e o painel não rouba o foco", () => {
    expect(CODIGO).toContain('<Command filter={commandFilter} className="contents">')
    expect(CODIGO).toContain("onOpenAutoFocus={(e) => e.preventDefault()}")
  })

  it("as telas migradas não montam mais o seletor à mão", () => {
    const filtros = fonte("src/components/transactions/transactions-filters-panel.tsx")
    expect(filtros).toMatch(/<Combobox\s+multiple/)
    expect(filtros).not.toContain("categoryQuery")
    expect(filtros).not.toContain("cardQuery")
    for (const arquivo of [
      "src/components/bills/pay-bill-dialog.tsx",
      "src/components/bills/bill-form-fields.tsx",
    ]) {
      const codigo = fonte(arquivo)
      expect(codigo, arquivo).toMatch(/<Combobox\s/)
      expect(codigo, arquivo).toMatch(/media=\{<ColorTile size="xs"/)
    }
  })
})
