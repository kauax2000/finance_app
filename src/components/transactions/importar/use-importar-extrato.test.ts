import type { SupabaseClient } from "@supabase/supabase-js"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/supabase", () => ({ supabase: {} }))

import { desfazerImportacao } from "@/lib/import/importar"
import type { ItemBanco } from "@/lib/import/tipos"
import { lerFonte, semComentarios } from "@/test/fonte"

import { criarVez, gravarLote, prepararLote, resumoDoLote, sourceDoModo, tipoDoArquivo } from "./use-importar-extrato"

type Chamada = { tabela: string; op: string; args: unknown[] }

/** Um cliente falso: anota cada passo da cadeia e resolve com a resposta da tabela. */
function clienteFalso(respostas: Record<string, (op: string) => unknown>) {
    const chamadas: Chamada[] = []
    const cliente = {
        from(tabela: string) {
            let ultima = ""
            const cadeia: Record<string, unknown> = {}
            for (const op of ["select", "eq", "not", "order", "limit", "upsert", "delete"]) {
                cadeia[op] = (...args: unknown[]) => {
                    chamadas.push({ tabela, op, args })
                    if (op === "upsert" || op === "delete") ultima = op
                    return cadeia
                }
            }
            cadeia.then = (ok: (v: unknown) => unknown) =>
                Promise.resolve(respostas[tabela]?.(ultima) ?? { data: [], error: null }).then(ok)
            return cadeia
        },
    }
    return { db: cliente as unknown as SupabaseClient, chamadas }
}

const lidos: ItemBanco[] = [
    { data: "2026-10-02", descricao: "Mercado", valor: 50, estorno: false, parcela: null, categoria: "Feira" },
    { data: "2026-10-05", descricao: "Salário", valor: 200, estorno: true, parcela: null },
]
const conta = { tipo: "conta", paymentMethod: "pix" } as const
const ctx = { userId: "u1", workspaceId: "w1" }

function respostas() {
    return {
        transactions: () => ({ data: [], error: null }),
        categories: (op: string) =>
            op === "upsert"
                ? { data: [{ id: "c-nova", name: "Feira", type: "expense" }], error: null }
                : { data: [], error: null },
    }
}

const linhasDoUpsert = (chamadas: Chamada[], tabela: string) =>
    chamadas.filter((c) => c.tabela === tabela && c.op === "upsert").map((c) => c.args[0] as Record<string, unknown>[])

describe("importar extrato", () => {
    it("o client_id nasce uma vez por item: importar duas vezes manda os mesmos ids", async () => {
        const { db, chamadas } = clienteFalso(respostas())
        const r = await prepararLote(db, "w1", { itens: lidos, ignoradas: 1 }, conta, "planilha")
        if (!r.ok) throw new Error(r.erro)
        await gravarLote(db, ctx, r.lote)
        await gravarLote(db, ctx, r.lote)
        const [primeira, segunda] = linhasDoUpsert(chamadas, "transactions")
        expect(primeira.map((l) => l.client_id)).toEqual(segunda.map((l) => l.client_id))
        expect(new Set(primeira.map((l) => l.client_id)).size).toBe(2)
        const [cat1, cat2] = linhasDoUpsert(chamadas, "categories")
        expect(cat1[0].client_id).toBe(cat2[0].client_id)
        const upserts = chamadas.filter((c) => c.op === "upsert")
        expect(upserts.every((c) => (c.args[1] as { onConflict: string }).onConflict === "workspace_id,client_id")).toBe(
            true,
        )
    })

    it("source é import_statement no extrato e import_sheet na planilha", async () => {
        expect(sourceDoModo("extrato")).toBe("import_statement")
        expect(sourceDoModo("planilha")).toBe("import_sheet")
        const { db, chamadas } = clienteFalso(respostas())
        const r = await prepararLote(db, "w1", { itens: lidos, ignoradas: 0 }, conta, "extrato")
        if (!r.ok) throw new Error(r.erro)
        await gravarLote(db, ctx, r.lote)
        expect(linhasDoUpsert(chamadas, "transactions")[0].every((l) => l.source === "import_statement")).toBe(true)
    })

    it("needs_review é verdadeiro e o import_batch_id é o mesmo em todos", async () => {
        const { db, chamadas } = clienteFalso(respostas())
        const r = await prepararLote(db, "w1", { itens: lidos, ignoradas: 0 }, conta, "planilha")
        if (!r.ok) throw new Error(r.erro)
        await gravarLote(db, ctx, r.lote)
        const linhas = linhasDoUpsert(chamadas, "transactions")[0]
        expect(linhas.every((l) => l.needs_review === true)).toBe(true)
        expect(new Set(linhas.map((l) => l.import_batch_id))).toEqual(new Set([r.lote.batchId]))
    })

    it("as categorias que faltam são criadas antes das transações, e o item a usa", async () => {
        const { db, chamadas } = clienteFalso(respostas())
        const r = await prepararLote(db, "w1", { itens: lidos, ignoradas: 0 }, conta, "planilha")
        if (!r.ok) throw new Error(r.erro)
        expect(r.lote.novas.map((c) => c.nome)).toEqual(["Feira"])
        await gravarLote(db, ctx, r.lote)
        const ordem = chamadas.filter((c) => c.op === "upsert").map((c) => c.tabela)
        expect(ordem).toEqual(["categories", "transactions"])
        expect(linhasDoUpsert(chamadas, "transactions")[0][0].category_id).toBe("c-nova")
    })

    it("a prévia lê o histórico da carteira", async () => {
        const { db, chamadas } = clienteFalso(respostas())
        await prepararLote(db, "w1", { itens: lidos, ignoradas: 0 }, conta, "extrato")
        expect(chamadas).toContainEqual({ tabela: "transactions", op: "select", args: ["description,category_id,date"] })
        expect(chamadas).toContainEqual({ tabela: "transactions", op: "limit", args: [1000] })
    })

    it("erro ao criar categoria não grava o lote", async () => {
        const { db, chamadas } = clienteFalso({
            ...respostas(),
            categories: (op: string) => (op === "upsert" ? { data: null, error: { message: "rls" } } : { data: [], error: null }),
        })
        const r = await prepararLote(db, "w1", { itens: lidos, ignoradas: 0 }, conta, "planilha")
        if (!r.ok) throw new Error(r.erro)
        expect(await gravarLote(db, ctx, r.lote)).toEqual({ ok: false, erro: "Não foi possível criar as categorias: rls" })
        expect(linhasDoUpsert(chamadas, "transactions")).toHaveLength(0)
    })

    it("desfazer apaga por import_batch_id", async () => {
        const { db, chamadas } = clienteFalso({})
        await desfazerImportacao(db, "w1", "lote-1")
        expect(chamadas).toEqual([
            { tabela: "transactions", op: "delete", args: [] },
            { tabela: "transactions", op: "eq", args: ["workspace_id", "w1"] },
            { tabela: "transactions", op: "eq", args: ["import_batch_id", "lote-1"] },
        ])
    })

    it("o resumo soma com o sinal e acha o período", async () => {
        const { db } = clienteFalso(respostas())
        const r = await prepararLote(db, "w1", { itens: lidos, ignoradas: 0 }, conta, "extrato")
        if (!r.ok) throw new Error(r.erro)
        expect(resumoDoLote(r.lote.itens)).toEqual({
            total: 2,
            soma: 150,
            periodo: { de: "2026-10-02", ate: "2026-10-05" },
        })
    })

    it("o OFX só vale no extrato", () => {
        expect(tipoDoArquivo("a.OFX", "extrato")).toBe("ofx")
        expect(tipoDoArquivo("a.ofx", "planilha")).toBeNull()
        expect(tipoDoArquivo("a.csv", "planilha")).toBe("csv")
        expect(tipoDoArquivo("a.pdf", "extrato")).toBeNull()
    })
})

