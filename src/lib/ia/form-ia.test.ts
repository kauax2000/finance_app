import { describe, expect, it, vi } from "vitest"

import { lerFonte, semComentarios } from "@/test/fonte"
import type { CartaoParaCasar, LinhaHistorico } from "@/lib/captura/frase"
import type { CamposIA } from "@/lib/ia/ler"

vi.mock("@/lib/supabase", () => ({ supabase: {} }))

const { avisoDaIA, camposDaIA, origemDaFrase, textoDasDuvidas } = await import("@/lib/captura/frase-no-form")

const HOJE = "2026-04-10"

const nubank: CartaoParaCasar = {
    id: "card-nu",
    name: "Nubank",
    wallet_alias: null,
    last_four: "1111",
    workspace_id: "ws-1",
    is_active: true,
}

const linha = (l: Partial<LinhaHistorico>): LinhaHistorico => ({
    description: "Mercado",
    category_id: "cat-mercado",
    payment_method: "pix",
    payment_credit_card_id: null,
    date: "2026-04-01T12:00:00.000Z",
    type: "expense",
    ...l,
})

const ia = (c: Partial<CamposIA>): CamposIA => ({
    valor: 42,
    data: "2026-04-08",
    descricao: "Mercado",
    tipo: "expense",
    parcelas: null,
    forma: null,
    cartao: null,
    ...c,
})

describe("camposDaIA", () => {
    it("sempre acrescenta a dúvida ia, e o histórico preenche a categoria", () => {
        const c = camposDaIA(ia({}), HOJE, [nubank], [linha({})])
        expect(c).toMatchObject({
            tipo: "expense",
            valor: 42,
            data: "2026-04-08",
            descricao: "Mercado",
            categoryId: "cat-mercado",
            paymentMethod: "pix",
            duvidas: ["ia"],
        })
    })

    it("casa o cartão quando a forma é nula ou crédito", () => {
        for (const forma of [null, "credit_card"] as const) {
            const c = camposDaIA(ia({ forma, cartao: "nubank" }), HOJE, [nubank], [])
            expect(c.creditCardId).toBe("card-nu")
            expect(c.paymentMethod).toBe("credit_card")
            expect(c.duvidas).toEqual(["ia"])
        }
    })

    it("pix, débito ou dinheiro não têm cartão, mesmo com o nome dele", () => {
        const c = camposDaIA(ia({ forma: "pix", cartao: "nubank" }), HOJE, [nubank], [])
        expect(c.creditCardId).toBeNull()
        expect(c.paymentMethod).toBe("pix")
        expect(c.descricao).toBe("Mercado")
    })

    it("o nome de cartão sem casar volta à descrição; no crédito, fica a conferir", () => {
        const nulo = camposDaIA(ia({ cartao: "itau" }), HOJE, [nubank], [])
        expect(nulo.descricao).toBe("Mercado itau")
        expect(nulo.creditCardId).toBeNull()
        const credito = camposDaIA(ia({ forma: "credit_card", cartao: "itau" }), HOJE, [nubank], [])
        expect(credito.duvidas).toEqual(["cartao", "ia"])
    })

    it("tipo nulo é despesa, data nula é hoje, valor nulo e descrição nula ficam a conferir", () => {
        const c = camposDaIA(ia({ tipo: null, data: null, valor: null, descricao: null }), HOJE, [], [linha({})])
        expect(c.tipo).toBe("expense")
        expect(c.data).toBe(HOJE)
        expect(c.valor).toBeNull()
        expect(c.duvidas).toEqual(expect.arrayContaining(["valor", "descricao", "ia"]))
        // Sem descrição de verdade, o histórico não casa.
        expect(c.categoryId).toBeNull()
    })

    it("parcelas vão adiante como na frase", () => {
        expect(camposDaIA(ia({ parcelas: 3 }), HOJE, [], []).parcelas).toBe(3)
    })
})

describe("o aviso e a origem do que veio da IA", () => {
    it("a dúvida ia não aparece como 'Confira: ia'", () => {
        expect(textoDasDuvidas({ duvidas: ["ia"], categoryId: "cat" })).toBeNull()
        expect(avisoDaIA({ duvidas: ["ia"], categoryId: "cat" })).toBe("Lido pela IA. Confira e salve.")
        expect(avisoDaIA({ duvidas: ["valor", "ia"], categoryId: null })).toBe("Lido pela IA. Confira: valor, categoria")
    })

    it("origemDaFrase marca a conferir com a dúvida ia", () => {
        expect(origemDaFrase(["ia"], false, "cat")).toEqual({ source: "quick_text", needsReview: true })
    })

    it("a foto leva a origem share; a frase segue quick_text", () => {
        expect(origemDaFrase(["ia"], false, "cat", "share")).toEqual({ source: "share", needsReview: true })
        expect(origemDaFrase([], false, "cat")).toEqual({ source: "quick_text", needsReview: false })
        expect(origemDaFrase(["ia"], true, "cat", "share")).toEqual({})
    })
})

describe("fonte do formulário com IA", () => {
    const foto = semComentarios(lerFonte("src/components/wireframe/foto-recibo-wireframe.tsx"), "tudo")
    const frase = semComentarios(lerFonte("src/components/wireframe/frase-rapida-wireframe.tsx"), "tudo")
    const form = semComentarios(lerFonte("src/components/transactions/transaction-form-use.tsx"), "tudo")
    const campos = semComentarios(lerFonte("src/components/transactions/transaction-form-fields.tsx"), "tudo")

    it("nenhum type=submit nos wireframes da IA", () => {
        expect(foto).not.toContain('type="submit"')
        expect(frase).not.toContain('type="submit"')
    })

    it("a foto abre a câmera de trás e passa pela compressão e pela IA", () => {
        expect(foto).toContain('accept="image/*"')
        expect(foto).toContain('capture="environment"')
        expect(foto).toMatch(/comprimirImagem\([\s\S]*lerImagemComIA\([\s\S]*camposDaIA\(/)
        expect(foto).toContain("fotoInicial")
    })

    it("a frase chama a IA e aplica camposDaIA", () => {
        expect(frase).toContain("Tentar com IA")
        expect(frase).toMatch(/lerFraseComIA\([\s\S]*camposDaIA\(/)
    })

    it("a foto só aparece na criação", () => {
        expect(campos).toMatch(/segmentMode === "create"[^?]*\?\s*\(\s*<FotoReciboWireframe/)
    })

    it("enviarAnexo só depois do salvar, com o id devolvido", () => {
        const salvar = form.indexOf("await onSave(")
        const anexar = form.indexOf("enviarAnexo(")
        expect(salvar).toBeGreaterThan(-1)
        expect(anexar).toBeGreaterThan(salvar)
        expect(form).toContain("transactionId: id")
        expect(form).toContain("Sem conexão: a foto não foi anexada.")
    })
})
