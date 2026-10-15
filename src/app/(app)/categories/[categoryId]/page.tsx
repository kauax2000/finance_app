import { Suspense } from "react"
import CategoryDetailPageClient from "./page-client"
import { CategoryDetailSkeleton } from "@/components/categories/detail/category-detail-skeleton"
import { AdiarMontagem } from "@/components/layout/adiar-montagem"
import Loading from "./loading"

type RouteParams = Record<string, string | string[] | undefined>

export default async function Page(props: {
    params: Promise<RouteParams>
    searchParams: Promise<RouteParams>
}) {
    const [params] = await Promise.all([props.params, props.searchParams])
    const categoryId = String(params.categoryId ?? "")
    return (
        <AdiarMontagem fallback={<Loading />}>
            <Suspense fallback={<CategoryDetailSkeleton />}>
                <CategoryDetailPageClient categoryId={categoryId} />
            </Suspense>
        </AdiarMontagem>
    )
}
