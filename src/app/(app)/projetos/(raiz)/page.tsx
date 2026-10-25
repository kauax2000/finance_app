import { AdiarMontagem } from "@/components/layout/adiar-montagem"
import { ProjetosWireframe } from "@/components/wireframe/projetos-wireframe"
import Loading from "./loading"

export default function Page() {
    return (
        <AdiarMontagem fallback={<Loading />}>
            <ProjetosWireframe />
        </AdiarMontagem>
    )
}
