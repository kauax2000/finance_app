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

import { marcarConferidos } from "./mutations"

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
