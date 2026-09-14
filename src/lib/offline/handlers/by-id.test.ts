import { beforeEach, describe, expect, it, vi } from "vitest"
import type { OfflineMutation } from "@/lib/offline/types"

const db = vi.hoisted(() => {
    const state = {
        calls: [] as unknown[][],
        results: [] as { data: unknown; error: unknown }[],
    }
    const query: Record<string, unknown> = {}
    for (const method of ["from", "update", "delete", "eq", "select"]) {
        query[method] = (...args: unknown[]) => {
            state.calls.push([method, ...args])
            return query
        }
    }
    query.then = (resolve: (v: unknown) => unknown) =>
        Promise.resolve(state.results.shift() ?? { data: null, error: null }).then(resolve)
    return { state, query }
})

vi.mock("@/lib/supabase", () => ({ supabase: db.query }))

const { deleteById, updateById } = await import("@/lib/offline/handlers/by-id")

const mutation = (payload: Record<string, unknown>) =>
    ({ workspaceId: "w1", payload, idempotencyKey: "k1" }) as unknown as OfflineMutation

beforeEach(() => {
    db.state.calls = []
    db.state.results = []
})

describe("handlers offline por id", () => {
    it("update sem linha afetada não conta como sincronizado", async () => {
        db.state.results.push({ data: [], error: null })
        const result = await updateById("categories", mutation({ serverId: "c1", name: "X", client_id: "k1" }))
        expect(result.ok).toBe(false)
        expect(db.state.calls).toContainEqual(["eq", "workspace_id", "w1"])
        expect(db.state.calls).toContainEqual(["update", { name: "X" }])
    })

    it("update que acha a linha sincroniza", async () => {
        db.state.results.push({ data: [{ id: "c1" }], error: null })
        expect(await updateById("categories", mutation({ serverId: "c1", name: "X" }))).toEqual({ ok: true })
    })

    it("a linha alternativa é tentada quando a primeira falha", async () => {
        db.state.results.push({ data: null, error: { message: "coluna" } }, { data: [{ id: "t1" }], error: null })
        const result = await updateById("transactions", mutation({ serverId: "t1", amount: 5, payment_method: "pix" }), (row) => ({
            amount: row.amount,
        }))
        expect(result).toEqual({ ok: true })
        expect(db.state.calls).toContainEqual(["update", { amount: 5 }])
    })

    it("delete fica preso à carteira da fila", async () => {
        expect(await deleteById("credit_cards", mutation({ serverId: "cc1" }))).toEqual({ ok: true })
        expect(db.state.calls).toContainEqual(["eq", "id", "cc1"])
        expect(db.state.calls).toContainEqual(["eq", "workspace_id", "w1"])
    })
})
