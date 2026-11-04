import { describe, expect, it } from "vitest"
import { PRAZO_DIAS, appRecente, deveGravar, diasDesde, voltouDeAusencia } from "./reativacao"

// Datas locais: o teste vale em qualquer fuso.
const local = (d: number, h: number, m = 0) => new Date(2026, 10, d, h, m).toISOString()
const agora = new Date(2026, 10, 20, 12)
describe("reativacao", () => {
    it("o prazo é de 10 dias", () => expect(PRAZO_DIAS).toBe(10))
    it("conta os dias pela data", () => {
        expect(diasDesde(local(10, 23, 30), agora)).toBe(10)
        expect(diasDesde(local(20, 8), agora)).toBe(0)
    })
    it("voltou só depois de 10 dias, e conta nova não volta", () => {
        expect(voltouDeAusencia(local(10, 9), agora)).toBe(true)
        expect(voltouDeAusencia(local(11, 9), agora)).toBe(false)
        expect(voltouDeAusencia(null, agora)).toBe(false)
    })
    it("app recente enquanto houver uso nos últimos 10 dias", () => {
        expect(appRecente(local(11, 9), agora)).toBe(true)
        expect(appRecente(local(10, 9), agora)).toBe(false)
        expect(appRecente(null, agora)).toBe(false)
    })
    it("grava uma vez por dia", () => {
        expect(deveGravar(null, "2026-11-20")).toBe(true)
        expect(deveGravar("2026-11-19", "2026-11-20")).toBe(true)
        expect(deveGravar("2026-11-20", "2026-11-20")).toBe(false)
    })
})
