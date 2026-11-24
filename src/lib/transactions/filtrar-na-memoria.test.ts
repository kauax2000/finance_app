import { describe, expect, it, vi } from "vitest"
import { PROJECTED_TRANSACTION_ID_PREFIX } from "@/lib/category-expense-month-rows"
import type { FilterValue } from "@/components/ui/filter-bar"
import { PAGE_SIZE } from "@/lib/queries/fetch-transactions-list-page"
import type { Transaction } from "@/lib/supabase"
import { PARCELADAS_TODAS } from "./filtros"
import { filtrarNaMemoria, ordenarNaMemoria, paginarNaMemoria } from "./filtrar-na-memoria"

// PAGE_SIZE mora num módulo que importa o cliente do Supabase
vi.mock("@/lib/supabase", () => ({ supabase: {} }))

const tx = (p: Partial<Transaction>) =>
    ({ id: p.id ?? "x", type: "expense", amount: 10, date: "2026-11-07", created_at: "2026-11-07T10:00:00Z", ...p }) as Transaction
const f = (field: string, operator: string, values: string[]) => ({ field, operator, values }) as FilterValue
const ids = (l: Transaction[]) => l.map((t) => t.id)
const filtra = (l: Transaction[], filtros: FilterValue[], extra: { type?: "all" | "expense" | "income"; q?: string } = {}) =>
    ids(filtrarNaMemoria(l, { type: "all", q: "", filtros, ...extra } as never))

describe("filtrarNaMemoria", () => {
    it("descricao: contém, sem diferenciar caixa (como o ilike)", () => {
        const l = [tx({ id: "a", description: "Abastecimento" }), tx({ id: "b", description: "Seguro" })]
        expect(filtra(l, [f("descricao", "is", ["abast"])])).toEqual(["a"])
    })
    it("q também filtra a descrição", () => {
        const l = [tx({ id: "a", description: "Abastecimento" }), tx({ id: "b", description: "Seguro" })]
        expect(filtra(l, [], { q: "seg" })).toEqual(["b"])
    })
    it("type diferente de all filtra o tipo", () => {
        const l = [tx({ id: "a" }), tx({ id: "b", type: "income" })]
        expect(filtra(l, [], { type: "income" })).toEqual(["b"])
    })
    it("valor: lte, gte, between, eq e approx", () => {
        const l = [50, 100, 200, 300, 500].map((amount) => tx({ id: String(amount), amount }))
        expect(filtra(l, [f("valor", "lte", ["100"])])).toEqual(["50", "100"])
        expect(filtra(l, [f("valor", "gte", ["300"])])).toEqual(["300", "500"])
        expect(filtra(l, [f("valor", "between", ["100", "300"])])).toEqual(["100", "200", "300"])
        expect(filtra(l, [f("valor", "eq", ["200"])])).toEqual(["200"])
        expect(filtra(l, [f("valor", "approx", ["100"])])).toEqual(["100"])
    })
    it("pagamento, cartao, pessoa, pagou, projeto: é e não é", () => {
        const l = [
            tx({ id: "a", payment_method: "pix", payment_credit_card_id: "c1", user_id: "u1", paid_by: "p1", project_id: "j1" }),
            tx({ id: "b", payment_method: "cash", payment_credit_card_id: "c2", user_id: "u2", paid_by: "p2", project_id: "j2" }),
        ]
        const col = { pagamento: ["pix", "cash"], cartao: ["c1", "c2"], pessoa: ["u1", "u2"], pagou: ["p1", "p2"], projeto: ["j1", "j2"] }
        for (const [campo, [x, y]] of Object.entries(col)) {
            expect(filtra(l, [f(campo, "is", [x])])).toEqual(["a"])
            expect(filtra(l, [f(campo, "is-not", [x])])).toEqual(["b"])
            expect(filtra(l, [f(campo, "is", [x, y])])).toEqual(["a", "b"])
        }
    })
    it("conferir: só needs_review", () => {
        const l = [tx({ id: "a", needs_review: true }), tx({ id: "b", needs_review: false })]
        expect(filtra(l, [f("conferir", "is", [])])).toEqual(["a"])
    })
    it("parcelada: Todas, ids, e não é", () => {
        const l = [tx({ id: "a", installment_plan_id: "p1" }), tx({ id: "b", installment_plan_id: "p2" }), tx({ id: "c", installment_plan_id: null })]
        expect(filtra(l, [f("parcelada", "is", [PARCELADAS_TODAS])])).toEqual(["a", "b"])
        expect(filtra(l, [f("parcelada", "is-not", [PARCELADAS_TODAS])])).toEqual(["c"])
        expect(filtra(l, [f("parcelada", "is", ["p1"])])).toEqual(["a"])
        expect(filtra(l, [f("parcelada", "is-not", ["p1"])])).toEqual(["b", "c"])
    })
    it("recorrente e assinatura", () => {
        const l = [tx({ id: "a", is_recurring: true, subscription_id: "s1" }), tx({ id: "b", is_recurring: false, subscription_id: "s2" })]
        expect(filtra(l, [f("recorrente", "is", [])])).toEqual(["a"])
        expect(filtra(l, [f("assinatura", "is", ["s2"])])).toEqual(["b"])
    })
    it("periodo e categoria são ignorados (a página fixa os dois)", () => {
        const l = [tx({ id: "a", date: "2020-01-01", category_id: "k1" }), tx({ id: "b", category_id: null })]
        expect(filtra(l, [f("periodo", "is", ["2026-11-01", "2026-11-30"]), f("categoria", "is", ["k9"])])).toEqual(["a", "b"])
    })
    it("linha projetada passa pelos filtros sem quebrar", () => {
        const p = tx({ id: `${PROJECTED_TRANSACTION_ID_PREFIX}1`, description: null, installment_plan_id: null, subscription_id: null })
        expect(filtra([p], [f("descricao", "is", ["x"])])).toEqual([])
        expect(filtra([p], [f("parcelada", "is-not", ["p1"]), f("pagamento", "is-not", ["pix"])])).toEqual([p.id])
    })
})

