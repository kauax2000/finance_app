import { Card } from "@/components/ui/card"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"

/** Uma linha do cartão da página Você: o ícone de 20, o nome e o chevron. */
function LinhaEsqueleto() {
    return (
        <div className="flex items-center gap-2.5 px-4 py-3 min-h-12">
            <Skeleton className="size-5 shrink-0 rounded" />
            <Skeleton shape="text" className="w-36 max-w-full text-base" />
            <Skeleton className="ml-auto size-4 shrink-0 rounded" />
        </div>
    )
}

/**
 * A espera da página Você, na forma dela: o avatar de 56 com o nome, o
 * e-mail e o selo de "Membro desde", e os três grupos, cada um com a barra do
 * título acima do cartão — a carteira (6: Previsão, Cartões, Contas a pagar,
 * Assinaturas, Projetos, Membros), Neste celular (3) e a conta (4).
 */
export function MePageSkeleton() {
    return (
        <SkeletonGroup className="min-w-0 max-w-full space-y-5" label="Carregando a página Você…" delay>
            <div className="flex flex-col items-center gap-3">
                <Skeleton shape="circle" size="xl" />
                <div className="flex w-full flex-col items-center">
                    <Skeleton className="h-6 w-40 max-w-full" />
                    <Skeleton shape="text" className="w-48 max-w-full text-sm" />
                </div>
                {/* O `SeloDeMembro`: o selo de 40 e "Membro desde …". */}
                <div className="flex items-center gap-2">
                    <Skeleton shape="circle" size="md" />
                    <Skeleton shape="text" className="w-44 text-sm" />
                </div>
            </div>
            {[6, 3, 4].map((linhas, grupo) => (
                <div key={grupo} className="space-y-3">
                    <Skeleton className="h-4 w-20" />
                    <Card padding="none" className="divide-y divide-border">
                        {Array.from({ length: linhas }, (_, i) => (
                            <LinhaEsqueleto key={i} />
                        ))}
                    </Card>
                </div>
            ))}
        </SkeletonGroup>
    )
}
