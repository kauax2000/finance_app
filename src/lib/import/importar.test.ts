import type { SupabaseClient } from "@supabase/supabase-js"
import { describe, expect, it } from "vitest"
import { sugerirCategoria } from "./categoria-pelo-historico"
import {
    buscarJaExistentes,
    categoriasQueFaltam,
    comCategoriaDaPlanilha,
    desfazerImportacao,
    importarLancamentos,
    linhasDeImportacao,
    negativoEhDespesaPadrao,
    prepararItens,
    type ItemImportavel,
} from "./importar"
import type { ItemBanco } from "./tipos"

const ctx = { userId: "u1", workspaceId: "w1", batchId: "lote1" }

function item(p: Partial<ItemImportavel> = {}): ItemImportavel {
    return {
        data: "2026-10-10",
        descricao: "PADARIA SOL",
        valor: 30,
        estorno: false,
        parcela: null,
        clientId: "c1",
        categoryId: "cat1",
        ...p,
    }
}

describe("sugerirCategoria", () => {
    const historico = [
        { description: "Padaria Sol", category_id: "antiga", date: "2026-01-01T12:00:00.000Z" },
        { description: "padaria sol", category_id: "recente", date: "2026-09-01T12:00:00.000Z" },
        { description: "Padaria Sol", category_id: null, date: "2026-10-01T12:00:00.000Z" },
        { description: "Uber Eats", category_id: "comida", date: "2026-03-01T12:00:00.000Z" },
        { description: "Uber Trip", category_id: "transporte", date: "2026-08-01T12:00:00.000Z" },
    ]

    it("a descrição normalizada igual, a mais recente com categoria", () => {
        expect(sugerirCategoria("PADARIA SOL", historico)).toBe("recente")
    })

    it("senão, a mais recente com a mesma palavra significativa", () => {
        expect(sugerirCategoria("UBER *PENDING", historico)).toBe("transporte")
    })

    it("senão, null", () => {
        expect(sugerirCategoria("FARMACIA", historico)).toBeNull()
        expect(sugerirCategoria("12 34", historico)).toBeNull()
    })
})

describe("prepararItens", () => {
    it("gera um clientId por item e sugere a categoria", () => {
        const itens: ItemBanco[] = [
            { data: "2026-10-10", descricao: "Padaria Sol", valor: 10, estorno: false, parcela: null },
            { data: "2026-10-11", descricao: "Outro", valor: 5, estorno: false, parcela: null },
        ]
        const r = prepararItens(itens, [{ description: "padaria sol", category_id: "cat", date: "2026-01-01" }])
        expect(r[0].categoryId).toBe("cat")
        expect(r[1].categoryId).toBeNull()
        expect(r[0].clientId).toMatch(/^[0-9a-f-]{36}$/)
        expect(r[0].clientId).not.toBe(r[1].clientId)
    })
})

describe("linhasDeImportacao", () => {
    it("estorno num cartão vira income com credit_card e o cartão", () => {
        const [l] = linhasDeImportacao(ctx, [item({ estorno: true })], { tipo: "cartao", cardId: "card1" }, "import_pdf")
        expect(l.type).toBe("income")
        expect(l.payment_method).toBe("credit_card")
        expect(l.payment_credit_card_id).toBe("card1")
    })

    it("destino conta com despesa", () => {
        const [l] = linhasDeImportacao(ctx, [item()], { tipo: "conta", paymentMethod: "pix" }, "import_statement")
        expect(l.type).toBe("expense")
        expect(l.payment_method).toBe("pix")
        expect(l.payment_credit_card_id).toBeNull()
        expect(l.amount).toBe(30)
        expect(l.category_id).toBe("cat1")
        expect(l.date).toBe("2026-10-10T12:00:00.000Z")
        expect(l.user_id).toBe("u1")
        expect(l.workspace_id).toBe("w1")
    })

    it("parcela vai na descrição, e as marcas de importação", () => {
        const [l] = linhasDeImportacao(
            ctx,
            [item({ descricao: "LOJA AZUL", parcela: { k: 3, n: 10 } })],
            { tipo: "cartao", cardId: "card1" },
            "import_sheet",
        )
        expect(l.description).toBe("LOJA AZUL (3/10)")
        expect(l.needs_review).toBe(true)
        expect(l.import_batch_id).toBe("lote1")
        expect(l.source).toBe("import_sheet")
        expect(l.client_id).toBe("c1")
    })

    it("o mesmo ItemImportavel gera sempre o mesmo client_id (Foco 3)", () => {
        const i = item({ clientId: "fixo" })
        const destino = { tipo: "cartao", cardId: "card1" } as const
        const a = linhasDeImportacao(ctx, [i], destino, "import_pdf")
        const b = linhasDeImportacao(ctx, [i], destino, "import_pdf")
        expect(a[0].client_id).toBe("fixo")
        expect(b[0].client_id).toBe(a[0].client_id)
    })
})