describe("a vez da leitura", () => {
    it("a resposta de um pedido invalidado (reiniciar, trocar modo) ou superado é descartada", async () => {
        const vez = criarVez()
        const aplicadas: string[] = []
        // A leitura demora; no meio dela o diálogo reinicia.
        let soltar: () => void = () => {}
        const ler = (nome: string) => {
            const n = vez.nova()
            return new Promise<void>((ok) => (soltar = ok)).then(() => {
                if (vez.vale(n)) aplicadas.push(nome)
            })
        }
        const primeira = ler("velha")
        vez.invalidar()
        soltar()
        await primeira
        expect(aplicadas).toEqual([])

        const a = ler("a")
        const soltarA = soltar
        const b = ler("b")
        soltarA()
        soltar()
        await Promise.all([a, b])
        expect(aplicadas).toEqual(["b"])
    })
})

describe("o hook e o diálogo", () => {
    const hook = semComentarios(lerFonte("src/components/transactions/importar/use-importar-extrato.ts"), "tudo")
    const dialogo = semComentarios(lerFonte("src/components/transactions/importar/importar-extrato-dialog.tsx"), "tudo")

    it("o lote é preparado uma vez e fica no estado; importar reenvia o mesmo", () => {
        expect(hook).toMatch(/setLote\(\s*r\.lote\s*\)/)
        expect(hook).toContain("gravarLote(supabase, { userId, workspaceId }, lote)")
        expect(hook).toContain("desfazerImportacao(supabase, workspaceId, lote.batchId)")
        // A resposta da leitura só aterrissa se ainda for a vez dela.
        expect(hook).toMatch(/prepararLote\([^)]*\)\s*if \(!vez\.vale\(n\)\) return/)
        expect(hook).toMatch(/function reiniciar\(\) \{\s*vez\.invalidar\(\)/)
    })

    it("o diálogo é o dos passos, com pending, dirty e o desfazer no AlertDialog", () => {
        expect(dialogo).toMatch(/<Dialog[\s\S]*?surface="auto"/)
        expect(dialogo).toContain('size="lg"')
        expect(dialogo).toContain("<DialogSteps")
        expect(dialogo).toMatch(/pending=\{/)
        expect(dialogo).toMatch(/dirty=\{imp\.dirty\}/)
        expect(dialogo).toContain("confirmDiscard")
        expect(dialogo).toContain("<AlertDialog")
        expect(dialogo).toContain("itens.slice(0, 20)")
        expect(dialogo).not.toContain("window.confirm")
        // Lendo ou gravando, modo, destino e arquivo travam.
        expect(dialogo.match(/disabled=\{travado\}/g)?.length).toBe(6)
    })
})
