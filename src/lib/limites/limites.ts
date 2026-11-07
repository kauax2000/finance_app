/**
 * O limite mensal por pessoa (Bloco 7A). A conta é a do servidor
 * (`_shared/limite-pessoa.ts`, reexportada); a leitura e a escrita seguem a
 * RLS de `workspace_member_limits`: o adulto lê todos, o convidado só o dele,
 * e só o dono grava.
 */
import { periodBoundsFromYearMonth, shiftYearMonth } from "@/lib/budget-month"
import { parseMoneyBrl, roundCents } from "@/lib/money-brl"
import { fetchAllRows } from "@/lib/queries/fetch-all-rows"
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
 * As despesas que podem contar no mês: as do próprio mês e as do mês anterior,
 * porque a compra no crédito depois do fechamento entra na fatura seguinte. Quem
 * decide o que conta é o `gastoDaPessoaNoMes`, a mesma conta da Edge. Paginado:
 * o PostgREST corta em 1000 linhas sem erro.
 */
export async function lerLancamentosDoMes(workspaceId: string, ym: string): Promise<LancamentoDaPessoa[]> {
    const de = periodBoundsFromYearMonth(shiftYearMonth(ym, -1)).period_start
    const ate = periodBoundsFromYearMonth(ym).period_end
    const [tx, cards] = await Promise.all([
        fetchAllRows<TxDoMes>((from, to) =>
            supabase
                .from("transactions")
                .select("id,user_id,type,amount,date,payment_method,payment_credit_card_id")
                .eq("workspace_id", workspaceId)
                .eq("type", "expense")
                .gte("date", `${de}T00:00:00.000Z`)
                .lte("date", `${ate}T23:59:59.999Z`)
                .order("id")
                .range(from, to),
        ),
        supabase.from("credit_cards").select("id,closing_day").eq("workspace_id", workspaceId),
    ])
    if (cards.error) throw falha(cards.error)
    const fecha = new Map(((cards.data ?? []) as { id: string; closing_day: number }[]).map((c) => [c.id, c.closing_day]))
    return tx.map(({ payment_credit_card_id, ...t }) => {
        const cd = payment_credit_card_id ? fecha.get(payment_credit_card_id) : undefined
        return { ...t, amount: Number(t.amount), card: cd == null ? null : { closing_day: cd } }
    })
}

/** O teto de `numeric(12,2)`. */
export const LIMITE_MAXIMO = 9_999_999_999.99

/** O limite digitado em reais ("1.234,56"), ou `null` fora de (0, teto]. */
export function lerLimiteDigitado(raw: string): number | null {
    const n = parseMoneyBrl(raw)
    if (n == null) return null
    const c = roundCents(n)
    return c > 0 && c <= LIMITE_MAXIMO ? c : null
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

/** Onde a pessoa está no limite: porcentagem inteira e o resto ou o excesso, tudo em centavos. */
export function situacaoDoLimite(
    gastoCentavos: number,
    limiteReais: number,
): { pct: number; tipo: "sobra" | "passou"; valorCentavos: number } {
    const limite = Math.round(limiteReais * 100)
    const pct = Math.round((gastoCentavos / limite) * 100)
    return gastoCentavos > limite
        ? { pct, tipo: "passou", valorCentavos: gastoCentavos - limite }
        : { pct, tipo: "sobra", valorCentavos: limite - gastoCentavos }
}

/** O primeiro passo de "Adicionar limite": com uma pessoa só sem limite, não há o que escolher. */
export function passoInicial(semLimite: number): 1 | 2 {
    return semLimite === 1 ? 2 : 1
}
