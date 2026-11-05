import { MembersSectionSkeleton } from "@/components/members/members-section-skeleton"
import { Card } from "@/components/ui/card"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"

/** O esqueleto de Membros: a página aparece inteira de uma vez, nada de esqueleto por seção. */
export default function Loading() {
    return (
        <div className="min-w-0 max-w-full space-y-5">
            <MembersSectionSkeleton />
            <SkeletonGroup className="min-w-0 space-y-2" label="Carregando os convites…" delay>
                <Skeleton className="h-3 w-40" />
                <Card padding="none">
                    <ul className="divide-y divide-border" role="list">
                        {[1, 2, 3].map((i) => (
                            <li key={i} className="flex items-center gap-3 px-4 py-3">
                                <Skeleton shape="circle" className="size-9 shrink-0" />
                                <div className="min-w-0 flex-1 space-y-2">
                                    <Skeleton className="h-4 w-48 max-w-full" />
                                    <Skeleton className="h-3 w-36 max-w-full" />
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>
            </SkeletonGroup>
        </div>
    )
}
