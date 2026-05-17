"use client"

import { supabase } from "@/lib/supabase"

export type UserSettings = {
    user_id: string
    current_workspace_id: string | null
    created_at: string
    updated_at: string
}

export type UserSettingsPatch = Partial<Pick<UserSettings, "current_workspace_id">>

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
    const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    if (!data) return null
    return {
        ...(data as unknown as UserSettings),
        current_workspace_id:
            (data as { current_workspace_id?: string | null }).current_workspace_id ?? null,
    }
}

export async function ensureUserSettingsRow(userId: string): Promise<UserSettings> {
    const existing = await getUserSettings(userId)
    if (existing) return existing

    const { data, error } = await supabase
        .from("user_settings")
        .insert({ user_id: userId })
        .select("*")
        .single()

    if (error) {
        const reread = await getUserSettings(userId)
        if (reread) return reread
        throw new Error(error.message)
    }

    return {
        ...(data as unknown as UserSettings),
        current_workspace_id:
            (data as { current_workspace_id?: string | null }).current_workspace_id ?? null,
    }
}

export async function patchUserSettings(
    userId: string,
    patch: UserSettingsPatch
): Promise<UserSettings> {
    await ensureUserSettingsRow(userId)

    const { data, error } = await supabase
        .from("user_settings")
        .update(patch)
        .eq("user_id", userId)
        .select("*")
        .single()

    if (error) throw new Error(error.message)
    return {
        ...(data as unknown as UserSettings),
        current_workspace_id:
            (data as { current_workspace_id?: string | null }).current_workspace_id ?? null,
    }
}

/** Mensagem PT quando falta migração ou há erro de schema ao guardar preferências. */
export function userSettingsPersistErrorMessage(error: unknown): string | null {
    const msg = error instanceof Error ? error.message : String(error)
    const lower = msg.toLowerCase()
    if (
        lower.includes("current_workspace_id") ||
        (lower.includes("user_settings") && lower.includes("column"))
    ) {
        return "Para guardar a carteira atual falta a coluna current_workspace_id em user_settings. No Supabase SQL Editor, execute supabase/workspaces-user-settings.sql (após workspaces.sql), depois Settings → API → Reload schema."
    }
    return null
}
