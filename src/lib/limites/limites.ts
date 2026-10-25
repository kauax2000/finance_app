/**
 * O limite mensal por pessoa (Bloco 7A). A conta é a do servidor
 * (`_shared/limite-pessoa.ts`, reexportada); a leitura e a escrita seguem a
 * RLS de `workspace_member_limits`: o adulto lê todos, o convidado só o dele,
 * e só o dono grava.
 */
import { paddedBoundsForYearMonth } from "@/lib/budget-month"
import { supabase } from "@/lib/supabase"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import type { Tables } from "@/types/database"

import { gastoDaPessoaNoMes, nivelDoLimite, type LancamentoDaPessoa } from "../../../supabase/functions/_shared/limite-pessoa"

export * from "../../../supabase/functions/_shared/limite-pessoa"

export type LimiteDaPessoa = Pick<Tables<"workspace_member_limits">, "user_id" | "amount">

const falha = (error: unknown) => new Error(formatSupabasePostgrestError(error) ?? "Não foi possível salvar o limite.")

/** Os limites que a pessoa pode ver na carteira. */
export async function lerLimites(workspaceId: string): Promise<LimiteDaPessoa[]> {
    const { data, error } = await supabase
        .from("workspace_member_limits")
        .select("user_id, amount")
        .eq("workspace_id", workspaceId)
    if (error) throw falha(error)
    return ((data ?? []) as LimiteDaPessoa[]).map((l) => ({ ...l, amount: Number(l.amount) }))
}

/** Cria ou troca o limite (só o dono). */
export async function gravarLimite(workspaceId: string, userId: string, amount: number): Promise<void> {
    const { error } = await supabase
        .from("workspace_member_limits")
        .upsert({ workspace_id: workspaceId, user_id: userId, amount }, { onConflict: "workspace_id,user_id" })
    if (error) throw falha(error)
}

/** Tira o limite (só o dono). */
export async function removerLimite(workspaceId: string, userId: string): Promise<void> {
    const { error } = await supabase
        .from("workspace_member_limits")
        .delete()
        .eq("workspace_id", workspaceId)
        .eq("user_id", userId)
    if (error) throw falha(error)
}

type TxDoMes = Omit<LancamentoDaPessoa, "card"> & { payment_credit_card_id: string | null }

/**
 * As despesas que podem contar no mês, com o fechamento do cartão: a margem de
 * um mês de cada lado, como a Edge (a compra no crédito conta pelo fechamento).
 */
export async function lerLancamentosDoMes(workspaceId: string, ym: string): Promise<LancamentoDaPessoa[]> {
    const { padStart, padEnd } = paddedBoundsForYearMonth(ym)
    const [tx, cards] = await Promise.all([
        supabase
            .from("transactions")
            .select("user_id,type,amount,date,payment_method,payment_credit_card_id")
            .eq("workspace_id", workspaceId)
            .eq("type", "expense")
            .gte("date", `${padStart}T00:00:00.000Z`)
            .lte("date", `${padEnd}T23:59:59.999Z`),
        supabase.from("credit_cards").select("id,closing_day").eq("workspace_id", workspaceId),
    ])
    if (tx.error) throw falha(tx.error)
    if (cards.error) throw falha(cards.error)
    const fecha = new Map(((cards.data ?? []) as { id: string; closing_day: number }[]).map((c) => [c.id, c.closing_day]))
    return ((tx.data ?? []) as TxDoMes[]).map(({ payment_credit_card_id, ...t }) => {
        const cd = payment_credit_card_id ? fecha.get(payment_credit_card_id) : undefined
        return { ...t, amount: Number(t.amount), card: cd == null ? null : { closing_day: cd } }
    })
}

export type LinhaDoLimite = {
    user_id: string
    nome: string
    /** Em reais; `null` sem limite. */
    limite: number | null
    gastoCentavos: number
    nivel: 0 | 80 | 100
}

/** Uma linha por pessoa da carteira: o gasto do mês dela contra o limite, se houver. */
export function linhasDosLimites(
    pessoas: Array<{ user_id: string; nome: string }>,
    limites: LimiteDaPessoa[],
    lancs: LancamentoDaPessoa[],
    ym: string,
): LinhaDoLimite[] {
    const porPessoa = new Map(limites.map((l) => [l.user_id, Number(l.amount)]))
    return pessoas.map(({ user_id, nome }) => {
        const limite = porPessoa.get(user_id) ?? null
        const gastoCentavos = gastoDaPessoaNoMes(lancs, user_id, ym)
        const nivel = limite == null ? 0 : nivelDoLimite(gastoCentavos, Math.round(limite * 100))
        return { user_id, nome, limite, gastoCentavos, nivel }
    })
}
