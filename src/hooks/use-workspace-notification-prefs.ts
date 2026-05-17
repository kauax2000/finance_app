"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import {
    ensureWorkspaceNotificationPrefsRow,
    patchWorkspaceNotificationPrefs,
    type WorkspaceMemberNotificationPrefs,
    type WorkspaceNotificationPrefsPatch,
} from "@/lib/workspace-notification-prefs"

type State = {
    prefs: WorkspaceMemberNotificationPrefs | null
    loading: boolean
    error: string | null
    updating: boolean
    patch: (p: WorkspaceNotificationPrefsPatch) => Promise<void>
}

export function useWorkspaceNotificationPrefs(): State {
    const { user, loading: authLoading } = useAuth()
    const { currentWorkspaceId, loading: workspaceLoading } = useWorkspace()
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [prefs, setPrefs] = useState<WorkspaceMemberNotificationPrefs | null>(null)

    useEffect(() => {
        let alive = true
        async function run() {
            if (authLoading || workspaceLoading) {
                if (!alive) return
                setLoading(true)
                return
            }
            if (!user?.id || !currentWorkspaceId) {
                if (!alive) return
                setPrefs(null)
                setLoading(false)
                return
            }
            setLoading(true)
            setError(null)
            try {
                const row = await ensureWorkspaceNotificationPrefsRow(
                    user.id,
                    currentWorkspaceId
                )
                if (!alive) return
                setPrefs(row)
            } catch (e) {
                if (!alive) return
                setError(
                    e instanceof Error ? e.message : "Erro ao carregar preferências da carteira"
                )
            } finally {
                if (!alive) return
                setLoading(false)
            }
        }
        void run()
        return () => {
            alive = false
        }
    }, [authLoading, workspaceLoading, user?.id, currentWorkspaceId])

    const patch = useCallback(
        async (p: WorkspaceNotificationPrefsPatch) => {
            if (!user?.id || !currentWorkspaceId) return
            setUpdating(true)
            setError(null)
            const previous = prefs
            setPrefs((cur) => {
                if (!cur) return null
                return { ...cur, ...p }
            })
            try {
                const updated = await patchWorkspaceNotificationPrefs(
                    user.id,
                    currentWorkspaceId,
                    p
                )
                setPrefs(updated)
            } catch (e) {
                setPrefs(previous ?? null)
                setError(
                    e instanceof Error ? e.message : "Erro ao salvar preferências da carteira"
                )
            } finally {
                setUpdating(false)
            }
        },
        [user?.id, currentWorkspaceId, prefs]
    )

    return useMemo(
        () => ({ prefs, loading, error, updating, patch }),
        [prefs, loading, error, updating, patch]
    )
}
