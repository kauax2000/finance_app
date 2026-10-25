/**
 * As ações de um toque da caixa de insights (Bloco 6B). As `virar_*` marcam o
 * insight `acted` dentro da própria RPC (a falha desfaz a marca junto); as que
 * usam uma mutação que já existe marcam só depois do sucesso dela.
 */
import { computeFirstDueYmd, computeNextBillInstanceDueYmd } from "@/lib/bills/recurrence"
import { currencyBRL } from "@/lib/formatters"
import { fluxoDoMes } from "@/lib/previsao/fluxo"
import type { DadosDaPrevisao, Seguro } from "@/lib/previsao/tipos"
import { updateSubscription } from "@/lib/subscriptions/mutations"
import { supabase } from "@/lib/supabase"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { localYmdFromDate } from "@/lib/transaction-date"
import { deleteTransactionById } from "@/lib/transactions/mutations"
import { dispatchFinanceTransactionsMutated } from "@/lib/workspace-data-events"

export type Insight = {
    id: string
    workspace_id: string
    kind: string
    payload: Record<string, unknown>
    status: string
    created_at: string
}

/** `erro: null` = a pessoa desistiu (nada a mostrar). */
export type Resultado = { ok: true } | { ok: false; erro: string | null }

/** O que a pessoa confere no diálogo da recorrência. */
export type AjustesDaRecorrencia = {
    nome: string
    valor: number
    dia: number
    categoryId: string | null
    valorVariavel: boolean
}

const texto = (v: unknown) => (typeof v === "string" && v ? v : null)
const ids = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [])

function falha(error: unknown, reserva: string): Resultado {
    return { ok: false, erro: formatSupabasePostgrestError(error) ?? reserva }
}

export async function marcarInsight(id: string, status: "seen" | "dismissed" | "acted"): Promise<string | null> {
    const { error } = await supabase.rpc("marcar_insight", { p_id: id, p_status: status })
    return error ? (formatSupabasePostgrestError(error) ?? "Não foi possível atualizar o insight.") : null
}

/** Os lançamentos que a recorrência achou: a data e o valor, para o diálogo e a próxima conta. */
export async function lancamentosDaRecorrencia(
    insight: Insight,
): Promise<{ ok: true; lancamentos: Array<{ date: string; amount: number }> } | { ok: false; erro: string }> {
    const lista = ids(insight.payload.lancamentos)
    if (lista.length === 0) return { ok: true, lancamentos: [] }
    const { data, error } = await supabase.from("transactions").select("date,amount").in("id", lista)
    if (error) return { ok: false, erro: formatSupabasePostgrestError(error) ?? "Não foi possível ler os lançamentos." }
    return { ok: true, lancamentos: (data as Array<{ date: string; amount: number }> | null) ?? [] }
}

/** Mais de 5% entre o menor e o maior valor: a conta nasce com valor variável sugerido. */
export function sugerirValorVariavel(valores: number[]): boolean {
    if (valores.length < 2) return false
    const min = Math.min(...valores)
    return Math.max(...valores) > min * 1.05
}

/**
 * A pendente que nasce com a conta: o ciclo depois do último lançamento (a data UTC, a mesma da
 * instância paga que a RPC grava), pela recorrência do 6A; sem lançamento, o primeiro a partir de hoje.
 */
export function proximoVencimentoDaRecorrencia(datas: string[], dia: number, hojeYmd: string): string | null {
    const ultimo = datas.map((d) => d.slice(0, 10)).sort().at(-1)
    if (!ultimo) return computeFirstDueYmd({ startYmd: hojeYmd, dueDayOfMonth: dia })
    return computeNextBillInstanceDueYmd(
        { frequency: "monthly", due_day_of_month: dia, end_date: null, is_active: true },
        ultimo,
    )
}

export async function virarAssinatura(insight: Insight, a: AjustesDaRecorrencia): Promise<Resultado> {
    const { error } = await supabase.rpc("virar_assinatura", {
        p_insight_id: insight.id,
        p_nome: a.nome.trim(),
        p_valor: a.valor,
        p_dia: a.dia,
        p_payment_method: texto(insight.payload.payment_method),
        p_card_id: texto(insight.payload.card_id),
        p_category_id: a.categoryId,
    })
    if (error) return falha(error, "Não foi possível criar a assinatura.")
    dispatchFinanceTransactionsMutated()
    return { ok: true }
}

export async function virarConta(insight: Insight, a: AjustesDaRecorrencia): Promise<Resultado> {
    const lidos = await lancamentosDaRecorrencia(insight)
    if (!lidos.ok) return { ok: false, erro: lidos.erro }
    const { error } = await supabase.rpc("virar_conta", {
        p_insight_id: insight.id,
        p_nome: a.nome.trim(),
        p_dia: a.dia,
        p_valor_variavel: a.valorVariavel,
        p_category_id: a.categoryId,
        p_next_due_date: proximoVencimentoDaRecorrencia(
            lidos.lancamentos.map((l) => l.date),
            a.dia,
            localYmdFromDate(new Date()),
        ),
    })
    if (error) return falha(error, "Não foi possível criar a conta a pagar.")
    dispatchFinanceTransactionsMutated()
    return { ok: true }
}

// ponytail: a mutação já valeu quando o `marcar` falha; o insight volta na
// próxima leitura e repetir a ação é inofensivo (mesmo valor, id já apagado).
async function marcarDepois(insight: Insight): Promise<Resultado> {
    await marcarInsight(insight.id, "acted")
    return { ok: true }
}

export async function atualizarPrecoDaAssinatura(insight: Insight): Promise<Resultado> {
    const subscriptionId = texto(insight.payload.assinaturaId)
    const para = Number(insight.payload.para)
    if (!subscriptionId || !(para > 0)) return { ok: false, erro: "Este insight não aceita essa ação." }
    const r = await updateSubscription({ workspaceId: insight.workspace_id, subscriptionId, payload: { amount: para } })
    if (!r.ok) return { ok: false, erro: r.errorMessage }
    return marcarDepois(insight)
}

/** Dos dois lançamentos iguais, apaga o de id maior (o outro fica). */
export async function apagarUm(
    insight: Insight,
    confirmar: (mensagem: string) => boolean = (m) => window.confirm(m),
): Promise<Resultado> {
    const alvo = ids(insight.payload.ids).sort().at(-1)
    if (!alvo) return { ok: false, erro: "Este insight não aceita essa ação." }
    const descricao = texto(insight.payload.descricao) ?? "o lançamento"
    if (!confirmar(`Apagar um dos dois lançamentos de ${descricao}? O outro fica.`)) return { ok: false, erro: null }
    const r = await deleteTransactionById(alvo, insight.workspace_id)
    if (!r.ok) return { ok: false, erro: r.errorMessage }
    return marcarDepois(insight)
}

/** O seguro baixo (spec §11): abaixo de 10% da renda do mês, e só com renda. */
export function seguroEstaBaixo(s: Pick<Seguro, "seguro" | "receitas">): boolean {
    const renda = s.receitas.recebidas + s.receitas.previstas
    return renda > 0 && s.seguro < 0.1 * renda
}

/** A linha do relatório do mês: o seguro (sobra menos a reserva) daquele mês, calculado na hora. */
export function linhaDoSeguroDoMes(dados: DadosDaPrevisao, ym: string): string {
    const centavos = Math.round(fluxoDoMes(dados, ym).sobra * 100) - Math.round((dados.reserva ?? 0) * 100)
    return centavos >= 0 ? "Seguro para gastar: cumprido" : `Seguro para gastar: passou ${currencyBRL(-centavos / 100)}`
}
