import { describe, expect, it } from "vitest"
import { dados, noCartao, tx } from "./dados-de-teste"
import { gastoAcumuladoDoMes, metaDoRitmo } from "./gasto-acumulado"
import type { Seguro } from "./tipos"

describe("gastoAcumuladoDoMes", () => {
    it("soma a despesa pela data da compra, inclusive no cartão; o estorno no cartão abate e a receita fora dele não entra", () => {
        const d = dados({
            hojeYmd: "2026-11-14",
            transacoes: [
                tx("expense", 100, "2026-11-03"),
                noCartao("expense", 50, "2026-11-05", "c"),
                noCartao("income", 20, "2026-11-06", "c"),
                tx("income", 8000, "2026-11-05"),
                tx("expense", 999, "2026-10-31"),
            ],
        })
        const pontos = gastoAcumuladoDoMes(d, "2026-11")
        expect(pontos).toHaveLength(14)
        expect(pontos[1]).toEqual({ dia: 2, acumulado: 0 })
        expect(pontos[2]).toEqual({ dia: 3, acumulado: 100 })
        expect(pontos[4]).toEqual({ dia: 5, acumulado: 150 })
        expect(pontos[5]).toEqual({ dia: 6, acumulado: 130 })
        expect(pontos.at(-1)).toEqual({ dia: 14, acumulado: 130 })
    })

    it("o mês passado vai até o último dia", () => {
        const pontos = gastoAcumuladoDoMes(dados({ hojeYmd: "2026-11-14" }), "2026-02")
        expect(pontos).toHaveLength(28)
        expect(pontos.at(-1)?.dia).toBe(28)
    })

    it("no dia 1 há um ponto só", () => {
        expect(gastoAcumuladoDoMes(dados({ hojeYmd: "2026-11-01" }), "2026-11")).toEqual([
            { dia: 1, acumulado: 0 },
        ])
    })

    it("um mês que não começou não tem pontos", () => {
        expect(gastoAcumuladoDoMes(dados({ hojeYmd: "2026-11-14" }), "2026-12")).toEqual([])
    })
})

describe("metaDoRitmo", () => {
    it("é o que entra menos a reserva", () => {
        expect(metaDoRitmo({ entra: 8000, reserva: 500 } as Seguro)).toBe(7500)
        expect(metaDoRitmo({ entra: 300, reserva: 500 } as Seguro)).toBe(-200)
    })
})
