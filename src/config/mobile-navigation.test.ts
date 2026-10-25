import { describe, expect, it } from "vitest"
import { ROUTES } from "@/config/navigation"
import { getMobileNavTabs, getVoceGroups, isVoceTabActive, mobileHeaderFilterFor, voceBackHref } from "@/config/mobile-navigation"
import { arquivosTsx, lerFonte } from "@/test/fonte"

const hrefs = (g: ReturnType<typeof getVoceGroups>[number]) => g.items.map((i) => i.href)

describe("a página Você", () => {
    it("dois grupos: a carteira e a conta, sem Planos, com o Cofre aberto e Configurações por último", () => {
        const [carteira, conta] = getVoceGroups([], "owner")
        expect(carteira.id).toBe("carteira")
        expect(hrefs(carteira)).toEqual([ROUTES.SUBSCRIPTIONS, ROUTES.BILLS, ROUTES.CREDIT_CARDS, ROUTES.PROJETOS, ROUTES.MEMBERS])
        expect(hrefs(conta)).toEqual([ROUTES.ACCOUNT, ROUTES.COFRE, ROUTES.SETTINGS])
    })

    it("a aba que saiu da barra entra primeiro na carteira", () => {
        const [carteira] = getVoceGroups([ROUTES.DASHBOARD_CATEGORIES], "owner")
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
        expect(hrefs(conta)).toEqual([ROUTES.ACCOUNT, ROUTES.COFRE, ROUTES.SETTINGS])
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
        expect(mobileHeaderFilterFor(ROUTES.ACCOUNT)).toBeNull()
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
