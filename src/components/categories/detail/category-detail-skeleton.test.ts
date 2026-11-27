import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const fonte = semComentarios(lerFonte("src/components/categories/detail/category-detail-skeleton.tsx"))

describe("CategoryDetailSkeleton no telefone", () => {
    it("abre com o topo centrado: ladrilho, nome, valor e legenda, só no telefone", () => {
        expect(fonte).toContain('shape="tile" size="2xl"')
        expect(fonte).toContain('"-mt-3.5 flex flex-col items-center gap-2 pb-4 md:hidden"')
        expect(fonte).toContain("h-10")
    })

    it("não tem mais o título 'Este mês' nem o ⋯ no telefone", () => {
        expect(fonte).not.toContain("h-4 w-20")
        expect(fonte).not.toContain("justify-between md:hidden")
    })

    it("no telefone, o topo espera o chip e o resumo espera num cartão", () => {
        expect(fonte).toMatch(/<Skeleton shape="pill"[^>]*h-5\.5/)
        expect(fonte).toMatch(/<Card aria-hidden className="h-30\.5 md:hidden"/)
    })
})
