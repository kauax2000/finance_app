import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { createElement } from "react"

import {
    AuthTestimonialCard,
    TESTIMONIALS,
    TESTIMONIAL_SLOTS,
    testimonialsFor,
} from "@/components/auth/showcase/testimonials"
import { lerFonte, semComentarios } from "@/test/fonte"

describe("depoimentos ilustrativos (8a)", () => {
    it("são 14 frases curtas, sem dígito nem dinheiro", () => {
        expect(TESTIMONIALS).toHaveLength(14)
        expect(new Set(TESTIMONIALS.map((t) => t.id)).size).toBe(14)
        for (const { quote } of TESTIMONIALS) {
            expect(quote.length, quote).toBeLessThanOrEqual(90)
            expect(quote, quote).not.toMatch(/\d/)
            expect(quote, quote).not.toContain("R$")
        }
    })

    it('o nome é só "Primeiro I."', () => {
        for (const { name } of TESTIMONIALS) expect(name).toMatch(/^\p{Lu}\p{Ll}+ \p{Lu}\.$/u)
    })

    it("cada família põe 12 frases distintas nos 12 lugares", () => {
        for (const family of ["login", "register", "recovery", "invite"] as const) {
            const ids = TESTIMONIAL_SLOTS[family]
            expect(ids).toHaveLength(12)
            expect(new Set(ids).size, family).toBe(12)
            expect(testimonialsFor(family).every(Boolean)).toBe(true)
        }
    })

    it("vindo do login, só trocam os lugares da tabela", () => {
        const trocam = (family: "register" | "recovery" | "invite") =>
            TESTIMONIAL_SLOTS[family].flatMap((id, slot) => (id === TESTIMONIAL_SLOTS.login[slot] ? [] : [slot]))
        expect(trocam("register")).toEqual([1, 4, 7, 8, 10])
        expect(trocam("recovery")).toEqual([0, 4, 11])
        expect(trocam("invite")).toEqual([1, 3, 9])
    })

    it('o cartão diz "exemplo" e põe o selo pelos quatro data-edge', () => {
        const html = renderToStaticMarkup(createElement(AuthTestimonialCard, { testimonial: TESTIMONIALS[0] }))
        expect(html).toContain(">exemplo<")
        expect(html).toContain("“Quitei o cartão")

        const fonte = semComentarios(lerFonte("src/components/auth/showcase/testimonials.tsx"))
        // `bottom` e `start` ficam no padrão (topo, à direita); `end` e `top` mudam o lugar.
        expect(fonte).toContain('"ms-auto"')
        expect(fonte).toContain("group-data-[edge=end]/showcase-item:order-first")
        expect(fonte).toContain("group-data-[edge=end]/showcase-item:me-auto")
        expect(fonte).toContain("group-data-[edge=top]/showcase-item:hidden")
        expect(fonte).toContain("group-data-[edge=top]/showcase-item:inline-flex")
        expect(fonte).toContain("line-clamp-3")
        const prosa = lerFonte("src/components/auth/showcase/testimonials.tsx")
        for (const edge of ["end", "start", "bottom", "top"]) expect(prosa).toContain(` * - \`${edge}\``)
    })
})
