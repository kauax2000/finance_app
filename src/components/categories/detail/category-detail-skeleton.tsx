import { PageHeaderSkeleton } from "@/components/ui/page-header"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"

/**
 * O esqueleto na forma do detalhe: o cabeçalho (só no desktop), o resumo do mês
 * e as abas Resumo · Lançamentos, igual nos dois tamanhos; embaixo, a aba Resumo
 * (a frase, os gráficos em duas linhas e os cartões do gasto).
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
                <Skeleton shape="control" className="w-full md:w-64" />
                <Skeleton shape="surface" className="h-44" />
                <div className="grid gap-3 md:grid-cols-[3fr_2fr]">
                    <Skeleton shape="surface" className="h-64" />
                    <Skeleton shape="surface" className="h-64 max-md:hidden" />
                </div>
                <div className="grid gap-3 max-md:hidden md:grid-cols-3">
                    <Skeleton shape="surface" className="h-52" />
                    <Skeleton shape="surface" className="h-52" />
                    <Skeleton shape="surface" className="h-52" />
                </div>
            </div>
        </SkeletonGroup>
    )
}
