"use client"

import { supabase } from "@/lib/supabase"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"

/** O `message` cru do Postgres não vai à tela; o erro inteiro fica em `cause`. */
function settingsError(error: unknown, fallback: string): Error {
    return new Error(formatSupabasePostgrestError(error) ?? fallback, { cause: error })
}

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
        .select("created_at, current_workspace_id, updated_at, user_id")
        .eq("user_id", userId)
        .maybeSingle()

    if (error) {
        throw settingsError(error, "Não foi possível carregar suas preferências.")
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
        .select("created_at, current_workspace_id, updated_at, user_id")
        .single()

    if (error) {
        const reread = await getUserSettings(userId)
        if (reread) return reread
        throw settingsError(error, "Não foi possível criar suas preferências.")
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
        .select("created_at, current_workspace_id, updated_at, user_id")
        .single()

    if (error) throw settingsError(error, "Não foi possível salvar suas preferências.")
    return {
        ...(data as unknown as UserSettings),
        current_workspace_id:
            (data as { current_workspace_id?: string | null }).current_workspace_id ?? null,
    }
}

/** Mensagem PT quando falta migração ou há erro de schema ao guardar preferências. */
export function userSettingsPersistErrorMessage(error: unknown): string | null {
    // Lê o erro do banco em `cause` (código e texto originais), e não a mensagem
    // da tela, que agora é português genérico.
    const raw = error instanceof Error && error.cause != null ? error.cause : error
    const { code, message, details } = (raw ?? {}) as {
        code?: string
        message?: string
        details?: string
    }
    const texto = `${message ?? ""} ${details ?? ""}`.toLowerCase()
    const colunaAusente =
        code === "42703" ||
        code === "PGRST204" ||
        texto.includes("current_workspace_id") ||
        (texto.includes("user_settings") && texto.includes("column"))
    if (!colunaAusente) return null
    // O passo a passo do banco é para quem desenvolve; em produção cai no texto
    // genérico de quem chama.
    if (process.env.NODE_ENV !== "development") return null
    return "Para guardar a carteira atual falta a coluna current_workspace_id em user_settings. No Supabase SQL Editor, execute supabase/workspaces-user-settings.sql (após workspaces.sql), depois Settings → API → Reload schema."
}
