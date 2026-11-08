import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { FilterValue } from "@/components/ui/filter-bar"

const h = vi.hoisted(() => ({ linhas: [] as unknown[], selects: [] as string[], ranges: [] as number[][] }))

vi.mock("@/lib/supabase", () => ({
    supabase: {
        from: () => {
            const q: Record<string, unknown> = {}
            for (const m of ["eq", "in", "not", "is", "or", "gte", "lte", "ilike", "order"]) q[m] = () => q
            q.select = (s: string) => {
                h.selects.push(s)
                return q
            }
            q.range = (from: number, to: number) => {
                h.ranges.push([from, to])
                return Promise.resolve({ data: h.linhas.slice(from, to + 1), error: null, count: h.linhas.length })
            }
            return q
        },
    },
}))

import {
    aplicarFiltros,
    fetchTransacoesParaExportar,
    fetchTransacoesPagina,
    LIMITE_DE_SOMA,
} from "./transacoes-filtradas"

type Chamada = [string, ...unknown[]]
function builder() {
    const chamadas: Chamada[] = []
    const q = new Proxy({} as Record<string, unknown>, {
        get: (_, m: string) => (...a: unknown[]) => {
            chamadas.push([m, ...a])
            return q
        },
    })
    return { q, chamadas }
}
const f = (field: string, operator: FilterValue["operator"], values: string[] = []): FilterValue => ({ field, operator, values })
function rodar(filtros: FilterValue[], extra: { type?: "all" | "income" | "expense"; q?: string } = {}) {
    const { q, chamadas } = builder()
    aplicarFiltros(q, { type: extra.type ?? "all", q: extra.q ?? "", filtros })
    return chamadas
}

describe("aplicarFiltros", () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date(2026, 10, 7, 12))
    })
    afterEach(() => vi.useRealTimers())

    it("tipo", () => expect(rodar([], { type: "expense" })).toContainEqual(["eq", "type", "expense"]))
    it("tipo all não filtra", () => expect(rodar([])).toEqual([]))
    it("busca escapa % _ e barra", () =>
        expect(rodar([], { q: "50% off" })).toContainEqual(["ilike", "description", "%50\\% off%"]))
    it("token Descrição contém, com o mesmo escape", () =>
        expect(rodar([f("descricao", "contains", ["50% off"])])).toContainEqual(["ilike", "description", "%50\\% off%"]))
    it("período este-mes", () => {
        const c = rodar([f("periodo", "is", ["este-mes"])])
        expect(c).toContainEqual(["gte", "date", "2026-11-01T00:00:00.000Z"])
        expect(c).toContainEqual(["lte", "date", "2026-11-07T23:59:59.999Z"])
    })
    it("categoria is", () => expect(rodar([f("categoria", "is", ["a", "b"])])).toEqual([["in", "category_id", ["a", "b"]]]))
    it("categoria is sem categoria", () => expect(rodar([f("categoria", "is", ["__none__"])])).toEqual([["is", "category_id", null]]))
    it("categoria is misto", () =>
        expect(rodar([f("categoria", "is", ["a", "__none__"])])).toEqual([["or", "category_id.in.(a),category_id.is.null"]]))
    it("categoria is-not misto", () =>
        expect(rodar([f("categoria", "is-not", ["a", "__none__"])])).toEqual([
            ["not", "category_id", "in", "(a)"],
            ["not", "category_id", "is", null],
        ]))
    it("pagamento is-not", () =>
        expect(rodar([f("pagamento", "is-not", ["pix"])])).toEqual([["not", "payment_method", "in", "(pix)"]]))
    it("cartao sem exigir pagamento", () =>
        expect(rodar([f("cartao", "is", ["X"])])).toEqual([["in", "payment_credit_card_id", ["X"]]]))
    it("valor between", () =>
        expect(rodar([f("valor", "between", ["10", "50"])])).toEqual([
            ["gte", "amount", 10],
            ["lte", "amount", 50],
        ]))
    it("valor gte e lte", () => {
        expect(rodar([f("valor", "gte", ["1234.56"])])).toEqual([["gte", "amount", 1234.56]])
        expect(rodar([f("valor", "lte", ["5"])])).toEqual([["lte", "amount", 5]])
    })
    it("conferir", () => expect(rodar([f("conferir", "is")])).toEqual([["eq", "needs_review", true]]))
    it("captura expande importação e mcp", () => {
        expect(rodar([f("captura", "is", ["importacao"])])).toEqual([
            ["in", "source", ["import_pdf", "import_sheet", "import_statement"]],
        ])
        expect(rodar([f("captura", "is", ["mcp", "app"])])).toEqual([["in", "source", ["ia_externa", "app"]]])
    })
    it("pessoa, pagou, projeto", () => {
        expect(rodar([f("pessoa", "is", ["u"])])).toEqual([["in", "user_id", ["u"]]])
        expect(rodar([f("pagou", "is", ["u"])])).toEqual([["in", "paid_by", ["u"]]])
        expect(rodar([f("projeto", "is", ["p"])])).toEqual([["in", "project_id", ["p"]]])
        expect(rodar([f("projeto", "is-not", ["p"])])).toEqual([["not", "project_id", "in", "(p)"]])
    })
    it("parcelada, plano, assinatura, recorrente", () => {
        expect(rodar([f("parcelada", "is")])).toEqual([["not", "installment_plan_id", "is", null]])
        expect(rodar([f("plano", "is", ["P"])])).toEqual([["eq", "installment_plan_id", "P"]])
        expect(rodar([f("assinatura", "is", ["S"])])).toEqual([["eq", "subscription_id", "S"]])
        expect(rodar([f("recorrente", "is")])).toEqual([["eq", "is_recurring", true]])
    })
})

const estado = { type: "all" as const, q: "", filtros: [], sort: { key: "date" as const, dir: "desc" as const }, page: 1 }

describe("fetchTransacoesParaExportar e página", () => {
    beforeEach(() => {
        h.linhas = []
        h.ranges = []
    })
    it("exporta cortando no limite", async () => {
        h.linhas = Array.from({ length: LIMITE_DE_SOMA + 5 }, (_, i) => ({ id: String(i) }))
        const r = await fetchTransacoesParaExportar({ workspaceId: "w", estado })
        expect(r.transactions).toHaveLength(LIMITE_DE_SOMA)
        expect(r.truncado).toBe(true)
    })
    it("página usa range de PAGE_SIZE e junta cartões", async () => {
        h.linhas = [{ id: "1", payment_credit_card_id: "c1" }]
        const r = await fetchTransacoesPagina({
            workspaceId: "w",
            estado,
            cartoes: [{ id: "c1", name: "Nubank" }] as never,
        })
        expect(h.ranges[0]).toEqual([0, 99])
        await fetchTransacoesPagina({ workspaceId: "w", estado: { ...estado, page: 3 } })
        expect(h.ranges[1]).toEqual([200, 299])
        expect(r.totalCount).toBe(1)
        expect((r.transactions[0] as unknown as { payment_card: { name: string } }).payment_card.name).toBe("Nubank")
    })
})
