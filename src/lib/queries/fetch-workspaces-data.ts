import type { User } from "@supabase/supabase-js"
import {
    getUserSettings,
    patchUserSettings,
    userSettingsPersistErrorMessage,
} from "@/lib/settings"
import { supabase, type Workspace, type WorkspaceRole } from "@/lib/supabase"
import { describeWorkspaceSupabaseError } from "@/lib/queries/workspace-errors"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { isPostgrestTransientNetworkError } from "@/lib/transient-network-retry"

export type PendingWorkspaceInvite = {
    id: string
    workspace_id: string
    invited_email: string | null
    expires_at: string
    token_raw: string | null
    workspace: Workspace | null
}

export type WorkspacesBundle = {
    workspaces: Workspace[]
    workspaceRoleById: Record<string, WorkspaceRole>
    pendingWorkspaceInvites: PendingWorkspaceInvite[]
    currentWorkspaceId: string | null
    /** Non-fatal warning after successful load */
    settingsPersistWarning: string | null
}

export class WorkspacesLoadError extends Error {
    constructor(
        message: string,
        readonly code: "load_failed" = "load_failed"
    ) {
        super(message)
        this.name = "WorkspacesLoadError"
    }
}

export async function fetchWorkspacesData(user: User): Promise<WorkspacesBundle> {
    let { data: memberships, error } = await supabase
        .from("workspace_members")
        .select("role, workspace:workspaces(*)")
        .eq("user_id", user.id)

    if (error && isPostgrestTransientNetworkError(error)) {
        const retry = await supabase
            .from("workspace_members")
            .select("role, workspace:workspaces(*)")
            .eq("user_id", user.id)
        memberships = retry.data
        error = retry.error
    }

    if (error) {
        const formatted = formatSupabasePostgrestError(error)
        if (formatted) console.error("Error loading workspaces:", formatted)
        throw new WorkspacesLoadError(
            describeWorkspaceSupabaseError(error) ??
                formatted ??
                "Não foi possível carregar as carteiras. Verifique a conexão com a internet e tente novamente."
        )
    }

    const roleById: Record<string, WorkspaceRole> = {}

    const loadedWorkspaces = (memberships ?? [])
        .map((row) => {
            const typed = row as {
                role?: WorkspaceRole
                workspace?: unknown
            }
            const workspaceValue = typed.workspace
            const role: WorkspaceRole =
                typed.role === "owner" || typed.role === "member"
                    ? typed.role
                    : "member"

            let w: Workspace | null
            if (Array.isArray(workspaceValue)) {
                w = (workspaceValue[0] ?? null) as Workspace | null
            } else {
                w = (workspaceValue ?? null) as Workspace | null
            }

            if (w) {
                roleById[w.id] = role
            }
            return w
        })
        .filter((w): w is Workspace => Boolean(w))
        .map((w) => ({
            ...w,
            icon:
                typeof w.icon === "string" && w.icon.trim() ? w.icon : "home",
            icon_background_color:
                typeof w.icon_background_color === "string" &&
                w.icon_background_color.trim()
                    ? w.icon_background_color
                    : "#2563EB",
        }))

    const orderedWorkspaces = [...loadedWorkspaces].sort((a, b) => {
        if (a.type === "personal" && b.type !== "personal") return -1
        if (b.type === "personal" && a.type !== "personal") return 1
        return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" })
    })

    const memberWorkspaceIds = new Set(orderedWorkspaces.map((w) => w.id))
    const myEmail = (user.email ?? "").trim().toLowerCase()
    const nextPending: PendingWorkspaceInvite[] = []
    if (myEmail) {
        const { data: inviteData, error: inviteErr } = await supabase
            .from("workspace_invites")
            .select(
                "id, workspace_id, invited_email, expires_at, token_raw, workspace:workspaces(id,name,type,created_by,icon,icon_background_color,created_at,updated_at)",
            )
            .eq("status", "pending")
            .gt("expires_at", new Date().toISOString())

        if (!inviteErr && Array.isArray(inviteData)) {
            for (const raw of inviteData) {
                const row = raw as {
                    id: string
                    workspace_id: string
                    invited_email: string | null
                    expires_at: string
                    token_raw: string | null
                    workspace?: Workspace | Workspace[] | null
                }
                const invited = row.invited_email?.trim().toLowerCase()
                if (!invited || invited !== myEmail) continue
                if (!row.token_raw?.trim()) continue
                if (memberWorkspaceIds.has(row.workspace_id)) continue
                const wv = row.workspace
                let wRaw: Workspace | null
                if (Array.isArray(wv)) {
                    wRaw = (wv[0] ?? null) as Workspace | null
                } else {
                    wRaw = (wv ?? null) as Workspace | null
                }
                const wNorm: Workspace | null = wRaw
                    ? {
                          ...wRaw,
                          icon:
                              typeof wRaw.icon === "string" && wRaw.icon.trim()
                                  ? wRaw.icon
                                  : "home",
                          icon_background_color:
                              typeof wRaw.icon_background_color === "string" &&
                              wRaw.icon_background_color.trim()
                                  ? wRaw.icon_background_color
                                  : "#2563EB",
                      }
                    : null
                nextPending.push({
                    id: row.id,
                    workspace_id: row.workspace_id,
                    invited_email: row.invited_email,
                    expires_at: row.expires_at,
                    token_raw: row.token_raw,
                    workspace: wNorm,
                })
            }
        }
    }

    const settings = await getUserSettings(user.id).catch(() => null)
    const savedWorkspaceId = settings?.current_workspace_id ?? null

    const hasSaved =
        savedWorkspaceId && orderedWorkspaces.some((w) => w.id === savedWorkspaceId)
    const fallback = orderedWorkspaces[0]?.id ?? null
    const resolvedWorkspaceId = hasSaved ? savedWorkspaceId : fallback

    let settingsPersistWarning: string | null = null
    if (!hasSaved && resolvedWorkspaceId) {
        await patchUserSettings(user.id, {
            current_workspace_id: resolvedWorkspaceId,
        }).catch((e) => {
            settingsPersistWarning =
                userSettingsPersistErrorMessage(e) ??
                "A carteira foi selecionada, mas não foi possível salvar a preferência neste dispositivo."
            return null
        })
    }

    return {
        workspaces: orderedWorkspaces,
        workspaceRoleById: roleById,
        pendingWorkspaceInvites: nextPending,
        currentWorkspaceId: resolvedWorkspaceId,
        settingsPersistWarning,
    }
}
