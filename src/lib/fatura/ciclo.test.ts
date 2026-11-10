import { describe, expect, it } from "vitest"

import type { LancamentoParaConferir } from "@/lib/fatura/conferir"
import { linhasDeImportacao, prepararItens } from "@/lib/import/importar"
import type { ItemBanco } from "@/lib/import/tipos"
import { transactionLocalYmd } from "@/lib/transaction-date"

import { ajustarAoCiclo, conferirNoCiclo } from "./ciclo"

const ciclo = { inicio: "2026-09-04", fechamento: "2026-10-03" }

const item = (data: string, descricao: string, valor: number, extra: Partial<ItemBanco> = {}): ItemBanco => ({
    data,
    descricao,
    valor,
    estorno: false,
    parcela: null,
    ...extra,
})

const app = (id: string, date: string, description: string, amount: number): LancamentoParaConferir => ({
    id,
    date,
    description,
    amount,
    type: "expense",
    installment_sequence: null,
})

describe("ajustarAoCiclo", () => {
    it("parcela com a data da compra, antes do ciclo, vai ao início dele e guarda a data na descrição", () => {
        const parcela = item("2026-03-05", "LOJA FICTICIA", 50, { parcela: { k: 7, n: 10 } })
        expect(ajustarAoCiclo([parcela], ciclo)).toEqual([
            { ...parcela, data: "2026-09-04", descricao: "LOJA FICTICIA · compra em 05/03" },
        ])
    })

    it("item depois do fechamento vai ao fechamento", () => {
        expect(ajustarAoCiclo([item("2026-10-06", "CAFE", 9)], ciclo)[0]).toMatchObject({
            data: "2026-10-03",
            descricao: "CAFE · compra em 06/10",
        })
    })

    it("item dentro do ciclo fica igual (o mesmo objeto)", () => {
        const dentro = item("2026-09-20", "PADARIA", 12.9)
        expect(ajustarAoCiclo([dentro], ciclo)[0]).toBe(dentro)
    })

    it("guarda o clientId de quem foi preparado (o reenvio não duplica)", () => {
        const [preparado] = prepararItens([item("2026-03-05", "LOJA", 50)], [], [], { tipo: "cartao", cardId: "card" } as const)
        expect(ajustarAoCiclo([preparado], ciclo)[0].clientId).toBe(preparado.clientId)
    })
})

