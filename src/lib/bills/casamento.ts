import type { SupabaseClient } from "@supabase/supabase-js"
import { SEMELHANCA_MINIMA, similaridade } from "@/lib/fatura/conferir"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { daysBetweenYmd } from "@/lib/transaction-date"

/** Spec §11: valor dentro de ±15% e data dentro de ±5 dias do vencimento. */
const TOLERANCIA_VALOR = 0.15
const JANELA_DIAS = 5

export type Casamento = {
    instanciaId: string
    contaNome: string
    transacaoId: string
    descricao: string
    valor: number
    dataYmd: string
    semelhanca: number
}

type PendenteParaCasar = {
    id: string
    due_date: string
    bill: { name: string; amount_estimated: number | null }
    amount: number | null
}

type TransacaoParaCasar = {
    id: string
    type: string
    amount: number
    date: string
    description: string | null
}

/**
 * Despesas recentes que parecem o pagamento de uma conta pendente. Cada
 * lançamento vai à instância de maior semelhança (desempate: menor diferença de
 * valor) e cada instância recebe um lançamento só. Lançamento já ligado fica de fora.
 */
export function casarPagamentos(
    pendentes: PendenteParaCasar[],
    transacoes: TransacaoParaCasar[],
    jaLigadas: Set<string>,
): Casamento[] {
    const candidatos: Array<{ c: Casamento; difValor: number }> = []
    for (const t of transacoes) {
        if (t.type !== "expense" || jaLigadas.has(t.id)) continue
        for (const p of pendentes) {
            const esperado = p.amount ?? p.bill.amount_estimated
            if (esperado == null || esperado <= 0) continue
            const difValor = Math.abs(Number(t.amount) - Number(esperado))
            if (difValor > Number(esperado) * TOLERANCIA_VALOR + 1e-9) continue
            const dias = daysBetweenYmd(p.due_date, t.date)
            if (dias == null || Math.abs(dias) > JANELA_DIAS) continue
            const semelhanca = similaridade(p.bill.name, t.description ?? "")
            if (semelhanca < SEMELHANCA_MINIMA) continue
            candidatos.push({
                c: {
                    instanciaId: p.id,
                    contaNome: p.bill.name,
                    transacaoId: t.id,
                    descricao: t.description ?? "",
                    valor: Number(t.amount),
                    dataYmd: t.date.slice(0, 10),
                    semelhanca,
                },
                difValor,
            })
        }
    }
    candidatos.sort((a, b) => b.c.semelhanca - a.c.semelhanca || a.difValor - b.difValor)
    const instUsadas = new Set<string>()
    const txUsadas = new Set<string>()
    const pares: Casamento[] = []
    for (const { c } of candidatos) {
        if (instUsadas.has(c.instanciaId) || txUsadas.has(c.transacaoId)) continue
        instUsadas.add(c.instanciaId)
        txUsadas.add(c.transacaoId)
        pares.push(c)
    }
    return pares
}

/** Um toque: marca a instância paga com o valor e a data do lançamento e liga os dois, sem lançamento novo. */
export async function ligarPagamento(
    supabase: SupabaseClient,
    c: Casamento,
    proximoVencimento: string | null,
): Promise<{ ok: boolean; erro?: string }> {
    const { error } = await supabase.rpc("ligar_pagamento_da_conta", {
        p_instance_id: c.instanciaId,
        p_transaction_id: c.transacaoId,
        p_next_due_date: proximoVencimento,
    })
    if (!error) return { ok: true }
    const msg = String(error.message ?? "")
    if (msg.includes("TRANSACTION_ALREADY_LINKED")) return { ok: false, erro: "Esse lançamento já pagou outra conta." }
    if (msg.includes("BILL_INSTANCE_NOT_PENDING")) return { ok: false, erro: "Esta conta já foi paga ou pulada." }
    return { ok: false, erro: formatSupabasePostgrestError(error) ?? "Não foi possível ligar o pagamento." }
}

const chaveIgnorado = (c: Pick<Casamento, "instanciaId" | "transacaoId">) =>
    `casamento:ignorado:${c.instanciaId}:${c.transacaoId}`

/** O "Não" mora neste aparelho; sem `localStorage` (modo privado, bloqueio) a pergunta só volta. */
export function ignorarCasamento(c: Pick<Casamento, "instanciaId" | "transacaoId">): void {
    try {
        localStorage.setItem(chaveIgnorado(c), "1")
    } catch {}
}

export function casamentoIgnorado(c: Pick<Casamento, "instanciaId" | "transacaoId">): boolean {
    try {
        return localStorage.getItem(chaveIgnorado(c)) === "1"
    } catch {
        return false
    }
}
