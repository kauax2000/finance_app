import AccountPageClient from "../page-client"
import { AdiarMontagem } from "@/components/layout/adiar-montagem"

type RouteParams = Record<string, string | string[] | undefined>

export default async function Page(props: {
    params: Promise<RouteParams>
    searchParams: Promise<RouteParams>
}) {
    await Promise.all([props.params, props.searchParams])
    // Sem esqueleto: a fronteira é a vazia de `(app)/loading.tsx`, e o
    // redirecionamento roda depois da hidratação.
    return (
        <AdiarMontagem fallback={null}>
            <AccountPageClient />
        </AdiarMontagem>
    )
}
