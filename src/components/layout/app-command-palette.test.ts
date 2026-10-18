import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

describe("a paleta do app", () => {
    const fonte = semComentarios(lerFonte("src/components/layout/app-command-palette.tsx"))

    it("acha tudo na raiz", () => {
        // a raiz acha tudo: os grupos, na ordem do desenho
        for (const g of ["Telas", "Ações", "Transações", "Cartões", "Categorias", "Compras parceladas", "Assinaturas", "Contas a pagar", "Membros", "Carteiras"]) expect(fonte).toContain(`heading="${g}"`)
        // as sub-páginas saíram
        expect(fonte).not.toContain("CommandPages")
        expect(fonte).not.toContain('label="Categorias…"')
        // quem filtra é a paleta
        expect(fonte).toContain("shouldFilter: false")
        // as ações novas e os destinos
        for (const t of ["Nova categoria", "Novo cartão", "openCategoryCreate", "openCreditCardCreate", "?txn=", "?plan=", "?sub=", "?detail=", "verTodasHref", "setCurrentWorkspaceId"]) expect(fonte).toContain(t)
        // carregando não é "nada encontrado"
        expect(fonte).toContain("Buscando…")
        expect(fonte).toContain("Não deu para buscar transações agora.")
        // o erro é `status`, não a barra de progresso do CommandLoading
        expect(fonte).toContain('role="status"')
        expect(fonte).not.toContain('<CommandLoading label="Não deu')
        // offline a consulta pausa: conta como erro, não como "Nada encontrado"
        expect(fonte).toContain('fetchStatus === "paused"')
        // a URL do `or=` não cresce com o nome curto
        expect(fonte).toContain(".slice(0, MAX_IDS_NA_BUSCA)")
        // telas novas e sinônimos
        const fontes = lerFonte("src/components/layout/app-search-sources.ts")
        for (const t of ["fatura", "boletos", "gastos"]) expect(fontes).toContain(t)
        // fora da busca, por decisão do dono: Painel, Configurações, a conta e as notificações
        for (const t of ["ACCOUNT_SESSIONS", "ACCOUNT_ACTIVITY", "SETTINGS_NAV_ITEM", "ACCOUNT_MENU_PROFILE_LINK_ITEMS"]) expect(fontes).not.toContain(t)
        expect(fontes).toContain("item.href !== ROUTES.DASHBOARD")
        expect(fonte).not.toContain("Notificações")
    })
})
