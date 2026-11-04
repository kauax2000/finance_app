import { describe, expect, it } from "vitest"
import { PRAZO_DIAS, appRecente, deveGravar, diasDesde, voltouDeAusencia } from "./reativacao"

const agora = new Date("2026-11-20T12:00:00-03:00")
describe("reativacao", () => {
    it("o prazo é de 10 dias", () => expect(PRAZO_DIAS).toBe(10))
    it("conta os dias pela data", () => {
        expect(diasDesde("2026-11-10T23:30:00-03:00", agora)).toBe(10)
        expect(diasDesde("2026-11-20T08:00:00-03:00", agora)).toBe(0)
    })
    it("voltou só depois de 10 dias, e conta nova não volta", () => {
        expect(voltouDeAusencia("2026-11-10T09:00:00-03:00", agora)).toBe(true)
        expect(voltouDeAusencia("2026-11-11T09:00:00-03:00", agora)).toBe(false)
        expect(voltouDeAusencia(null, agora)).toBe(false)
    })
    it("app recente enquanto houver uso nos últimos 10 dias", () => {
        expect(appRecente("2026-11-11T09:00:00-03:00", agora)).toBe(true)
        expect(appRecente("2026-11-10T09:00:00-03:00", agora)).toBe(false)
        expect(appRecente(null, agora)).toBe(false)
    })
    it("grava uma vez por dia", () => {
        expect(deveGravar(null, "2026-11-20")).toBe(true)
        expect(deveGravar("2026-11-19", "2026-11-20")).toBe(true)
        expect(deveGravar("2026-11-20", "2026-11-20")).toBe(false)
    })
})
