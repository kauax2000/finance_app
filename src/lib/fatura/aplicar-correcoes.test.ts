import type { SupabaseClient } from "@supabase/supabase-js"
import { describe, expect, it } from "vitest"
import type { Correcao, DecisaoSoNoApp } from "./correcoes"
import { aplicarCorrecoes, desfazerCorrecoes, type ContextoDeCorrecao } from "./aplicar-correcoes"

type Chamada = { tabela: string; op: string; valores?: unknown; filtros: Array<[string, unknown]> }

/** Banco falso: grava cada escrita e pode falhar na n-ésima (1-based, só nas escritas). */
function dbFalso(tabelas: Record<string, Array<Record<string, unknown>>>, falharNa?: number | number[]) {
    const chamadas: Chamada[] = []
    let escritas = 0
    const db = {
        from(tabela: string) {
            const c: Chamada = { tabela, op: "select", filtros: [] }
            const b: Record<string, unknown> = {}
            const escrita = (op: string) => (valores?: unknown) => {
                c.op = op
                c.valores = valores
                return b
            }
            b.select = () => b
            b.update = escrita("update")
            b.delete = escrita("delete")
            b.insert = escrita("insert")
            b.upsert = escrita("upsert")
            b.eq = (k: string, v: unknown) => (c.filtros.push([k, v]), b)
            b.in = (k: string, v: unknown) => (c.filtros.push([`in:${k}`, v]), b)
            b.then = (res: (r: unknown) => unknown) => {
                chamadas.push(c)
                if (c.op === "select") {
                    const ids = c.filtros.find(([k]) => k === "in:id")?.[1] as string[] | undefined
                    return res({ data: (tabelas[tabela] ?? []).filter((r) => !ids || ids.includes(r.id as string)), error: null })
                }
                escritas++
                return res({ data: null, error: [falharNa].flat().includes(escritas) ? { message: "falhou", code: "X" } : null })
            }
            return b
        },
    } as unknown as SupabaseClient
    const escritasDe = (tabela: string, op: string) => chamadas.filter((x) => x.tabela === tabela && x.op === op)
    return { db, chamadas, escritasDe }
}

const ctx: ContextoDeCorrecao = {
    userId: "u1",
    workspaceId: "w1",
    cardId: "card1",
    ciclo: { inicio: "2026-09-27", fechamento: "2026-10-26" },
    source: "import_statement",
    batchId: "lote1",
}
const linha = (id: string, o: Record<string, unknown> = {}) => ({
    id, date: "2026-09-25T12:00:00Z", description: "Gasolina", amount: 200, installment_sequence: null,
    payment_method: "credit_card", payment_credit_card_id: "card1", ...o,
})
const foraDoPeriodo: Correcao = { id: "f:g", motivo: "fora-do-periodo", appId: "g", descricao: "Gasolina", de: "2026-09-25", para: "2026-09-27", novaDescricao: "Gasolina · compra em 25/09", impacto: 0 }
const valor: Correcao = { id: "v:g", motivo: "valor-diferente", appId: "g", descricao: "Gasolina", de: 200, para: 228.13, assinaturaId: null, impacto: 0 }
const semDecisoes = new Map<string, DecisaoSoNoApp>()

