"use client"

import { supabase } from "@/lib/supabase"

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

    if (error) throw new Error(error.message)
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

    if (error) throw new Error(error.message)
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

    if (error) throw new Error(error.message)
}

export async function markAllRead(userId: string, workspaceId: string): Promise<void> {
    const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("workspace_id", workspaceId)
        .is("read_at", null)

    if (error) throw new Error(error.message)
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

    if (error) throw new Error(error.message)
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

    if (error) throw new Error(error.message)
}
