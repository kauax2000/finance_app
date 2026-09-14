import { describe, expect, it } from "vitest"
import { deltaTone } from "@/lib/delta-tone"

describe("deltaTone", () => {
    it("gasto que sobe é saída, que cai é entrada", () => {
        expect(deltaTone("up", "expense")).toBe("expense")
        expect(deltaTone("down", "expense")).toBe("income")
    })

    it("receita que sobe é entrada, que cai é saída", () => {
        expect(deltaTone("up", "income")).toBe("income")
        expect(deltaTone("down", "income")).toBe("expense")
    })

    it("sem variação é neutro", () => {
        expect(deltaTone("flat", "expense")).toBe("neutral")
        expect(deltaTone("flat", "income")).toBe("neutral")
    })
})
