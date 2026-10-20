import { describe, expect, it } from "vitest"
import { ROUTES } from "@/config/navigation"
import { getVoceGroups, isVoceTabActive, voceBackHref } from "@/config/mobile-navigation"

const hrefs = (g: ReturnType<typeof getVoceGroups>[number]) => g.items.map((i) => i.href)

describe("a página Você", () => {
    it("dois grupos: a carteira e a conta, sem Planos e com Configurações por último", () => {
        const [carteira, conta] = getVoceGroups([])
        expect(carteira.id).toBe("carteira")
        expect(hrefs(carteira)).toEqual([ROUTES.SUBSCRIPTIONS, ROUTES.BILLS, ROUTES.CREDIT_CARDS, ROUTES.MEMBERS])
        expect(hrefs(conta)).toEqual([ROUTES.ACCOUNT, ROUTES.SETTINGS])
    })

    it("a aba que saiu da barra entra primeiro na carteira", () => {
        const [carteira] = getVoceGroups([ROUTES.DASHBOARD_CATEGORIES])
        expect(hrefs(carteira)[0]).toBe(ROUTES.DASHBOARD_CATEGORIES)
    })

    it("Você acende na página e nas telas que ela abre", () => {
        expect(isVoceTabActive(ROUTES.ME, [])).toBe(true)
        expect(isVoceTabActive(ROUTES.ACCOUNT_SESSIONS, [])).toBe(true)
        expect(isVoceTabActive(`${ROUTES.CREDIT_CARDS}/abc`, [])).toBe(true)
        expect(isVoceTabActive(ROUTES.TRANSACTIONS, [])).toBe(false)
        expect(isVoceTabActive(ROUTES.DASHBOARD_CATEGORIES, [])).toBe(false)
        expect(isVoceTabActive(`${ROUTES.DASHBOARD_CATEGORIES}/x`, [ROUTES.DASHBOARD_CATEGORIES])).toBe(true)
    })

    it("Planos e pagamentos, aberto de Minha conta, continua debaixo de Você", () => {
        expect(isVoceTabActive(ROUTES.PLANS, [])).toBe(true)
        // Não é linha da página: o voltar de lá é o de Minha conta, não o de Você.
        expect(voceBackHref(ROUTES.PLANS)).toBeUndefined()
    })

    it("o voltar do telefone leva a Você só das telas que ela lista", () => {
        expect(voceBackHref(ROUTES.SUBSCRIPTIONS)).toBe(ROUTES.ME)
        expect(voceBackHref(ROUTES.SETTINGS)).toBe(ROUTES.ME)
        expect(voceBackHref(`${ROUTES.SETTINGS}/aparencia`)).toBeUndefined()
        expect(voceBackHref(ROUTES.ACCOUNT_SESSIONS)).toBeUndefined()
        expect(voceBackHref(ROUTES.DASHBOARD_CATEGORIES)).toBeUndefined()
    })
})
