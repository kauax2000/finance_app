import { PageHeaderSkeleton } from "@/components/ui/page-header"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"

/**
 * O esqueleto na forma do detalhe: no telefone, o resumo do mês e as abas; do
 * `md` para cima, o cabeçalho e as duas colunas (análise · lançamentos).
 */
export function CategoryDetailSkeleton() {
    return (
        <SkeletonGroup label="Carregando a categoria…" className="flex min-w-0 flex-col gap-6">
            <PageHeaderSkeleton description={false} actions={3} className="max-md:hidden" />
            <div className="flex flex-col gap-3 md:px-9.5">
                <Skeleton shape="text" className="w-24 md:hidden" />
                <Skeleton className="h-9 w-40" />
                <Skeleton className="h-2 w-full rounded-full" />
                <Skeleton shape="text" className="w-56" />
                <Skeleton shape="pill" className="w-40 md:hidden" />
            </div>
            <div className="grid min-w-0 items-start gap-6 md:grid-cols-5 md:px-9.5">
                <div className="flex min-w-0 flex-col gap-6 md:col-span-3">
                    <Skeleton shape="control" className="w-full md:hidden" />
                    <div className="grid grid-cols-2 gap-3">
                        <Skeleton shape="surface" className="h-28" />
                        <Skeleton shape="surface" className="h-28" />
                    </div>
                    <Skeleton shape="surface" className="h-56" />
                    <Skeleton shape="surface" className="h-40" />
                </div>
                <Skeleton shape="surface" className="h-[60dvh] max-md:hidden md:col-span-2" />
            </div>
        </SkeletonGroup>
    )
}
