import { describe, expect, it } from "vitest"
import {
    CAMPOS_BASE,
    escreverFiltrosNaUrl,
    lerFiltrosDaUrl,
    SEM_CATEGORIA,
    type EstadoDaLista,
} from "./filtros"

const HOJE = new Date(2026, 10, 7)
const ler = (qs: string) => lerFiltrosDaUrl(new URLSearchParams(qs), HOJE)
const A = "11111111-1111-4111-8111-111111111111"
const B = "22222222-2222-4222-8222-222222222222"
const X = "33333333-3333-4333-8333-333333333333"
const ESTE_MES = { field: "periodo", operator: "is", values: ["este-mes"] }

describe("CAMPOS_BASE", () => {
    it("tem os 15 campos na ordem da spec, plano e assinatura de valor único", () => {
        expect(CAMPOS_BASE.map((c) => c.id)).toEqual([
            "periodo", "descricao", "categoria", "pagamento", "cartao", "valor", "conferir", "captura",
            "pessoa", "pagou", "projeto", "parcelada", "plano", "assinatura", "recorrente",
        ])
        for (const id of ["plano", "assinatura"]) {
            const c = CAMPOS_BASE.find((f) => f.id === id)
            expect(c && c.type === "enum" && c.multiple).toBe(false)
        }
    })
})

describe("lerFiltrosDaUrl", () => {
    it("sem filtro entra o período padrão e migra", () => {
        const r = ler("")
        expect(r.filtros).toEqual([ESTE_MES])
        expect(r.migrou).toBe(true)
        expect(r.type).toBe("all")
        expect(r.sort).toEqual({ key: "date", dir: "desc" })
        expect(r.page).toBe(1)
    })

    it("txn não é filtro", () => {
        expect(ler("txn=abc").filtros).toEqual([ESTE_MES])
    })

    it("card + preset=last30, na ordem de CAMPOS_BASE e sem padrão", () => {
        const r = ler(`card=${X}&preset=last30`)
        expect(r.filtros).toEqual([
            { field: "periodo", operator: "is", values: ["ultimos-30"] },
            { field: "cartao", operator: "is", values: [X] },
        ])
        expect(r.migrou).toBe(true)
    })

    it("presets e intervalos", () => {
        expect(ler("preset=last7").filtros[0].values).toEqual(["ultimos-7"])
        expect(ler("preset=monthToToday").filtros[0].values).toEqual(["este-mes"])
        expect(ler("preset=last15").filtros[0].values).toEqual(["2026-10-24", "2026-11-07"])
        expect(ler("from=2026-10-01").filtros[0].values).toEqual(["2026-10-01", "2026-11-07"])
        expect(ler("to=2026-10-31").filtros[0].values).toEqual(["2000-01-01", "2026-10-31"])
    })

    it("categorias", () => {
        expect(ler(`cats=${A},${B}`).filtros).toContainEqual({ field: "categoria", operator: "is", values: [A, B] })
        expect(ler("uncat=1").filtros).toContainEqual({ field: "categoria", operator: "is", values: [SEM_CATEGORIA] })
        expect(ler("cats=lixo&preset=last7").filtros).toHaveLength(1)
    })

    it("valor", () => {
        expect(ler("min=1.234,56").filtros).toContainEqual({ field: "valor", operator: "gte", values: ["1234.56"] })
        expect(ler("min=10&max=50").filtros).toContainEqual({ field: "valor", operator: "between", values: ["10", "50"] })
        expect(ler("max=50").filtros).toContainEqual({ field: "valor", operator: "lte", values: ["50"] })
    })

    it("booleanos, plano, assinatura, pagamento", () => {
        const f = ler(`inst=1&plan=${A}&sub=${B}&conferir=1&pm=pix,credit_card,xx&card=${X}`).filtros
        expect(f).toContainEqual({ field: "parcelada", operator: "is", values: [] })
        expect(f).toContainEqual({ field: "plano", operator: "is", values: [A] })
        expect(f).toContainEqual({ field: "assinatura", operator: "is", values: [B] })
        expect(f).toContainEqual({ field: "conferir", operator: "is", values: [] })
        expect(f).toContainEqual({ field: "pagamento", operator: "is", values: ["pix", "credit_card"] })
        expect(f).toContainEqual({ field: "cartao", operator: "is", values: [X] })
    })

    it("f= é lido pelo parseFilters, sem migrar nem padrão", () => {
        const r = ler(`f=categoria:is-not:${A}`)
        expect(r.filtros).toEqual([{ field: "categoria", operator: "is-not", values: [A] }])
        expect(r.migrou).toBe(false)
    })

    it("f= vazio é explícito: sem filtro, sem padrão, sem migrar", () => {
        const r = ler("f=")
        expect(r.filtros).toEqual([])
        expect(r.migrou).toBe(false)
    })

    it("preset desconhecido: sem filtro, sem padrão, migra", () => {
        for (const q of ["preset=bogus", "preset=constructor"]) {
            const r = ler(q)
            expect(r.filtros).toEqual([])
            expect(r.migrou).toBe(true)
        }
    })

    it("f vence o parâmetro antigo do mesmo campo", () => {
        const r = ler(`f=categoria:is-not:${A}&cats=${B}&min=5`)
        expect(r.filtros).toEqual([
            { field: "categoria", operator: "is-not", values: [A] },
            { field: "valor", operator: "gte", values: ["5"] },
        ])
    })

    it("q (o Ver todas da paleta) vira o token Descrição, busca em tudo e migra", () => {
        const r = ler("q=uber")
        expect(r.filtros).toEqual([{ field: "descricao", operator: "contains", values: ["uber"] }])
        expect(r.q).toBe("")
        expect(r.migrou).toBe(true)
        expect(ler("q=%20%20").filtros).toEqual([ESTE_MES])
    })

    it("q é aparado", () => {
        expect(ler("q=%20uber%20").filtros).toEqual([{ field: "descricao", operator: "contains", values: ["uber"] }])
    })

    it("type, sort e page", () => {
        const r = ler("type=expense&sort=amount.asc&page=3&f=conferir:is")
        expect(r).toMatchObject({ type: "expense", q: "", sort: { key: "amount", dir: "asc" }, page: 3 })
    })
})

