import { describe, expect, it } from "vitest"
import { proximaLinhaDoSeletor as p } from "./picker-keys"

describe("proximaLinhaDoSeletor", () => {
    it("da busca, a seta para baixo vai à primeira linha", () => {
        expect(p(-1, 5, "ArrowDown")).toBe(0)
    })
    it("desce e sobe, e para nas pontas", () => {
        expect(p(0, 5, "ArrowDown")).toBe(1)
        expect(p(4, 5, "ArrowDown")).toBe(4)
        expect(p(3, 5, "ArrowUp")).toBe(2)
    })
    it("da primeira linha, a seta para cima volta à busca", () => {
        expect(p(0, 5, "ArrowUp")).toBe(-1)
    })
    it("Home e End só nas linhas (na busca movem o cursor do texto)", () => {
        expect(p(3, 5, "Home")).toBe(0)
        expect(p(1, 5, "End")).toBe(4)
        expect(p(-1, 5, "Home")).toBeNull()
    })
    it("lista vazia: as setas ficam na busca; outra tecla não é navegação", () => {
        expect(p(-1, 0, "ArrowDown")).toBe(-1)
        expect(p(0, 5, "a")).toBeNull()
    })
})
