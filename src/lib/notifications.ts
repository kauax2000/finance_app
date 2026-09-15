"use client"

import { supabase } from "@/lib/supabase"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"

export type AppNotificationType =
    | "transaction"
    | "budget"
    | "system"
    | "promotion"
    | "credit_card"
    | "bill"

export type AppNotification = {
    id: string
    user_id: string
    workspace_id: string
    type: AppNotificationType
    title: string
    body: string
    metadata: Record<string, unknown>
    read_at: string | null
    created_at: string
}

/** O `message` do PostgREST vem em inglês e chegava ao toast do painel. */
function fail(error: unknown, fallback: string): never {
    console.error(fallback, error)
    throw new Error(formatSupabasePostgrestError(error) ?? fallback)
}

export async function listNotifications(
    userId: string,
    workspaceId: string
): Promise<AppNotification[]> {
    const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(100)

    if (error) fail(error, "Não foi possível carregar as notificações.")
    return (data as AppNotification[]) ?? []
}

export async function countUnreadNotifications(
    userId: string,
    workspaceId: string
): Promise<number> {
    const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("workspace_id", workspaceId)
        .is("read_at", null)

    if (error) fail(error, "Não foi possível contar as notificações.")
    return count ?? 0
}

export async function markRead(
    userId: string,
    workspaceId: string,
    id: string
): Promise<void> {
    const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("workspace_id", workspaceId)
        .eq("id", id)

    if (error) fail(error, "Não foi possível marcar como lida.")
}

export async function markAllRead(userId: string, workspaceId: string): Promise<void> {
    const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("workspace_id", workspaceId)
        .is("read_at", null)

    if (error) fail(error, "Não foi possível marcar todas como lidas.")
}

export async function deleteNotification(
    userId: string,
    workspaceId: string,
    id: string
): Promise<void> {
    const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", userId)
        .eq("workspace_id", workspaceId)
        .eq("id", id)

    if (error) fail(error, "Não foi possível excluir a notificação.")
}

export async function clearAllNotifications(
    userId: string,
    workspaceId: string
): Promise<void> {
    const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", userId)
        .eq("workspace_id", workspaceId)

    if (error) fail(error, "Não foi possível limpar as notificações.")
}
