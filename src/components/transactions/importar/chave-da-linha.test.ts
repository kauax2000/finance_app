import { describe, expect, it } from "vitest"

import { chavesDasLinhas } from "./chave-da-linha"

const l = (descricao: string, valor: number, data = "2026-10-02") => ({ data, descricao, valor })

describe("chavesDasLinhas", () => {
    it("linhas iguais ganham chaves distintas", () => {
        const [a, b] = chavesDasLinhas([l("Mercado", 10), l("Mercado", 10)])
        expect(a).not.toBe(b)
    })
    it("virar o sinal mantém a chave", () => {
        expect(chavesDasLinhas([l("Mercado", 10)])).toEqual(chavesDasLinhas([l("Mercado", -10)]))
    })
    it("linhas diferentes têm chaves diferentes", () => {
        const k = chavesDasLinhas([l("Mercado", 10), l("Padaria", 10), l("Mercado", 11), l("Mercado", 10, "2026-10-03")])
        expect(new Set(k).size).toBe(4)
    })
})
