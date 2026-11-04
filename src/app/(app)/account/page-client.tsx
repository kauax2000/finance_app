"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { ROUTES } from "@/config/navigation"
import { useIsMobile } from "@/hooks/use-mobile"

/**
 * Minha conta saiu: o que ela tinha mora na Você (foto, selo, Editar perfil) e
 * no menu do usuário. O link antigo (favorito, notificação) cai na Você no
 * celular e no Painel no desktop, sem montar nada. O `AdiarMontagem` do
 * `page.tsx` monta isto depois da hidratação, então `isMobile` já é o real.
 */
export default function AccountPage() {
    const isMobile = useIsMobile()
    const router = useRouter()

    useEffect(() => {
        router.replace(isMobile ? ROUTES.ME : ROUTES.DASHBOARD)
    }, [isMobile, router])

    return null
}
