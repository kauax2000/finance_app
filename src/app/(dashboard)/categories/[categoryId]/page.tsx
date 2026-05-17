import CategoryDetailPageClient from "./page-client"

type RouteParams = Record<string, string | string[] | undefined>

export default async function Page(props: {
    params: Promise<RouteParams>
    searchParams: Promise<RouteParams>
}) {
    const [params] = await Promise.all([props.params, props.searchParams])
    const categoryId = String(params.categoryId ?? "")
    return <CategoryDetailPageClient categoryId={categoryId} />
}

