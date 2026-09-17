"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

import { AppBootstrapScreen } from "@/components/layout/app-bootstrap-screen"
import { useAuth } from "@/components/providers"
import { ROUTES } from "@/config/navigation"
import { getSafeInternalNextPath } from "@/lib/auth-return-path"

/**
 * A guarda que faltava, na direção contrária à do `AuthGuard`.
 *
 * As rotas de `(auth)` não tinham guarda nenhuma: quem já estava dentro abria
 * `/login` e via o formulário de novo, em vez de ir para o Painel. Era a
 * lacuna 2 de `docs/JORNADAS.md`.
 *
 * **Duas rotas são isentas, e não é preferência — é o mecanismo.** A
 * recuperação de senha chama `verifyOtp({ type: "recovery" })`, que **cria
 * sessão**, e só depois `updateUser({ password })`. Uma guarda ingênua veria
 * essa sessão e jogaria a pessoa para o Painel no meio da redefinição, com a
 * senha antiga ainda valendo. `/invites/accept` é isenta pelo motivo oposto: um
 * convite é aceito por quem **já** entrou tanto quanto por quem acabou de
 * entrar.
 *
 * O `next` é lido de `window.location` e não de `useSearchParams` de
 * propósito: o hook obrigaria um `<Suspense>` em volta do layout inteiro, e
 * aqui não há nada para renderizar em espera. O efeito só roda no cliente,
 * onde `window` existe.
 */
const EXEMPT = ["/forgot-password", "/reset-password", "/invites/accept"]

export function AuthSignedInRedirect({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    const exempt = EXEMPT.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`),
    )
    const shouldLeave = !loading && Boolean(user) && !exempt

    useEffect(() => {
        if (!shouldLeave) return
        const raw = new URLSearchParams(window.location.search).get("next")
        router.replace(getSafeInternalNextPath(raw) ?? ROUTES.DASHBOARD)
    }, [shouldLeave, router])

    // Sem isto o formulário pinta por um quadro antes de o efeito rodar, e a
    // pessoa vê a tela de login piscar a caminho do Painel.
    if (shouldLeave) return <AppBootstrapScreen />

    return <>{children}</>
}
