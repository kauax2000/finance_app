import { describe, expect, it } from "vitest"
import { nomeLivre } from "./nome-livre"

describe("nomeLivre", () => {
    it("sugere o nome base quando ninguém o usa", () => {
        expect(nomeLivre("iPhone de Kauã", [])).toBe("iPhone de Kauã")
        expect(nomeLivre("iPhone de Kauã", ["iPad"])).toBe("iPhone de Kauã")
    })
    it("soma um número quando o nome já existe, sem olhar caixa nem espaços", () => {
        expect(nomeLivre("iPhone de Kauã", ["iPhone de Kauã"])).toBe("iPhone de Kauã 2")
        expect(nomeLivre("iPhone de Kauã", [" iphone de kauã ", "iPhone de Kauã 2"])).toBe("iPhone de Kauã 3")
    })
})
