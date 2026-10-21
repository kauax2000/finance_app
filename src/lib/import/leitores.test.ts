import { describe, expect, it } from "vitest"
import { lerCsv, mapearCsv } from "./csv"
import { extrairItensDaFatura, removerIdentificacao } from "./fatura-texto"
import { faturaDdMm } from "./fixtures/fatura-dd-mm"
import { faturaDdMmm } from "./fixtures/fatura-dd-mmm"
import { faturaParcelas } from "./fixtures/fatura-parcelas"
import { lerData, lerValorBr, normalizarDescricao, palavraSignificativa } from "./normalizar"
import { lerOfx } from "./ofx"

describe("normalizar", () => {
    it("lerValorBr lê o dinheiro brasileiro e o ponto decimal", () => {
        expect(lerValorBr("1.234,56")).toBe(1234.56)
        expect(lerValorBr("-12,50")).toBe(-12.5)
        expect(lerValorBr("R$ 9,90")).toBe(9.9)
        expect(lerValorBr("12.50")).toBe(12.5)
        expect(lerValorBr("-45.90")).toBe(-45.9)
        expect(lerValorBr("20,00-")).toBe(-20)
        expect(lerValorBr("abc")).toBeNull()
        expect(lerValorBr("")).toBeNull()
    })

    it("lerData lê os quatro formatos", () => {
        expect(lerData("05/01/2027")).toBe("2027-01-05")
        expect(lerData("2026-10-21")).toBe("2026-10-21")
        expect(lerData("12/10", 2026)).toBe("2026-10-12")
        expect(lerData("12 out", 2026)).toBe("2026-10-12")
        expect(lerData("31/02/2026")).toBeNull()
        expect(lerData("ontem")).toBeNull()
    })

    it("normalizarDescricao e palavraSignificativa", () => {
        expect(normalizarDescricao("  Padaria  Pão-Dourado!! ")).toBe("padaria pao dourado")
        expect(palavraSignificativa("12 de Óculos Visão")).toBe("oculos")
        expect(palavraSignificativa("12 34")).toBeNull()
    })
})

describe("lerCsv", () => {
    it("separa por ; e respeita aspas com ; dentro", () => {
        const linhas = lerCsv('data;descricao;valor\r\n01/10/2026;"Loja; Centro";"1.234,56"\r\n')
        expect(linhas).toEqual([
            ["data", "descricao", "valor"],
            ["01/10/2026", "Loja; Centro", "1.234,56"],
        ])
    })

    it("separa por , quando a primeira linha usa vírgula", () => {
        const linhas = lerCsv('date,title,amount\n2026-10-01,"Loja ""A""",12.50\n')
        expect(linhas[1]).toEqual(["2026-10-01", 'Loja "A"', "12.50"])
        expect(linhas[1]).toHaveLength(3)
    })
})

describe("mapearCsv", () => {
    const mapa = { data: 0, descricao: 1, valor: 2, categoria: 3 }

    it("pula o cabeçalho, conta a linha sem valor e lê o sinal", () => {
        const linhas = lerCsv(
            "data;descricao;valor;categoria\n" +
                "01/10/2026;Mercado Boa Vista;-45,90;Mercado\n" +
                "02/10/2026;Linha quebrada;;\n" +
                "03/10/2026;Salário;3.000,00;\n",
        )
        const { itens, ignoradas } = mapearCsv(linhas, mapa, { temCabecalho: true, negativoEhDespesa: true })
        expect(ignoradas).toBe(1)
        expect(itens).toEqual([
            {
                data: "2026-10-01",
                descricao: "Mercado Boa Vista",
                valor: 45.9,
                estorno: false,
                parcela: null,
                categoria: "Mercado",
            },
            { data: "2026-10-03", descricao: "Salário", valor: 3000, estorno: true, parcela: null },
        ])
    })

    it("sem negativoEhDespesa, positivo é despesa e negativo é estorno", () => {
        const { itens } = mapearCsv(
            [
                ["01/10/2026", "Loja", "10,00"],
                ["02/10/2026", "Devolução", "-4,00"],
            ],
            { data: 0, descricao: 1, valor: 2 },
            { temCabecalho: false, negativoEhDespesa: false },
        )
        expect(itens.map((i) => [i.valor, i.estorno])).toEqual([
            [10, false],
            [4, true],
        ])
    })
})

