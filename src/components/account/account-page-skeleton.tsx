import { Card } from "@/components/ui/card"
import { PageHeaderSkeleton } from "@/components/ui/page-header"
import { SealSkeleton } from "@/components/ui/seal"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"

/** Uma seção na forma final: o título, a ação opcional e as linhas do cartão. */
function SecaoSkeleton({ linhas, acao = false }: { linhas: number; acao?: boolean }) {
    return (
        <div className="min-w-0 space-y-4">
            <div className="flex h-6 min-w-0 items-center justify-between gap-3">
                <Skeleton className="h-4 w-32 max-w-full" />
                {acao ? <Skeleton className="h-6 w-24 shrink-0 rounded-full" /> : null}
            </div>
            <Card padding="none">
                <div className="flex flex-col divide-y divide-border">
                    {Array.from({ length: linhas }, (_, i) => (
                        <div key={i} className="flex min-h-11 items-center justify-between gap-3 px-4">
                            <Skeleton className="h-4 w-32 max-w-full" />
                            <Skeleton className="h-3 w-20 shrink-0" />
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    )
}

/** Espera de Minha conta: a coluna da tela, sem o título grande no telefone. */
export function AccountPageSkeleton() {
    return (
        <SkeletonGroup className="min-w-0 max-w-full" label="Carregando informações da conta…" delay>
            <div className="min-w-0 space-y-8">
                <PageHeaderSkeleton description={false} actions={0} className="max-md:hidden" />
                <div className="min-w-0 space-y-5">
                    <div className="flex min-w-0 items-center gap-3">
                        <Skeleton shape="circle" size="lg" />
                        <div className="min-w-0 flex-1 space-y-2">
                            <Skeleton className="h-4 w-36 max-w-full" />
                            <Skeleton className="h-3 w-48 max-w-full" />
                        </div>
                        <SealSkeleton />
                    </div>
                    <SecaoSkeleton linhas={2} />
                    <SecaoSkeleton linhas={1} />
                </div>
                <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-9 w-14 rounded-full pointer-coarse:h-11" />
                    <Skeleton className="h-9 w-28 rounded-full pointer-coarse:h-11" />
                </div>
            </div>
        </SkeletonGroup>
    )
}
