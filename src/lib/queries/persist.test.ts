import type { Query } from "@tanstack/react-query"
import { describe, expect, it } from "vitest"
import { shouldPersistQuery } from "@/lib/queries/persist"

const consulta = (key: unknown[]) =>
    ({ queryKey: key, state: { status: "success" } }) as unknown as Query

describe("shouldPersistQuery", () => {
    it("não guarda o acesso: um snapshot restaurado nunca busca de novo", () => {
        expect(shouldPersistQuery(consulta(["acesso", "u1"]))).toBe(false)
    })
    it("guarda uma consulta comum", () => {
        expect(shouldPersistQuery(consulta(["transactions", "w1"]))).toBe(true)
    })
})
