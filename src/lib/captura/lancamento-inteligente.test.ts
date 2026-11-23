import { describe, expect, it, vi } from "vitest"
import type { CamposDaFrase } from "@/lib/captura/frase-no-form"
import { lerFonte, semComentarios } from "@/test/fonte"

vi.mock("@/lib/supabase", () => ({ supabase: {} }))

const { camposDaIA } = await import("@/lib/captura/frase-no-form")
const {
    campoEditado,
    chaveDaCategoriaPelaIA,
    comCategoriaDaIA,
    comTravas,
    edicaoDoTipo,
    faltaParaLancar,
    planoDaFrase,
    precisaDeIA,
    rotuloDaAcao: rotulo,
    soDespesa,
    tipoDoLancamento,
} = await import("@/lib/captura/lancamento-inteligente")

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

describe("campoEditado", () => {
    it("cada linha olha as chaves que a edição dela grava", () => {
        expect(campoEditado("valor", { valor: 10 })).toBe(true)
        expect(campoEditado("forma", { creditCardId: "c1", paymentMethod: "credit_card" })).toBe(true)
        expect(campoEditado("categoria", { categoryId: null })).toBe(true)
        expect(campoEditado("tipo", { estorno: true })).toBe(true)
        expect(campoEditado("data", { valor: 10 })).toBe(false)
        expect(campoEditado("descricao", {})).toBe(false)
    })
})

