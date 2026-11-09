import { describe, expect, it } from "vitest"

import { conferirNoCiclo } from "@/lib/fatura/ciclo"
import type { LancamentoParaConferir } from "@/lib/fatura/conferir"
import { prepararItens } from "@/lib/import/importar"
import type { CreditCardStatementTotal } from "@/lib/supabase"

import { aplicarAlinhamento } from "./alinhar"
import { aprovaSozinha, estadoDaFatura, semDiferencas, somaDoCiclo } from "./estado"

const ciclo = { inicio: "2026-09-27", fechamento: "2026-10-26" }
const ap = (id: string, date: string, amount: number, type: "expense" | "income" = "expense"): LancamentoParaConferir => ({
    id, date, description: id, amount, type, installment_sequence: null,
})
const total = (bank_total: number, approved_at: string | null = null) =>
    ({ bank_total, approved_at }) as CreditCardStatementTotal

describe("estadoDaFatura", () => {
    it("sem total", () => expect(estadoDaFatura(null, 10)).toEqual({ tipo: "sem-total" }))
    it("a conferir", () =>
        expect(estadoDaFatura(total(100), 90)).toEqual({ tipo: "a-conferir", diferenca: 10 }))
    it("igual", () => expect(estadoDaFatura(total(9480.97), 9480.97)).toEqual({ tipo: "igual" }))
    it("aprovada", () =>
        expect(estadoDaFatura(total(50, "2026-11-09T10:00:00Z"), 50)).toEqual({ tipo: "aprovada", em: "2026-11-09T10:00:00Z" }))
    it("mudou depois", () =>
        expect(estadoDaFatura(total(9480.97, "2026-11-09T10:00:00Z"), 9470.97)).toEqual({
            tipo: "mudou-depois", diferenca: 10, em: "2026-11-09T10:00:00Z",
        }))
})

describe("somaDoCiclo", () => {
    it("ignora fora do ciclo e abate o estorno", () =>
        expect(somaDoCiclo([ap("a", "2026-10-01", 100), ap("b", "2026-10-02", 30, "income"), ap("c", "2026-11-05", 999)], ciclo)).toBe(70))
})

describe("semDiferencas", () => {
    const banco = prepararItens([{ data: "2026-10-01", descricao: "Cafe", valor: 23, estorno: false, parcela: null }], [])
    it("falso com um só no app", () =>
        expect(semDiferencas(conferirNoCiclo(banco, [ap("Cafe", "2026-10-01", 23), ap("x", "2026-10-02", 5)], ciclo), ciclo)).toBe(false))
    it("verdadeiro com tudo batendo", () =>
        expect(semDiferencas(conferirNoCiclo(banco, [ap("Cafe", "2026-10-01", 23)], ciclo), ciclo)).toBe(true))
})

describe("aprovaSozinha", () => {
    const banco = prepararItens([{ data: "2026-10-01", descricao: "PELANDA ALPINO 3", valor: 228.13, estorno: false, parcela: null }], [])
    it("aprova a leitura completa sem diferenças e sem par da IA", () =>
        expect(aprovaSozinha(conferirNoCiclo(banco, [ap("PELANDA ALPINO 3", "2026-10-01", 228.13)], ciclo), ciclo, true)).toBe(true))
    it("não aprova a leitura incompleta", () =>
        expect(aprovaSozinha(conferirNoCiclo(banco, [ap("PELANDA ALPINO 3", "2026-10-01", 228.13)], ciclo), ciclo, false)).toBe(false))
    it("com par da IA, mesmo de valor igual, não aprova sozinha", () => {
        const c = aplicarAlinhamento(conferirNoCiclo(banco, [ap("Gasolina", "2026-10-06", 228.13)], ciclo), [{ banco: 0, app: 0 }])
        expect(semDiferencas(c, ciclo)).toBe(true)
        expect(c.daIA.size).toBe(1)
        expect(aprovaSozinha(c, ciclo, true)).toBe(false)
    })
})
