import { Card } from "@/components/ui/card"
import { PageHeaderSkeleton } from "@/components/ui/page-header"
import { Separator } from "@/components/ui/separator"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"

/** O esqueleto das telas de notificações: o cabeçalho (só fora do telefone) e uma linha de chave por `linhas`. */
export function NotificacoesTelaSkeleton({ linhas }: { linhas: number }) {
    return (
        <SkeletonGroup className="min-w-0 max-w-full" label="Carregando as notificações…" delay>
            <div className="min-w-0 space-y-4">
                <PageHeaderSkeleton description={false} actions={0} className="max-md:hidden" />
                <Card padding="none">
                    {Array.from({ length: linhas }, (_, i) => (
                        <div key={i}>
                            {i > 0 ? <Separator /> : null}
                            <div className="flex items-center justify-between gap-4 px-4 py-3">
                                <Skeleton className="h-4 w-40 max-w-full" />
                                <Skeleton className="h-5 w-9 shrink-0 rounded-full" />
                            </div>
                        </div>
                    ))}
                </Card>
            </div>
        </SkeletonGroup>
    )
}
