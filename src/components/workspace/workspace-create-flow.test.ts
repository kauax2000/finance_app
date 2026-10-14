import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

/**
 * Criar carteira: o diálogo sai animado e só então a carteira nova entra, numa
 * View Transition. Sem isto a página mudava atrás do diálogo, e o `key` que
 * trocava ao fechar o fazia sumir sem saída.
 */
describe("criar carteira: sair, depois entrar", () => {
    it("o diálogo só remonta ao abrir", () => {
        const fonte = semComentarios(lerFonte("src/components/workspace/create-project-dialog.tsx"))
        expect(fonte).not.toContain("key={String(open)}")
        expect(fonte).toContain("key={abertura}")
    })

    it("a troca vem depois da saída, e criar não troca sozinho", () => {
        expect(lerFonte("src/components/workspace/project-form-dialog.tsx")).toMatch(
            /onCloseAutoFocus=\{\(\) => \{[\s\S]*?setCurrentWorkspaceId\(id\)/
        )
        const provedor = lerFonte("src/components/workspace-provider.tsx")
        const criar = provedor.slice(provedor.indexOf("const createWorkspace"), provedor.indexOf("const isWorkspaceOwner"))
        expect(criar).not.toContain("setCurrentWorkspaceId(")
        expect(provedor).toMatch(/trocarComTransicao\(\(\) =>\s*queryClient\.setQueryData/)
    })

    it("a transição nomeia o conteúdo e a marca, escopada", () => {
        expect(lerFonte("src/components/layout/sidebar-app-shell.tsx")).toContain("data-workspace-content")
        const css = lerFonte("src/app/globals.css")
        expect(css).toContain(".workspace-switch [data-workspace-content] {")
        expect(css).toContain(".workspace-switch::view-transition-new(workspace-mark)")
    })
})
