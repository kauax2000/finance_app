"use client"

import {
    Card,
    CardContent,
    CardNote,
    CardToolbar,
} from "@/components/ui/card"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { TimelineSkeleton } from "@/components/ui/timeline"

/**
 * O esqueleto da tela de atividade. Ele morava dentro do `page-client`, e um
 * componente declarado em `src/app/` é invisível para qualquer outra tela.
 */
export function ActivityPageSkeleton() {
    return (
        <SkeletonGroup className="min-w-0 max-w-full space-y-5" label="Carregando a atividade da conta…" delay>
            <div className="min-w-0 space-y-4">
                <div className="flex h-6 min-w-0 items-center">
                    <Skeleton className="h-4 w-36" />
                </div>
                <Card padding="none">
                    <CardContent className="flex flex-col">
                        <CardToolbar className="justify-end">
                            <Skeleton className="h-3 w-28 shrink-0" />
                        </CardToolbar>
                        <CardToolbar>
                            <div className="flex flex-wrap gap-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <Skeleton key={i} className="h-8 w-24 shrink-0 rounded-full" />
                                ))}
                            </div>
                        </CardToolbar>
                        <TimelineSkeleton marker="icon" count={5} group={false} className="px-4 py-3" />
                        <CardNote>
                            <Skeleton className="mt-0.5 size-3.5 shrink-0 rounded" />
                            <Skeleton className="h-3 w-full max-w-md" />
                        </CardNote>
                    </CardContent>
                </Card>
            </div>
        </SkeletonGroup>
    )
}
