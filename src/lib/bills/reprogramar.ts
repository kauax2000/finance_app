import type { SupabaseClient } from "@supabase/supabase-js"
import type { Bill, BillInstance } from "@/lib/supabase"
import { primeiroVencimento, proximoVencimento } from "@/lib/bills/recurrence"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"

/**
 * Editar a agenda de uma conta reprograma a instância pendente (Bloco 6A,
 * decisão 3, com a regra do orquestrador na rodada de correção 1). O caminho
 * online (`updateBillRow`) e o replay offline (`syncBillMutation`) passam por
 * aqui.
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

/** Teto de ciclos ao pular datas que já existem (23505). */
const MAX_AVANCOS = 24

const dia = (s: string | null) => (s ? s.slice(0, 10) : null)

function mudouCiclo(a: AgendaDaConta, b: AgendaDaConta): boolean {
    return (
        a.frequency !== b.frequency ||
        a.due_day_of_month !== b.due_day_of_month ||
        dia(a.start_date) !== dia(b.start_date)
    )
}

/** Se a edição pode mexer na pendente: o ciclo, o fim ou a reativação. */
export function podeReprogramar(antes: AgendaDaConta, depois: AgendaDaConta): boolean {
    return (
        mudouCiclo(antes, depois) ||
        dia(antes.end_date) !== dia(depois.end_date) ||
        (!antes.is_active && depois.is_active)
    )
}

/**
 * A data nova segue o ciclo: a partir do último vencimento já fechado (pago ou
 * pulado), o primeiro `proximoVencimento` que não fica antes de hoje nem do
 * início. Sem nenhum fechado, o primeiro vencimento a partir daí.
 */
export function novaDataDaPendente(
    depois: AgendaDaConta,
    ultimoNaoPendenteYmd: string | null,
    hojeYmd: string
): string {
    const inicio = dia(depois.start_date) ?? hojeYmd
    const piso = inicio > hojeYmd ? inicio : hojeYmd
    const primeiro = primeiroVencimento(piso, depois.due_day_of_month)
    if (!ultimoNaoPendenteYmd) return primeiro
    let d = proximoVencimento(ultimoNaoPendenteYmd.slice(0, 10), depois.frequency, depois.due_day_of_month)
    // ponytail: o teto de 1200 passos (100 anos mensais) só protege de laço.
    for (let i = 0; d && d < piso && i < 1200; i++) {
        d = proximoVencimento(d, depois.frequency, depois.due_day_of_month)
    }
    return d && d >= piso ? d : primeiro
}

/**
 * - Só o fim mudou: a pendente futura que passa do fim é apagada; senão, fica.
 * - O dia, a frequência ou o início mudaram: a futura vai a `novaDataDaPendente`
 *   (passou do fim, é apagada).
 * - A vencida (`due_date < hoje`) nunca muda: é dívida de um ciclo que passou.
 * - Sem nenhuma pendente, reativar (ou mudar a agenda de) uma conta ativa, que
 *   não é única, cria a próxima dentro do fim.
 */
export function reprogramacao(opts: {
    antes: AgendaDaConta
    depois: AgendaDaConta
    pendentes: Pick<BillInstance, "id" | "due_date">[]
    ultimoNaoPendenteYmd: string | null
    hojeYmd: string
}): Reprogramacao {
    const { antes, depois, pendentes, ultimoNaoPendenteYmd, hojeYmd } = opts
    if (!podeReprogramar(antes, depois)) return { tipo: "nada" }

    const fim = dia(depois.end_date)
    const futura = pendentes
        .filter((p) => p.due_date.slice(0, 10) >= hojeYmd)
        .sort((a, b) => a.due_date.localeCompare(b.due_date))[0]

    if (futura) {
        const atual = futura.due_date.slice(0, 10)
        const nova = mudouCiclo(antes, depois) ? novaDataDaPendente(depois, ultimoNaoPendenteYmd, hojeYmd) : atual
        if (fim && nova > fim) return { tipo: "apagar", id: futura.id }
        return nova === atual ? { tipo: "nada" } : { tipo: "mover", id: futura.id, due_date: nova }
    }

    if (pendentes.length > 0 || !depois.is_active || depois.frequency === "one_time") return { tipo: "nada" }
    const nova = novaDataDaPendente(depois, ultimoNaoPendenteYmd, hojeYmd)
    return fim && nova > fim ? { tipo: "nada" } : { tipo: "criar", due_date: nova }
}

/** Lê as pendentes e o último fechado, decide e aplica. Devolve a mensagem de erro, ou `null`. */
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
    if (!podeReprogramar(antes, depois)) return null
    const falha = "A conta foi salva, mas o vencimento pendente não foi reprogramado."

    const instancias = () =>
        supabase.from("bill_instances").select("id, due_date").eq("bill_id", billId).eq("workspace_id", workspaceId)
    const { data: pendentes, error } = await instancias().eq("status", "pending")
    if (error) return formatSupabasePostgrestError(error) ?? falha
    const { data: fechadas, error: e2 } = await instancias()
        .in("status", ["paid", "skipped"])
        .order("due_date", { ascending: false })
        .limit(1)
    if (e2) return formatSupabasePostgrestError(e2) ?? falha

    const r = reprogramacao({
        antes,
        depois,
        pendentes: pendentes ?? [],
        ultimoNaoPendenteYmd: fechadas?.[0]?.due_date ?? null,
        hojeYmd,
    })
    if (r.tipo === "nada") return null

    const fim = dia(depois.end_date)
    const apagar = async (id: string) => {
        const { error: e } = await supabase
            .from("bill_instances")
            .delete()
            .eq("id", id)
            .eq("workspace_id", workspaceId)
            .eq("status", "pending")
        return e ? falha : null
    }
    if (r.tipo === "apagar") return apagar(r.id)
    if (r.tipo === "criar" && !userId) return falha

    // A data já existe em `(bill_id, due_date)`: avança um ciclo e tenta de novo.
    // O conflito nunca apaga a pendente; só o fim apaga.
    let due = r.due_date
    for (let i = 0; i <= MAX_AVANCOS; i++) {
        if (fim && due > fim) return r.tipo === "mover" ? apagar(r.id) : null
        const { error: e } =
            r.tipo === "mover"
                ? await supabase
                      .from("bill_instances")
                      .update({ due_date: due })
                      .eq("id", r.id)
                      .eq("workspace_id", workspaceId)
                      .eq("status", "pending")
                : await supabase.from("bill_instances").insert({
                      workspace_id: workspaceId,
                      user_id: userId,
                      bill_id: billId,
                      due_date: due,
                      status: "pending",
                      amount: null,
                  })
        if (!e) return null
        if (e.code !== "23505") return formatSupabasePostgrestError(e) ?? falha
        const proximo = proximoVencimento(due, depois.frequency, depois.due_day_of_month)
        if (!proximo) return falha
        due = proximo
    }
    return falha
}