describe("ordenarNaMemoria", () => {
    const l = [
        tx({ id: "a", date: "2026-11-05", created_at: "2026-11-05T08:00:00Z", amount: 30 }),
        tx({ id: "b", date: "2026-11-07", created_at: "2026-11-07T08:00:00Z", amount: 10 }),
        tx({ id: "c", date: "2026-11-07", created_at: "2026-11-07T09:00:00Z", amount: 20 }),
        tx({ id: "d", date: "2026-11-07", created_at: "2026-11-07T09:00:00Z", amount: 20 }),
    ]
    it("data desc desempata por created_at e id", () => {
        expect(ids(ordenarNaMemoria(l, { key: "date", dir: "desc" }))).toEqual(["d", "c", "b", "a"])
        expect(ids(ordenarNaMemoria(l, { key: "date", dir: "asc" }))).toEqual(["a", "b", "c", "d"])
    })
    it("valor asc e desc", () => {
        expect(ids(ordenarNaMemoria(l, { key: "amount", dir: "asc" }))).toEqual(["b", "c", "d", "a"])
        expect(ids(ordenarNaMemoria(l, { key: "amount", dir: "desc" }))).toEqual(["a", "d", "c", "b"])
    })
    it("não muta a entrada", () => {
        const antes = ids(l)
        ordenarNaMemoria(l, { key: "amount", dir: "desc" })
        expect(ids(l)).toEqual(antes)
    })
})

describe("paginarNaMemoria", () => {
    it("fatia PAGE_SIZE na página 1-based", () => {
        const l = Array.from({ length: PAGE_SIZE + 5 }, (_, i) => tx({ id: String(i) }))
        expect(paginarNaMemoria(l, 1)).toHaveLength(PAGE_SIZE)
        expect(ids(paginarNaMemoria(l, 2))).toEqual(["100", "101", "102", "103", "104"])
    })
})
