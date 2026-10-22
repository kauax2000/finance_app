import { describe, expect, it } from "vitest"

import { itensDaIA, releitura } from "@/lib/ia/fatura"
import type { ItemFaturaIA } from "@/lib/ia/ler"
import type { ItemBanco } from "@/lib/import/tipos"
import { lerFonte, semComentarios } from "@/test/fonte"

const ia = (i: Partial<ItemFaturaIA>): ItemFaturaIA => ({
    data: "2026-03-05",
    descricao: "LOJA EXEMPLO",
    valor: 40,
    estorno: false,
    parcela: null,
    ...i,
})

const banco = (valor: number, estorno = false): ItemBanco => ({
    data: "2026-03-05",
    descricao: "LOJA EXEMPLO",
    valor,
    estorno,
    parcela: null,
})

describe("itensDaIA", () => {
    it("converte campo a campo e mantém a parcela", () => {
        expect(itensDaIA([ia({ estorno: true, parcela: { k: 2, n: 10 } })])).toEqual([
            { data: "2026-03-05", descricao: "LOJA EXEMPLO", valor: 40, estorno: true, parcela: { k: 2, n: 10 } },
        ])
    })

    it("descarta os inválidos, como o validador da Edge", () => {
        const lixo = [
            ia({ data: "2026-02-30" }),
            ia({ data: "05/03/2026" }),
            ia({ data: "1999-12-31" }),
            ia({ valor: 0 }),
            ia({ valor: -5 }),
            ia({ valor: 1_000_000.01 }),
            ia({ valor: Number.NaN }),
            ia({ descricao: "   " }),
        ]
        expect(itensDaIA([...lixo, ia({ descricao: "  MERCADO TESTE  " })])).toEqual([
            { data: "2026-03-05", descricao: "MERCADO TESTE", valor: 40, estorno: false, parcela: null },
        ])
    })

    it("parcela fora da régua vira nula, e o item fica", () => {
        const [a, b] = itensDaIA([ia({ parcela: { k: 3, n: 2 } }), ia({ parcela: { k: 1, n: 49 } })])
        expect(a.parcela).toBeNull()
        expect(b.parcela).toBeNull()
    })
})

describe("releitura", () => {
    it("fecha quando a soma bate com o total do leitor", () => {
        expect(releitura(100, [banco(60), banco(40)])).toEqual({ completa: true, diferenca: 0 })
    })

    it("estorno conta negativo, e a diferença é total − soma", () => {
        expect(releitura(100, [banco(95), banco(5, true)])).toEqual({ completa: false, diferenca: 10 })
        expect(releitura(100, [banco(90)])).toEqual({ completa: false, diferenca: 10 })
    })

    it("sem total não fecha", () => {
        expect(releitura(null, [banco(10)])).toEqual({ completa: false, diferenca: null })
    })
})

describe("Conferir fatura: Ler com IA (fonte)", () => {
    const tela = semComentarios(lerFonte("src/components/wireframe/conferir-fatura-wireframe.tsx"))
    const leitor = semComentarios(lerFonte("src/lib/import/fatura-texto.ts"))
    const ia = semComentarios(lerFonte("src/lib/ia/fatura.ts"))

    it("o botão só aparece com a leitura do PDF incompleta", () => {
        expect(tela).toContain("Ler com IA")
        expect(tela).toMatch(/leitura\.origem === "pdf" && leitura\.completa === false[\s\S]*Ler com IA/)
    })

    it("o texto guardado é o redigido, e é ele que vai à IA", () => {
        expect(tela).toMatch(/const redigido = removerIdentificacao\(r\.texto\)\s+setTextoPdf\(redigido\)/)
        expect(tela).toMatch(/lerFaturaComIA\(workspaceId, textoPdf, /)
        expect(tela).not.toMatch(/lerFaturaComIA\([^)]*r\.texto/)
    })

    it("os itens da IA passam pelo mesmo aplicar, com o total do leitor (Decisão 7)", () => {
        expect(tela).toMatch(/itensDaIA\(lido\.itens\)[\s\S]*aplicar\(/)
        expect(tela).toMatch(/const total = leitura\.total[\s\S]*total, \.\.\.releitura\(total, novos\)/)
        expect(tela).toContain("Lido pela IA · ")
    })

    it("a resposta atrasada é jogada fora", () => {
        expect(tela).toMatch(/const meu = \+\+pedido\.current[\s\S]*lerFaturaComIA[\s\S]*if \(meu !== pedido\.current\) return/)
    })

    it("a regra de completa é uma só, a do leitor determinístico", () => {
        expect(leitor).toMatch(/export function completude\(/)
        expect(leitor).toMatch(/\.\.\.completude\(total, itens\)/)
        expect(ia).toMatch(/completude\(totalDeterministico, itens\)/)
    })

    it("o que se importa dali vai pelo caminho de sempre, que marca needs_review", () => {
        expect(tela).toMatch(/importarLancamentos\(/)
        expect(semComentarios(lerFonte("src/lib/import/importar.ts"))).toContain("needs_review: true")
    })
})
