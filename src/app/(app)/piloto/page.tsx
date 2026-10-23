import { AdiarMontagem } from "@/components/layout/adiar-montagem"
import { PilotoAutomaticoWireframe } from "@/components/wireframe/piloto-automatico-wireframe"
import Loading from "./loading"

export default function Page() {
    return (
        <AdiarMontagem fallback={<Loading />}>
            <PilotoAutomaticoWireframe />
        </AdiarMontagem>
    )
}
