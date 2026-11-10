import { describe, expect, it } from "vitest"
import type { ItemBanco } from "@/lib/import/tipos"
import { linhasDeImportacao } from "@/lib/import/importar"
import { conferirFatura, similaridade, type LancamentoParaConferir } from "./conferir"

function banco(p: Partial<ItemBanco> = {}): ItemBanco {
    return { data: "2026-10-10", descricao: "PADARIA SOL", valor: 30, estorno: false, parcela: null, ...p }
}

let seq = 0
function app(p: Partial<LancamentoParaConferir> = {}): LancamentoParaConferir {
    seq += 1
    return {
        id: `t${seq}`,
        date: "2026-10-10",
        description: "Padaria Sol",
        amount: 30,
        type: "expense",
        installment_sequence: null,
        ...p,
    }
}

describe("similaridade", () => {
    it("Jaccard das palavras de 3+ letras, não numéricas", () => {
        expect(similaridade("UBER *TRIP", "uber")).toBe(0.5)
        expect(similaridade("Padaria Sol", "PADARIA  SOL")).toBe(1)
        expect(similaridade("12 de", "")).toBe(0)
        expect(similaridade("", "")).toBe(0)
    })
})

describe("conferirFatura", () => {
    it("mesmo valor a 2 dias bate", () => {
        const r = conferirFatura([banco()], [app({ date: "2026-10-12" })])
        expect(r.bate).toHaveLength(1)
        expect(r.faltaNoApp).toHaveLength(0)
        expect(r.soNoApp).toHaveLength(0)
    })

    it("a 4 dias não casa", () => {
        const r = conferirFatura([banco()], [app({ date: "2026-10-14" })])
        expect(r.bate).toHaveLength(0)
        expect(r.faltaNoApp).toHaveLength(1)
        expect(r.soNoApp).toHaveLength(1)
    })

    it("descrição parecida com valor diferente vai para valorDiferente", () => {
        const r = conferirFatura(
            [banco({ descricao: "UBER *TRIP", valor: 25 })],
            [app({ description: "uber", amount: 27 })],
        )
        expect(r.valorDiferente).toHaveLength(1)
        expect(r.bate).toHaveLength(0)
        expect(r.faltaNoApp).toHaveLength(0)
        expect(r.soNoApp).toHaveLength(0)
    })

    it("estorno não casa com despesa de mesmo valor", () => {
        const r = conferirFatura([banco({ estorno: true })], [app()])
        expect(r.bate).toHaveLength(0)
        expect(r.valorDiferente).toHaveLength(0)
        expect(r.faltaNoApp).toHaveLength(1)
        expect(r.soNoApp).toHaveLength(1)
    })

    it("parcela 3/10 contra installment_sequence 2 fica fora de sequência", () => {
        const r = conferirFatura([banco({ parcela: { k: 3, n: 10 } })], [app({ installment_sequence: 2 })])
        expect(r.parcelaForaDeSequencia).toHaveLength(1)
        expect(r.bate).toHaveLength(0)
    })

    it("dois iguais no banco contra um no app: 1 bate e 1 falta", () => {
        const r = conferirFatura([banco(), banco()], [app()])
        expect(r.bate).toHaveLength(1)
        expect(r.faltaNoApp).toHaveLength(1)
        expect(r.soNoApp).toHaveLength(0)
    })

    it("prefere a descrição mais parecida, depois o dia mais perto", () => {
        const a = app({ description: "Mercado", date: "2026-10-10" })
        const b = app({ description: "Padaria Sol", date: "2026-10-12" })
        const r = conferirFatura([banco()], [a, b])
        expect(r.bate[0].app.id).toBe(b.id)
    })

    it("conferir de novo depois de importar os faltantes: tudo bate (Foco 3)", () => {
        const itens = [
            banco(),
            banco({ descricao: "LOJA AZUL", valor: 100, parcela: { k: 3, n: 10 }, data: "2026-10-05" }),
            banco({ descricao: "ESTORNO LOJA", valor: 15, estorno: true, data: "2026-10-08" }),
        ]
        const primeira = conferirFatura(itens, [])
        expect(primeira.faltaNoApp).toHaveLength(3)

        const linhas = linhasDeImportacao(
            { userId: "u", workspaceId: "w", batchId: "b" },
            primeira.faltaNoApp.map((i, n) => ({ ...i, clientId: `c${n}`, categoryId: null, origem: null })),
            { tipo: "cartao", cardId: "card" },
            "import_pdf",
        )
        const importados: LancamentoParaConferir[] = linhas.map((l, n) => ({
            id: `imp${n}`,
            date: (l.date ?? "").slice(0, 10),
            description: l.description ?? null,
            amount: l.amount,
            type: l.type as "expense" | "income",
            installment_sequence: l.installment_sequence ?? null,
        }))

        const segunda = conferirFatura(itens, importados)
        expect(segunda.bate).toHaveLength(3)
        expect(segunda.faltaNoApp).toHaveLength(0)
        expect(segunda.soNoApp).toHaveLength(0)
        expect(segunda.parcelaForaDeSequencia).toHaveLength(0)
        expect(segunda.diferenca).toBe(0)
    })

    it("somas com sinal, estorno negativo", () => {
        const r = conferirFatura(
            [banco({ valor: 100.1 }), banco({ valor: 20.2, estorno: true, descricao: "ESTORNO" })],
            [app({ amount: 50.05 }), app({ amount: 10, type: "income", description: "Estorno" })],
        )
        expect(r.somaBanco).toBe(79.9)
        expect(r.somaApp).toBe(40.05)
        expect(r.diferenca).toBe(39.85)
    })
})