describe("aplicarCorrecoes", () => {
    it("junta fora do período e valor do mesmo lançamento num update só", async () => {
        const f = dbFalso({ transactions: [linha("g")] })
        const r = await aplicarCorrecoes(f.db, ctx, [foraDoPeriodo, valor], semDecisoes)
        expect(r.ok).toBe(true)
        const ups = f.escritasDe("transactions", "update")
        expect(ups).toHaveLength(1)
        expect(ups[0].valores).toEqual({ date: "2026-09-27T12:00:00Z", description: "Gasolina · compra em 25/09", amount: 228.13 })
        expect(ups[0].filtros).toContainEqual(["id", "g"])
    })

    it("assinatura recebe o valor do banco", async () => {
        const f = dbFalso({ transactions: [linha("g")], workspace_subscriptions: [{ id: "s1", amount: 25 }] })
        await aplicarCorrecoes(f.db, ctx, [{ ...valor, assinaturaId: "s1", para: 19.9 }], semDecisoes)
        const [u] = f.escritasDe("workspace_subscriptions", "update")
        expect(u.valores).toEqual({ amount: 19.9 })
        expect(u.filtros).toEqual(expect.arrayContaining([["id", "s1"], ["workspace_id", "w1"]]))
    })

    it("mudar forma tira do cartão", async () => {
        const f = dbFalso({ transactions: [linha("x")] })
        await aplicarCorrecoes(f.db, ctx, [], new Map([["x", { forma: "pix" }]]))
        expect(f.escritasDe("transactions", "update")[0].valores).toEqual({ payment_method: "pix", payment_credit_card_id: null })
    })

    it("manter não escreve nada", async () => {
        const f = dbFalso({ transactions: [linha("x")] })
        const r = await aplicarCorrecoes(f.db, ctx, [], new Map([["x", "manter"]]))
        expect(f.chamadas.filter((c) => c.op !== "select")).toHaveLength(0)
        expect(r.ok && r.aplicadas).toBe(0)
    })

    it("criar usa o lote e ajusta ao ciclo", async () => {
        const f = dbFalso({})
        const item = { data: "2026-09-20", descricao: "NOVO", valor: 10, estorno: false, parcela: null, clientId: "c1", categoryId: null, origem: null }
        const r = await aplicarCorrecoes(f.db, ctx, [{ id: "n", motivo: "falta-no-app", item, impacto: 10 }], semDecisoes)
        const [u] = f.escritasDe("transactions", "upsert")
        const linhas = u.valores as Array<Record<string, unknown>>
        expect(linhas[0].import_batch_id).toBe("lote1")
        expect(String(linhas[0].date).startsWith("2026-09-27")).toBe(true)
        expect(r.ok && r.lote.batchId).toBe("lote1")
    })

    it("falha na assinatura devolve os lançamentos e só as assinaturas já escritas", async () => {
        const f = dbFalso({ transactions: [linha("g"), linha("h")], workspace_subscriptions: [{ id: "s1", amount: 25 }, { id: "s2", amount: 30 }] }, 4)
        const cs: Correcao[] = [
            { ...valor, assinaturaId: "s1", para: 19.9 },
            { ...valor, id: "v:h", appId: "h", assinaturaId: "s2", para: 9.9 },
        ]
        const r = await aplicarCorrecoes(f.db, ctx, cs, semDecisoes)
        expect(r.ok).toBe(false)
        // Escritas: g, h, s1, s2 (falha). A volta: g, h e s1, nunca s2.
        const volta = f.escritasDe("workspace_subscriptions", "update").slice(2)
        expect(volta.map((c) => c.filtros.find(([k]) => k === "id")![1])).toEqual(["s1"])
        expect(volta[0].valores).toEqual({ amount: 25 })
        expect(f.escritasDe("transactions", "update").slice(2)).toHaveLength(2)
    })

    it("apagar o lançamento de outra pessoa é recusado antes de qualquer escrita", async () => {
        const f = dbFalso({ transactions: [{ ...linha("g") }, { ...linha("a"), user_id: "u2" }] })
        const r = await aplicarCorrecoes(f.db, ctx, [valor], new Map([["a", "apagar"]]))
        expect(r).toEqual({ ok: false, erro: expect.stringContaining("outra pessoa"), desfeito: true })
        expect(f.chamadas.filter((c) => c.op !== "select")).toHaveLength(0)
    })

    it("apagar o próprio lançamento segue", async () => {
        const f = dbFalso({ transactions: [{ ...linha("a"), user_id: "u1" }] })
        const r = await aplicarCorrecoes(f.db, ctx, [], new Map([["a", "apagar"]]))
        expect(r.ok).toBe(true)
        expect(f.escritasDe("transactions", "delete")).toHaveLength(1)
    })

    it("toda escrita filtra pela carteira", async () => {
        const f = dbFalso({ transactions: [linha("g"), { ...linha("a"), user_id: "u1" }] })
        await aplicarCorrecoes(f.db, ctx, [valor], new Map([["a", "apagar"]]))
        const escritas = f.chamadas.filter((c) => c.op === "update" || c.op === "delete")
        expect(escritas.length).toBe(2)
        for (const c of escritas) expect(c.filtros).toContainEqual(["workspace_id", "w1"])
    })

    it("falha no meio desfaz só o que já foi escrito", async () => {
        const f = dbFalso({ transactions: [linha("a"), linha("b"), linha("c")] }, 2)
        const cs: Correcao[] = ["a", "b", "c"].map((id) => ({ ...valor, id: `v:${id}`, appId: id }))
        const r = await aplicarCorrecoes(f.db, ctx, cs, semDecisoes)
        expect(r.ok).toBe(false)
        if (r.ok) return
        expect(r.desfeito).toBe(true)
        // b falhou e c nem foi tentado: devolver os dois pisaria numa edição de outra pessoa.
        const volta = f.escritasDe("transactions", "update").slice(2)
        expect(volta.map((c) => c.filtros.find(([k]) => k === "id")![1])).toEqual(["a"])
        for (const c of volta) expect(c.valores).toEqual({ date: "2026-09-25T12:00:00Z", description: "Gasolina", amount: 200, installment_sequence: null, payment_method: "credit_card", payment_credit_card_id: "card1" })
    })
})

