"use client"

import { Suspense, useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AppBootstrapScreen } from "@/components/layout/app-bootstrap-screen"
import { useAuth } from "@/components/providers"
import { ROUTES } from "@/config/navigation"
import { takeAuthSignOutReason } from "@/lib/auth-signout-reason"

type AuthGuardProps = {
    children: React.ReactNode
}

/**
 * A exceção de `/invites/accept` saiu daqui.
 *
 * Ela existia porque a rota morava no grupo `(app)` e precisava ser pública —
 * o resultado é que quem não tinha entrado via a lateral e o topo do app
 * inteiros em volta de um convite que ainda não podia aceitar (lacuna 5 de
 * `docs/JORNADAS.md`). A rota passou para `(auth)`, onde não há casca de app
 * para atravessar, e a exceção virou código morto. Isso não custou nada porque
 * o `WorkspaceProvider` é global (`src/app/layout.tsx`) e não depende do grupo.
 */

function AuthGuardInner({ children }: AuthGuardProps) {
    const { user, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        if (loading || user) return
        const query = searchParams.toString()
        const next = query ? `${pathname}?${query}` : pathname
        const params = new URLSearchParams({ next })
        // Só existe quando a saída não foi a pessoa que pediu — hoje, sessão
        // revogada em outro aparelho. `take` limpa ao ler.
        const reason = takeAuthSignOutReason()
        if (reason) params.set("reason", reason)
        // `replace`: com `push` o "voltar" do login devolvia à rota protegida,
        // que mandava de novo para o login.
        router.replace(`${ROUTES.LOGIN}?${params.toString()}`)
    }, [user, loading, router, pathname, searchParams])

    if (loading) {
        return <AppBootstrapScreen />
    }

    if (!user) {
        return <AppBootstrapScreen />
    }

    return <>{children}</>
}

export function AuthGuard({ children }: AuthGuardProps) {
    return (
        <Suspense fallback={null}>
            <AuthGuardInner>{children}</AuthGuardInner>
        </Suspense>
    )
}
