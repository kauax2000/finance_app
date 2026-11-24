import { describe, expect, it, vi } from "vitest"

import type { Insight } from "./acoes"
vi.mock("@/lib/supabase", () => ({ supabase: {} }))

import { idsDosLancamentos } from "./use-insights-da-categoria"

const linha = (kind: string, payload: Record<string, unknown>): Insight => ({
    id: kind + JSON.stringify(payload),
    workspace_id: "w",
    kind,
    payload,
    status: "new",
    created_at: "2026-11-01",
})

describe("idsDosLancamentos", () => {
    it("junta os ids das duplicidades sem repetir e ignora os outros tipos", () => {
        const linhas = [
            linha("duplicidade", { ids: ["a", "b"] }),
            linha("duplicidade", { ids: ["b", "c"] }),
            linha("sazonal", { ids: ["z"] }),
        ]
        expect(idsDosLancamentos(linhas)).toEqual(["a", "b", "c"])
    })
})
