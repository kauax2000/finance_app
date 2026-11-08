import { describe, expect, it, vi } from "vitest"

const h = vi.hoisted(() => ({ chamadas: [] as unknown[][], erro: null as { message: string } | null }))

vi.mock("@/lib/supabase", () => ({
    supabase: {
        from: (t: string) => ({
            update: (v: unknown) => ({
                in: (c: string, ids: string[]) => {
                    h.chamadas.push([t, v, c, ids])
                    return Promise.resolve({ error: h.erro })
                },
            }),
        }),
    },
}))

import { categorizarEmLote, marcarConferidos } from "./mutations"

describe("marcarConferidos", () => {
    it("atualiza needs_review em lote", async () => {
        await marcarConferidos(["a", "b"])
        expect(h.chamadas[0]).toEqual(["transactions", { needs_review: false }, "id", ["a", "b"]])
    })
    it("propaga o erro", async () => {
        h.erro = { message: "falhou" }
        await expect(marcarConferidos(["a"])).rejects.toThrow()
    })
})

describe("categorizarEmLote", () => {
    it("grava a categoria e tira o a conferir nas ids", async () => {
        h.erro = null
        h.chamadas.length = 0
        await categorizarEmLote(["a"], "c")
        expect(h.chamadas[0]).toEqual(["transactions", { category_id: "c", needs_review: false }, "id", ["a"]])
    })
    it("lista vazia não grava", async () => {
        h.chamadas.length = 0
        await categorizarEmLote([], "c")
        expect(h.chamadas).toEqual([])
    })
    it("propaga o erro", async () => {
        h.erro = { message: "falhou" }
        await expect(categorizarEmLote(["a"], null)).rejects.toThrow()
        h.erro = null
    })
})