describe("desfazerCorrecoes", () => {
    it("reinsere o apagado igual e apaga o lote criado", async () => {
        const f = dbFalso({})
        const apagado = { ...linha("z"), workspace_id: "w1", user_id: "u1" }
        const r = await desfazerCorrecoes(f.db, { workspaceId: "w1", batchId: "lote1", antes: [], apagados: [apagado], anexosApagados: [], assinaturas: [{ id: "s1", amount: 25 }] })
        expect(r.ok).toBe(true)
        expect(f.escritasDe("transactions", "insert")[0].valores).toEqual([apagado])
        const del = f.escritasDe("transactions", "delete")[0]
        expect(del.filtros).toEqual(expect.arrayContaining([["workspace_id", "w1"], ["import_batch_id", "lote1"]]))
        expect(f.escritasDe("workspace_subscriptions", "update")[0].valores).toEqual({ amount: 25 })
    })
})

describe("falha e desfazer", () => {
    it("avisa quando nem o desfazer deu certo", async () => {
        const f = dbFalso({ transactions: [linha("a"), linha("b"), linha("c")] }, [3, 4])
        const cs: Correcao[] = ["a", "b", "c"].map((id) => ({ ...valor, id: `v:${id}`, appId: id }))
        const r = await aplicarCorrecoes(f.db, ctx, cs, semDecisoes)
        expect(r.ok).toBe(false)
        if (r.ok) return
        expect(r.desfeito).toBe(false)
        expect(r.erro).toContain("não foi possível desfazer")
    })

    it("desfazer tenta tudo mesmo se um passo falha", async () => {
        const f = dbFalso({}, 1)
        const r = await desfazerCorrecoes(f.db, {
            workspaceId: "w1", batchId: null, antes: [{ id: "a", date: "d", description: null, amount: 1, installment_sequence: null, payment_method: null, payment_credit_card_id: null }],
            apagados: [{ id: "z" }], anexosApagados: [], assinaturas: [{ id: "s1", amount: 25 }],
        })
        expect(r.ok).toBe(false)
        expect(f.escritasDe("transactions", "insert")).toHaveLength(1)
        expect(f.escritasDe("workspace_subscriptions", "update")).toHaveLength(1)
    })

    it("desfazer devolve os anexos do apagado, depois do lançamento", async () => {
        const anexo = { id: "an1", transaction_id: "a", workspace_id: "w1", path: "x.pdf" }
        const f = dbFalso({ transactions: [{ ...linha("a"), user_id: "u1" }], attachments: [anexo] })
        const r = await aplicarCorrecoes(f.db, ctx, [], new Map([["a", "apagar"]]))
        expect(r.ok).toBe(true)
        if (!r.ok) return
        expect(r.lote.anexosApagados).toEqual([anexo])
        await desfazerCorrecoes(f.db, r.lote)
        const ordem = f.chamadas.filter((c) => c.op === "insert").map((c) => c.tabela)
        expect(ordem).toEqual(["transactions", "attachments"])
        expect(f.escritasDe("attachments", "insert")[0].valores).toEqual([anexo])
    })
})