function clienteFalso(erro: { message: string } | null = null) {
    const chamadas: Array<{ op: string; tabela: string; args: unknown[] }> = []
    const cliente = {
        from(tabela: string) {
            return {
                upsert(...args: unknown[]) {
                    chamadas.push({ op: "upsert", tabela, args })
                    return Promise.resolve({ error: erro })
                },
                delete() {
                    const eqs: unknown[] = []
                    const encadeado = {
                        eq(...args: unknown[]) {
                            eqs.push(args)
                            if (eqs.length === 2) {
                                chamadas.push({ op: "delete", tabela, args: eqs })
                                return Promise.resolve({ error: erro })
                            }
                            return encadeado
                        },
                    }
                    return encadeado
                },
            }
        },
    }
    return { cliente: cliente as unknown as SupabaseClient, chamadas }
}

describe("importarLancamentos", () => {
    it("upsert em fatias de 500 com onConflict workspace_id,client_id", async () => {
        const { cliente, chamadas } = clienteFalso()
        const itens = Array.from({ length: 1001 }, (_, n) => item({ clientId: `c${n}` }))
        const r = await importarLancamentos(
            cliente,
            { userId: "u1", workspaceId: "w1" },
            itens,
            { tipo: "cartao", cardId: "card1" },
            "import_pdf",
            "lote1",
        )
        expect(r).toEqual({ ok: true, inseridos: 1001 })
        expect(chamadas.map((c) => (c.args[0] as unknown[]).length)).toEqual([500, 500, 1])
        for (const c of chamadas) {
            expect(c.tabela).toBe("transactions")
            expect(c.args[1]).toEqual({ onConflict: "workspace_id,client_id" })
        }
    })

    it("devolve o erro sem seguir", async () => {
        const { cliente, chamadas } = clienteFalso({ message: "falhou" })
        const r = await importarLancamentos(
            cliente,
            { userId: "u1", workspaceId: "w1" },
            Array.from({ length: 600 }, (_, n) => item({ clientId: `c${n}` })),
            { tipo: "cartao", cardId: "card1" },
            "import_pdf",
            "lote1",
        )
        expect(r.ok).toBe(false)
        expect(chamadas).toHaveLength(1)
    })
})

describe("desfazerImportacao", () => {
    it("apaga pelo workspace e pelo lote", async () => {
        const { cliente, chamadas } = clienteFalso()
        expect(await desfazerImportacao(cliente, "w1", "lote1")).toEqual({ ok: true })
        expect(chamadas[0].args).toEqual([
            ["workspace_id", "w1"],
            ["import_batch_id", "lote1"],
        ])
    })
})

describe("categoria da planilha, pelo nome", () => {
    const categorias = [
        { id: "alim", name: "Alimentação", type: "expense" as const },
        { id: "sal", name: "Salário", type: "income" as const },
    ]

    const conta = { tipo: "conta", paymentMethod: "pix" } as const
    const cartao = { tipo: "cartao", cardId: "k1" } as const

    it("casa sem acento nem caixa, no tipo do sinal, e mantém o clientId", () => {
        const itens = [
            item({ clientId: "a", categoria: "ALIMENTACAO", categoryId: "historico" }),
            item({ clientId: "b", categoria: "salario", estorno: true, categoryId: null }),
            item({ clientId: "c", categoryId: "historico" }),
        ]
        const r = comCategoriaDaPlanilha(itens, categorias, conta)
        expect(r.map((i) => [i.clientId, i.categoryId])).toEqual([
            ["a", "alim"],
            ["b", "sal"],
            ["c", "historico"],
        ])
    })

    it("no cartão o estorno casa a categoria de despesa", () => {
        const itens = [
            item({ clientId: "a", categoria: "Alimentação", estorno: true, categoryId: null }),
            item({ clientId: "b", categoria: "Salário", estorno: true, categoryId: null }),
        ]
        const r = comCategoriaDaPlanilha(itens, categorias, cartao)
        expect(r.map((i) => [i.clientId, i.categoryId])).toEqual([
            ["a", "alim"],
            ["b", null],
        ])
    })

    it("o que não existe no tipo do sinal falta, uma vez por nome", () => {
        const itens = [
            item({ categoria: "Pet" }),
            item({ categoria: " pet " }),
            item({ categoria: "Bônus", estorno: true }),
            item({ categoria: "Alimentacao" }),
            item({}),
        ]
        expect(categoriasQueFaltam(itens, categorias, conta)).toEqual([
            { nome: "Pet", tipo: "expense" },
            { nome: "Bônus", tipo: "income" },
        ])
    })

    it("no cartão o estorno não cria a categoria de receita: a de despesa já existe", () => {
        const itens = [item({ categoria: "Alimentação", estorno: true }), item({ categoria: "Pet", estorno: true })]
        expect(categoriasQueFaltam(itens, categorias, cartao)).toEqual([{ nome: "Pet", tipo: "expense" }])
    })

    it("um nome que normaliza para vazio não vira categoria", () => {
        expect(categoriasQueFaltam([item({ categoria: "--" }), item({ categoria: " ! " })], categorias, conta)).toEqual([])
    })
})

