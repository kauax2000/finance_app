import { describe, expect, it, vi } from "vitest"

import { lerFonte, semComentarios } from "@/test/fonte"
import type { CartaoParaCasar, LinhaHistorico } from "@/lib/captura/frase"

vi.mock("@/lib/supabase", () => ({ supabase: {} }))

const { camposDaFrase } = await import("@/lib/captura/frase-no-form")
const { buildTransactionRow } = await import("@/lib/transactions/mutations")
const { consumirParametroFrase } = await import("@/lib/transactions-list-search-params")

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

describe("camposDaFrase", () => {
    it("casa o cartão, preenche a categoria pelo histórico e não deixa dúvida", () => {
        const c = camposDaFrase("42 mercado nubank", HOJE, [nubank], [linha({})])
        expect(c).toMatchObject({
            tipo: "expense",
            estorno: false,
            valor: 42,
            data: HOJE,
            descricao: "Mercado",
            paymentMethod: "credit_card",
            creditCardId: "card-nu",
            categoryId: "cat-mercado",
            duvidas: [],
        })
    })

    it("cartão sem casamento volta ao fim da descrição, sem dúvida fora do crédito", () => {
        const c = camposDaFrase("30 uber casa", HOJE, [nubank], [])
        expect(c.descricao).toBe("Uber casa")
        expect(c.creditCardId).toBeNull()
        expect(c.duvidas).not.toContain("cartao")
        expect(c.categoryId).toBeNull()
    })

    it("no crédito, o cartão sem casamento é uma dúvida", () => {
        const c = camposDaFrase("30 uber no crédito inter", HOJE, [nubank], [])
        expect(c.paymentMethod).toBe("credit_card")
        expect(c.creditCardId).toBeNull()
        expect(c.duvidas).toContain("cartao")
    })

    it("a forma do parser vira o vocabulário do banco (débito → debit_card)", () => {
        expect(camposDaFrase("15 padaria no débito", HOJE, [], []).paymentMethod).toBe("debit_card")
    })

    it("sem forma na frase, a forma e o cartão vêm do histórico, se o cartão segue ativo", () => {
        const historico = [
            linha({ payment_method: "credit_card", payment_credit_card_id: "card-nu" }),
        ]
        const c = camposDaFrase("42 mercado", HOJE, [nubank], historico)
        expect(c).toMatchObject({ paymentMethod: "credit_card", creditCardId: "card-nu" })
        const inativo = camposDaFrase("42 mercado", HOJE, [{ ...nubank, is_active: false }], historico)
        expect(inativo.creditCardId).toBeNull()
    })

    it("estorno no cartão: receita com o cartão casado", () => {
        const c = camposDaFrase("estorno de 50 no nubank", HOJE, [nubank], [])
        expect(c).toMatchObject({ tipo: "income", estorno: true, creditCardId: "card-nu" })
    })

    it("parcelas passam ao formulário", () => {
        const c = camposDaFrase("1200 geladeira nubank em 10x", HOJE, [nubank], [])
        expect(c.parcelas).toBe(10)
        expect(c.valor).toBe(1200)
    })

    it("sem valor, a dúvida é o valor", () => {
        expect(camposDaFrase("mercado nubank", HOJE, [nubank], []).duvidas).toContain("valor")
    })
})

describe("buildTransactionRow", () => {
    const ctx = { userId: "u1", workspaceId: "ws-1" }
    const payload = {
        editingId: null,
        categoryId: null,
        type: "expense" as const,
        amount: 42,
        description: "Mercado",
        dateIso: "2026-04-10T12:00:00.000Z",
        isRecurring: false,
        recurringInterval: null,
        paymentMethod: null,
        paymentCreditCardId: null,
    }

    it("editar e salvar tira a marca (needs_review: false)", () => {
        expect(buildTransactionRow(ctx, { ...payload, editingId: "tx-1" })).toMatchObject({ needs_review: false })
        expect(buildTransactionRow({ ...ctx, editingTransactionId: "tx-1" }, payload)).toMatchObject({
            needs_review: false,
        })
    })

    it("a criação pela frase grava source e needs_review", () => {
        expect(buildTransactionRow(ctx, { ...payload, source: "quick_text", needsReview: true })).toMatchObject({
            source: "quick_text",
            needs_review: true,
        })
    })

    it("a criação comum deixa os padrões do banco", () => {
        const row = buildTransactionRow(ctx, payload)
        expect(row).not.toHaveProperty("source")
        expect(row).not.toHaveProperty("needs_review")
    })
})

describe("consumirParametroFrase", () => {
    it("junta frase, título e url, nessa ordem", () => {
        expect(consumirParametroFrase(new URLSearchParams("frase=42%20mercado&frase_url=x"))).toBe("42 mercado x")
        expect(
            consumirParametroFrase(new URLSearchParams("frase_url=u&frase_titulo=t&frase=f")),
        ).toBe("f t u")
    })

    it("vazio é null, e o texto para em 500 caracteres", () => {
        expect(consumirParametroFrase(new URLSearchParams("frase=%20&new=1"))).toBeNull()
        expect(consumirParametroFrase(null)).toBeNull()
        expect(consumirParametroFrase(new URLSearchParams(`frase=${"a".repeat(600)}`))?.length).toBe(500)
    })
})

describe("fonte", () => {
    it("o Enter no campo da frase não envia o formulário (Foco 5)", () => {
        const fonte = semComentarios(lerFonte("src/components/wireframe/frase-rapida-wireframe.tsx"), "tudo")
        expect(fonte).toMatch(/e\.key === "Enter"[\s\S]{0,120}e\.preventDefault\(\)/)
        expect(fonte).not.toContain('type="submit"')
        expect(fonte).toMatch(/<button\s+type="button"/)
    })

    it("o formulário mostra a frase só na criação e leva a origem no payload", () => {
        const campos = semComentarios(lerFonte("src/components/transactions/transaction-form-fields.tsx"), "tudo")
        expect(campos).toMatch(/segmentMode === "create"[\s\S]{0,80}<FraseRapidaWireframe/)
        const hook = semComentarios(lerFonte("src/components/transactions/transaction-form-use.tsx"), "tudo")
        expect(hook).toContain('source: "quick_text"')
    })

    it("o manifest compartilha por GET e tem os atalhos", () => {
        const fonte = lerFonte("src/app/manifest.ts")
        expect(fonte).toContain("share_target")
        expect(fonte).toContain('method: "GET"')
        expect(fonte).toContain('params: { text: "frase", title: "frase_titulo", url: "frase_url" }')
        expect(fonte).toContain("/transactions?conferir=1")
        expect(fonte).toContain('"Nova despesa"')
    })
})
