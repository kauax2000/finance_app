import { describe, expect, it, vi } from "vitest"

import { lerFonte, semComentarios } from "@/test/fonte"
import type { CartaoParaCasar, LinhaHistorico } from "@/lib/captura/frase"

vi.mock("@/lib/supabase", () => ({ supabase: {} }))

const { camposDaFrase, origemDaFrase, rascunhoDaFrase, resumoDaFrase } = await import("@/lib/captura/frase-no-form")
const { shouldPersistQuery } = await import("@/lib/queries/persist")
const { fraseHistoricoKeys } = await import("@/lib/queries/keys")
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

    it("estorno no cartão: a categoria vem do histórico de despesa", () => {
        const historico = [
            linha({ description: "Mercado", category_id: "cat-mercado", type: "expense" }),
            linha({ description: "Mercado", category_id: "cat-reemb", type: "income", date: "2026-04-05T12:00:00.000Z" }),
        ]
        const c = camposDaFrase("estorno 30 mercado nubank", HOJE, [nubank], historico)
        expect(c).toMatchObject({ estorno: true, creditCardId: "card-nu", categoryId: "cat-mercado" })
    })

    it("estorno sem cartão: dúvida no cartão e sem a forma do histórico", () => {
        const historico = [linha({ description: "Uber", category_id: "cat-reemb", type: "income" })]
        const c = camposDaFrase("estorno 30 uber", HOJE, [nubank], historico)
        expect(c).toMatchObject({ tipo: "income", estorno: true, paymentMethod: null, creditCardId: null })
        expect(c.duvidas).toContain("cartao")
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

describe("rascunhoDaFrase: nada de uma frase anterior sobra", () => {
    const aplicar = (frase: string) => rascunhoDaFrase(camposDaFrase(frase, HOJE, [nubank], []))

    it("A: Parcelada e depois simples — o total e o número voltam ao da frase nova", () => {
        expect(aplicar("42 mercado nubank em 3x")).toMatchObject({
            formKind: "installment",
            installmentTotal: "42,00",
            installmentCount: "3",
        })
        expect(aplicar("10 pix padaria")).toMatchObject({
            formKind: "expense",
            amount: "10,00",
            installmentTotal: "10,00",
            installmentCount: "12",
            paymentMethod: "pix",
            paymentCreditCardId: "",
        })
    })

    it("B: simples e depois Parcelada — o valor simples é o da frase nova", () => {
        expect(aplicar("10 pix padaria").amount).toBe("10,00")
        expect(aplicar("1200 geladeira nubank em 10x")).toMatchObject({
            formKind: "installment",
            amount: "1.200,00",
            installmentTotal: "1.200,00",
            installmentCount: "10",
            installmentValueMode: "total",
        })
    })

    it("C: Parcelada num formulário novo — trocar para Despesa mantém o valor", () => {
        const r = aplicar("300 tv nubank em 3x")
        expect(r.formKind).toBe("installment")
        expect(r.amount).toBe("300,00")
    })

    it("estorno: receita sem forma, com o cartão no estorno", () => {
        expect(aplicar("estorno de 50 no nubank")).toMatchObject({
            formKind: "income",
            paymentMethod: null,
            paymentCreditCardId: "",
            estornoCartaoId: "card-nu",
        })
    })
})

describe("origemDaFrase", () => {
    it("sem frase aplicada ou na edição, nada", () => {
        expect(origemDaFrase(null, false, "cat")).toEqual({})
        expect(origemDaFrase([], true, "cat")).toEqual({})
    })

    it("quick_text, a conferir com dúvida ou sem categoria", () => {
        expect(origemDaFrase([], false, "cat")).toEqual({ source: "quick_text", needsReview: false })
        expect(origemDaFrase(["data"], false, "cat")).toEqual({ source: "quick_text", needsReview: true })
        expect(origemDaFrase([], false, "")).toEqual({ source: "quick_text", needsReview: true })
    })
})

describe("cache do histórico da frase", () => {
    it("fica fora do IndexedDB", () => {
        const query = { queryKey: fraseHistoricoKeys.list("ws-1"), state: { status: "success" } }
        expect(shouldPersistQuery(query as never)).toBe(false)
    })

    it("o domínio de transações o invalida", () => {
        const fonte = semComentarios(lerFonte("src/lib/queries/invalidate-workspace-data.ts"), "tudo")
        expect(fonte).toContain("queryRoot.fraseHistorico, workspaceId")
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

    it("o histórico não trava o aplicar offline nem preenche outro formulário", () => {
        // As guardas do histórico moram no `historicoDaFraseEmCache`, que a
        // frase e a foto do recibo dividem.
        const lib = semComentarios(lerFonte("src/lib/captura/frase-no-form.ts"), "tudo")
        expect(lib).toContain("onlineManager.isOnline()")
        expect(lib).toContain('networkMode: "always"')
        expect(lib).toContain("retry: false")
        expect(lib).toContain("meta: { errorToast: false }")
        expect(lib).toContain("AbortSignal.timeout(")
        const fonte = semComentarios(lerFonte("src/components/wireframe/frase-rapida-wireframe.tsx"), "tudo")
        expect(fonte).toContain("historicoDaFraseEmCache(")
        expect(fonte).toMatch(/if \(meu !== pedido\.current\) return/)
    })

    it("o formulário mostra a frase só na criação e leva a origem no payload", () => {
        const campos = semComentarios(lerFonte("src/components/transactions/transaction-form-fields.tsx"), "tudo")
        expect(campos).toMatch(/segmentMode === "create"[\s\S]{0,80}<FraseRapidaWireframe/)
        const hook = semComentarios(lerFonte("src/components/transactions/transaction-form-use.tsx"), "tudo")
        expect(hook).toContain("origemDaFrase(duvidasDaFrase, Boolean(editingTransaction), categoryId, fonteDaFrase)")
    })

    it("o handleSubmit só impede o evento e chama o salvar, que a paleta usa direto", () => {
        const hook = semComentarios(lerFonte("src/components/transactions/transaction-form-use.tsx"), "tudo")
        expect(hook).toMatch(/const handleSubmit = async \(e: React\.FormEvent\) => \{\s*e\.preventDefault\(\)\s*await salvar\(\)\s*\}/)
        expect(hook).toMatch(/return \{\s*handleSubmit,\s*salvar,/)
    })

    // O manifest (POST multipart desde o 3B) é conferido em compartilhado.test.ts.
})

describe("regras da frase com categorias e o cartão de sempre", () => {
    const inter: CartaoParaCasar = { ...nubank, id: "card-inter", name: "Inter", last_four: "2222" }
    const categorias = [
        { id: "cat-mercado", name: "Mercado", type: "expense" as const },
        { id: "cat-transporte", name: "Transporte", type: "expense" as const },
    ]

    it("\"crédito\" sem nome usa o cartão que o formulário pré-escolhe, sem dúvida", () => {
        const c = camposDaFrase("30 uber crédito", HOJE, [nubank, inter], [], { categorias, cartaoAberto: "card-inter" })
        expect(c.paymentMethod).toBe("credit_card")
        expect(c.creditCardId).toBe("card-inter")
        expect(c.origemDoCartao).toBe("ultimo")
        expect(c.duvidas).toEqual([])
        expect(c.categoryId).toBe("cat-transporte")
        expect(c.motivoDaCategoria).toBe("comum")
    })

    it("sem pré-escolha, o cartão do último crédito do histórico", () => {
        const hist = [linha({ payment_method: "credit_card", payment_credit_card_id: "card-nu" })]
        const c = camposDaFrase("30 uber no cartão", HOJE, [nubank, inter], hist, { categorias })
        expect(c.creditCardId).toBe("card-nu")
    })

    it("sem cartão nenhum, o crédito fica a conferir", () => {
        const c = camposDaFrase("30 uber crédito", HOJE, [nubank, inter], [], { categorias })
        expect(c.creditCardId).toBeNull()
        expect(c.duvidas).toContain("cartao")
    })

    it("um nome de cartão que não casa não vira o cartão de sempre", () => {
        const c = camposDaFrase("30 uber crédito itau", HOJE, [nubank], [], { categorias, cartaoAberto: "card-nu" })
        expect(c.creditCardId).toBeNull()
        expect(c.duvidas).toContain("cartao")
    })

    it("parcelas sem forma dita são crédito no cartão de sempre", () => {
        const c = camposDaFrase("1200 tv em 10x", HOJE, [nubank], [], { categorias, cartaoAberto: "card-nu" })
        expect(c.paymentMethod).toBe("credit_card")
        expect(c.creditCardId).toBe("card-nu")
    })

    it("a forma dita vence o cartão de sempre", () => {
        const c = camposDaFrase("42 mercado pix", HOJE, [nubank], [], { categorias, cartaoAberto: "card-nu" })
        expect(c.paymentMethod).toBe("pix")
        expect(c.creditCardId).toBeNull()
        expect(c.categoryId).toBe("cat-mercado")
        expect(c.motivoDaCategoria).toBe("nome")
    })

    it("o resumo diz o que entendeu e de onde veio", () => {
        const c = camposDaFrase("42 mercado crédito ontem", HOJE, [nubank], [], { categorias, cartaoAberto: "card-nu" })
        expect(resumoDaFrase(c, HOJE, categorias, [nubank])).toEqual([
            "R$\u00a042,00",
            "Mercado",
            "categoria Mercado (pelo nome)",
            "Crédito · Nubank (último usado)",
            "09/04/2026",
        ])
    })
})

it("o resumo do parcelado mostra a parcela, e a parcela dita vira o total", () => {
    const c = camposDaFrase("Kimono parcela 100 4x", HOJE, [], [])
    expect(c.valor).toBe(400)
    expect(camposDaFrase("Kimono parcela 100 4x Kauã", HOJE, [], []).descricao).toBe("Kimono Kauã")
    expect(resumoDaFrase(c, HOJE, [], [])).toContain("em 4x de R$\u00a0100,00")
})
