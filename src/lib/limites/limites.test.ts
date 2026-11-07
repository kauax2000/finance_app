import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/supabase", () => ({ supabase: {} }))

import { lerFonte, semComentarios } from "@/test/fonte"

import {
    LIMITE_MAXIMO,
    lerLimiteDigitado,
    linhasDosLimites,
    nivelDoLimite,
    passoInicial,
    situacaoDoLimite,
    type LancamentoDaPessoa,
} from "./limites"

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

describe("lerLimiteDigitado: o valor em reais, de 0,01 ao teto de numeric(12,2)", () => {
    it("lê a máscara pt-BR e recusa zero, vazio, lixo e acima do teto", () => {
        expect(lerLimiteDigitado("1.234,56")).toBe(1234.56)
        expect(lerLimiteDigitado("250")).toBe(250)
        expect(lerLimiteDigitado("9.999.999.999,99")).toBe(LIMITE_MAXIMO)
        expect(lerLimiteDigitado("0")).toBeNull()
        expect(lerLimiteDigitado("0,00")).toBeNull()
        expect(lerLimiteDigitado("")).toBeNull()
        expect(lerLimiteDigitado("abc")).toBeNull()
        expect(lerLimiteDigitado("10.000.000.000,00")).toBeNull()
    })
})

describe("lerLancamentosDoMes: paginado, no mês e no anterior", () => {
    it("a fonte pede página por página, só o mês e o anterior, e o gasto é o da Edge", () => {
        const fonte = semComentarios(lerFonte("src/lib/limites/limites.ts"))
        const corpo = fonte.slice(fonte.indexOf("export async function lerLancamentosDoMes"), fonte.indexOf("export const LIMITE_MAXIMO"))
        expect(corpo).toContain("fetchAllRows<TxDoMes>(")
        expect(corpo).toMatch(/\.order\("id"\)\s*\.range\(from, to\)/)
        expect(corpo).toContain("periodBoundsFromYearMonth(shiftYearMonth(ym, -1)).period_start")
        expect(corpo).toContain("periodBoundsFromYearMonth(ym).period_end")
        expect(corpo).not.toContain("paddedBoundsForYearMonth")
        expect(fonte).toMatch(/const gastoCentavos = gastoDaPessoaNoMes\(lancs, user_id, ym\)/)
        expect(fonte).toContain('from "../../../supabase/functions/_shared/limite-pessoa"')
    })
})

describe("situacaoDoLimite", () => {
    it("passou: excesso em centavos", () => {
        expect(situacaoDoLimite(221243, 1000)).toEqual({ pct: 221, tipo: "passou", valorCentavos: 121243 })
    })
    it("sobra: resto em centavos", () => {
        expect(situacaoDoLimite(142866, 5000)).toEqual({ pct: 29, tipo: "sobra", valorCentavos: 357134 })
    })
    it("gasto igual ao limite: sobra zero, 100%", () => {
        expect(situacaoDoLimite(100000, 1000)).toEqual({ pct: 100, tipo: "sobra", valorCentavos: 0 })
    })
    it("limite com centavos sem erro de ponto flutuante", () => {
        expect(situacaoDoLimite(1000, 10.1)).toEqual({ pct: 99, tipo: "sobra", valorCentavos: 10 })
    })
})

describe("passoInicial: o primeiro passo de Adicionar limite", () => {
    it("com uma pessoa só sem limite, abre no valor; com mais, na escolha", () => {
        expect(passoInicial(1)).toBe(2)
        expect(passoInicial(2)).toBe(1)
        expect(passoInicial(5)).toBe(1)
    })
})
