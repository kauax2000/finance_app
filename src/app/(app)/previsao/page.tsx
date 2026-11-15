import { AdiarMontagem } from "@/components/layout/adiar-montagem"
import { PrevisaoTela } from "@/components/previsao/previsao-tela"
import Loading from "./loading"

export default function Page() {
    return (
        <AdiarMontagem fallback={<Loading />}>
            <PrevisaoTela />
        </AdiarMontagem>
    )
}
