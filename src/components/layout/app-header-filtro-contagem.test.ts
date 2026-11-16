import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const HEADER = semComentarios(lerFonte("src/components/layout/app-header.tsx"), "tudo")
const TOOLBAR = semComentarios(lerFonte("src/components/transactions/transacoes-toolbar.tsx"), "tudo")

describe("contagem do filtro no cabeçalho", () => {
    it("usa a bolha do TopBarAction, como o sino", () => {
        expect(HEADER).toMatch(/count=\{filtro\.count\}/)
        expect(HEADER).toMatch(/countLabel=/)
        expect(HEADER).not.toMatch(/<Badge[^>]*>\s*\{filtro\.count\}/)
    })
    it("o nome publicado não repete o número", () => {
        expect(TOOLBAR).not.toContain("Filtros: ")
    })
})
