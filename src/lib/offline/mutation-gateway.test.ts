import { beforeEach, describe, expect, it, vi } from "vitest"
import { executeMutation } from "@/lib/offline/mutation-gateway"

const enqueueMutation = vi.fn(async () => ({
    id: "mut-1",
    idempotencyKey: "key-1",
    entity: "transaction" as const,
    operation: "insert" as const,
    workspaceId: "ws-1",
    payload: {},
    createdAt: Date.now(),
    status: "pending" as const,
    retryCount: 0,
}))

vi.mock("@/lib/offline/outbox", () => ({
    enqueueMutation: (...args: unknown[]) => enqueueMutation(...args),
}))

function setOnline(value: boolean) {
    Object.defineProperty(navigator, "onLine", {
        value,
        configurable: true,
        writable: true,
    })
}

describe("executeMutation", () => {
    beforeEach(() => {
        enqueueMutation.mockClear()
        setOnline(true)
    })

    it("runs onlineFn when online", async () => {
        const onlineFn = vi.fn(async () => ({ saved: true }))
        const result = await executeMutation({
            entity: "transaction",
            operation: "insert",
            workspaceId: "ws-1",
            offlinePayload: { amount: 10 },
            onlineFn,
        })

        expect(onlineFn).toHaveBeenCalledOnce()
        expect(result).toEqual({ ok: true, data: { saved: true } })
        expect(enqueueMutation).not.toHaveBeenCalled()
    })

    it("enqueues when offline", async () => {
        setOnline(false)
        const onlineFn = vi.fn(async () => ({ saved: true }))
        const onQueued = vi.fn()

        const result = await executeMutation({
            entity: "transaction",
            operation: "insert",
            workspaceId: "ws-1",
            offlinePayload: { amount: 20 },
            onlineFn,
            onQueued,
        })

        expect(onlineFn).not.toHaveBeenCalled()
        expect(enqueueMutation).toHaveBeenCalledOnce()
        expect(onQueued).toHaveBeenCalledOnce()
        expect(result).toMatchObject({ ok: true, queued: true, mutationId: "mut-1" })
    })
})
