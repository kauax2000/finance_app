import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

import { tagChipFilterSelected, tagChipNeutral } from "./badge"
import { RadioGroup, RadioGroupItem, radioGroupItemVariants } from "./radio-group"

/** As versões do `RadioGroup`. */

const grupo = (props: Record<string, unknown>, ...itens: ReturnType<typeof h>[]) =>
  renderToStaticMarkup(h(RadioGroup, props, ...itens))

describe("RadioGroup", () => {
  it("a ficha é, classe a classe, o chip de filtro do Badge", () => {
    const ficha = radioGroupItemVariants({ variant: "chip" }).split(/\s+/)
    for (const c of tagChipNeutral.split(/\s+/)) expect(ficha).toContain(c)
    for (const c of tagChipFilterSelected.split(/\s+/)) {
      const [variante, classe] = c.startsWith("dark:") ? ["dark:", c.slice(5)] : ["", c]
      expect(ficha).toContain(`${variante}has-data-checked:${classe}`)
    }
  })

  it("na ficha o rádio sai do fluxo, e nota e valor não entram", () => {
    const html = grupo(
      { variant: "chip", defaultValue: "pix" },
      h(RadioGroupItem, { value: "pix", description: "nota", trailing: "valor", children: "PIX" })
    )
    const radio = html.match(/<button[^>]*role="radio"[^>]*>/)![0]
    expect(radio).toMatch(/\bsr-only\b/)
    expect(radio).toMatch(/\babsolute\b/)
    expect(radio).not.toMatch(/\brelative\b/)
    expect(html).not.toContain("nota")
    expect(html).not.toContain("valor")
    expect(html).toContain('data-variant="chip"')
  })

  it("a linha simples aceita nota, com o rádio na primeira linha", () => {
    const html = grupo(
      {},
      h(RadioGroupItem, { value: "a", description: "Repete todo mês.", children: "Recorrente" })
    )
    expect(html).toContain('data-slot="radio-group-item-content"')
    expect(html).toContain("Repete todo mês.")
    expect(html.match(/<button[^>]*role="radio"[^>]*>/)![0]).toMatch(/\bmt-0\.5\b/)
    expect(radioGroupItemVariants({ variant: "plain" })).toContain(
      "has-data-[slot=radio-group-item-content]:items-start"
    )
  })

  it("o valor fica na outra ponta, dentro do rótulo", () => {
    const html = grupo(
      { variant: "card" },
      h(RadioGroupItem, { value: "3", trailing: "3× R$ 400,00", children: "Em 3 vezes" })
    )
    expect(html).toMatch(/data-slot="radio-group-item-trailing"[^>]*class="[^"]*ms-auto[^"]*tabular-nums/)
    // Dentro do `<label>`: entra no nome acessível.
    expect(html.indexOf("3× R$ 400,00")).toBeLessThan(html.lastIndexOf("</label>"))
  })

  it("cartão horizontal com ícone vira ladrilho, com o rádio no canto", () => {
    const ladrilho = grupo(
      { variant: "card", orientation: "horizontal" },
      h(RadioGroupItem, { value: "e", icon: h("svg"), children: "Despesa" })
    )
    expect(ladrilho).toMatch(/data-slot="radio-group-item"[^>]*class="[^"]*flex-col/)
    expect(ladrilho.match(/<button[^>]*role="radio"[^>]*>/)![0]).toMatch(/\babsolute\b.*\btop-2\.5\b|\btop-2\.5\b.*\babsolute\b/)
    expect(ladrilho).toMatch(/data-slot="radio-group-item-icon"[^>]*aria-hidden/)

    const empe = grupo(
      { variant: "card" },
      h(RadioGroupItem, { value: "e", icon: h("svg"), children: "Despesa" })
    )
    expect(empe).not.toMatch(/data-slot="radio-group-item"[^>]*class="[^"]*flex-col/)
  })

  it("a forma de pagamento é rádio em fichas, e não botões de alternar nem lista", () => {
    const tela = lerFonte("src/components/transactions/transaction-form-fields.tsx")
    expect(tela).not.toContain("PaymentMethodChips")
    expect(tela).not.toMatch(/aria-pressed/)
    expect(tela).toMatch(/label="Forma de pagamento"\s+optional\s+variant="chip"\s+deselectable/)
  })
})
