import { describe, expect, it } from "vitest"
import { resumoDoProjeto, SEM_CATEGORIA } from "./resumo"

const lancs = [
    { amount: 300.1, type: "expense", category_id: "hospedagem", user_id: "ana" },
    { amount: 199.95, type: "expense", category_id: "passeios", user_id: "bia" },
    { amount: 50, type: "expense", category_id: "hospedagem", user_id: "bia" },
    { amount: 2000, type: "income", category_id: "salario", user_id: "ana" },
]

describe("resumoDoProjeto", () => {
    it("só despesa entra: o gasto, a falta e as quebras por categoria e por pessoa", () => {
        expect(resumoDoProjeto(lancs, 1000)).toEqual({
            gastoCentavos: 55005,
            faltaCentavos: 44995,
            porCategoria: { hospedagem: 35010, passeios: 19995 },
            porPessoa: { ana: 30010, bia: 24995 },
        })
    })

    it("o gasto acima do orçamento dá falta negativa", () => {
        expect(resumoDoProjeto(lancs, 500).faltaCentavos).toBe(-5005)
    })

    it("sem orçamento a falta é nula", () => {
        expect(resumoDoProjeto(lancs, null).faltaCentavos).toBeNull()
    })

    it("o lançamento sem categoria cai numa chave só", () => {
        const r = resumoDoProjeto([{ amount: 10, type: "expense", category_id: null, user_id: "ana" }], null)
        expect(r.porCategoria).toEqual({ [SEM_CATEGORIA]: 1000 })
    })
})
