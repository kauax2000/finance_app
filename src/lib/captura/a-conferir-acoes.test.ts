import type { SupabaseClient } from "@supabase/supabase-js"
import { describe, expect, it } from "vitest"
import {
    confirmarLancamento,
    contarLote,
    desfazerLote,
    jaLembrado,
    lembrarCartaoDaWallet,
} from "@/lib/captura/a-conferir-acoes"

type Chamada = { tabela: string; op: string; args: unknown[] }

/** Um cliente falso que anota cada passo da cadeia e resolve com `resposta`. */
function clienteFalso(resposta: Record<string, unknown>) {
    const chamadas: Chamada[] = []
    const cliente = {
        from(tabela: string) {
            const cadeia: Record<string, unknown> = {}
            for (const op of ["update", "delete", "select", "eq", "maybeSingle"]) {
                cadeia[op] = (...args: unknown[]) => {
                    chamadas.push({ tabela, op, args })
                    return cadeia
                }
            }
            cadeia.then = (ok: (v: unknown) => unknown) => Promise.resolve(resposta).then(ok)
            return cadeia
        },
    }
    return { db: cliente as unknown as SupabaseClient, chamadas }
}

describe("confirmarLancamento", () => {
    it("tira o needs_review e pede a linha de volta", async () => {
        const { db, chamadas } = clienteFalso({ data: [{ id: "t1" }], error: null })
        await confirmarLancamento(db, "t1")
        expect(chamadas).toEqual([
            { tabela: "transactions", op: "update", args: [{ needs_review: false }] },
            { tabela: "transactions", op: "eq", args: ["id", "t1"] },
            { tabela: "transactions", op: "select", args: ["id"] },
        ])
    })

    it("sem uma linha de volta, lança", async () => {
        const { db } = clienteFalso({ data: [], error: null })
        await expect(confirmarLancamento(db, "t1")).rejects.toThrow()
    })

    it("com erro, lança com a mensagem", async () => {
        const { db } = clienteFalso({ data: null, error: { message: "rls" } })
        await expect(confirmarLancamento(db, "t1")).rejects.toThrow("Não foi possível confirmar: rls")
    })
})

describe("lembrarCartaoDaWallet", () => {
    it("corta o apelido em 60 caracteres", async () => {
        const { db, chamadas } = clienteFalso({ data: [{ id: "c1" }], error: null })
        const longo = "N".repeat(80)
        expect(await lembrarCartaoDaWallet(db, "c1", longo)).toBe("N".repeat(60))
        expect(chamadas[0]).toEqual({ tabela: "credit_cards", op: "update", args: [{ wallet_alias: "N".repeat(60) }] })
        expect(chamadas[1].args).toEqual(["id", "c1"])
    })

    it("zero linhas atualizadas não é sucesso", async () => {
        const { db } = clienteFalso({ data: [], error: null })
        await expect(lembrarCartaoDaWallet(db, "c1", "Nubank Ultra")).rejects.toThrow("Não foi possível lembrar o cartão.")
    })

    it("já lembrado ignora caixa e acento", () => {
        expect(jaLembrado("nubank ultra", "Nubank Ultra")).toBe(true)
        expect(jaLembrado("Itaú", "itau")).toBe(true)
        expect(jaLembrado(null, "Nubank")).toBe(false)
        expect(jaLembrado("Inter", "Nubank")).toBe(false)
    })
})

describe("desfazerLote", () => {
    it("apaga pelo lote, dentro da carteira", async () => {
        const { db, chamadas } = clienteFalso({ error: null })
        await desfazerLote(db, "w1", "B")
        expect(chamadas.map((c) => c.op)).toEqual(["delete", "eq", "eq"])
        expect(chamadas[2].args).toEqual(["import_batch_id", "B"])
        expect(chamadas[1].args).toEqual(["workspace_id", "w1"])
    })

    it("com erro, lança", async () => {
        const { db } = clienteFalso({ error: { message: "falhou" } })
        await expect(desfazerLote(db, "w1", "B")).rejects.toThrow()
    })

    it("conta o lote sem trazer as linhas", async () => {
        const { db, chamadas } = clienteFalso({ count: 12, error: null })
        expect(await contarLote(db, "w1", "B")).toBe(12)
        expect(chamadas[0].args).toEqual(["id", { count: "exact", head: true }])
        expect(chamadas.at(-1)?.args).toEqual(["import_batch_id", "B"])
    })
})
