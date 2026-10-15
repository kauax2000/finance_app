import AccountSessionsPageClient from "./page-client"
import { AdiarMontagem } from "@/components/layout/adiar-montagem"
import Loading from "./loading"

type RouteParams = Record<string, string | string[] | undefined>

export default async function Page(props: {
    params: Promise<RouteParams>
    searchParams: Promise<RouteParams>
}) {
    await Promise.all([props.params, props.searchParams])
    return (
        <AdiarMontagem fallback={<Loading />}>
            <AccountSessionsPageClient />
        </AdiarMontagem>
    )
}
