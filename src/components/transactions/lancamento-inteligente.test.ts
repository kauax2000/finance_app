import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

// O `accept="image/*"` abriria um comentário de bloco no corte e engoliria o resto do arquivo.
const fonte = semComentarios(
    lerFonte("src/components/transactions/lancamento-inteligente.tsx").replaceAll('"image/*"', '"image"')
)

describe("a tela do lançamento inteligente (v2)", () => {
    it("é um Dialog com a pílula da busca, e não a paleta do cmdk", () => {
        expect(fonte).toContain('<Dialog surface="auto"')
        expect(fonte).toContain("<SearchInput")
        expect(fonte).not.toContain("CommandDialog")
        expect(fonte).not.toContain("CommandDock")
        expect(fonte).not.toContain("CommandPage")
        expect(fonte).not.toContain("EXEMPLOS")
    })

    it("ao lado do campo, a pílula redonda do recibo", () => {
        expect(fonte).toMatch(/size="icon-lg"\s+aria-label="Adicionar recibo"/)
        expect(fonte).toContain("<CameraIcon")
    })

    it("o Enter no campo lê a frase, não salva; o de um acento (IME) não lê", () => {
        expect(fonte).toMatch(/e\.key === "Enter" && !e\.nativeEvent\.isComposing\) \{\s*e\.preventDefault\(\)\s*leitura\.interpretar\(\)/)
        expect(fonte).not.toContain("leitura.lancar")
    })

    it("a revisão só aparece com os campos lidos, e é um Form com um submit só", () => {
        expect(fonte).toContain("campos && !lendoIA ? (")
        expect(fonte).toContain("<Form")
        expect(fonte.match(/<FormSubmit/g)).toHaveLength(1)
        expect(fonte).toContain("return leitura.aprovar()")
        expect(fonte).not.toContain('type="submit"')
    })

    it("todos os campos aparecem, e o não lido diz \"Não identificado\"", () => {
        for (const campo of ["tipo", "valor", "descricao", "categoria", "forma", "data", "parcelas"]) {
            expect(fonte).toContain(`campo: "${campo}"`)
        }
        expect(fonte).toContain('"Não identificado"')
        expect(fonte).toContain("{CAMPOS.map(")
    })

    it("o Enter de um campo em edição confirma a edição, e não aprova", () => {
        expect(fonte).toMatch(/function confirmaComEnter[\s\S]{0,160}e\.preventDefault\(\)\s*fechar\(\)/)
        expect((fonte.match(/onKeyDown=\{confirmaComEnter\}/g) ?? []).length).toBe(2)
    })

    it("o \"Aprovar\" trava com o motivo, e o formulário completo é a ação ao lado", () => {
        expect(fonte).toContain("faltaParaLancar(")
        expect(fonte).toContain("<FormSubmit disabled={falta != null}")
        expect(fonte).toMatch(/variant="tertiary"[^>]*onClick=\{onAbrirFormulario\}/)
    })

    it("a foto entra colada e solta, e todo botão cru declara o tipo", () => {
        expect(fonte).toContain("onPaste")
        expect(fonte).toContain("onDrop")
        expect(fonte).not.toMatch(/<button(?![^>]*type=)/)
    })

    it("não é wireframe, e só usa tokens e Heroicons", () => {
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
