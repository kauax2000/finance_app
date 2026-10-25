import { AdiarMontagem } from "@/components/layout/adiar-montagem"
import { ProjetoWireframe } from "@/components/wireframe/projetos-wireframe"
import Loading from "./loading"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return (
        <AdiarMontagem fallback={<Loading />}>
            <ProjetoWireframe id={id} />
        </AdiarMontagem>
    )
}
