"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { notificationPrefsKeys } from "@/lib/queries/keys"
import {
    desfazerPatch,
    ensureWorkspaceNotificationPrefsRow,
    patchWorkspaceNotificationPrefs,
    type WorkspaceMemberNotificationPrefs,
    type WorkspaceNotificationPrefsPatch,
} from "@/lib/workspace-notification-prefs"

/** O retorno do gancho: as peças das chaves recebem `prefs` e `patch` dele. */
export type WorkspaceNotificationPrefsState = {
    prefs: WorkspaceMemberNotificationPrefs | null
    loading: boolean
    error: string | null
    patch: (p: WorkspaceNotificationPrefsPatch) => Promise<void>
}

const mensagem = (e: unknown, reserva: string) => (e instanceof Error ? e.message : reserva)

/**
 * As preferências da pessoa nesta carteira. Moram no cache, e não na tela: o
 * `PushNotificationProvider` usa este gancho na raiz do app, então elas carregam no
 * boot, e Configurações entra sem esqueleto.
 */
export function useWorkspaceNotificationPrefs(): WorkspaceNotificationPrefsState {
    const { user, loading: authLoading } = useAuth()
    const { currentWorkspaceId, loading: workspaceLoading } = useWorkspace()
    const queryClient = useQueryClient()
    const [erroAoSalvar, setErroAoSalvar] = useState<string | null>(null)

    const userId = user?.id
    const key = useMemo(
        () => notificationPrefsKeys.detail(userId ?? "", currentWorkspaceId ?? ""),
        [userId, currentWorkspaceId]
    )
    const consulta = useQuery({
        queryKey: key,
        queryFn: () => ensureWorkspaceNotificationPrefsRow(userId!, currentWorkspaceId!),
        enabled: Boolean(userId && currentWorkspaceId),
        // As telas mostram o erro no lugar: o toast repetiria o mesmo aviso.
        meta: { errorToast: false },
    })

    // Em fila: duas mudanças da mesma chave chegam ao banco na ordem do toque.
    const fila = useRef(Promise.resolve())

    const patch = useCallback(
        (p: WorkspaceNotificationPrefsPatch) => {
            if (!userId || !currentWorkspaceId) return Promise.resolve()
            setErroAoSalvar(null)
            // Uma releitura em andamento traria o valor de antes por cima do toque.
            void queryClient.cancelQueries({ queryKey: key })
            const antes = queryClient.getQueryData<WorkspaceMemberNotificationPrefs>(key) ?? null
            queryClient.setQueryData<WorkspaceMemberNotificationPrefs>(key, (cur) =>
                cur ? { ...cur, ...p } : cur
            )
            fila.current = fila.current.then(async () => {
                try {
                    await patchWorkspaceNotificationPrefs(userId, currentWorkspaceId, p)
                } catch (e) {
                    queryClient.setQueryData<WorkspaceMemberNotificationPrefs>(
                        key,
                        (cur) => desfazerPatch(cur ?? null, antes, p) ?? cur
                    )
                    setErroAoSalvar(mensagem(e, "Erro ao salvar preferências da carteira"))
                }
            })
            return fila.current
        },
        [userId, currentWorkspaceId, queryClient, key]
    )

    const erroAoCarregar = consulta.error
        ? mensagem(consulta.error, "Erro ao carregar preferências da carteira")
        : null
    const loading = authLoading || workspaceLoading || (Boolean(userId && currentWorkspaceId) && consulta.isPending)

    return useMemo(
        () => ({ prefs: consulta.data ?? null, loading, error: erroAoSalvar ?? erroAoCarregar, patch }),
        [consulta.data, loading, erroAoSalvar, erroAoCarregar, patch]
    )
}
