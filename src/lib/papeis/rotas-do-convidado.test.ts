import { describe, expect, it } from "vitest"
import { MAIN_NAVIGATION, ROUTES } from "@/config/navigation"
import { itensDeNavegacaoPara, rotaPermitidaAoConvidado, ROTAS_DO_CONVIDADO } from "@/lib/papeis/rotas-do-convidado"
import { arquivosTsx } from "@/test/fonte"

describe("as rotas do convidado", () => {
    it("o Painel, as transações (com a busca), as categorias, a lista de cartões e a conta", () => {
        expect(rotaPermitidaAoConvidado("/dashboard")).toBe(true)
        expect(rotaPermitidaAoConvidado("/transactions?q=x")).toBe(true)
        expect(rotaPermitidaAoConvidado("/categories")).toBe(true)
        expect(rotaPermitidaAoConvidado("/categories/abc?month=2026-10")).toBe(true)
        expect(rotaPermitidaAoConvidado("/credit-cards")).toBe(true)
        expect(rotaPermitidaAoConvidado("/me")).toBe(true)
        expect(rotaPermitidaAoConvidado("/settings")).toBe(true)
        expect(rotaPermitidaAoConvidado("/account/sessions")).toBe(true)
    })

    it("o que é da casa fica de fora", () => {
        for (const rota of ["/bills", "/previsao", "/members", "/subscriptions", "/plans", "/cofre", "/piloto", "/comecar"]) {
            expect(rotaPermitidaAoConvidado(rota), rota).toBe(false)
        }
    })

    it("a fatura e a conferência (o detalhe do cartão) e criar categoria também", () => {
        expect(rotaPermitidaAoConvidado("/credit-cards/abc")).toBe(false)
        expect(rotaPermitidaAoConvidado("/categories/new")).toBe(false)
        // Prefixo não é subrota.
        expect(rotaPermitidaAoConvidado("/dashboardx")).toBe(false)
        expect(rotaPermitidaAoConvidado("/transactions-velhas")).toBe(false)
    })

    it("toda rota da lista existe em src/app/(app)", () => {
        const paginas = arquivosTsx("src/app/(app)")
            .filter((f) => f.endsWith("/page.tsx"))
            .map((f) => f.slice(f.indexOf("src/app/(app)") + "src/app/(app)".length).replace("/page.tsx", "").replace(/\/\([^/]+\)/g, ""))
        for (const rota of ROTAS_DO_CONVIDADO) expect(paginas, rota).toContain(rota)
    })

    it("a navegação: o convidado vê só as dele; o adulto e o papel a caminho, tudo", () => {
        const doConvidado = itensDeNavegacaoPara("guest", MAIN_NAVIGATION).map((i) => i.href)
        expect(doConvidado).toEqual([ROUTES.DASHBOARD, ROUTES.TRANSACTIONS, ROUTES.DASHBOARD_CATEGORIES, ROUTES.CREDIT_CARDS])
        expect(itensDeNavegacaoPara("member", MAIN_NAVIGATION)).toEqual(MAIN_NAVIGATION)
        expect(itensDeNavegacaoPara(null, MAIN_NAVIGATION)).toEqual(MAIN_NAVIGATION)
    })
})
