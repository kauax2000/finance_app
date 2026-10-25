import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/supabase", () => ({ supabase: {} }))

import { linhasDosLimites, nivelDoLimite, type LancamentoDaPessoa } from "./limites"

const lanc = (o: Partial<LancamentoDaPessoa>): LancamentoDaPessoa => ({
    user_id: "ana",
    type: "expense",
    amount: 100,
    date: "2026-10-10",
    payment_method: "pix",
    card: null,
    ...o,
})

describe("limites por pessoa", () => {
    it("o nível vem da Edge: 80 e 100", () => {
        expect(nivelDoLimite(39_999, 50_000)).toBe(0)
        expect(nivelDoLimite(40_000, 50_000)).toBe(80)
        expect(nivelDoLimite(50_000, 50_000)).toBe(100)
    })

    it("uma linha por pessoa: o gasto do autor no mês, o crédito pelo fechamento", () => {
        const lancs = [
            lanc({ amount: 300 }),
            lanc({ amount: 120, date: "2026-10-28", payment_method: "credit_card", card: { closing_day: 25 } }),
            lanc({ amount: 110, date: "2026-09-28", payment_method: "credit_card", card: { closing_day: 25 } }),
            lanc({ type: "income", amount: 999 }),
            lanc({ user_id: "bia", amount: 50 }),
        ]
        const linhas = linhasDosLimites(
            [
                { user_id: "ana", nome: "Ana" },
                { user_id: "bia", nome: "Bia" },
            ],
            [{ user_id: "ana", amount: 500 }],
            lancs,
            "2026-10",
        )
        expect(linhas).toEqual([
            { user_id: "ana", nome: "Ana", limite: 500, gastoCentavos: 41_000, nivel: 80 },
            { user_id: "bia", nome: "Bia", limite: null, gastoCentavos: 5_000, nivel: 0 },
        ])
    })
})
