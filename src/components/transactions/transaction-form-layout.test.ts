import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const SEGMENTO = semComentarios(lerFonte("src/components/transactions/transaction-type-segment.tsx"))

describe("o seletor de tipo do formulário", () => {
    it("é um trilho segmentado, de largura toda, nomeado", () => {
        expect(SEGMENTO).toMatch(/<ToggleGroup[\s\S]*?type="single"[\s\S]*?variant="segmented"[\s\S]*?stretch/)
        expect(SEGMENTO).toContain('aria-label="Tipo de lançamento"')
        expect(SEGMENTO).toContain('aria-label="O que editar"')
        expect(SEGMENTO).not.toMatch(/FormRadioGroup[\s\S]*?variant="card"/)
    })
})

const SUPERFICIE = semComentarios(lerFonte("src/components/transactions/transaction-form-surface.tsx"))

describe("a superfície do formulário", () => {
    it("a descrição do cabeçalho é só do leitor de tela", () => {
        expect(SUPERFICIE.match(/<DialogDescription className="sr-only">/g)?.length).toBe(3)
        expect(SUPERFICIE).not.toMatch(/<DialogDescription>\{formDescription\}/)
    })

    it("o rodapé tem Cancelar e Salvar", () => {
        expect(SUPERFICIE).toContain("<FormCancel")
        expect(SUPERFICIE).toContain("<DialogClose asChild>")
        expect(SUPERFICIE).toContain("onCancel ?")
        expect(SUPERFICIE).toMatch(/<FormSubmit[^>]*disabled=\{submitDisabled\}/)
        expect(SUPERFICIE).not.toMatch(/<FormSubmit[^>]*size=/)
    })
})
