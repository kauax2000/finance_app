import type { SupabaseClient } from "@supabase/supabase-js"
import type { Bill, BillInstance } from "@/lib/supabase"
import { primeiroVencimento } from "@/lib/bills/recurrence"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"

/**
 * Editar a agenda de uma conta reprograma a instância pendente (Bloco 6A,
 * decisão 3). O caminho online (`updateBillRow`) e o replay offline
 * (`syncBillMutation`) passam por aqui.
 */

export type AgendaDaConta = Pick<
    Bill,
    "frequency" | "due_day_of_month" | "start_date" | "end_date" | "is_active"
>

export const CAMPOS_DA_AGENDA = "frequency, due_day_of_month, start_date, end_date, is_active"

export type Reprogramacao =
    | { tipo: "nada" }
    | { tipo: "mover"; id: string; due_date: string }
    | { tipo: "apagar"; id: string }
    | { tipo: "criar"; due_date: string }

const dia = (s: string | null) => (s ? s.slice(0, 10) : null)

function mudouAgenda(a: AgendaDaConta, b: AgendaDaConta): boolean {
    return (
        a.frequency !== b.frequency ||
        a.due_day_of_month !== b.due_day_of_month ||
        dia(a.start_date) !== dia(b.start_date) ||
        dia(a.end_date) !== dia(b.end_date)
    )
}

/**
 * A pendente que ainda não venceu (`due_date >= hoje`) vai ao primeiro
 * vencimento a partir de hoje (ou do início, se for depois); passou do fim, é
 * apagada. A vencida não muda: é dívida de um ciclo que já passou. Reativar
 * (ou mudar a agenda de) uma conta sem nenhuma pendente cria a próxima.
 */
export function reprogramacao(opts: {
    antes: AgendaDaConta
    depois: AgendaDaConta
    pendentes: Pick<BillInstance, "id" | "due_date">[]
    hojeYmd: string
}): Reprogramacao {
    const { antes, depois, pendentes, hojeYmd } = opts
    const reativou = !antes.is_active && depois.is_active
    if (!mudouAgenda(antes, depois) && !reativou) return { tipo: "nada" }

    const inicio = dia(depois.start_date) ?? hojeYmd
    const nova = primeiroVencimento(inicio > hojeYmd ? inicio : hojeYmd, depois.due_day_of_month)
    const fim = dia(depois.end_date)
    const passouDoFim = fim != null && nova > fim

    const futura = pendentes
        .filter((p) => p.due_date.slice(0, 10) >= hojeYmd)
        .sort((a, b) => a.due_date.localeCompare(b.due_date))[0]
    if (futura) {
        if (passouDoFim) return { tipo: "apagar", id: futura.id }
        if (futura.due_date.slice(0, 10) === nova) return { tipo: "nada" }
        return { tipo: "mover", id: futura.id, due_date: nova }
    }

    const criar =
        pendentes.length === 0 && depois.is_active && depois.frequency !== "one_time" && !passouDoFim
    return criar ? { tipo: "criar", due_date: nova } : { tipo: "nada" }
}

/** Lê as pendentes, decide e aplica. Devolve a mensagem de erro, ou `null`. */
export async function reprogramarPendenteDaConta(
    supabase: SupabaseClient,
    opts: {
        workspaceId: string
        billId: string
        userId: string | null
        antes: AgendaDaConta
        depois: AgendaDaConta
        hojeYmd: string
    }
): Promise<string | null> {
    const { workspaceId, billId, userId, antes, depois, hojeYmd } = opts
    const falha = "A conta foi salva, mas o vencimento pendente não foi reprogramado."

    const { data: pendentes, error } = await supabase
        .from("bill_instances")
        .select("id, due_date")
        .eq("bill_id", billId)
        .eq("workspace_id", workspaceId)
        .eq("status", "pending")
    if (error) return formatSupabasePostgrestError(error) ?? falha

    const r = reprogramacao({ antes, depois, pendentes: pendentes ?? [], hojeYmd })
    if (r.tipo === "nada") return null

    const apagar = async (id: string) =>
        supabase.from("bill_instances").delete().eq("id", id).eq("workspace_id", workspaceId).eq("status", "pending")

    if (r.tipo === "mover") {
        const { error: e } = await supabase
            .from("bill_instances")
            .update({ due_date: r.due_date })
            .eq("id", r.id)
            .eq("workspace_id", workspaceId)
            .eq("status", "pending")
        // Já existe instância nessa data (paga ou pulada): a pendente seria duplicada.
        if (e?.code === "23505") return (await apagar(r.id)).error ? falha : null
        return e ? (formatSupabasePostgrestError(e) ?? falha) : null
    }

    if (r.tipo === "apagar") return (await apagar(r.id)).error ? falha : null

    if (!userId) return falha
    const { error: e } = await supabase.from("bill_instances").insert({
        workspace_id: workspaceId,
        user_id: userId,
        bill_id: billId,
        due_date: r.due_date,
        status: "pending",
        amount: null,
    })
    return e && e.code !== "23505" ? (formatSupabasePostgrestError(e) ?? falha) : null
}
