import { describe, expect, it, vi } from "vitest"
import type { SupabaseClient } from "@supabase/supabase-js"
import { casarPagamentos, ligarPagamento, type Casamento } from "./casamento"

const conta = (id: string, nome: string, due: string, estimado: number | null, amount: number | null = null) => ({
    id,
    due_date: due,
    amount,
    bill: { name: nome, amount_estimated: estimado },
})
const tx = (id: string, desc: string, amount: number, date: string, type = "expense") => ({
    id,
    type,
    amount,
    date,
    description: desc,
})

describe("casarPagamentos", () => {
    const luz = conta("i1", "Conta de luz", "2026-10-10", 150)

    it("R$ 172 contra R$ 150 casa (14,7%) e R$ 200 não (33%)", () => {
        const r = casarPagamentos([luz], [tx("t1", "Pagamento conta de luz", 172, "2026-10-10")], new Set())
        expect(r).toHaveLength(1)
        expect(r[0]).toMatchObject({ instanciaId: "i1", transacaoId: "t1", contaNome: "Conta de luz", valor: 172, dataYmd: "2026-10-10" })
        expect(casarPagamentos([luz], [tx("t2", "Conta de luz", 200, "2026-10-10")], new Set())).toEqual([])
    })

    it("5 dias de diferença casa, 6 não", () => {
        expect(casarPagamentos([luz], [tx("t1", "Conta de luz", 150, "2026-10-15")], new Set())).toHaveLength(1)
        expect(casarPagamentos([luz], [tx("t1", "Conta de luz", 150, "2026-10-16")], new Set())).toEqual([])
        expect(casarPagamentos([luz], [tx("t1", "Conta de luz", 150, "2026-10-05")], new Set())).toHaveLength(1)
        expect(casarPagamentos([luz], [tx("t1", "Conta de luz", 150, "2026-10-04")], new Set())).toEqual([])
    })

    it("receita nunca casa", () => {
        expect(casarPagamentos([luz], [tx("t1", "Conta de luz", 150, "2026-10-10", "income")], new Set())).toEqual([])
    })

    it("lançamento já ligado não casa", () => {
        expect(casarPagamentos([luz], [tx("t1", "Conta de luz", 150, "2026-10-10")], new Set(["t1"]))).toEqual([])
    })

    it("descrição sem semelhança não casa", () => {
        expect(casarPagamentos([luz], [tx("t1", "Mercado", 150, "2026-10-10")], new Set())).toEqual([])
    })

    it("lançamento com duas contas parecidas vai à de maior semelhança", () => {
        const a = conta("a", "Internet fibra", "2026-10-10", 100)
        const b = conta("b", "Internet", "2026-10-10", 100)
        const r = casarPagamentos([a, b], [tx("t1", "Internet", 100, "2026-10-10")], new Set())
        expect(r).toHaveLength(1)
        expect(r[0].instanciaId).toBe("b")
    })

    it("duas transações para uma instância: só a melhor", () => {
        const r = casarPagamentos(
            [luz],
            [tx("t1", "Conta de luz", 160, "2026-10-10"), tx("t2", "Conta de luz", 151, "2026-10-10")],
            new Set(),
        )
        expect(r.map((c) => c.transacaoId)).toEqual(["t2"])
    })

    it("sem amount e sem amount_estimated não casa; amount vale mais que o estimado", () => {
        const sem = conta("i2", "Água", "2026-10-10", null)
        expect(casarPagamentos([sem], [tx("t1", "Água", 80, "2026-10-10")], new Set())).toEqual([])
        const fixo = conta("i3", "Água", "2026-10-10", 500, 80)
        expect(casarPagamentos([fixo], [tx("t1", "Água", 80, "2026-10-10")], new Set())).toHaveLength(1)
    })
})

describe("ligarPagamento", () => {
    const c: Casamento = {
        instanciaId: "i1", contaNome: "Luz", transacaoId: "t1", descricao: "Luz", valor: 150, dataYmd: "2026-10-10", semelhanca: 1,
    }
    const cliente = (error: { message: string } | null) => {
        const rpc = vi.fn().mockResolvedValue({ error })
        return { rpc, client: { rpc } as unknown as SupabaseClient }
    }

    it("chama a RPC com os três parâmetros", async () => {
        const { rpc, client } = cliente(null)
        expect(await ligarPagamento(client, c, "2026-11-10")).toEqual({ ok: true })
        expect(rpc).toHaveBeenCalledWith("ligar_pagamento_da_conta", {
            p_instance_id: "i1", p_transaction_id: "t1", p_next_due_date: "2026-11-10",
        })
    })

    it("mapeia os erros conhecidos", async () => {
        expect(await ligarPagamento(cliente({ message: "TRANSACTION_ALREADY_LINKED" }).client, c, null)).toEqual({
            ok: false, erro: "Esse lançamento já pagou outra conta.",
        })
        expect(await ligarPagamento(cliente({ message: "BILL_INSTANCE_NOT_PENDING" }).client, c, null)).toEqual({
            ok: false, erro: "Esta conta já foi paga ou pulada.",
        })
    })
})
