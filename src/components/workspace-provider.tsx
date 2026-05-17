"use client"

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react"
import { useIsRestoring, useQueryClient } from "@tanstack/react-query"
import { supabase, type Workspace, type WorkspaceRole } from "@/lib/supabase"
import {
    isWorkspaceIconKey,
    randomWorkspaceAccentColor,
    type WorkspaceIconKey,
} from "@/lib/workspace-icons"
import { useAuth } from "@/components/providers"
import {
    patchUserSettings,
    userSettingsPersistErrorMessage,
} from "@/lib/settings"
import type { WorkspaceDeleteImpact } from "@/lib/supabase"
import {
    parseWorkspaceDeleteImpactJson,
    workspaceDeleteRpcErrorMessage,
} from "@/lib/workspace-delete"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { describeWorkspaceSupabaseError } from "@/lib/queries/workspace-errors"
import {
    type WorkspacesBundle,
    WorkspacesLoadError,
} from "@/lib/queries/fetch-workspaces-data"
import { workspaceKeys } from "@/lib/queries/keys"
import { useWorkspacesQuery } from "@/lib/queries/use-workspaces"
import { WorkspaceQueryInvalidationBridge } from "@/components/workspace-query-invalidation-bridge"

export type { PendingWorkspaceInvite } from "@/lib/queries/fetch-workspaces-data"

export type CreateWorkspaceInput = {
    name: string
    icon: WorkspaceIconKey
    type?: "personal" | "shared"
    /** Hex color; if omitted, a random palette color is chosen. */
    icon_background_color?: string
}

export type UpdateWorkspaceInput = {
    name?: string
    icon?: WorkspaceIconKey
    icon_background_color?: string
}

type WorkspaceContextType = {
    workspaces: Workspace[]
    currentWorkspace: Workspace | null
    currentWorkspaceId: string | null
    workspaceRoleById: Record<string, WorkspaceRole>
    /** Email invites addressed to the signed-in user where they are not yet a member. */
    pendingWorkspaceInvites: import("@/lib/queries/fetch-workspaces-data").PendingWorkspaceInvite[]
    loading: boolean
    error: string | null
    refreshWorkspaces: () => Promise<Workspace[]>
    setCurrentWorkspaceId: (workspaceId: string) => Promise<void>
    createWorkspace: (input: CreateWorkspaceInput) => Promise<Workspace | null>
    updateWorkspace: (
        workspaceId: string,
        input: UpdateWorkspaceInput
    ) => Promise<Workspace | null>
    isWorkspaceOwner: (workspaceId: string) => boolean
    fetchWorkspaceDeleteImpact: (
        workspaceId: string
    ) => Promise<
        | { ok: true; impact: WorkspaceDeleteImpact }
        | { ok: false; message: string }
    >
    deleteWorkspace: (
        workspaceId: string
    ) => Promise<{ ok: true } | { ok: false; message: string }>
    leaveWorkspace: (
        workspaceId: string
    ) => Promise<{ ok: true } | { ok: false; message: string }>
}

const WorkspaceContext = createContext<WorkspaceContextType>({
    workspaces: [],
    currentWorkspace: null,
    currentWorkspaceId: null,
    workspaceRoleById: {},
    pendingWorkspaceInvites: [],
    loading: true,
    error: null,
    refreshWorkspaces: async () => [],
    setCurrentWorkspaceId: async () => {},
    createWorkspace: async () => null,
    updateWorkspace: async () => null,
    isWorkspaceOwner: () => false,
    fetchWorkspaceDeleteImpact: async () => ({
        ok: false,
        message: "Indisponível.",
    }),
    deleteWorkspace: async () => ({ ok: false, message: "Indisponível." }),
    leaveWorkspace: async () => ({ ok: false, message: "Indisponível." }),
})

export function useWorkspace() {
    return useContext(WorkspaceContext)
}

