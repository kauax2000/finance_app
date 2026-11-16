import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const src = semComentarios(lerFonte("src/components/transactions/transacoes-tabela.tsx"))

describe("o vazio de Transações no telefone", () => {
    it("o vazio do filtro é o leque colorido com o texto e as duas ações", () => {
        expect(src).toMatch(/emptyPhone=/)
        expect(src).toMatch(/tint="vivid"/)
        expect(src).toContain("Nada por aqui")
        expect(src).toContain("Nenhum lançamento com o filtro ligado.")
        expect(src).toContain("Nenhum lançamento com os ${nFiltros} filtros ligados.")
        expect(src).toContain("Nenhum lançamento para essa busca.")
        expect(src).toContain("Editar filtros")
        expect(src).toMatch(/variant="primary"[\s\S]{0,200}Limpar filtros/)
    })
    it("sem resultado por filtro, a barra das abas some no telefone", () => {
        expect(src).toMatch(/contents max-md:hidden/)
    })
})
