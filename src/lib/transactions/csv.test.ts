import { describe, expect, it } from "vitest"
import type { Transaction } from "@/lib/supabase"
import { transacoesParaCsv } from "./csv"

const base = {
    id: "1",
    date: "2026-11-07",
    description: "Padaria",
    type: "expense",
    amount: 1234.5,
    payment_method: "pix",
    payment_card: null,
    category: { name: "Mercado" },
    user_id: "u1",
    needs_review: false,
} as unknown as Transaction
const ctx = { nomeDoMembro: (id: string) => (id === "u1" ? "Ana" : "?") }

describe("transacoesParaCsv", () => {
    it("BOM, cabeçalho e linha", () => {
        const [cab, l1] = transacoesParaCsv([base], ctx).split("\n")
        expect(cab).toBe("﻿data;descrição;categoria;tipo;valor;forma;cartão;lançado por;a conferir")
        expect(l1).toBe("07/11/2026;Padaria;Mercado;despesa;-1234,50;PIX;;Ana;não")
    })
    it("receita sem sinal, cartão e a conferir", () => {
        const t = { ...base, type: "income", payment_method: "credit_card", payment_card: { name: "Nubank" }, needs_review: true } as unknown as Transaction
        expect(transacoesParaCsv([t], ctx).split("\n")[1]).toBe("07/11/2026;Padaria;Mercado;receita;1234,50;Cartão de crédito;Nubank;Ana;sim")
    })
    it("escapa ; aspas e quebra de linha", () => {
        const t = { ...base, description: 'Mercado; "Extra"\nfim' } as Transaction
        expect(transacoesParaCsv([t], ctx)).toContain(';"Mercado; ""Extra""\nfim";')
    })
})
