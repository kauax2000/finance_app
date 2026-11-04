import { describe, expect, it } from "vitest"
import { MAIN_NAVIGATION, ROUTES } from "@/config/navigation"
import { decidirRotaDoConvidado, itensDeNavegacaoPara, rotaPermitidaAoConvidado, ROTAS_DO_CONVIDADO } from "@/lib/papeis/rotas-do-convidado"
import { arquivosTsx, lerFonte, semComentarios } from "@/test/fonte"

describe("as rotas do convidado", () => {
    it("o Painel, as transações (com a busca), as categorias, a lista de cartões e a conta", () => {
        expect(rotaPermitidaAoConvidado("/dashboard")).toBe(true)
        expect(rotaPermitidaAoConvidado("/transactions?q=x")).toBe(true)
        expect(rotaPermitidaAoConvidado("/categories")).toBe(true)
        expect(rotaPermitidaAoConvidado("/categories/abc?month=2026-10")).toBe(true)
        expect(rotaPermitidaAoConvidado("/credit-cards")).toBe(true)
        expect(rotaPermitidaAoConvidado("/me")).toBe(true)
        expect(rotaPermitidaAoConvidado("/settings")).toBe(true)
        expect(rotaPermitidaAoConvidado("/settings/privacidade")).toBe(true)
        // Ruling 7: exportar e apagar sempre liberados (spec §15.6), e os planos são da pessoa.
        expect(rotaPermitidaAoConvidado("/cofre")).toBe(true)
        expect(rotaPermitidaAoConvidado("/plans")).toBe(true)
    })

    it("o que é da casa fica de fora", () => {
        for (const rota of ["/bills", "/previsao", "/members", "/subscriptions", "/piloto", "/comecar"]) {
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

    it("a navegação: o convidado vê só as dele; o adulto, tudo", () => {
        const doConvidado = itensDeNavegacaoPara("guest", MAIN_NAVIGATION).map((i) => i.href)
        expect(doConvidado).toEqual([ROUTES.DASHBOARD, ROUTES.TRANSACTIONS, ROUTES.DASHBOARD_CATEGORIES, ROUTES.CREDIT_CARDS])
        expect(itensDeNavegacaoPara("member", MAIN_NAVIGATION)).toEqual(MAIN_NAVIGATION)
        expect(itensDeNavegacaoPara("owner", MAIN_NAVIGATION)).toEqual(MAIN_NAVIGATION)
    })

    it("com o papel a caminho, só os itens comuns aos dois (nada aparece e some para o convidado)", () => {
        expect(itensDeNavegacaoPara(null, MAIN_NAVIGATION)).toEqual(itensDeNavegacaoPara("guest", MAIN_NAVIGATION))
        expect(itensDeNavegacaoPara(undefined, MAIN_NAVIGATION)).toEqual(itensDeNavegacaoPara("guest", MAIN_NAVIGATION))
    })
})

describe("a decisão da guarda", () => {
    it("papel a caminho: espera, em qualquer rota", () => {
        expect(decidirRotaDoConvidado(null, "/bills")).toBe("esperar")
        expect(decidirRotaDoConvidado(undefined, "/dashboard")).toBe("esperar")
    })
    it("convidado numa rota dele: segue", () => {
        expect(decidirRotaDoConvidado("guest", "/transactions")).toBe("ok")
        expect(decidirRotaDoConvidado("guest", "/cofre")).toBe("ok")
    })
    it("convidado fora da lista: o Painel", () => {
        expect(decidirRotaDoConvidado("guest", "/bills")).toBe("/dashboard")
        expect(decidirRotaDoConvidado("guest", "/credit-cards/abc")).toBe("/dashboard")
    })
    it("o adulto segue em qualquer rota", () => {
        expect(decidirRotaDoConvidado("member", "/bills")).toBe("ok")
        expect(decidirRotaDoConvidado("owner", "/members")).toBe("ok")
    })
    it("a barra no fim não muda a decisão", () => {
        expect(decidirRotaDoConvidado("guest", "/transactions/")).toBe("ok")
        expect(decidirRotaDoConvidado("guest", "/bills/")).toBe("/dashboard")
        expect(decidirRotaDoConvidado("guest", "/dashboard/")).toBe("ok")
    })
    it("a guarda segue a decisão e não reescreve a regra", () => {
        const guarda = semComentarios(lerFonte("src/components/layout/convidado-route-guard.tsx"))
        expect(guarda).toContain("decidirRotaDoConvidado(papel, pathname)")
        expect(guarda).not.toContain("isAdulto")
        expect(lerFonte("src/app/(app)/layout-client.tsx")).toContain("<ConvidadoRouteGuard>{children}</ConvidadoRouteGuard>")
    })
})
