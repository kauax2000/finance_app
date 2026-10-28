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

const hook = semComentarios(lerFonte("src/components/transactions/use-leitura-do-lancamento.ts"))
const dialogo = semComentarios(lerFonte("src/components/transactions/transaction-form-dialog.tsx"))

describe("a leitura do lançamento inteligente", () => {
    it("o convidado não vê Receita nem Estorno, e a leitura vira despesa", () => {
        expect(fonte).toMatch(/papel === "guest"[\s\S]*TIPOS\.filter/)
        expect(fonte).toContain("tipos.map(")
        expect(hook).toContain('papel === "guest"')
        expect(hook).toContain("soDespesa(")
    })

    it("Receita e Parcelada pedidas pelo ⌘K abrem o formulário; o compartilhar segue na paleta", () => {
        expect(dialogo).toMatch(/\(ligado && defaultLaunchKind === "expense"\) \|\| Boolean\(fraseInicial \|\| fotoInicial\)/)
    })

    it("inativa (fechada ou trocada pelo formulário), nada se aplica e o histórico não carrega", () => {
        expect(dialogo).toContain("ativo: usarPaleta && open")
        expect(hook).toContain("if (!ativo || !campos) return")
        expect(hook).toMatch(/if \(!ativo\) return\s+let vivo = true/)
        expect(hook).toContain("}, [ativo, queryClient, currentWorkspaceId])")
    })
})
