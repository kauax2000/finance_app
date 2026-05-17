"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useAuth } from "@/components/providers"
import {
    ensureUserSettingsRow,
    patchUserSettings,
    type UserSettings,
    type UserSettingsPatch,
} from "@/lib/settings"

type UseUserSettingsState = {
    settings: UserSettings | null
    loading: boolean
    error: string | null
    updating: boolean
    patch: (patch: UserSettingsPatch) => Promise<void>
}

export function useUserSettings(): UseUserSettingsState {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [settings, setSettings] = useState<UserSettings | null>(null)

    useEffect(() => {
        let alive = true
        async function run() {
            if (!user?.id) {
                if (!alive) return
                setSettings(null)
                setLoading(false)
                return
            }
            setLoading(true)
            setError(null)
            try {
                const row = await ensureUserSettingsRow(user.id)
                if (!alive) return
                setSettings(row)
            } catch (e) {
                if (!alive) return
                setError(e instanceof Error ? e.message : "Erro ao carregar configurações")
            } finally {
                if (!alive) return
                setLoading(false)
            }
        }
        void run()
        return () => {
            alive = false
        }
    }, [user?.id])

    const patch = useCallback(
        async (p: UserSettingsPatch) => {
            if (!user?.id) return
            setUpdating(true)
            setError(null)

            const previous = settings
            setSettings((cur) => {
                if (!cur) return null
                return { ...cur, ...p }
            })

            try {
                const updated = await patchUserSettings(user.id, p)
                setSettings(updated)
            } catch (e) {
                setSettings(previous ?? null)
                setError(e instanceof Error ? e.message : "Erro ao salvar configurações")
            } finally {
                setUpdating(false)
            }
        },
        [user?.id, settings]
    )

    return useMemo(
        () => ({ settings, loading, error, updating, patch }),
        [settings, loading, error, updating, patch]
    )
}
