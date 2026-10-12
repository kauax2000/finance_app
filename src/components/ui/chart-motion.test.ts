import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"
import {
    CHART_EASING,
    CHART_ENTER_MS,
    CHART_UPDATE_MS,
} from "@/components/ui/chart"

// O Recharts e o `motion` leem número e string, não token: as constantes do
// gráfico espelham o `globals.css`, e é isto que as impede de divergir dele.
const CSS = lerFonte("src/app/globals.css")
const token = (nome: string) =>
    CSS.match(new RegExp(`${nome}:\\s*([^;]+);`))?.[1].trim()

describe("o movimento do gráfico fala os tokens da casa", () => {
    it("a entrada é --duration-spring e a troca é --duration-slow", () => {
        expect(token("--duration-spring")).toBe(`${CHART_ENTER_MS}ms`)
        expect(token("--duration-slow")).toBe(`${CHART_UPDATE_MS}ms`)
    })

    it("a curva das marcas é --ease-out, que não passa do alvo", () => {
        expect(token("--ease-out")).toBe(CHART_EASING)
    })
})
