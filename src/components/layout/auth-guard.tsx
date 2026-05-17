"use client"

import { Suspense, useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AppBootstrapScreen } from "@/components/layout/app-bootstrap-screen"
import { useAuth } from "@/components/providers"
import { ROUTES } from "@/config/navigation"

type AuthGuardProps = {
    children: React.ReactNode
}

function AuthGuardInner({ children }: AuthGuardProps) {
    const { user, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const inviteAcceptPublic =
        pathname === "/invites/accept" || pathname.startsWith("/invites/accept/")

    useEffect(() => {
        if (loading || user || inviteAcceptPublic) return
        const query = searchParams.toString()
        const next = query ? `${pathname}?${query}` : pathname
        router.push(`${ROUTES.LOGIN}?next=${encodeURIComponent(next)}`)
    }, [user, loading, router, pathname, searchParams, inviteAcceptPublic])

    if (loading) {
        return <>{children}</>
    }

    if (!user) {
        if (inviteAcceptPublic) {
            return <>{children}</>
        }
        return <AppBootstrapScreen message="Redirecionando…" />
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
