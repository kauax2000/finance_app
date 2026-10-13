import { readdirSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { createElement } from "react"

import {
    AuthMiniApp,
    MINI_APP_PEOPLE,
    MINI_APP_URL,
    type MiniAppScreen,
} from "@/components/auth/showcase/mini-app"
import { ShowcaseHero, ShowcaseStage } from "@/components/ui/showcase"
import { IDENTITY_TONES, identityToneFor } from "@/lib/avatar"
import { getInitials } from "@/lib/utils"

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

describe("o mundo comum (8b)", () => {
    const pasta = "src/components/auth/showcase"
    const fontes = readdirSync(pasta)
        .filter((f) => f.endsWith(".tsx"))
        .map((f) => [f, semComentarios(lerFonte(`${pasta}/${f}`))] as const)

    it("o dinheiro grande nunca cai no mono, e a busca nunca escuta o teclado", () => {
        for (const [f, fonte] of fontes) {
            for (const tag of fonte.match(/<MoneyDisplay\b[^>]*>/g) ?? []) {
                if (/size="(xl|2xl)"/.test(tag)) expect(tag, f).toContain("mono={false}")
            }
            for (const tag of fonte.match(/<TopBarSearch\b[^>]*>/g) ?? []) expect(tag, f).toContain("listen={false}")
        }
    })

    it("o palco não tem nada que colida com o formulário de verdade", () => {
        for (const [f, fonte] of fontes) {
            for (const proibido of ["<input", "<form", 'type="password"', " id=", " name=", "<Alert", "InputOTP"]) {
                expect(fonte, `${f}: ${proibido}`).not.toContain(proibido)
            }
        }
    })

    it("as pessoas da casa caem na identidade do cursor de cada uma", () => {
        expect(identityToneFor(MINI_APP_PEOPLE.ana.color, MINI_APP_PEOPLE.ana.name)).toBe(IDENTITY_TONES[0])
        expect(identityToneFor(MINI_APP_PEOPLE.rafael.color, MINI_APP_PEOPLE.rafael.name)).toBe(IDENTITY_TONES[4])
        expect(identityToneFor(MINI_APP_PEOPLE.voce.color, MINI_APP_PEOPLE.voce.name)).toBe(IDENTITY_TONES[2])
        expect(getInitials(MINI_APP_PEOPLE.voce.name)).toBe("VC")
    })

    const tela = (form: "browser" | "tablet" | "phone", screen: MiniAppScreen, member = false) =>
        renderToStaticMarkup(
            createElement(
                ShowcaseStage,
                null,
                createElement(
                    ShowcaseHero,
                    { form, url: MINI_APP_URL[screen] },
                    createElement(AuthMiniApp, { screen, member })
                )
            )
        ).replace(/\u00a0/g, " ") // o `currencyBRL` escreve "R$" com espaço que não quebra

    it("o painel diz que é exemplo nas três formas, e as contas fecham", () => {
        for (const form of ["browser", "tablet", "phone"] as const) {
            const html = tela(form, "dashboard")
            expect(html, form).toContain(">dados de exemplo<")
            expect(html, form).toContain("R$ 4.182,60")
            expect(html, form).toContain("+7,8% vs setembro")
        }
        // Entradas menos saídas é o saldo; o saldo sobre setembro é o +7,8%.
        expect(7850 - 3667.4).toBeCloseTo(4182.6, 2)
        expect(Math.round((4182.6 / 3880 - 1) * 1000) / 10).toBe(7.8)
    })

    it("as âncoras dos cursores existem onde as cenas as procuram", () => {
        expect(tela("browser", "dashboard")).toContain('data-showcase-anchor="search"')
        expect(tela("phone", "dashboard")).not.toContain('data-showcase-anchor="search"')
        expect(tela("phone", "budget")).toContain('data-showcase-anchor="budget"')
        for (const member of [false, true]) {
            const html = tela("tablet", "wallet", member)
            expect(html).toContain('data-showcase-anchor="avatar-add"')
            expect(html).toContain('data-showcase-anchor="row-internet"')
        }
        expect(tela("browser", "invoice")).toContain("R$ 1.284,60")
        expect(tela("tablet", "wallet-loading")).toContain('data-slot="skeleton"')
    })

    it("a carteira fecha: a sua parte é um terço nos dois lados do convite, e quem pagou só no tablet", () => {
        for (const member of [false, true]) {
            const html = tela("tablet", "wallet", member)
            expect(html).toContain(">Sua parte<")
            expect(html).not.toContain("Por pessoa")
            expect(html).toContain("R$ 828,27")
            expect(html).toContain("Quem pagou em outubro")
        }
        expect(tela("phone", "wallet")).not.toContain("Quem pagou em outubro")
        expect(tela("browser", "wallet")).not.toContain("Quem pagou em outubro")
        expect(Math.round((2150 + 119.9 + 214.9) / 3 * 100) / 100).toBe(828.27)
        // Já pago: o aluguel (Rafael) e a feira (Ana); falta a internet.
        expect(Math.round(((2150 + 214.9) / 2484.8) * 100)).toBe(95)
    })
})
