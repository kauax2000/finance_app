import { Suspense } from "react"
import BillsPageClient from "./page-client"
import { BillsPageSkeleton } from "@/components/bills/bills-page-skeleton"

type RouteParams = Record<string, string | string[] | undefined>

export default async function Page(props: {
    params: Promise<RouteParams>
    searchParams: Promise<RouteParams>
}) {
    await Promise.all([props.params, props.searchParams])
    return (
        <Suspense fallback={<BillsPageSkeleton />}>
            <BillsPageClient />
        </Suspense>
    )
}

