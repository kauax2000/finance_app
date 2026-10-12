import { Suspense } from "react"
import AcceptInvitePageClient from "./page-client"
import { InviteScene } from "@/components/auth/scenes/invite-scene"
import { AuthFormSkeleton, AuthShell } from "@/components/layout/auth-shell"

type RouteParams = Record<string, string | string[] | undefined>

export default async function Page(props: {
    params: Promise<RouteParams>
    searchParams: Promise<RouteParams>
}) {
    await Promise.all([props.params, props.searchParams])
    return (
        <Suspense
            fallback={
                <AuthShell title="Convite" scene={<InviteScene />}>
                    <div role="status" aria-live="polite" aria-busy="true">
                        <span className="sr-only">Carregando o convite…</span>
                        <AuthFormSkeleton fields={1} />
                    </div>
                </AuthShell>
            }
        >
            <AcceptInvitePageClient />
        </Suspense>
    )
}