describe("negativoEhDespesaPadrao", () => {
    it("conta: negativo é despesa; cartão: compra positiva", () => {
        expect(negativoEhDespesaPadrao({ tipo: "conta", paymentMethod: "pix" })).toBe(true)
        expect(negativoEhDespesaPadrao({ tipo: "cartao", cardId: "c1" })).toBe(false)
    })
})

describe("buscarJaExistentes", () => {
    type Linha = { id: string; description: string; date: string; amount: number; type: string; payment_method: string; payment_credit_card_id: string | null }
    const linha = (p: Partial<Linha> = {}): Linha => ({
        id: "t1", description: "Padaria", date: "2026-10-10T12:00:00.000Z", amount: 30,
        type: "expense", payment_method: "pix", payment_credit_card_id: null, ...p,
    })
    function mock(resultado: { data: Linha[] | null; error: { message: string } | null }) {
        const chamadas: Array<[string, unknown[]]> = []
        const q: Record<string, unknown> = {}
        for (const m of ["select", "eq", "is", "gte", "lte"]) {
            q[m] = (...args: unknown[]) => { chamadas.push([m, args]); return q }
        }
        q.then = (ok: (r: unknown) => unknown) => Promise.resolve(resultado).then(ok)
        const from = (t: string) => { chamadas.push(["from", [t]]); return q }
        return { db: { from } as unknown as SupabaseClient, chamadas }
    }
    const conta = { tipo: "conta", paymentMethod: "pix" } as const
    const cartao = { tipo: "cartao", cardId: "k1" } as const

    it("sem lote não consulta", async () => {
        const { db, chamadas } = mock({ data: [], error: null })
        expect((await buscarJaExistentes(db, "w1", conta, [])).size).toBe(0)
        expect(chamadas).toEqual([])
    })

    it("consulta as colunas, a carteira, o intervalo e o destino", async () => {
        const { db, chamadas } = mock({ data: [], error: null })
        await buscarJaExistentes(db, "w1", conta, [item({ data: "2026-10-12" }), item({ data: "2026-10-05", clientId: "c2" })])
        expect(chamadas).toContainEqual(["select", ["id, description, date, amount, type, payment_method, payment_credit_card_id"]])
        expect(chamadas).toContainEqual(["eq", ["workspace_id", "w1"]])
        expect(chamadas).toContainEqual(["gte", ["date", "2026-10-04T00:00:00.000Z"]])
        expect(chamadas).toContainEqual(["lte", ["date", "2026-10-13T23:59:59.999Z"]])
        expect(chamadas).toContainEqual(["eq", ["payment_method", "pix"]])
        expect(chamadas).toContainEqual(["is", ["payment_credit_card_id", null]])
        const c = mock({ data: [], error: null })
        await buscarJaExistentes(c.db, "w1", cartao, [item()])
        expect(c.chamadas).toContainEqual(["eq", ["payment_credit_card_id", "k1"]])
    })

    it("casa por dia, valor e tipo", async () => {
        const { db } = mock({ data: [
            linha({ id: "a" }),
            linha({ id: "b", amount: 31, date: "2026-10-11T12:00:00.000Z" }),
            linha({ id: "c", type: "income", date: "2026-10-12T12:00:00.000Z" }),
        ], error: null })
        const r = await buscarJaExistentes(db, "w1", conta, [
            item({ clientId: "x" }),
            item({ clientId: "y", data: "2026-10-11" }),
            item({ clientId: "z", data: "2026-10-12" }),
        ])
        expect([...r.keys()]).toEqual(["x"])
        expect(r.get("x")).toEqual({ id: "a", description: "Padaria", date: "2026-10-10T12:00:00.000Z" })
    })

    it("1 para 1: dois iguais e um existente casa só um", async () => {
        const { db } = mock({ data: [linha()], error: null })
        const r = await buscarJaExistentes(db, "w1", conta, [item({ clientId: "a" }), item({ clientId: "b" })])
        expect([...r.keys()]).toEqual(["a"])
    })

    it("erro da consulta devolve mapa vazio", async () => {
        const { db } = mock({ data: null, error: { message: "boom" } })
        expect((await buscarJaExistentes(db, "w1", conta, [item()])).size).toBe(0)
    })
})