function workspaceQueryErrorMessage(error: unknown): string {
    if (error instanceof WorkspacesLoadError) return error.message
    if (error instanceof Error) return error.message
    return "Não foi possível carregar as carteiras."
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
    const { user, loading: authLoading } = useAuth()
    const queryClient = useQueryClient()
    const [mutationError, setMutationError] = useState<string | null>(null)

    const isRestoringCache = useIsRestoring()
    const workspaceQuery = useWorkspacesQuery(user)
    const bundle = workspaceQuery.data

    const workspaces = bundle?.workspaces ?? []
    const workspaceRoleById = bundle?.workspaceRoleById ?? {}
    const pendingWorkspaceInvites = bundle?.pendingWorkspaceInvites ?? []
    const currentWorkspaceId = bundle?.currentWorkspaceId ?? null

    const loading =
        authLoading ||
        isRestoringCache ||
        (Boolean(user?.id) && workspaceQuery.isPending)

    const error = useMemo(() => {
        if (mutationError) return mutationError
        if (workspaceQuery.isError) {
            return workspaceQueryErrorMessage(workspaceQuery.error)
        }
        if (bundle?.settingsPersistWarning) return bundle.settingsPersistWarning
        return null
    }, [
        mutationError,
        workspaceQuery.isError,
        workspaceQuery.error,
        bundle?.settingsPersistWarning,
    ])

    const refreshWorkspaces = useCallback(async (): Promise<Workspace[]> => {
        if (!user?.id) return []
        await queryClient.refetchQueries({
            queryKey: workspaceKeys.list(user.id),
        })
        return (
            queryClient.getQueryData<WorkspacesBundle>(
                workspaceKeys.list(user.id),
            )?.workspaces ?? []
        )
    }, [user, queryClient])

    const setCurrentWorkspaceId = useCallback(
        async (workspaceId: string) => {
            setMutationError(null)
            if (user?.id) {
                queryClient.setQueryData<WorkspacesBundle>(
                    workspaceKeys.list(user.id),
                    (prev) =>
                        prev
                            ? { ...prev, currentWorkspaceId: workspaceId }
                            : prev,
                )
                await patchUserSettings(user.id, {
                    current_workspace_id: workspaceId,
                }).catch((e) => {
                    setMutationError(
                        userSettingsPersistErrorMessage(e) ??
                            "Não foi possível salvar a carteira atual. Sua escolha pode não persistir após recarregar a página.",
                    )
                    void queryClient.invalidateQueries({
                        queryKey: workspaceKeys.list(user.id),
                    })
                    return null
                })
            }
        },
        [user, queryClient],
    )

    const createWorkspace = useCallback(
        async (input: CreateWorkspaceInput): Promise<Workspace | null> => {
            if (!user) return null
            setMutationError(null)

            const trimmed = input.name.trim()
            if (!trimmed) {
                setMutationError(
                    "Informe um nome válido para a carteira (não pode ficar vazio).",
                )
                return null
            }

            if (!isWorkspaceIconKey(input.icon)) {
                setMutationError("Selecione um ícone válido para a carteira.")
                return null
            }

            const type = input.type ?? "shared"
            const icon_background_color =
                input.icon_background_color?.trim() || randomWorkspaceAccentColor()

            const { data: workspace, error: createError } = await supabase
                .from("workspaces")
                .insert({
                    name: trimmed,
                    type,
                    created_by: user.id,
                    icon: input.icon,
                    icon_background_color,
                })
                .select("*")
                .single()

            if (createError || !workspace) {
                console.error("Error creating workspace:", createError)
                setMutationError(
                    describeWorkspaceSupabaseError(createError) ??
                        "Não foi possível criar a carteira. Se o problema continuar, tente mais tarde ou entre em contato com o suporte.",
                )
                return null
            }

            const { error: membershipError } = await supabase
                .from("workspace_members")
                .insert({
                    workspace_id: workspace.id,
                    user_id: user.id,
                    role: "owner",
                })

            if (membershipError) {
                console.error("Error creating workspace membership:", membershipError)
                setMutationError(
                    "A carteira foi criada, mas não foi possível vinculá-la a você como responsável. Recarregue a página ou entre em contato com o suporte.",
                )
                return null
            }

            await queryClient.invalidateQueries({
                queryKey: workspaceKeys.list(user.id),
            })
            await queryClient.refetchQueries({
                queryKey: workspaceKeys.list(user.id),
            })
            await setCurrentWorkspaceId(workspace.id)

            return workspace as Workspace
        },
        [user, queryClient, setCurrentWorkspaceId],
    )

    const isWorkspaceOwner = useCallback(
        (workspaceId: string) => workspaceRoleById[workspaceId] === "owner",
        [workspaceRoleById],
    )

    const updateWorkspace = useCallback(
        async (
            workspaceId: string,
            input: UpdateWorkspaceInput,
        ): Promise<Workspace | null> => {
            if (!user) return null
            setMutationError(null)

            const updates: Record<string, string> = {}

            if (input.name !== undefined) {
                const trimmed = input.name.trim()
                if (!trimmed) {
                    setMutationError(
                        "Informe um nome válido para a carteira (não pode ficar vazio).",
                    )
                    return null
                }
                updates.name = trimmed
            }

            if (input.icon !== undefined) {
                if (!isWorkspaceIconKey(input.icon)) {
                    setMutationError("Selecione um ícone válido para a carteira.")
                    return null
                }
                updates.icon = input.icon
            }

            if (input.icon_background_color !== undefined) {
                const c = input.icon_background_color.trim()
                if (!c) {
                    setMutationError("Escolha uma cor de destaque para o ícone.")
                    return null
                }
                updates.icon_background_color = c
            }

            if (Object.keys(updates).length === 0) {
                const { data: existing } = await supabase
                    .from("workspaces")
                    .select("*")
                    .eq("id", workspaceId)
                    .single()
                return (existing as Workspace) ?? null
            }

            const { data: workspace, error: updateError } = await supabase
                .from("workspaces")
                .update(updates)
                .eq("id", workspaceId)
                .select("*")
                .single()

            if (updateError || !workspace) {
                console.error("Error updating workspace:", updateError)
                setMutationError(
                    describeWorkspaceSupabaseError(updateError) ??
                        "Não foi possível atualizar a carteira. Tente novamente.",
                )
                return null
            }

            await queryClient.invalidateQueries({
                queryKey: workspaceKeys.list(user.id),
            })

            return workspace as Workspace
        },
        [user, queryClient],
    )

    const fetchWorkspaceDeleteImpact = useCallback(
        async (
            workspaceId: string,
        ): Promise<
            | { ok: true; impact: WorkspaceDeleteImpact }
            | { ok: false; message: string }
        > => {
            const { data, error } = await supabase.rpc(
                "get_workspace_delete_impact",
                { p_workspace_id: workspaceId },
            )
            if (error) {
                return {
                    ok: false,
                    message: workspaceDeleteRpcErrorMessage(error),
                }
            }
            const impact = parseWorkspaceDeleteImpactJson(data)
            if (!impact) {
                return {
                    ok: false,
                    message: "Não foi possível interpretar os dados do servidor.",
                }
            }
            return { ok: true, impact }
        },
        [],
    )

    const deleteWorkspace = useCallback(
        async (
            workspaceId: string,
        ): Promise<{ ok: true } | { ok: false; message: string }> => {
            if (!user) {
                return { ok: false, message: "Faça login novamente." }
            }
            const wasCurrent = currentWorkspaceId === workspaceId
            const { error: rpcError } = await supabase.rpc("delete_workspace", {
                p_workspace_id: workspaceId,
            })
            if (rpcError) {
                return {
                    ok: false,
                    message: workspaceDeleteRpcErrorMessage(rpcError),
                }
            }
            await queryClient.invalidateQueries({
                queryKey: workspaceKeys.list(user.id),
            })
            await queryClient.refetchQueries({
                queryKey: workspaceKeys.list(user.id),
            })
            const next =
                queryClient.getQueryData<WorkspacesBundle>(
                    workspaceKeys.list(user.id),
                )?.workspaces ?? []
            if (wasCurrent) {
                const personal = next.find((w) => w.type === "personal")
                if (personal) {
                    await setCurrentWorkspaceId(personal.id)
                }
            }
            return { ok: true }
        },
        [user, currentWorkspaceId, queryClient, setCurrentWorkspaceId],
    )

    const leaveWorkspace = useCallback(
        async (
            workspaceId: string,
        ): Promise<{ ok: true } | { ok: false; message: string }> => {
            if (!user) {
                return { ok: false, message: "Faça login novamente." }
            }
            const ws = workspaces.find((w) => w.id === workspaceId)
            if (
                workspaceRoleById[workspaceId] === "owner" ||
                ws?.created_by === user.id
            ) {
                return {
                    ok: false,
                    message:
                        "O dono pode excluir a carteira nas definições. Só membros convidados podem sair.",
                }
            }
            const wasCurrent = currentWorkspaceId === workspaceId
            const { error: delError } = await supabase
                .from("workspace_members")
                .delete()
                .eq("workspace_id", workspaceId)
                .eq("user_id", user.id)
            if (delError) {
                return {
                    ok: false,
                    message:
                        formatSupabasePostgrestError(delError) ??
                        describeWorkspaceSupabaseError(delError) ??
                        "Não foi possível sair da carteira. Tente novamente.",
                }
            }
            await queryClient.invalidateQueries({
                queryKey: workspaceKeys.list(user.id),
            })
            await queryClient.refetchQueries({
                queryKey: workspaceKeys.list(user.id),
            })
            const next =
                queryClient.getQueryData<WorkspacesBundle>(
                    workspaceKeys.list(user.id),
                )?.workspaces ?? []
            if (wasCurrent) {
                const personal = next.find((w) => w.type === "personal")
                if (personal) {
                    await setCurrentWorkspaceId(personal.id)
                }
            }
            return { ok: true }
        },
        [
            user,
            workspaceRoleById,
            workspaces,
            currentWorkspaceId,
            queryClient,
            setCurrentWorkspaceId,
        ],
    )

    const currentWorkspace = useMemo(
        () => workspaces.find((w) => w.id === currentWorkspaceId) ?? null,
        [workspaces, currentWorkspaceId],
    )

    const value = useMemo<WorkspaceContextType>(
        () => ({
            workspaces,
            currentWorkspace,
            currentWorkspaceId,
            workspaceRoleById,
            pendingWorkspaceInvites,
            loading,
            error,
            refreshWorkspaces,
            setCurrentWorkspaceId,
            createWorkspace,
            updateWorkspace,
            isWorkspaceOwner,
            fetchWorkspaceDeleteImpact,
            deleteWorkspace,
            leaveWorkspace,
        }),
        [
            workspaces,
            currentWorkspace,
            currentWorkspaceId,
            workspaceRoleById,
            pendingWorkspaceInvites,
            loading,
            error,
            refreshWorkspaces,
            setCurrentWorkspaceId,
            createWorkspace,
            updateWorkspace,
            isWorkspaceOwner,
            fetchWorkspaceDeleteImpact,
            deleteWorkspace,
            leaveWorkspace,
        ],
    )

    return (
        <WorkspaceContext.Provider value={value}>
            <WorkspaceQueryInvalidationBridge />
            {children}
        </WorkspaceContext.Provider>
    )
}
