import { beforeEach, describe, expect, it, vi } from "vitest"
import type { OfflineMutation } from "@/lib/offline/types"

const db = vi.hoisted(() => {
    const state = {
        calls: [] as unknown[][],
        results: [] as { data: unknown; error: unknown }[],
    }
    const query: Record<string, unknown> = {}
    for (const method of ["from", "insert", "update", "delete", "eq", "select", "maybeSingle", "single", "upsert", "in", "order", "limit"]) {
        query[method] = (...args: unknown[]) => {
            state.calls.push([method, ...args])
            return query
        }
    }
    query.then = (resolve: (v: unknown) => unknown) =>
        Promise.resolve(state.results.shift() ?? { data: null, error: null }).then(resolve)
    query.auth = { getSession: async () => ({ data: { session: { user: { id: "u1" } } } }) }
    return { state, query }
})

vi.mock("@/lib/supabase", () => ({ supabase: db.query }))

const { syncBillMutation } = await import("@/lib/offline/handlers/bills")

const agenda = { frequency: "monthly", due_day_of_month: 10, start_date: "2026-01-01", end_date: null, is_active: true }

beforeEach(() => {
    db.state.calls = []
    db.state.results = []
    vi.useFakeTimers({ now: new Date(2026, 10, 15, 12) })
})

describe("syncBillMutation (replay do update da conta)", () => {
    it("reprograma a pendente futura como o caminho online", async () => {
        db.state.results.push(
            { data: agenda, error: null },
            { data: [{ id: "b1" }], error: null },
            { data: [{ id: "i1", due_date: "2026-12-10" }], error: null },
            { data: [], error: null },
            { data: null, error: null }
        )
        const r = await syncBillMutation({
            entity: "bill",
            operation: "update",
            workspaceId: "w1",
            idempotencyKey: "k1",
            payload: { ...agenda, due_day_of_month: 20, serverId: "b1" },
        } as unknown as OfflineMutation)
        expect(r).toEqual({ ok: true })
        expect(db.state.calls.filter((c) => c[0] === "update")[1]).toEqual(["update", { due_date: "2026-11-20" }])
    })

    it("a conta criada offline sem primeira instância não grava instância", async () => {
        db.state.results.push({ data: { id: "b1" }, error: null })
        const r = await syncBillMutation({
            entity: "bill",
            operation: "insert",
            workspaceId: "w1",
            idempotencyKey: "k1",
            payload: { name: "Luz", user_id: "u1" },
        } as unknown as OfflineMutation)
        expect(r).toEqual({ ok: true })
        expect(db.state.calls).not.toContainEqual(["from", "bill_instances"])
    })
})
