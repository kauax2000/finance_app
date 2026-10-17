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
        // telas novas e sinônimos
        const fontes = lerFonte("src/components/layout/app-search-sources.ts")
        for (const t of ["ACCOUNT_SESSIONS", "ACCOUNT_ACTIVITY", "fatura", "boletos", "gastos"]) expect(fontes).toContain(t)
    })
})
