import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { ContaOuAssinaturaWireframe } from "./conta-ou-assinatura-wireframe"
import { ContaValorVariavelWireframe } from "./conta-valor-variavel-wireframe"

describe("wireframes do Bloco 6A", () => {
    it("conta ou assinatura: a frase e o link para o outro cadastro, dos dois lados", () => {
        const conta = renderToStaticMarkup(createElement(ContaOuAssinaturaWireframe, { onde: "conta" }))
        expect(conta).toContain("WIREFRAME · Bloco 6 · Conta ou assinatura")
        expect(conta).toContain("Conta a pagar: você paga, e o app lembra e confirma.")
        expect(conta).toContain('href="/subscriptions?new=1"')

        const assinatura = renderToStaticMarkup(createElement(ContaOuAssinaturaWireframe, { onde: "assinatura" }))
        expect(assinatura).toContain("Assinatura: é cobrada sozinha, e o app lança.")
        expect(assinatura).toContain('href="/bills?new=1"')
    })

    it("valor variável: a caixa e a explicação", () => {
        const html = renderToStaticMarkup(
            createElement(ContaValorVariavelWireframe, { valorVariavel: true, onChange: () => {} })
        )
        expect(html).toContain("WIREFRAME · Bloco 6 · Valor variável")
        expect(html).toContain("O valor muda todo mês (luz, água)")
        expect(html).toContain('checked=""')
    })
})
