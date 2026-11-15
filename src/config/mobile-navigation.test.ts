import { describe, expect, it } from "vitest"
import { ArrowTrendingUpIcon } from "@heroicons/react/24/outline"
import { MAIN_NAVIGATION, ROUTES } from "@/config/navigation"
import { getMobileNavTabs, getVoceGroups, isVoceTabActive, mobileHeaderFilterFor, voceBackHref } from "@/config/mobile-navigation"
import { arquivosTsx, lerFonte } from "@/test/fonte"

const hrefs = (g: ReturnType<typeof getVoceGroups>[number]) => g.items.map((i) => i.href)

describe("a página Você", () => {
    it("dois grupos: a carteira e a conta (Planos primeiro e Política de privacidade por último), sem Configurações", () => {
        const [carteira, conta] = getVoceGroups([], "owner")
        expect(carteira.id).toBe("carteira")
        expect(hrefs(carteira)).toEqual([ROUTES.PREVISAO, ROUTES.CREDIT_CARDS, ROUTES.BILLS, ROUTES.SUBSCRIPTIONS, ROUTES.PROJETOS, ROUTES.MEMBERS])
        expect(hrefs(conta)).toEqual([ROUTES.PLANS, ROUTES.SETTINGS_IAS, ROUTES.SETTINGS_NOTIFICACOES, ROUTES.SETTINGS_PRIVACIDADE])
    })
    it("as quatro telas de configuração do telefone acendem Você e voltam a ela", () => {
        for (const r of [ROUTES.SETTINGS_LANCAR, ROUTES.SETTINGS_PRIVACIDADE, ROUTES.SETTINGS_IAS, ROUTES.SETTINGS_NOTIFICACOES]) {
            expect(isVoceTabActive(r, [])).toBe(true)
            expect(voceBackHref(r)).toBe(ROUTES.ME)
        }
        expect(voceBackHref(`${ROUTES.SETTINGS}/aparencia`)).toBeUndefined()
    })

    it("a aba que saiu da barra entra primeiro na carteira", () => {
        const [carteira] = getVoceGroups([ROUTES.DASHBOARD_CATEGORIES], "owner")
        expect(hrefs(carteira)[0]).toBe(ROUTES.DASHBOARD_CATEGORIES)
    })

    it("Você acende na página e nas telas que ela abre", () => {
        expect(isVoceTabActive(ROUTES.ME, [])).toBe(true)
        expect(isVoceTabActive(ROUTES.PLANS, [])).toBe(true)
        expect(isVoceTabActive(`${ROUTES.CREDIT_CARDS}/abc`, [])).toBe(true)
        expect(isVoceTabActive(`${ROUTES.PROJETOS}/abc`, [])).toBe(true)
        expect(isVoceTabActive(ROUTES.PREVISAO, [])).toBe(true)
        expect(isVoceTabActive(ROUTES.TRANSACTIONS, [])).toBe(false)
        expect(isVoceTabActive(ROUTES.DASHBOARD_CATEGORIES, [])).toBe(false)
        expect(isVoceTabActive(`${ROUTES.DASHBOARD_CATEGORIES}/x`, [ROUTES.DASHBOARD_CATEGORIES])).toBe(true)
    })

    it("Planos e pagamentos e a Política de privacidade são linhas de Você e voltam a ela", () => {
        expect(isVoceTabActive(ROUTES.PLANS, [])).toBe(true)
        expect(isVoceTabActive(ROUTES.SETTINGS_PRIVACIDADE, [])).toBe(true)
        expect(voceBackHref(ROUTES.PLANS)).toBe(ROUTES.ME)
        expect(voceBackHref(ROUTES.SETTINGS_PRIVACIDADE)).toBe(ROUTES.ME)
    })

    it("o voltar do telefone leva a Você só das telas que ela lista", () => {
        expect(voceBackHref(ROUTES.SUBSCRIPTIONS)).toBe(ROUTES.ME)
        expect(voceBackHref(ROUTES.PREVISAO)).toBe(ROUTES.ME)
        expect(voceBackHref(`${ROUTES.SETTINGS}/aparencia`)).toBeUndefined()
        expect(voceBackHref(ROUTES.DASHBOARD_CATEGORIES)).toBeUndefined()
    })
})

