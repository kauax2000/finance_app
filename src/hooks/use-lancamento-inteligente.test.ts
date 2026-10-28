import { describe, expect, it } from "vitest"
import { lerLancamentoInteligente } from "./use-lancamento-inteligente"

describe("lerLancamentoInteligente", () => {
    it("liga sem armazenamento, sem valor ou com erro", () => {
        expect(lerLancamentoInteligente(null)).toBe(true)
        expect(lerLancamentoInteligente({ getItem: () => null })).toBe(true)
        expect(
            lerLancamentoInteligente({
                getItem: () => {
                    throw new Error()
                },
            }),
        ).toBe(true)
    })
    it('desliga só com "0"', () => {
        expect(lerLancamentoInteligente({ getItem: () => "0" })).toBe(false)
    })
})
