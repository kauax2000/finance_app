import { describe, expect, it } from "vitest"
import { ranquear } from "@/lib/app-search"

describe("ranquear", () => {
    const itens = [{ v: "Transações", p: ["gastos", "extrato"] }, { v: "Cartões", p: ["fatura"] }, { v: "Painel" }]
    const k = (i: (typeof itens)[number]) => ({ valor: i.v, palavras: i.p })

    it("acha pelo sinônimo, corta no limite e deixa fora o que não casa", () => {
        expect(ranquear(itens, "fatura", k, 5).map((i) => i.v)).toEqual(["Cartões"])
        expect(ranquear(itens, "gastos", k, 5).map((i) => i.v)).toEqual(["Transações"])
        expect(ranquear(itens, "", k, 2).map((i) => i.v)).toEqual(["Transações", "Cartões"])
        expect(ranquear(itens, "zzz", k, 5)).toEqual([])
    })
})
