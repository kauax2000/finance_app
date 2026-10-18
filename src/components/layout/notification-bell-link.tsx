"use client"

import { useEffect, useRef } from "react"
import { BellIcon } from "@heroicons/react/16/solid"
import { TopBarAction } from "@/components/ui/top-bar"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { useNotificationsUi } from "@/components/layout/notifications-ui-provider"
import { countUnreadNotifications } from "@/lib/notifications"
import { BELL_POLL_MS } from "@/lib/unread-count"

export function NotificationBellLink() {
    const { user, loading: authLoading } = useAuth()
    const { currentWorkspaceId, loading: workspaceLoading } = useWorkspace()
    const { toggle, isOpen, unreadCount, setUnreadCount, badgeNonce } = useNotificationsUi()
    const userId = user?.id
    // Sequência da contagem: só a resposta mais recente escreve no sino.
    const seqRef = useRef(0)

    // Outra carteira, outro número: o da anterior não fica no sino até a contagem nova chegar.
    // Efeito à parte, antes da contagem: o `badgeNonce` não pode zerar o sino a cada invalidação.
    useEffect(() => {
        setUnreadCount(0)
    }, [currentWorkspaceId, setUnreadCount])

    useEffect(() => {
        if (authLoading || workspaceLoading) return
        if (!userId || !currentWorkspaceId) {
            setUnreadCount(0)
            return
        }

        let ativo = true
        const refresh = async () => {
            const seq = ++seqRef.current
            try {
                const n = await countUnreadNotifications(userId, currentWorkspaceId)
                if (!ativo || seq !== seqRef.current) return
                setUnreadCount(n)
            } catch {
                // Falha de rede não zera o sino: fica o último número bom até a próxima sondagem.
            }
        }

        void refresh()
        // ponytail: sondagem de 60s, e só com a aba visível (teto: até 1 min de atraso para uma
        // notificação nova). O caminho de volta é o Supabase Realtime em `notifications`, que exige
        // a tabela na publicação `supabase_realtime` (mudança de banco).
        const id = window.setInterval(() => {
            if (document.visibilityState === "visible") void refresh()
        }, BELL_POLL_MS)
        const onVis = () => {
            if (document.visibilityState === "visible") void refresh()
        }
        document.addEventListener("visibilitychange", onVis)
        return () => {
            window.clearInterval(id)
            document.removeEventListener("visibilitychange", onVis)
            // Descarta a resposta em voo (outra carteira, ou desmonte).
            ativo = false
        }
        // `badgeNonce` refaz a contagem quando alguém invalida o sino.
    }, [authLoading, workspaceLoading, userId, currentWorkspaceId, badgeNonce, setUnreadCount])

    return (
        <TopBarAction
            type="button"
            label="Notificações"
            plate
            tooltip={false}
            count={unreadCount}
            countLabel={`${unreadCount} não ${unreadCount === 1 ? "lida" : "lidas"}`}
            aria-expanded={isOpen}
            onClick={() => toggle()}
        >
            {/* `24/outline` a 16px, por decisão: não existe `16/outline`, e o
                traço é o do sol do `ThemeToggle`. Exceção nomeada no auditor. */}
            <BellIcon className="size-4" />
        </TopBarAction>
    )
}