describe("escreverFiltrosNaUrl", () => {
    it("ida e volta, preservando as chaves alheias e sem as antigas", () => {
        const e: EstadoDaLista = {
            type: "expense",
            q: "",
            sort: { key: "amount", dir: "asc" },
            page: 3,
            filtros: [
                { field: "periodo", operator: "is", values: ["ultimos-30"] },
                { field: "descricao", operator: "contains", values: ["uber: 50%, ok"] },
                { field: "categoria", operator: "is-not", values: [A, SEM_CATEGORIA] },
                { field: "valor", operator: "between", values: ["10", "50"] },
                { field: "conferir", operator: "is", values: [] },
            ],
        }
        const p = escreverFiltrosNaUrl(e, new URLSearchParams(`txn=1&tipo=x&cats=${A}&preset=last7&conferir=1&min=3`))
        expect(p.get("txn")).toBe("1")
        expect(p.get("tipo")).toBe("x")
        for (const k of ["cats", "preset", "conferir", "min"]) expect(p.has(k)).toBe(false)
        const { migrou, ...volta } = lerFiltrosDaUrl(p, HOJE)
        expect(volta).toEqual(e)
        expect(migrou).toBe(false)
    })

    it("não escreve padrões; lista vazia grava f= e volta vazia, sem padrão", () => {
        const e: EstadoDaLista = { type: "all", q: "", sort: { key: "date", dir: "desc" }, page: 1, filtros: [] }
        const p = escreverFiltrosNaUrl(e, new URLSearchParams("type=income&page=2"))
        expect(p.toString()).toBe("f=")
        const { migrou, ...volta } = lerFiltrosDaUrl(p, HOJE)
        expect(volta).toEqual(e)
        expect(migrou).toBe(false)
    })
})
