/**
 * O limite mensal por pessoa (Bloco 7A). A conta é a do servidor
 * (`_shared/limite-pessoa.ts`, reexportada); a leitura e a escrita seguem a
 * RLS de `workspace_member_limits`: o adulto lê todos, o convidado só o dele,
 * e só o dono grava.
 */
import { supabase } from "@/lib/supabase"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import type { Tables } from "@/types/database"

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
