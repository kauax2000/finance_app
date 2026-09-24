import { describe, expect, it } from "vitest"
import {
    chartHeatLevels,
    chartRadialColor,
    splitPercents,
} from "@/components/ui/chart"
import { BUDGET_BANDS } from "@/lib/budget-bands"

describe("splitPercents", () => {
    it("soma exatamente 100, pelo maior resto", () => {
        expect(splitPercents([1, 1, 1])).toEqual([34, 33, 33])
        expect(splitPercents([30, 70])).toEqual([30, 70])
        const soma = splitPercents([123.4, 56.7, 8.9, 1]).reduce((a, b) => a + b, 0)
        expect(soma).toBe(100)
    })

    it("parte zero ou negativa não leva ponto de arredondamento", () => {
        expect(splitPercents([0, 1, 1, 1])).toEqual([0, 34, 33, 33])
        expect(splitPercents([-5, 10])).toEqual([0, 100])
        expect(splitPercents([0, 0])).toEqual([0, 0])
    })
})

describe("chartHeatLevels", () => {
    it("zero é sempre o degrau 0", () => {
        expect(chartHeatLevels([0, 0, 0])).toEqual([0, 0, 0])
        expect(chartHeatLevels([0, 10])[0]).toBe(0)
    })

    it("quartis dos dias com valor: um dia enorme não apaga o resto", () => {
        const niveis = chartHeatLevels([10, 20, 30, 40, 50, 60, 70, 80, 5000])
        expect(niveis[8]).toBe(4)
        // Sem quartis, 80 ficaria no degrau 1 de uma escala linear até 5000.
        expect(niveis[7]).toBeGreaterThanOrEqual(3)
        expect(new Set(niveis)).toEqual(new Set([1, 2, 3, 4]))
    })
})

describe("chartRadialColor", () => {
    it("com bands, a cor é de estado — e o estouro é destructive", () => {
        expect(chartRadialColor(40, BUDGET_BANDS, "var(--chart-2)")).toBe("var(--color-success)")
        expect(chartRadialColor(90, BUDGET_BANDS, "var(--chart-2)")).toBe("var(--color-warning)")
        expect(chartRadialColor(112, BUDGET_BANDS, "var(--chart-2)")).toBe("var(--color-destructive)")
    })

    it("sem bands, a cor é a da categoria", () => {
        expect(chartRadialColor(112, undefined, "var(--chart-2)")).toBe("var(--chart-2)")
    })
})
