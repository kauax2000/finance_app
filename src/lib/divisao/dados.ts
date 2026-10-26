/**
 * A divisão (Bloco 7C) lida e escrita com tolerância (Ruling 8 do 7B): o dev
 * roda contra o banco de produção, que ainda não tem `transaction_shares`,
 * `settlements`, `workspace_split_weights`, `definir_partes` nem
 * `saldos_da_carteira`. Sem eles, tudo aqui devolve `{ disponivel: false }`
 * pelos mesmos leitores dos projetos. As telas só tocam a divisão por aqui.
 */
import { rpcTolerante, tabelaTolerante } from "@/lib/projetos/dados"
import { supabase, type Settlement, type TransactionShare, type WorkspaceSplitWeight } from "@/lib/supabase"

export type Adulto = { user_id: string; nome: string }

export type SaldoDaPessoa = {
    user_id: string
    pago: number
    partes: number
    acertos: number
    saldo: number
    saiu: boolean
}

export type PartesDaDespesa = { partes: TransactionShare[]; manual: boolean; pagou: string | null }

/** Os adultos da carteira (dono e membro), com o nome do diretório. O convidado não entra. */
export async function lerAdultos(workspaceId: string): Promise<Adulto[]> {
    const [membros, diretorio] = await Promise.all([
        supabase.from("workspace_members").select("user_id, role").eq("workspace_id", workspaceId).in("role", ["owner", "member"]),
        supabase.rpc("workspace_member_directory", { p_workspace_id: workspaceId }),
    ])
    if (membros.error) throw new Error(membros.error.message)
    const nomes = new Map(
        ((diretorio.data ?? []) as { user_id: string; email: string; full_name: string | null }[]).map((d) => [
            d.user_id,
            d.full_name || d.email,
        ]),
    )
    return (membros.data ?? []).map((m) => ({ user_id: m.user_id as string, nome: nomes.get(m.user_id as string) || "Alguém" }))
}

/**
 * As partes de uma despesa, sempre de `transaction_shares`, com a marca de
 * "à mão" e quem pagou relidas da própria linha (o `*` não cita coluna nova).
 */
export async function lerPartes(transactionId: string) {
    const linha = await tabelaTolerante<Record<string, unknown> | null>(
        supabase.from("transactions").select("*").eq("id", transactionId).maybeSingle(),
    )
    const partes = await tabelaTolerante<TransactionShare[]>(
        supabase.from("transaction_shares").select("*").eq("transaction_id", transactionId),
    )
    if (!linha.disponivel || !partes.disponivel || !linha.dados || !("shares_manual" in linha.dados)) {
        return { disponivel: false } as const
    }
    const dados: PartesDaDespesa = {
        partes: partes.dados,
        manual: linha.dados.shares_manual === true,
        pagou: (linha.dados.paid_by as string | null) ?? null,
    }
    return { disponivel: true, dados } as const
}

/** As partes à mão (`amount` em reais) ou `null` para voltar ao automático. */
export function definirPartes(transactionId: string, partes: { user_id: string; amount: number }[] | null) {
    return rpcTolerante<null>("definir_partes", { p_transaction_id: transactionId, p_partes: partes })
}

export function lerPesos(workspaceId: string) {
    return tabelaTolerante<WorkspaceSplitWeight[]>(supabase.from("workspace_split_weights").select("*").eq("workspace_id", workspaceId))
}

/** Grava só os pesos que mudaram. */
export function gravarPesos(workspaceId: string, pesos: { user_id: string; weight: number }[]) {
    return tabelaTolerante<null>(
        supabase
            .from("workspace_split_weights")
            .upsert(pesos.map((p) => ({ workspace_id: workspaceId, ...p })), { onConflict: "workspace_id,user_id" }),
    )
}

/** O modo da carteira: um update simples (a política do dono deixa). */
export function gravarModo(workspaceId: string, modo: "pooled" | "split") {
    return tabelaTolerante<{ id: string }[]>(supabase.from("workspaces").update({ split_mode: modo }).eq("id", workspaceId).select("id"))
}

export function lerSaldos(workspaceId: string) {
    return rpcTolerante<SaldoDaPessoa[]>("saldos_da_carteira", { p_workspace_id: workspaceId })
}

export function listarAcertos(workspaceId: string) {
    return tabelaTolerante<Settlement[]>(
        supabase
            .from("settlements")
            .select("*")
            .eq("workspace_id", workspaceId)
            .order("settled_on", { ascending: false })
            .order("created_at", { ascending: false }),
    )
}

export function criarAcerto(acerto: Pick<Settlement, "workspace_id" | "from_user" | "to_user" | "amount" | "settled_on" | "note">) {
    return tabelaTolerante<null>(supabase.from("settlements").insert(acerto))
}

/** Só quem criou apaga (a RLS); zero linhas volta vazio. */
export function apagarAcerto(id: string) {
    return tabelaTolerante<{ id: string }[]>(supabase.from("settlements").delete().eq("id", id).select("id"))
}
