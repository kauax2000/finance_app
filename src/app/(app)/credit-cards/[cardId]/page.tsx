import CreditCardDetailPageClient from "./page-client"
import { AdiarMontagem } from "@/components/layout/adiar-montagem"
import Loading from "./loading"

export default function Page() {
    return (
        <AdiarMontagem fallback={<Loading />}>
            <CreditCardDetailPageClient />
        </AdiarMontagem>
    )
}
