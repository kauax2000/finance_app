import { describe, expect, it } from "vitest"
import { deduzirMapeamento, lerCsv } from "./csv"

const ded = (csv: string, destino: "cartao" | "conta" = "conta") => deduzirMapeamento(lerCsv(csv), destino)

// Conteúdo do teste-importacao.csv da raiz (o arquivo não está versionado).
const TESTE = "Data;Descrição;Valor\n01/10/2026;Mercado;-52,30\n02/10/2026;Salário;3.000,00\n03/10/2026;Padaria;-8,00\n"

describe("deduzirMapeamento", () => {
    it("cabeçalho em pt-BR: conta, negativo é despesa", () => {
        expect(ded(TESTE)).toEqual({
            mapa: { data: 0, descricao: 1, valor: 2, categoria: null },
            temCabecalho: true,
            negativoEhDespesa: true,
            certa: true,
        })
    })
    it("cabeçalho em inglês", () => {
        const d = ded("Date,Description,Amount\n2026-10-01,Loja,-10.50\n2026-10-02,Posto,-20.00\n")
        expect(d.mapa).toEqual({ data: 0, descricao: 1, valor: 2, categoria: null })
        expect(d.temCabecalho).toBe(true)
        expect(d.certa).toBe(true)
    })
    it("sem cabeçalho: acha pelas colunas", () => {
        const d = ded("01/10/2026;Mercado;-52,30\n02/10/2026;Padaria;-8,00\n")
        expect(d.temCabecalho).toBe(false)
        expect(d.mapa).toEqual({ data: 0, descricao: 1, valor: 2, categoria: null })
        expect(d.certa).toBe(true)
    })
    it("colunas em outra ordem", () => {
        const d = ded("Valor;Data;Histórico\n-52,30;01/10/2026;Mercado\n-8,00;02/10/2026;Padaria\n")
        expect(d.mapa).toEqual({ data: 1, descricao: 2, valor: 0, categoria: null })
        expect(d.certa).toBe(true)
    })
    it("coluna Categoria", () => {
        const d = ded("Data;Descrição;Categoria;Valor\n01/10/2026;Mercado;Mercado;-52,30\n")
        expect(d.mapa).toEqual({ data: 0, descricao: 1, valor: 3, categoria: 2 })
    })
    it("cartão com valores positivos: negativo não é despesa", () => {
        const d = ded("Data;Descrição;Valor\n01/10/2026;Loja;52,30\n02/10/2026;Posto;80,00\n", "cartao")
        expect(d.negativoEhDespesa).toBe(false)
    })
    it("cartão com maioria negativa: segue o arquivo", () => {
        const d = ded("Data;Descrição;Valor\n" + [1, 2, 3, 4, 5, 6].map((i) => `0${i}/10/2026;L${i};-${i},00`).join("\n"), "cartao")
        expect(d.negativoEhDespesa).toBe(true)
    })
    it("conta com mais de 80% positivos: segue o arquivo", () => {
        const d = ded("Data;Descrição;Valor\n01/10/2026;A;10,00\n02/10/2026;B;20,00\n03/10/2026;C;30,00\n04/10/2026;D;40,00\n05/10/2026;E;50,00\n06/10/2026;F;-5,00\n")
        expect(d.negativoEhDespesa).toBe(false)
    })
    it("Débito/Crédito/Saldo sem Valor: não é certa", () => {
        const d = ded("Data;Descrição;Débito;Crédito;Saldo\n01/10/2026;Mercado;52,30;;100,00\n02/10/2026;Salário;;3.000,00;3.100,00\n")
        expect(d.certa).toBe(false)
    })
    it("sem cabeçalho, id numérico no fim não rouba o valor", () => {
        const d = ded("01/10/2026;Mercado;-52,30;9981\n02/10/2026;Padaria;-8,00;9982\n")
        expect(d.mapa.valor).toBe(2)
        expect(d.certa).toBe(true)
    })
    it("valor por conteúdo ralo frente à data: não é certa", () => {
        const d = ded("01/10/2026;Mercado;-52,30\n02/10/2026;Padaria;\n03/10/2026;Posto;\n04/10/2026;Bar;\n05/10/2026;Loja;\n")
        expect(d.certa).toBe(false)
    })
    it("Data;Valor sem descrição: não é certa", () => {
        expect(ded("Data;Valor\n01/10/2026;-52,30\n02/10/2026;-8,00\n").certa).toBe(false)
    })
    it("'Nome da categoria' não vira descrição", () => {
        const d = ded("Data;Valor;Nome da categoria\n01/10/2026;-52,30;Mercado\n")
        expect(d.mapa.categoria).toBe(2)
        expect(d.certa).toBe(false)
    })
    it("sem cabeçalho, descrição é a coluna de texto sem nome", () => {
        const d = ded("01/10/2026;-52,30;Mercado\n02/10/2026;-8,00;Padaria\n")
        expect(d.mapa).toEqual({ data: 0, descricao: 2, valor: 1, categoria: null })
        expect(d.certa).toBe(true)
    })
    it("uma linha positiva em conta mantém negativo=despesa", () => {
        expect(ded("Data;Descrição;Valor\n01/10/2026;A;10,00\n").negativoEhDespesa).toBe(true)
    })
    it("10 linhas com >80% de um sinal viram o sinal do arquivo", () => {
        const linhas = Array.from({ length: 10 }, (_, i) => `0${(i % 9) + 1}/10/2026;L${i};${i === 0 ? "-1,00" : "5,00"}`)
        expect(ded("Data;Descrição;Valor\n" + linhas.join("\n")).negativoEhDespesa).toBe(false)
    })
    it("sem coluna de data: não é certa", () => {
        const d = ded("Nome;Valor\nMercado;-52,30\nPadaria;-8,00\n")
        expect(d.certa).toBe(false)
    })
})
