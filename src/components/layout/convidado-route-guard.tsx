"use client"

import { useEffect, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useWorkspace } from "@/components/workspace-provider"
import { ROUTES } from "@/config/navigation"
import { rotaPermitidaAoConvidado } from "@/lib/papeis/rotas-do-convidado"

/**
 * O convidado (Bloco 7A) numa tela fora da lista dele vai ao Painel. Só depois
 * de o papel chegar: com ele a caminho, a tela segue como está, sem redirecionar
 * nem esconder. Fora da lista, a tela não chega a ser desenhada.
 */
export function ConvidadoRouteGuard({ children }: { children: ReactNode }) {
    const { papel } = useWorkspace()
    const pathname = usePathname()
    const router = useRouter()
    const fora = papel === "guest" && !rotaPermitidaAoConvidado(pathname)

    useEffect(() => {
        if (fora) router.replace(ROUTES.DASHBOARD)
    }, [fora, router])

    return fora ? null : children
}
