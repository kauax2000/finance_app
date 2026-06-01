import { Suspense } from "react"
import CategoryDetailPageClient from "./page-client"
import { CategoryDetailSkeleton } from "@/components/categories/detail/category-detail-skeleton"

type RouteParams = Record<string, string | string[] | undefined>

export default async function Page(props: {
    params: Promise<RouteParams>
    searchParams: Promise<RouteParams>
}) {
    const [params] = await Promise.all([props.params, props.searchParams])
    const categoryId = String(params.categoryId ?? "")
    return (
        <Suspense fallback={<CategoryDetailSkeleton />}>
            <CategoryDetailPageClient categoryId={categoryId} />
        </Suspense>
    )
}
