import { describe, expect, it } from "vitest"
import {
    IDENTITY_TONES,
    coresDasPessoas,
    identityIndexFor,
    identityToneFor,
} from "./avatar"

describe("identityIndexFor", () => {
    it("é estável e fica entre 1 e 6", () => {
        const a = identityIndexFor(null, "Ex-membro")
        expect(identityIndexFor(null, "Ex-membro")).toBe(a)
        expect(a).toBeGreaterThanOrEqual(1)
        expect(a).toBeLessThanOrEqual(6)
    })

    it("aponta para o mesmo tom de identityToneFor", () => {
        for (const [x, s] of [[null, "ana@x.com"], ["bogus", "s"]] as const) {
            expect(IDENTITY_TONES[identityIndexFor(x, s) - 1]).toBe(
                identityToneFor(x, s)
            )
        }
    })
})

describe("coresDasPessoas", () => {
    it("usa a cor de identidade de cada índice", () => {
        expect(coresDasPessoas([1, 4])).toEqual([
            "var(--identity-1)",
            "var(--identity-4)",
        ])
    })

    it("cai na rampa de gráfico quando um índice repete", () => {
        expect(coresDasPessoas([3, 3])).toEqual([
            "var(--chart-1)",
            "var(--chart-2)",
        ])
    })
})
