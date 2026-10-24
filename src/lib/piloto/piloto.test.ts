import { describe, expect, it, vi } from "vitest"

// `agruparPiloto` é pura; o cliente do Supabase exige variáveis de ambiente que o teste não tem.
vi.mock("@/lib/supabase", () => ({ supabase: {} }))

import { agruparPiloto, ROTULO_DA_ORIGEM, textoDesfazerImportacao, type LinhaPiloto } from "./piloto"

function linha(p: Partial<LinhaPiloto> & { id: string }): LinhaPiloto {
    return {
        description: p.id,
        amount: 10,
        date: "2026-10-20",
        created_at: "2026-10-20T10:00:00Z",
        source: "quick_text",
        import_batch_id: null,
        needs_review: false,
        category: null,
        ...p,
    }
}

describe("agruparPiloto", () => {
    it("separa dois lotes de importação, com total e soma", () => {
        const g = agruparPiloto([
            linha({ id: "a", source: "import_pdf", import_batch_id: "L1", amount: 10, created_at: "2026-10-01T10:00:00Z" }),
            linha({ id: "b", source: "import_pdf", import_batch_id: "L1", amount: 5.5, created_at: "2026-10-01T10:00:01Z" }),
            linha({ id: "c", source: "import_sheet", import_batch_id: "L2", amount: 3, created_at: "2026-10-05T10:00:00Z" }),
        ])
        expect(g).toHaveLength(2)
        expect(g[0]).toMatchObject({ tipo: "importacao", loteId: "L2", origem: "Planilha", total: 1, valor: 3 })
        expect(g[1]).toMatchObject({ tipo: "importacao", loteId: "L1", origem: "Fatura em PDF", total: 2, valor: 15.5 })
    })

    it("mistura captura e recorrente, na ordem captura, importação, recorrente, cada lista por criadoEm decrescente", () => {
        const g = agruparPiloto([
            linha({ id: "r1", source: "recurring", created_at: "2026-10-02T03:00:00Z" }),
            linha({ id: "c1", source: "shortcut", created_at: "2026-10-01T10:00:00Z" }),
            linha({ id: "i1", source: "import_statement", import_batch_id: "L1" }),
            linha({ id: "c2", source: "whatsapp", created_at: "2026-10-03T10:00:00Z", needs_review: true, category: { name: "Mercado" } }),
            linha({ id: "r2", source: "recurring", created_at: "2026-10-04T03:00:00Z" }),
        ])
        expect(g.map((x) => x.tipo)).toEqual(["captura", "importacao", "recorrente"])
        const [captura, , recorrente] = g
        if (captura.tipo !== "captura" || recorrente.tipo !== "recorrente") throw new Error("tipo")
        expect(captura.itens.map((i) => i.id)).toEqual(["c2", "c1"])
        expect(captura.itens[0]).toMatchObject({ aConferir: true, categoria: "Mercado", origem: "WhatsApp" })
        expect(recorrente.itens.map((i) => i.id)).toEqual(["r2", "r1"])
        expect(recorrente.itens[0].origem).toBe("Assinatura ou parcela")
    })

    it("no mesmo criadoEm desempata pelo id, em qualquer ordem de chegada", () => {
        const mesmo = "2026-10-01T10:00:00Z"
        const itens = ["b", "c", "a"].map((id) => linha({ id, created_at: mesmo }))
        for (const ordem of [itens, [...itens].reverse()]) {
            const [g] = agruparPiloto(ordem)
            if (g.tipo !== "captura") throw new Error("tipo")
            expect(g.itens.map((i) => i.id)).toEqual(["a", "b", "c"])
        }
        const lotes = agruparPiloto(
            ["L2", "L1"].map((lote) => linha({ id: lote, source: "import_pdf", import_batch_id: lote, created_at: mesmo })),
        )
        expect(lotes.map((x) => (x.tipo === "importacao" ? x.loteId : x.tipo))).toEqual(["L1", "L2"])
    })

    it("omite o grupo vazio", () => {
        expect(agruparPiloto([])).toEqual([])
        const g = agruparPiloto([linha({ id: "r", source: "recurring" })])
        expect(g.map((x) => x.tipo)).toEqual(["recorrente"])
    })

    it("origem desconhecida cai em captura com o rótulo cru", () => {
        const g = agruparPiloto([linha({ id: "x", source: "outra_coisa" as never })])
        expect(g).toHaveLength(1)
        if (g[0].tipo !== "captura") throw new Error("tipo")
        expect(g[0].itens[0].origem).toBe("outra_coisa")
    })

    it("tem rótulo para as nove origens", () => {
        expect(Object.keys(ROTULO_DA_ORIGEM)).toHaveLength(9)
    })
})

describe("textoDesfazerImportacao", () => {
    it("usa o singular com 1 lançamento e o plural nos demais", () => {
        expect(textoDesfazerImportacao(1)).toBe("Apagar o lançamento desta importação?")
        expect(textoDesfazerImportacao(2)).toBe("Apagar os 2 lançamentos desta importação?")
        expect(textoDesfazerImportacao(12)).toBe("Apagar os 12 lançamentos desta importação?")
    })
})
