"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import {
    desfazerPatch,
    ensureWorkspaceNotificationPrefsRow,
    patchWorkspaceNotificationPrefs,
    type WorkspaceMemberNotificationPrefs,
    type WorkspaceNotificationPrefsPatch,
} from "@/lib/workspace-notification-prefs"

type State = {
    prefs: WorkspaceMemberNotificationPrefs | null
    loading: boolean
    error: string | null
    patch: (p: WorkspaceNotificationPrefsPatch) => Promise<void>
}

export function useWorkspaceNotificationPrefs(): State {
    const { user, loading: authLoading } = useAuth()
    const { currentWorkspaceId, loading: workspaceLoading } = useWorkspace()
    const [loading, setLoading] = useState(true)
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

    // Em fila: duas mudanças da mesma chave chegam ao banco na ordem do toque.
    const fila = useRef(Promise.resolve())

    const patch = useCallback(
        (p: WorkspaceNotificationPrefsPatch) => {
            if (!user?.id || !currentWorkspaceId) return Promise.resolve()
            const userId = user.id
            setError(null)
            setPrefs((cur) => (cur ? { ...cur, ...p } : null))
            fila.current = fila.current.then(async () => {
                try {
                    await patchWorkspaceNotificationPrefs(userId, currentWorkspaceId, p)
                } catch (e) {
                    setPrefs((cur) => desfazerPatch(cur, prefs, p))
                    setError(
                        e instanceof Error ? e.message : "Erro ao salvar preferências da carteira"
                    )
                }
            })
            return fila.current
        },
        [user?.id, currentWorkspaceId, prefs]
    )

    return useMemo(
        () => ({ prefs, loading, error, patch }),
        [prefs, loading, error, patch]
    )
}
