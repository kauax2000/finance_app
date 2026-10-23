import { AdiarMontagem } from "@/components/layout/adiar-montagem"
import { CofreAbertoWireframe } from "@/components/wireframe/cofre-aberto-wireframe"
import Loading from "./loading"

export default function Page() {
    return (
        <AdiarMontagem fallback={<Loading />}>
            <CofreAbertoWireframe />
        </AdiarMontagem>
    )
}
