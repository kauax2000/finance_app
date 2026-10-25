import { describe, expect, it, vi } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { MOTIVO, podeSerPrivado, privadaPresa, privadoDoSalvar, METODOS_PRIVADOS } from "./pode-ser-privado"

vi.mock("@/lib/supabase", () => ({ supabase: {} }))
const { buildTransactionRow } = await import("@/lib/transactions/mutations")

const EU = "u-eu"
const OUTRA = "u-outra"
const cartaoDaCasa = { holder_user_id: null }
const meuCartao = { holder_user_id: EU }
const cartaoDela = { holder_user_id: OUTRA }

describe("podeSerPrivado (a regra do guardar_privado, para a tela explicar antes)", () => {
    it.each(["pix", "debit_card", "cash"] as const)("vale: %s do adulto", (metodo) => {
        expect(podeSerPrivado({ papel: "member", metodo, cartao: null, autorId: EU })).toEqual({ pode: true })
        expect(podeSerPrivado({ papel: "owner", metodo, cartao: null, autorId: EU })).toEqual({ pode: true })
    })

    it("vale: o cartão cujo titular é o autor", () => {
        expect(podeSerPrivado({ papel: "member", metodo: "credit_card", cartao: meuCartao, autorId: EU })).toEqual({ pode: true })
    })

    it("o cartão da casa (titular nulo) não vale", () => {
        expect(podeSerPrivado({ papel: "owner", metodo: "credit_card", cartao: cartaoDaCasa, autorId: EU })).toEqual({
            pode: false,
            motivo: "No cartão da casa o titular vê a fatura no banco.",
        })
    })

    it("o cartão de outro titular não vale", () => {
        expect(podeSerPrivado({ papel: "owner", metodo: "credit_card", cartao: cartaoDela, autorId: EU })).toEqual({
            pode: false,
            motivo: "Só o titular do cartão pode marcar como privado.",
        })
    })

    it("o convidado não marca", () => {
        expect(podeSerPrivado({ papel: "guest", metodo: "pix", cartao: null, autorId: EU })).toEqual({
            pode: false,
            motivo: "Quem é convidado não marca gasto privado.",
        })
    })

    it("assinatura, parcela e conta não", () => {
        expect(podeSerPrivado({ papel: "member", metodo: "pix", cartao: null, autorId: EU, vinculado: true })).toEqual({
            pode: false,
            motivo: "Assinatura, parcela e conta não podem ser privadas.",
        })
    })

    it.each(["ted", "other", null] as const)("o método %s não vale", (metodo) => {
        expect(podeSerPrivado({ papel: "member", metodo, cartao: null, autorId: EU })).toEqual({
            pode: false,
            motivo: MOTIVO.metodo,
        })
    })

    it("paridade com o gatilho: os mesmos métodos, o titular igual ao autor, adulto, sem vínculo", () => {
        const sql = semComentarios(lerFonte("supabase/migrations/20261030120000_privado.sql")).replace(/--.*$/gm, "")
        const m = sql.match(/new\.payment_method in \(([^)]*)\)/)
        expect(m).not.toBeNull()
        const doGatilho = m![1].split(",").map((s) => s.trim().replace(/'/g, ""))
        expect([...METODOS_PRIVADOS].sort()).toEqual(doGatilho.sort())
        expect(sql).toMatch(/c\.holder_user_id = new\.user_id/)
        expect(sql).toMatch(/wm\.role in \('owner', 'member'\)/)
        expect(sql).toMatch(/new\.subscription_id is null\s+and new\.installment_plan_id is null/)
        // Só despesa: a tela mostra a chave só com `type === "expense"`.
        expect(sql).toMatch(/v_pode := new\.type = 'expense'/)
    })

    it("o erro do banco vira frase em português", () => {
        expect(formatSupabasePostgrestError({ message: "PRIVADO_NAO_PERMITIDO" })).toBe(MOTIVO.banco)
        expect(formatSupabasePostgrestError({ message: "PRIVADO_SEM_DETALHE" })).toBe(
            "Não foi possível guardar o gasto privado. Tente de novo.",
        )
        expect(formatSupabasePostgrestError({ message: "TITULAR_SO_DONO" })).toBe(
            "Só quem é dono da carteira escolhe o titular do cartão.",
        )
    })
})

describe("o salvar do lançamento e o is_private", () => {
    const ctx = { userId: "u1", workspaceId: "ws-1" }
    const payload = {
        editingId: "tx-1",
        categoryId: "cat-1",
        type: "expense" as const,
        amount: 42,
        description: "Farmácia",
        dateIso: "2026-04-10T12:00:00.000Z",
        isRecurring: false,
        recurringInterval: null,
        paymentMethod: "pix" as const,
        paymentCreditCardId: null,
    }

    it("sem a chave à vista, a coluna não vai (uma linha lida sem ela não é desmarcada)", () => {
        expect(buildTransactionRow(ctx, payload)).not.toHaveProperty("is_private")
    })

    it("marcar e desmarcar mandam a descrição e a categoria reais junto: o gatilho guarda e devolve", () => {
        expect(buildTransactionRow(ctx, { ...payload, isPrivate: true })).toMatchObject({
            is_private: true,
            description: "Farmácia",
            category_id: "cat-1",
        })
        expect(buildTransactionRow(ctx, { ...payload, isPrivate: false })).toMatchObject({ is_private: false })
    })
})

describe("privadoDoSalvar (Ruling 8): a coluna só vai quando muda algo", () => {
    const sim = { pode: true } as const
    const nao = { pode: false, motivo: MOTIVO.cartaoDaCasa } as const

    it("criar sem marcar não manda is_private: o insert roda num banco sem a 7B", () => {
        expect(privadoDoSalvar({ marcado: false, regra: sim, eraPrivada: false })).toBeUndefined()
        expect(privadoDoSalvar({ marcado: false, regra: null, eraPrivada: false })).toBeUndefined()
        expect(privadoDoSalvar({ marcado: true, regra: nao, eraPrivada: false })).toBeUndefined()
    })

    it("marcar manda true", () => {
        expect(privadoDoSalvar({ marcado: true, regra: sim, eraPrivada: false })).toBe(true)
    })

    it("desmarcar uma privada manda false; a que não vale mais nunca desmarca sozinha (Ruling 10)", () => {
        expect(privadoDoSalvar({ marcado: false, regra: sim, eraPrivada: true })).toBe(false)
        // Sem a coluna, o banco recusa (PRIVADO_NAO_PERMITIDO) em vez de revelar.
        expect(privadoDoSalvar({ marcado: true, regra: nao, eraPrivada: true })).toBeUndefined()
        // "Deixar de ser privado" desmarca: aí, sim, vai false.
        expect(privadoDoSalvar({ marcado: false, regra: nao, eraPrivada: true })).toBe(false)
    })

    it("a privada mantida segue true; sem a regra (o papel a caminho) a coluna não vai", () => {
        expect(privadoDoSalvar({ marcado: true, regra: sim, eraPrivada: true })).toBe(true)
        expect(privadoDoSalvar({ marcado: true, regra: null, eraPrivada: true })).toBeUndefined()
    })
})

describe("a privada que não vale mais segura o salvar (Ruling 10)", () => {
    const base = { papel: "member" as const, autorId: EU }
    const casos = [
        {
            nome: "o titular saiu do cartão",
            regra: podeSerPrivado({ ...base, metodo: "credit_card", cartao: cartaoDaCasa }),
            motivo: MOTIVO.cartaoDaCasa,
        },
        {
            nome: "o cartão foi apagado (a privada ficou sem cartão)",
            regra: podeSerPrivado({ ...base, metodo: "credit_card", cartao: null }),
            motivo: MOTIVO.semCartao,
        },
        {
            nome: "virou receita",
            regra: podeSerPrivado({ ...base, metodo: null, cartao: null, receita: true }),
            motivo: MOTIVO.receita,
        },
        {
            nome: "o método mudou para um que não vale",
            regra: podeSerPrivado({ ...base, metodo: "ted", cartao: null }),
            motivo: MOTIVO.metodo,
        },
    ]

    it.each(casos)("$nome: mostra o motivo, segura o salvar e não manda false", ({ regra, motivo }) => {
        expect(regra).toEqual({ pode: false, motivo })
        expect(privadaPresa({ marcado: true, regra, eraPrivada: true })).toBe(motivo)
        expect(privadoDoSalvar({ marcado: true, regra, eraPrivada: true })).toBeUndefined()
    })

    it.each(casos)("$nome: \"Deixar de ser privado\" solta o salvar e desmarca", ({ regra }) => {
        expect(privadaPresa({ marcado: false, regra, eraPrivada: true })).toBeNull()
        expect(privadoDoSalvar({ marcado: false, regra, eraPrivada: true })).toBe(false)
    })

    it("corrigir o método solta o salvar e a privada segue privada", () => {
        const regra = podeSerPrivado({ ...base, metodo: "pix", cartao: null })
        expect(privadaPresa({ marcado: true, regra, eraPrivada: true })).toBeNull()
        expect(privadoDoSalvar({ marcado: true, regra, eraPrivada: true })).toBe(true)
        const meu = podeSerPrivado({ ...base, metodo: "credit_card", cartao: meuCartao })
        expect(privadaPresa({ marcado: true, regra: meu, eraPrivada: true })).toBeNull()
    })

    it("fora da edição de uma privada nada segura", () => {
        const nao = podeSerPrivado({ ...base, metodo: "ted", cartao: null })
        expect(privadaPresa({ marcado: true, regra: nao, eraPrivada: false })).toBeNull()
        expect(privadaPresa({ marcado: true, regra: null, eraPrivada: true })).toBeNull()
    })

    it("o formulário segura o salvar pela regra, e a receita da privada não desmarca por conta própria", () => {
        const fonte = semComentarios(lerFonte("src/components/transactions/transaction-form-use.tsx"))
        expect(fonte).toMatch(/const submitDisabled =\s+saving \|\|\s+motivoDaPresa != null \|\|/)
        expect(fonte).toMatch(/if \(motivoDaPresa\) \{\s+toastError\(motivoDaPresa/)
        expect(fonte).toMatch(/\(type === "expense" \|\| eraPrivada\) &&/)
        expect(fonte).toMatch(/receita: type === "income"/)
    })
})
