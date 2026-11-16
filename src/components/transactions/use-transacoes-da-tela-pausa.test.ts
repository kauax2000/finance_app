import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const HOOK = semComentarios(lerFonte("src/components/transactions/use-transacoes-da-tela.ts"), "tudo")

describe("consulta de transações com pausa", () => {
    it("reusa o useDebouncedValue da paleta, com 250ms", () => {
        expect(HOOK).toContain('from "@/hooks/use-debounced-value"')
        expect(HOOK).toMatch(/useDebouncedValue\([^)]*,\s*250\)/)
    })
    it("a chave da consulta lê o valor atrasado", () => {
        expect(HOOK).not.toMatch(/estadoDaChave[^=]*=\s*\{[^}]*filtros:\s*estado\.filtros/)
    })
})
