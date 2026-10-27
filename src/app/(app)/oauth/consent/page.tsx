import { AdiarMontagem } from "@/components/layout/adiar-montagem"
import { McpConsentimentoWireframe } from "@/components/wireframe/mcp-consentimento-wireframe"
import Loading from "./loading"

export default async function Page(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const { authorization_id } = await props.searchParams
    const id = typeof authorization_id === "string" && authorization_id ? authorization_id : null
    return (
        <AdiarMontagem fallback={<Loading />}>
            <McpConsentimentoWireframe authorizationId={id} />
        </AdiarMontagem>
    )
}
