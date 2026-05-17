import CreditCardDetailPageClient from "./page-client"

type RouteParams = Record<string, string | string[] | undefined>

export default async function Page(props: { params: Promise<RouteParams> }) {
    await props.params
    return <CreditCardDetailPageClient />
}
