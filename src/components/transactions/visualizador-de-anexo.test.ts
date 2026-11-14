import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

/** O Abrir do anexo mostra o arquivo dentro do app, sem popup bloqueado. */
describe("VisualizadorDeAnexo", () => {
    const fonte = semComentarios(lerFonte("src/components/transactions/visualizador-de-anexo.tsx"))

    it("é um Dialog que vira gaveta no telefone, aberto pelo anexo", () => {
        expect(fonte).toContain("<Dialog")
        expect(fonte).toContain('surface="auto"')
        expect(fonte).toContain("open={anexo != null}")
    })

    it("tem as duas ações e o erro", () => {
        expect(fonte).toContain("Abrir em nova aba")
        expect(fonte).toContain("Baixar")
        expect(fonte).toContain("Não foi possível abrir o anexo.")
    })

    it("nomeia o PDF e a foto", () => {
        expect(fonte).toMatch(/<iframe[^>]*title=/)
        expect(fonte).toMatch(/<img[^>]*alt=/)
    })

    it("guarda as URLs pelo caminho do anexo mostrado", () => {
        expect(fonte).toMatch(/queryKey:[^\n]*mostrado\?\.path/)
        expect(fonte).toContain("retry: false")
    })

    it("o detalhe usa o visualizador, sem o link do popup", () => {
        const detalhe = semComentarios(lerFonte("src/components/transactions/anexos-do-lancamento.tsx"))
        expect(detalhe).toContain("VisualizadorDeAnexo")
        expect(detalhe).not.toContain("abrirAnexo")
        expect(detalhe).not.toContain('target="_blank"')
        expect(detalhe).not.toContain("Abrir anexo")
    })
})