// OFX sintético — inventado para teste.
const transacao = (data: string, valor: string, memo: string) =>
    `<STMTTRN>\n<TRNTYPE>OTHER\n<DTPOSTED>${data}120000[-3:BRT]\n<TRNAMT>${valor}\n<FITID>${data}${valor}\n<MEMO>${memo}\n</STMTTRN>\n`
const ofx = (corpo: string) =>
    `OFXHEADER:100\nDATA:OFXSGML\n\n<OFX>\n<BANKTRANLIST>\n${corpo}</BANKTRANLIST>\n</OFX>\n`

describe("lerOfx", () => {
    it("cartão: compras, estorno e pagamento ignorado", () => {
        const texto = ofx(
            transacao("20261003", "-89.90", "AUTO PECAS RODA VIVA") +
                transacao("20261005", "-15.00", "PADARIA PAO DOURADO") +
                transacao("20261008", "500.00", "PAGAMENTO RECEBIDO") +
                transacao("20261010", "15.00", "ESTORNO PADARIA PAO DOURADO"),
        )
        const { itens, ignoradas } = lerOfx(texto, "cartao")
        expect(ignoradas).toBe(1)
        expect(itens).toEqual([
            { data: "2026-10-03", descricao: "AUTO PECAS RODA VIVA", valor: 89.9, estorno: false, parcela: null },
            { data: "2026-10-05", descricao: "PADARIA PAO DOURADO", valor: 15, estorno: false, parcela: null },
            { data: "2026-10-10", descricao: "ESTORNO PADARIA PAO DOURADO", valor: 15, estorno: true, parcela: null },
        ])
    })

    it("conta: negativo é despesa, positivo é receita", () => {
        const texto = ofx(
            transacao("20261001", "-120.00", "CONTA DE LUZ").replace("<MEMO>CONTA DE LUZ", "<NAME>CONTA DE LUZ") +
                transacao("20261002", "2500.00", "SALARIO EMPRESA FICTICIA"),
        )
        const { itens, ignoradas } = lerOfx(texto, "conta")
        expect(ignoradas).toBe(0)
        expect(itens.map((i) => [i.descricao, i.valor, i.estorno])).toEqual([
            ["CONTA DE LUZ", 120, false],
            ["SALARIO EMPRESA FICTICIA", 2500, true],
        ])
    })
})

