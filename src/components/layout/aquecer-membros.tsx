"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { ROUTES } from "@/config/navigation"
import { prefetchNavRouteHref } from "@/components/layout/sidebar-route-prefetch"
import { fetchInviteLinks, INVITE_LINKS_STALE_MS } from "@/lib/queries/fetch-invite-links"
import { inviteLinksKeys } from "@/lib/queries/keys"
import { ehAdulto } from "@/lib/papeis/papeis"

/** Depois que a tela de entrada assenta: o pacote não disputa o servidor com ela. */
const ESPERA_MS = 3000

/**
 * Busca o pacote de Membros em segundo plano, uma vez por carteira, para a
 * tela abrir pronta como Configurações. No telefone não há o passar do mouse
 * da barra lateral: Membros se abre pela Você.
 */
export function AquecerMembros() {
    const queryClient = useQueryClient()
    const pathname = usePathname()
    const { user } = useAuth()
    const { currentWorkspaceId, papel } = useWorkspace()
    const naTela = pathname === ROUTES.MEMBERS
    const pronto = Boolean(user && currentWorkspaceId) && ehAdulto(papel) && !naTela

    React.useEffect(() => {
        if (!pronto) return
        const id = window.setTimeout(() => {
            prefetchNavRouteHref(queryClient, currentWorkspaceId, ROUTES.MEMBERS, user)
            if (papel === "owner") {
                void queryClient.prefetchQuery({
                    queryKey: inviteLinksKeys.links(currentWorkspaceId!),
                    queryFn: () => fetchInviteLinks(currentWorkspaceId!),
                    staleTime: INVITE_LINKS_STALE_MS,
                })
            }
        }, ESPERA_MS)
        return () => window.clearTimeout(id)
        // `user` muda de identidade a cada renovação do token: basta a pessoa.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pronto, queryClient, currentWorkspaceId, user?.id, papel])

    return null
}
