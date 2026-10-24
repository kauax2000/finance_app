import { AdiarMontagem } from "@/components/layout/adiar-montagem"
import { PrevisaoWireframe } from "@/components/wireframe/linha-do-tempo-wireframe"
import Loading from "./loading"

export default function Page() {
    return (
        <AdiarMontagem fallback={<Loading />}>
            <PrevisaoWireframe />
        </AdiarMontagem>
    )
}