describe("extrairItensDaFatura", () => {
    it("dd/mm: itens, estorno, pagamento fora e dezembro no ano anterior", () => {
        const leitura = extrairItensDaFatura(faturaDdMm, { fechamento: "2027-01-05" })
        expect(leitura.itens).toHaveLength(5)
        expect(leitura.itens[0]).toEqual({
            data: "2026-12-28",
            descricao: "MERCADO BOA VISTA",
            valor: 152.3,
            estorno: false,
            parcela: null,
        })
        expect(leitura.itens[2].data).toBe("2027-01-02")
        expect(leitura.itens[3]).toMatchObject({ descricao: "ESTORNO LIVRARIA CENTRAL", valor: 35, estorno: true })
        expect(leitura.itens.some((i) => /pagamento/i.test(i.descricao))).toBe(false)
        expect(leitura).toMatchObject({
            total: 384.95,
            vencimento: "2027-01-12",
            fechamento: "2027-01-05",
            completa: true,
            diferenca: 0,
        })
    })

    it("dd MMM: crédito pela descrição e pelo '-' no fim", () => {
        const leitura = extrairItensDaFatura(faturaDdMmm, { fechamento: "2026-10-20" })
        expect(leitura.itens).toHaveLength(6)
        expect(leitura.itens[0]).toMatchObject({ data: "2026-09-12", descricao: "CINEMA ESTRELA", valor: 64 })
        expect(leitura.itens[1].valor).toBe(1120)
        expect(leitura.itens[2]).toMatchObject({ valor: 15, estorno: true })
        expect(leitura.itens[4]).toMatchObject({ descricao: "SEGURO VIAGEM DEVOLVIDO", valor: 20, estorno: true })
        expect(leitura).toMatchObject({ total: 1287.4, vencimento: "2026-10-27", completa: true, diferenca: 0 })
    })

    it("parcelas k/n e 'parcela k de n'", () => {
        const leitura = extrairItensDaFatura(faturaParcelas, { fechamento: "2026-11-08" })
        expect(leitura.itens.map((i) => i.parcela)).toEqual([{ k: 3, n: 10 }, { k: 2, n: 6 }, null])
        expect(leitura.itens[1].data).toBe("2026-10-21")
        expect(leitura).toMatchObject({ total: 905, completa: true, diferenca: 0 })
    })

    it("um item a menos: incompleta, com a diferença igual ao que falta", () => {
        const texto = faturaDdMm.replace("30/12 FARMACIA SAO JUDAS 48,90\n", "")
        const leitura = extrairItensDaFatura(texto, { fechamento: "2027-01-05" })
        expect(leitura.itens).toHaveLength(4)
        expect(leitura.completa).toBe(false)
        expect(leitura.diferenca).toBe(48.9)
    })

    it("um estorno a menos também não fecha", () => {
        const texto = faturaDdMm.replace("03/01 ESTORNO LIVRARIA CENTRAL -35,00\n", "")
        const leitura = extrairItensDaFatura(texto, { fechamento: "2027-01-05" })
        expect(leitura.completa).toBe(false)
        expect(leitura.diferenca).toBe(-35)
    })

    it("sem linha de total: incompleta e total nulo", () => {
        const texto = faturaDdMm.replace("Total da fatura R$ 384,95\n", "")
        const leitura = extrairItensDaFatura(texto, { fechamento: "2027-01-05" })
        expect(leitura).toMatchObject({ completa: false, total: null, diferenca: null })
        expect(leitura.itens).toHaveLength(5)
    })

    it("pagamento da fatura escrito 'PAGTO' ou 'PAGAMENTO FATURA' fica fora", () => {
        const texto = `${faturaDdMm}04/01 PAGTO FATURA 1.234,56\n04/01 PAGAMENTO FATURA -1.234,56\n`
        const leitura = extrairItensDaFatura(texto, { fechamento: "2027-01-05" })
        expect(leitura.itens).toHaveLength(5)
        expect(leitura).toMatchObject({ completa: true, diferenca: 0 })
    })

    it("loja com 'PAGAMENTOS' no nome fica: só a palavra inteira é pagamento", () => {
        const texto = `${faturaDdMm}04/01 XYZ PAGAMENTOS LTDA 50,00\n`
        const leitura = extrairItensDaFatura(texto, { fechamento: "2027-01-05" })
        expect(leitura.itens).toHaveLength(6)
        expect(leitura.itens[5]).toMatchObject({ descricao: "XYZ PAGAMENTOS LTDA", valor: 50, estorno: false })
    })

    it("o total da fatura anterior não é o total", () => {
        const texto = `Total da fatura anterior R$ 999,00\n${faturaDdMm}`
        expect(extrairItensDaFatura(texto, { fechamento: "2027-01-05" }).total).toBe(384.95)
    })
})

describe("removerIdentificacao", () => {
    it("tira CPF, linhas de identificação e deixa os 4 finais do cartão", () => {
        const limpo = removerIdentificacao(faturaDdMm + "Cliente 987.654.321-00, CEP 01234-567\n")
        expect(limpo).not.toContain("123.456.789-00")
        expect(limpo).not.toContain("987.654.321-00")
        expect(limpo).not.toContain("01234-567")
        expect(limpo).not.toMatch(/Fulano/)
        expect(limpo).not.toContain("4111")
        expect(limpo).toContain("Cartão 1234")
        expect(limpo).toContain("28/12 MERCADO BOA VISTA 152,30")
        expect(limpo).toContain("Total da fatura R$ 384,95")
    })
})
