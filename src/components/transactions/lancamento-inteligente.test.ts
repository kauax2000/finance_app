import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

// O `accept="image/*"` abriria um comentário de bloco no corte e engoliria o resto do arquivo.
const fonte = semComentarios(
    lerFonte("src/components/transactions/lancamento-inteligente.tsx").replaceAll('"image/*"', '"image"')
)

describe("a paleta do lançamento inteligente", () => {
    it("é o CommandDialog do design system, sem o filtro do cmdk na raiz", () => {
        expect(fonte).toContain("CommandDialog")
        expect(fonte).toContain("shouldFilter: false")
    })

    it("a linha de ação diz o que lança e por que trava", () => {
        expect(fonte).toContain("rotuloDaAcao(")
        expect(fonte).toContain("faltaParaLancar(")
    })

    it("o Enter de uma composição (acento no Mac e no iOS) não lança", () => {
        expect(fonte).toContain("isComposing")
    })

    it("a foto entra colada e solta na paleta", () => {
        expect(fonte).toContain("onPaste")
        expect(fonte).toContain("onDrop")
    })

    it("não é formulário nem wireframe, e só usa tokens e Heroicons", () => {
        expect(fonte).not.toContain("<form")
        expect(fonte).not.toContain("WireframeBox")
        expect(fonte).not.toMatch(/#[0-9a-f]{3,6}\b/i)
        expect(fonte).not.toContain("lucide")
    })
})
