"use client"

import { useEffect, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useWorkspace } from "@/components/workspace-provider"
import { decidirRotaDoConvidado } from "@/lib/papeis/rotas-do-convidado"

/**
 * O convidado (Bloco 7A) numa tela fora da lista dele vai ao Painel. Só depois
 * de o papel chegar: com ele a caminho, a tela segue como está, sem redirecionar
 * nem esconder. Fora da lista, a tela não chega a ser desenhada.
 */
export function ConvidadoRouteGuard({ children }: { children: ReactNode }) {
    const { papel } = useWorkspace()
    const pathname = usePathname()
    const router = useRouter()
    const decisao = decidirRotaDoConvidado(papel, pathname)
    const destino = decisao === "esperar" || decisao === "ok" ? null : decisao

    useEffect(() => {
        if (destino) router.replace(destino)
    }, [destino, router])

    return destino ? null : children
}
