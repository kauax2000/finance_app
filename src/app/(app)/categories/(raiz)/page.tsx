import { Suspense } from "react"
import CategoriesPageClient from "../page-client"
import { CategoriesPageGridSkeleton } from "@/components/categories/categories-page-grid-skeleton"
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
            <Suspense
                fallback={
                    <CategoriesPageGridSkeleton screenReaderLabel="Carregando categorias" />
                }
            >
                <CategoriesPageClient />
            </Suspense>
        </AdiarMontagem>
    )
}
