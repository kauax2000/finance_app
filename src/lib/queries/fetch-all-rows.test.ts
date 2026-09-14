import { describe, expect, it } from "vitest"
import { fetchAllRows } from "@/lib/queries/fetch-all-rows"

const table = Array.from({ length: 2500 }, (_, i) => i)

describe("fetchAllRows", () => {
    it("junta as páginas até a última vir incompleta", async () => {
        const asked: [number, number][] = []
        const rows = await fetchAllRows(async (from, to) => {
            asked.push([from, to])
            return { data: table.slice(from, to + 1), error: null }
        })
        expect(rows).toHaveLength(2500)
        expect(asked).toEqual([[0, 999], [1000, 1999], [2000, 2999]])
    })

    it("página cheia exata pede mais uma e para no vazio", async () => {
        const rows = await fetchAllRows(async (from, to) => ({
            data: table.slice(0, 1000).slice(from, to + 1),
            error: null,
        }))
        expect(rows).toHaveLength(1000)
    })

    it("erro em qualquer página falha a busca", async () => {
        await expect(
            fetchAllRows(async (from) => (from === 0 ? { data: table.slice(0, 1000), error: null } : { data: null, error: { message: "boom" } })),
        ).rejects.toThrow("boom")
    })
})
