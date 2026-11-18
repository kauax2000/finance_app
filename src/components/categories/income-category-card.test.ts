import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/link", () => ({ default: (p: Record<string, unknown>) => h("a", p) }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {} }) }))
const { IncomeCategoryCard } = await import("./income-category-card")

function cartao(month?: { recebido: number; previsto: number }) {
    return renderToStaticMarkup(
        h(IncomeCategoryCard, {
            category: { id: "salario", name: "Salário", icon: null, color: null },
            href: "/categories/salario",
            month,
        }),
    )
}

const semEspaco = (s: string) => s.replace(/ /g, " ").replace(/<!-- -->/g, "")

describe("IncomeCategoryCard com o mês", () => {
    it("mostra o total, o recebido e o previsto", () => {
        const html = semEspaco(cartao({ recebido: 1000, previsto: 200 }))
        expect(html).toContain("R$ 1.200,00")
        expect(html).toContain("Recebido")
        expect(html).toContain("R$ 1.000,00")
        expect(html).toContain("R$ 200,00</span> previstos")
    })

    it("sem previsão, avisa", () => {
        const html = semEspaco(cartao({ recebido: 500, previsto: 0 }))
        expect(html).toContain("R$ 500,00")
        expect(html).toContain("Sem previsões no mês")
    })

    it("sem month, fica só o nome", () => {
        expect(cartao()).not.toContain("Recebido")
    })
})
