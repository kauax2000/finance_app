import { readFileSync } from "node:fs"
import { join } from "node:path"
import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { Form, FormInput, proximoCampo } from "./form"

/** A rodada 244: o formulário sem rótulo à vista (244b: só em cima e escondido). */

const CODIGO = readFileSync(join(process.cwd(), "src/components/ui/form.tsx"), "utf8")

const solto = (labels: "visible" | "hidden", props: Record<string, unknown>) =>
  renderToStaticMarkup(h(Form, { labels }, h(FormInput, props as never)))

describe("os rótulos do Form", () => {
  it("em cima é o de sempre: o rótulo à vista e o placeholder de quem chama", () => {
    const html = solto("visible", { label: "E-mail", placeholder: "voce@exemplo.com" })
    expect(html).not.toMatch(/<label[^>]*class="[^"]*sr-only/)
    expect(html).toContain('placeholder="voce@exemplo.com"')
    expect(html).toContain('data-labels="visible"')
  })

  it("escondido tira o rótulo da vista e põe o nome, com o opcional, no placeholder", () => {
    const html = solto("hidden", { label: "Apelido", optional: true })
    expect(html).toMatch(/<label[^>]*class="[^"]*sr-only/)
    expect(html).toContain('placeholder="Apelido (opcional)"')
  })

  it("o ícone e o × moram na caixa, e o × só aparece com texto", () => {
    const com = solto("hidden", { label: "E-mail", defaultValue: "ana@exemplo.com", icon: h("svg"), clearable: true })
    expect(com).toContain('data-slot="form-field-icon"')
    expect(com).toContain('aria-label="Limpar e-mail"')
    expect(com).toMatch(/<input[^>]*class="[^"]*\bps-9\b[^"]*\bpe-9\b/)
    expect(solto("hidden", { label: "E-mail", clearable: true })).not.toContain("form-field-clear")
  })

  it("o flutuante, a lista e os ajustes saíram (244b)", () => {
    expect(CODIGO).not.toMatch(/\bFormGroup\b/)
    expect(CODIGO).not.toMatch(/"floating"|ROTULO_FLUTUANTE|"settings"|"inset"/)
  })
})

describe("o Enter que avança", () => {
  // O ambiente é `node`: campos falsos com o que a regra lê.
  const campo = (visivel = true, tabIndex = 0) =>
    ({ tabIndex, getClientRects: () => (visivel ? [{}] : []) }) as unknown as HTMLElement
  const formCom = (campos: HTMLElement[]) =>
    ({ querySelectorAll: () => campos }) as unknown as HTMLFormElement

  it("vai ao próximo campo que se pode focar, e no último não há próximo", () => {
    const [a, escondido, foraDoTab, b] = [campo(), campo(false), campo(true, -1), campo()]
    const form = formCom([a, escondido, foraDoTab, b])
    // O `<input>` escondido do `Slider` e o `tabindex="-1"` são pulados: o
    // foco neles não aconteceria, e o Enter morreria calado.
    expect(proximoCampo(form, a)).toBe(b)
    expect(proximoCampo(form, b)).toBeNull()
  })

  it("anda pelos campos de texto só sem rótulo à vista, e pergunta pela tag", () => {
    // `instanceof` falha no iframe do catálogo: o elemento é de outra janela.
    expect(CODIGO).toMatch(/alvo\.tagName === "INPUT"/)
    expect(CODIGO).toContain(":not([type=checkbox])")
    expect(CODIGO).toContain('form.dataset.labels === "hidden"')
    expect(CODIGO).toContain('"next" : "go"')
  })
})
