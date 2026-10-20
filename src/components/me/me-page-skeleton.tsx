import { Card } from "@/components/ui/card"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"

/** Uma linha do cartão da página Você: o ícone de 20, o nome e o chevron. */
function LinhaEsqueleto() {
    return (
        <div className="flex items-center gap-2.5 px-4 py-3 pointer-coarse:min-h-11">
            <Skeleton className="size-5 shrink-0 rounded" />
            <Skeleton className="h-4 w-36 max-w-full" />
            <Skeleton className="ml-auto size-4 shrink-0 rounded" />
        </div>
    )
}

/**
 * A espera da página Você, na forma dela: o avatar de 56 com o nome e o
 * e-mail, e os dois cartões de linhas — a carteira (4, o telefone comum, sem
 * abas fora da barra) e a conta (2).
 */
export function MePageSkeleton() {
    return (
        <SkeletonGroup className="min-w-0 max-w-full space-y-5" label="Carregando a página Você…" delay>
            <div className="flex flex-col items-center gap-3">
                <Skeleton shape="circle" size="xl" />
                <div className="flex w-full flex-col items-center space-y-2">
                    <Skeleton className="h-6 w-40 max-w-full" />
                    <Skeleton className="h-4 w-48 max-w-full" />
                </div>
            </div>
            {[4, 2].map((linhas) => (
                <Card key={linhas} padding="none" className="divide-y divide-border">
                    {Array.from({ length: linhas }, (_, i) => (
                        <LinhaEsqueleto key={i} />
                    ))}
                </Card>
            ))}
        </SkeletonGroup>
    )
}
