import { AdiarMontagem } from "@/components/layout/adiar-montagem"
import { JornadaWireframe } from "@/components/wireframe/jornada-wireframe"
import Loading from "./loading"

export default function Page() {
    return (
        <AdiarMontagem fallback={<Loading />}>
            <JornadaWireframe />
        </AdiarMontagem>
    )
}
