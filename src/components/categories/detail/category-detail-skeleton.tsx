import { PageHeaderSkeleton } from "@/components/ui/page-header"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"

/**
 * O esqueleto na forma do detalhe: o cabeçalho (só no desktop), a faixa do mês,
 * o bloco do que é feito o mês, o cartão dos últimos meses, o insight e a lista dos lançamentos.
 */
export function CategoryDetailSkeleton() {
    return (
        <SkeletonGroup label="Carregando a categoria…" className="flex min-w-0 flex-col gap-6">
            <PageHeaderSkeleton description={false} actions={3} className="max-md:hidden" />
            <div className="flex min-w-0 flex-col gap-6 md:px-9.5">
                <div className="flex flex-col gap-3">
                    <Skeleton shape="text" className="w-24 md:hidden" />
                    <Skeleton className="h-9 w-40" />
                    <Skeleton className="h-2 w-full rounded-full md:w-md" />
                    <Skeleton shape="text" className="w-56" />
                </div>
                <Skeleton shape="surface" className="h-80" />
                <Skeleton shape="surface" className="h-64" />
                <Skeleton shape="surface" className="h-20" />
                <div className="flex flex-col gap-3">
                    <Skeleton shape="control" className="w-full md:w-64" />
                    <Skeleton shape="surface" className="h-72" />
                </div>
            </div>
        </SkeletonGroup>
    )
}
