import { describe, expect, it, vi } from "vitest"

import { destinoDosDetalhes } from "./mcp-consentimento-wireframe"

vi.mock("@/lib/supabase", () => ({ supabase: {} }))

describe("destinoDosDetalhes", () => {
    it("já consentiu: redireciona", () => {
        expect(destinoDosDetalhes({ redirect_url: "https://claude.ai/cb?code=x" })).toEqual({
            tipo: "redirecionar",
            url: "https://claude.ai/cb?code=x",
        })
    })
    it("precisa consentir: pergunta", () => {
        expect(
            destinoDosDetalhes({
                authorization_id: "a",
                client: { name: "Claude" },
                redirect_uri: "https://claude.ai/cb",
            }),
        ).toEqual({ tipo: "perguntar", cliente: "Claude", redirect: "https://claude.ai/cb" })
    })
    it("resposta vazia ou sem forma: erro", () => {
        expect(destinoDosDetalhes(null)).toEqual({ tipo: "erro" })
        expect(destinoDosDetalhes({})).toEqual({ tipo: "erro" })
        expect(destinoDosDetalhes({ authorization_id: "a" })).toEqual({ tipo: "erro" })
    })
})
