import { describe, expect, it } from "vitest"
import { linhasConhecidas, partitionTransactionDeletes } from "@/lib/transactions/delete-transactions"

describe("partitionTransactionDeletes", () => {
    it("routes installment rows to plan cascades and plain rows to single deletes", () => {
        const result = partitionTransactionDeletes([
            { id: "tx-1", installment_plan_id: "plan-a" },
            { id: "tx-2", installment_plan_id: "plan-a" },
            { id: "tx-3", installment_plan_id: null },
            { id: "tx-4", installment_plan_id: "plan-b" },
        ])

        expect(result.planIds).toEqual(["plan-a", "plan-b"])
        expect(result.plainTransactionIds).toEqual(["tx-3"])
    })

    it("dedupes multiple parcels from the same plan", () => {
        const result = partitionTransactionDeletes([
            { id: "tx-1", installment_plan_id: "plan-a" },
            { id: "tx-2", installment_plan_id: "plan-a" },
        ])

        expect(result.planIds).toEqual(["plan-a"])
        expect(result.plainTransactionIds).toEqual([])
    })

    it("keeps non-installment bulk deletes as plain transactions", () => {
        const result = partitionTransactionDeletes([
            { id: "tx-1", installment_plan_id: null },
            { id: "tx-2", installment_plan_id: null },
        ])

        expect(result.planIds).toEqual([])
        expect(result.plainTransactionIds).toEqual(["tx-1", "tx-2"])
    })
})

describe("linhasConhecidas", () => {
    it("leva o installment_plan_id das linhas que a tela tem", () => {
        expect(
            linhasConhecidas(["a", "b"], [
                { id: "b", installment_plan_id: "plan-1" },
                { id: "a", installment_plan_id: null },
            ]),
        ).toEqual([
            { id: "a", installment_plan_id: null },
            { id: "b", installment_plan_id: "plan-1" },
        ])
    })

    it("com as linhas dadas somadas às da lista, resolve sem o banco", () => {
        const dadas = [{ id: "a", installment_plan_id: "plan-1" }]
        const lista = [{ id: "b", installment_plan_id: null }]
        expect(linhasConhecidas(["a", "b"], [...dadas, ...lista])).toEqual([
            { id: "a", installment_plan_id: "plan-1" },
            { id: "b", installment_plan_id: null },
        ])
    })

    it("sem uma das linhas devolve undefined, para o banco resolver o plano", () => {
        // A lista vazia é o controlador com skipListQuery (o detalhe da categoria).
        expect(linhasConhecidas(["a"], [])).toBeUndefined()
        expect(linhasConhecidas(["a", "b"], [{ id: "a", installment_plan_id: null }])).toBeUndefined()
    })
})
