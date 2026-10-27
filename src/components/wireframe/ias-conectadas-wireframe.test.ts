import { describe, expect, it, vi } from "vitest"

import { urlDoMcp } from "./ias-conectadas-wireframe"

vi.mock("@/lib/supabase", () => ({ supabase: {} }))

describe("urlDoMcp", () => {
    it("com ou sem barra no fim, o mesmo endereço", () => {
        expect(urlDoMcp("https://abc.supabase.co/")).toBe("https://abc.supabase.co/functions/v1/mcp")
        expect(urlDoMcp("https://abc.supabase.co")).toBe("https://abc.supabase.co/functions/v1/mcp")
    })
})
