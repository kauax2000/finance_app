import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SupabaseClient, User } from "@supabase/supabase-js"
import type { BillFormPayloadForSave } from "@/components/bills/bill-form-shared"
import type { Bill } from "@/lib/supabase"

vi.mock("@/lib/supabase", () => ({ supabase: {} }))
vi.mock("@/lib/offline/mutation-gateway", () => ({
    executeMutation: async (opts: { onlineFn: () => Promise<unknown> }) => {
        try {
            return { ok: true, data: await opts.onlineFn() }
        } catch (err) {
            return { ok: false, errorMessage: (err as Error).message }
        }
    },
}))

const db = vi.hoisted(() => {
    const state = {
        calls: [] as unknown[][],
        results: [] as { data: unknown; error: unknown }[],
    }
    const query: Record<string, unknown> = {}
    for (const method of ["from", "insert", "update", "delete", "eq", "select", "single", "maybeSingle", "rpc"]) {
        query[method] = (...args: unknown[]) => {
            state.calls.push([method, ...args])
            return query
        }
    }
    query.then = (resolve: (v: unknown) => unknown) =>
        Promise.resolve(state.results.shift() ?? { data: null, error: null }).then(resolve)
    return { state, client: query as unknown as SupabaseClient }
})

const { insertBillWithFirstInstance, skipBillInstance, updateBillRow } = await import("./mutations")

const user = { id: "u1" } as User

const payload: BillFormPayloadForSave = {
    name: "Luz",
    description: null,
    notes: null,
    icon: "receipt",
    category_id: null,
    frequency: "monthly",
    due_day_of_month: 20,
    amount_estimated: null,
    start_date: "2026-11-01",
    end_date: null,
    default_payment_method: null,
    default_payment_credit_card_id: null,
    reminder_days_before: [3, 0],
    is_active: true,
    valor_variavel: false,
}

const chamadas = (metodo: string) => db.state.calls.filter((c) => c[0] === metodo)

beforeEach(() => {
    db.state.calls = []
    db.state.results = []
    vi.useFakeTimers({ now: new Date(2026, 10, 15, 12) })
})

describe("insertBillWithFirstInstance", () => {
    it("a conta com end_date antes do primeiro vencimento não cria instância", async () => {
        const conta = { ...payload, id: "b1", end_date: "2026-11-10" }
        db.state.results.push({ data: conta, error: null })
        const r = await insertBillWithFirstInstance({
            supabase: db.client,
            user,
            workspaceId: "w1",
            payload: { ...payload, end_date: "2026-11-10" },
        })
        expect(r.ok).toBe(true)
        expect(db.state.calls).not.toContainEqual(["from", "bill_instances"])
    })

    it("dentro do fim, cria a primeira", async () => {
        db.state.results.push({ data: { ...payload, id: "b1" }, error: null })
        await insertBillWithFirstInstance({ supabase: db.client, user, workspaceId: "w1", payload })
        expect(chamadas("insert")[1]?.[1]).toMatchObject({ bill_id: "b1", due_date: "2026-11-20", status: "pending" })
    })

    it("grava o valor variável", async () => {
        db.state.results.push({ data: { ...payload, id: "b1" }, error: null })
        await insertBillWithFirstInstance({
            supabase: db.client,
            user,
            workspaceId: "w1",
            payload: { ...payload, valor_variavel: true },
        })
        expect(chamadas("insert")[0]?.[1]).toMatchObject({ valor_variavel: true })
    })
})

describe("updateBillRow", () => {
    it("mudar o dia de 10 para 20, com hoje em 15/11, leva a pendente de 10/12 para 20/11", async () => {
        db.state.results.push(
            { data: { ...payload, due_day_of_month: 10 }, error: null },
            { data: [{ id: "b1" }], error: null },
            { data: [{ id: "i1", due_date: "2026-12-10" }], error: null },
            { data: null, error: null }
        )
        const r = await updateBillRow({ supabase: db.client, workspaceId: "w1", billId: "b1", userId: "u1", payload })
        expect(r).toEqual({ ok: true })
        expect(chamadas("update")[1]).toEqual(["update", { due_date: "2026-11-20" }])
        expect(db.state.calls).toContainEqual(["eq", "id", "i1"])
    })
})

describe("skipBillInstance", () => {
    const bill = { ...payload, id: "b1", due_day_of_month: 10 } as unknown as Bill

    it("chama a RPC atômica com a próxima data", async () => {
        const r = await skipBillInstance({
            supabase: db.client,
            user,
            workspaceId: "w1",
            instanceId: "i1",
            bill,
            currentDueYmd: "2026-11-10",
        })
        expect(r).toEqual({ ok: true })
        expect(chamadas("rpc")[0]).toEqual([
            "rpc",
            "pular_instancia_da_conta",
            { p_instance_id: "i1", p_next_due_date: "2026-12-10" },
        ])
        expect(chamadas("update")).toHaveLength(0)
    })

    it("BILL_INSTANCE_NOT_PENDING vira a frase", async () => {
        db.state.results.push({ data: null, error: { message: "BILL_INSTANCE_NOT_PENDING" } })
        const r = await skipBillInstance({
            supabase: db.client,
            user,
            workspaceId: "w1",
            instanceId: "i1",
            bill,
            currentDueYmd: "2026-11-10",
        })
        expect(r).toEqual({ ok: false, error: "Esta conta já foi paga ou pulada." })
    })
})
