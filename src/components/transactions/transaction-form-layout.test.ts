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