describe("conferirNoCiclo", () => {
    it("o lançamento do app de antes do ciclo casa com a data original do banco", () => {
        // Um extrato que atravessa dois ciclos: a compra de 02/09 já está no app.
        const r = conferirNoCiclo(
            [item("2026-09-02", "MERCADO", 80), item("2026-09-10", "PADARIA", 12.9)],
            [app("a", "2026-09-02", "MERCADO", 80), app("b", "2026-09-10", "PADARIA", 12.9)],
            ciclo,
        )
        expect(r.bate).toHaveLength(2)
        expect(r.faltaNoApp).toEqual([])
    })

    it("'Só no app' fica no ciclo: o lançamento antigo sem par não aparece", () => {
        const r = conferirNoCiclo(
            [item("2026-08-30", "MERCADO", 80)],
            [app("velho", "2026-08-01", "LUZ", 100), app("novo", "2026-09-15", "GAS", 40)],
            ciclo,
        )
        expect(r.soNoApp.map((a) => a.id)).toEqual(["novo"])
        expect(r.somaApp).toBe(40)
    })

    it("depois de importar ajustado ao ciclo, a segunda conferência põe a parcela em 'bate' (Foco 3)", () => {
        const banco = [
            item("2026-03-05", "LOJA FICTICIA", 50, { parcela: { k: 7, n: 10 } }),
            item("2026-09-20", "PADARIA", 12.9),
        ]
        const primeira = conferirNoCiclo(prepararItens(banco, [], [], { tipo: "cartao", cardId: "card" } as const), [], ciclo)
        expect(primeira.faltaNoApp).toHaveLength(2)

        const linhas = linhasDeImportacao(
            { userId: "u", workspaceId: "w", batchId: "b" },
            ajustarAoCiclo(primeira.faltaNoApp, ciclo),
            { tipo: "cartao", cardId: "c" },
            "import_pdf",
        )
        const importados = linhas.map((l, i) =>
            app(`imp-${i}`, transactionLocalYmd(l.date!)!, l.description!, Number(l.amount)),
        )
        expect(importados[0]).toMatchObject({ date: "2026-09-04", description: "LOJA FICTICIA · compra em 05/03 (7/10)" })

        const segunda = conferirNoCiclo(banco, importados, ciclo)
        expect(segunda.faltaNoApp).toEqual([])
        expect(segunda.bate).toHaveLength(2)
        expect(segunda.bate.map((p) => p.banco)).toEqual(expect.arrayContaining(banco))
    })

    describe("parcela do plano, com a data da cobrança no ciclo", () => {
        const parcela = (k: number) => item("2026-03-05", "LOJA X", 100, { parcela: { k, n: 10 } })
        const doPlano = (id: string, seq: number | null, date = "2026-09-16"): LancamentoParaConferir => ({
            ...app(id, date, "LOJA X", 100),
            installment_sequence: seq,
        })

        it("casa pela sequência e valor, longe da janela de 3 dias (a)", () => {
            const r = conferirNoCiclo([parcela(3)], [doPlano("p3", 3)], ciclo)
            expect(r.bate.map((p) => p.app.id)).toEqual(["p3"])
            expect(r.faltaNoApp).toEqual([])
            expect(r.soNoApp).toEqual([])
        })

        it("sequência diferente vai a 'parcela fora de sequência' (b)", () => {
            const r = conferirNoCiclo([parcela(3)], [doPlano("p2", 2)], ciclo)
            expect(r.parcelaForaDeSequencia.map((p) => p.app.id)).toEqual(["p2"])
            expect(r.bate).toEqual([])
            expect(r.faltaNoApp).toEqual([])
        })

        it("entre duas linhas do mesmo valor, escolhe a da sequência certa (c)", () => {
            const r = conferirNoCiclo([parcela(3)], [doPlano("outra", null, "2026-09-12"), doPlano("p3", 3)], ciclo)
            expect(r.bate.map((p) => p.app.id)).toEqual(["p3"])
            expect(r.soNoApp.map((a) => a.id)).toEqual(["outra"])
        })

        it("item sem parcela nunca usa esta passada (d)", () => {
            const r = conferirNoCiclo([item("2026-03-05", "LOJA X", 100)], [doPlano("p3", 3)], ciclo)
            expect(r.bate).toEqual([])
            expect(r.faltaNoApp).toHaveLength(1)
            expect(r.soNoApp.map((a) => a.id)).toEqual(["p3"])
        })

        it("a linha da parcela 1, na data da compra, não rouba a parcela 7 do ciclo (1)", () => {
            const r = conferirNoCiclo([parcela(7)], [doPlano("p1", 1, "2026-03-05"), doPlano("p7", 7)], ciclo)
            expect(r.bate.map((p) => p.app.id)).toEqual(["p7"])
            expect(r.parcelaForaDeSequencia).toEqual([])
            expect(r.soNoApp).toEqual([])
        })

        it("a parcela 1 importada num ciclo antigo não esconde a 7 deste (2)", () => {
            const importadaEmMarco = { ...app("m", "2026-03-05", "LOJA X (1/10)", 100) }
            const r = conferirNoCiclo([parcela(7)], [importadaEmMarco], ciclo)
            expect(r.bate).toEqual([])
            expect(r.faltaNoApp).toHaveLength(1)
        })

        it("valor igual sem sequência nem descrição parecida não casa (3)", () => {
            const r = conferirNoCiclo([parcela(7)], [app("mercado", "2026-09-16", "MERCADO", 100)], ciclo)
            expect(r.bate).toEqual([])
            expect(r.faltaNoApp).toHaveLength(1)
            expect(r.soNoApp.map((a) => a.id)).toEqual(["mercado"])
        })

        it("a soma do banco conta também as parcelas", () => {
            const r = conferirNoCiclo([parcela(7), item("2026-09-20", "PADARIA", 10)], [], ciclo)
            expect(r.somaBanco).toBe(110)
        })

        it("a linha do plano fora do ciclo não é usada", () => {
            const r = conferirNoCiclo([parcela(3)], [doPlano("antiga", 3, "2026-08-16")], ciclo)
            expect(r.faltaNoApp).toHaveLength(1)
        })
    })
})
