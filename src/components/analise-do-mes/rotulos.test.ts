import { describe, expect, it } from "vitest"
import { dataDoGrupo } from "./rotulos"

describe("dataDoGrupo", () => {
    it("no mês, só a data", () => {
        expect(dataDoGrupo("2026-11-23", 1, "2026-11")).toBe("23 nov")
        expect(dataDoGrupo("2026-11-23", 4, "2026-11")).toBe("4 vezes · última 23 nov")
    })
    it("compra de outro mês na fatura deste diz a fatura", () => {
        expect(dataDoGrupo("2026-10-30", 1, "2026-11")).toBe("30 out · fatura de nov")
    })
})
