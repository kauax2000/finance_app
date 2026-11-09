import { beforeEach, describe, expect, it, vi } from "vitest"

const { invokeEdgeJson } = vi.hoisted(() => ({ invokeEdgeJson: vi.fn() }))
vi.mock("@/lib/edge-invoke", () => ({ invokeEdgeJson }))
vi.mock("@/lib/supabase", () => ({ supabase: { auth: { getSession: vi.fn() } } }))

import { conferirNoCiclo } from "@/lib/fatura/ciclo"
import type { LancamentoParaConferir } from "@/lib/fatura/conferir"
import { alinharFaturaComIA } from "@/lib/ia/ler"
import { prepararItens } from "@/lib/import/importar"
import type { ItemBanco } from "@/lib/import/tipos"

import { aplicarAlinhamento, paraAlinhar } from "./alinhar"
import { sugerirCorrecoes } from "./correcoes"

const ciclo = { inicio: "2026-09-27", fechamento: "2026-10-26" }
const it_ = (data: string, descricao: string, valor: number): ItemBanco => ({ data, descricao, valor, estorno: false, parcela: null })
const ap = (id: string, date: string, description: string, amount: number): LancamentoParaConferir => ({
    id, date, description, amount, type: "expense", installment_sequence: null,
})
const montar = (valorApp = 228.14) =>
    conferirNoCiclo(prepararItens([it_("2026-10-01", "PELANDA ALPINO 3", 228.13)], []), [ap("g", "2026-10-02", "Gasolina", valorApp)], ciclo)

describe("alinhar", () => {
    it("paraAlinhar manda só i/data/descricao/valor/estorno", () => {
        const { banco, app } = paraAlinhar(montar())
        expect(banco).toEqual([{ i: 0, data: "2026-10-01", descricao: "PELANDA ALPINO 3", valor: 228.13, estorno: false }])
        expect(app).toEqual([{ i: 0, data: "2026-10-02", descricao: "Gasolina", valor: 228.14, estorno: false }])
    })

    it("move o par Gasolina 228.13 x 228.14 para valorDiferente", () => {
        const c = montar()
        expect(c.faltaNoApp).toHaveLength(1)
        const r = aplicarAlinhamento(c, [{ banco: 0, app: 0 }])
        expect(r.valorDiferente).toHaveLength(1)
        expect(r.faltaNoApp).toEqual([])
        expect(r.soNoApp).toEqual([])
        expect([...r.daIA]).toEqual(["g"])
    })

    it("valor igual vai para bate", () => {
        const r = aplicarAlinhamento(montar(228.13), [{ banco: 0, app: 0 }])
        expect(r.bate).toHaveLength(1)
        expect(r.valorDiferente).toEqual([])
    })

    it("par inválido é ignorado", () => {
        const c = montar()
        for (const par of [{ banco: 5, app: 0 }, { banco: 0, app: 3 }, { banco: 0.5, app: 0 }]) {
            const r = aplicarAlinhamento(c, [par])
            expect(r.faltaNoApp).toHaveLength(1)
            expect(r.daIA.size).toBe(0)
        }
        // longe demais: R$ 228,13 x R$ 300 (> max(10, 25%))
        expect(aplicarAlinhamento(montar(300), [{ banco: 0, app: 0 }]).valorDiferente).toEqual([])
        // repetido: o segundo é descartado
        const dois = conferirNoCiclo(
            prepararItens([it_("2026-10-01", "A", 10), it_("2026-10-01", "B", 10)], []),
            [ap("x", "2026-10-01", "Z", 10.5), ap("y", "2026-10-01", "W", 10.5)],
            ciclo,
        )
        const r = aplicarAlinhamento(dois, [{ banco: 0, app: 0 }, { banco: 0, app: 1 }])
        expect(r.valorDiferente).toHaveLength(1)
        expect(r.soNoApp).toHaveLength(1)
    })

    it("somas não mudam", () => {
        const c = montar()
        const r = aplicarAlinhamento(c, [{ banco: 0, app: 0 }])
        expect([r.somaBanco, r.somaApp, r.diferenca]).toEqual([c.somaBanco, c.somaApp, c.diferenca])
    })

    it("sugerirCorrecoes vê o par como valor-diferente", () => {
        const r = aplicarAlinhamento(montar(), [{ banco: 0, app: 0 }])
        expect(sugerirCorrecoes(r, ciclo).map((c) => c.motivo)).toEqual(["valor-diferente"])
    })
})

