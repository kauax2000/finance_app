import { describe, expect, it } from "vitest"
import { retryStableClientId } from "@/lib/offline/retry-client-id"

describe("retryStableClientId", () => {
    it("a mesma linha reenviada depois de falhar reusa o id", () => {
        const row = { workspace_id: "w1", name: "Mercado", amount: 50 }
        const first = retryStableClientId(row)
        expect(retryStableClientId({ ...row }).clientId).toBe(first.clientId)
    })

    it("depois do sucesso a próxima linha igual ganha id novo", () => {
        const row = { workspace_id: "w1", name: "Luz", amount: 120 }
        const first = retryStableClientId(row)
        first.settle()
        expect(retryStableClientId(row).clientId).not.toBe(first.clientId)
    })

    it("linhas diferentes não dividem id", () => {
        const a = retryStableClientId({ workspace_id: "w1", name: "A" })
        const b = retryStableClientId({ workspace_id: "w1", name: "B" })
        expect(a.clientId).not.toBe(b.clientId)
    })
})
