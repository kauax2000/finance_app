import { describe, expect, it } from "vitest"

import { direcaoDaTela } from "./direcao-da-tela"

const PAIS: Record<string, string> = {
    "/settings": "/me",
    "/account": "/me",
    "/account/sessions": "/account",
    "/categories/x": "/categories?month=2026-11",
}
const pai = (r: string) => PAIS[r]

describe("direcaoDaTela", () => {
    it("entra quando a tela nova é mais funda", () => {
        expect(direcaoDaTela("/me", "/settings", pai)).toBe("entra")
        expect(direcaoDaTela("/account", "/account/sessions", pai)).toBe("entra")
        expect(direcaoDaTela("/dashboard", "/categories/x", pai)).toBe("entra")
    })
    it("volta quando a tela nova é um ancestral, com query ou hash no voltar", () => {
        expect(direcaoDaTela("/account/sessions", "/account", pai)).toBe("volta")
        expect(direcaoDaTela("/account/sessions", "/me", pai)).toBe("volta")
        expect(direcaoDaTela("/categories/x", "/categories", pai)).toBe("volta")
    })
    it("aba não anima", () => {
        expect(direcaoDaTela("/dashboard", "/transactions", pai)).toBeNull()
        expect(direcaoDaTela("/me", "/categories", pai)).toBeNull()
    })
    it("sair de uma subpágina por outra aba não anima", () => {
        expect(direcaoDaTela("/settings", "/transactions", pai)).toBeNull()
    })
    it("subpáginas irmãs não animam", () => {
        expect(direcaoDaTela("/settings", "/account", pai)).toBeNull()
    })
    it("a mesma rota não anima", () => {
        expect(direcaoDaTela("/settings", "/settings", pai)).toBeNull()
    })
})