describe("alinharFaturaComIA", () => {
    beforeEach(() => invokeEdgeJson.mockReset())

    it("manda a op alinhar e devolve os pares", async () => {
        invokeEdgeJson.mockResolvedValueOnce({ ok: true, pares: [{ banco: 0, app: 0 }], provedor: "groq", modelo: "m" })
        const r = await alinharFaturaComIA("w1", [], [])
        expect(invokeEdgeJson).toHaveBeenCalledWith("ia-ler", { body: { op: "alinhar", workspaceId: "w1", banco: [], app: [] } })
        expect(r).toMatchObject({ ok: true, pares: [{ banco: 0, app: 0 }] })
    })

    it("traduz cota e sem conexão", async () => {
        invokeEdgeJson.mockResolvedValueOnce({ ok: false, motivo: "cota" })
        expect(await alinharFaturaComIA("w1", [], [])).toMatchObject({ ok: false, esgotada: true, mensagem: "Você usou a IA 30 vezes hoje. Amanhã volta." })
        invokeEdgeJson.mockRejectedValueOnce(new Error("Failed to fetch"))
        expect(await alinharFaturaComIA("w1", [], [])).toEqual({ ok: false, mensagem: "Sem conexão com a IA." })
    })
})

describe("proximaChamadaDaIA", async () => {
    const { proximaChamadaDaIA } = await import("@/lib/fatura/alinhar")
    const base = {
        origem: "pdf",
        completa: false as boolean | null,
        ia: false,
        leituraId: "L1",
        relidaIniciada: null as string | null,
        relidaTerminou: null as string | null,
        cotaEsgotada: false,
        sobraDosDoisLados: true,
        alinhadaIniciada: null as string | null,
        pendente: null as string | null,
    }

    it("PDF incompleto: relê primeiro, mesmo sobrando dos dois lados", () => {
        expect(proximaChamadaDaIA(base)).toBe("reler")
    })

    it("com a releitura começada ou pendente, nada", () => {
        expect(proximaChamadaDaIA({ ...base, relidaIniciada: "L1" })).toBeNull()
        expect(proximaChamadaDaIA({ ...base, relidaIniciada: "L1", pendente: "ia" })).toBeNull()
    })

    it("a releitura terminou (sem trocar a leitura): alinha", () => {
        expect(proximaChamadaDaIA({ ...base, relidaIniciada: "L1", relidaTerminou: "L1" })).toBe("alinhar")
    })

    it("a releitura terminou sem cota: não alinha", () => {
        expect(proximaChamadaDaIA({ ...base, relidaIniciada: "L1", relidaTerminou: "L1", cotaEsgotada: true })).toBeNull()
    })

    it("a releitura que terminou numa leitura velha não libera a nova", () => {
        expect(proximaChamadaDaIA({ ...base, leituraId: "L2", relidaIniciada: "L2", relidaTerminou: "L1" })).toBeNull()
    })

    it("leitura completa, ou já lida pela IA, com sobra: alinha", () => {
        expect(proximaChamadaDaIA({ ...base, completa: true })).toBe("alinhar")
        expect(proximaChamadaDaIA({ ...base, ia: true })).toBe("alinhar")
        expect(proximaChamadaDaIA({ ...base, origem: "csv" })).toBe("alinhar")
    })

    it("já alinhada nesta leitura, sem sobra, ou com algo pendente: nada", () => {
        expect(proximaChamadaDaIA({ ...base, completa: true, alinhadaIniciada: "L1" })).toBeNull()
        expect(proximaChamadaDaIA({ ...base, completa: true, sobraDosDoisLados: false })).toBeNull()
        expect(proximaChamadaDaIA({ ...base, completa: true, pendente: "total" })).toBeNull()
    })

    it("sem leitura, nada", () => {
        expect(proximaChamadaDaIA({ ...base, leituraId: "" })).toBeNull()
    })
})
