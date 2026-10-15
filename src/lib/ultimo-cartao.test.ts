import { beforeEach, describe, expect, it } from "vitest"
import { cartaoPreEscolhido, gravarUltimoCartao } from "@/lib/ultimo-cartao"
import type { CreditCard } from "@/lib/supabase"

const cartao = (id: string, ativo = true) =>
    ({ id, workspace_id: "w1", is_active: ativo }) as CreditCard

describe("cartaoPreEscolhido", () => {
    beforeEach(() => {
        const mem = new Map<string, string>()
        globalThis.localStorage = {
            getItem: (k: string) => mem.get(k) ?? null,
            setItem: (k: string, v: string) => void mem.set(k, v),
        } as Storage
    })

    it("o único ativo vem escolhido; sem ativo, nada", () => {
        expect(cartaoPreEscolhido([cartao("a"), cartao("b", false)])).toBe("a")
        expect(cartaoPreEscolhido([cartao("a", false)])).toBe("")
    })

    it("com mais de um, o último gravado na carteira, se ainda estiver ativo", () => {
        const cards = [cartao("a"), cartao("b")]
        expect(cartaoPreEscolhido(cards)).toBe("")
        gravarUltimoCartao("w1", "b")
        expect(cartaoPreEscolhido(cards)).toBe("b")
        expect(cartaoPreEscolhido([cartao("a"), cartao("b", false), cartao("c")])).toBe("")
    })
})
