import { PrevisaoSkeleton } from "@/components/previsao/previsao-skeleton"
import { PageHeaderSkeleton } from "@/components/ui/page-header"

/** O título "Previsão" (só no desktop, como a tela) e os blocos; o esqueleto de dentro da tela já tem o título real em cima. */
export default function Loading() {
    return (
        <div className="min-w-0 space-y-8">
            <PageHeaderSkeleton description={false} actions={0} className="max-md:hidden" />
            <PrevisaoSkeleton />
        </div>
    )
}
