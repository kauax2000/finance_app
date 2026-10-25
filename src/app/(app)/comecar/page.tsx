import { AdiarMontagem } from "@/components/layout/adiar-montagem"
import { JornadaWireframe } from "@/components/wireframe/jornada-wireframe"
import { CriarACasaWireframe } from "@/components/wireframe/modelos-de-carteira-wireframe"
import Loading from "./loading"

export default function Page() {
    return (
        <AdiarMontagem fallback={<Loading />}>
            <div className="space-y-4">
                <CriarACasaWireframe />
                <JornadaWireframe />
            </div>
        </AdiarMontagem>
    )
}
