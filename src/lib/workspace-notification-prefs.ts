"use client"

import { supabase } from "@/lib/supabase"

export type WorkspaceMemberNotificationPrefs = {
    workspace_id: string
    user_id: string
    notify_email: boolean
    notify_in_app: boolean
    notify_push: boolean
    notify_transactions: boolean
    notify_budget: boolean
    notify_promotions: boolean
    notify_credit_cards: boolean
    notify_credit_card_calendar: boolean
    notify_bills: boolean
    created_at: string
    updated_at: string
}

export type WorkspaceNotificationPrefsPatch = Partial<
    Pick<
        WorkspaceMemberNotificationPrefs,
        | "notify_email"
        | "notify_in_app"
        | "notify_push"
        | "notify_transactions"
        | "notify_budget"
        | "notify_promotions"
        | "notify_credit_cards"
        | "notify_credit_card_calendar"
        | "notify_bills"
    >
>

export const DEFAULT_WORKSPACE_NOTIFICATION_PREFS: Omit<
    WorkspaceMemberNotificationPrefs,
    "workspace_id" | "user_id" | "created_at" | "updated_at"
> = {
    notify_email: true,
    notify_in_app: true,
    notify_push: false,
    notify_transactions: true,
    notify_budget: true,
    notify_promotions: false,
    notify_credit_cards: true,
    notify_credit_card_calendar: true,
    notify_bills: true,
}

const INSERT_DEFAULTS = {
    notify_email: DEFAULT_WORKSPACE_NOTIFICATION_PREFS.notify_email,
    notify_in_app: DEFAULT_WORKSPACE_NOTIFICATION_PREFS.notify_in_app,
    notify_push: DEFAULT_WORKSPACE_NOTIFICATION_PREFS.notify_push,
    notify_transactions: DEFAULT_WORKSPACE_NOTIFICATION_PREFS.notify_transactions,
    notify_budget: DEFAULT_WORKSPACE_NOTIFICATION_PREFS.notify_budget,
    notify_promotions: DEFAULT_WORKSPACE_NOTIFICATION_PREFS.notify_promotions,
    notify_credit_cards: DEFAULT_WORKSPACE_NOTIFICATION_PREFS.notify_credit_cards,
    notify_credit_card_calendar:
        DEFAULT_WORKSPACE_NOTIFICATION_PREFS.notify_credit_card_calendar,
    notify_bills: DEFAULT_WORKSPACE_NOTIFICATION_PREFS.notify_bills,
} as const

export async function getWorkspaceNotificationPrefs(
    userId: string,
    workspaceId: string
): Promise<WorkspaceMemberNotificationPrefs | null> {
    const { data, error } = await supabase
        .from("workspace_member_notification_prefs")
        .select("*")
        .eq("user_id", userId)
        .eq("workspace_id", workspaceId)
        .maybeSingle()

    if (error) throw new Error(error.message)
    return (data as WorkspaceMemberNotificationPrefs) ?? null
}

export async function ensureWorkspaceNotificationPrefsRow(
    userId: string,
    workspaceId: string
): Promise<WorkspaceMemberNotificationPrefs> {
    const existing = await getWorkspaceNotificationPrefs(userId, workspaceId)
    if (existing) return existing

    const { data, error } = await supabase
        .from("workspace_member_notification_prefs")
        .insert({
            workspace_id: workspaceId,
            user_id: userId,
            ...INSERT_DEFAULTS,
        })
        .select("*")
        .single()

    if (error) {
        const reread = await getWorkspaceNotificationPrefs(userId, workspaceId)
        if (reread) return reread
        throw new Error(error.message)
    }

    return data as WorkspaceMemberNotificationPrefs
}

export async function patchWorkspaceNotificationPrefs(
    userId: string,
    workspaceId: string,
    patch: WorkspaceNotificationPrefsPatch
): Promise<WorkspaceMemberNotificationPrefs> {
    await ensureWorkspaceNotificationPrefsRow(userId, workspaceId)

    const { data, error } = await supabase
        .from("workspace_member_notification_prefs")
        .update(patch)
        .eq("user_id", userId)
        .eq("workspace_id", workspaceId)
        .select("*")
        .single()

    if (error) throw new Error(error.message)
    return data as WorkspaceMemberNotificationPrefs
}