describe("edicaoDoTipo", () => {
    const categorias = [
        { id: "mercado", type: "expense" as const },
        { id: "salario", type: "income" as const },
    ]

    it("receita e estorno viram income, e a categoria de despesa sai", () => {
        expect(edicaoDoTipo(campos({ categoryId: "mercado" }), "receita", categorias)).toEqual({
            tipo: "income",
            estorno: false,
            parcelas: null,
            categoryId: null,
        })
        expect(edicaoDoTipo(campos(), "estorno", categorias)).toEqual({
            tipo: "income",
            estorno: true,
            parcelas: null,
            paymentMethod: "credit_card",
        })
    })

    it("parcelada mantém as parcelas lidas ou cai no padrão", () => {
        expect(edicaoDoTipo(campos({ parcelas: 10 }), "parcelada", categorias).parcelas).toBe(10)
        expect(edicaoDoTipo(campos(), "parcelada", categorias).parcelas).toBe(12)
        expect(edicaoDoTipo(campos(), "parcelada", categorias, 5).parcelas).toBe(5)
    })

    it("despesa tira as parcelas e mantém a categoria de despesa", () => {
        expect(edicaoDoTipo(campos({ parcelas: 10, categoryId: "mercado" }), "despesa", categorias)).toEqual({
            tipo: "expense",
            estorno: false,
            parcelas: null,
        })
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

describe("soDespesa", () => {
    const categorias = [
        { id: "salario", type: "income" as const },
        { id: "mercado", type: "expense" as const },
    ]

    it("a receita e o estorno do convidado viram despesa, sem a categoria de receita", () => {
        expect(soDespesa(campos({ tipo: "income", categoryId: "salario", motivoDoTipo: "salário" }), categorias)).toMatchObject({
            tipo: "expense",
            estorno: false,
            categoryId: null,
            motivoDoTipo: null,
        })
        expect(soDespesa(campos({ tipo: "income", estorno: true, categoryId: "mercado" }), categorias)).toMatchObject({
            tipo: "expense",
            estorno: false,
            categoryId: "mercado",
        })
    })

    it("a despesa passa intacta", () => {
        const c = campos({ categoryId: "mercado" })
        expect(soDespesa(c, categorias)).toBe(c)
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

    it("estorno sem cartão pede o cartão só quando há cartão ativo", () => {
        const c = campos({ tipo: "income", estorno: true, paymentMethod: null, creditCardId: null })
        expect(faltaParaLancar(c, 1)).toBe("forma")
        expect(faltaParaLancar(c, 0)).toBeNull()
        expect(faltaParaLancar({ ...c, creditCardId: "c1" }, 1)).toBeNull()
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

    it("a IA tenta uma vez por frase, no Enter; o Aprovar só salva", () => {
        const interpretar = fonte.slice(fonte.indexOf("function interpretar("), fonte.indexOf("function reiniciar("))
        // A frase nova esquece a tentativa; a mesma frase lançada de novo não chama a IA outra vez.
        expect(interpretar).toMatch(/if \(nova\) \{[\s\S]*setIaTentada\(false\)/)
        expect(interpretar).toContain("(!nova && iaTentada)")
        expect(interpretar).toMatch(/precisaDeIA\([\s\S]*lerComIA\(frase\)/)
        const lerComIA = fonte.slice(fonte.indexOf("async function lerComIA("))
        expect(lerComIA.indexOf("setIaTentada(true)")).toBeGreaterThan(-1)
        expect(lerComIA.indexOf("setIaTentada(true)")).toBeLessThan(lerComIA.indexOf("await lerFraseComIA"))
        const aprovar = fonte.slice(fonte.indexOf("async function aprovar("), fonte.indexOf("const pedidoDaFoto"))
        expect(aprovar).not.toContain("lerComIA")
        expect(aprovar).toContain("await form.salvar()")
    })

    it("até o Enter nada se lê: a revisão parte da frase lançada, não da escrita", () => {
        expect(fonte).toContain("camposDaFrase(fraseLida,")
        expect(fonte).not.toContain("camposDaFrase(texto,")
    })

    it("só aplica no formulário campos diferentes do último aplicado", () => {
        expect(fonte).toMatch(/chave === ultimoAplicado\.current\) return/)
        expect(fonte).toMatch(/ultimoAplicado\.current = chave/)
    })

    it("a foto só vai ao formulário depois de comprimida", () => {
        const comprime = fonte.indexOf("comprimirImagem(")
        const anexa = fonte.indexOf("setFotoDoRecibo(", comprime)
        expect(comprime).toBeGreaterThan(-1)
        expect(anexa).toBeGreaterThan(comprime)
    })
})

describe("a categoria pela IA", () => {
    const categorias = [
        { id: "carro", name: "Carro", type: "expense" as const },
        { id: "salario", name: "Salário", type: "income" as const },
    ]

    it("só pergunta sem categoria, com descrição de verdade e sem a pessoa ter escolhido", () => {
        expect(chaveDaCategoriaPelaIA(campos(), {})).not.toBeNull()
        expect(chaveDaCategoriaPelaIA(campos({ categoryId: "carro" }), {})).toBeNull()
        expect(chaveDaCategoriaPelaIA(campos({ duvidas: ["descricao"] }), {})).toBeNull()
        // "Sem categoria" escolhido à mão também é escolha.
        expect(chaveDaCategoriaPelaIA(campos(), { categoryId: null })).toBeNull()
    })

    it("uma pergunta por descrição e tipo", () => {
        expect(chaveDaCategoriaPelaIA(campos({ valor: 10 }), {})).toBe(chaveDaCategoriaPelaIA(campos({ valor: 99 }), {}))
        expect(chaveDaCategoriaPelaIA(campos({ tipo: "income" }), {})).not.toBe(chaveDaCategoriaPelaIA(campos(), {}))
        expect(chaveDaCategoriaPelaIA(campos({ descricao: "Posto" }), {})).not.toBe(chaveDaCategoriaPelaIA(campos(), {}))
    })

    it("a sugestão vira a categoria, a conferir", () => {
        const chave = chaveDaCategoriaPelaIA(campos(), {})!
        const c = comCategoriaDaIA(campos(), { [chave]: " carro " }, {}, categorias)
        expect(c.categoryId).toBe("carro")
        expect(c.motivoDaCategoria).toBe("ia")
        expect(c.duvidas).toEqual(["ia"])
        // A dúvida "ia" não se repete quando a frase já foi lida pela IA.
        expect(comCategoriaDaIA(campos({ duvidas: ["ia"] }), { [chave]: "Carro" }, {}, categorias).duvidas).toEqual(["ia"])
    })

    it("resposta velha, nome fora da carteira, tipo errado ou categoria escolhida: nada muda", () => {
        const chave = chaveDaCategoriaPelaIA(campos(), {})!
        const base = campos()
        expect(comCategoriaDaIA(base, {}, {}, categorias)).toBe(base)
        expect(comCategoriaDaIA(campos({ descricao: "Posto" }), { [chave]: "Carro" }, {}, categorias).categoryId).toBeNull()
        expect(comCategoriaDaIA(base, { [chave]: "Viagem" }, {}, categorias)).toBe(base)
        expect(comCategoriaDaIA(base, { [chave]: "Salário" }, {}, categorias)).toBe(base)
        const escolhida = campos({ categoryId: null })
        expect(comCategoriaDaIA(escolhida, { [chave]: "Carro" }, { categoryId: null }, categorias)).toBe(escolhida)
    })

    it("o estorno no cartão escolhe entre as de despesa", () => {
        const estorno = campos({ tipo: "income", estorno: true, creditCardId: "nubank" })
        const chave = chaveDaCategoriaPelaIA(estorno, {})!
        expect(comCategoriaDaIA(estorno, { [chave]: "Carro" }, {}, categorias).categoryId).toBe("carro")
    })

    it("o hook pergunta à IA pela regra pura e aplica pela mesma", () => {
        const fonte = semComentarios(lerFonte("src/components/transactions/use-leitura-do-lancamento.ts"))
        expect(fonte).toContain("categorizarComIA(")
        expect(fonte).toContain("chaveDaCategoriaPelaIA(")
        expect(fonte).toContain("comCategoriaDaIA(")
    })
})
