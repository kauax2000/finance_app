import { describe, expect, it, vi } from "vitest"
import type { CamposDaFrase } from "@/lib/captura/frase-no-form"
import { lerFonte, semComentarios } from "@/test/fonte"

vi.mock("@/lib/supabase", () => ({ supabase: {} }))

const { camposDaIA } = await import("@/lib/captura/frase-no-form")
const { comTravas, faltaParaLancar, planoDaFrase, precisaDeIA, rotuloDaAcao: rotulo, tipoDoLancamento } = await import(
    "@/lib/captura/lancamento-inteligente"
)

function campos(over: Partial<CamposDaFrase> = {}): CamposDaFrase {
    return {
        tipo: "expense",
        estorno: false,
        valor: 42,
        data: "2026-10-27",
        descricao: "Mercado",
        paymentMethod: null,
        creditCardId: null,
        categoryId: null,
        parcelas: null,
        duvidas: [],
        motivoDaCategoria: null,
        motivoDoTipo: null,
        origemDoCartao: null,
        ...over,
    }
}

describe("tipoDoLancamento", () => {
    it("parcelas, estorno, receita e despesa", () => {
        expect(tipoDoLancamento(campos({ parcelas: 10 }))).toBe("parcelada")
        expect(tipoDoLancamento(campos({ tipo: "income", estorno: true }))).toBe("estorno")
        expect(tipoDoLancamento(campos({ tipo: "income" }))).toBe("receita")
        expect(tipoDoLancamento(campos())).toBe("despesa")
    })

    it("uma parcela só é despesa, e receita não é parcelada", () => {
        expect(tipoDoLancamento(campos({ parcelas: 1 }))).toBe("despesa")
        expect(tipoDoLancamento(campos({ tipo: "income", parcelas: 3 }))).toBe("receita")
    })
})

describe("comTravas", () => {
    it("o campo editado vence e sai das dúvidas", () => {
        const c = comTravas(campos({ valor: 42, duvidas: ["valor", "data"] }), { valor: 50 })
        expect(c.valor).toBe(50)
        expect(c.duvidas).toEqual(["data"])
    })

    it("o cartão editado tira a dúvida do cartão", () => {
        const c = comTravas(campos({ duvidas: ["cartao"] }), { paymentMethod: "credit_card", creditCardId: "c1" })
        expect(c.duvidas).toEqual([])
        expect(c.creditCardId).toBe("c1")
    })

    it("sem edição, os campos da frase", () => {
        const base = campos({ duvidas: ["valor"] })
        expect(comTravas(base, {})).toEqual(base)
    })
})

describe("precisaDeIA", () => {
    it("valor ou descrição em dúvida", () => {
        expect(precisaDeIA(campos({ duvidas: ["valor"] }))).toBe(true)
        expect(precisaDeIA(campos({ duvidas: ["descricao"] }))).toBe(true)
        expect(precisaDeIA(campos({ duvidas: ["cartao"] }))).toBe(false)
    })
})

describe("faltaParaLancar", () => {
    it("sem valor falta o valor", () => {
        expect(faltaParaLancar(campos({ valor: null }), 0)).toBe("valor")
    })

    it("crédito sem cartão pede o cartão só quando há cartão ativo", () => {
        const c = campos({ paymentMethod: "credit_card", creditCardId: null, valor: 1 })
        expect(faltaParaLancar(c, 2)).toBe("forma")
        expect(faltaParaLancar(c, 0)).toBeNull()
    })

    it("completo, nada falta", () => {
        expect(faltaParaLancar(campos({ paymentMethod: "credit_card", creditCardId: "c1" }), 2)).toBeNull()
    })
})

describe("rotuloDaAcao", () => {
    // O `currencyBRL` escreve "R$" com espaço que não quebra.
    const rotuloDaAcao = (c: CamposDaFrase) => rotulo(c).replace(/\u00a0/g, " ")
    it("o verbo, o tipo e o valor", () => {
        expect(rotuloDaAcao(campos({ valor: 3000, parcelas: 10 }))).toBe("Lançar parcelada · 10× de R$ 300,00")
        expect(rotuloDaAcao(campos({ valor: 42 }))).toBe("Lançar despesa · R$ 42,00")
        expect(rotuloDaAcao(campos({ tipo: "income", valor: 42 }))).toBe("Lançar receita · R$ 42,00")
        expect(rotuloDaAcao(campos({ tipo: "income", estorno: true, valor: 25 }))).toBe("Lançar estorno · R$ 25,00")
        expect(rotuloDaAcao(campos({ valor: null }))).toBe("Lançar despesa")
    })
})

describe("planoDaFrase", () => {
    it("parcelada no crédito sem cartão não tem plano", () => {
        expect(planoDaFrase(campos({ valor: 3000, parcelas: 10, paymentMethod: "credit_card" }))).toBeNull()
        expect(planoDaFrase(campos({ valor: 3000, parcelas: 10 }))?.valorParcela).toBe(300)
    })
})

describe("motivoDoTipo na IA", () => {
    const ia = { valor: 10, tipo: null, descricao: "Pizza", data: null, forma: null, cartao: null, parcelas: null }
    it("fica o do texto quando o tipo é o do texto", () => {
        const c = camposDaIA({ ...ia }, "2026-10-27", [], [], "ganhei pizza")
        expect(c.tipo).toBe("income")
        expect(c.motivoDoTipo).not.toBeNull()
    })

    it("some quando a IA trocou o tipo", () => {
        const c = camposDaIA({ ...ia, tipo: "expense" }, "2026-10-27", [], [], "ganhei pizza")
        expect(c.tipo).toBe("expense")
        expect(c.motivoDoTipo).toBeNull()
    })
})

describe("useLeituraDoLancamento (fonte)", () => {
    const fonte = semComentarios(lerFonte("src/components/transactions/use-leitura-do-lancamento.ts"))

    it("a resposta da IA de um pedido velho é jogada fora", () => {
        expect(fonte).toMatch(/useRef\(0\)/)
        expect(fonte).toMatch(/meu !== pedido\.current/)
    })

    it("a IA tenta uma vez por frase: falhando, o Lançar salva a revisão", () => {
        expect(fonte).toMatch(/precisaDeIA\(campos\) && !iaTentada/)
        const setTexto = fonte.slice(fonte.indexOf("function setTexto("), fonte.indexOf("function editar("))
        expect(setTexto).toMatch(/setIaTentada\(false\)/)
        const lerComIA = fonte.slice(fonte.indexOf("async function lerComIA("))
        expect(lerComIA.indexOf("setIaTentada(true)")).toBeGreaterThan(-1)
        expect(lerComIA.indexOf("setIaTentada(true)")).toBeLessThan(lerComIA.indexOf("await lerFraseComIA"))
    })

    it("só aplica no formulário campos diferentes do último aplicado", () => {
        expect(fonte).toMatch(/chave === ultimoAplicado\.current\) return/)
        expect(fonte).toMatch(/ultimoAplicado\.current = chave/)
    })

    it("a foto só vai ao formulário depois de comprimida", () => {
        const comprime = fonte.indexOf("comprimirImagem(")
        const anexa = fonte.indexOf("setFotoDoRecibo(")
        expect(comprime).toBeGreaterThan(-1)
        expect(anexa).toBeGreaterThan(comprime)
    })
})