describe("a Previsão na navegação", () => {
    it("é a segunda da barra lateral, com o ícone de tendência", () => {
        expect(MAIN_NAVIGATION[1]).toEqual({ name: "Previsão", href: ROUTES.PREVISAO, icon: ArrowTrendingUpIcon })
    })
})

describe("o telefone do convidado (Bloco 7A)", () => {
    const daCasa = [ROUTES.BILLS, ROUTES.PREVISAO, ROUTES.SUBSCRIPTIONS, ROUTES.MEMBERS]

    it("a barra não tem Orçamento, Previsão, Contas nem Membros", () => {
        const abas = getMobileNavTabs("guest").map((t) => t.href)
        expect(abas).toEqual([ROUTES.DASHBOARD, ROUTES.TRANSACTIONS, ROUTES.DASHBOARD_CATEGORIES])
        for (const href of daCasa) expect(abas).not.toContain(href)
    })

    it("a página Você não lista Assinaturas, Contas a pagar nem Membros", () => {
        const [carteira, conta] = getVoceGroups([], "guest")
        expect(hrefs(carteira)).toEqual([ROUTES.CREDIT_CARDS])
        expect(hrefs(conta)).toEqual([ROUTES.PLANS, ROUTES.SETTINGS_IAS, ROUTES.SETTINGS_NOTIFICACOES, ROUTES.SETTINGS_PRIVACIDADE])
        for (const href of daCasa) expect([...hrefs(carteira), ...hrefs(conta)]).not.toContain(href)
    })

    it("com o papel a caminho, a mesma página do convidado (os itens de adulto entram depois)", () => {
        expect(getVoceGroups([], null)).toEqual(getVoceGroups([], "guest"))
        expect(getMobileNavTabs(null)).toEqual(getMobileNavTabs("guest"))
    })

    it("o adulto continua com tudo", () => {
        expect(getVoceGroups([], "member")).toEqual(getVoceGroups([], "owner"))
    })
})

describe("o filtro do cabeçalho pela rota", () => {
    it("diz o ícone de cada tela, ou nenhum", () => {
        expect(mobileHeaderFilterFor(ROUTES.DASHBOARD)).toBe("month")
        expect(mobileHeaderFilterFor(ROUTES.DASHBOARD_CATEGORIES)).toBe("month")
        expect(mobileHeaderFilterFor(`${ROUTES.DASHBOARD_CATEGORIES}/abc`)).toBe("month")
        expect(mobileHeaderFilterFor(`${ROUTES.DASHBOARD_CATEGORIES}/new`)).toBeNull()
        expect(mobileHeaderFilterFor(ROUTES.TRANSACTIONS)).toBe("filter")
        expect(mobileHeaderFilterFor(ROUTES.BILLS)).toBe("filter")
        expect(mobileHeaderFilterFor(ROUTES.SETTINGS_PRIVACIDADE)).toBeNull()
    })

    it("a tabela concorda com as telas que publicam filtro", () => {
        const raiz = "src/app/(app)"
        const telas = arquivosTsx(raiz).filter((f) => f.endsWith("/page-client.tsx"))
        const achados: [string, "month" | "filter"][] = []
        for (const arquivo of telas) {
            const fonte = lerFonte(arquivo)
            const mes = fonte.includes("useMonthInHeader(")
            const lista =
                fonte.includes("<BillsToolbar") ||
                // A barra nova de Transações publica o filtro sempre (`usePageChromeFilter`).
                fonte.includes("<TransacoesToolbar") ||
                (fonte.includes("<TransactionsToolbar") && !fonte.includes("headerFilter={false}"))
            // Dois filtros numa tela só: o cabeçalho tem um botão.
            expect(mes && lista, `${arquivo} publica mês e lista`).toBe(false)
            if (!mes && !lista) continue
            const rota = arquivo
                .slice(arquivo.indexOf(raiz) + raiz.length)
                .replace("/page-client.tsx", "")
                .replace(/\/\([^/]+\)/g, "")
                .replace(/\[[^\]]+\]/g, "abc")
            achados.push([rota, mes ? "month" : "filter"])
        }
        expect(achados.length).toBeGreaterThanOrEqual(5)
        for (const [rota, icone] of achados) {
            expect(mobileHeaderFilterFor(rota), rota).toBe(icone)
        }
    })
})
